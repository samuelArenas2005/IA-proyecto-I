from Formulacion import *

class Nodo:
    
    def __init__(self, Status, Path, Route, People,Cost):
        self.Status = Status
        self.Path = Path
        self.Route = Route
        self.People = People
        self.Cost = Cost
        

    def expandir_no_informada(self,city_map):
        
        posX , posY, nPeople = self.Status.get_values()
        
        nodosHijos = []
        
        directions = [
            (is_locked_up, -1, 0),
            (is_locked_down, 1, 0),
            (is_locked_right, 0, 1),
            (is_locked_left, 0, -1),
        ]
        
        for is_locked_func, dx, dy in directions:
            if not(is_locked_func(city_map, posX, posY)):
                new_posX, new_posY = posX + dx, posY + dy
                new_nPeople = nPeople + add_person(city_map, new_posX, new_posY, self.People)
                statusHijo = Status(new_posX, new_posY, new_nPeople)
                if not(is_cycle(statusHijo.get_values(), self.Route)):
                    if new_nPeople > nPeople:
                        people = self.People | {(new_posX, new_posY)}
                    else:
                        people = self.People
                    new_cost = self.Cost + add_cost(city_map,new_posX,new_posY)
                    nodoHijo = Nodo(statusHijo, self.Path + [statusHijo.get_values()], self.Route | {statusHijo.get_values()}, people,new_cost)
                    nodosHijos.append(nodoHijo)
        
        return nodosHijos

    def expandir_no_informada_con_orden(self, city_map, orden_operadores):
        """
        Expande el nodo siguiendo un orden específico de operadores.
        
        Args:
            city_map: Matriz del mapa
            orden_operadores: Lista con el orden, ej: ['izquierda', 'abajo', 'derecha', 'arriba']
        
        Returns:
            Lista de nodos hijos en el orden especificado
        """
        posX, posY, nPeople = self.Status.get_values()
        nodosHijos = []
        
        # Mapeo de nombres a funciones y direcciones
        operadores_map = {
            'izquierda': (is_locked_left, 0, -1),
            'abajo': (is_locked_down, 1, 0),
            'derecha': (is_locked_right, 0, 1),
            'arriba': (is_locked_up, -1, 0)
        }
        
        # Expandir según el orden especificado
        for nombre_op in orden_operadores:
            if nombre_op not in operadores_map:
                continue  # Ignorar operadores inválidos
                
            is_locked_func, dx, dy = operadores_map[nombre_op]
            
            if not is_locked_func(city_map, posX, posY):
                new_posX, new_posY = posX + dx, posY + dy
                new_nPeople = nPeople + add_person(city_map, new_posX, new_posY, self.People)
                statusHijo = Status(new_posX, new_posY, new_nPeople)
                
                # Evitar ciclos (ya implementado correctamente)
                if not is_cycle(statusHijo.get_values(), self.Route):
                    if new_nPeople > nPeople:
                        people = self.People | {(new_posX, new_posY)}
                    else:
                        people = self.People
                    new_cost = self.Cost + add_cost(city_map, new_posX, new_posY)
                    nodoHijo = Nodo(
                        statusHijo,
                        self.Path + [statusHijo.get_values()],
                        self.Route | {statusHijo.get_values()},
                        people,
                        new_cost
                    )
                    nodosHijos.append(nodoHijo)
        
        return nodosHijos
        