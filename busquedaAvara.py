from Nodo import Nodo
from Formulacion import is_goal, Status
from Utilidades import number_peoples, get_nodo_raiz, get_ubication_end
import time

def busqueda_avara(city_map):
    
    search_tree = []
    cola = []
    cola.append(get_nodo_raiz(city_map))
    nPeople, people_position = number_peoples(city_map)
    end_position = get_ubication_end(city_map)
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
        
        cola.sort(key=lambda n: n.Heuristic if n.Heuristic is not None else float('inf'))
        n = cola.pop(0)
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
        
        hijos = n.expandir_informada(city_map, people_position, end_position)
        cola.extend(hijos)

if __name__ == "__main__":
    from Utilidades import inicializar_matriz
    
    matriz_real = inicializar_matriz()
    
    nodoMeta, search_tree, _ = busqueda_avara(matriz_real)
    if nodoMeta:
        print(f"Éxito (Avara). Costo: {nodoMeta.Cost}")
        print(f"Camino: {nodoMeta.Path}")
    else:
        print("No se encontró solución para el mapa real.")
