from Nodo import Nodo
from Formulacion import is_goal, Status
from Utilidades import number_peoples, get_nodo_raiz

def busqueda_profundidad(city_map, orden_operadores):
    search_tree = []
    pila = []
    pila.append(get_nodo_raiz(city_map))
    nPeople, _ = number_peoples(city_map)
    visitados = set()
    
    while True:
        if len(pila) == 0:
            return False, search_tree
        
        n = pila.pop()
        
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
        
        hijos = n.expandir_no_informada_con_orden(city_map, orden_operadores)
        
        for hijo in reversed(hijos):
            pila.append(hijo)
