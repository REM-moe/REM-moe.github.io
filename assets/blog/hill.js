// The landing-page hill: a shader grass carpet, a sprinkle of real plant models, and a lantern.
// Lantern: Poly Haven "Lantern 01" (CC0). Plants: trimmed from the grass pack in assets/blog/grass.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
const mouse = {x:0, y:0};
addEventListener('pointermove', e => { mouse.x = e.clientX / innerWidth - .5; mouse.y = e.clientY / innerHeight - .5; });

function fit(renderer, camera, canvas){
  const w = canvas.clientWidth, h = canvas.clientHeight;
  if (!w || !h) return;
  const s = renderer.getSize(new THREE.Vector2());
  if (s.x !== w || s.y !== h){ renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); }
}

function hill(){
  const canvas = document.getElementById('hill');
  const BG = new THREE.Color('#e7e7e4');
  const renderer = new THREE.WebGLRenderer({canvas, antialias:true});
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  let onscreen = true;   // don't render while the hero is scrolled away or the tab is hidden
  new IntersectionObserver(e => { onscreen = e[0].isIntersecting; }).observe(canvas);
  const scene = new THREE.Scene();
  scene.background = BG; scene.fog = new THREE.Fog(BG, 11, 34);
  const camera = new THREE.PerspectiveCamera(36, 1, .1, 90);
  const CAM = new THREE.Vector3(-2.2, 1.9, 11.5);

  // seeded random + value noise so the hill is the same on every load
  let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const R = (a, b) => a + rnd() * (b - a);
  const hash = (x, z) => { const v = Math.sin(x * 127.1 + z * 311.7) * 43758.5453; return v - Math.floor(v); };
  const vnoise = (x, z) => { const xi = Math.floor(x), zi = Math.floor(z), u = x - xi, v = z - zi, su = u * u * (3 - 2 * u), sv = v * v * (3 - 2 * v);
    return (hash(xi, zi) * (1 - su) + hash(xi + 1, zi) * su) * (1 - sv) + (hash(xi, zi + 1) * (1 - su) + hash(xi + 1, zi + 1) * su) * sv; };
  const H = (x, z) => 4.6 * Math.exp(-((x - 2.2) ** 2 / 40 + (z + 2) ** 2 / 20))
                    + 1.5 * Math.exp(-((x + 10) ** 2 / 46 + (z + 7) ** 2 / 60))
                    + .9 * Math.exp(-((x - 13) ** 2 / 30 + (z + 5) ** 2 / 40))
                    + .7 * (vnoise(x * .22 + 3, z * .22) - .5) + .22 * (vnoise(x * .8, z * .8 + 9) - .5) - .35;

  const gg = new THREE.PlaneGeometry(80, 60, 160, 120); gg.rotateX(-Math.PI / 2);
  const gp = gg.attributes.position;
  for (let i = 0; i < gp.count; i++) gp.setY(i, H(gp.getX(i), gp.getZ(i)) - .03);
  gg.computeVertexNormals();
  scene.add(new THREE.Mesh(gg, new THREE.MeshStandardMaterial({color:'#33441a', roughness:1})));

  const top = new THREE.Vector3(2.2, H(2.2, -2), -2);

  // light from several directions: warm sun rim from behind-left, sky fill from the front,
  // the lantern itself, a golden pool low on the left and a cool pool on the right
  scene.add(new THREE.HemisphereLight('#f4f6ff', '#3a4a22', 1.0));
  const sun = new THREE.DirectionalLight('#ffe9c2', 2.8); sun.position.set(-7, 6, -5); scene.add(sun);
  const fill = new THREE.DirectionalLight('#ffffff', .6); fill.position.set(3, 5, 9); scene.add(fill);
  const pools = [  // [position, colour, three intensity, reach, shader strength, shader radius²]
    [new THREE.Vector3(top.x, top.y + 1.1, top.z + .5), '#ffae5c', 90, 13, .6, 4.5],
    [new THREE.Vector3(-8, H(-8, 3) + 2.4, 3), '#ffcf7a', 140, 17, .42, 26],
    [new THREE.Vector3(10, H(10, 4) + 2.6, 4), '#bfe2ff', 120, 17, .3, 26],
    [new THREE.Vector3(1, H(1, 8) + 1.6, 8.5), '#fff0d0', 50, 9, .2, 9],
  ];
  const lamps = pools.map(([pos, col, I, reach]) => { const l = new THREE.PointLight(col, I, reach, 2); l.position.copy(pos); scene.add(l); return l; });
  const lamp = lamps[0];
  const envTex = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), .04).texture;

  // lantern (Poly Haven, CC0)
  const g = new THREE.Group(); g.position.copy(top); g.rotation.y = -.35; scene.add(g);
  const cv = document.createElement('canvas'); cv.width = cv.height = 256;
  const cx = cv.getContext('2d'), gr = cx.createRadialGradient(128,128,0,128,128,128);
  gr.addColorStop(0,'rgba(255,214,160,.9)'); gr.addColorStop(.35,'rgba(255,170,90,.28)'); gr.addColorStop(1,'rgba(255,150,60,0)');
  cx.fillStyle = gr; cx.fillRect(0,0,256,256);
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(cv), blending:THREE.AdditiveBlending, depthWrite:false, fog:false}));
  glow.scale.set(7, 7, 1); glow.position.set(0, 1.05, -.5); g.add(glow);
  const loader = new GLTFLoader();
  loader.load(new URL('./lantern/Lantern_01_1k.gltf', import.meta.url).href, gltf => {
    const L = gltf.scene; L.scale.setScalar(8.5); L.position.y = .2; L.rotation.z = -.05;
    L.traverse(o => { if (!o.isMesh) return; o.material.fog = false;
      if (/glass/i.test(o.material.name)) o.material = new THREE.MeshBasicMaterial({color:'#ffe9c4', fog:false});
      else { o.material.envMap = envTex; o.material.envMapIntensity = .9; } });
    g.add(L);
  });

  const uTime = {value: 0};
  const visible = (x, z) => Math.abs(x - CAM.x) < (CAM.z - z) * .66 + 3.5;

  // base carpet: 70k shader-drawn blades (cheap: ~210k triangles, one draw call)
  const lite = innerWidth < 820 || (navigator.hardwareConcurrency || 8) <= 4;
  const N = lite ? 28000 : 60000, bw = lite ? .05 : .037;
  const blade = new THREE.InstancedBufferGeometry();
  blade.setAttribute('position', new THREE.Float32BufferAttribute([-bw,0,0, bw,0,0, -bw*.6,.5,0, bw*.6,.5,0, 0,1,0], 3));
  blade.setIndex([0,1,2, 1,3,2, 2,3,4]);
  const off = new Float32Array(N * 3), rn = new Float32Array(N * 4);
  for (let i = 0, n = 0; i < N && n < N * 6; n++){
    const x = R(-22, 22), z = R(-16, 9.6); if (!visible(x, z)) continue;
    off.set([x, H(x, z), z], i * 3);
    rn.set([R(.4, 1.05) * (.75 + .6 * vnoise(x * .5 + 7, z * .5)), R(0, 6.283), rnd(), R(0, 6.283)], i * 4); i++;
  }
  blade.setAttribute('aOff', new THREE.InstancedBufferAttribute(off, 3));
  blade.setAttribute('aRnd', new THREE.InstancedBufferAttribute(rn, 4));
  blade.instanceCount = N;
  const gmat = new THREE.ShaderMaterial({
    side: THREE.DoubleSide,
    uniforms: {uTime, uFog:{value:BG}, uLp:{value:pools.map(p => p[0])}, uLc:{value:pools.map(p => new THREE.Color(p[1]))}, uLs:{value:pools.map(p => new THREE.Vector2(p[4], p[5]))}},
    vertexShader: `
      attribute vec3 aOff; attribute vec4 aRnd; uniform float uTime;
      varying float vY; varying float vHue; varying float vFog; varying vec3 vW;
      void main(){
        float c = cos(aRnd.y), s = sin(aRnd.y);
        vec3 p = vec3(c * position.x, position.y * aRnd.x, s * position.x);
        float bend = position.y * position.y;
        vec3 wp = p + aOff;
        float wind = sin(uTime * 1.4 + wp.x * .6 + wp.z * .45) * .6 + sin(uTime * .7 + wp.x * .17 + wp.z * 1.3) * .4;
        wp.x += (wind * .2 + sin(aRnd.w) * .12) * bend * aRnd.x; wp.z += (wind * .07 + cos(aRnd.w) * .12) * bend * aRnd.x;
        vec4 mv = viewMatrix * vec4(wp, 1.);
        gl_Position = projectionMatrix * mv;
        vY = position.y; vHue = aRnd.z; vW = wp; vFog = smoothstep(11., 34., -mv.z);
      }`,
    fragmentShader: `
      uniform vec3 uFog; uniform vec3 uLp[4]; uniform vec3 uLc[4]; uniform vec2 uLs[4];
      varying float vY; varying float vHue; varying float vFog; varying vec3 vW;
      void main(){
        vec3 tip = mix(vec3(.17,.31,.07), vec3(.47,.58,.17), vHue);
        tip = mix(tip, vec3(.62,.58,.26), step(.93, vHue));            // the odd dry blade
        vec3 col = mix(vec3(.03,.06,.02), tip, vY * (.35 + .65 * vY));
        for (int i = 0; i < 4; i++){ vec3 d = vW - uLp[i]; d.y *= .5;
          col += uLc[i] * uLs[i].x * exp(-dot(d, d) / uLs[i].y) * (.25 + vY); }
        gl_FragColor = vec4(mix(col, uFog, vFog), 1.);
      }`
  });
  const carpet = new THREE.Mesh(blade, gmat); carpet.frustumCulled = false; scene.add(carpet);

  // on top of the carpet: a sprinkle of real plant models (assets/grass/meadow.glb), properly lit
  const windy = m => { if (m.userData.windy) return m; m.userData.windy = true; m.side = THREE.DoubleSide;
    m.onBeforeCompile = sh => { sh.uniforms.uTime = uTime;
      sh.vertexShader = 'uniform float uTime;\n' + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
        #ifdef USE_INSTANCING
          vec3 ip = instanceMatrix[3].xyz;
          float hh = max(transformed.y, 0.);
          float wv = sin(uTime * 1.4 + ip.x * .6 + ip.z * .45) * .6 + sin(uTime * .7 + ip.x * .17 + ip.z * 1.3) * .4;
          vec3 wd = normalize(vec3(1., 0., .35) * mat3(instanceMatrix));
          transformed += wd * wv * hh * .22;
        #endif`); };
    return m; };
  const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), E = new THREE.Euler(), P = new THREE.Vector3(), S = new THREE.Vector3(), C = new THREE.Color();
  loader.load(new URL('./grass/meadow.glb', import.meta.url).href, gltf => {
    const parts = {}; gltf.scene.children.forEach(n => { parts[n.name] = []; n.traverse(o => { if (o.isMesh) parts[n.name].push(o); }); });
    // spot: [x, z, xzScale, yScale, colour, rotation]
    const place = (name, spots, tintPrim = -1, fix = {}) => parts[name].forEach((mesh, pi) => {
      let mat = mesh.material;
      if (fix[pi]) { mat = mat.clone(); mat.color.set(fix[pi]); }
      const im = new THREE.InstancedMesh(mesh.geometry, windy(mat), spots.length);
      spots.forEach((s, i) => {
        P.set(s[0], H(s[0], s[1]) - .04, s[1]); E.set(0, s[5], 0); S.set(s[2], s[3], s[2]);
        im.setMatrixAt(i, M.compose(P, Q.setFromEuler(E), S));
        im.setColorAt(i, pi === tintPrim || tintPrim === -2 ? s[4] : C.set('#fff'));
      });
      im.frustumCulled = false; scene.add(im);
    });
    const kinds = [['grass_clump_03', .3, 4, 1.5], ['grass_02', .38, 3.6, 1.8], ['grass_duo_02', .2, 4.4, 1.6], ['grass_wild_clump_dry_01', .12, 2.1, .95]];
    const lists = Object.fromEntries(kinds.map(k => [k[0], []]));
    const step = lite ? 3.4 : 2.3;
    for (let x = -22; x < 22; x += step) for (let z = -16; z < 9.6; z += step){
      const px = x + R(-.7, .7), pz = z + R(-.7, .7), far = CAM.z - pz;
      if (!visible(px, pz) || rnd() > (far < 12 ? 1 : .55) || Math.hypot(px - top.x, pz - top.z) < .5) continue;
      let r = rnd(), k = kinds[0]; for (const c of kinds){ if ((r -= c[1]) <= 0){ k = c; break; } }
      const s = k[2] * R(.8, 1.3), patch = vnoise(px * .35 + 20, pz * .35);
      const col = new THREE.Color().setHSL(R(.2, .27) - patch * .05, R(.45, .7), R(.42, .6)).multiplyScalar(1.6);  // multiplies the leaf texture
      lists[k[0]].push([px, pz, s, s * k[3] * R(.85, 1.2), col, R(0, 6.283)]);
    }
    for (const k of kinds) place(k[0], lists[k[0]], -2);
    const some = (n, zmin, zmax, sc, ys, cols) => { const out = []; let guard = 0;
      while (out.length < n && guard++ < n * 20){ const x = R(-16, 18), z = R(zmin, zmax); if (!visible(x, z)) continue;
        const s = sc * R(.8, 1.25); out.push([x, z, s, s * ys * R(.9, 1.2), new THREE.Color(cols[Math.floor(rnd() * cols.length)]), R(0, 6.283)]); }
      return out; };
    place('daisies', some(lite ? 22 : 58, -9, 9, 3.6, 3.4, ['#ffffff', '#ffffff', '#ffd23e', '#ff8a2e', '#ff5a3c', '#ffb3c8']), 0, {1: '#4c7a2a', 2: '#ffc93a'});
    place('clovers_03', some(lite ? 9 : 22, -8, 9, 3.6, 2.6, ['#fff']), -1, {1: '#4c7a2a', 2: '#e58aa6'});
  });

  const clock = new THREE.Clock();
  (function loop(){
    requestAnimationFrame(loop);
    if (!onscreen || document.hidden) return;
    fit(renderer, camera, canvas);
    const t = still ? 0 : clock.getElapsedTime();
    uTime.value = t;
    glow.material.opacity = .85 + Math.sin(t * 2.1) * .08;
    lamp.intensity = 90 + Math.sin(t * 2.1) * 8;
    lamps[1].intensity = 140 + Math.sin(t * .5) * 30; lamps[2].intensity = 120 + Math.cos(t * .4) * 30;
    camera.position.set(CAM.x + mouse.x * 1.2, CAM.y - mouse.y * .4, CAM.z);
    camera.lookAt(.6, 4.6, -2);
    renderer.render(scene, camera);
  })();
}

try { hill(); } catch (err) { console.error(err); }
