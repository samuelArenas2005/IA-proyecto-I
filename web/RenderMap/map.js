import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

/* ══════════════════════════════════════════════════════════════
   map.js – Ciudad isométrica 10×10  (Three.js)
   Vista isométrica tipo SimCity / Habbo Hotel
   Iluminación brillante y colores saturados
══════════════════════════════════════════════════════════════ */

const TILE   = 2;
const GRID   = 10;
const OFFSET = (GRID * TILE) / 2;

// ── Paletas ───────────────────────────────────────────────────────────────────
const BUILDING_PALETTE = [0x7c6fff, 0x5c8fff, 0x3fb8f5, 0x9a63ff, 0x4c7cfa, 0x38d9a9];
const CAR_PALETTE      = [0xff6b6b, 0xffa94d, 0x69db7c, 0x74c0fc, 0xf783ac];
const ROAD_COLOR       = 0x343a50;
const ROAD_MARK        = 0xffd43b;
const SIDEWALK_COLOR   = 0x464d6a;
const GROUND_COLOR     = 0x1c1f38;

// ── Posiciones de parque (coordenadas fijas, máx 2 en todo el mapa) ────────────
// Cambia estos valores para mover los parques a otras celdas con valor 1
const PARK_POSITIONS = new Set(['1,1', '6,8']);
function isPark(row, col) { return PARK_POSITIONS.has(`${row},${col}`); }

// ── Presets de hora del día ────────────────────────────────────────────────────
let currentTimeIdx = 1; // 0=amanecer 1=día 2=atardecer 3=noche
let isLightMode = false; // controla si el tema es claro
const TIME_PRESETS = [
  { // 0 – Amaneciendo
    label: '🌅 Amaneciendo', icon: '🌅', shortLabel: 'Amanecer',
    bg:       0x160a14,  fogColor: 0x2d1015,
    lightBg:  0xffd4a8,  lightFog: 0xffd4a8,
    ambColor: 0xff9a4a,  ambInt:   0.55,
    sunColor: 0xff8c00,  sunInt:   1.1,  sunPos: [5,  12, 35],
    filColor: 0xff6b6b,  filInt:   0.35,
    rimColor: 0x12082a,  rimInt:   0.1,
    winInt:   0.55,
  },
  { // 1 – Mañana / Tarde
    label: '☀️ Mañana · Tarde', icon: '☀️', shortLabel: 'Día',
    bg:       0x1a1d33,  fogColor: 0x1a1d33,
    lightBg:  0xc8dff7,  lightFog: 0xd8ecff,
    ambColor: 0xffffff,  ambInt:   1.4,
    sunColor: 0xfff8e7,  sunInt:   2.0,  sunPos: [25, 40, 20],
    filColor: 0xaad4ff,  filInt:   0.8,
    rimColor: 0xffd6a5,  rimInt:   0.5,
    winInt:   0.05,
  },
  { // 2 – Anocheciendo
    label: '🌆 Anocheciendo', icon: '🌆', shortLabel: 'Atardecer',
    bg:       0x0d0818,  fogColor: 0x12081e,
    lightBg:  0xffb4c8,  lightFog: 0xffc4d4,
    ambColor: 0xc86dff,  ambInt:   0.3,
    sunColor: 0xff4500,  sunInt:   0.65, sunPos: [35,  6, 20],
    filColor: 0x8b44cc,  filInt:   0.45,
    rimColor: 0xff7700,  rimInt:   0.2,
    winInt:   0.75,
  },
  { // 3 – Noche
    label: '🌙 Noche', icon: '🌙', shortLabel: 'Noche',
    bg:       0x050710,  fogColor: 0x050710,
    lightBg:  0x8898c8,  lightFog: 0x9aaad8,
    ambColor: 0x1030a0,  ambInt:   0.12,
    sunColor: 0x3050d0,  sunInt:   0.15, sunPos: [-10, 25, -15],
    filColor: 0x050a30,  filInt:   0.08,
    rimColor: 0x02040a,  rimInt:   0.03,
    winInt:   1.3,
  },
];

// ── Geometrías compartidas ────────────────────────────────────────────────────
function geo(type, ...args) { return new THREE[type + 'Geometry'](...args); }
const G = {
  road:       geo('Box', TILE * .99, .1, TILE * .99),
  mark:       geo('Box', .07, .01, .6),
  sidewalk:   geo('Box', TILE * .92, .14, TILE * .92),
  bldBase:    geo('Box', TILE * .88, .12, TILE * .88),
  roof:       geo('Box', TILE * .72, .09, TILE * .72),
  window:     geo('Box', .14, .14, .025),
  carBody:    geo('Box', .58, .2, .34),
  carTop:     geo('Box', .34, .15, .28),
  headlight:  geo('Box', .06, .06, .06),
  wheel:      new THREE.CylinderGeometry(.065, .065, .07, 8),
  personBody: new THREE.CylinderGeometry(.06, .075, .24, 8),
  personHead: new THREE.SphereGeometry(.095, 8, 7),
  pole:       new THREE.CylinderGeometry(.03, .03, .9, 8),
  flag:       geo('Box', .42, .24, .03),
  ring:       new THREE.TorusGeometry(TILE * .29, .045, 8, 28),
  marker:     new THREE.CircleGeometry(TILE * .28, 20),
  ground:     geo('Plane', GRID * TILE + 4, GRID * TILE + 4),
  startArrow: new THREE.ConeGeometry(.2, .5, 3),
};

// ── Helper: Mesh ──────────────────────────────────────────────────────────────
function m(geometry, color, opts = {}) {
  const mat = new THREE.MeshLambertMaterial({ color, ...opts });
  return new THREE.Mesh(geometry, mat);
}
function em(geometry, color, intensity = .8) {
  return m(geometry, color, { emissive: color, emissiveIntensity: intensity });
}

// ──────────────────────────────────────────────────────────────────────────────
//  CONSTRUCTORES DE TILES
// ──────────────────────────────────────────────────────────────────────────────

function roadBase() {
  const g = new THREE.Group();
  const road = m(G.road, ROAD_COLOR); road.position.y = .05; g.add(road);
  const mk   = em(G.mark, ROAD_MARK, .5); mk.position.y = .11; g.add(mk);
  return g;
}

function buildingTile(row, col) {
  const g = new THREE.Group();

  // acera / base
  const sw = m(G.sidewalk, SIDEWALK_COLOR); sw.position.y = .07; g.add(sw);

  // cuerpo del edificio
  const height   = 1.2 + ((row * 13 + col * 7) % 3) * .9;  // 1.2 – 2.9
  const colorIdx = (row * 3 + col * 5) % BUILDING_PALETTE.length;
  const color    = BUILDING_PALETTE[colorIdx];
  const bGeo     = new THREE.BoxGeometry(TILE * .68, height, TILE * .68);
  const bMesh    = m(bGeo, color);
  bMesh.position.y = .13 + height / 2;
  g.add(bMesh);

  // techo más oscuro
  const roof = m(G.roof, darken(color, .55)); roof.position.y = .13 + height + .05; g.add(roof);

  // ventanas emissive (brillantes)
  const floors = Math.floor(height / .75);
  for (let fy = 0; fy < floors; fy++) {
    const wy = .13 + .45 + fy * .72;
    [-1, 1].forEach(s => {
      // frente
      const wf = em(G.window, 0xfff0a0, .95); wf.position.set(s * .22, wy, TILE * .34 + .01); g.add(wf);
      // lateral
      const ws = em(G.window, 0xfff0a0, .95); ws.position.set(TILE * .34 + .01, wy, s * .22); g.add(ws);
    });
  }
  return g;
}

function darken(hex, f) {
  const r = ((hex >> 16) & 0xff) * f | 0;
  const g = ((hex >>  8) & 0xff) * f | 0;
  const b = ( hex        & 0xff) * f | 0;
  return (r << 16) | (g << 8) | b;
}

/** Tile de parque: césped verde + árboles + camino */
function parkTile() {
  const g = new THREE.Group();

  // Suelo de césped
  const grassGeo = new THREE.BoxGeometry(TILE * .99, .1, TILE * .99);
  const grass = m(grassGeo, 0x2d9e4e); grass.position.y = .05; g.add(grass);

  // Camino central (cruciforme)
  const pathH = new THREE.BoxGeometry(TILE * .9, .01, .32);
  const pathV = new THREE.BoxGeometry(.32, .01, TILE * .9);
  const pathMat = new THREE.MeshLambertMaterial({ color: 0xc8b89a });
  const ph = new THREE.Mesh(pathH, pathMat); ph.position.y = .115; g.add(ph);
  const pv = new THREE.Mesh(pathV, pathMat); pv.position.y = .115; g.add(pv);

  // Borde de césped más oscuro
  const borderGeo = new THREE.BoxGeometry(TILE * .99, .04, TILE * .99);
  const border = m(borderGeo, 0x1f6e35, { transparent: true, opacity: .55 });
  border.position.y = .13; g.add(border);

  // Función para crear un árbol en (tx, tz)
  function addTree(tx, tz) {
    const trunkGeo  = new THREE.CylinderGeometry(.055, .075, .38, 7);
    const foliageG1 = new THREE.SphereGeometry(.32, 8, 7);
    const foliageG2 = new THREE.SphereGeometry(.24, 8, 7);
    const trunkMat  = new THREE.MeshLambertMaterial({ color: 0x6b3d1e });
    const leafMat   = new THREE.MeshLambertMaterial({ color: 0x27ae60 });
    const leafMat2  = new THREE.MeshLambertMaterial({ color: 0x2ecc71 });

    const trunk  = new THREE.Mesh(trunkGeo,  trunkMat);  trunk.position.set(tx, .3,  tz);
    const leaf1  = new THREE.Mesh(foliageG1, leafMat);   leaf1.position.set(tx, .72, tz);
    const leaf2  = new THREE.Mesh(foliageG2, leafMat2);  leaf2.position.set(tx, .98, tz);
    g.add(trunk); g.add(leaf1); g.add(leaf2);
  }

  // 3 árboles en esquinas del parque
  addTree(-.55,  -.55);
  addTree( .55,  -.55);
  addTree(-.55,   .55);

  // Pequeño banco (caja + patas)
  const seatGeo = new THREE.BoxGeometry(.5, .06, .16);
  const legGeo  = new THREE.BoxGeometry(.05, .18, .12);
  const woodMat = new THREE.MeshLambertMaterial({ color: 0x8b5e3c });
  const seat = new THREE.Mesh(seatGeo, woodMat); seat.position.set(.42, .3, .28); g.add(seat);
  [-0.2, 0.2].forEach(lx => {
    const leg = new THREE.Mesh(legGeo, woodMat); leg.position.set(.42 + lx, .21, .28); g.add(leg);
  });

  return g;
}

function carMesh(ox, oz, ci) {
  const g   = new THREE.Group();
  const col = CAR_PALETTE[ci % CAR_PALETTE.length];
  const hl  = { color: 0xffeaa7, emissive: 0xffeaa7, emissiveIntensity: 1 };

  const body = m(G.carBody, col);  body.position.y = .1; g.add(body);
  const top  = m(G.carTop, darken(col, .75)); top.position.set(-.04, .245, 0); g.add(top);
  [-1,1].forEach(s => {
    const h = new THREE.Mesh(G.headlight, new THREE.MeshLambertMaterial(hl));
    h.position.set(.29, .1, s * .11); g.add(h);
  });
  [[-0.19, -.12],[-.19, .12],[.19, -.12],[.19, .12]].forEach(([wx, wz]) => {
    const w = m(G.wheel, 0x1a1d2e); w.rotation.z = Math.PI / 2; w.position.set(wx, .055, wz);
    g.add(w);
  });
  g.position.set(ox, .055, oz);
  return g;
}

function personMesh(ox, oz) {
  const g = new THREE.Group();
  g.name = 'person';
  
  // Cuerpo y cabeza
  const body = m(G.personBody, 0x4dabf7); body.position.y = .12; g.add(body);
  const head = m(G.personHead, 0xffcba4); head.position.y = .33; g.add(head);
  
  // Flecha indicadora flotante (cono apuntando hacia abajo)
  const arrow = em(G.startArrow, 0x74c0fc, .7);
  arrow.scale.set(.45,.45,.45);
  arrow.rotation.x = Math.PI; // Invertir para que apunte abajo
  arrow.position.y = .75;      // Altura sobre la cabeza
  g.add(arrow);

  g.position.set(ox, 0, oz);
  return g;
}

// Tile 0: solo calle
function tile0() { return roadBase(); }

// Tile 1: edificio (o parque si la posición está en PARK_POSITIONS)
function tile1(row, col) {
  return isPark(row, col) ? parkTile() : buildingTile(row, col);
}

// Tile 2: inicio carro
function tile2() {
  const g = roadBase();
  const arrow = em(G.startArrow, 0x69db7c, .9);
  arrow.rotation.z = -Math.PI / 2;
  arrow.position.set(-.55, .15, 0);
  g.add(arrow);
  return g;
}

// Tile 3: semáforo (verde por defecto)
function tile3(row, col) {
  const g = roadBase();
  
  // Poste del semáforo
  const pole = m(G.pole, 0xadb5bd);
  pole.position.set(-.35, .55, -.35);
  g.add(pole);
  
  // Caja del semáforo
  const boxGeo = new THREE.BoxGeometry(.2, .4, .1);
  const boxBody = m(boxGeo, 0x2a2a2a);
  boxBody.position.set(-.35, .85, -.35);
  g.add(boxBody);
  
  // Luz emissive (circular, y por defecto verde)
  const lightGeo = new THREE.CylinderGeometry(.08, .08, .02, 16);
  const lightMat = new THREE.MeshLambertMaterial({ 
    color: 0x00ff00,
    emissive: 0x00ff00, 
    emissiveIntensity: 1.2 
  });
  const light = new THREE.Mesh(lightGeo, lightMat);
  light.position.set(-.35, .85, -.27);
  light.rotation.z = Math.PI / 2;
  g.add(light);
  
  // Guardar referencia a la luz para cambiar color luego
  g.userData.trafficLight = { light, lightMat, isRed: false };
  
  return g;
}

// Tile 4: calle + persona (la persona está en la acera, el carro puede pasar)
function tile4() {
  const g = roadBase();
  // Franja de acera lateral para que la persona no esté en el asfalto
  const sidewalkGeo = new THREE.BoxGeometry(.3, .12, TILE * .99);
  const sw = m(sidewalkGeo, SIDEWALK_COLOR); sw.position.set(TILE * .34, .06, 0); g.add(sw);
  // Persona de pie en la acera
  g.add(personMesh(TILE * .35, 0));
  return g;
}

// Tile 5: meta (bandera + aro luminoso)
function tile5() {
  const g = roadBase();
  const mk = m(G.marker, 0xffffff, { transparent: true, opacity: .15 });
  mk.rotation.x = -Math.PI / 2; mk.position.y = .11;
  g.add(mk);
  const ring = em(G.ring, 0xff6b6b, .8);
  ring.rotation.x = Math.PI / 2; ring.position.y = .115;
  g.add(ring);
  const pole = m(G.pole, 0xadb5bd); pole.position.set(-.35, .55, -.35); g.add(pole);
  const flag = em(G.flag, 0xff6b6b, .7); flag.position.set(-.15, .87, -.35); g.add(flag);
  return g;
}

// ──────────────────────────────────────────────────────────────────────────────
//  ESCENA
// ──────────────────────────────────────────────────────────────────────────────
function buildCity(matrix) {
  const container = document.getElementById('map-canvas');
  const W = container.clientWidth;
  const H = container.clientHeight;

  // ── Escena ──
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x1a1d33);
  // niebla muy suave, solo para profundidad
  scene.fog = new THREE.Fog(0x1a1d33, 60, 130);

  // ── Cámara ortográfica isométrica ──
  const aspect = W / H;
  const frust  = 28;
  const camera = new THREE.OrthographicCamera(
    -frust * aspect / 2,  frust * aspect / 2,
     frust / 2,          -frust / 2,
    .1, 600
  );
  const dist = 55;
  camera.position.set(OFFSET + dist * .85, dist * .7, OFFSET + dist * .85);
  camera.lookAt(OFFSET, 0, OFFSET);
  camera.zoom = 0.85; // Vista lejana por defecto
  camera.updateProjectionMatrix();

  // ── Renderer ──
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(W, H);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  container.appendChild(renderer.domElement);

  // ── Controles órbita ──
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(OFFSET, 0, OFFSET);
  controls.enableDamping = true;
  controls.dampingFactor = .07;
  controls.minZoom = .4;
  controls.maxZoom = 4;
  controls.maxPolarAngle = Math.PI / 2.1;
  controls.update();

  // ── Cámara POV (sigue al vehículo) ──
  // Estado: 0=vista lejana, 1=POV (dentro del carro), 2=POV alejamiento 1, 3=POV alejamiento 2
  const POV_DIST = [0, 4, 8]; // 0=encima, 4 y 8=detrás
  const POV_HEIGHT = [0.35, 1.5, 3]; // altura según alejamiento
  const povCamera = new THREE.PerspectiveCamera(70, W / H, 0.05, 100);
  const povControls = new OrbitControls(povCamera, renderer.domElement);
  povControls.enablePan = false;
  povControls.enableZoom = false;
  povControls.minPolarAngle = Math.PI * 0.35;
  povControls.maxPolarAngle = Math.PI * 0.55;
  let povState = 0; // 0=off, 1=POV, 2=alej1, 3=alej2
  let lastPovState = -1;

  // botones externos
  document.getElementById('btn-zoom-in').onclick  = () => { if (povState === 0) { camera.zoom = Math.min(camera.zoom * 1.22, 4); camera.updateProjectionMatrix(); } };
  document.getElementById('btn-zoom-out').onclick = () => { if (povState === 0) { camera.zoom = Math.max(camera.zoom / 1.22, .4); camera.updateProjectionMatrix(); } };
  document.getElementById('btn-reset-cam').onclick = () => {
    povState = 0;
    lastPovState = -1;
    const btnPov = document.getElementById('btn-pov');
    btnPov.style.color = '';
    btnPov.title = 'Vista lejana · 1º click: POV';
    camera.position.set(OFFSET + dist * .85, dist * .7, OFFSET + dist * .85);
    camera.zoom = 0.85; camera.updateProjectionMatrix();
    controls.target.set(OFFSET, 0, OFFSET); 
    controls.update();
  };
  
  document.getElementById('btn-pov').onclick = () => {
    const btnPov = document.getElementById('btn-pov');
    povState = (povState + 1) % 4; // 0→1→2→3→0
    if (povState === 0) {
      lastPovState = -1;
      btnPov.style.color = '';
      btnPov.title = 'Vista lejana · 1º click: POV';
    } else {
      btnPov.style.color = '#74c0fc';
      btnPov.title = povState === 1 ? 'POV activo · Click: alejar' : `POV alejamiento ${povState} · Click: siguiente`;
    }
  };

  // ══ ILUMINACIÓN BRILLANTE ═══════════════════════════════════════════════════

  // Luz ambiente fuerte: ilumina todo sin sombra
  const ambLight = new THREE.AmbientLight(0xffffff, 1.4);
  scene.add(ambLight);

  // Sol principal (desde arriba-derecha): de día
  const sun = new THREE.DirectionalLight(0xfff8e7, 2.0);
  sun.position.set(25, 40, 20);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -25; sun.shadow.camera.right  =  25;
  sun.shadow.camera.top  =  25; sun.shadow.camera.bottom = -25;
  sun.shadow.camera.near = 1;   sun.shadow.camera.far    = 200;
  sun.shadow.bias = -.0003;
  scene.add(sun);

  // Luz de relleno frontal (suave celeste)
  const fill = new THREE.DirectionalLight(0xaad4ff, .8);
  fill.position.set(-15, 15, 20); scene.add(fill);

  // Luz de contorno (lateral opuesto)
  const rim = new THREE.DirectionalLight(0xffd6a5, .5);
  rim.position.set(20, 10, -25); scene.add(rim);

  // ──────────────────────────────────────────────────────────────────────────

  // ── Suelo ──
  const gndMat = new THREE.MeshLambertMaterial({ color: GROUND_COLOR });
  const gnd = new THREE.Mesh(G.ground, gndMat);
  gnd.rotation.x = -Math.PI / 2;
  gnd.position.set(OFFSET, -.08, OFFSET);
  gnd.receiveShadow = true;
  scene.add(gnd);

  // Grid sutil
  const gridMat1 = new THREE.LineBasicMaterial({ color: 0x252840 });
  const grid = new THREE.GridHelper(GRID * TILE, GRID, 0x252840, 0x252840);
  grid.position.set(OFFSET, -.05, OFFSET);
  scene.add(grid);

  // ── Construir tiles ──
  const builders = [tile0, tile1, tile2, tile3, tile4, tile5];
  let startX = 0, startZ = 0;
  const tilesGrid = {};

  for (let row = 0; row < GRID; row++) {
    for (let col = 0; col < GRID; col++) {
      const val  = matrix[row][col];
      const x    = col * TILE + TILE / 2;
      const z    = row * TILE + TILE / 2;

      let tg;
      if      (val === 1) tg = tile1(row, col);
      else if (val === 3) tg = tile3(row, col);
      else if (val === 4) tg = tile4();
      else                tg = builders[val]?.() ?? tile0();

      tg.position.set(x, 0, z);
      tg.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
      scene.add(tg);
      tilesGrid[`${row},${col}`] = tg;

      // Guardar posición inicial del carro (celda 2)
      if (val === 2) {
        startX = x;
        startZ = z;
      }
    }
  }

  // ── Carro Fijo del Jugador (Independiente) ──
  const playerCar = carMesh(0, 0, 1);
  playerCar.position.set(startX, 0, startZ);
  playerCar.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  scene.add(playerCar);

  // Variables de movimiento fluido
  let currentPath = [];
  let pathIndex = 0;
  let moveProgress = 0;
  let isMoving = false;
  let isPaused = false;
  let speedMultiplier = 1.0; // Por defecto x1

  function checkAndAnimatePerson(row, col) {
      if (matrix[row] && matrix[row][col] === 4) {
          const cellTg = tilesGrid[`${row},${col}`];
          if (cellTg) {
              const person = cellTg.getObjectByName('person');
              if (person && !person.userData.picked) {
                  person.userData.picked = true;
                  isPaused = true; // Acaba de encontrar una persona, pausamos
                  let frame = 0;
                  function jumpAnim() {
                     frame++;
                     person.position.y += 0.04;
                     person.rotation.y += 0.2;
                     person.scale.setScalar(1 - frame/25);
                     if (frame < 25) {
                         requestAnimationFrame(jumpAnim);
                     } else {
                         person.visible = false;
                         // Esperar según factor de velocidad
                         const waitTime = 1000 / speedMultiplier;
                         setTimeout(() => {
                             isPaused = false;
                         }, waitTime);
                     }
                  }
                  jumpAnim();
              }
          }
      }
  }

  function checkAndAnimateTraffic(row, col) {
      if (matrix[row] && matrix[row][col] === 3) {
          const cellTg = tilesGrid[`${row},${col}`];
          if (cellTg && cellTg.userData.trafficLight) {
              const tl = cellTg.userData.trafficLight;
              if (!tl.isRed) {
                  tl.isRed = true;
                  isPaused = true;
                  
                  // Cambiar a rojo
                  tl.lightMat.color.setHex(0xff0000);
                  tl.lightMat.emissive.setHex(0xff0000);
                  
                  // Esperar 2 segundos según factor de velocidad
                  const waitTime = 2000 / speedMultiplier;
                  setTimeout(() => {
                      // Volver a verde
                      tl.lightMat.color.setHex(0x00ff00);
                      tl.lightMat.emissive.setHex(0x00ff00);
                      tl.isRed = false;
                      isPaused = false;
                  }, waitTime);
              }
          }
      }
  }

  window.startCarMovement = (path) => {
    if (path && path.error) {
      console.error(path.error);
      if (window.mostrar_notificacion) window.mostrar_notificacion("Error ruta: " + path.error);
      return;
    }
    if (!playerCar || !path || path.length < 2) return;
    
    // Resetear todos los semáforos a verde y personas antes de iniciar
    scene.traverse(o => {
      if (o.userData.trafficLight) {
        const tl = o.userData.trafficLight;
        tl.isRed = false;
        tl.lightMat.color.setHex(0x00ff00);
        tl.lightMat.emissive.setHex(0x00ff00);
      }
      if (o.name === 'person') {
        o.userData.picked = false;
        o.visible = true;
        o.position.y = 0;
        o.rotation.y = 0;
        o.scale.set(1, 1, 1);
      }
    });
    
    currentPath = path;
    pathIndex = 0;
    moveProgress = 0;
    isMoving = true;
    isPaused = false;
    
    // Snap rápido a posición de inicio
    let r0 = path[0][0], c0 = path[0][1];
    playerCar.position.set(c0 * TILE + TILE / 2, 0, r0 * TILE + TILE / 2);
    
    checkAndAnimatePerson(r0, c0);
    checkAndAnimateTraffic(r0, c0);
  };


  // ── Recopilar materiales emissive (ventanas + meta) para actualizarlos con la hora ──
  const winMats  = []; // ventanas de edificios (amarillo)
  const goalMats = []; // aro + bandera de meta  (rojo)
  scene.traverse(o => {
    if (!o.isMesh || !o.material) return;
    const hex = o.material.emissive?.getHex();
    if (hex === 0xfff0a0) winMats.push(o.material);
    if (hex === 0xff6b6b || hex === 0xffd43b) goalMats.push(o.material);
  });

  // ── Función de cambio de hora (aplica preset al vuelo) ──────────────────────
  function applyTime(idx) {
    const p = TIME_PRESETS[idx];
    const bgHex  = isLightMode ? p.lightBg  : p.bg;
    const fogHex = isLightMode ? p.lightFog : p.fogColor;
    scene.background.setHex(bgHex);
    if (scene.fog) scene.fog.color.setHex(fogHex);
    ambLight.color.setHex(p.ambColor);  ambLight.intensity = p.ambInt;
    sun.color.setHex(p.sunColor);       sun.intensity      = p.sunInt;
    sun.position.set(...p.sunPos);
    fill.color.setHex(p.filColor);      fill.intensity     = p.filInt;
    rim.color.setHex(p.rimColor);       rim.intensity      = p.rimInt;
    winMats.forEach(mat  => { mat.emissiveIntensity = p.winInt;        });
    goalMats.forEach(mat => { mat.emissiveIntensity = Math.min(p.winInt + .2, 1.4); });
    // Actualizar botón (SVG icono) y etiqueta corta
    const btnIcon = document.getElementById('icon-time');
    const lbl     = document.getElementById('time-label');
    if (btnIcon && window._FA) {
      const { SUN, MOON, SUNRISE, SUNSET } = window._FA;
      const classPaths = [SUNRISE, SUN, SUNSET, MOON];
      btnIcon.className = classPaths[idx];
      // Actualizar data-state en el padre si hace falta
      const btn = document.getElementById('btn-time');
      if (btn) btn.dataset.state = idx;
    }
    if (lbl) lbl.textContent = p.shortLabel;
  }

  // Exponer globalmente para que app.js/HTML pueda llamarlo
  window.nextTimeOfDay = () => {
    currentTimeIdx = (currentTimeIdx + 1) % TIME_PRESETS.length;
    applyTime(currentTimeIdx);
  };

  // Cambiar velocidad del vehículo
  window.cycleSpeed = () => {
    const speeds = [0.5, 1.0, 1.5, 2.0, 2.5, 3.0];
    const currentIdx = speeds.indexOf(speedMultiplier);
    const nextIdx = (currentIdx + 1) % speeds.length;
    speedMultiplier = speeds[nextIdx];
    
    // Actualizar botón con el nuevo valor
    const btnSpeed = document.getElementById('btn-speed');
    if (btnSpeed) {
      btnSpeed.dataset.speed = speedMultiplier.toFixed(1);
      btnSpeed.textContent = 'x' + speedMultiplier.toFixed(1);
    }
  };

  // ── Cambio de tema claro/oscuro ─────────────────────────────────────────
  window.setMapTheme = (lightOn) => {
    isLightMode = lightOn;
    // Fondo y niebla
    applyTime(currentTimeIdx);
    // Suelo
    gndMat.color.setHex(lightOn ? 0xd4d8ec : GROUND_COLOR);
    // Grid
    const gridColor = lightOn ? 0xb0b8d8 : 0x252840;
    grid.material.forEach
      ? grid.material.forEach(m => m.color?.setHex(gridColor))
      : (grid.material.color?.setHex(gridColor));
  };

  // Aplicar estado inicial (día)
  applyTime(currentTimeIdx);

  // ── Resize handler ──
  window.addEventListener('resize', () => {
    const nW = container.clientWidth, nH = container.clientHeight, nA = nW / nH;
    camera.left = -frust * nA / 2; camera.right = frust * nA / 2;
    camera.updateProjectionMatrix();
    
    povCamera.aspect = nA;
    povCamera.updateProjectionMatrix();
    
    renderer.setSize(nW, nH);
  });

  // ── Animation loop ──
  (function loop() {
    requestAnimationFrame(loop);

    // Sistema de movimiento a pasos pequeños, de mitad en mitad
    if (isMoving && !isPaused && currentPath && pathIndex < currentPath.length - 1) {
      // Avanzar de manera fluida (velocidad por frame, multiplicada por speedMultiplier)
      moveProgress += 0.02 * speedMultiplier; 
      
      if (moveProgress >= 1) {
        moveProgress = 0;
        pathIndex++;
        
        if (pathIndex < currentPath.length) {
            checkAndAnimatePerson(currentPath[pathIndex][0], currentPath[pathIndex][1]);
            checkAndAnimateTraffic(currentPath[pathIndex][0], currentPath[pathIndex][1]);
        }
      }
      
      if (pathIndex < currentPath.length - 1) {
        const p1 = currentPath[pathIndex];
        const p2 = currentPath[pathIndex + 1];
        
        // Coalescer a formato coord de pantalla (centro celda)
        const x1 = p1[1] * TILE + TILE / 2;
        const z1 = p1[0] * TILE + TILE / 2;
        const x2 = p2[1] * TILE + TILE / 2;
        const z2 = p2[0] * TILE + TILE / 2;
        
        // Interpolación lineal posición
        playerCar.position.x = x1 + (x2 - x1) * moveProgress;
        playerCar.position.z = z1 + (z2 - z1) * moveProgress;
        
        // Rotación suave 
        const dx = x2 - x1;
        const dz = z2 - z1;
        if (dx !== 0 || dz !== 0) {
           const targetAngle = Math.atan2(-dz, dx);
           let diff = targetAngle - playerCar.rotation.y;
           
           // Normalizar para que la rotacion tome camino corto en dar la vuelta
           while (diff < -Math.PI) diff += Math.PI * 2;
           while (diff >  Math.PI) diff -= Math.PI * 2;
           
           playerCar.rotation.y += diff * 0.15; 
        }
      } else {
        if (isMoving) {
          isMoving = false;
          
          // Confeti si la meta es 5
          const endP = currentPath[currentPath.length - 1];
          if (matrix[endP[0]] && matrix[endP[0]][endP[1]] === 5) {
             const cx = playerCar.position.x;
             const cz = playerCar.position.z;
             
             const particleCount = 100;
             const geo = new THREE.BufferGeometry();
             const pos = new Float32Array(particleCount * 3);
             const colors = new Float32Array(particleCount * 3);
             const vels = [];
             const pal = [0xff6b6b, 0xffa94d, 0x69db7c, 0x74c0fc, 0xf783ac];
             for(let i=0; i<particleCount; i++){
                 pos[i*3] = cx + (Math.random()-0.5)*1.5;
                 pos[i*3+1] = 1.6; // height
                 pos[i*3+2] = cz + (Math.random()-0.5)*1.5;
                 vels.push({
                     x: (Math.random()-0.5)*0.1,
                     y: Math.random()*0.15 + 0.1,
                     z: (Math.random()-0.5)*0.1
                 });
                 const c = new THREE.Color(pal[Math.floor(Math.random()*pal.length)]);
                 colors[i*3] = c.r;
                 colors[i*3+1] = c.g;
                 colors[i*3+2] = c.b;
             }
             geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
             geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
             const mat = new THREE.PointsMaterial({ size: 0.15, vertexColors: true, transparent: true });
             const confetti = new THREE.Points(geo, mat);
             scene.add(confetti);
             
             let cFrame = 0;
             function cAnim(){
                 cFrame++;
                 const pAttr = geo.getAttribute('position');
                 for(let i=0; i<particleCount; i++){
                     let px = pAttr.getX(i), py = pAttr.getY(i), pz = pAttr.getZ(i);
                     vels[i].y -= 0.006; // gravity
                     px += vels[i].x; py += vels[i].y; pz += vels[i].z;
                     pAttr.setXYZ(i, px, py, pz);
                 }
                 pAttr.needsUpdate = true;
                 if(cFrame < 150) requestAnimationFrame(cAnim);
                 else {
                     scene.remove(confetti);
                     geo.dispose(); mat.dispose();
                 }
             }
             cAnim();
          } else {
             // Si el camino termina en otro lugar que no es 5 (error / enojo)
             const cx = playerCar.position.x;
             const cz = playerCar.position.z;
             
             const particleCount = 20;
             const geo = new THREE.BufferGeometry();
             const pos = new Float32Array(particleCount * 3);
             const colors = new Float32Array(particleCount * 3);
             const vels = [];
             for(let i=0; i<particleCount; i++){
                 pos[i*3] = cx + (Math.random()-0.5)*0.8;
                 pos[i*3+1] = 0.8; // Salen de más abajo, sobre el auto
                 pos[i*3+2] = cz + (Math.random()-0.5)*0.8;
                 vels.push({
                     x: (Math.random()-0.5)*0.02,
                     y: Math.random()*0.04 + 0.02, 
                     z: (Math.random()-0.5)*0.02
                 });
                 // Color enfadado (rojos oscuros y algo naranjas)
                 const val = Math.random();
                 colors[i*3] = 0.8 + (Math.random() * 0.2); // R fuerte
                 colors[i*3+1] = val * 0.3; // poco G
                 colors[i*3+2] = val * 0.2; // poco B
             }
             geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
             geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
             const mat = new THREE.PointsMaterial({ size: 0.25, vertexColors: true, transparent: true, opacity: 0.9 });
             const angerParticles = new THREE.Points(geo, mat);
             scene.add(angerParticles);
             
             let aFrame = 0;
             function aAnim(){
                 aFrame++;
                 const pAttr = geo.getAttribute('position');
                 for(let i=0; i<particleCount; i++){
                     let px = pAttr.getX(i), py = pAttr.getY(i), pz = pAttr.getZ(i);
                     // suben como humo enojado y tiemblan
                     px += vels[i].x + (Math.random() - 0.5) * 0.05;
                     py += vels[i].y; 
                     pz += vels[i].z + (Math.random() - 0.5) * 0.05;
                     pAttr.setXYZ(i, px, py, pz);
                 }
                 pAttr.needsUpdate = true;
                 mat.opacity = 0.9 * (1 - aFrame/60); // se esfuman rápido
                 
                 if(aFrame < 60) {
                     requestAnimationFrame(aAnim);
                 } else {
                     scene.remove(angerParticles);
                     geo.dispose(); mat.dispose();
                 }
             }
             aAnim();
          }
        }
      }
    }

    if (povState > 0) {
        // POV: 1=encima del carro (original), 2-3=alejamientos detrás
        const idx = povState - 1;
        const distPov = POV_DIST[idx];
        const heightPov = POV_HEIGHT[idx];
        const angle = playerCar.rotation.y;
        const behindX = -Math.cos(angle) * distPov;
        const behindZ = Math.sin(angle) * distPov;
        povCamera.position.set(
            playerCar.position.x + behindX,
            playerCar.position.y + heightPov,
            playerCar.position.z + behindZ
        );
        if (povState === 1) {
            // POV original: target adelante para poder mirar con el mouse
            const focusDist = 5;
            if (lastPovState !== 1) {
                // Primera vez en POV: mirar hacia adelante (dirección del carro)
                const fwdX = Math.cos(angle);
                const fwdZ = -Math.sin(angle);
                povControls.target.set(
                    playerCar.position.x + fwdX * focusDist,
                    playerCar.position.y + 0.35,
                    playerCar.position.z + fwdZ * focusDist
                );
            } else {
                const dir = new THREE.Vector3();
                povCamera.getWorldDirection(dir);
                povControls.target.set(
                    playerCar.position.x + dir.x * focusDist,
                    playerCar.position.y + 0.35 + dir.y * focusDist,
                    playerCar.position.z + dir.z * focusDist
                );
            }
            lastPovState = 1;
        } else {
            // Alejamientos: mirar al vehículo
            povControls.target.set(
                playerCar.position.x,
                playerCar.position.y + 0.5,
                playerCar.position.z
            );
        }
        if (povState >= 2) lastPovState = povState;
        povControls.update();
        renderer.render(scene, povCamera);
    } else {
        controls.update();
        renderer.render(scene, camera);
    }
  })();
}

// ── Arranque ──────────────────────────────────────────────────────────────────
const DEFAULT_MATRIX = [
  [4,1,1,1,1,1,1,1,1,1],
  [0,1,1,0,0,0,3,0,0,0],
  [2,1,1,0,1,0,1,0,1,0],
  [0,0,0,0,3,0,0,0,3,0],
  [0,1,1,0,1,1,1,1,1,0],
  [0,0,0,0,1,1,0,0,0,5],
  [4,1,1,1,1,1,0,1,1,1],
  [0,1,0,0,0,1,0,0,0,1],
  [0,1,0,1,0,1,1,1,0,1],
  [0,0,0,1,0,0,0,0,0,1],
];

// Evento desde app.js con datos de Python
window.addEventListener('ciudad-lista', async e => {
  buildCity(e.detail);
});

// Listener para el botón de play
setTimeout(() => {
  const btnPlay = document.getElementById('btn-play-route');
  if (btnPlay) {
    btnPlay.addEventListener('click', async () => {
      try {
        if (window.eel && window.eel.obtener_ruta) {
          const ruta = await window.eel.obtener_ruta()();
          if (window.startCarMovement) {
            window.startCarMovement(ruta);
          }
        } else {
          console.warn("Eel no está listo o no tiene la función obtener_ruta.");
        }
      } catch (err) {
        console.warn('Error al iniciar movimiento automático', err);
      }
    });
  }
}, 500); // 500ms delay to ensure the DOM and script are loaded


// Fallback si Eel no responde en 3 s
setTimeout(() => {
  if (!document.getElementById('map-canvas').querySelector('canvas')) {
    buildCity(DEFAULT_MATRIX);
  }
}, 3000);
