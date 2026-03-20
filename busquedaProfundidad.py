from Nodo import Nodo
from Formulacion import is_goal, Status
from Utilidades import number_peoples, get_nodo_raiz

def busqueda_profundidad(city_map, orden_operadores):
    pila = []
    pila.append(get_nodo_raiz(city_map))
    nPeople, _ = number_peoples(city_map)
    
    while True:
        if len(pila) == 0:
            return False
        
        n = pila.pop()
        
        if is_goal(city_map, n.Status, nPeople):
            return n
        
        hijos = n.expandir_no_informada_con_orden(city_map, orden_operadores)
        
        for hijo in reversed(hijos):
            pila.append(hijo)
