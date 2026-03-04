// ══════════════════════════════════════════════════════════════
//  api.js — API de comunicación con Python (Eel)
//  Métodos para obtener/guardar matriz y rutas de la ciudad
// ══════════════════════════════════════════════════════════════

async function obtenerMatrizCiudad() {
  try {
    if (typeof eel !== 'undefined' && eel.obtener_matriz_ciudad) {
      return await eel.obtener_matriz_ciudad()();
    } else {
      console.warn('Eel no disponible, usando matriz por defecto');
      return getMatrizPorDefecto();
    }
  } catch (error) {
    console.error('Error al obtener matriz:', error);
    return getMatrizPorDefecto();
  }
}

/**
 * Obtiene la ruta de ejemplo del vehículo
 * @returns {Promise<Array>} Promesa que resuelve con la ruta del vehículo
 */
async function obtenerRuta() {
  try {
    if (typeof eel !== 'undefined' && eel.obtener_ruta) {
      return await eel.obtener_ruta()();
    } else {
      console.warn('Eel no disponible, usando ruta por defecto');
      return getRutaPorDefecto();
    }
  } catch (error) {
    console.error('Error al obtener ruta:', error);
    return getRutaPorDefecto();
  }
}

/**
 * Guarda una nueva matriz en el servidor Python
 * @param {Array} nuevaMatriz - Matriz 10×10 a guardar
 * @returns {Promise<Object>} Promesa que resuelve con la respuesta del servidor
 */
async function guardarMatrizCiudad(nuevaMatriz) {
  try {
    if (typeof eel !== 'undefined' && eel.guardar_matriz_ciudad) {
      return await eel.guardar_matriz_ciudad(nuevaMatriz)();
    } else {
      console.warn('Eel no disponible, guardado simulado');
      return { ok: true, msg: 'Guardado simulado (Eel no disponible)' };
    }
  } catch (error) {
    console.error('Error al guardar matriz:', error);
    return { ok: false, error: error.message };
  }
}

/**
 * Guarda una nueva ruta en el servidor Python
 * @param {Array} nuevaRuta - Ruta a guardar como array de pares [fila, columna]
 * @returns {Promise<Object>} Promesa que resuelve con la respuesta del servidor
 */
async function guardarRuta(nuevaRuta) {
  try {
    if (typeof eel !== 'undefined' && eel.guardar_ruta) {
      return await eel.guardar_ruta(nuevaRuta)();
    } else {
      console.warn('Eel no disponible, guardado simulado');
      return { ok: true, msg: 'Guardado simulado (Eel no disponible)' };
    }
  } catch (error) {
    console.error('Error al guardar ruta:', error);
    return { ok: false, error: error.message };
  }
}

/**
 * Matriz por defecto (usada cuando Eel no está disponible)
 */
function getMatrizPorDefecto() {
  return [
    [4, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [0, 1, 1, 0, 0, 0, 3, 0, 0, 0],
    [2, 1, 1, 0, 1, 0, 1, 0, 1, 0],
    [0, 0, 0, 0, 3, 0, 0, 0, 3, 0],
    [0, 1, 1, 0, 1, 1, 1, 1, 1, 0],
    [0, 0, 0, 0, 1, 1, 0, 0, 0, 5],
    [4, 1, 1, 1, 1, 1, 0, 1, 1, 1],
    [0, 1, 0, 0, 0, 1, 0, 0, 0, 1],
    [0, 1, 0, 1, 0, 1, 1, 1, 0, 1],
    [0, 0, 0, 1, 0, 0, 0, 0, 0, 1],
  ];
}

/**
 * Ruta por defecto (usada cuando Eel no está disponible)
 */
function getRutaPorDefecto() {
  return [
    [2, 0], [1, 0], [0, 0], [1, 0], [2, 0], [3, 0], [4, 0], [5, 0], [6, 0], [7, 0], [8, 0], [9, 0],
    [9, 1], [9, 2], [8, 2], [7, 2], [7, 3], [7, 4], [8, 4], [9, 4], [9, 5], [9, 6], [9, 7], [9, 8],
    [8, 8], [7, 8], [7, 7], [7, 6], [6, 6], [5, 6], [5, 7], [5, 8], [5, 9]
  ];
}
