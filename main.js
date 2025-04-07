// Game variables
let score = 0;
let gameActive = false;
const targets = [];
let isPointerLocked = false;

// Audio elements
const shootSound = new Audio('submachine-gun-79846.mp3');
const hitSound = new Audio('metal-hit-94-200422.mp3');
shootSound.preload = 'auto';
hitSound.preload = 'auto';

// Initialize Three.js
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x333333); // Set background color

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.y = 1.6;

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

// Lighting for shooting room atmosphere
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(5, 10, 7.5);
light.castShadow = true;
scene.add(light);
scene.add(new THREE.AmbientLight(0x404040)); // Subtle ambient light

// Ground with a concrete look
const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(50, 50),
    new THREE.MeshStandardMaterial({ color: 0x999999 }) // Concrete grey floor
);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

// Smaller walls for a compact shooting room
const wallMaterial = new THREE.MeshStandardMaterial({ color: 0x555555 }); // Dark grey for the walls

// Front wall
const frontWall = new THREE.Mesh(
    new THREE.PlaneGeometry(50, 20),
    wallMaterial
);
frontWall.position.set(0, 10, -25);
frontWall.rotation.x = Math.PI / 2;
scene.add(frontWall);

// Back wall
const backWall = new THREE.Mesh(
    new THREE.PlaneGeometry(50, 20),
    wallMaterial
);
backWall.position.set(0, 10, 25);
backWall.rotation.x = Math.PI / 2;
scene.add(backWall);

// Left wall
const leftWall = new THREE.Mesh(
    new THREE.PlaneGeometry(50, 20),
    wallMaterial
);
leftWall.position.set(-25, 10, 0);
leftWall.rotation.y = Math.PI / 2;
scene.add(leftWall);

// Right wall
const rightWall = new THREE.Mesh(
    new THREE.PlaneGeometry(50, 20),
    wallMaterial
);
rightWall.position.set(25, 10, 0);
rightWall.rotation.y = -Math.PI / 2;
scene.add(rightWall);

// Ceiling
const ceiling = new THREE.Mesh(
    new THREE.PlaneGeometry(50, 50),
    wallMaterial
);
ceiling.position.set(0, 20, 0);
ceiling.rotation.x = Math.PI;
scene.add(ceiling);

// Gun model loader
const loader = new THREE.GLTFLoader();

// Load the gun model
let gun;
loader.load('gun.glb', function (gltf) {
    gun = gltf.scene;
    gun.scale.set(2.5, 2.5, 2.5);
    gun.position.set(0.2, -0.3, -0.8);
    gun.rotation.set(0, Math.PI, 0);
    camera.add(gun);
    scene.add(camera);
}, function (xhr) {
    console.log((xhr.loaded / xhr.total * 100) + '% loaded');
}, function (error) {
    console.error('An error occurred while loading the gun model:', error);
});

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

// Create explosion effect
function createExplosion(position) {
    const particles = 50;
    const explosionGeometry = new THREE.BufferGeometry();
    const explosionMaterial = new THREE.PointsMaterial({
        color: 0xff4500,
        size: 0.2,
        transparent: true,
        opacity: 1
    });
    
    const positions = [];
    const colors = [];
    const sizes = [];
    
    for (let i = 0; i < particles; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 0.1 + Math.random() * 0.3;
        
        positions.push(
            position.x,
            position.y + 0.75,
            position.z
        );
        
        colors.push(
            1, 
            0.5 + Math.random() * 0.5,
            0 
        );
        
        sizes.push(0.1 + Math.random() * 0.2);
    }
    
    explosionGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    explosionGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    explosionGeometry.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1));
    
    const explosion = new THREE.Points(explosionGeometry, explosionMaterial);
    scene.add(explosion);
    
    let frame = 0;
    const maxFrames = 30;
    const originalPositions = explosionGeometry.attributes.position.array.slice();
    
    function animateExplosion() {
        frame++;
        const positions = explosionGeometry.attributes.position.array;
        
        for (let i = 0; i < particles; i++) {
            const idx = i * 3;
            const angle = Math.random() * Math.PI * 2;
            const speed = 0.1 + Math.random() * 0.3;
            
            positions[idx] = originalPositions[idx] + Math.cos(angle) * speed * frame;
            positions[idx + 1] = originalPositions[idx + 1] + Math.random() * speed * frame;
            positions[idx + 2] = originalPositions[idx + 2] + Math.sin(angle) * speed * frame;
        }
        
        explosionMaterial.opacity = 1 - (frame / maxFrames);
        explosionGeometry.attributes.position.needsUpdate = true;
        
        if (frame < maxFrames) {
            requestAnimationFrame(animateExplosion);
        } else {
            scene.remove(explosion);
        }
    }
    
    animateExplosion();
}

// Click to shoot (only when pointer is locked)
function handleShoot() {
    if (!isPointerLocked || !gameActive) return;
    
    try {
        shootSound.currentTime = 0;
        shootSound.play().catch(e => console.log("Audio play failed:", e));
    } catch (e) {
        console.log("Sound error:", e);
    }
    
    // Gun recoil animation
    gun.position.z = -0.9;
    setTimeout(() => gun.position.z = -0.8, 100);
    
    // Raycasting for hit detection
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(), camera);
    const intersects = raycaster.intersectObjects(targets);
    
    if (intersects.length > 0) {
        const target = intersects[0].object;
        
        try {
            hitSound.currentTime = 0;
            hitSound.play().catch(e => console.log("Audio play failed:", e));
        } catch (e) {
            console.log("Sound error:", e);
        }
        
        createExplosion(target.position);
        scene.remove(target);
        targets.splice(targets.indexOf(target), 1);
        
        score += 10;
        document.getElementById('score').textContent = `Score: ${score}`;
        
        setTimeout(createTarget, 1000);
    }
}

// Mouse click handler
document.addEventListener('click', handleShoot);

// Create targets
function createTarget() {
    const target = new THREE.Mesh(
        new THREE.CylinderGeometry(0.3, 0.3, 1.5, 8),
        new THREE.MeshStandardMaterial({ 
            color: 0x8B4513,
            metalness: 0.3,
            roughness: 0.7
        })
    );
    target.position.x = (Math.random() - 0.5) * 20;
    target.position.z = -10 - Math.random() * 20;
    target.position.y = 0.75;
    target.castShadow = true;
    scene.add(target);
    targets.push(target);
    return target;
}

// Collision detection
function checkCollisions() {
    const playerBox = new THREE.Box3().setFromObject(camera);
    const walls = [frontWall, backWall, leftWall, rightWall];
    
    walls.forEach(wall => {
        const wallBox = new THREE.Box3().setFromObject(wall);
        if (playerBox.intersectsBox(wallBox)) {
            // Prevent moving through walls
            // You can adjust the player position to stop movement based on collisions
        }
    });
}

// Movement controls
const keys = {};
const moveSpeed = 0.1;

document.addEventListener('keydown', (e) => keys[e.code] = true);
document.addEventListener('keyup', (e) => keys[e.code] = false);

function handleMovement() {
    if (!isPointerLocked) return;
    
    // Handle player movement
    if (keys['KeyW']) controls.moveForward(moveSpeed);
    if (keys['KeyS']) controls.moveForward(-moveSpeed);
    if (keys['KeyA']) controls.moveRight(-moveSpeed);
    if (keys['KeyD']) controls.moveRight(moveSpeed);
    
    checkCollisions();
}

// Start game function
function startGame() {
    if (gameActive) return;
    
    score = 0;
    gameActive = true;
    document.getElementById('score').textContent = `Score: ${score}`;
    
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

// Resize handler
window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
});
