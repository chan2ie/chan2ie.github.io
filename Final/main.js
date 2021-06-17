import * as THREE from 'https://threejsfundamentals.org/threejs/resources/threejs/r127/build/three.module.js';
import {
    GLTFLoader
} from 'https://threejsfundamentals.org/threejs/resources/threejs/r127/examples/jsm/loaders/GLTFLoader.js';
import {
    Water
} from 'https://threejsfundamentals.org/threejs/resources/threejs/r127/examples/jsm/objects/Water.js';
import {
    Sky
} from 'https://threejsfundamentals.org/threejs/resources/threejs/r127/examples/jsm/objects/Sky.js';
import {
    OBJLoader
} from 'https://threejsfundamentals.org/threejs/resources/threejs/r127/examples/jsm/loaders/OBJLoader.js'

let scene, renderer, camera;
let model, lotusmodel, skeleton, mixer, clock;
let camera_dir = 0
let model_dir = 0,
    target_dir = 0
let water, sky, sun
let parameters;
let pmremGenerator;
let curkey;
const dirLight = new THREE.DirectionalLight(0xffffff, 0.1);

const crossFadeControls = [];
const mouse = new THREE.Vector2();
const TO_RADIAN = 0.0174533;

const walk_speed = 0.23;
const waterGeometry = new THREE.PlaneGeometry(100, 100);
let currentBaseAction = 'idle';
const allActions = [];
const baseActions = {
    idle: {
        weight: 1
    },
    walk: {
        weight: 0
    },
    run: {
        weight: 0
    }
};
const additiveActions = {
    sneak_pose: {
        weight: 0
    },
    sad_pose: {
        weight: 0
    },
    agree: {
        weight: 0
    },
    headShake: {
        weight: 0
    }
};
let panelSettings, numAnimations;

let lotuses = [];

init();

function init() {

    const container = document.getElementById('container');
    clock = new THREE.Clock();

    renderer = new THREE.WebGLRenderer({
        antialias: true
    });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0);
    scene.fog = new THREE.Fog(0, 10, 50);

    // spotLight = new THREE.SpotLight( 0xffffff );
    // spotLight.position.set(0, 5, 0);
    // spotLight.penumbra = 0.5
    // spotLight.angle = 30 * TO_RADIAN;
    // spotLight.castShadow = true;
    // scene.add(spotLight)

    // const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444);
    // hemiLight.position.set(0, 20, 0);
    // scene.add(hemiLight);

    dirLight.position.set(3, 10, 10);
    dirLight.castShadow = true;
    dirLight.shadow.camera.top = 2;
    dirLight.shadow.camera.bottom = -2;
    dirLight.shadow.camera.left = -2;
    dirLight.shadow.camera.right = 2;
    dirLight.shadow.camera.near = 0.1;
    dirLight.shadow.camera.far = 40;
    scene.add(dirLight);

    sky = new Sky();
    sky.scale.setScalar(10000);
    scene.add(sky);

    sun = new THREE.Vector3();

    const skyUniforms = sky.material.uniforms;

    skyUniforms['turbidity'].value = 10;
    skyUniforms['rayleigh'].value = 2;
    skyUniforms['mieCoefficient'].value = 0.005;
    skyUniforms['mieDirectionalG'].value = 0.8;

    parameters = {
        elevation: -90,
        azimuth: 180
    };

    pmremGenerator = new THREE.PMREMGenerator(renderer);

    water = new Water(
        waterGeometry, {
            textureWidth: 512,
            textureHeight: 512,
            waterNormals: new THREE.TextureLoader().load('textures/waternormals.jpg', function (texture) {

                texture.wrapS = texture.wrapT = THREE.RepeatWrapping;

            }),
            sunDirection: new THREE.Vector3(),
            sunColor: 0xffffff,
            waterColor: 0x001e0f,
            distortionScale: 3.7,
            // fog: new THREE.Fog(0, 10, 50)
        }
    );

    water.rotation.x = -Math.PI / 2;

    scene.add(water);

    const objLoader = new OBJLoader();

    objLoader.load('models/lotus_OBJ_low.obj',
        function (obj) {
            lotusmodel = obj;

            obj.traverse(function (child) {

                if (child.isMesh) child.material = new THREE.MeshNormalMaterial();


            });
        }
    );

    const loader = new GLTFLoader();
    loader.load('models/gltf/Xbot.glb', function (gltf) {

        model = gltf.scene;
        scene.add(model);

        model.traverse(function (object) {

            if (object.isMesh) object.castShadow = true;

        });

        skeleton = new THREE.SkeletonHelper(model);
        skeleton.visible = false;
        scene.add(skeleton);

        const animations = gltf.animations;
        mixer = new THREE.AnimationMixer(model);

        numAnimations = animations.length;

        for (let i = 0; i !== numAnimations; ++i) {

            let clip = animations[i];
            const name = clip.name;

            if (baseActions[name]) {

                const action = mixer.clipAction(clip);
                activateAction(action);
                baseActions[name].action = action;
                allActions.push(action);

            } else if (additiveActions[name]) {

                // Make the clip additive and remove the reference frame

                THREE.AnimationUtils.makeClipAdditive(clip);

                if (clip.name.endsWith('_pose')) {

                    clip = THREE.AnimationUtils.subclip(clip, clip.name, 2, 3, 30);

                }

                const action = mixer.clipAction(clip);
                activateAction(action);
                additiveActions[name].action = action;
                allActions.push(action);

            }

        }

        // createPanel();
        updateSun();
        animate();

    });

    // camera
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 100);
    camera.position.set(0, 2, -4);
    // if(model)
    //     camera.lookAt(model.position)
    // // const controls = new OrbitControls(camera, renderer.domElement);
    // // controls.enablePan = false;
    // // controls.enableZoom = false;
    // // controls.target.set(0, 1, 0);
    // // controls.update();

    window.addEventListener('resize', onWindowResize);
    document.addEventListener('mousemove', onMouseMove, false);
    setupKeyControls();

}

function onMouseMove(event) {

    mouse.x = (event.clientX - window.innerWidth / 2);
    mouse.y = (event.clientY - window.innerHeight / 2);

    camera_dir = mouse.x / window.innerWidth * -360

}

function setupKeyControls() {
    document.onkeydown = function (e) {
        curkey = e.key;
        switch (e.key) {
            case 'w':
                target_dir = 0;
                break;
            case 'a':
                target_dir = 90;
                break;
            case 's':
                target_dir = 180
                break;
            case 'd':
                target_dir = 270
                break;
            default:
                return
        }
        changeAction('walk');
    };

    document.onkeypress = function (e) {
        if (e.key == 'w' || e.key == 'a' || e.key == 's' || e.key == 'd') {
            if (Math.random() < 0.05) {
                var newModel = lotusmodel.clone()
                newModel.position.set(model.position.x + 10 * (Math.random() - 0.5), 0.5 * Math.random(), model.position.z + 10 * (Math.random() - 0.5));
                scene.add(newModel)

                lotuses.push([newModel, 1 + 2 * Math.random(), 0]);
            }
        }
        switch (e.key) {
            case 'w':
                model.position.z += walk_speed * Math.cos(camera_dir * TO_RADIAN)
                model.position.x += walk_speed * Math.sin(camera_dir * TO_RADIAN)
                break;
            case 'a':
                model.position.z += walk_speed * Math.cos((camera_dir + 90) * TO_RADIAN)
                model.position.x += walk_speed * Math.sin((camera_dir + 90) * TO_RADIAN)
                break;
            case 's':
                model.position.z += walk_speed * Math.cos((camera_dir + 180) * TO_RADIAN)
                model.position.x += walk_speed * Math.sin((camera_dir + 180) * TO_RADIAN)
                break;
            case 'd':
                model.position.z += walk_speed * Math.cos((camera_dir - 90) * TO_RADIAN)
                model.position.x += walk_speed * Math.sin((camera_dir - 90) * TO_RADIAN)
        }
    }

    document.onkeyup = function (e) {
        switch (e.key) {
            case 'w':
            case 'a':
            case 's':
            case 'd':
                if (curkey == e.key)
                    changeAction('idle')
        }
    }
}

function changeAction(name) {
    if (currentBaseAction == name) return;
    const settings = baseActions[name];
    const currentSettings = baseActions[currentBaseAction];
    const currentAction = currentSettings ? currentSettings.action : null;
    const action = settings ? settings.action : null;

    prepareCrossFade(currentAction, action, 0.35);

};

function updateSun() {

    const phi = THREE.MathUtils.degToRad(90 - parameters.elevation);
    const theta = THREE.MathUtils.degToRad(parameters.azimuth);

    sun.setFromSphericalCoords(1, phi, theta);

    dirLight.position.set(sun.x, sun.y, sun.z);
    // texture = new THREE.CanvasTexture( generateTexture( data, worldWidth, worldDepth ) );
    // mesh.material.map = texture;
    sky.material.uniforms['sunPosition'].value.copy(sun);
    water.material.uniforms['sunDirection'].value.copy(sun).normalize();

    scene.environment = pmremGenerator.fromScene(sky).texture;

}

function activateAction(action) {

    const clip = action.getClip();
    const settings = baseActions[clip.name] || additiveActions[clip.name];
    setWeight(action, settings.weight);
    action.play();

}

function prepareCrossFade(startAction, endAction, duration) {

    // If the current action is 'idle', execute the crossfade immediately;
    // else wait until the current action has finished its current loop

    if (currentBaseAction === 'idle' || !startAction || !endAction) {

        executeCrossFade(startAction, endAction, duration);

    } else {

        synchronizeCrossFade(startAction, endAction, duration);

    }

    // Update control colors

    if (endAction) {

        const clip = endAction.getClip();
        currentBaseAction = clip.name;

    } else {

        currentBaseAction = 'None';

    }

    crossFadeControls.forEach(function (control) {

        const name = control.property;

        if (name === currentBaseAction) {

            control.setActive();

        } else {

            control.setInactive();

        }

    });

}

function synchronizeCrossFade(startAction, endAction, duration) {

    mixer.addEventListener('loop', onLoopFinished);

    function onLoopFinished(event) {

        if (event.action === startAction) {

            mixer.removeEventListener('loop', onLoopFinished);

            executeCrossFade(startAction, endAction, duration);

        }

    }

}

function executeCrossFade(startAction, endAction, duration) {

    // Not only the start action, but also the end action must get a weight of 1 before fading
    // (concerning the start action this is already guaranteed in this place)

    if (endAction) {

        setWeight(endAction, 1);
        endAction.time = 0;

        if (startAction) {

            // Crossfade with warping

            startAction.crossFadeTo(endAction, duration, true);

        } else {

            // Fade in

            endAction.fadeIn(duration);

        }

    } else {

        // Fade out

        startAction.fadeOut(duration);

    }

}

// This function is needed, since animationAction.crossFadeTo() disables its start action and sets
// the start action's timeScale to ((start animation's duration) / (end animation's duration))

function setWeight(action, weight) {

    action.enabled = true;
    action.setEffectiveTimeScale(1);
    action.setEffectiveWeight(weight);

}

function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);

}

function animate() {
    const day_length = 30 * 360;

    if (parameters.elevation < 90) {
        parameters.elevation += 1.0 / 30.0 * 2;
        parameters.azimuth += 1.0 / 15.0 * 2;

        // let cur = timer / (day_length * 0.513) * 360;

        updateSun();
    }

    if (target_dir != model_dir) {
        let t = target_dir - model_dir
        if (t > 0) {
            if (t >= 180) {
                model_dir -= 3;
            } else model_dir += 3;
        } else {
            if (t <= -180) {
                model_dir += 3;
            } else {
                model_dir -= 3;
            }
        }
        if (model_dir >= 360) model_dir -= 360;
        if (model_dir < 0) model_dir += 360;
    }

    // Render loop
    if (model)
        model.rotation.y = (model_dir + camera_dir) * TO_RADIAN;
    camera.position.set(model.position.x - 4 * Math.sin(camera_dir * TO_RADIAN), model.position.y + 2, model.position.z - 4 * Math.cos(camera_dir * TO_RADIAN))
    camera.lookAt(model.position.x, model.position.y + 1.3, model.position.z);
    requestAnimationFrame(animate);

    for (let i = 0; i < lotuses.length; i++) {
        if (lotuses[i][2] < 100) {
            let mod = lotuses[i][0]
            let sc = lotuses[i][1] * 0.0007 * lotuses[i][2]
            mod.scale.set(sc, sc, sc)
            lotuses[i][2] += 1
        }
    }

    for (let i = 0; i !== numAnimations; ++i) {

        const action = allActions[i];
        const clip = action.getClip();
        const settings = baseActions[clip.name] || additiveActions[clip.name];
        settings.weight = action.getEffectiveWeight();

    }

    // Get the time elapsed since the last frame, used for mixer update

    const mixerUpdateDelta = clock.getDelta();

    // Update the animation mixer, the stats panel, and render this frame

    mixer.update(mixerUpdateDelta);

    renderer.render(scene, camera);

}