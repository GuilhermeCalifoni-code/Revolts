/* theme.js - Lógica de tema e sidebar */

const THEME_KEY = 'energy:theme';

/**
 * Aplica o tema (claro/escuro) salvo no localStorage ou baseado na preferência do sistema.
 */
function applyThemeFromStorage() {
  const saved = localStorage.getItem(THEME_KEY);
  if (saved) {
    document.body.classList.toggle('theme-light', saved === 'light');
    document.body.classList.toggle('theme-dark', saved !== 'light');
    return;
  }
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  document.body.classList.toggle('theme-dark', prefersDark);
  document.body.classList.toggle('theme-light', !prefersDark);
}

/**
 * Alterna entre os temas claro e escuro e salva a preferência.
 */
function toggleTheme() {
  const isLight = document.body.classList.contains('theme-light');
  const next = isLight ? 'dark' : 'light';
  document.body.classList.toggle('theme-light', !isLight);
  document.body.classList.toggle('theme-dark', isLight);
  localStorage.setItem(THEME_KEY, next);
}

/**
 * Configura o botão de menu para abrir/fechar a sidebar em telas mobile.
 */
function setupSidebar() {
  const btn = document.getElementById('btnBurger');
  const sidebar = document.querySelector('.sidebar');
  btn?.addEventListener('click', () => {
    sidebar.classList.toggle('open');
  });
}

applyThemeFromStorage();
setupSidebar();