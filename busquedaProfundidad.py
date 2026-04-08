from Nodo import Nodo
from Formulacion import is_goal, Status
from Utilidades import number_peoples, get_nodo_raiz
import time

def busqueda_profundidad(city_map, orden_operadores, use_visitados=True):
    search_tree = []
    pila = []
    pila.append(get_nodo_raiz(city_map))
    nPeople, _ = number_peoples(city_map)
    visitados = set()
    
    if use_visitados:
        print("Visitados Activo") 
    expanded_nodes = 0
    max_depth = 0
    started = time.perf_counter()
    
    while True:
        if len(pila) == 0:
            elapsed_ms = (time.perf_counter() - started) * 1000
            metrics = {
                "expanded_nodes": expanded_nodes,
                "max_depth": max_depth,
                "solution_depth": None,
                "compute_time_ms": elapsed_ms,
            }
            return False, search_tree, metrics
        
        n = pila.pop()
        
        if use_visitados and n.Status.get_values() in visitados:
            continue
        
        if use_visitados:
            visitados.add(n.Status.get_values())
        
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
        
        hijos = n.expandir_no_informada_con_orden(city_map, orden_operadores)
        
        for hijo in reversed(hijos):
            pila.append(hijo)
