/* ui.js - Lógica de interface comum: tema, sidebar, botões globais */

const THEME_KEY = 'energy:theme';

/**
 * Aplica o tema (claro/escuro) salvo no localStorage ou baseado na preferência do sistema.
 */
function applyThemeFromStorage() {
  const saved = localStorage.getItem(THEME_KEY);
  const themeIcon = document.querySelector('#btnThemeToggle use');

  let isLight = false;
  if (saved) {
    isLight = saved === 'light';
  } else {
    isLight = window.matchMedia && !window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  document.body.classList.toggle('theme-light', isLight);
  document.body.classList.toggle('theme-dark', !isLight);
  if (themeIcon) {
    themeIcon.setAttribute('href', `assets/icons.svg#${isLight ? 'moon' : 'sun'}`);
  }
}

/**
 * Alterna entre os temas claro e escuro e salva a preferência.
 */
function toggleTheme() {
  const isLight = document.body.classList.contains('theme-light');
  const next = isLight ? 'dark' : 'light';
  const themeIcon = document.querySelector('#btnThemeToggle use');

  document.body.classList.toggle('theme-light', !isLight);
  document.body.classList.toggle('theme-dark', isLight);
  if (themeIcon) {
    themeIcon.setAttribute('href', `assets/icons.svg#${!isLight ? 'moon' : 'sun'}`);
  }

  localStorage.setItem(THEME_KEY, next);
}

/**
 * Configura os listeners de eventos para os elementos de UI comuns.
 */
function setupUIListeners() {
  // Botão de menu mobile
  const btnBurger = document.getElementById('btnBurger');
  const sidebar = document.querySelector('.sidebar');
  btnBurger?.addEventListener('click', () => {
    sidebar?.classList.toggle('open');
  });

  // Botão de alternar tema
  const btnThemeToggle = document.getElementById('btnThemeToggle');
  btnThemeToggle?.addEventListener('click', toggleTheme);
}

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
  applyThemeFromStorage();
  setupUIListeners();
});