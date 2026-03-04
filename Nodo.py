from Formulacion import *
import copy

class Nodo:
    
    def __init__(self, nodoPadre, Status, Route,people):
        self.nodoPadre = nodoPadre
        self.Status = Status
        self.Route = Route
        self.People = people
    
    def add_element_route(self,Status):
        self.Route.append(Status.get_values())

    def expandir(self,map,nodoPadre):
        
        def create_children(statusChildren,nodosHijos,posX,posY,people):
            newNPerson = statusChildren.nPeoples + add_person(map,posX,posY,people)
            if newNPerson != statusChildren.nPeoples:
                statusChildren.nPeoples = newNPerson
                nodoHijo = Nodo(nodoPadre,statusChildren,nodoPadre.Route + [statusChildren.get_values()],people + [(posX,posY)])
                nodosHijos.append(nodoHijo)
            else:
                nodoHijo = Nodo(nodoPadre,statusChildren,nodoPadre.Route + [statusChildren.get_values()],people)
                nodosHijos.append(nodoHijo)
            
        
        posX , posY, nPeople = nodoPadre.Status.get_values()
        
        nodosHijos = []
        
        if not(is_locked_up(map,posX,posY)):
            statusHijo = Status(posX-1,posY,nPeople)
            if not(is_cycle(statusHijo.get_values(),nodoPadre.Route)):
                create_children(statusHijo,nodosHijos,posX-1,posY,nodoPadre.People)

        if not(is_locked_down(map,posX,posY)):
            statusHijo = Status(posX+1,posY,nPeople)
            if not(is_cycle(statusHijo.get_values(),nodoPadre.Route)):
                create_children(statusHijo,nodosHijos,posX+1,posY,nodoPadre.People)

        if not(is_locked_right(map,posX,posY)):
            statusHijo = Status(posX,posY+1,nPeople)
            if not(is_cycle(statusHijo.get_values(),nodoPadre.Route)):
                create_children(statusHijo,nodosHijos,posX,posY+1,nodoPadre.People)
        
        if not(is_locked_left(map,posX,posY)):
            statusHijo = Status(posX,posY-1,nPeople)
            if not(is_cycle(statusHijo.get_values(),nodoPadre.Route)):
                create_children(statusHijo,nodosHijos,posX,posY-1,nodoPadre.People)
        
        return nodosHijos
        