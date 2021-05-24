import * as THREE from 'https://threejsfundamentals.org/threejs/resources/threejs/r127/build/three.module.js';

import {
    OrbitControls
} from 'https://threejsfundamentals.org/threejs/resources/threejs/r127/examples/jsm/controls/OrbitControls.js';
import {
    Water
} from 'https://threejsfundamentals.org/threejs/resources/threejs/r127/examples/jsm/objects/Water.js';
import {
    Sky
} from 'https://threejsfundamentals.org/threejs/resources/threejs/r127/examples/jsm/objects/Sky.js';
import {
    ImprovedNoise
} from 'https://threejsfundamentals.org/threejs/resources/threejs/r127/examples//jsm/math/ImprovedNoise.js';
let container;
let camera, scene, renderer;
let controls, water, sun, sky;
let parameters;
let pmremGenerator;
let waterGeometry;
let data, mesh, texture, light;
let moon;
let timer = 0;
let speed = 1;

const worldWidth = 1000, worldDepth = 1000,
				worldHalfWidth = worldWidth / 2, worldHalfDepth = worldDepth / 2;

init();
animate();

function init() {

    container = document.getElementById('container');

    //

    renderer = new THREE.WebGLRenderer();
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    container.appendChild(renderer.domElement);

    //

    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 1, 20000);
    camera.position.set(30, 30, 100);

    //

    sun = new THREE.Vector3();

    // Water

    waterGeometry = new THREE.PlaneGeometry(10000, 10000);

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
            fog: scene.fog !== undefined
        }
    );

    water.rotation.x = -Math.PI / 2;

    scene.add(water);

    data = generateHeight( worldWidth, worldDepth );
    const geometry = new THREE.PlaneGeometry( 10000, 10000, worldWidth - 1, worldDepth - 1 );
    geometry.rotateX( - Math.PI / 2 );

    const vertices = geometry.attributes.position.array;

    for (let i = 0, j = 0, l = vertices.length; i < l; i++, j += 3) {

        vertices[j + 1] = data[i] * 2 - Math.pow((i % worldDepth), 2) * 0.002;

    }
    //

    texture = new THREE.CanvasTexture( generateTexture( data, worldWidth, worldDepth ) );
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;

    light = new THREE.DirectionalLight( 0xffffff );
    light.position.set( 0, 1, 1 ).normalize();
    scene.add(light);

    var material = new THREE.MeshLambertMaterial( {map:texture} );

    mesh = new THREE.Mesh(geometry, material);
    mesh.position.y += 100;
    // mesh.side = THREE.DoubleSide;
    scene.add(mesh);

    // Skybox

    sky = new Sky();
    sky.scale.setScalar(10000);
    scene.add(sky);

    const skyUniforms = sky.material.uniforms;

    skyUniforms['turbidity'].value = 10;
    skyUniforms['rayleigh'].value = 2;
    skyUniforms['mieCoefficient'].value = 0.005;
    skyUniforms['mieDirectionalG'].value = 0.8;

    parameters = {
        elevation: 0,
        azimuth: 180
    };

    pmremGenerator = new THREE.PMREMGenerator(renderer);

    const moonGeo = new THREE.SphereGeometry( 150, 32, 32 );
    const moonMat = new THREE.MeshBasicMaterial( {color: 0xffff77} );
    moon = new THREE.Mesh( moonGeo, moonMat );
    scene.add( moon );

    updateSun();

    controls = new OrbitControls(camera, renderer.domElement);
    controls.maxPolarAngle = Math.PI * 0.495;
    controls.target.set(0, 10, 0);
    controls.minDistance = 300.0;
    controls.maxDistance = 1000.0;
    controls.update();
    // controls.minDistance = 1000;
    // controls.maxDistance = 100000;
    // controls.maxPolarAngle = Math.PI / 2;
    // controls.target.y = data[ worldHalfWidth + worldHalfDepth * worldWidth ] + 500;
	// 			camera.position.y = controls.target.y + 2000;
	// 			camera.position.x = 2000;
	// 			controls.update();

    

    window.addEventListener('resize', onWindowResize);
    document.addEventListener("keydown", onDocumentKeyDown, false);

}

function generateHeight(width, height) {

    const size = width * height,
        data = new Uint8Array(size),
        perlin = new ImprovedNoise(),
        z = Math.random() * 100;

    let quality = 1;

    for (let j = 0; j < 4; j++) {

        for (let i = 0; i < size; i++) {

            const x = i % width,
                y = ~~(i / width);
            data[i] += Math.abs(perlin.noise(x / quality, y / quality, z) * quality * 1.75);

        }

        quality *= 5;

    }

    return data;

}

function generateTexture( data, width, height ) {

    // bake lighting into texture

    let context, image, imageData, shade;

    const vector3 = new THREE.Vector3( 0, 0, 0 );

    const sun_tex = new THREE.Vector3( 0, 1, 0 );
    sun_tex.normalize();

    // const sun_tex = sun.normalize();
    // console.log(sun_tex);

    const canvas = document.createElement( 'canvas' );
    canvas.width = width;
    canvas.height = height;

    context = canvas.getContext( '2d' );
    context.fillStyle = '#000';
    context.fillRect( 0, 0, width, height );

    image = context.getImageData( 0, 0, canvas.width, canvas.height );
    imageData = image.data;

    for ( let i = 0, j = 0, l = imageData.length; i < l; i += 4, j ++ ) {

        vector3.x = data[ j - 2 ] - data[ j + 2 ];
        vector3.y = 2;
        vector3.z = data[ j - width * 2 ] - data[ j + width * 2 ];
        vector3.normalize();

        shade = vector3.dot( sun_tex );

        imageData[ i ] = ( 52 + shade * 32 ) * ( 0.5 + data[ j ] * 0.007 );
        imageData[ i + 1 ] = ( 15 + shade * 24 ) * ( 0.5 + data[ j ] * 0.007 );
        imageData[ i + 2 ] = ( shade * 24 ) * ( 0.5 + data[ j ] * 0.007 );

    }

    context.putImageData( image, 0, 0 );

    // Scaled 4x

    const canvasScaled = document.createElement( 'canvas' );
    canvasScaled.width = width * 4;
    canvasScaled.height = height * 4;

    context = canvasScaled.getContext( '2d' );
    context.scale( 4, 4 );
    context.drawImage( canvas, 0, 0 );

    image = context.getImageData( 0, 0, canvasScaled.width, canvasScaled.height );
    imageData = image.data;

    for ( let i = 0, l = imageData.length; i < l; i += 4 ) {

        const v = ~ ~ ( Math.random() * 5 );

        imageData[ i ] += v;
        imageData[ i + 1 ] += v;
        imageData[ i + 2 ] += v;

    }

    context.putImageData( image, 0, 0 );

    return canvasScaled;

}

function updateSun() {

    const phi = THREE.MathUtils.degToRad(90 - parameters.elevation);
    const theta = THREE.MathUtils.degToRad(parameters.azimuth);

    const moon_phi = THREE.MathUtils.degToRad(-90 - parameters.elevation);
    const moon_theta = THREE.MathUtils.degToRad(parameters.azimuth);

    let moon_coord = new THREE.Vector3();

    sun.setFromSphericalCoords(1, phi, theta);
    
    moon_coord.setFromSphericalCoords(8000, moon_phi, moon_theta);
    moon.position.set(moon_coord.x, moon_coord.y, moon_coord.z);

    light.position.set(sun.x, sun.y, sun.z);
    // texture = new THREE.CanvasTexture( generateTexture( data, worldWidth, worldDepth ) );
    // mesh.material.map = texture;
    sky.material.uniforms['sunPosition'].value.copy(sun);
    water.material.uniforms['sunDirection'].value.copy(sun).normalize();

    scene.environment = pmremGenerator.fromScene(sky).texture;

}

function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);

}

function animate() {

    requestAnimationFrame(animate);
    render();

}

function render() {

    const day_length = 30 * 360;

    const time = performance.now() * 0.001;

    water.material.uniforms[ 'time' ].value += 1.0 / 30.0 * speed;
    parameters.elevation += 1.0 / 30.0 * speed;
    parameters.azimuth += 1.0 / 15.0 * speed;

    let cur =timer / (day_length * 0.513) * 360;
    water.position.y = Math.sin(cur * 0.0174533) * 100 - 50;
    updateSun();

    renderer.render(scene, camera);

    timer += speed;
}

function onDocumentKeyDown(event) {
    var keyCode = event.which;
    if (keyCode == 39) {
        speed = speed > 32 ? speed : speed * 2;
    } else if (keyCode == 37) {
        speed = speed < 2 ? speed : speed / 2;
    }
    console.log(speed);
};