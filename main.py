import eel
import datetime
import platform
import psutil
import json

# ─── Configuración de Eel ──────────────────────────────────────────────────────
eel.init('web')  # Carpeta donde está el frontend

# ─── Mapa de la ciudad 10×10 ──────────────────────────────────────────────────
# 0=calle  1=edificio/parque  2=inicio carro  3=calle+carros  4=edificio+persona  5=calle+meta
CITY_MATRIX = [
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

@eel.expose
def obtener_matriz_ciudad():
    """Retorna la matriz 10×10 que define el mapa de la ciudad."""
    return CITY_MATRIX


# ─── Punto de entrada ─────────────────────────────────────────────────────────
if __name__ == '__main__':
    print("Iniciando aplicación con Eel...")
    eel.start(
        'index.html',          # Archivo HTML principal
        size=(1100, 720),      # Tamaño de la ventana
        position=(100, 60)   # Posición en pantalla
    )
