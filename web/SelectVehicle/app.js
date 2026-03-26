import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { createCarro, createMoto, createHelicoptero } from './models.js';

// ── Vehículos integrados (no-GLB) ────────────────────────────────────────────
const BUILTIN_VEHICLES = [
    { id: 'carro',       name: 'Carro',       desc: 'Vehículo estándar', icon: 'fa-car',        glb: false },
    { id: 'moto',        name: 'Moto',         desc: 'Ágil y veloz',      icon: 'fa-motorcycle', glb: false },
    { id: 'helicoptero', name: 'Helicóptero',  desc: 'Vista aérea',       icon: 'fa-helicopter', glb: false },
];

let scene, camera, renderer, controls;
let currentMesh = null;
let currentVehicle = 'carro';
let currentVehicleName = 'Carro';
let mainRotorRef = null;
let allVehicles = [...BUILTIN_VEHICLES];

const VEHICLE_ACCENT = 0x6c63ff;
const gltfLoader = new GLTFLoader();

// ── Escena 3D ─────────────────────────────────────────────────────────────────
function initScene() {
    const container = document.getElementById('preview-container');
    const W = container.clientWidth;
    const H = container.clientHeight;

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0d1020);

    scene.add(new THREE.AmbientLight(0xffffff, 0.8));
    const sun = new THREE.DirectionalLight(0xfff8e7, 1.6);
    sun.position.set(5, 8, 5);
    scene.add(sun);
    const fill = new THREE.DirectionalLight(0xaad4ff, 0.5);
    fill.position.set(-5, 3, -5);
    scene.add(fill);
    const rim = new THREE.DirectionalLight(0x6c63ff, 0.4);
    rim.position.set(0, -2, -6);
    scene.add(rim);

    // Plataforma
    const platform = new THREE.Mesh(
        new THREE.CylinderGeometry(3.2, 3.2, 0.15, 40),
        new THREE.MeshLambertMaterial({ color: 0x1f233b })
    );
    platform.position.y = -0.1;
    scene.add(platform);

    const ring = new THREE.Mesh(
        new THREE.TorusGeometry(3.2, 0.06, 8, 40),
        new THREE.MeshLambertMaterial({ color: 0x6c63ff, emissive: 0x6c63ff, emissiveIntensity: 0.5 })
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.y = -0.02;
    scene.add(ring);

    const grid = new THREE.GridHelper(8, 8, 0x2b324d, 0x1f233b);
    grid.position.y = -0.04;
    scene.add(grid);

    camera = new THREE.PerspectiveCamera(45, W / H, 0.1, 200);
    camera.position.set(5, 4, 5);
    camera.lookAt(0, 1, 0);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.enablePan = false;
    controls.minDistance = 2;
    controls.maxDistance = 14;
    controls.maxPolarAngle = Math.PI / 2;
    controls.target.set(0, 1, 0);

    window.addEventListener('resize', () => {
        const w = container.clientWidth;
        const h = container.clientHeight;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
    });

    function animate() {
        requestAnimationFrame(animate);
        controls.update();
        if (mainRotorRef) mainRotorRef.rotation.y += 0.06;
        renderer.render(scene, camera);
    }
    animate();
}

// ── Cargar modelo ─────────────────────────────────────────────────────────────
function clearScene() {
    if (currentMesh) {
        scene.remove(currentMesh);
        currentMesh = null;
        mainRotorRef = null;
    }
}

function centerAndFit(object) {
    const box = new THREE.Box3().setFromObject(object);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const scale = 3.0 / maxDim;
    object.scale.setScalar(scale);
    object.position.sub(center.multiplyScalar(scale));
    object.position.y += 0.55; // flota sobre la plataforma
}

function loadBuiltinVehicle(id) {
    clearScene();
    let mesh;
    if (id === 'carro') mesh = createCarro(VEHICLE_ACCENT);
    else if (id === 'moto') mesh = createMoto(VEHICLE_ACCENT);
    else mesh = createHelicoptero(VEHICLE_ACCENT);

    mesh.traverse(o => {
        if (o.userData.isMainRotor) mainRotorRef = o;
    });

    mesh.position.y += 0.45; // flota sobre la plataforma
    scene.add(mesh);
    currentMesh = mesh;
}

function loadGLBVehicle(filename) {
    clearScene();
    document.getElementById('selected-vehicle-name').textContent = 'Cargando...';
    // El iframe está en SelectVehicle/, por eso la ruta es assets/ (no SelectVehicle/assets/)
    const url = `assets/${filename}`;
    gltfLoader.load(
        url,
        (gltf) => {
            const model = gltf.scene;
            centerAndFit(model);
            model.traverse(o => {
                if (o.isMesh) {
                    o.castShadow = true;
                    o.receiveShadow = true;
                }
            });
            scene.add(model);
            currentMesh = model;
            document.getElementById('selected-vehicle-name').textContent = currentVehicleName;
        },
        undefined,
        (err) => {
            console.error('Error cargando GLB:', err);
            showError('Error al renderizar el modelo. El archivo puede estar corrupto.');
            // Fallback: carro integrado
            loadBuiltinVehicle('carro');
        }
    );
}

function loadVehicle(vehicle) {
    currentVehicleName = vehicle.name;
    document.getElementById('selected-vehicle-name').textContent = vehicle.name;
    if (vehicle.glb) {
        loadGLBVehicle(vehicle.id); // id == filename para GLB
    } else {
        loadBuiltinVehicle(vehicle.id);
    }
}

// ── Lista de vehículos ────────────────────────────────────────────────────────
function renderVehicleList() {
    const list = document.getElementById('vehicle-list');
    list.innerHTML = '';

    allVehicles.forEach(v => {
        const div = document.createElement('div');
        div.className = 'vehicle-item' + (v.id === currentVehicle ? ' selected' : '');
        div.id = 'item-' + v.id.replace('.', '_');
        div.onclick = () => window.selectVehicle(v.id);

        const iconClass = v.glb ? 'fa-cube' : (v.icon || 'fa-car');
        div.innerHTML = `
            <div class="vehicle-item__icon"><i class="fa-solid ${iconClass}"></i></div>
            <div class="vehicle-item__info">
                <span class="vehicle-item__name">${v.name}</span>
                <span class="vehicle-item__desc">${v.desc}</span>
            </div>
            ${v.glb ? '<span class="vehicle-item__badge">GLB</span>' : ''}
            <i class="fa-solid fa-check vehicle-item__check"></i>
        `;
        list.appendChild(div);
    });
}

// ── Errores ───────────────────────────────────────────────────────────────────
function showError(msg) {
    const el = document.getElementById('error-banner');
    el.textContent = msg;
    el.classList.add('visible');
    setTimeout(() => el.classList.remove('visible'), 5000);
}
function hideError() {
    document.getElementById('error-banner').classList.remove('visible');
}

// ── Upload GLB ────────────────────────────────────────────────────────────────
async function handleGLBUpload(file) {
    hideError();
    if (!file || !file.name.toLowerCase().endsWith('.glb')) {
        showError('Solo se permiten archivos .glb');
        return;
    }

    if (!window.eel || !window.eel.guardar_glb_vehiculo) {
        showError('No hay conexión con el backend para guardar el modelo.');
        return;
    }

    // Mostrar estado de carga en la UI
    document.getElementById('selected-vehicle-name').textContent = 'Subiendo modelo...';

    // Leer como base64
    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            const base64 = e.target.result.split(',')[1];
            const res = await window.eel.guardar_glb_vehiculo(file.name, base64)();
            if (!res || !res.ok) {
                showError('Error guardando: ' + (res?.error || 'desconocido'));
                document.getElementById('selected-vehicle-name').textContent = currentVehicleName;
                return;
            }
            // Recargar lista de GLB y seleccionar el nuevo
            await refreshGLBList();
            window.selectVehicle(file.name);
        } catch (err) {
            showError('Error durante la subida.');
            document.getElementById('selected-vehicle-name').textContent = currentVehicleName;
        }
    };
    reader.onerror = () => {
        showError('Error al leer el archivo local.');
        document.getElementById('selected-vehicle-name').textContent = currentVehicleName;
    };
    reader.readAsDataURL(file);
}

async function refreshGLBList() {
    if (!window.eel) return;
    try {
        const glbFiles = await window.eel.obtener_lista_glb()();
        // Eliminar GLB anteriores para no duplicar
        allVehicles = [...BUILTIN_VEHICLES];
        glbFiles.forEach(fname => {
            const name = fname.replace('.glb', '').replace(/_/g, ' ');
            allVehicles.push({ id: fname, name, desc: 'Modelo 3D externo', glb: true });
        });
        renderVehicleList();
    } catch(e) { console.error(e); }
}

// ── API pública ────────────────────────────────────────────────────────────────
window.selectVehicle = function(id) {
    currentVehicle = id;
    const vehicle = allVehicles.find(v => v.id === id) || BUILTIN_VEHICLES[0];
    renderVehicleList();
    loadVehicle(vehicle);
};

window.confirmVehicle = async function() {
    if (window.eel && window.eel.seleccionar_vehiculo) {
        await window.eel.seleccionar_vehiculo(currentVehicle)();
    }
    if (window.parent && window.parent.onVehicleSelected) {
        window.parent.onVehicleSelected(currentVehicle);
    }
    if (window.parent && window.parent.cerrarModalVehiculo) {
        window.parent.cerrarModalVehiculo();
    }
};

window.closeModal = function() {
    if (window.parent && window.parent.cerrarModalVehiculo) {
        window.parent.cerrarModalVehiculo();
    }
};

// ── Init ──────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    initScene();

    document.getElementById('glb-input').addEventListener('change', (e) => {
        if (e.target.files.length > 0) handleGLBUpload(e.target.files[0]);
        e.target.value = '';
    });

    setTimeout(async () => {
        // Cargar GLB externos
        await refreshGLBList();

        // Recuperar vehículo guardado en el backend
        let savedVehicle = 'carro';
        if (window.eel && window.eel.obtener_vehiculo) {
            try { savedVehicle = await window.eel.obtener_vehiculo()(); } catch(e) {}
        }
        window.selectVehicle(savedVehicle);
    }, 300);
});
