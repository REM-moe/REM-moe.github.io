// --- THEME TOGGLE ---
const themeToggle = document.getElementById('theme-toggle');
const body = document.body;
const icon = themeToggle.querySelector('i');

// Check local storage or default to light for that vibrant look
const currentTheme = localStorage.getItem('theme') || 'light';
body.setAttribute('data-theme', currentTheme);
updateIcon(currentTheme);

themeToggle.addEventListener('click', () => {
    let theme = body.getAttribute('data-theme');
    let newTheme = theme === 'dark' ? 'light' : 'dark';
    body.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateIcon(newTheme);
});

function updateIcon(theme) {
    if (theme === 'dark') {
        icon.classList.remove('fa-sun');
        icon.classList.add('fa-moon');
    } else {
        icon.classList.remove('fa-moon');
        icon.classList.add('fa-sun');
    }
}

// Console Greeting
console.log("%c HELLO WORLD ", "background: #FF6B6B; color: #000; font-size: 20px; font-weight: bold; border: 3px solid #000;");
console.log("Welcome to my brutalist portfolio.");
