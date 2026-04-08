import os
from Nodo import Nodo
from Formulacion import Status

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

def cargar_matriz_desde_texto(ruta):
    try:
        if not os.path.isfile(ruta):
            return None
        with open(ruta, 'r', encoding='utf-8') as f:
            matriz = []
            for linea in f:
                linea = linea.strip()
                if not linea: continue
                fila = [int(x) for x in linea.split()]
                matriz.append(fila)
            if matriz and len(matriz) == 10 and all(len(fila) == 10 for fila in matriz):
                return matriz
    except (ValueError, OSError) as e:
        print(f"[mapa] Error al leer {ruta}: {e}")
    return None

def inicializar_matriz():
    base_dir = os.path.dirname(__file__)
    ruta = os.path.join(base_dir, 'mapas', 'pruebas', 'mapa1.txt')
    matriz = cargar_matriz_desde_texto(ruta)
    if matriz:
        return matriz
    return [fila[:] for fila in MATRIZ_DEFECTO]

def get_ubication_start(city_map):
    for i in range(len(city_map)):
        for j in range(len(city_map[0])):
            if city_map[i][j] == 2:
                return (i, j)
    return None

def get_ubication_end(city_map):
    for i in range(len(city_map)):
        for j in range(len(city_map[0])):
            if city_map[i][j] == 5:
                return (i, j)
    return None


def number_peoples(city_map):
    people_position = set()
    nPeople = 0
    for i in range(len(city_map)):
        for j in range(len(city_map[0])):
            if city_map[i][j] == 4:
                people_position.add((i, j))
                nPeople += 1
    return nPeople, people_position

def get_nodo_raiz(city_map):
    res = get_ubication_start(city_map)
    if res:
        startX, startY = res
        statusNodoRaiz = Status(startX, startY, 0, set())
        nodoRaiz = Nodo(statusNodoRaiz, [statusNodoRaiz.get_values()], {statusNodoRaiz.get_values()}, set(), 0, None)
        return nodoRaiz
    return None

def limpiar_route_y_search_tree(busqueda_func, city_map):
    resultado = busqueda_func(city_map)
    metrics = None

    if isinstance(resultado, tuple) and len(resultado) == 3:
        nodoMeta, search_tree, metrics = resultado
    elif isinstance(resultado, tuple) and len(resultado) == 2:
        nodoMeta, search_tree = resultado
    else:
        nodoMeta, search_tree = resultado, []

    if not nodoMeta:
        return [], search_tree, metrics

    ruta = nodoMeta.Path
    rutaLimpia = []
    for elem in ruta:
        rutaLimpia.append((elem[0], elem[1]))

    return rutaLimpia, search_tree, metrics


def limpiar_route(busqueda_func, city_map):
    ruta, _, _ = limpiar_route_y_search_tree(busqueda_func, city_map)
    return ruta
