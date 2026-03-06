from Formulacion import *

class Nodo:
    
    def __init__(self, Status, Path, Route, People):
        self.Status = Status
        self.Path = Path
        self.Route = Route
        self.People = People
        

    def expandir_amplitud(self,map):
        
        def create_children(statusChildren,nodosHijos,posX,posY,people):
            newNPerson = statusChildren.nPeoples + add_person(map,posX,posY,people)
            if newNPerson != statusChildren.nPeoples:
                statusChildren.nPeoples = newNPerson
                nodoHijo = Nodo(statusChildren,self.Path + [statusChildren.get_values()],self.Route | {statusChildren.get_values()},people | {(posX,posY)})
                nodosHijos.append(nodoHijo)
            else:
                nodoHijo = Nodo(statusChildren,self.Path + [statusChildren.get_values()],self.Route | {statusChildren.get_values()},people)
                nodosHijos.append(nodoHijo)
            
        
        posX , posY, nPeople = self.Status.get_values()
        
        nodosHijos = []
        
        directions = [
            (is_locked_up, -1, 0),
            (is_locked_down, 1, 0),
            (is_locked_right, 0, 1),
            (is_locked_left, 0, -1),
        ]
        
        for is_locked_func, dx, dy in directions:
            new_posX, new_posY = posX + dx, posY + dy
            if not(is_locked_func(map, posX, posY)):
                statusHijo = Status(new_posX, new_posY, nPeople)
                if not(is_cycle(statusHijo.get_values(), self.Route)):
                    create_children(statusHijo, nodosHijos, new_posX, new_posY, self.People)
        
        return nodosHijos
        