'use strict';

// ── Toast ─────────────────────────────────────────────────────────────────────
function mostrarToast(msg, dur = 3000) {
  const t = document.getElementById('toast');
  document.getElementById('toast-msg').textContent = msg;
  t.classList.add('show');
  clearTimeout(t._t);
  t._t = setTimeout(() => t.classList.remove('show'), dur);
}

// Toast persistente para operaciones largas
function mostrarToastPersistente(msg) {
  const t = document.getElementById('toast');
  document.getElementById('toast-msg').textContent = msg;
  t.classList.add('show');
  clearTimeout(t._t);
  // No desaparece automáticamente
  return () => t.classList.remove('show'); // Retorna función para cerrar
}

// Python → JS
eel.expose(mostrar_notificacion);
function mostrar_notificacion(msg) { mostrarToast(msg, 4000); }

// ── Iconos (Font Awesome classes) ───────────────────────────────────
const FA_SUN     = 'fa-solid fa-sun';
const FA_MOON    = 'fa-solid fa-moon';
const FA_SUNRISE = 'fa-solid fa-cloud-sun';
const FA_SUNSET  = 'fa-solid fa-cloud-moon';
const FA_PLAY    = 'fa-solid fa-play';
const FA_REPLAY  = 'fa-solid fa-rotate-right';

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
window._FA = { SUN: FA_SUN, MOON: FA_MOON, SUNRISE: FA_SUNRISE, SUNSET: FA_SUNSET, PLAY: FA_PLAY, REPLAY: FA_REPLAY };
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

// ── Cambiar Mapa y Algoritmo ──────────────────────────────────
window.changeMapSelect = async function() {
    const sel = document.getElementById('select-mapa');
    if (!sel || !window.eel) return;
    try {
        const path = 'mapas/pruebas/' + sel.value;
        const res = await window.eel.cargar_mapa_desde_archivo(path)();
        if (res && res.ok) {
            const matrix = await window.eel.obtener_matriz_ciudad()();
            const navMapTitle = document.getElementById('nav-map-title');
            if(navMapTitle) navMapTitle.textContent = sel.options[sel.selectedIndex].text;
            
            document.getElementById('map-canvas').innerHTML = ''; // Limpiar previo
            window.dispatchEvent(new CustomEvent('ciudad-lista', { detail: matrix }));
            mostrarToast('Mapa cargado: ' + sel.value);
        } else {
            let errorMsg = res ? res.error : 'Desconocido';
            mostrarToast('Error cargando mapa: ' + errorMsg);
        }
    } catch(e) {
        console.error(e);
        mostrarToast('Error de red al cargar el mapa');
    }
};

window.changeAlgoSelect = async function() {
    const sel = document.getElementById('select-algoritmo');
    if (!sel || !window.eel) return;
    try {
        // Mostrar toast persistente de carga
        const closeToast = mostrarToastPersistente('⏳ Calculando ruta óptima...');
        
        await window.eel.seleccionar_algoritmo(sel.value)();
        const navAlgoTitle = document.getElementById('nav-algo-title');
        if(navAlgoTitle) {
            let titleText = sel.options[sel.selectedIndex].text;
            if (sel.value === 'profundidad' && window.eel.obtener_orden_operadores) {
                const orden = await window.eel.obtener_orden_operadores()();
                if (orden && orden.length) {
                    const mapOrd = { izquierda: 'Izq', abajo: 'Aba', derecha: 'Der', arriba: 'Arr' };
                    titleText += ` [${orden.map(o => mapOrd[o] || o).join('-')}]`;
                }
            }
            navAlgoTitle.textContent = titleText;
        }
        
        // Cerrar toast de carga y mostrar confirmación
        closeToast();
        mostrarToast('Algoritmo cambiado: ' + sel.options[sel.selectedIndex].text);
    } catch(e) {
        console.error(e);
    }
};

// ── Toggles de los Paneles Laterales ─────────────────────────
window.toggleLegend = function() {
  const content = document.getElementById('legend-content');
  const arrow = document.getElementById('legend-arrow');
  if (content.style.display === 'none') {
    content.style.display = 'block';
    arrow.style.transform = 'rotate(0deg)';
  } else {
    content.style.display = 'none';
    arrow.style.transform = 'rotate(180deg)';
  }
};

window.toggleConfig = function() {
  const content = document.getElementById('config-content');
  const arrow = document.getElementById('config-arrow');
  if (content.style.display === 'none') {
    content.style.display = 'flex';
    arrow.style.transform = 'rotate(0deg)';
  } else {
    content.style.display = 'none';
    arrow.style.transform = 'rotate(180deg)';
  }
};

window.toggleTreeExpand = function() {
  const panel = document.getElementById('tree-sketch-panel');
  const icon = document.getElementById('icon-expand-tree');
  if (!panel || !icon) return;
  if (panel.classList.contains('tree-sketch-panel--expanded')) {
    panel.classList.remove('tree-sketch-panel--expanded');
    icon.classList.replace('fa-compress', 'fa-expand');
  } else {
    panel.classList.add('tree-sketch-panel--expanded');
    icon.classList.replace('fa-expand', 'fa-compress');
  }
};

// Auto-seleccionar al dar refresh, reparando bug de algoritmos no reflejados
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(async () => { 
        if(window.eel) {
            // Cargar Algoritmos
            try {
                const algoEel = await window.eel.obtener_algoritmo()();
                const algoSelect = document.getElementById('select-algoritmo');
                if(algoEel && algoSelect) {
                    algoSelect.value = algoEel;
                    const navAlgoTitle = document.getElementById('nav-algo-title');
                    if(navAlgoTitle) {
                        let titleText = algoSelect.options[algoSelect.selectedIndex].text;
                        if (algoEel === 'profundidad' && window.eel.obtener_orden_operadores) {
                            const orden = await window.eel.obtener_orden_operadores()();
                            if (orden && orden.length) {
                                const mapOrd = { izquierda: 'Izq', abajo: 'Aba', derecha: 'Der', arriba: 'Arr' };
                                titleText += ` [${orden.map(o => mapOrd[o] || o).join('-')}]`;
                            }
                        }
                        navAlgoTitle.textContent = titleText;
                    }
                } else {
                    if(window.changeAlgoSelect) window.changeAlgoSelect(); // Set default
                }
            } catch(e) { console.error(e); }
            
            // Cargar Mapas dinámicamente
            try {
                const mapList = await window.eel.obtener_lista_mapas()();
                const selMap = document.getElementById('select-mapa');
                if(selMap && mapList) {
                    selMap.innerHTML = '';
                    mapList.forEach(m => {
                        const opt = document.createElement('option');
                        opt.value = m;
                        opt.textContent = m;
                        selMap.appendChild(opt);
                    });
                    
                    // Ver cuál es el global actual
                    const currentMap = await window.eel.obtener_mapa_global()();
                    if(currentMap && mapList.includes(currentMap)) {
                        selMap.value = currentMap;
                    }
                    
                    const navMapTitle = document.getElementById('nav-map-title');
                    if(navMapTitle) {
                        navMapTitle.textContent = selMap.options[selMap.selectedIndex]?.text || '...';
                    }
                }
            } catch(e) { console.error(e); }
        }
    }, 600);
});
