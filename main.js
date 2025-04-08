// Game variables
let score = 0;
let gameActive = false;
const targets = [];
let isPointerLocked = false;
const roomSize = 20;
const wallHeight = 8;

// Audio elements
const shootSound = new Audio('submachine-gun-79846.mp3');
const hitSound = new Audio('metal-hit-94-200422.mp3');
shootSound.preload = 'auto';
hitSound.preload = 'auto';

// Initialize Three.js
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x333333);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, roomSize * 2);
camera.position.y = 1.6;

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

// Enhanced Lighting
const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(5, 10, 7.5);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = 2048;
directionalLight.shadow.mapSize.height = 2048;
scene.add(directionalLight);

const ambientLight = new THREE.AmbientLight(0x404040);
scene.add(ambientLight);

const rimLight = new THREE.DirectionalLight(0xffffff, 0.5);
rimLight.position.set(-5, 5, -5);
scene.add(rimLight);

// Texture loader
const textureLoader = new THREE.TextureLoader();

// Create beautiful wood floor
const woodTexture = textureLoader.load('https://threejs.org/examples/textures/hardwood2_diffuse.jpg');
woodTexture.wrapS = THREE.RepeatWrapping;
woodTexture.wrapT = THREE.RepeatWrapping;
woodTexture.repeat.set(roomSize/5, roomSize/5);

const woodNormalMap = textureLoader.load('https://threejs.org/examples/textures/hardwood2_normal.jpg');
woodNormalMap.wrapS = THREE.RepeatWrapping;
woodNormalMap.wrapT = THREE.RepeatWrapping;
woodNormalMap.repeat.set(roomSize/5, roomSize/5);

const woodRoughnessMap = textureLoader.load('https://threejs.org/examples/textures/hardwood2_roughness.jpg');
woodRoughnessMap.wrapS = THREE.RepeatWrapping;
woodRoughnessMap.wrapT = THREE.RepeatWrapping;
woodRoughnessMap.repeat.set(roomSize/5, roomSize/5);

const floorMaterial = new THREE.MeshStandardMaterial({
    map: woodTexture,
    normalMap: woodNormalMap,
    roughnessMap: woodRoughnessMap,
    roughness: 0.8,
    metalness: 0.1,
    color: 0x8B4513
});

const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(roomSize, roomSize),
    floorMaterial
);
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
scene.add(floor);

// Add floor border
const borderGeometry = new THREE.BoxGeometry(roomSize + 0.2, 0.1, 0.2);
const borderMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x5D4037,
    roughness: 0.7,
    metalness: 0.2
});
const border = new THREE.Mesh(borderGeometry, borderMaterial);
border.position.set(0, 0.05, 0);
border.rotation.x = -Math.PI / 2;
scene.add(border);

// Create stylish walls with paneling effect
const wallTexture = textureLoader.load('https://threejs.org/examples/textures/brick_diffuse.jpg');
wallTexture.wrapS = THREE.RepeatWrapping;
wallTexture.wrapT = THREE.RepeatWrapping;
wallTexture.repeat.set(4, 2);

const wallNormalMap = textureLoader.load('https://threejs.org/examples/textures/brick_normal.jpg');
wallNormalMap.wrapS = THREE.RepeatWrapping;
wallNormalMap.wrapT = THREE.RepeatWrapping;
wallNormalMap.repeat.set(4, 2);

const wallRoughnessMap = textureLoader.load('https://threejs.org/examples/textures/brick_roughness.jpg');
wallRoughnessMap.wrapS = THREE.RepeatWrapping;
wallRoughnessMap.wrapT = THREE.RepeatWrapping;
wallRoughnessMap.repeat.set(4, 2);

const wallMaterial = new THREE.MeshStandardMaterial({
    map: wallTexture,
    normalMap: wallNormalMap,
    roughnessMap: wallRoughnessMap,
    roughness: 0.8,
    metalness: 0.1,
    color: 0x7a6b5b
});

const wallTrimMaterial = new THREE.MeshStandardMaterial({
    color: 0x5D4037,
    roughness: 0.6,
    metalness: 0.3
});

const walls = [];
const wallThickness = 0.2;

function createWall(width, height, position, rotation) {
    // Main wall panel
    const wall = new THREE.Mesh(
        new THREE.BoxGeometry(width, height, wallThickness),
        wallMaterial
    );
    wall.position.set(position.x, position.y, position.z);
    wall.rotation.set(rotation.x, rotation.y, rotation.z);
    wall.castShadow = true;
    wall.receiveShadow = true;
    scene.add(wall);
    walls.push(wall);

    // Wall trim (baseboard)
    const trimHeight = 0.1;
    const trim = new THREE.Mesh(
        new THREE.BoxGeometry(width, trimHeight, wallThickness + 0.05),
        wallTrimMaterial
    );
    trim.position.set(position.x, position.y - height/2 + trimHeight/2, position.z);
    trim.rotation.set(rotation.x, rotation.y, rotation.z);
    scene.add(trim);

    // Wall trim (top)
    const topTrim = new THREE.Mesh(
        new THREE.BoxGeometry(width, trimHeight, wallThickness + 0.05),
        wallTrimMaterial
    );
    topTrim.position.set(position.x, position.y + height/2 - trimHeight/2, position.z);
    topTrim.rotation.set(rotation.x, rotation.y, rotation.z);
    scene.add(topTrim);

    // Vertical trims
    const verticalTrimCount = Math.floor(width / 3);
    for (let i = 0; i < verticalTrimCount; i++) {
        const trimWidth = 0.1;
        const trim = new THREE.Mesh(
            new THREE.BoxGeometry(trimWidth, height - trimHeight*2, wallThickness + 0.05),
            wallTrimMaterial
        );
        const xPos = position.x - width/2 + (i + 0.5) * (width / verticalTrimCount);
        trim.position.set(xPos, position.y, position.z);
        trim.rotation.set(rotation.x, rotation.y, rotation.z);
        scene.add(trim);
    }
}

// Create all walls
createWall(roomSize, wallHeight, new THREE.Vector3(0, wallHeight/2, -roomSize/2 + wallThickness/2), new THREE.Vector3(0, 0, 0));
createWall(roomSize, wallHeight, new THREE.Vector3(0, wallHeight/2, roomSize/2 - wallThickness/2), new THREE.Vector3(0, 0, 0));
createWall(roomSize, wallHeight, new THREE.Vector3(-roomSize/2 + wallThickness/2, wallHeight/2, 0), new THREE.Vector3(0, Math.PI/2, 0));
createWall(roomSize, wallHeight, new THREE.Vector3(roomSize/2 - wallThickness/2, wallHeight/2, 0), new THREE.Vector3(0, Math.PI/2, 0));

// Ceiling
const ceilingMaterial = new THREE.MeshStandardMaterial({
    color: 0x555555,
    roughness: 0.9,
    metalness: 0.05
});

const ceiling = new THREE.Mesh(
    new THREE.BoxGeometry(roomSize, wallThickness, roomSize),
    ceilingMaterial
);
ceiling.position.set(0, wallHeight + wallThickness/2, 0);
ceiling.receiveShadow = true;
scene.add(ceiling);

// Add wall decorations
function addWallDecorations() {
    // Paintings
    const paintingGeometry = new THREE.BoxGeometry(3, 2, 0.1);
    const paintingMaterial = new THREE.MeshStandardMaterial({
        color: 0x654321,
        roughness: 0.7
    });
    
    const painting1 = new THREE.Mesh(paintingGeometry, paintingMaterial);
    painting1.position.set(3, wallHeight/2, -roomSize/2 + wallThickness + 0.1);
    scene.add(painting1);
    
    const painting2 = new THREE.Mesh(paintingGeometry, paintingMaterial);
    painting2.position.set(-3, wallHeight/2, -roomSize/2 + wallThickness + 0.1);
    scene.add(painting2);
    
    // Wall lights
    const lightGeometry = new THREE.SphereGeometry(0.3, 16, 16);
    const lightMaterial = new THREE.MeshBasicMaterial({ color: 0xffffcc });
    
    const light1 = new THREE.Mesh(lightGeometry, lightMaterial);
    light1.position.set(5, wallHeight/2, -roomSize/2 + wallThickness + 0.1);
    scene.add(light1);
    
    const light2 = new THREE.Mesh(lightGeometry, lightMaterial);
    light2.position.set(-5, wallHeight/2, -roomSize/2 + wallThickness + 0.1);
    scene.add(light2);
    
    // Add point lights to wall lights
    const pointLight1 = new THREE.PointLight(0xffeedd, 1, 5);
    pointLight1.position.set(5, wallHeight/2, -roomSize/2 + wallThickness + 0.5);
    scene.add(pointLight1);
    
    const pointLight2 = new THREE.PointLight(0xffeedd, 1, 5);
    pointLight2.position.set(-5, wallHeight/2, -roomSize/2 + wallThickness + 0.5);
    scene.add(pointLight2);
}
addWallDecorations();

// Gun model implementation
const loader = new THREE.GLTFLoader();
let gun;

function createFallbackGun() {
    const gunGroup = new THREE.Group();
    
    // Gun barrel
    const barrelGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.5, 8);
    const barrelMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
    const barrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
    barrel.rotation.z = Math.PI / 2;
    barrel.position.set(0.3, -0.2, -0.8);
    gunGroup.add(barrel);
    
    // Gun handle
    const handleGeometry = new THREE.BoxGeometry(0.2, 0.3, 0.1);
    const handleMaterial = new THREE.MeshStandardMaterial({ color: 0x555555 });
    const handle = new THREE.Mesh(handleGeometry, handleMaterial);
    handle.position.set(0.1, -0.3, -0.8);
    gunGroup.add(handle);
    
    return gunGroup;
}

// Load gun model
loader.load(
    'gun.glb', 
    function(gltf) {
        gun = gltf.scene;
        gun.scale.set(2.5, 2.5, 2.5);
        gun.position.set(0.2, -0.3, -0.8);
        gun.rotation.set(0, Math.PI, 0);
        
        gun.traverse(function(child) {
            if (child.isMesh) {
                child.castShadow = true;
            }
        });
        
        camera.add(gun);
    },
    undefined,
    function(error) {
        console.error('Error loading gun model:', error);
        gun = createFallbackGun();
        camera.add(gun);
    }
);

scene.add(camera);

// Controls
const controls = new THREE.PointerLockControls(camera, renderer.domElement);

function onPointerLockChange() {
    isPointerLocked = document.pointerLockElement === renderer.domElement;
    document.body.style.cursor = isPointerLocked ? 'none' : 'default';
    document.getElementById('crosshair').style.display = isPointerLocked ? 'block' : 'none';
    
    if (isPointerLocked && !gameActive) {
        startGame();
    }
}

document.addEventListener('pointerlockchange', onPointerLockChange, false);

document.getElementById('start-btn').addEventListener('click', () => {
    document.getElementById('start-screen').style.display = 'none';
    controls.lock().catch(err => {
        console.error("Pointer lock failed:", err);
    });
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isPointerLocked) {
        controls.unlock();
    }
});

// Target loader
const targetLoader = new THREE.GLTFLoader();
let targetModel;

targetLoader.load('target.glb', function (gltf) {
    targetModel = gltf.scene;
    targetModel.scale.set(2, 2, 2);
    targetModel.position.y = -0.5;
    
    targetModel.traverse(function(child) {
        if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
        }
    });
}, undefined, function(error) {
    console.error('Error loading target:', error);
});

// Create targets within bounds
function createTarget() {
    const safeArea = roomSize * 0.7;
    const minDistance = 3;
    const maxAttempts = 10;
    let attempts = 0;
    let position;
    let target;

    do {
        position = {
            x: (Math.random() - 0.5) * safeArea,
            z: -minDistance - Math.random() * (safeArea/2 - minDistance),
            y: 0.5
        };
        attempts++;
    } while (
        (Math.abs(position.x) > roomSize/2 - 2 || 
        Math.abs(position.z) > roomSize/2 - 2) && 
        attempts < maxAttempts
    );

    if (attempts >= maxAttempts) {
        position = { x: 0, y: 0.5, z: -roomSize/2 + 3 };
    }

    if (targetModel) {
        target = targetModel.clone();
        target.position.set(position.x, position.y, position.z);
        
        const hitBox = new THREE.Box3().setFromObject(target);
        hitBox.expandByScalar(0.8);
        target.userData.hitBox = hitBox;
        
        scene.add(target);
    } else {
        target = new THREE.Mesh(
            new THREE.CylinderGeometry(0.5, 0.5, 1.5, 8),
            new THREE.MeshStandardMaterial({ color: 0xff0000 })
        );
        target.position.set(position.x, 0.75, position.z);
        target.castShadow = true;
        scene.add(target);
    }
    
    targets.push(target);
    return target;
}

// Shooting mechanics
function handleShoot() {
    if (!isPointerLocked || !gameActive) return;
    
    shootSound.currentTime = 0;
    shootSound.play().catch(e => console.log("Audio error:", e));
    
    // Gun recoil animation
    if (gun) {
        gun.position.z = -1.1;
        setTimeout(() => {
            gun.position.z = -1;
        }, 100);
    }
    
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(), camera);
    
    for (let i = targets.length - 1; i >= 0; i--) {
        const target = targets[i];
        const hitBox = target.userData.hitBox || new THREE.Box3().setFromObject(target);
        
        if (raycaster.ray.intersectsBox(hitBox)) {
            hitSound.currentTime = 0;
            hitSound.play().catch(e => console.log("Audio error:", e));
            
            createExplosion(target.position);
            scene.remove(target);
            targets.splice(i, 1);
            
            score += 10;
            document.getElementById('score').textContent = `Score: ${score}`;
            
            setTimeout(createTarget, 1000);
            break;
        }
    }
}

// Explosion effect
function createExplosion(position) {
    const particles = 100;
    const geometry = new THREE.BufferGeometry();
    const material = new THREE.PointsMaterial({
        color: 0xff4500,
        size: 0.2,
        transparent: true,
        opacity: 1
    });
    
    const positions = [];
    const colors = [];
    
    for (let i = 0; i < particles; i++) {
        positions.push(
            position.x + (Math.random() - 0.5) * 0.1,
            position.y + (Math.random() - 0.5) * 0.1,
            position.z + (Math.random() - 0.5) * 0.1
        );
        
        colors.push(1, 0.3 + Math.random() * 0.7, 0);
    }
    
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    
    const explosion = new THREE.Points(geometry, material);
    scene.add(explosion);
    
    let frame = 0;
    const maxFrames = 30;
    const originalPositions = geometry.attributes.position.array.slice();
    
    function animateExplosion() {
        frame++;
        const positions = geometry.attributes.position.array;
        
        for (let i = 0; i < particles; i++) {
            const idx = i * 3;
            const angle = Math.random() * Math.PI * 2;
            const speed = 0.05 + Math.random() * 0.15;
            
            positions[idx] = originalPositions[idx] + Math.cos(angle) * speed * frame;
            positions[idx + 1] = originalPositions[idx + 1] + Math.random() * speed * frame;
            positions[idx + 2] = originalPositions[idx + 2] + Math.sin(angle) * speed * frame;
        }
        
        material.opacity = 1 - (frame / maxFrames);
        geometry.attributes.position.needsUpdate = true;
        
        if (frame < maxFrames) {
            requestAnimationFrame(animateExplosion);
        } else {
            scene.remove(explosion);
        }
    }
    
    animateExplosion();
}

// Movement controls
const keys = {};
const moveSpeed = 0.05;

document.addEventListener('keydown', (e) => keys[e.code] = true);
document.addEventListener('keyup', (e) => keys[e.code] = false);

function handleMovement() {
    if (!isPointerLocked) return;
    
    if (keys['KeyW']) controls.moveForward(moveSpeed);
    if (keys['KeyS']) controls.moveForward(-moveSpeed);
    if (keys['KeyA']) controls.moveRight(-moveSpeed);
    if (keys['KeyD']) controls.moveRight(moveSpeed);
    
    if (camera.position.x > roomSize/2 - 1) camera.position.x = roomSize/2 - 1;
    if (camera.position.x < -roomSize/2 + 1) camera.position.x = -roomSize/2 + 1;
    if (camera.position.z > roomSize/2 - 1) camera.position.z = roomSize/2 - 1;
    if (camera.position.z < -roomSize/2 + 1) camera.position.z = -roomSize/2 + 1;
}

// Start game
function startGame() {
    score = 0;
    gameActive = true;
    document.getElementById('score').textContent = `Score: ${score}`;
    
    targets.forEach(target => scene.remove(target));
    targets.length = 0;
    
    for (let i = 0; i < 5; i++) {
        createTarget();
    }
}

// Game loop
function animate() {
    requestAnimationFrame(animate);
    if (gameActive) {
        handleMovement();
    }
    renderer.render(scene, camera);
}
animate();

// Event listeners
document.addEventListener('click', handleShoot);

window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
});