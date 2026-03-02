import eel

# ─── Configuración de Eel ──────────────────────────────────────────────────────
eel.init('web')  # Carpeta donde está el frontend

# ─── Mapa de la ciudad 10×10 ──────────────────────────────────────────────────
# 0=calle  1=edificio/parque  2=inicio carro  3=calle+carros  4=calle+persona  5=calle+meta
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

# ─── Ruta de ejemplo para el vehículo ─────────────────────────────────────────
PATH_EXAMPLE = [
    (2,0),(1,0),(0,0),(1,0),(2,0),(3,0),(4,0),(5,0),(6,0),(7,0),(8,0),(9,0),(9,1),(9,2),(8,2),
    (7,2),(7,3),(7,4),(8,4),(9,4),(9,5),(9,6),(9,7),(9,8),(8,8),(7,8),(7,7),(7,6),(6,6),(5,6),
    (5,7),(5,8),(5,9)
]

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


@eel.expose
def guardar_matriz_ciudad(nueva_matriz):
    """Recibe una matriz 10×10 desde el editor JS y la aplica como CITY_MATRIX."""
    global CITY_MATRIX
    # Validaciones básicas
    if not isinstance(nueva_matriz, list) or len(nueva_matriz) != 10:
        return {"ok": False, "error": "La matriz debe tener exactamente 10 filas."}
    for fila in nueva_matriz:
        if not isinstance(fila, list) or len(fila) != 10:
            return {"ok": False, "error": "Cada fila debe tener exactamente 10 columnas."}
        for val in fila:
            if val not in (0, 1, 2, 3, 4, 5):
                return {"ok": False, "error": f"Valor inválido en la matriz: {val}"}

    CITY_MATRIX = [list(row) for row in nueva_matriz]
    print(f"[Editor] Mapa guardado:\n" +
          "\n".join("  " + str(r) for r in CITY_MATRIX))
    return {"ok": True}


@eel.expose
def guardar_ruta(nueva_ruta):
    """Recibe la ruta definida en el editor JS y actualiza PATH_EXAMPLE."""
    global PATH_EXAMPLE
    if not isinstance(nueva_ruta, list) or len(nueva_ruta) < 2:
        return {"ok": False, "error": "La ruta debe tener al menos 2 pasos."}

    # Verificar que el primer paso corresponde al inicio del carro (tile 2)
    first_row, first_col = nueva_ruta[0]
    if CITY_MATRIX[first_row][first_col] != 2:
        return {
            "ok": False,
            "error": f"El primer paso [{first_row},{first_col}] no es el inicio del carro (tile 2)."
        }

    # Verificar que ningún paso caiga en edificio/parque/casa (tile 1)
    for step in nueva_ruta:
        r, c = step
        if not (0 <= r < 10 and 0 <= c < 10):
            return {"ok": False, "error": f"Paso fuera del mapa: [{r},{c}]"}
        if CITY_MATRIX[r][c] == 1:
            return {"ok": False, "error": f"El paso [{r},{c}] cae en un edificio/parque (tile 1)."}

    PATH_EXAMPLE = [tuple(step) for step in nueva_ruta]
    print(f"[Editor] Ruta guardada ({len(PATH_EXAMPLE)} pasos):")
    print(f"  PATH_EXAMPLE = {PATH_EXAMPLE}")
    return {"ok": True, "steps": len(PATH_EXAMPLE)}


# ─── Punto de entrada ─────────────────────────────────────────────────────────
if __name__ == '__main__':
    print("Iniciando aplicación con Eel...")
    eel.start(
        'menu.html',           # Pantalla de inicio
        size=(1100, 720),      # Tamaño de la ventana
        position=(100, 60)   # Posición en pantalla
    )
