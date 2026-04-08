# Proyecto IA - Simulador de Rutas en Ciudad 10×10

Este proyecto es un simulador de rutas en una ciudad isométrica usando inteligencia artificial y visualización 3D con Three.js.

## Requisitos previos

- Python 3.8+ instalado.
- Paquete `eel` instalado en el entorno de Python.

### Instalar dependencias

1. Crear y activar un entorno virtual (recomendado):

```bash
python -m venv venv
# Windows
venv\Scripts\activate
# macOS / Linux
source venv/bin/activate
```

2. Instalar Eel:

```bash
pip install eel
```

> Nota: no existe `requirements.txt` en este repositorio, así que solo necesitas `eel` para ejecutar la interfaz.

## Cómo ejecutar la prueba desde `main.py`

Desde la carpeta raíz del proyecto ejecuta:

```bash
python main.py
```

o si tu sistema usa `py`:

```bash
py main.py
```

Esto iniciará la aplicación con Eel y cargará el menú principal en una ventana de navegador.

## Mapa: cómo añadir un nuevo archivo

Todos los mapas deben añadirse en:

```
mapas/pruebas
```

### Formato requerido

- Debe ser un archivo de texto con extensión `.txt`.
- Debe contener exactamente `10` filas y `10` columnas.
- Cada fila debe tener `10` valores separados por espacios.
- El ancho y alto deben ser `10×10`.

### Significado de los valores

Cada número en la matriz representa un tipo de casilla:

- `0` = calle libre
- `1` = edificio / muro
- `2` = inicio del vehículo
- `3` = tráfico / semáforo
- `4` = persona pendiente de recoger
- `5` = meta / destino final

### Ejemplo de mapa válido

```text
4 1 1 1 1 1 1 1 1 1
0 1 1 5 0 0 3 0 0 0
2 1 1 0 1 0 1 0 1 0
0 0 0 0 3 0 0 0 3 0
0 1 1 0 1 1 1 1 1 0
0 0 0 0 1 1 0 0 0 0
4 1 1 1 1 1 0 1 1 1
0 1 0 0 0 1 0 0 0 1
0 1 0 1 0 1 1 1 0 1
0 0 0 1 0 0 0 0 0 1
```

## Qué contiene cada archivo Python

### `main.py`

- Es el backend principal de la aplicación.
- Inicializa Eel con la carpeta `web`.
- Expone funciones para el frontend:
  - cargar mapas desde archivo
  - obtener la matriz de la ciudad
  - seleccionar algoritmo, mapa y vehículo
  - obtener la lista de mapas disponibles
  - calcular la ruta usando el algoritmo seleccionado
- Inicia la interfaz en `menu.html`.

### `Utilidades.py`

- Funciones auxiliares para trabajar con la matriz del mapa.
- Carga archivos de mapa en texto.
- Inicializa la matriz por defecto.
- Determina ubicaciones de inicio y fin.
- Cuenta personas y convierte la ruta en coordenadas limpias.

### `Formulacion.py`

- Define la clase `Status` que guarda la posición y cantidad de personas recogidas.
- Contiene las reglas de objetivo y bloqueo de movimiento:
  - comprobar si se alcanzó la meta
  - detectar paredes y límites
  - evitar ciclos
  - calcular el costo de movimiento según el tipo de casilla

### `Nodo.py`

- Modela un nodo de búsqueda.
- Lleva información de estado, camino, ruta, personas recogidas, costo y heurística.
- Define cómo expandir hijos en las búsquedas:
  - expansión no informada normal
  - expansión no informada con orden personalizado para profundidad
  - expansión informada para heurísticas
- Contiene la función de heurística para A* y Avara.

### `busquedaAmplitud.py`

- Implementa búsqueda por amplitud (BFS).
- Usa una cola de primero en entrar, primero en salir.
- Devuelve el nodo meta y el árbol de expansión.

### `busquedaCostoUniforme.py`

- Implementa búsqueda de costo uniforme.
- Ordena los nodos por costo acumulado.
- Ideal para encontrar caminos de menor costo en mapas con pesos.

### `busquedaProfundidad.py`

- Implementa búsqueda en profundidad.
- Soporta un orden de operadores configurable (`izquierda`, `abajo`, `derecha`, `arriba`).
- Usa pila LIFO para expansión.

### `busquedaAvara.py`

- Implementa búsqueda avara (greedy best-first).
- Ordena por heurística solamente.
- No garantiza optimalidad, pero puede ser más rápida.

### `busquedaAEstrella.py`

- Implementa A*.
- Ordena por `costo + heurística`.
- Usa la función heurística para guiar la búsqueda hacia la meta.

## Qué contiene la carpeta `web`

La carpeta `web` contiene toda la interfaz gráfica y las rutas del frontend.

### `web/api.js`

- Archivo de utilidades del frontend para comunicación con Eel.
- Maneja llamadas desde el navegador hacia el backend Python.

### `web/menu.html`, `web/menu.css`, `web/menu.js`

- Interfaz de menú principal.
- Permite seleccionar algoritmo, mapa y vehículo.
- Contiene modales y botones de navegación.
- `menu.js` maneja la animación y lógica del menú.

### `web/RenderMap/`

Contiene la vista principal de la simulación 3D:

- `index.html`: página de la escena isométrica.
- `style.css`: estilos de la interfaz de simulación.
- `app.js`: lógica de UI y comunicación con Python.
- `map.js`: renderizado Three.js, animación del vehículo, rutas, semáforos y cámaras.

### `web/SelectMap/`

- Página para seleccionar un mapa desde el frontend.
- Permite elegir archivos de `mapas/pruebas`.

### `web/SelectVehicle/`

- Página para seleccionar modelo de vehículo.
- `models.js` define vehículos disponibles.
- `assets/` contiene archivos de ejemplo y modelos `.glb` para cargar.

### `web/CreateMap/`

- Editor de mapas.
- Permite crear o editar mapas de forma visual.
- Genera archivos nuevos que también deben guardarse posteriormente en `mapas/pruebas`.

## Nota importante

- Cualquier mapa nuevo debe guardarse en `mapas/pruebas`.
- Debe respetar el formato exacto de `10×10`.
- Los valores numéricos definen el tipo de celda según la leyenda anterior.

## Recomendaciones

- Mantén los nombres de archivo `.txt` claros, como `mapa26.txt`, `mapa27.txt`, etc.
- Verifica que no haya filas vacías.
- Si agregas un mapa desde el editor visual, comprueba que el archivo se guarde en `mapas/pruebas`.

---

Este README describe cómo ejecutar el simulador, añadir mapas, y qué hace cada archivo del proyecto.