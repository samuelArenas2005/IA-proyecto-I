import os
import eel
from Utilidades import limpiar_route, inicializar_matriz, cargar_matriz_desde_texto
from busquedaAmplitud import busqueda_amplitud
from busquedaCostoUniforme import busqueda_costo_uniforme
from busquedaProfundidad import busqueda_profundidad
from busquedaAvara import busqueda_avara

ALGORITMO_SELECCIONADO = ""
VEHICULO_SELECCIONADO = "carro"

# Orden por defecto de operadores para búsqueda en profundidad
ORDEN_OPERADORES_PROFUNDIDAD = ['izquierda', 'abajo', 'derecha', 'arriba']

# ─── Configuración de Eel ──────────────────────────────────────────────────────
eel.init('web')  # Carpeta donde está el frontend

CITY_MATRIX = inicializar_matriz()

@eel.expose
def cargar_mapa_desde_archivo(ruta):
    """Carga una nueva matriz desde un archivo de texto. Retorna {ok: bool, error?: str}."""
    global CITY_MATRIX
    if not os.path.isabs(ruta):
        ruta = os.path.join(os.path.dirname(__file__), ruta)
    matriz = cargar_matriz_desde_texto(ruta)
    if matriz is None:
        return {"ok": False, "error": f"No se pudo cargar el archivo: {ruta}"}
    CITY_MATRIX = matriz
    return {"ok": True}

@eel.expose
def obtener_matriz_ciudad():
    """Retorna la matriz 10×10 que define el mapa de la ciudad."""
    return CITY_MATRIX

@eel.expose
def seleccionar_algoritmo(tipo):
    """Actualiza el algoritmo seleccionado desde el frontend."""
    global ALGORITMO_SELECCIONADO
    ALGORITMO_SELECCIONADO = tipo
    print(f"[backend] Algoritmo cambiado a: {tipo}")

@eel.expose
def seleccionar_vehiculo(tipo):
    """Actualiza el vehículo seleccionado desde el frontend."""
    global VEHICULO_SELECCIONADO
    VEHICULO_SELECCIONADO = tipo
    print(f"[backend] Vehículo cambiado a: {tipo}")

@eel.expose
def obtener_vehiculo():
    """Retorna el vehículo seleccionado."""
    return VEHICULO_SELECCIONADO

@eel.expose
def establecer_orden_operadores(orden):
    """Establece el orden de operadores para búsqueda en profundidad."""
    global ORDEN_OPERADORES_PROFUNDIDAD
    if isinstance(orden, list) and len(orden) == 4:
        ORDEN_OPERADORES_PROFUNDIDAD = orden
        print(f"[backend] Orden de operadores actualizado: {orden}")
        return {"ok": True}
    return {"ok": False, "error": "Orden inválido"}

@eel.expose
def obtener_orden_operadores():
    """Retorna el orden actual de operadores."""
    return ORDEN_OPERADORES_PROFUNDIDAD

@eel.expose
def obtener_ruta():
    """Calcula y retorna la ruta usando el algoritmo seleccionado."""
    global ALGORITMO_SELECCIONADO, ORDEN_OPERADORES_PROFUNDIDAD
    
    algoritmos = {
        "amplitud": busqueda_amplitud,
        "costo_uniforme": busqueda_costo_uniforme,
        "profundidad": lambda cm: busqueda_profundidad(cm, ORDEN_OPERADORES_PROFUNDIDAD),
        "avara": busqueda_avara,
    }
    
    func = algoritmos.get(ALGORITMO_SELECCIONADO)
    if not func:
        print(f"[IA] Advertencia: Algoritmo '{ALGORITMO_SELECCIONADO}' no reconocido o no seleccionado.")
        return []
        
    ruta = limpiar_route(func, CITY_MATRIX)
    return ruta



# ─── Punto de entrada ─────────────────────────────────────────────────────────
if __name__ == '__main__':
    print("Iniciando aplicación con Eel...")
    eel.start(
        'menu.html',           # Pantalla de inicio
        size=(1920, 1080),      # Tamaño de la ventana
        position=(0,0),   # Posición en pantalla
        mode='chrome'
    )


