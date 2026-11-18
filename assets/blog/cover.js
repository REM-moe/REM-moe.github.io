// Post header: the cover photo redrawn in the post's colour, with a soft ripple under the cursor.
// Same shader as the Salvia footer, except the colour ramp is built from the post's `color`.
const FRAG = `precision highp float;
varying vec2 v;
uniform sampler2D img;
uniform vec2 res, scale, off, mouse;
uniform vec3 tint;
uniform float time, top, speed, ribs;
float hash(vec2 p){ return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453); }
vec3 ramp(float t){
  t=clamp(t,0.,1.)*4.;
  vec3 w=vec3(1.), a=tint*.81, b=tint, c=mix(tint,w,.22), d=mix(tint,w,.5), e=mix(tint,w,.9);
  if(t<1.) return mix(a,b,t); if(t<2.) return mix(b,c,t-1.); if(t<3.) return mix(c,d,t-2.); return mix(d,e,t-3.);
}
void main(){
  float asp=res.x/res.y;
  vec2 d=(v-mouse)*vec2(asp,1.);
  float r=length(d);
  float near=exp(-r*r/.075);
  vec2 q=v;
  q-=d/vec2(asp,1.)*near*.022;
  q.x+=sin(v.x*res.x*.075)*.0016*near*ribs;
  q+=normalize(d+1e-4)/vec2(asp,1.)*sin(r*34.-time*7.)*exp(-r*5.5)*.004*speed;
  vec2 u=vec2(q.x,clamp((q.y-top)/(1.-top),0.,1.));
  vec3 t=texture2D(img,u*scale+off).rgb;
  vec3 col=ramp(dot(t,vec3(.3,.59,.11))*1.04);
  col+=mix(tint,vec3(1.),.6)*exp(-r*r/.05)*.34;
  col+=vec3(1.)*exp(-r*r/.006)*.1;
  col+=(hash(gl_FragCoord.xy+floor(time*14.))-.5)*.085;
  float f=smoothstep(0.,.52,(v.y-top)/(1.-top));
  gl_FragColor=vec4(clamp(col,0.,1.)*f,f);
}`;
const VERT = 'attribute vec2 a;varying vec2 v;void main(){v=vec2(a.x*.5+.5,.5-a.y*.5);gl_Position=vec4(a,0.,1.);}';
const TOP = .06;   // how far down the card the photo starts fading in

const card = document.querySelector('.cover[data-img]');
if (card) { const img = new Image(); img.onload = () => start(card, card.querySelector('canvas'), img); img.src = card.dataset.img; }

function start(card, cv, img) {
  const gl = cv.getContext('webgl', {alpha: true, premultipliedAlpha: true});
  if (!gl) return;   // no WebGL: the card keeps its plain colour wash
  const sh = (t, c) => { const x = gl.createShader(t); gl.shaderSource(x, c); gl.compileShader(x); return x; };
  const pr = gl.createProgram();
  gl.attachShader(pr, sh(gl.VERTEX_SHADER, VERT)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(pr); gl.useProgram(pr);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const A = gl.getAttribLocation(pr, 'a'); gl.enableVertexAttribArray(A); gl.vertexAttribPointer(A, 2, gl.FLOAT, false, 0, 0);
  gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
  for (const [k, v] of [[gl.TEXTURE_MIN_FILTER, gl.LINEAR], [gl.TEXTURE_MAG_FILTER, gl.LINEAR], [gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE]]) gl.texParameteri(gl.TEXTURE_2D, k, v);
  const U = n => gl.getUniformLocation(pr, n);
  const hex = /^#?([0-9a-f]{6})$/i.exec(card.dataset.color || '') ? card.dataset.color.replace('#', '') : '1b44c0';
  gl.uniform3f(U('tint'), ...[0, 2, 4].map(i => parseInt(hex.slice(i, i + 2), 16) / 255));
  gl.uniform1f(U('top'), TOP);
  const fy = Math.min(1, Math.max(0, parseFloat(card.dataset.fy))) || .5;

  const size = () => {
    const d = Math.min(2, devicePixelRatio || 1), W = card.clientWidth, H = card.clientHeight;
    cv.width = W * d; cv.height = H * d; gl.viewport(0, 0, cv.width, cv.height);
    const ra = W / (H * (1 - TOP)), ia = img.width / img.height, sx = ra > ia ? 1 : ra / ia, sy = ra > ia ? ia / ra : 1;
    gl.uniform2f(U('res'), cv.width, cv.height); gl.uniform2f(U('scale'), sx, sy); gl.uniform2f(U('off'), (1 - sx) * .5, (1 - sy) * fy);
  };
  size();

  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let mx = .62, my = .72, tx = mx, ty = my, sp = 0, ri = 0, rt = 0, inn = false, on = false, raf = 0;
  const t0 = performance.now();
  const f = () => {
    const t = still ? 0 : (performance.now() - t0) / 1000;
    if (!inn) { tx = .5 + Math.sin(t * .21) * .32; ty = .74 + Math.cos(t * .17) * .14; }
    const px = mx, py = my; mx += (tx - mx) * .09; my += (ty - my) * .09;
    sp += (Math.min(1, Math.hypot(mx - px, my - py) * 26) - sp) * .06; ri += (rt - ri) * .07;
    gl.uniform2f(U('mouse'), mx, my); gl.uniform1f(U('time'), t); gl.uniform1f(U('speed'), sp); gl.uniform1f(U('ribs'), ri);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    if (on && !still) raf = requestAnimationFrame(f);
  };
  addEventListener('resize', () => { size(); if (still) f(); });
  if (still) return f();
  card.addEventListener('pointermove', e => { const r = card.getBoundingClientRect(); tx = (e.clientX - r.left) / r.width; ty = (e.clientY - r.top) / r.height; inn = true; rt = 1; });
  card.addEventListener('pointerleave', () => { inn = false; rt = 0; });
  new IntersectionObserver(([e]) => { on = e.isIntersecting; cancelAnimationFrame(raf); if (on) f(); }).observe(card);
}
