import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { createCarro, createMoto, createHelicoptero } from './models.js';

let scene, camera, renderer, controls;
let currentMesh = null;
let currentVehicle = 'carro';
let mainRotorRef = null;
let animFrameId = null;

const VEHICLE_ACCENT = 0x6c63ff;
const VEHICLE_NAMES = {
    carro: 'Carro',
    moto: 'Moto',
    helicoptero: 'Helicóptero'
};

function initScene() {
    const container = document.getElementById('preview-container');
    const W = container.clientWidth;
    const H = container.clientHeight;

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0d1020);

    // Iluminación
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

    // Plataforma decorativa
    const platform = new THREE.Mesh(
        new THREE.CylinderGeometry(3.2, 3.2, 0.15, 40),
        new THREE.MeshLambertMaterial({ color: 0x1f233b })
    );
    platform.position.y = -0.1;
    scene.add(platform);

    // Línea de acento en el borde
    const ring = new THREE.Mesh(
        new THREE.TorusGeometry(3.2, 0.06, 8, 40),
        new THREE.MeshLambertMaterial({ color: 0x6c63ff, emissive: 0x6c63ff, emissiveIntensity: 0.5 })
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.y = -0.02;
    scene.add(ring);

    // Cuadrícula sutil
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
    controls.minDistance = 3;
    controls.maxDistance = 12;
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
        animFrameId = requestAnimationFrame(animate);
        controls.update();
        // Rotor principal
        if (mainRotorRef) mainRotorRef.rotation.y += 0.06;
        renderer.render(scene, camera);
    }
    animate();
}

function loadVehicle(type) {
    if (currentMesh) {
        scene.remove(currentMesh);
        currentMesh = null;
        mainRotorRef = null;
    }
    let mesh;
    if (type === 'carro') mesh = createCarro(VEHICLE_ACCENT);
    else if (type === 'moto') mesh = createMoto(VEHICLE_ACCENT);
    else mesh = createHelicoptero(VEHICLE_ACCENT);

    // Buscar rotor
    mesh.traverse(o => {
        if (o.userData.isMainRotor) mainRotorRef = o;
    });

    scene.add(mesh);
    currentMesh = mesh;
    document.getElementById('selected-vehicle-name').textContent = VEHICLE_NAMES[type];
}

// ── UI Integration ──────────────────────────────────────────────────────────
window.selectVehicle = function(type) {
    currentVehicle = type;
    // UI items
    document.querySelectorAll('.vehicle-item').forEach(el => el.classList.remove('selected'));
    const item = document.getElementById('item-' + type);
    if (item) item.classList.add('selected');
    loadVehicle(type);
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

document.addEventListener('DOMContentLoaded', () => {
    initScene();

    setTimeout(async () => {
        let savedVehicle = 'carro';
        if (window.eel && window.eel.obtener_vehiculo) {
            try { savedVehicle = await window.eel.obtener_vehiculo()(); } catch(e) {}
        }
        // Seleccionar el guardado globalmente
        window.selectVehicle(savedVehicle);
    }, 300);
});
