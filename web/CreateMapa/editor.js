// ══════════════════════════════════════════════════════════════
//  editor.js — Editor de Mapas SimCity-style v2
//  [Espacio]   → alterna cámara libre / pincel
//  [WASD/↑↓←→] → mueve la vista (pan) siempre disponible
//  Click izq   → pintar / añadir paso de ruta
//  Click der   → borrar tile / deshacer último paso de ruta
//  Rueda       → zoom   |  Click medio → pan
// ══════════════════════════════════════════════════════════════
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  CONSTANTES & PALETAS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const TILE  = 2;
const GRID  = 10;
const OFF   = (GRID * TILE) / 2;
const TS    = TILE;

const BUILDING_PALETTE = [0x7c6fff, 0x5c8fff, 0x3fb8f5, 0x9a63ff, 0x4c7cfa, 0x38d9a9];
const HOUSE_PALETTE    = [0xff9f43, 0xee5a24, 0xe55039, 0xf0932b, 0xffc312];
const ROAD_COLOR       = 0x343a50;
const ROAD_MARK        = 0xffd43b;
const SIDEWALK_COLOR   = 0x464d6a;
const GROUND_COLOR     = 0x1c1f38;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  ESTADO GLOBAL
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
let matrix   = Array.from({ length: GRID }, () => Array(GRID).fill(0));
let subtypes = Array.from({ length: GRID }, () => Array(GRID).fill('none'));

let activeTool    = 'tile';   // 'tile' | 'path'
let activeTile    = 0;
let activeSubtype = 'building';
let isPainting    = false;
let hasStart      = false;
let hasGoal       = false;
let camFreeMode   = false;

// Pincel Ruta
let pathData      = [];   // [[row,col], ...]
let lastPathCell  = null; // para drag-trail

// Keys para WASD
const keysDown = new Set();

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  HISTORIAL (Ctrl+Z) — unificado tile + ruta
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const historyStack = []; // max 60 entradas
const MAX_HISTORY  = 60;

function pushHistory(entry) {
  historyStack.push(entry);
  if (historyStack.length > MAX_HISTORY) historyStack.shift();
}

function undoLastAction() {
  if (historyStack.length === 0) { toast('↩ Nada que deshacer.'); return; }
  const entry = historyStack.pop();

  if (entry.type === 'path') {
    pathData = entry.prevPath;           // restaurar snapshot del array
    rebuildPathOverlay();
    updatePathUI();
    toast('↩ Paso de ruta deshecho.');

  } else if (entry.type === 'tile') {
    const { row, col, prevVal, prevSubtype } = entry;
    // Limpiar flags actuales
    if (matrix[row][col] === 2) hasStart = false;
    if (matrix[row][col] === 5) hasGoal  = false;
    // Restaurar estado previo directamente (sin empujar de nuevo al historial)
    matrix[row][col]   = prevVal;
    subtypes[row][col] = prevSubtype;
    // Recalcular flags
    hasStart = matrix.some(r => r.includes(2));
    hasGoal  = matrix.some(r => r.includes(5));
    // Re-renderizar sin pasar por paintCell (evita push doble)
    _applyTile(row, col);
    toast('↩ Cambio de tile deshecho.');
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  ESCENA THREE.JS — más cerca por defecto
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const container = document.getElementById('map-canvas');

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1a1d33);
scene.fog = new THREE.Fog(0x1a1d33, 80*TS, 260*TS);

scene.add(new THREE.AmbientLight(0xffffff, 1.4));
const sun  = new THREE.DirectionalLight(0xfff8e7, 2.0);
sun.position.set(25*TS, 40*TS, 20*TS); scene.add(sun);
const fill = new THREE.DirectionalLight(0xaad4ff, 0.8);
fill.position.set(-15*TS, 15*TS, 20*TS); scene.add(fill);
const rim  = new THREE.DirectionalLight(0xffd6a5, 0.5);
rim.position.set(20*TS, 10*TS, -25*TS); scene.add(rim);

// Cámara ortográfica — zoom inicial mucho más cercano
const W = window.innerWidth, H = window.innerHeight;
const FRUST = 22;
const camera = new THREE.OrthographicCamera(
  -FRUST*(W/H)/2, FRUST*(W/H)/2, FRUST/2, -FRUST/2, 0.1, 1200
);
camera.position.set(OFF + 14*TS, 20*TS, OFF + 14*TS);
camera.lookAt(OFF, 0, OFF);
camera.zoom = 2.4;          // ← mucho más cerca que antes (1.55)
camera.updateProjectionMatrix();

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(W, H);
renderer.outputColorSpace = THREE.SRGBColorSpace;
container.appendChild(renderer.domElement);

// ── OrbitControls ──────────────────────────────
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(OFF, 0, OFF);
controls.enableDamping  = true;
controls.dampingFactor  = 0.09;
controls.minZoom  = 0.4;
controls.maxZoom  = 8;
controls.maxPolarAngle = Math.PI / 2.08;
// En modo pincel: solo pan con medio y dolly con rueda
// En modo cámara (Espacio): también rotación con izquierdo
controls.mouseButtons = { LEFT: -1, MIDDLE: THREE.MOUSE.PAN, RIGHT: -1 };
controls.update();

// ── Grupos ──
const cityGroup = new THREE.Group();
cityGroup.position.set(-OFF, 0, -OFF);
scene.add(cityGroup);

// Grupo de overlay de ruta (dentro de cityGroup → mismas coordenadas)
const pathOverlayGroup = new THREE.Group();
cityGroup.add(pathOverlayGroup);

const tileGroups = Array.from({ length: GRID }, () => Array(GRID).fill(null));

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  GEOMETRÍAS COMPARTIDAS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const gRoad     = new THREE.BoxGeometry(TS*.99, .1*TS, TS*.99);
const gMark     = new THREE.BoxGeometry(.07*TS, .01*TS, .6*TS);
const gSidewalk = new THREE.BoxGeometry(TS*.92, .14*TS, TS*.92);
const gRoof     = new THREE.BoxGeometry(TS*.72, .09*TS, TS*.72);
const gWindow   = new THREE.BoxGeometry(.14*TS, .14*TS, .025*TS);
const gPole     = new THREE.CylinderGeometry(.03*TS,.03*TS,.9*TS,8);
const gFlag     = new THREE.BoxGeometry(.42*TS,.24*TS,.03*TS);
const gRing     = new THREE.TorusGeometry(TS*.29,.045*TS,8,28);
const gMarker   = new THREE.CircleGeometry(TS*.28,20);
const gGround   = new THREE.PlaneGeometry(GRID*TS+4*TS, GRID*TS+4*TS);
const gCone     = new THREE.ConeGeometry(.2*TS,.5*TS,3);
const swGeo     = new THREE.BoxGeometry(.3*TS,.12*TS,TS*.99);

// Geometrías compartidas fijas para path overlay
const PATH_DISC_GEO = new THREE.CylinderGeometry(.26*TS, .26*TS, .055*TS, 16);
const PATH_RING_GEO = new THREE.TorusGeometry(.33*TS, .045*TS, 7, 22);

// ── Helpers ──
function mm(geo, color, opts = {}) {
  return new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ color, ...opts }));
}
function em(geo, color, intensity = .8) {
  return mm(geo, color, { emissive: color, emissiveIntensity: intensity });
}
function darken(hex, f) {
  return (((((hex>>16)&0xff)*f|0)<<16)|((((hex>>8)&0xff)*f|0)<<8)|(((hex&0xff)*f|0)));
}

// ── Suelo base ──
const gnd = mm(gGround, GROUND_COLOR);
gnd.rotation.x = -Math.PI/2;
gnd.position.set(OFF, -.08*TS, OFF);
cityGroup.add(gnd);
const grid3 = new THREE.GridHelper(GRID*TS, GRID, 0x252840, 0x252840);
grid3.position.set(OFF, -.05*TS, OFF);
cityGroup.add(grid3);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  CONSTRUCTORES DE TILES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function roadBase() {
  const g = new THREE.Group();
  const road = mm(gRoad, ROAD_COLOR); road.position.y = .05*TS; g.add(road);
  const mk   = em(gMark, ROAD_MARK, .5); mk.position.y = .11*TS; g.add(mk);
  return g;
}
function buildingTile(row, col) {
  const g = new THREE.Group();
  const sw = mm(gSidewalk, SIDEWALK_COLOR); sw.position.y = .07*TS; g.add(sw);
  const height = (1.2 + ((row*13+col*7)%3)*.9) * TS;
  const color  = BUILDING_PALETTE[(row*3+col*5) % BUILDING_PALETTE.length];
  const bGeo   = new THREE.BoxGeometry(TS*.68, height, TS*.68);
  const bMesh  = mm(bGeo, color); bMesh.position.y = .13*TS+height/2; g.add(bMesh);
  const roof   = mm(gRoof, darken(color,.55)); roof.position.y = .13*TS+height+.05*TS; g.add(roof);
  const floors = Math.floor(height/(.75*TS));
  for (let fy=0; fy<floors; fy++) {
    const wy = .13*TS + .45*TS + fy*.72*TS;
    [-1,1].forEach(s => {
      const wf = em(gWindow,0xfff0a0,.95); wf.position.set(s*.22*TS,wy,TS*.34+.01*TS); g.add(wf);
      const ws = em(gWindow,0xfff0a0,.95); ws.position.set(TS*.34+.01*TS,wy,s*.22*TS); g.add(ws);
    });
  }
  return g;
}
function parkTile() {
  const g = new THREE.Group();

  // Suelo de césped
  const grassGeo = new THREE.BoxGeometry(TS*.99, .1, TS*.99);
  const grass = mm(grassGeo, 0x2d9e4e); grass.position.y = .05; g.add(grass);

  // Camino central (cruciforme)
  const pathH = new THREE.BoxGeometry(TS*.9, .01, .32);
  const pathV = new THREE.BoxGeometry(.32, .01, TS*.9);
  const pathMat = new THREE.MeshLambertMaterial({ color: 0xc8b89a });
  const ph = new THREE.Mesh(pathH, pathMat); ph.position.y = .115; g.add(ph);
  const pv = new THREE.Mesh(pathV, pathMat); pv.position.y = .115; g.add(pv);

  // Borde de césped más oscuro (capa semitransparente)
  const borderGeo = new THREE.BoxGeometry(TS*.99, .04, TS*.99);
  const border = mm(borderGeo, 0x1f6e35, { transparent: true, opacity: .55 });
  border.position.y = .13; g.add(border);

  // Árbol con doble follaje (igual que map.js)
  function addTree(tx, tz) {
    const trunkGeo  = new THREE.CylinderGeometry(.055, .075, .38, 7);
    const foliageG1 = new THREE.SphereGeometry(.32, 8, 7);
    const foliageG2 = new THREE.SphereGeometry(.24, 8, 7);
    const trunkMat  = new THREE.MeshLambertMaterial({ color: 0x6b3d1e });
    const leafMat   = new THREE.MeshLambertMaterial({ color: 0x27ae60 });
    const leafMat2  = new THREE.MeshLambertMaterial({ color: 0x2ecc71 });
    const trunk = new THREE.Mesh(trunkGeo, trunkMat); trunk.position.set(tx, .3,  tz);
    const leaf1 = new THREE.Mesh(foliageG1, leafMat);  leaf1.position.set(tx, .72, tz);
    const leaf2 = new THREE.Mesh(foliageG2, leafMat2); leaf2.position.set(tx, .98, tz);
    g.add(trunk); g.add(leaf1); g.add(leaf2);
  }
  addTree(-.55, -.55);
  addTree( .55, -.55);
  addTree(-.55,  .55);

  // Banco (asiento + patas) — igual que map.js
  const seatGeo = new THREE.BoxGeometry(.5, .06, .16);
  const legGeo  = new THREE.BoxGeometry(.05, .18, .12);
  const woodMat = new THREE.MeshLambertMaterial({ color: 0x8b5e3c });
  const seat = new THREE.Mesh(seatGeo, woodMat); seat.position.set(.42, .3, .28); g.add(seat);
  [-0.2, 0.2].forEach(lx => {
    const leg = new THREE.Mesh(legGeo, woodMat); leg.position.set(.42+lx, .21, .28); g.add(leg);
  });

  return g;
}
function houseTile(row, col) {
  const g = new THREE.Group();
  const sw = mm(gSidewalk, SIDEWALK_COLOR); sw.position.y=.07*TS; g.add(sw);
  const color = HOUSE_PALETTE[(row*7+col*3) % HOUSE_PALETTE.length];
  const wallH = .9*TS;
  const wall = mm(new THREE.BoxGeometry(TS*.65,wallH,TS*.65), color);
  wall.position.y = .13*TS+wallH/2; g.add(wall);
  const roofM = mm(new THREE.ConeGeometry(TS*.52,.55*TS,4), darken(color,.6));
  roofM.rotation.y=Math.PI/4; roofM.position.y=.13*TS+wallH+.25*TS; g.add(roofM);
  return g;
}
function startTile() {
  const g = roadBase();
  const arrow = em(gCone, 0x69db7c, .9);
  arrow.rotation.z=-Math.PI/2; arrow.position.set(-.55*TS,.15*TS,0); g.add(arrow);
  return g;
}
function personTile() {
  const g = roadBase();
  const sw = mm(swGeo, SIDEWALK_COLOR); sw.position.set(TS*.34,.06*TS,0); g.add(sw);
  const body = mm(new THREE.CylinderGeometry(.06*TS,.075*TS,.24*TS,8),0x4dabf7);
  body.position.set(TS*.34,.12*TS,0); g.add(body);
  const head = mm(new THREE.SphereGeometry(.09*TS,8,7),0xffcba4);
  head.position.set(TS*.34,.34*TS,0); g.add(head);
  return g;
}
function goalTile() {
  const g = roadBase();
  const mk = mm(gMarker,0xffffff,{transparent:true,opacity:.15});
  mk.rotation.x=-Math.PI/2; mk.position.y=.11*TS; g.add(mk);
  const ring = em(gRing,0xff6b6b,.8); ring.rotation.x=Math.PI/2; ring.position.y=.115*TS; g.add(ring);
  const pole = mm(gPole,0xadb5bd); pole.position.set(-.35*TS,.55*TS,-.35*TS); g.add(pole);
  const flag = em(gFlag,0xff6b6b,.7); flag.position.set(-.15*TS,.87*TS,-.35*TS); g.add(flag);
  return g;
}
function buildTileGroup(val, row, col, subtype) {
  if (val===0) return roadBase();
  if (val===1) {
    if (subtype==='park')  return parkTile();
    if (subtype==='house') return houseTile(row,col);
    return buildingTile(row,col);
  }
  if (val===2) return startTile();
  if (val===4) return personTile();
  if (val===5) return goalTile();
  return roadBase();
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  PATH OVERLAY — indicador visual de ruta
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function lerpColor(a, b, t) {
  const ra=(a>>16)&0xff, ga=(a>>8)&0xff, ba=a&0xff;
  const rb=(b>>16)&0xff, gb=(b>>8)&0xff, bb=b&0xff;
  return ((Math.round(ra+(rb-ra)*t)<<16)|(Math.round(ga+(gb-ga)*t)<<8)|Math.round(ba+(bb-ba)*t));
}
function pathStepColor(t) {
  // 0 = verde brillante → 0.5 = amarillo → 1 = rojo
  return t < 0.5
    ? lerpColor(0x51cf66, 0xffd43b, t*2)
    : lerpColor(0xffd43b, 0xff6b6b, (t-0.5)*2);
}

function clearPathOverlay() {
  pathOverlayGroup.children.slice().forEach(c => {
    // Solo disposing geometrías que no son las compartidas y materiales
    if (c.geometry !== PATH_DISC_GEO && c.geometry !== PATH_RING_GEO) {
      c.geometry?.dispose();
    }
    if (Array.isArray(c.material)) c.material.forEach(m=>m.dispose());
    else c.material?.dispose();
  });
  pathOverlayGroup.clear();
}

function rebuildPathOverlay() {
  clearPathOverlay();
  if (pathData.length === 0) { updatePathUI(); return; }

  const n = pathData.length;
  const Y_DISC = .26*TS;   // altura de los discos sobre la carretera
  const Y_RING = .28*TS;

  for (let i = 0; i < n; i++) {
    const [row, col] = pathData[i];
    const wx = col*TS + TS/2;
    const wz = row*TS + TS/2;
    const t = n > 1 ? i / (n-1) : 0;
    const col3 = pathStepColor(t);

    // ── Disco de posición ──
    const discMat = new THREE.MeshLambertMaterial({
      color: col3, emissive: col3, emissiveIntensity: 0.55,
      transparent: true, opacity: 0.84
    });
    const disc = new THREE.Mesh(PATH_DISC_GEO, discMat);
    disc.position.set(wx, Y_DISC, wz);
    pathOverlayGroup.add(disc);

    // ── Anillo para inicio (verde pulsante) ──
    if (i === 0) {
      const rm = new THREE.MeshLambertMaterial({
        color: 0x51cf66, emissive: 0x51cf66, emissiveIntensity: 0.9,
        transparent: true, opacity: 0.88
      });
      const ring = new THREE.Mesh(PATH_RING_GEO, rm);
      ring.rotation.x = Math.PI/2;
      ring.position.set(wx, Y_RING, wz);
      pathOverlayGroup.add(ring);
    }

    // ── Anillo para final (rojo pulsante) ──
    if (i === n-1 && n > 1) {
      const rm2 = new THREE.MeshLambertMaterial({
        color: 0xff6b6b, emissive: 0xff6b6b, emissiveIntensity: 0.9,
        transparent: true, opacity: 0.88
      });
      const ring2 = new THREE.Mesh(PATH_RING_GEO, rm2);
      ring2.rotation.x = Math.PI/2;
      ring2.position.set(wx, Y_RING, wz);
      pathOverlayGroup.add(ring2);
    }

    // ── Conector + flecha hacia siguiente paso ──
    if (i < n-1) {
      const [r2, c2] = pathData[i+1];
      const wx2 = c2*TS + TS/2;
      const wz2 = r2*TS + TS/2;
      const dx = wx2-wx, dz = wz2-wz;
      const dist = Math.sqrt(dx*dx + dz*dz);

      if (dist > 0.01) {   // no conectar si es la misma celda (revisita)
        // Barra conectora
        const lineGeo  = new THREE.BoxGeometry(dist*.80, .04*TS, .10*TS);
        const lineMat  = new THREE.MeshLambertMaterial({
          color: col3, emissive: col3, emissiveIntensity: 0.35,
          transparent: true, opacity: 0.65
        });
        const line = new THREE.Mesh(lineGeo, lineMat);
        line.position.set((wx+wx2)/2, .20*TS, (wz+wz2)/2);
        line.rotation.y = -Math.atan2(dz, dx);
        pathOverlayGroup.add(line);

        // Flecha (cono apuntando hacia siguiente paso)
        const coneGeo = new THREE.ConeGeometry(.13*TS,.24*TS,6);
        const coneMat = new THREE.MeshLambertMaterial({
          color: col3, emissive: col3, emissiveIntensity: 0.55
        });
        const cone = new THREE.Mesh(coneGeo, coneMat);
        // Orientar el cono: +Y por defecto → rotar hacia dirección de movimiento
        const dir = new THREE.Vector3(dx, 0, dz).normalize();
        const quat = new THREE.Quaternion().setFromUnitVectors(
          new THREE.Vector3(0,1,0), dir
        );
        cone.quaternion.copy(quat);
        // Colocar al 65% entre i e i+1
        cone.position.set(wx + dx*.65, .25*TS, wz + dz*.65);
        pathOverlayGroup.add(cone);
      } else {
        // Misma celda (revisita) → pequeño círculo concéntrico extra
        const revisitGeo = new THREE.RingGeometry(.14*TS,.22*TS,12);
        const revisitMat = new THREE.MeshBasicMaterial({
          color: col3, transparent: true, opacity: 0.55, side: THREE.DoubleSide
        });
        const rev = new THREE.Mesh(revisitGeo, revisitMat);
        rev.rotation.x = -Math.PI/2;
        rev.position.set(wx, .30*TS, wz);
        pathOverlayGroup.add(rev);
      }
    }
  }
  updatePathUI();
}

// ── Función de animación del overlay (pulsos de anillos) ──
let _pulseT = 0;
function pulsePathRings(dt) {
  if (pathData.length === 0) return;
  _pulseT += dt * 2.2;
  const s = 1 + Math.sin(_pulseT) * 0.07;
  // Solo los anillos (TorusGeometry) pulsan
  pathOverlayGroup.children.forEach(c => {
    if (c.geometry === PATH_RING_GEO) {
      c.scale.setScalar(s);
    }
  });
}

// ── Lógica de path ──
function addPathStep(row, col) {
  // No se puede poner ruta en edificio/parque/casa (valor 1)
  if (matrix[row][col] === 1) {
    toast('🚫 No puedes poner ruta en edificios, parques o casas.');
    return;
  }
  // Guardar snapshot del path ANTES de modificar
  pushHistory({ type: 'path', prevPath: pathData.map(s => [...s]) });
  pathData.push([row, col]);
  rebuildPathOverlay();
}

window.undoPathStep = function() {
  if (pathData.length === 0) return;
  pathData.pop();
  rebuildPathOverlay();
  toast('↩ Último paso de ruta deshecho.');
};

window.clearPath = function() {
  pathData = [];
  clearPathOverlay();
  updatePathUI();
  toast('🗑 Ruta borrada.');
};

window.guardarRuta = function() {
  if (pathData.length < 2) {
    toast('⚠️ La ruta necesita al menos 2 pasos.'); return;
  }
  const first = pathData[0];
  if (matrix[first[0]][first[1]] !== 2) {
    toast('⚠️ El primer paso de ruta debe estar en el inicio del carro (🟢).'); return;
  }
  const pyStr = 'PATH_EXAMPLE = [\n    ' +
    pathData.map(([r,c]) => `(${r},${c})`).join(',') +
    '\n]';

  if (typeof eel !== 'undefined') {
    eel.guardar_ruta(pathData)().then(res => {
      if (res?.ok) toast(`✅ Ruta guardada (${res.steps} pasos).`);
      else toast('⚠️ Error: ' + (res?.error ?? 'desconocido'));
    }).catch(() => {
      navigator.clipboard?.writeText(pyStr);
      toast('⚠️ Eel no disponible. Copiado al portapapeles.');
    });
  } else {
    navigator.clipboard?.writeText(pyStr);
    toast(`✅ PATH_EXAMPLE copiado (${pathData.length} pasos).`);
  }
};

function updatePathUI() {
  const countEl = document.getElementById('path-step-count');
  if (countEl) {
    const n = pathData.length;
    const valid = n > 0 && matrix[pathData[0][0]][pathData[0][1]] === 2;
    countEl.textContent = n === 0
      ? '0 pasos — ruta vacía'
      : `${n} paso${n>1?'s':''} ${valid ? '✓' : '— empieza en tile 2'}`;
    countEl.className = n === 0 ? '' : valid ? 'path-count-ok' : 'path-count-warn';
  }
  // Mini-mapa: resalta celdas de ruta
  updateMatrixPathHighlight();
}

function updateMatrixPathHighlight() {
  const cells = document.querySelectorAll('.matrix-cell');
  if (!cells.length) return;
  // Primero limpiar highlight
  cells.forEach(c => c.classList.remove('mc-path'));
  // Luego marcar los de la ruta
  pathData.forEach(([r,c]) => {
    cells[r*GRID+c]?.classList.add('mc-path');
  });
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  INICIALIZACIÓN DE CUADRÍCULA
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function tileWorldPos(row, col) { return { x: col*TS+TS/2, z: row*TS+TS/2 }; }

function initGrid() {
  for (let r=0; r<GRID; r++) {
    for (let c=0; c<GRID; c++) {
      const tg = buildTileGroup(matrix[r][c], r, c, subtypes[r][c]);
      const {x,z} = tileWorldPos(r,c);
      tg.position.set(x,0,z);
      cityGroup.add(tg);
      tileGroups[r][c] = tg;
    }
  }
}
initGrid();

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  ACTUALIZAR TILE + POP
//  _applyTile → actualiza Three.js sin tocar historial (usado por undo)
//  updateTile  → igual pero llama sin push
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function _applyTile(row, col) {
  const old = tileGroups[row][col];
  if (old) cityGroup.remove(old);
  const newGrp = buildTileGroup(matrix[row][col], row, col, subtypes[row][col]);
  const {x,z} = tileWorldPos(row,col);
  newGrp.position.set(x,0,z);
  newGrp.scale.setScalar(0.01);
  cityGroup.add(newGrp);
  tileGroups[row][col] = newGrp;
  animatePop(newGrp);
  updateMatrixPanel();
  updateValidation();
  if (pathData.some(([r,c])=>r===row&&c===col)) rebuildPathOverlay();
}
function updateTile(row, col) { _applyTile(row, col); }

function animatePop(group) {
  const start = performance.now();
  const dur   = 240;
  function step(now) {
    const t  = Math.min((now-start)/dur, 1);
    const sc = t<.65 ? 1.22*(t/.65) : 1.22-0.22*((t-.65)/.35);
    group.scale.setScalar(sc);
    if (t<1) requestAnimationFrame(step); else group.scale.setScalar(1);
  }
  requestAnimationFrame(step);
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  RAYCASTER
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const raycaster   = new THREE.Raycaster();
const pointer     = new THREE.Vector2();
const groundPlane = new THREE.Plane(new THREE.Vector3(0,1,0), 0);

function getTileFromEvent(e) {
  const rect = renderer.domElement.getBoundingClientRect();
  pointer.set(
    (e.clientX-rect.left)/rect.width * 2 - 1,
    -((e.clientY-rect.top)/rect.height * 2 - 1)
  );
  raycaster.setFromCamera(pointer, camera);
  const target = new THREE.Vector3();
  if (!raycaster.ray.intersectPlane(groundPlane, target)) return null;
  const wx=target.x+OFF, wz=target.z+OFF;
  const col=Math.floor(wx/TS), row=Math.floor(wz/TS);
  return (row>=0&&row<GRID&&col>=0&&col<GRID) ? {row,col} : null;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  LÓGICA DE PINTADO
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function paintCell(row, col, erase=false) {
  // Guardar estado PREVIO en historial antes de modificar
  pushHistory({ type:'tile', row, col, prevVal: matrix[row][col], prevSubtype: subtypes[row][col] });

  if (erase) {
    const prev=matrix[row][col];
    if (prev===2) hasStart=false;
    if (prev===5) hasGoal=false;
    matrix[row][col]=0; subtypes[row][col]='none';
    updateTile(row,col); return;
  }
  const tileVal = activeTile;
  if (tileVal===2 && hasStart && matrix[row][col]!==2) {
    historyStack.pop(); // descartar — no hubo cambio
    toast('⚠️ Ya existe un inicio de carro. Qúitalo primero.'); return;
  }
  if (tileVal===5 && hasGoal && matrix[row][col]!==5) {
    historyStack.pop();
    toast('⚠️ Ya existe una meta. Qúitala primero.'); return;
  }
  if (tileVal===1) { placeTile1(row,col,activeSubtype); return; }
  const prev=matrix[row][col];
  if (prev===2) hasStart=false;
  if (prev===5) hasGoal=false;
  if (tileVal===2) hasStart=true;
  if (tileVal===5) hasGoal=true;
  matrix[row][col]=tileVal; subtypes[row][col]='none';
  updateTile(row,col);
}

function placeTile1(row,col,stype) {
  // Historial: guardar estado previo ANTES de modificar
  pushHistory({ type:'tile', row, col, prevVal: matrix[row][col], prevSubtype: subtypes[row][col] });
  const prev=matrix[row][col];
  if (prev===2) hasStart=false;
  if (prev===5) hasGoal=false;
  matrix[row][col]=1; subtypes[row][col]=stype;
  updateTile(row,col);
}

// ── Dispatcher unificado ──
function handleCellInteraction(row, col, erase=false) {
  if (activeTool === 'path') {
    if (erase) { window.undoPathStep(); }
    else       { addPathStep(row, col); }
    return;
  }
  paintCell(row, col, erase);
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  MODO CÁMARA LIBRE (Espacio)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function setCamFreeMode(on) {
  camFreeMode = on;
  if (on) {
    // Libre: izquierdo→rotar, derecho→pan
    controls.mouseButtons = { LEFT: THREE.MOUSE.ROTATE, MIDDLE: THREE.MOUSE.PAN, RIGHT: THREE.MOUSE.PAN };
    renderer.domElement.style.cursor = 'grab';
  } else {
    // Pincel: izquierdo capturado por nosotros, medio→pan
    controls.mouseButtons = { LEFT: -1, MIDDLE: THREE.MOUSE.PAN, RIGHT: -1 };
    renderer.domElement.style.cursor = activeTool==='path' ? 'cell' : 'crosshair';
  }
  const ind = document.getElementById('cam-mode-indicator');
  if (ind) {
    const icon = on ? '🎥' : (activeTool==='path' ? '🛤' : '🖌️');
    const label = on ? 'Modo Cámara  —  Espacio para pintar' : (activeTool==='path' ? 'Pincel Ruta  —  Espacio para cámara' : 'Modo Pincel  —  Espacio para cámara');
    ind.innerHTML = `${icon} ${label}`;
    ind.classList.toggle('cam-mode', on);
    ind.classList.toggle('path-mode', !on && activeTool==='path');
  }
}
setCamFreeMode(false);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  TECLADO
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
window.addEventListener('keydown', e => {
  // Ctrl+Z — deshacer (tile o ruta) en cualquier modo
  if ((e.ctrlKey || e.metaKey) && e.code === 'KeyZ' && !e.repeat) {
    e.preventDefault();
    undoLastAction();
    return;
  }
  if (e.code==='Space' && !e.repeat) {
    e.preventDefault();
    setCamFreeMode(!camFreeMode);
    return;
  }
  const nav = ['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','KeyW','KeyS','KeyA','KeyD'];
  if (nav.includes(e.code)) e.preventDefault();
  keysDown.add(e.code);
});
window.addEventListener('keyup', e => keysDown.delete(e.code));

// Exponer undo globalmente (útil para botón UI si se quiere añadir)
window.undoLastAction = undoLastAction;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  EVENTOS DEL CANVAS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const canvas = renderer.domElement;

canvas.addEventListener('mousedown', e => {
  if (camFreeMode) return;
  if (e.button===2) { e.preventDefault(); const t=getTileFromEvent(e); if(t) handleCellInteraction(t.row,t.col,true); return; }
  if (e.button!==0) return;
  isPainting=true; lastPathCell=null;
  const t=getTileFromEvent(e);
  if (t) { handleCellInteraction(t.row,t.col,false); lastPathCell=t; }
});

canvas.addEventListener('mousemove', e => {
  if (camFreeMode) { hideTileTooltip(); return; }
  const t=getTileFromEvent(e);
  if (!t) { hideTileTooltip(); return; }
  showTileTooltip(e,t.row,t.col);
  if (isPainting && e.buttons===1) {
    if (activeTool==='path') {
      // Drag en modo ruta: solo añade si es una celda nueva
      if (!lastPathCell || lastPathCell.row!==t.row || lastPathCell.col!==t.col) {
        addPathStep(t.row,t.col);
        lastPathCell=t;
      }
    } else {
      paintCell(t.row,t.col,false);
    }
  }
});

canvas.addEventListener('mouseup',    ()=>{ isPainting=false; lastPathCell=null; });
canvas.addEventListener('mouseleave', ()=>{ isPainting=false; lastPathCell=null; hideTileTooltip(); });
canvas.addEventListener('contextmenu', e=>e.preventDefault());

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  TOOLTIP
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const TILE_NAMES = {
  0:'Calle', 1:{building:'Edificio',park:'Parque',house:'Casa',none:'Edificio'},
  2:'Inicio carro', 4:'Calle + Persona', 5:'Meta'
};
const ttEl = document.getElementById('tile-tooltip');
function showTileTooltip(e,row,col) {
  const v=matrix[row][col];
  const name=v===1?(TILE_NAMES[1][subtypes[row][col]]??'Edificio'):(TILE_NAMES[v]??'?');
  const pathIdx = pathData.filter(([r,c])=>r===row&&c===col).length;
  const pathInfo = pathIdx>0 ? ` · en ruta ×${pathIdx}` : '';
  ttEl.textContent=`[${row},${col}] ${name}${pathInfo}`;
  ttEl.style.display='block';
  ttEl.style.left=(e.clientX+16)+'px';
  ttEl.style.top=(e.clientY-8)+'px';
}
function hideTileTooltip() { ttEl.style.display='none'; }

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  MINI-MAPA
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function buildMatrixPanel() {
  const mgEl=document.getElementById('matrix-grid');
  if(!mgEl) return;
  mgEl.innerHTML='';
  for (let r=0;r<GRID;r++) for (let c=0;c<GRID;c++) {
    const cell=document.createElement('div');
    cell.className=`matrix-cell mc-${matrix[r][c]}`;
    cell.title=`[${r},${c}]=${matrix[r][c]}`;
    mgEl.appendChild(cell);
  }
}
function updateMatrixPanel() {
  const cells=document.querySelectorAll('.matrix-cell');
  for (let r=0;r<GRID;r++) for (let c=0;c<GRID;c++) {
    cells[r*GRID+c].className=`matrix-cell mc-${matrix[r][c]}`;
  }
  updateMatrixPathHighlight();
}
buildMatrixPanel();

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  VALIDACIÓN
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function updateValidation() {
  hasStart=matrix.some(r=>r.includes(2));
  hasGoal=matrix.some(r=>r.includes(5));
  setValItem(document.getElementById('val-start'),hasStart,'Inicio carro');
  setValItem(document.getElementById('val-goal'),hasGoal,'Meta');
  const b2=document.getElementById('badge-2'); if(b2){b2.className='tool-badge unique'+(hasStart?' used':'');b2.textContent=hasStart?'✓':'1×';}
  const b5=document.getElementById('badge-5'); if(b5){b5.className='tool-badge unique'+(hasGoal?' used':'');b5.textContent=hasGoal?'✓':'1×';}
}
function setValItem(el,ok,label) {
  if(!el)return;
  el.innerHTML=ok
    ?`<i class="fa-solid fa-circle-check val-icon valid"></i> ${label}`
    :`<i class="fa-solid fa-circle-xmark val-icon invalid"></i> ${label}`;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  API PÚBLICA UI
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
window.selectTool = function(tileId) {
  activeTool='tile'; activeTile=tileId;
  document.querySelectorAll('.tool-btn').forEach(b=>b.classList.remove('active'));
  document.getElementById(`tool-${tileId}`)?.classList.add('active');
  document.getElementById('subtool-panel')?.classList.toggle('visible', tileId===1);
  document.getElementById('path-panel')?.classList.remove('visible');
  if (!camFreeMode) renderer.domElement.style.cursor='crosshair';
  setCamFreeMode(camFreeMode); // actualiza indicator
};

window.selectToolPath = function() {
  activeTool='path';
  document.querySelectorAll('.tool-btn').forEach(b=>b.classList.remove('active'));
  document.getElementById('tool-path')?.classList.add('active');
  document.getElementById('subtool-panel')?.classList.remove('visible');
  document.getElementById('path-panel')?.classList.add('visible');
  if (!camFreeMode) renderer.domElement.style.cursor='cell';
  setCamFreeMode(camFreeMode); // actualiza indicator
};

window.selectSubtype = function(stype) {
  activeSubtype=stype;
  document.querySelectorAll('.subtool-btn').forEach(b=>b.classList.remove('active'));
  document.getElementById(`sub-${stype}`)?.classList.add('active');
};

let _modalRow=-1,_modalCol=-1;
window.cerrarModal=function(){
  document.getElementById('modal-overlay')?.classList.remove('visible');
  document.getElementById('modal-box')?.classList.remove('visible');
  _modalRow=-1;_modalCol=-1;
};
window.placeTileModal=function(stype){
  if(_modalRow<0)return; placeTile1(_modalRow,_modalCol,stype); cerrarModal();
};

window.resetMap=function(){
  for(let r=0;r<GRID;r++) for(let c=0;c<GRID;c++){matrix[r][c]=0;subtypes[r][c]='none';}
  hasStart=false;hasGoal=false;
  for(let r=0;r<GRID;r++) for(let c=0;c<GRID;c++) updateTile(r,c);
  toast('🗺️ Mapa limpiado.');
};

window.guardarMapa=function(){
  if(!hasStart){toast('⚠️ Falta el inicio del carro (tile 2).');return;}
  if(!hasGoal){toast('⚠️ Falta la meta (tile 5).');return;}
  const result=JSON.stringify(matrix);
  if(typeof eel!=='undefined'){
    eel.guardar_matriz_ciudad(matrix)().then(res=>{
      if(res?.ok) toast('✅ Mapa guardado en Python.');
      else toast('⚠️ Error: '+(res?.error??'desconocido'));
    }).catch(()=>{navigator.clipboard?.writeText(result);toast('⚠️ Eel no disponible. Copiado.');});
  } else { navigator.clipboard?.writeText(result); toast('✅ Matriz copiada.'); }
};

window.copiarMatriz=function(){
  const txt='CITY_MATRIX = [\n'+matrix.map(r=>'    ['+r.join(', ')+']').join(',\n')+'\n]';
  navigator.clipboard?.writeText(txt); toast('📋 Matriz Python copiada.');
};

window.irAlMenu=function(){
  document.body.style.transition='opacity 0.4s ease';
  document.body.style.opacity='0';
  setTimeout(()=>{window.location.href='../menu.html';},420);
};

window.resetCamera=function(){
  controls.target.set(OFF,0,OFF);
  camera.position.set(OFF+14*TS,20*TS,OFF+14*TS);
  camera.zoom=2.4; camera.updateProjectionMatrix(); controls.update();
  toast('🎥 Vista restablecida.');
};

function toast(msg,dur=3200){
  const t=document.getElementById('toast');
  document.getElementById('toast-msg').textContent=msg;
  t.classList.add('show'); clearTimeout(t._t);
  t._t=setTimeout(()=>t.classList.remove('show'),dur);
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  RESIZE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
window.addEventListener('resize', ()=>{
  const nW=window.innerWidth,nH=window.innerHeight,nA=nW/nH;
  camera.left=-FRUST*nA/2; camera.right=FRUST*nA/2;
  camera.updateProjectionMatrix(); renderer.setSize(nW,nH);
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  RENDER LOOP — incluye WASD pan y pulsación de ruta
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const _camDir   = new THREE.Vector3();
const _rightVec = new THREE.Vector3();
let   _lastTime = performance.now();

function loop() {
  requestAnimationFrame(loop);
  const now=performance.now(), dt=(now-_lastTime)*0.001; _lastTime=now;

  // WASD pan — funciona en ambos modos
  if (keysDown.size > 0) {
    const panSpeed = 0.18 * TS * (1 / Math.max(camera.zoom, 0.4));
    camera.getWorldDirection(_camDir);
    _camDir.y=0;
    if (_camDir.lengthSq()>0.0001) _camDir.normalize();
    _rightVec.crossVectors(_camDir, new THREE.Vector3(0,1,0)).normalize();

    if (keysDown.has('KeyW')||keysDown.has('ArrowUp'))    controls.target.addScaledVector(_camDir, panSpeed);
    if (keysDown.has('KeyS')||keysDown.has('ArrowDown'))  controls.target.addScaledVector(_camDir,-panSpeed);
    if (keysDown.has('KeyA')||keysDown.has('ArrowLeft'))  controls.target.addScaledVector(_rightVec,-panSpeed);
    if (keysDown.has('KeyD')||keysDown.has('ArrowRight')) controls.target.addScaledVector(_rightVec, panSpeed);
    // Limitar que no se salga demasiado del mapa
    controls.target.x=Math.max(-3*TS,Math.min(GRID*TS+3*TS,controls.target.x));
    controls.target.z=Math.max(-3*TS,Math.min(GRID*TS+3*TS,controls.target.z));
  }

  // Pulso animado de los anillos de ruta
  pulsePathRings(dt);

  controls.update();
  renderer.render(scene, camera);
}
loop();

updateValidation();
updatePathUI();
