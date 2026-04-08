from Nodo import Nodo
from Formulacion import is_goal, Status
from collections import deque
from Utilidades import get_ubication_start, number_peoples, get_nodo_raiz

def busqueda_amplitud(city_map):
    search_tree = []
    cola = deque()
    cola.append(get_nodo_raiz(city_map))
    nPeople, _ = number_peoples(city_map)
    visitados = set()
    while True:
        if len(cola) == 0:
            return False, search_tree
        
        n = cola.popleft()
        
        if n.Status.get_values() in visitados:
            continue
        
        visitados.add(n.Status.get_values())
        
        if len(n.Path) >= 2:
            parent = n.Path[-2]
            current = n.Path[-1]
            search_tree.append((parent[0], parent[1], current[0], current[1]))
        else:
            current = n.Path[-1]
            search_tree.append((current[0], current[1], current[0], current[1]))
        
        if is_goal(city_map, n.Status, nPeople):
            return n, search_tree
        
        hijos = n.expandir_no_informada(city_map)
        cola.extend(hijos)

if __name__ == "__main__":
    from Utilidades import inicializar_matriz
    
    matriz_real = inicializar_matriz()
    
    nodoMeta, search_tree = busqueda_amplitud(matriz_real)
    if nodoMeta:
        print(f"Éxito. Costo: {nodoMeta.Cost}")
        print(f"Camino: {nodoMeta.Path}")
    else:
        print("No se encontró solución para el mapa real.")



