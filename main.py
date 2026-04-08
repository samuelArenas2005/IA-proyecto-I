import os
import eel
from Utilidades import limpiar_route_y_search_tree, inicializar_matriz, cargar_matriz_desde_texto
from busquedaAmplitud import busqueda_amplitud
from busquedaCostoUniforme import busqueda_costo_uniforme
from busquedaProfundidad import busqueda_profundidad
from busquedaAvara import busqueda_avara
from busquedaAEstrella import busqueda_a_estrella

ALGORITMO_SELECCIONADO = ""
VEHICULO_SELECCIONADO = "carro"
MAPA_SELECCIONADO = "mapa1.txt"

# Orden por defecto de operadores para búsqueda en profundidad
ORDEN_OPERADORES_PROFUNDIDAD = ['izquierda', 'abajo', 'derecha', 'arriba']

# ─── Configuración de Eel ──────────────────────────────────────────────────────
eel.init('web')  # Carpeta donde está el frontend

CITY_MATRIX = inicializar_matriz()
LAST_SEARCH_TREE = []

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
def obtener_algoritmo():
    """Retorna el algoritmo seleccionado."""
    return ALGORITMO_SELECCIONADO

@eel.expose
def cancelar_busqueda():
    """Cancela la búsqueda actual (llamada desde el frontend)."""
    global ALGORITMO_SELECCIONADO
    print(f"[backend] Búsqueda cancelada para: {ALGORITMO_SELECCIONADO}")
    return {"ok": True}

@eel.expose
def seleccionar_mapa_global(mapa):
    """Actualiza el mapa seleccionado antes de renderizar."""
    global MAPA_SELECCIONADO, CITY_MATRIX
    MAPA_SELECCIONADO = mapa
    # También cargamos la matriz inmediatamente para que esté lista
    ruta_mapas = os.path.join(os.path.dirname(__file__), 'mapas', 'pruebas', mapa)
    matriz = cargar_matriz_desde_texto(ruta_mapas)
    if matriz is not None:
        CITY_MATRIX = matriz
    print(f"[backend] Mapa por defecto cambiado a: {mapa}")

@eel.expose
def obtener_mapa_global():
    """Retorna el mapa seleccionado por defecto."""
    return MAPA_SELECCIONADO

@eel.expose
def obtener_lista_mapas():
    """Retorna la lista de archivos de mapa en la carpeta mapas/pruebas."""
    ruta_mapas = os.path.join(os.path.dirname(__file__), 'mapas', 'pruebas')
    if not os.path.exists(ruta_mapas):
        return []
    archivos = [f for f in os.listdir(ruta_mapas) if f.endswith('.txt')]
    return sorted(archivos)

@eel.expose
def obtener_lista_glb():
    """Retorna la lista de archivos .glb en SelectVehicle/assets."""
    ruta = os.path.join(os.path.dirname(__file__), 'web', 'SelectVehicle', 'assets')
    os.makedirs(ruta, exist_ok=True)
    archivos = [f for f in os.listdir(ruta) if f.lower().endswith('.glb')]
    return sorted(archivos)

@eel.expose
def guardar_glb_vehiculo(nombre, datos_b64):
    """Guarda un archivo .glb subido en base64 en SelectVehicle/assets."""
    import base64
    try:
        ruta = os.path.join(os.path.dirname(__file__), 'web', 'SelectVehicle', 'assets')
        os.makedirs(ruta, exist_ok=True)
        ruta_archivo = os.path.join(ruta, nombre)
        raw = base64.b64decode(datos_b64)
        with open(ruta_archivo, 'wb') as f:
            f.write(raw)
        print(f"[backend] Modelo GLB guardado: {nombre}")
        return {"ok": True}
    except Exception as e:
        return {"ok": False, "error": str(e)}

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
        print(f"Orden de operadores actualizado: {orden}")
        return {"ok": True}
    return {"ok": False, "error": "Orden inválido"}

@eel.expose
def obtener_orden_operadores():
    """Retorna el orden actual de operadores."""
    return ORDEN_OPERADORES_PROFUNDIDAD

@eel.expose
def guardar_mapa_subido(nombre, contenido):
    """Guarda un mapa subido desde el frontend en la carpeta mapas/pruebas."""
    try:
        ruta_mapas = os.path.join(os.path.dirname(__file__), 'mapas', 'pruebas')
        os.makedirs(ruta_mapas, exist_ok=True)
        ruta_archivo = os.path.join(ruta_mapas, nombre)
        with open(ruta_archivo, 'w', encoding='utf-8') as f:
            f.write(contenido)
        print(f"[backend] Mapa guardado: {nombre}")
        return {"ok": True}
    except Exception as e:
        return {"ok": False, "error": str(e)}

@eel.expose
def obtener_search_tree():
    """Retorna el árbol de expansión de la última búsqueda ejecutada."""
    return LAST_SEARCH_TREE

@eel.expose
def obtener_ruta():
    """Calcula y retorna la ruta usando el algoritmo seleccionado."""
    global ALGORITMO_SELECCIONADO, ORDEN_OPERADORES_PROFUNDIDAD, LAST_SEARCH_TREE
    
    algoritmos = {
        "amplitud": busqueda_amplitud,
        "costo_uniforme": busqueda_costo_uniforme,
        "profundidad": lambda cm: busqueda_profundidad(cm, ORDEN_OPERADORES_PROFUNDIDAD),
        "avara": busqueda_avara,
        "a_estrella": busqueda_a_estrella,
    }
    
    func = algoritmos.get(ALGORITMO_SELECCIONADO)
    if not func:
        print(f"[IA] Advertencia: Algoritmo '{ALGORITMO_SELECCIONADO}' no reconocido o no seleccionado.")
        return []
        
    ruta, search_tree = limpiar_route_y_search_tree(func, CITY_MATRIX)
    LAST_SEARCH_TREE = search_tree
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


