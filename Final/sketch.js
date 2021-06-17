import * as THREE from 'https://threejsfundamentals.org/threejs/resources/threejs/r127/build/three.module.js';
import {
    OrbitControls
} from 'https://threejsfundamentals.org/threejs/resources/threejs/r127/examples/jsm/controls/OrbitControls.js';
import {
    OBJLoader
} from 'https://threejsfundamentals.org/threejs/resources/threejs/r127/examples/jsm/loaders/OBJLoader.js'

import {
    GUI
} from 'https://threejsfundamentals.org/threejs/resources/threejs/r127/examples/jsm/libs/dat.gui.module.js';

let spotLight;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, -45, 15);
const renderer = new THREE.WebGLRenderer({
    antialias: true
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 0, 2);
controls.update();

// init lights
let lights = Array(9);
for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
        let light = new THREE.SpotLight(0xFFFFFF);
        light.castShadow = true;
        light.shadow.mapSize.width = 1024;
        light.shadow.mapSize.height = 1024;
        light.position.set(i * 30 - 30, j * 30 - 30, 50);
        light.angle = Math.PI / 6;
        light.decay = 2;
        light.intensity = 0.15;
        light.penumbra = 1;
        lights[i * 3 + j] = light;
        scene.add(light);
    }
}

spotLight = lights[0];
let spotLightHelper = new THREE.SpotLightHelper(spotLight);
scene.add(spotLightHelper);

const planeSize = 100;
const planeGeo = new THREE.PlaneGeometry(planeSize, planeSize);
const planeMat = new THREE.MeshPhongMaterial({
    color: 0x808080,
    dithering: true
});
const planeMesh = new THREE.Mesh(planeGeo, planeMat);
planeMesh.receiveShadow = true;
scene.add(planeMesh);

const textureLoader = new THREE.TextureLoader();
const dennis_material = new THREE.MeshStandardMaterial({
    map: textureLoader.load('/assets/rp_dennis_posed_004_dif_2k.jpg'),
});

const objLoader = new OBJLoader();
let statue;
objLoader.load('/assets/rp_dennis_posed_004_30k.obj', function (obj) {
        statue = obj;
        statue.castShadow = true;
        statue.receiveShadow = true;
        statue.traverse(function (child) {
            child.castShadow = true;
            child.receiveShadow = true;
            child.material = dennis_material;
        });
        statue.scale.set(0.1, 0.1, 0.1);
        statue.rotation.set(Math.PI / 2, 0, 0);
        scene.add(statue);
    },
    function (xhr) {
        console.log((xhr.loaded / xhr.total * 100) + '% loaded');
    },
    function (err) {
        console.log('error while loading')
    });

let start = 0;

let params = {
    'light': 0,
    'light color': spotLight.color.getHex(),
    'intensity': spotLight.intensity,
    'angle': spotLight.angle,
    'penumbra': spotLight.penumbra,
    'targetX': spotLight.target.position.x,
    'targetY': spotLight.target.position.y
};

const gui = new GUI({
    autoPlace: true
});

var colorItem, intensityItem, angleItem, penumbraItem, targetXItem, targetYItem;

gui.add(params, 'light', {
    'Light1': 0,
    'Light2': 1,
    'Light3': 2,
    'Light4': 3,
    'Light5': 4,
    'Light6': 5,
    'Light7': 6,
    'Light8': 7,
    'Light9': 8
}).onChange(function (val) {
    spotLight = lights[val];
    params['light color'] = spotLight.color.getHex();
    params['intensity'] = spotLight.intensity;
    params['angle'] = spotLight.angle;
    params['penumbra'] = spotLight.penumbra;
    params['targetX'] = spotLight.target.position.x;
    params['targetY'] = spotLight.target.position.y;
    deleteGUI();
    addGUI();
    scene.remove(spotLightHelper)
    spotLightHelper = new THREE.SpotLightHelper(lights[val]);
    scene.add(spotLightHelper)
    requestAnimationFrame(draw);
});

function addGUI() {
    colorItem = gui.addColor(params, 'light color').onChange(function (val) {
        spotLight.color.setHex(val);
    });
    intensityItem = gui.add(params, 'intensity', 0, 2).onChange(function (val) {
        spotLight.intensity = val;
    });
    angleItem = gui.add(params, 'angle', 0, Math.PI / 2).onChange(function (val) {
        spotLight.angle = val;
    });
    penumbraItem = gui.add(params, 'penumbra', 0, 1).onChange(function (val) {
        spotLight.penumbra = val;
    });
    targetXItem = gui.add(params, 'targetX', -50, 50).onChange(function (val) {
        spotLight.target.position.x = val;
        spotLight.target.updateMatrixWorld();
    });
    targetYItem = gui.add(params, 'targetX', -50, 50).onChange(function (val) {
        spotLight.target.position.y = val;
        spotLight.target.updateMatrixWorld();
    });
}

function deleteGUI() {
    gui.remove(colorItem)
    gui.remove(intensityItem)
    gui.remove(angleItem)
    gui.remove(penumbraItem)
    gui.remove(targetXItem)
    gui.remove(targetYItem)
}

gui.open();

const draw = function (time) {
    time *= 0.001; // convert to seconds
    let delta = time - start;
    start = time;
    spotLightHelper.update();
    renderer.render(scene, camera);
    requestAnimationFrame(draw);
};

addGUI();
requestAnimationFrame(draw);