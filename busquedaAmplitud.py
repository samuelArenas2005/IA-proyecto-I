from Nodo import Nodo
from Formulacion import *
from collections import deque

def get_ubication_start(map):
    for i in range(len(map)):
        for j in range(len(map[0])):
            if map[i][j] == 2:
                return (i,j)

def number_peoples(map):
    nPeople = 0
    for i in range(len(map)):
        for j in range(len(map[0])):
            if map[i][j] == 4:
                nPeople += 1
    
    return nPeople

def get_nodo_raiz(map):
    startX, startY = get_ubication_start(map)
    statusNodoRaiz = Status(startX,startY,0)
    nodoRaiz = Nodo(statusNodoRaiz,[statusNodoRaiz.get_values()],{statusNodoRaiz.get_values()},set(),0)
    
    return nodoRaiz


def busqueda_amplitud(map):
    
    cola = deque()
    cola.append(get_nodo_raiz(map))
    nPeople = number_peoples(map)
    
    while True:
        if len(cola) == 0:
            return False
        
        n = cola.popleft()
        
        if is_goal(map,n.Status,nPeople):
            return n
        
        hijos = n.expandir_amplitud(map)
        cola.extend(hijos)
    
    
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

nodoMeta = busqueda_amplitud(CITY_MATRIX)

print(nodoMeta.Path)
print(nodoMeta.Cost) 

def limpiar_route(map):
    nodoMeta = busqueda_amplitud(map)
    ruta = nodoMeta.Path
    rutaLimpia = []
    for elem in ruta:
        rutaLimpia.append((elem[0],elem[1]))
        
    return rutaLimpia


