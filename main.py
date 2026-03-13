import os
import eel
from busquedaAmplitud import limpiar_route

# ─── Configuración de Eel ──────────────────────────────────────────────────────
eel.init('web')  # Carpeta donde está el frontend

# ─── Mapa de la ciudad 10×10 ──────────────────────────────────────────────────
# 0=calle  1=edificio/parque  2=inicio carro  3=calle+carros  4=calle+persona  5=calle+meta
MATRIZ_DEFECTO = [
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
]

def _cargar_matriz_desde_texto(ruta):
    """
    Carga la matriz desde un archivo de texto plano.
    Formato: cada línea es una fila, números separados por espacios.
    Ejemplo:
        4 1 1 1 1 1 1 1 1 1
        0 1 1 0 0 0 3 0 0 0
        ...
    Retorna None si falla.
    """
    try:
        if not os.path.isfile(ruta):
            return None
        with open(ruta, 'r', encoding='utf-8') as f:
            matriz = []
            for linea in f:
                linea = linea.strip()
                if not linea:
                    continue
                fila = [int(x) for x in linea.split()]
                matriz.append(fila)
            if matriz and len(matriz) == 10 and all(len(fila) == 10 for fila in matriz):
                return matriz
    except (ValueError, OSError) as e:
        print(f"[mapa] Error al leer {ruta}: {e}")
    return None

def _inicializar_matriz():
    """Carga matriz desde mapas/pruebas/mapa1.txt o usa la por defecto."""
    ruta = os.path.join(os.path.dirname(__file__), 'mapas', 'pruebas', 'mapa1.txt')
    matriz = _cargar_matriz_desde_texto(ruta)
    if matriz:
        print("[mapa] Cargado desde mapas/pruebas/mapa1.txt")
        return matriz
    print("[mapa] Usando matriz por defecto (mapas/pruebas/mapa1.txt no encontrado o inválido)")
    return [fila[:] for fila in MATRIZ_DEFECTO]

CITY_MATRIX = _inicializar_matriz()

@eel.expose
def cargar_mapa_desde_archivo(ruta):
    """Carga una nueva matriz desde un archivo de texto. Retorna {ok: bool, error?: str}."""
    global CITY_MATRIX, PATH_EXAMPLE
    if not os.path.isabs(ruta):
        ruta = os.path.join(os.path.dirname(__file__), ruta)
    matriz = _cargar_matriz_desde_texto(ruta)
    if matriz is None:
        return {"ok": False, "error": f"No se pudo cargar el archivo: {ruta}"}
    CITY_MATRIX = matriz
    PATH_EXAMPLE = limpiar_route(CITY_MATRIX)
    return {"ok": True}

@eel.expose
def obtener_matriz_ciudad():
    """Retorna la matriz 10×10 que define el mapa de la ciudad."""
    return CITY_MATRIX

# ─── Ruta de ejemplo para el vehículo ─────────────────────────────────────────
""" PATH_EXAMPLE = [
    (2,0),(1,0),(0,0),(1,0),(2,0),(3,0),(4,0),(5,0),(6,0),(7,0),(8,0),(9,0),(9,1),(9,2),(8,2),
    (7,2),(7,3),(7,4),(8,4),(9,4),(9,5),(9,6),(9,7),(9,8),(8,8),(7,8),(7,7),(7,6),(6,6),(5,6),
    (5,7),(5,8),(5,9)
]
 """
PATH_EXAMPLE = limpiar_route(CITY_MATRIX)

@eel.expose
def obtener_ruta():
    """Retorna la ruta y verifica que inicie validamente en la matriz (2)."""
    if not PATH_EXAMPLE:
        return []
    
    start_row, start_col = PATH_EXAMPLE[0]
    
    if CITY_MATRIX[start_row][start_col] != 2:
        print(f"Error: El vehículo inicia en ({start_row}, {start_col}), que no es el punto de partida (2).")
        return {"error": "El primer elemento del arreglo no coincide con un 2 en la matriz de la ciudad."}
    
    return PATH_EXAMPLE



# ─── Punto de entrada ─────────────────────────────────────────────────────────
if __name__ == '__main__':
    print("Iniciando aplicación con Eel...")
    eel.start(
        'menu.html',           # Pantalla de inicio
        size=(1920, 1080),      # Tamaño de la ventana
        position=(0,0),   # Posición en pantalla
        mode='chrome'
    )


