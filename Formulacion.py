class Status:
    def __init__(self,x,y,nPeoples):
        self.x = x
        self.y = y
        self.nPeoples = nPeoples
    
    def get_values(self):
        return (self.x,self.y,self.nPeoples)


def is_goal(map, status, nPeople):
    if map[status.x][status.y] == 5 and status.nPeoples == nPeople:
        return True
    
    return False

def get_limit_y(map):
    return len(map[0]) - 1

def get_limit_x(map):
    return len(map) - 1

def is_locked_up(map,posX,posY): 
    if posX == 0:
        return True
    if map[posX - 1][posY] == 1:
        return True
    
    return False

def is_locked_down(map,posX,posY): 
    if posX == get_limit_x(map):
        return True
    if map[posX + 1][posY] == 1:
        return True
    
    return False

def is_locked_left(map,posX,posY): 
    if posY == 0:
        return True
    if map[posX][posY - 1] == 1:
        return True
    
    return False

def is_locked_right(map,posX,posY): 
    if posY == get_limit_y(map):
        return True
    if map[posX][posY + 1] == 1:
        return True
    
    return False

def is_cycle(status, route):
    return status in route

def add_person(map,posX,posY,people):
    if map[posX][posY] == 4 and (posX,posY) not in people :
        return 1
    
    return 0 
  

    