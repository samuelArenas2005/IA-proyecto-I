Universidad del Valle
Facultad de Ingeniería
Escuela de Ingeniería de Sistemas y Computación
Inteligencia Artificial
Proyecto 1
Robotaxi Zoox. Una versión avanzada del robotaxi Zoox podrá recoger a varios pasajeros
hasta llevarlos a un único destino. La ciudad está representada por medio de una cuadrícula de
10x10 que contiene las calles, intersecciones y dos tipos de flujo vehicular, bajo y alto, cada
uno de los cuales afecta el costo de la solución. El objetivo de este proyecto es utilizar
algoritmos de búsqueda para ayudar al vehículo inteligente a ubicar a todos los pasajeros y luego
encontrar un camino hasta el destino. Para efectos de la simulación, se supondrá que todos los
pasajeros se dirigen a un mismo punto. Considere la siguiente abstracción de una ciudad
inteligente.
En cada búsqueda que emprenda el vehículo podrá realizar desplazamientos simples tales como
moverse arriba, abajo, izquierda, y derecha. Tenga en cuenta que el costo de cada movimiento
cuando se llega a una casilla que representa una vía libre (flujo vehicular bajo) es 1. Por su parte,
si se llega a una casilla con flujo vehicular alto, el costo es de 7. Además, si el vehículo llega a
una casilla donde hay un pasajero, automáticamente éste se subirá al vehículo. Los costos de los
desplazamientos no varían cuando hay pasajeros en el vehículo. La cantidad de pasajeros a
recoger puede variar de un ambiente a otro, es decir, aunque en el ejemplo hay dos pasajeros,
otro ambiente de prueba puede tener una cantidad diferente, pero siempre habrá al menos un
pasajero.
Punto de
partida del
vehículo
Flujo vehicular
alto
Destino
Vía libre
(flujo vehicular bajo)
Muro
Pasajero
La información del mundo se representa por medio de los siguientes números:
• 0 si es una casilla libre (flujo vehicular bajo)
• 1 si es un muro
• 2 si es el punto de partida del vehículo
• 3 si es una casilla con flujo vehicular alto
• 4 si es un pasajero
• 5 si es el destino
Por ejemplo, el mundo mostrado en la figura se representa mediante la matriz:
4 1 1 1 1 1 1 1 1 1
0 1 1 0 0 0 3 0 0 0
2 1 1 0 1 0 1 0 1 0
0 0 0 0 3 0 0 0 3 0
0 1 1 0 1 1 1 1 1 0
0 0 0 0 1 1 0 0 0 5
4 1 1 1 1 1 0 1 1 1
0 1 0 0 0 1 0 0 0 1
0 1 0 1 0 1 1 1 0 1
0 0 0 1 0 0 0 0 0 1
Usted debe desarrollar una aplicación que permita:
• Ingresar los datos de un mundo determinado por medio de un archivo de texto que siga las
convenciones dadas anteriormente.
• Desplegar gráficamente el mundo del agente en su estado inicial, es decir, tal como se lee del
archivo.
• Seleccionar el tipo de algoritmo de búsqueda a aplicar: “No informada” ó “Informada”
• Si se selecciona búsqueda “No informada” se puede elegir entre “Amplitud”, “Costo uniforme” y
“Profundidad evitando ciclos”.
• Si se selecciona búsqueda “Informada” se puede elegir entre “Avara” y “A*”.
• Una vez aplicado un algoritmo se debe mostrar una animación en la interfaz gráfica con el
conjunto de movimientos que realiza el agente.
• Después de aplicar un algoritmo se debe mostrar un reporte con la siguiente información:
cantidad de nodos expandidos, profundidad del árbol, y tiempo de cómputo. En el caso de los
algoritmos de Costo y A* se debe mostrar también el costo de la solución encontrada.
• En todos los algoritmos evite ciclos. Sin embargo, cuando el vehículo recoja un pasajero debe
dejar que se devuelva.
Además, se debe entregar un informe que contenga:
• Explicación de la heurística utilizada.
• Justificación de la admisibilidad de la heurística planteada.