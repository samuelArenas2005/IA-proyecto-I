from Formulacion import *

class Nodo:
    
    def __init__(self, Status, Path, Route, People,Cost):
        self.Status = Status
        self.Path = Path
        self.Route = Route
        self.People = People
        self.Cost = Cost
        

    def expandir_amplitud(self,map):
        
        posX , posY, nPeople = self.Status.get_values()
        
        nodosHijos = []
        
        directions = [
            (is_locked_up, -1, 0),
            (is_locked_down, 1, 0),
            (is_locked_right, 0, 1),
            (is_locked_left, 0, -1),
        ]
        
        for is_locked_func, dx, dy in directions:
            if not(is_locked_func(map, posX, posY)):
                new_posX, new_posY = posX + dx, posY + dy
                new_nPeople = nPeople + add_person(map, new_posX, new_posY, self.People)
                statusHijo = Status(new_posX, new_posY, new_nPeople)
                if not(is_cycle(statusHijo.get_values(), self.Route)):
                    if new_nPeople > nPeople:
                        people = self.People | {(new_posX, new_posY)}
                    else:
                        people = self.People
                    new_cost = self.Cost + add_cost(map,new_posX,new_posY)
                    nodoHijo = Nodo(statusHijo, self.Path + [statusHijo.get_values()], self.Route | {statusHijo.get_values()}, people,new_cost)
                    nodosHijos.append(nodoHijo)
        
        return nodosHijos
        