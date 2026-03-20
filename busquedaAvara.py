from Nodo import Nodo
from Formulacion import is_goal, Status
from Utilidades import number_peoples, get_nodo_raiz, get_ubication_end

def busqueda_avara(city_map):

    cola = []
    cola.append(get_nodo_raiz(city_map))
    nPeople, people_position = number_peoples(city_map)
    end_position = get_ubication_end(city_map)

    while True:
        if len(cola) == 0:
            return False
        
        cola.sort(key=lambda n: n.Heuristic if n.Heuristic is not None else float('inf'))
        n = cola.pop(0)
        
        if is_goal(city_map, n.Status, nPeople):
            return n
        
        hijos = n.expandir_informada(city_map, people_position, end_position)
        cola.extend(hijos)

if __name__ == "__main__":
    from Utilidades import inicializar_matriz
    
    matriz_real = inicializar_matriz()
    
    nodoMeta = busqueda_avara(matriz_real)
    if nodoMeta:
        print(f"Éxito (Avara). Costo: {nodoMeta.Cost}")
        print(f"Camino: {nodoMeta.Path}")
    else:
        print("No se encontró solución para el mapa real.")
