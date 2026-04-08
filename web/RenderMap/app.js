'use strict';

// ── Toast ─────────────────────────────────────────────────────────────────────
function mostrarToast(msg, dur = 3000) {
  const t = document.getElementById('toast');
  document.getElementById('toast-msg').textContent = msg;
  t.classList.add('show');
  clearTimeout(t._t);
  t._t = setTimeout(() => t.classList.remove('show'), dur);
}

// Control de cancelación
let currentAbortController = null;
let loadingTimeout = null;

// Toast persistente para operaciones largas (con animación de carga)
function mostrarToastPersistente(algoName) {
  const t = document.getElementById('toast');
  const msgEl = document.getElementById('toast-msg');
  
  msgEl.innerHTML = `
    <span class="toast-spinner"></span>
    <span class="toast-content">
      <span class="toast-text">
        <span class="toast-title">Calculando ruta con</span>
        <span class="toast-subtitle">${algoName}</span>
      </span>
    </span>
  `;
  t.classList.add('show', 'toast-persistent');
  clearTimeout(t._t);
  
  // Auto-reactivar controles después de 30 segundos si aún está cargando
  // (por si algo falla silenciosamente)
  clearTimeout(loadingTimeout);
  loadingTimeout = setTimeout(() => {
    console.warn('[warning] Búsqueda tardando más de 30s, reactivando controles');
    enableControls();
  }, 30000);
  
  // No desaparece automáticamente
  return () => {
    clearTimeout(loadingTimeout);
    t.classList.remove('show', 'toast-persistent');
    msgEl.textContent = '';
  }; // Retorna función para cerrar
}

// Deshabilitar controles durante cálculo (excepto tema)
function disableControls() {
  const elementsToDisable = [
    'select-algoritmo',
    'select-mapa',
    'btn-back',
    'btn-play-route',
    'btn-show-tree',
    'btn-speed',
    'btn-pov',
    'btn-zoom-in',
    'btn-zoom-out',
    'btn-reset-cam',
    'btn-time'
  ];
  
  elementsToDisable.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.disabled = true;
      el.style.opacity = '0.45';
      el.style.cursor = 'not-allowed';
      // NO usamos pointer-events: none para evitar congelación de UI
    }
  });
}

// Habilitar controles después de cálculo
function enableControls() {
  const elementsToEnable = [
    'select-algoritmo',
    'select-mapa',
    'btn-back',
    'btn-play-route',
    'btn-show-tree',
    'btn-speed',
    'btn-pov',
    'btn-zoom-in',
    'btn-zoom-out',
    'btn-reset-cam',
    'btn-time'
  ];
  
  elementsToEnable.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.disabled = false;
      el.style.opacity = '1';
      el.style.cursor = 'pointer';
    }
  });
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
    console.log('[init] Iniciando carga de mapa...');
    const matrix = await eel.obtener_matriz_ciudad()();
    console.log('[success] Matriz cargada correctamente');
    window.dispatchEvent(new CustomEvent('ciudad-lista', { detail: matrix }));
  } catch (e) {
    console.error('[error] Error al obtener matriz:', e);
    mostrarToast('Error: No se puede conectar con el servidor');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  console.log('[init] DOM cargado, iniciando aplicación...');
  cargarMapa();
});

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
            
            // Restablecer botón de play al cambiar mapa
            if (window.resetWorld) {
                window.resetWorld();
            }
            
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

    const algoName = sel.options[sel.selectedIndex].text;

    try {
        // Guardar selección en el backend sin ejecutar la ruta aún
        await window.eel.seleccionar_algoritmo(sel.value)();
    } catch (e) {
        console.error('[error] No se pudo guardar el algoritmo seleccionado:', e);
    }

    const navAlgoTitle = document.getElementById('nav-algo-title');
    if (navAlgoTitle) {
        let titleText = algoName;
        navAlgoTitle.textContent = titleText;

        if (sel.value === 'profundidad' && window.eel && window.eel.obtener_orden_operadores) {
            try {
                const orden = await window.eel.obtener_orden_operadores()();
                if (orden && orden.length) {
                    const mapOrd = { izquierda: 'Izq', abajo: 'Aba', derecha: 'Der', arriba: 'Arr' };
                    navAlgoTitle.textContent = `${titleText} [${orden.map(o => mapOrd[o] || o).join('-')}]`;
                }
            } catch (err) {
                console.warn('[warn] No se pudo obtener orden de operadores:', err);
            }
        }
    }

    mostrarToast('Algoritmo seleccionado: ' + algoName, 2200);
};

window.changeUseVisitados = async function(enabled) {
    const checkbox = document.getElementById('toggle-visitados');
    if (typeof enabled !== 'boolean' && checkbox) {
        enabled = checkbox.checked;
    }
    if (!window.eel) return;
    try {
        await window.eel.seleccionar_uso_visitados(enabled)();
        mostrarToast(enabled ? 'Algoritmo mejorado activado' : 'Algoritmo mejorado desactivado', 1800);
    } catch (e) {
        console.error('[error] No se pudo guardar el modo de visitados:', e);
        mostrarToast('No se pudo cambiar la opción de algoritmo mejorado', 2200);
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

window.toggleSwitchInfo = function() {
  const infoText = document.getElementById('switch-info-text');
  const toggleButton = document.getElementById('toggle-info-button');
  if (!infoText || !toggleButton) return;
  const isOpen = infoText.classList.toggle('open');
  toggleButton.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
};

// Auto-seleccionar al dar refresh, reparando bug de algoritmos no reflejados
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(async () => { 
        console.log('[init] Verificando disponibilidad de Eel...');
        
        if(!window.eel) {
            console.error('[error] Eel no está disponible');
            mostrarToast('Error: Conexión con servidor no disponible');
            return;
        }
        
        console.log('[success] Eel está disponible');
        
        if(window.eel) {
            // Cargar Algoritmos
            try {
                console.log('[init] Cargando lista de algoritmos...');
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
                    console.log('[success] Algoritmo cargado: ' + algoEel);
                } else {
                    console.warn('[warn] Algoritmo no disponible, usando default');
                    if(window.changeAlgoSelect) window.changeAlgoSelect(); // Set default
                }
            } catch(e) { 
                console.error('[error] Error cargando algoritmo:', e);
            }
            
            // Cargar Mapas dinámicamente
            try {
                console.log('[init] Cargando lista de mapas...');
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
                    console.log('[success] Mapas cargados: ' + mapList.length);
                    
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
            } catch(e) {
                console.error('[error] Error cargando mapas:', e);
            }

            try {
                const visitadosSwitch = document.getElementById('toggle-visitados');
                if (visitadosSwitch && window.eel && window.eel.obtener_uso_visitados) {
                    const enabled = await window.eel.obtener_uso_visitados()();
                    visitadosSwitch.checked = Boolean(enabled);
                }
            } catch (e) {
                console.warn('[warn] No se pudo cargar el estado de algoritmo mejorado:', e);
            }
        }
    }, 600);
});
