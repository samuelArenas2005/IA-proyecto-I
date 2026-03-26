import * as THREE from 'three';

const TILE = 2;
const GRID = 10;
const BUILDING_PALETTE = [0x7c6fff, 0x5c8fff, 0x3fb8f5, 0x9a63ff, 0x4c7cfa, 0x38d9a9];
const CAR_PALETTE      = [0xff6b6b, 0xffa94d, 0x69db7c, 0x74c0fc, 0xf783ac];
const ROAD_COLOR       = 0x343a50;
const ROAD_MARK        = 0xffd43b;
const SIDEWALK_COLOR   = 0x464d6a;
const GROUND_COLOR     = 0x1c1f38;
const PARK_POSITIONS   = new Set(['1,1', '6,8']);

const PATH_EXAMPLE = [
  [2,0],[1,0],[0,0],[1,0],[2,0],[3,0],[4,0],[5,0],[6,0],[7,0],[8,0],[9,0],
  [9,1],[9,2],[8,2],[7,2],[7,3],[7,4],[8,4],[9,4],[9,5],[9,6],[9,7],[9,8],
  [8,8],[7,8],[7,7],[7,6],[6,6],[5,6],[5,7],[5,8],[5,9]
];

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

function darken(hex, f) {
  const r = ((hex >> 16) & 0xff) * f | 0;
  const g = ((hex >>  8) & 0xff) * f | 0;
  const b = ( hex        & 0xff) * f | 0;
  return (r << 16) | (g << 8) | b;
}
function mm(geo, color, opts = {}) {
  return new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ color, ...opts }));
}
function em(geo, color, intensity = .8) {
  return mm(geo, color, { emissive: color, emissiveIntensity: intensity });
}

function buildScene(matrix, TS, opts = {}) {
  const { heightScale = 1 } = opts;
  const G   = GRID;
  const OFF = (G * TS) / 2;

  const gRoad     = new THREE.BoxGeometry(TS*.99, .1*TS, TS*.99);
  const gMark     = new THREE.BoxGeometry(.07*TS, .01*TS, .6*TS);
  const gSidewalk = new THREE.BoxGeometry(TS*.92, .14*TS, TS*.92);
  const gRoof     = new THREE.BoxGeometry(TS*.72, .09*TS, TS*.72);
  const gWindow   = new THREE.BoxGeometry(.14*TS, .14*TS, .025*TS);
  const gCarBody  = new THREE.BoxGeometry(.58*TS, .2*TS, .34*TS);
  const gCarTop   = new THREE.BoxGeometry(.34*TS, .15*TS, .28*TS);
  const gWheel    = new THREE.CylinderGeometry(.065*TS,.065*TS,.07*TS,8);
  const gPole     = new THREE.CylinderGeometry(.03*TS,.03*TS,.9*TS,8);
  const gFlag     = new THREE.BoxGeometry(.42*TS,.24*TS,.03*TS);
  const gRing     = new THREE.TorusGeometry(TS*.29,.045*TS,8,28);
  const gMarker   = new THREE.CircleGeometry(TS*.28,20);
  const gGround   = new THREE.PlaneGeometry(G*TS+4*TS, G*TS+4*TS);
  const gCone     = new THREE.ConeGeometry(.2*TS,.5*TS,3);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x1a1d33);
  scene.fog = new THREE.Fog(0x1a1d33, 80*TS, 260*TS);

  scene.add(new THREE.AmbientLight(0xffffff, 1.4));
  const sun  = new THREE.DirectionalLight(0xfff8e7, 2.0);
  sun.position.set(25*TS, 40*TS, 20*TS); scene.add(sun);
  const fill = new THREE.DirectionalLight(0xaad4ff, .8);
  fill.position.set(-15*TS, 15*TS, 20*TS); scene.add(fill);
  const rim  = new THREE.DirectionalLight(0xffd6a5, .5);
  rim.position.set(20*TS, 10*TS, -25*TS);  scene.add(rim);

  const cityPivot = new THREE.Group();
  scene.add(cityPivot);

  const gnd = mm(gGround, GROUND_COLOR);
  gnd.rotation.x = -Math.PI / 2;
  gnd.position.set(OFF, -.08*TS, OFF);
  cityPivot.add(gnd);

  const grid = new THREE.GridHelper(G*TS, G, 0x252840, 0x252840);
  grid.position.set(OFF, -.05*TS, OFF);
  cityPivot.add(grid);

  function roadBase() {
    const g = new THREE.Group();
    const road = mm(gRoad, ROAD_COLOR); road.position.y = .05*TS; g.add(road);
    const mk   = em(gMark, ROAD_MARK, .5); mk.position.y = .11*TS; g.add(mk);
    return g;
  }
  function buildingTile(row, col) {
    const g = new THREE.Group();
    const sw = mm(gSidewalk, SIDEWALK_COLOR); sw.position.y=.07*TS; g.add(sw);
    const height = (1.2 + ((row*13+col*7)%3)*.9) * TS * heightScale;
    const color  = BUILDING_PALETTE[(row*3+col*5) % BUILDING_PALETTE.length];
    const bGeo   = new THREE.BoxGeometry(TS*.68, height, TS*.68);
    const bMesh  = mm(bGeo, color); bMesh.position.y=.13*TS+height/2; g.add(bMesh);
    const roof   = mm(gRoof, darken(color,.55)); roof.position.y=.13*TS+height+.05*TS; g.add(roof);       
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
    const grassGeo = new THREE.BoxGeometry(TS*.99,.1*TS,TS*.99);
    const grass = mm(grassGeo, 0x2d9e4e); grass.position.y=.05*TS; g.add(grass);
    [[-.4,-.4],[.4,.4]].forEach(([tx,tz]) => {
      const trk = new THREE.Mesh(new THREE.CylinderGeometry(.04*TS,.055*TS,.3*TS,6),
                    new THREE.MeshLambertMaterial({color:0x6b3d1e}));
      trk.position.set(tx*TS,.2*TS,tz*TS);
      const fol = new THREE.Mesh(new THREE.SphereGeometry(.22*TS,7,6),
                    new THREE.MeshLambertMaterial({color:0x27ae60}));
      fol.position.set(tx*TS,.48*TS,tz*TS);
      g.add(trk); g.add(fol);
    });
    return g;
  }
  function tile5() {
    const g = roadBase();
    const mk   = mm(gMarker,0xffffff,{transparent:true,opacity:.15});
    mk.rotation.x=-Math.PI/2; mk.position.y=.11*TS; g.add(mk);
    const ring = em(gRing,0xff6b6b,.8); ring.rotation.x=Math.PI/2; ring.position.y=.115*TS; g.add(ring);  
    const pole = mm(gPole,0xadb5bd); pole.position.set(-.35*TS,.55*TS,-.35*TS); g.add(pole);
    const flag = em(gFlag,0xff6b6b,.7); flag.position.set(-.15*TS,.87*TS,-.35*TS); g.add(flag);
    return g;
  }
  function tile3(row,col) {
    const g = roadBase();
    const cBod = new THREE.BoxGeometry(.58*TS,.2*TS,.34*TS);
    const cTop = new THREE.BoxGeometry(.34*TS,.15*TS,.28*TS);
    const cWh  = new THREE.CylinderGeometry(.065*TS,.065*TS,.07*TS,8);
    function smallCar(ox,oz,ci) {
      const gc = new THREE.Group();
      const col2 = CAR_PALETTE[ci%5];
      const cb = mm(cBod,col2); cb.position.y=.1*TS; gc.add(cb);
      const ct = mm(cTop,darken(col2,.75)); ct.position.set(-.04*TS,.245*TS,0); gc.add(ct);
      [[-0.19,-.12],[-.19,.12],[.19,-.12],[.19,.12]].forEach(([wx,wz])=>{
        const w=mm(cWh,0x1a1d2e); w.rotation.z=Math.PI/2; w.position.set(wx*TS,.055*TS,wz*TS); gc.add(w); 
      });
      gc.position.set(ox,.055*TS,oz); return gc;
    }
    g.add(smallCar(-.3*TS,.28*TS,(row+col)%5));
    g.add(smallCar(.28*TS,-.28*TS,(row+col+2)%5));
    return g;
  }
  function tile2() {
    const g = roadBase();
    const arrow = em(gCone,0x69db7c,.9);
    arrow.rotation.z=-Math.PI/2; arrow.position.set(-.55*TS,.15*TS,0); g.add(arrow);
    return g;
  }
  function tile4() {
    const g = roadBase();
    const swG = new THREE.BoxGeometry(.3*TS,.12*TS,TS*.99);
    const sw = mm(swG,SIDEWALK_COLOR); sw.position.set(TS*.34,.06*TS,0); g.add(sw);
    return g;
  }

  let startX = OFF, startZ = OFF;
  for (let row=0; row<G; row++) {
    for (let col=0; col<G; col++) {
      const val = matrix[row][col];
      const x = col*TS + TS/2;
      const z = row*TS + TS/2;
      let tg;
      if      (val===1) tg = PARK_POSITIONS.has(`${row},${col}`) ? parkTile() : buildingTile(row,col);    
      else if (val===2) { tg = tile2(); startX=x; startZ=z; }
      else if (val===3) tg = tile3(row,col);
      else if (val===4) tg = tile4();
      else if (val===5) tg = tile5();
      else              tg = roadBase();
      tg.position.set(x,0,z);
      cityPivot.add(tg);
    }
  }

  cityPivot.position.set(-OFF, 0, -OFF);
  return { scene, cityPivot, gnd, grid, OFF, startX, startZ };
}

// ── Fábrica de Vehículos ───────────────────────────────────────────────────
function createCar(TS, color) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(.58*TS,.2*TS,.34*TS), new THREE.MeshLambertMaterial({color}));
  body.position.y = .1*TS;
  const top = new THREE.Mesh(new THREE.BoxGeometry(.34*TS,.15*TS,.28*TS), new THREE.MeshLambertMaterial({color: darken(color, .75)}));
  top.position.set(-.04*TS,.245*TS,0);
  [[-0.19,-.12],[-.19,.12],[.19,-.12],[.19,.12]].forEach(([wx,wz])=>{
    const w = new THREE.Mesh(new THREE.CylinderGeometry(.065*TS,.065*TS,.07*TS,8), new THREE.MeshLambertMaterial({color:0x1a1d2e}));
    w.rotation.z=Math.PI/2; w.position.set(wx*TS,.055*TS,wz*TS); g.add(w);
  });
  g.add(body); g.add(top);
  return g;
}

function createMoto(TS, color) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(.45*TS,.15*TS,.12*TS), new THREE.MeshLambertMaterial({color}));
  body.position.y = .15*TS;
  const seat = new THREE.Mesh(new THREE.BoxGeometry(.25*TS,.05*TS,.1*TS), new THREE.MeshLambertMaterial({color: 0x222222}));
  seat.position.set(-.05*TS,.22*TS,0);
  [[-.18, 0], [.18, 0]].forEach(([wx, wz]) => {
    const w = new THREE.Mesh(new THREE.CylinderGeometry(.08*TS,.08*TS,.05*TS,8), new THREE.MeshLambertMaterial({color:0x111111}));
    w.rotation.z=Math.PI/2; w.position.set(wx*TS,.08*TS,wz*TS); g.add(w);
  });
  g.add(body); g.add(seat);
  return g;
}

function createHelicopter(TS, color) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.SphereGeometry(.25*TS, 8, 8), new THREE.MeshLambertMaterial({color}));
  body.scale.set(1.4, 1, 1);
  body.position.y = .35*TS;
  const tail = new THREE.Mesh(new THREE.BoxGeometry(.4*TS, .08*TS, .08*TS), new THREE.MeshLambertMaterial({color}));
  tail.position.set(-.35*TS, .35*TS, 0);
  const skidL = new THREE.Mesh(new THREE.BoxGeometry(.5*TS,.04*TS,.04*TS), new THREE.MeshLambertMaterial({color: 0x555555}));
  skidL.position.set(0, .1*TS, .15*TS);
  const skidR = skidL.clone(); skidR.position.z = -.15*TS;
  const rotorAxis = new THREE.Mesh(new THREE.CylinderGeometry(.02*TS, .02*TS, .15*TS, 8), new THREE.MeshLambertMaterial({color: 0x333333}));
  rotorAxis.position.y = .55*TS;
  const blades = new THREE.Mesh(new THREE.BoxGeometry(.8*TS, .01*TS, .08*TS), new THREE.MeshLambertMaterial({color: 0x222222}));
  blades.position.y = .63*TS;
  g.add(body); g.add(tail); g.add(skidL); g.add(skidR); g.add(rotorAxis); g.add(blades);
  g.userData.blades = blades;
  return g;
}

(function buildBackground(matrix) {
  const container = document.getElementById('bg-canvas');
  const W = window.innerWidth, H = window.innerHeight;
  const { scene, cityPivot, OFF, startX, startZ } = buildScene(matrix, TILE);
  const frust = 28, dist = 55;
  const aspect = W / H;
  const camera = new THREE.OrthographicCamera(
    -frust*aspect/2, frust*aspect/2, frust/2, -frust/2, .1, 600
  );
  camera.zoom = 1.65;
  camera.updateProjectionMatrix();
  window._menuCamera = camera;
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(W, H);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  container.appendChild(renderer.domElement);
  const TS = TILE;
  const carCol = CAR_PALETTE[1];
  let playerCar = createCar(TS, carCol);
  playerCar.position.set(startX, 0, startZ);
  cityPivot.add(playerCar);
  window._playerCarPivot = playerCar;

  let pathIdx = 0, moveProg = 0;
  const path = PATH_EXAMPLE;
  let orbitAngle = Math.PI / 4;
  const ORBIT_R = dist * .60 * Math.SQRT2;
  const ORBIT_H = dist * .55;
  const ORBIT_S = 0.00035;

  window.actualizarPreviewVehiculo = function(tipo) {
    cityPivot.remove(playerCar);
    if (tipo === 'carro') playerCar = createCar(TS, carCol);
    else if (tipo === 'moto') playerCar = createMoto(TS, carCol);
    else if (tipo === 'helicoptero') playerCar = createHelicopter(TS, carCol);
    playerCar.position.set(startX, 0, startZ);
    cityPivot.add(playerCar);
    window._playerCarPivot = playerCar;
  };
  window.addEventListener('resize', () => {
    const nW=window.innerWidth, nH=window.innerHeight, nA=nW/nH;
    camera.left=-frust*nA/2; camera.right=frust*nA/2;
    camera.updateProjectionMatrix(); renderer.setSize(nW,nH);
  });
  function loop() {
    requestAnimationFrame(loop);
    // Rotor animation
    if (playerCar && playerCar.userData.blades) {
        playerCar.userData.blades.rotation.y += 0.3;
    }
    if (path.length > 1) {
      moveProg += 0.011;
      if (moveProg >= 1) { moveProg=0; pathIdx++; if (pathIdx >= path.length-1) pathIdx=0; }
      const p1=path[pathIdx], p2=path[(pathIdx+1)%path.length];
      const x1=p1[1]*TILE+TILE/2, z1=p1[0]*TILE+TILE/2;
      const x2=p2[1]*TILE+TILE/2, z2=p2[0]*TILE+TILE/2;
      playerCar.position.x = x1+(x2-x1)*moveProg;
      playerCar.position.z = z1+(z2-z1)*moveProg;
      const dx=x2-x1, dz=z2-z1;
      if (dx||dz) {
        const ta=Math.atan2(-dz,dx); let d=ta-playerCar.rotation.y;
        while(d<-Math.PI)d+=2*Math.PI; while(d>Math.PI)d-=2*Math.PI;
        playerCar.rotation.y += d*0.12;
      }
    }
    orbitAngle += ORBIT_S;
    camera.position.set(OFF + Math.cos(orbitAngle)*ORBIT_R, ORBIT_H, OFF + Math.sin(orbitAngle)*ORBIT_R);
    camera.lookAt(OFF, 1, OFF);
    renderer.render(scene, camera);
  }
  loop();
})(DEFAULT_MATRIX);

// ── Tarjeta de sesión ─────────────────────────────────────────────────────────
const VEHICLE_LABELS = { carro: 'Carro', moto: 'Moto', helicoptero: 'Helicóptero' };

function updateSessionCard(mapa, vehiculo) {
    const elMapa = document.getElementById('status-mapa');
    const elVeh  = document.getElementById('status-vehiculo');
    if (elMapa) elMapa.textContent = mapa || '—';
    if (elVeh)  elVeh.textContent  = VEHICLE_LABELS[vehiculo] || vehiculo || '—';
}

// Cargar estado inicial desde el backend
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(async () => {
        if (typeof eel === 'undefined') return;
        try {
            const [mapa, vehiculo] = await Promise.all([
                eel.obtener_mapa_global()(),
                eel.obtener_vehiculo()()
            ]);
            updateSessionCard(mapa, vehiculo);
        } catch(e) {}
    }, 500);
});

window.irAlJuego = function() {
  const mainPanel = document.getElementById('main-panel');
  const algoPanel = document.getElementById('algoritmo-panel');
  mainPanel.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
  mainPanel.style.opacity = '0';
  mainPanel.style.transform = 'translateY(-20px)';
  setTimeout(() => {
    mainPanel.style.display = 'none';
    algoPanel.style.display = 'flex';
    algoPanel.offsetHeight;
    algoPanel.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
    algoPanel.style.opacity = '1';
    algoPanel.style.transform = 'translateY(0)';
  }, 400);
};

window.regresarAlMenu = function() {
  const mainPanel = document.getElementById('main-panel');
  const algoPanel = document.getElementById('algoritmo-panel');
  algoPanel.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
  algoPanel.style.opacity = '0';
  algoPanel.style.transform = 'translateY(20px)';
  setTimeout(() => {
    algoPanel.style.display = 'none';
    mainPanel.style.display = 'flex';
    mainPanel.offsetHeight;
    mainPanel.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
    mainPanel.style.opacity = '1';
    mainPanel.style.transform = 'translateY(0)';
  }, 400);
};

window.seleccionarAlgoritmo = function(tipo) {
  const root    = document.getElementById('menu-root');
  const bgEl    = document.getElementById('bg-canvas');
  const overlay = document.getElementById('overlay');
  const camera  = window._menuCamera;
  const DURATION = 1100;
  const startTime = performance.now();
  const startZoom = camera ? camera.zoom : 1.65;
  const targetZoom = startZoom * 5.5;
  console.log("Algoritmo seleccionado:", tipo);
  
  // Informar al backend la selección
  if (typeof eel !== 'undefined') {
    eel.seleccionar_algoritmo(tipo)();
  }

  root.style.transition    = `opacity ${DURATION * 0.55}ms ease`;
  overlay.style.transition = `opacity ${DURATION * 0.7}ms ease`;
  root.style.opacity    = '0';
  overlay.style.opacity = '0';
  bgEl.style.transition = `filter ${DURATION * 0.85}ms ease`;
  bgEl.style.filter     = 'blur(0px) brightness(1) saturate(1)';
  function animateZoom(now) {
    const elapsed  = now - startTime;
    const t        = Math.min(elapsed / DURATION, 1);
    const eased    = t * t * t;
    if (camera) {
      camera.zoom = startZoom + (targetZoom - startZoom) * eased;
      camera.updateProjectionMatrix();
    }
    if (t < 1) {
      requestAnimationFrame(animateZoom);
    } else {
      window.location.href = 'RenderMap/index.html';
    }
  }
  requestAnimationFrame(animateZoom);
};

// ── Modal Vehículo (iframe SelectVehicle) ─────────────────────────────────────
window.abrirModalVehiculo = function() {
  const modal = document.getElementById('vehicle-modal');
  if(!modal) return;
  modal.style.display = 'flex';
  setTimeout(() => modal.style.opacity = '1', 10);
};

window.cerrarModalVehiculo = function() {
  const modal = document.getElementById('vehicle-modal');
  if(!modal) return;
  modal.style.opacity = '0';
  setTimeout(() => modal.style.display = 'none', 400);
};

window.onVehicleSelected = function(tipo) {
  // Actualizar la previsualización del fondo 3D con el nuevo vehículo
  if (window.actualizarPreviewVehiculo) window.actualizarPreviewVehiculo(tipo);
  // Actualizar tarjeta de sesión
  const elVeh = document.getElementById('status-vehiculo');
  if (elVeh) elVeh.textContent = VEHICLE_LABELS[tipo] || tipo;
};

window.abrirModalMapa = function() {
  const modal = document.getElementById('map-modal');
  if(!modal) return;
  modal.style.display = 'flex';
  setTimeout(() => modal.style.opacity = '1', 10);
};

window.cerrarModalMapa = function() {
  const modal = document.getElementById('map-modal');
  if(!modal) return;
  modal.style.opacity = '0';
  setTimeout(() => modal.style.display = 'none', 400);
};

window.onMapSelected = function(mapa) {
  // Actualizar tarjeta de sesión
  const elMapa = document.getElementById('status-mapa');
  if (elMapa) elMapa.textContent = mapa || '—';
};

window.irAlCrearMapa = function() {
  const root    = document.getElementById('menu-root');
  const bgEl    = document.getElementById('bg-canvas');
  const overlay = document.getElementById('overlay');
  const camera  = window._menuCamera;
  const DURATION = 800;
  const startTime = performance.now();
  const startZoom = camera ? camera.zoom : 1.65;
  const targetZoom = startZoom * 3.5;
  root.style.transition    = `opacity ${DURATION * 0.5}ms ease`;
  overlay.style.transition = `opacity ${DURATION * 0.6}ms ease`;
  root.style.opacity    = '0';
  overlay.style.opacity = '0';
  bgEl.style.transition = `filter ${DURATION * 0.8}ms ease`;
  bgEl.style.filter     = 'blur(0px) brightness(1) saturate(1)';
  function animateZoom(now) {
    const elapsed = now - startTime;
    const t       = Math.min(elapsed / DURATION, 1);
    const eased   = t * t;
    if (camera) {
      camera.zoom = startZoom + (targetZoom - startZoom) * eased;
      camera.updateProjectionMatrix();
    }
    if (t < 1) {
      requestAnimationFrame(animateZoom);
    } else {
      window.location.href = 'CreateMap/index.html';
    }
  }
  requestAnimationFrame(animateZoom);
};

// ── Configuración de Profundidad ────────────────────────────────────────────────
let ordenOperadoresActual = ['izquierda', 'abajo', 'derecha', 'arriba'];
let elementoArrastrado = null;

// Iconos para cada operador
const iconosOperadores = {
  'izquierda': 'fa-arrow-left',
  'abajo': 'fa-arrow-down',
  'derecha': 'fa-arrow-right',
  'arriba': 'fa-arrow-up'
};

// Nombres en español
const nombresOperadores = {
  'izquierda': 'Izquierda',
  'abajo': 'Abajo',
  'derecha': 'Derecha',
  'arriba': 'Arriba'
};

window.abrirConfiguracionProfundidad = async function() {
  // Cargar orden actual desde Python
  try {
    if (typeof eel !== 'undefined' && eel.obtener_orden_operadores) {
      ordenOperadoresActual = await eel.obtener_orden_operadores()();
    }
  } catch (e) {
    console.warn('No se pudo cargar orden actual:', e);
  }
  
  // Mostrar modal
  const modal = document.getElementById('profundidad-modal');
  modal.style.display = 'flex';
  setTimeout(() => modal.style.opacity = '1', 10);
  
  // Renderizar lista ordenable
  renderizarListaOperadores();
};

function renderizarListaOperadores() {
  const lista = document.getElementById('lista-operadores');
  lista.innerHTML = '';
  
  ordenOperadoresActual.forEach((op, index) => {
    const item = document.createElement('div');
    item.className = 'operador-item';
    item.draggable = true;
    item.dataset.index = index;
    item.dataset.operador = op;
    
    item.innerHTML = `
      <div class="operador-content">
        <div class="operador-icon-wrapper">
          <i class="fa-solid ${iconosOperadores[op]}"></i>
        </div>
        <span class="operador-nombre">${nombresOperadores[op]}</span>
      </div>
      <div class="operador-grip">
        <i class="fa-solid fa-grip-vertical"></i>
        <i class="fa-solid fa-grip-vertical"></i>
      </div>
    `;
    
    // Eventos de drag & drop
    item.addEventListener('dragstart', handleDragStart);
    item.addEventListener('dragover', handleDragOver);
    item.addEventListener('drop', handleDrop);
    item.addEventListener('dragend', handleDragEnd);
    item.addEventListener('dragenter', handleDragEnter);
    item.addEventListener('dragleave', handleDragLeave);
    
    lista.appendChild(item);
  });
}

function handleDragStart(e) {
  elementoArrastrado = this;
  this.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/html', this.innerHTML);
  
  // Agregar efecto visual al elemento que se arrastra
  setTimeout(() => {
    this.style.opacity = '0.4';
  }, 0);
}

function handleDragOver(e) {
  if (e.preventDefault) {
    e.preventDefault();
  }
  
  e.dataTransfer.dropEffect = 'move';
  
  // Agregar indicador visual de dónde se soltará
  if (elementoArrastrado && elementoArrastrado !== this) {
    const rect = this.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const height = rect.height;
    
    // Determinar si se inserta arriba o abajo
    if (y < height / 2) {
      this.classList.add('drop-above');
      this.classList.remove('drop-below');
    } else {
      this.classList.add('drop-below');
      this.classList.remove('drop-above');
    }
  }
  
  return false;
}

function handleDragEnter(e) {
  if (elementoArrastrado && elementoArrastrado !== this) {
    this.classList.add('drag-over');
  }
}

function handleDragLeave(e) {
  this.classList.remove('drag-over', 'drop-above', 'drop-below');
}

function handleDrop(e) {
  if (e.stopPropagation) {
    e.stopPropagation();
  }
  
  this.classList.remove('drag-over', 'drop-above', 'drop-below');
  
  if (elementoArrastrado !== this) {
    const indiceOrigen = parseInt(elementoArrastrado.dataset.index);
    const indiceDestino = parseInt(this.dataset.index);
    
    // Reordenar array
    const [removido] = ordenOperadoresActual.splice(indiceOrigen, 1);
    ordenOperadoresActual.splice(indiceDestino, 0, removido);
    
    // Re-renderizar con animación
    renderizarListaOperadores();
  }
  
  return false;
}

function handleDragEnd(e) {
  this.classList.remove('dragging');
  this.style.opacity = '1';
  
  // Limpiar todas las clases de drag-over en todos los elementos
  document.querySelectorAll('.operador-item').forEach(item => {
    item.classList.remove('drag-over', 'drop-above', 'drop-below');
  });
  
  elementoArrastrado = null;
}

window.aplicarOrdenProfundidad = async function() {
  try {
    if (typeof eel !== 'undefined' && eel.establecer_orden_operadores) {
      const resultado = await eel.establecer_orden_operadores(ordenOperadoresActual)();
      if (resultado.ok) {
        // Seleccionar algoritmo de profundidad
        if (eel.seleccionar_algoritmo) {
          await eel.seleccionar_algoritmo('profundidad')();
        }
        cerrarModalProfundidad();
        // Continuar con la navegación normal
        seleccionarAlgoritmo('profundidad');
      } else {
        alert('Error al establecer orden: ' + (resultado.error || 'desconocido'));
      }
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Error al aplicar orden');
  }
};

window.cerrarModalProfundidad = function() {
  const modal = document.getElementById('profundidad-modal');
  modal.style.opacity = '0';
  setTimeout(() => modal.style.display = 'none', 400);
};