class Status:
    def __init__(self,x,y,nPeoples):
        self.x = x
        self.y = y
        self.nPeoples = nPeoples
    
    def get_values(self):
        return (self.x,self.y,self.nPeoples)


def is_goal(city_map, status, nPeople):
    if city_map[status.x][status.y] == 5 and status.nPeoples == nPeople:
        return True
    
    return False

def get_limit_y(city_map):
    return len(city_map[0]) - 1

def get_limit_x(city_map):
    return len(city_map) - 1

def is_locked_up(city_map,posX,posY): 
    if posX == 0:
        return True
    if city_map[posX - 1][posY] == 1:
        return True
    
    return False

def is_locked_down(city_map,posX,posY): 
    if posX == get_limit_x(city_map):
        return True
    if city_map[posX + 1][posY] == 1:
        return True
    
    return False

def is_locked_left(city_map,posX,posY): 
    if posY == 0:
        return True
    if city_map[posX][posY - 1] == 1:
        return True
    
    return False

def is_locked_right(city_map,posX,posY): 
    if posY == get_limit_y(city_map):
        return True
    if city_map[posX][posY + 1] == 1:
        return True
    
    return False

def is_cycle(status, route):
    return status in route

def add_person(city_map,posX,posY,people):
    if city_map[posX][posY] == 4 and (posX,posY) not in people :
        return 1
    
    return 0 

def add_cost(city_map,posX,posY):
    if city_map[posX][posY] == 3:
        return 7
    return 1
  

    