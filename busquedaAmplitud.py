from Nodo import Nodo
from Formulacion import is_goal, Status
from collections import deque
from Utilidades import get_ubication_start, number_peoples, get_nodo_raiz

def busqueda_amplitud(city_map):

    cola = deque()
    cola.append(get_nodo_raiz(city_map))
    nPeople, _ = number_peoples(city_map)
    
    while True:
        if len(cola) == 0:
            return False
        
        n = cola.popleft()
        
        if is_goal(city_map, n.Status, nPeople):
            return n
        
        hijos = n.expandir_no_informada(city_map)
        cola.extend(hijos)

if __name__ == "__main__":
    from Utilidades import inicializar_matriz
    
    matriz_real = inicializar_matriz()
    
    nodoMeta = busqueda_amplitud(matriz_real)
    if nodoMeta:
        print(f"Éxito. Costo: {nodoMeta.Cost}")
        print(f"Camino: {nodoMeta.Path}")
    else:
        print("No se encontró solución para el mapa real.")



