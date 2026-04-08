from Nodo import Nodo
from Formulacion import is_goal, Status
from collections import deque
from Utilidades import get_ubication_start, number_peoples, get_nodo_raiz
import time

def busqueda_amplitud(city_map):
    search_tree = []
    cola = deque()
    cola.append(get_nodo_raiz(city_map))
    nPeople, _ = number_peoples(city_map)
    expanded_nodes = 0
    max_depth = 0
    started = time.perf_counter()
    
    while True:
        if len(cola) == 0:
            elapsed_ms = (time.perf_counter() - started) * 1000
            metrics = {
                "expanded_nodes": expanded_nodes,
                "max_depth": max_depth,
                "solution_depth": None,
                "compute_time_ms": elapsed_ms,
            }
            return False, search_tree, metrics
        
        n = cola.popleft()
        expanded_nodes += 1
        current_depth = len(n.Path) - 1
        if current_depth > max_depth:
            max_depth = current_depth
        if len(n.Path) >= 2:
            parent = n.Path[-2]
            current = n.Path[-1]
            search_tree.append((parent[0], parent[1], current[0], current[1]))
        else:
            current = n.Path[-1]
            search_tree.append((current[0], current[1], current[0], current[1]))
        
        if is_goal(city_map, n.Status, nPeople):
            elapsed_ms = (time.perf_counter() - started) * 1000
            metrics = {
                "expanded_nodes": expanded_nodes,
                "max_depth": max_depth,
                "solution_depth": len(n.Path) - 1,
                "compute_time_ms": elapsed_ms,
            }
            return n, search_tree, metrics
        
        hijos = n.expandir_no_informada(city_map)
        cola.extend(hijos)
if __name__ == "__main__":
    from Utilidades import inicializar_matriz
    
    matriz_real = inicializar_matriz()
    
    nodoMeta, search_tree, _ = busqueda_amplitud(matriz_real)
    if nodoMeta:
        print(f"Éxito. Costo: {nodoMeta.Cost}")
        print(f"Camino: {nodoMeta.Path}")
    else:
        print("No se encontró solución para el mapa real.")



