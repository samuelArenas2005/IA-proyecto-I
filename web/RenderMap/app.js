'use strict';

// ── Toast ─────────────────────────────────────────────────────────────────────
function mostrarToast(msg, dur = 3000) {
  const t = document.getElementById('toast');
  document.getElementById('toast-msg').textContent = msg;
  t.classList.add('show');
  clearTimeout(t._t);
  t._t = setTimeout(() => t.classList.remove('show'), dur);
}

// Python → JS
eel.expose(mostrar_notificacion);
function mostrar_notificacion(msg) { mostrarToast(msg, 4000); }

// ── Iconos (Font Awesome classes) ───────────────────────────────────
const FA_SUN     = 'fa-solid fa-sun';
const FA_MOON    = 'fa-solid fa-moon';
const FA_SUNRISE = 'fa-solid fa-cloud-sun';
const FA_SUNSET  = 'fa-solid fa-cloud-moon';

// ── Toggle tema claro / oscuro ─────────────────────────────────
let _lightMode = false;
window.toggleTheme = function () {
  _lightMode = !_lightMode;
  document.body.classList.toggle('light', _lightMode);
  
  const icon = document.getElementById('icon-theme');
  if (icon) {
    icon.className = _lightMode ? FA_MOON : FA_SUN;
  }
  
  window.setMapTheme?.(_lightMode);
};

// Exponer para map.js
window._FA = { SUN: FA_SUN, MOON: FA_MOON, SUNRISE: FA_SUNRISE, SUNSET: FA_SUNSET };
// ── Cargar matriz de la ciudad y enviarla a map.js ────────────────────────────
async function cargarMapa() {
  try {
    const matrix = await eel.obtener_matriz_ciudad()();
    window.dispatchEvent(new CustomEvent('ciudad-lista', { detail: matrix }));
  } catch (e) {
    console.error('Error al obtener matriz:', e);
    mostrarToast('⚠️ Sin conexión con Python usando demo');
  }
}

document.addEventListener('DOMContentLoaded', cargarMapa);

// ── Volver al menú ─────────────────────────────────────────────
window.irAlMenu = function() {
  document.body.classList.add('fade-out');
  setTimeout(() => { window.location.href = '../menu.html'; }, 450);
};
