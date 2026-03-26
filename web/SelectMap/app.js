import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

let currentSelection = '';
let scene, camera, renderer, mapPivot, controls;

// Setup Three.js Basic Scene
function initScene() {
    const container = document.getElementById('preview-container');
    const width = container.clientWidth;
    const height = container.clientHeight;

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1d33);

    const aspect = width / height;
    const frustum = 35;
    camera = new THREE.OrthographicCamera(-frustum*aspect/2, frustum*aspect/2, frustum/2, -frustum/2, 0.1, 1000);
    camera.position.set(40, 40, 40);
    camera.lookAt(0, 0, 0);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.enablePan = false;
    controls.maxPolarAngle = Math.PI / 2.2;

    const ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
    scene.add(ambientLight);
    const sunLight = new THREE.DirectionalLight(0xffffff, 1.2);
    sunLight.position.set(20, 40, 20);
    scene.add(sunLight);
    
    mapPivot = new THREE.Group();
    scene.add(mapPivot);

    const animate = () => {
        requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
    };
    animate();

    window.addEventListener('resize', () => {
        const w = container.clientWidth;
        const h = container.clientHeight;
        const a = w / h;
        camera.left = -frustum * a / 2;
        camera.right = frustum * a / 2;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
    });
}

const TILE = 2;
const BUILDING_PALETTE = [0x7c6fff, 0x5c8fff, 0x3fb8f5, 0x9a63ff, 0x4c7cfa, 0x38d9a9];

function renderMapPreview(matrix) {
    if(!mapPivot) return;
    while(mapPivot.children.length > 0) { 
        mapPivot.remove(mapPivot.children[0]); 
    }
    const R = matrix.length;
    const C = matrix[0].length;
    
    // Suelo
    const gnd = new THREE.Mesh(
        new THREE.PlaneGeometry(C*TILE, R*TILE), 
        new THREE.MeshLambertMaterial({color: 0x1c1f38})
    );
    gnd.rotation.x = -Math.PI / 2;
    gnd.position.set(C*TILE/2, -0.1, R*TILE/2);
    mapPivot.add(gnd);
    
    const trGeo = new THREE.BoxGeometry(TILE*0.97, 0.1, TILE*0.97);
    
    for(let r=0; r<R; r++) {
        for(let c=0; c<C; c++) {
            const val = matrix[r][c];
            const x = c * TILE + TILE/2;
            const z = r * TILE + TILE/2;
            let mesh;

            if(val === 1) { // Edificio
                const h = TILE * (0.5 + ((r*13+c*7) % 3) * 0.9);
                const color = BUILDING_PALETTE[(r*3+c*5) % BUILDING_PALETTE.length];
                mesh = new THREE.Mesh(
                    new THREE.BoxGeometry(TILE*0.78, h, TILE*0.78),
                    new THREE.MeshLambertMaterial({color})
                );
                mesh.position.set(x, h/2, z);
            } else if(val === 2) { // Inicio
                mesh = new THREE.Mesh(trGeo, new THREE.MeshLambertMaterial({color: 0x51cf66}));
                mesh.position.set(x, 0.05, z);
                // Flecha cónica indicadora
                const cone = new THREE.Mesh(
                    new THREE.ConeGeometry(TILE*0.18, TILE*0.4, 8),
                    new THREE.MeshLambertMaterial({color: 0x69db7c, emissive: 0x69db7c, emissiveIntensity: 0.5})
                );
                cone.position.set(x, 0.7, z);
                mapPivot.add(cone);
            } else if(val === 5) { // Meta
                mesh = new THREE.Mesh(trGeo, new THREE.MeshLambertMaterial({color: 0xff6b6b}));
                mesh.position.set(x, 0.05, z);
                // Polo/bandera
                const pole = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.05, 0.05, 1.2, 8),
                    new THREE.MeshLambertMaterial({color: 0xadb5bd})
                );
                pole.position.set(x - TILE*0.2, 0.6, z - TILE*0.2);
                const flag = new THREE.Mesh(
                    new THREE.BoxGeometry(TILE*0.35, TILE*0.2, 0.05),
                    new THREE.MeshLambertMaterial({color: 0xff6b6b, emissive: 0xff6b6b, emissiveIntensity: 0.5})
                );
                flag.position.set(x - TILE*0.2 + TILE*0.18, 1.05, z - TILE*0.2);
                mapPivot.add(pole);
                mapPivot.add(flag);
            } else if(val === 3) { // Tráfico / Obstáculo (naranja)
                mesh = new THREE.Mesh(trGeo, new THREE.MeshLambertMaterial({color: 0x343a50}));
                mesh.position.set(x, 0.05, z);
                const coneGeo = new THREE.ConeGeometry(TILE*0.12, TILE*0.35, 8);
                const coneMat = new THREE.MeshLambertMaterial({color: 0xff922b, emissive: 0xff7800, emissiveIntensity: 0.4});
                [[-0.3, -0.3], [0.3, 0.3]].forEach(([ox, oz]) => {
                    const tc = new THREE.Mesh(coneGeo, coneMat);
                    tc.position.set(x + ox, 0.3, z + oz);
                    mapPivot.add(tc);
                });
            } else if(val === 4) { // Persona (azul claro)
                mesh = new THREE.Mesh(trGeo, new THREE.MeshLambertMaterial({color: 0x343a50}));
                mesh.position.set(x, 0.05, z);
                const body = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.12, 0.15, 0.5, 8),
                    new THREE.MeshLambertMaterial({color: 0x4dabf7})
                );
                body.position.set(x, 0.4, z);
                const head = new THREE.Mesh(
                    new THREE.SphereGeometry(0.18, 8, 8),
                    new THREE.MeshLambertMaterial({color: 0xffa94d})
                );
                head.position.set(x, 0.82, z);
                mapPivot.add(body);
                mapPivot.add(head);
            } else { // Calle libre
                mesh = new THREE.Mesh(trGeo, new THREE.MeshLambertMaterial({color: 0x343a50}));
                mesh.position.set(x, 0.05, z);
            }
            if(mesh) mapPivot.add(mesh);
        }
    }
    
    // Centrar el pivote
    mapPivot.position.set(-C*TILE/2, 0, -R*TILE/2);
}

// ── Validación de un mapa TXT ──────────────────────────────────────────────────
function showError(msg) {
    const el = document.getElementById('error-banner');
    el.textContent = msg;
    el.classList.add('visible');
}
function hideError() {
    document.getElementById('error-banner').classList.remove('visible');
}

function validateMapText(text) {
    const lines = text.trim().split('\n').map(l => l.trim()).filter(l => l.length > 0);
    const N = lines.length;
    if (N < 2) return { ok: false, error: 'El mapa debe tener al menos 2 filas.' };

    let count2 = 0, count5 = 0;
    const VALID = new Set([0,1,2,3,4,5]);
    const matrix = [];
    
    for(let i = 0; i < N; i++) {
        const row = lines[i].split(/\s+/).map(Number);
        if(row.length !== N) return { ok: false, error: `El mapa no es cuadrado: fila ${i+1} tiene ${row.length} columnas pero se esperaban ${N}.` };
        for(const v of row) {
            if(!VALID.has(v) || !Number.isInteger(v)) return { ok: false, error: `Valor inválido "${v}" en fila ${i+1}. Solo se permiten 0–5.` };
            if(v === 2) count2++;
            if(v === 5) count5++;
        }
        matrix.push(row);
    }
    if(count2 !== 1) return { ok: false, error: `El mapa debe tener exactamente un inicio (2), pero tiene ${count2}.` };
    if(count5 !== 1) return { ok: false, error: `El mapa debe tener exactamente una meta (5), pero tiene ${count5}.` };
    return { ok: true, matrix };
}

// ── UI Integration ──────────────────────────────────────────────────────────
let todosLosMapas = [];

window.closeModal = function() {
    if(window.parent && window.parent.cerrarModalMapa) {
        window.parent.cerrarModalMapa();
    }
};

window.confirmMap = async function() {
    if(!currentSelection) return;
    if(window.eel && window.eel.seleccionar_mapa_global) {
        await window.eel.seleccionar_mapa_global(currentSelection)();
        if(window.parent && window.parent.onMapSelected) {
            window.parent.onMapSelected(currentSelection);
        }
        if(window.parent && window.parent.cerrarModalMapa) {
            window.parent.cerrarModalMapa();
        }
    }
};

async function loadMapPreview(filename) {
    if(!window.eel) return;
    const res = await window.eel.cargar_mapa_desde_archivo('mapas/pruebas/' + filename)();
    if(res && res.ok) {
        const matrix = await window.eel.obtener_matriz_ciudad()();
        renderMapPreview(matrix);
    }
}

function renderList(list) {
    const listEl = document.getElementById('map-list');
    listEl.innerHTML = '';
    list.forEach(m => {
        const div = document.createElement('div');
        div.className = 'map-item ' + (m === currentSelection ? 'selected' : '');
        div.innerHTML = `<i class="fa-solid fa-map-location-dot"></i> <span>${m}</span>`;
        div.onclick = () => {
            currentSelection = m;
            document.getElementById('selected-map-name').textContent = m;
            document.getElementById('btn-confirm').classList.add('active');
            hideError();
            renderList(todosLosMapas); 
            loadMapPreview(m);
        };
        listEl.appendChild(div);
    });
}

// ── File Upload ────────────────────────────────────────────────────────────────
async function handleFileUpload(file) {
    hideError();
    if(!file || !file.name.endsWith('.txt')) {
        showError('Solo se permiten archivos .txt');
        return;
    }

    const text = await file.text();
    const result = validateMapText(text);
    if(!result.ok) {
        showError('❌ Mapa inválido: ' + result.error);
        return;
    }

    // Enviar al backend para guardarlo
    if(window.eel && window.eel.guardar_mapa_subido) {
        const saveRes = await window.eel.guardar_mapa_subido(file.name, text)();
        if(!saveRes || !saveRes.ok) {
            showError('Error guardando el mapa: ' + (saveRes?.error || 'desconocido'));
            return;
        }
        // Recargar lista y seleccionar el nuevo
        todosLosMapas = await window.eel.obtener_lista_mapas()();
        currentSelection = file.name;
        document.getElementById('selected-map-name').textContent = file.name;
        document.getElementById('btn-confirm').classList.add('active');
        renderList(todosLosMapas);
        renderMapPreview(result.matrix);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    initScene();
    
    document.getElementById('map-search').addEventListener('input', (e) => {
        const q = e.target.value.toLowerCase();
        const filtered = todosLosMapas.filter(m => m.toLowerCase().includes(q));
        renderList(filtered);
    });

    document.getElementById('file-input').addEventListener('change', (e) => {
        if(e.target.files.length > 0) handleFileUpload(e.target.files[0]);
        e.target.value = '';
    });

    setTimeout(async () => {
        if(window.eel && window.eel.obtener_lista_mapas) {
            todosLosMapas = await window.eel.obtener_lista_mapas()();
            const defMap = await window.eel.obtener_mapa_global()();
            renderList(todosLosMapas);
            if(defMap && todosLosMapas.includes(defMap)) {
                currentSelection = defMap;
                document.getElementById('selected-map-name').textContent = defMap;
                document.getElementById('btn-confirm').classList.add('active');
                renderList(todosLosMapas);
                loadMapPreview(defMap);
            } else if(todosLosMapas.length > 0) {
                currentSelection = todosLosMapas[0];
                document.getElementById('selected-map-name').textContent = currentSelection;
                document.getElementById('btn-confirm').classList.add('active');
                renderList(todosLosMapas);
                loadMapPreview(currentSelection);
            }
        }
    }, 400);
});
