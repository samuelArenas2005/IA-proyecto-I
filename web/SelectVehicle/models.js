import * as THREE from 'three';

export function createCarro(color = 0x6c63ff) {
    const g = new THREE.Group();
    const mBody = new THREE.MeshLambertMaterial({ color });
    const mDark = new THREE.MeshLambertMaterial({ color: darken(color, 0.6) });
    const mBlack = new THREE.MeshLambertMaterial({ color: 0x1a1d2e });
    const mGlass = new THREE.MeshLambertMaterial({ color: 0x74c0fc, transparent: true, opacity: 0.7 });
    const mLight = new THREE.MeshLambertMaterial({ color: 0xfff3c4, emissive: 0xfff3c4, emissiveIntensity: 0.5 });
    const mTail  = new THREE.MeshLambertMaterial({ color: 0xff6b6b, emissive: 0xff6b6b, emissiveIntensity: 0.4 });

    // Carrocería
    const body = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.7, 1.4), mBody);
    body.position.y = 0.5;
    g.add(body);

    // Techo/cabina
    const top = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.55, 1.2), mDark);
    top.position.set(-0.1, 1.08, 0);
    g.add(top);

    // Parabrisas delantero
    const windF = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.5, 1.1), mGlass);
    windF.position.set(0.62, 1.0, 0);
    windF.rotation.y = Math.PI / 2;
    g.add(windF);

    // Parabrisas trasero
    const windR = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.5, 1.1), mGlass);
    windR.position.set(-0.82, 1.0, 0);
    windR.rotation.y = Math.PI / 2;
    g.add(windR);

    // Ruedas
    const wheelGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.28, 14);
    const wheelPos = [[ 0.75, 0.22, 0.7], [ 0.75, 0.22, -0.7],
                      [-0.75, 0.22, 0.7], [-0.75, 0.22, -0.7]];
    wheelPos.forEach(([x,y,z]) => {
        const w = new THREE.Mesh(wheelGeo, mBlack);
        w.rotation.x = Math.PI / 2;
        w.position.set(x, y, z);
        g.add(w);
        // Aro interior
        const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.3, 8), new THREE.MeshLambertMaterial({color: 0xadb5bd}));
        rim.rotation.x = Math.PI / 2;
        rim.position.set(x, y, z);
        g.add(rim);
    });

    // Faros delanteros
    [[1.21, 0.55, 0.45], [1.21, 0.55, -0.45]].forEach(([x,y,z]) => {
        const fl = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.18, 0.22), mLight);
        fl.position.set(x, y, z);
        g.add(fl);
    });

    // Faros traseros
    [[-1.21, 0.55, 0.45], [-1.21, 0.55, -0.45]].forEach(([x,y,z]) => {
        const fl = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.18, 0.22), mTail);
        fl.position.set(x, y, z);
        g.add(fl);
    });

    return g;
}

export function createMoto(color = 0x6c63ff) {
    const g = new THREE.Group();
    const mBody = new THREE.MeshLambertMaterial({ color });
    const mMetal = new THREE.MeshLambertMaterial({ color: 0xadb5bd });
    const mBlack = new THREE.MeshLambertMaterial({ color: 0x1a1d2e });
    const mLight = new THREE.MeshLambertMaterial({ color: 0xfff3c4, emissive: 0xfff3c4, emissiveIntensity: 0.6 });

    // Chasis central
    const chassis = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.3, 0.3), mMetal);
    chassis.position.y = 0.55;
    g.add(chassis);

    // Tanque
    const tank = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.3, 0.42), mBody);
    tank.position.set(0.25, 0.78, 0);
    g.add(tank);

    // Asiento
    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.15, 0.36), new THREE.MeshLambertMaterial({color: 0x212529}));
    seat.position.set(-0.2, 0.85, 0);
    g.add(seat);

    // Carenado delantero
    const fairing = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.55, 0.4), mBody);
    fairing.position.set(0.78, 0.7, 0);
    g.add(fairing);

    // Manillar
    const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.7, 8), mMetal);
    bar.rotation.z = Math.PI / 2;
    bar.position.set(0.72, 0.95, 0);
    g.add(bar);

    // Ruedas
    const wheelGeo = new THREE.CylinderGeometry(0.38, 0.38, 0.2, 16);
    [0.8, -0.8].forEach(x => {
        const w = new THREE.Mesh(wheelGeo, mBlack);
        w.rotation.x = Math.PI / 2;
        w.position.set(x, 0.38, 0);
        g.add(w);
        const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.22, 8), mMetal);
        rim.rotation.x = Math.PI / 2;
        rim.position.set(x, 0.38, 0);
        g.add(rim);
    });

    // Faro delantero
    const fl = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.2, 0.25), mLight);
    fl.position.set(0.9, 0.78, 0);
    g.add(fl);

    // Escape
    const exhaust = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, 0.9, 8), mMetal);
    exhaust.rotation.z = Math.PI / 2;
    exhaust.position.set(-0.35, 0.38, 0.22);
    g.add(exhaust);

    return g;
}

export function createHelicoptero(color = 0x6c63ff) {
    const g = new THREE.Group();
    const mBody = new THREE.MeshLambertMaterial({ color });
    const mDark = new THREE.MeshLambertMaterial({ color: darken(color, 0.6) });
    const mMetal = new THREE.MeshLambertMaterial({ color: 0xadb5bd });
    const mGlass = new THREE.MeshLambertMaterial({ color: 0x74c0fc, transparent: true, opacity: 0.65 });

    // Fuselaje principal (cuerpo ovoide via BoxGeometry escalado)
    const fuselage = new THREE.Mesh(new THREE.SphereGeometry(0.9, 12, 8), mBody);
    fuselage.scale.set(1.6, 1.0, 1.0);
    fuselage.position.y = 1.0;
    g.add(fuselage);

    // Cúpula de cabina (vidrio)
    const dome = new THREE.Mesh(new THREE.SphereGeometry(0.65, 12, 8), mGlass);
    dome.scale.set(1.0, 0.75, 1.0);
    dome.position.set(0.7, 1.05, 0);
    g.add(dome);

    // Cola (tubo)
    const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.07, 2.0, 8), mDark);
    tail.rotation.z = Math.PI / 2;
    tail.position.set(-1.7, 0.95, 0);
    g.add(tail);

    // Timón en la cola
    const rudder = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.6, 0.4), mBody);
    rudder.position.set(-2.6, 1.1, 0);
    g.add(rudder);

    // Rotor trasero (pequeño)
    const tailRotor = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.8, 0.08), mMetal);
    tailRotor.position.set(-2.6, 1.25, 0.22);
    tailRotor.userData.isTailRotor = true;
    g.add(tailRotor);

    // Eje del rotor principal
    const rotorAxis = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.45, 8), mMetal);
    rotorAxis.position.y = 1.7;
    g.add(rotorAxis);

    // Paletas del rotor principal (2 aspas cruzadas)
    const bladeGroup = new THREE.Group();
    bladeGroup.position.y = 1.95;
    const bladeGeo = new THREE.BoxGeometry(3.2, 0.06, 0.22);
    const blade1 = new THREE.Mesh(bladeGeo, mMetal);
    const blade2 = new THREE.Mesh(bladeGeo, mMetal);
    blade2.rotation.y = Math.PI / 2;
    bladeGroup.add(blade1, blade2);
    bladeGroup.userData.isMainRotor = true;
    g.add(bladeGroup);

    // Esquís (patas)
    [[-0.25], [0.25]].forEach(([z]) => {
        const bar1 = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.55, 8), mMetal);
        bar1.position.set(0.35, 0.35, z * 3);
        g.add(bar1);
        const bar2 = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.55, 8), mMetal);
        bar2.position.set(-0.35, 0.35, z * 3);
        g.add(bar2);
        const ski = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.08, 0.12), mMetal);
        ski.position.set(0, 0.1, z * 3);
        g.add(ski);
    });

    return g;
}

function darken(hex, f) {
    const r = ((hex >> 16) & 0xff) * f | 0;
    const g = ((hex >> 8) & 0xff) * f | 0;
    const b = (hex & 0xff) * f | 0;
    return (r << 16) | (g << 8) | b;
}
