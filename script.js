// ==========================================
// 写真のリスト（GitHubの直リンクを設定）
// ==========================================
const memories = [
    { url: "https://raw.githubusercontent.com/ImWinnterFan/2month_with_YUA/main/1.png", caption: "初めて連絡をした日！" },   
    { url: "https://raw.githubusercontent.com/ImWinnterFan/2month_with_YUA/main/3.png", caption: "一緒に映画を見た日 "  },    
    { url: "https://raw.githubusercontent.com/ImWinnterFan/2month_with_YUA/main/10.png", caption: "一緒に勉強した日！" },    
    { url: "https://raw.githubusercontent.com/ImWinnterFan/2month_with_YUA/main/9.png", caption: "カメレオンで遊んだね！" },
    { url: "https://raw.githubusercontent.com/ImWinnterFan/2month_with_YUA/main/11.jpg", caption: "一緒にうさぎを作ったww" },
    { url: "https://raw.githubusercontent.com/ImWinnterFan/2month_with_YUA/main/8.png", caption: "ロブロックスでスキンを買って遊んだよね！" },
    { url: "https://raw.githubusercontent.com/ImWinnterFan/2month_with_YUA/main/7.png", caption: "一緒に折り紙をした✂" },
    { url: "https://raw.githubusercontent.com/ImWinnterFan/2month_with_YUA/main/6.png", caption: "ゆあちのファンサービス💕" },
    { url: "https://raw.githubusercontent.com/ImWinnterFan/2month_with_YUA/main/5.jpg", caption: "韓国にプレゼントが届いた日" },
    { url: "https://raw.githubusercontent.com/ImWinnterFan/2month_with_YUA/main/4.png", caption: "一か月記念のゲーム！？" },
    { url: "https://raw.githubusercontent.com/ImWinnterFan/2month_with_YUA/main/2.jpg", caption: "一緒に絵を描いたwww！" }
];

let scene, camera, renderer;
let heartMesh;
let particlesSystems = [];
let photoMeshes = [];
let currentPhotoIndex = 0;
let mode = 'heart'; // 'heart' | 'photos' | 'transitioning'

// タッチ・スワイプ・なだらかな加速制御用
let isDragging = false;
let previousMousePosition = { x: 0, y: 0 };
let currentVelocityX = 0;
let targetVelocityX = 0;
let heartRotationY = 0;

// スピード判定用
let currentSpeedLevel = 0;
const speedThreshold = 0.28;

init();
animate();

function init() {
    const canvas = document.getElementById('webgl-canvas');

    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0xffffff, 0.02);

    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 7;

    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0xff69b4, 2, 50);
    pointLight.position.set(5, 5, 5);
    scene.add(pointLight);

    const pointLight2 = new THREE.PointLight(0xff1493, 1.5, 50);
    pointLight2.position.set(-5, -5, 5);
    scene.add(pointLight2);

    createHeart();

    window.addEventListener('resize', onWindowResize);

    const touchArea = document.body;
    touchArea.addEventListener('pointerdown', onPointerDown, { passive: false });
    touchArea.addEventListener('pointermove', onPointerMove, { passive: false });
    touchArea.addEventListener('pointerup', onPointerUp, { passive: false });
    touchArea.addEventListener('pointercancel', onPointerUp, { passive: false });

    document.getElementById('reset-btn').addEventListener('click', resetApp);
}

// ハートの3Dオブジェクト生成
function createHeart() {
    const x = 0, y = 0;
    const heartShape = new THREE.Shape();
    heartShape.moveTo(x + 5, y + 5);
    heartShape.bezierCurveTo(x + 5, y + 5, x + 4, y, x, y);
    heartShape.bezierCurveTo(x - 6, y, x - 6, y + 7, x - 6, y + 7);
    heartShape.bezierCurveTo(x - 6, y + 11, x - 3, y + 15.4, x + 5, y + 19);
    heartShape.bezierCurveTo(x + 13, y + 15.4, x + 16, y + 11, x + 16, y + 7);
    heartShape.bezierCurveTo(x + 16, y + 7, x + 16, y, x + 10, y);
    heartShape.bezierCurveTo(x + 6, y, x + 5, y + 5, x + 5, y + 5);

    const extrudeSettings = {
        depth: 3,
        bevelEnabled: true,
        bevelSegments: 5,
        steps: 2,
        bevelSize: 1,
        bevelThickness: 1
    };

    const geometry = new THREE.ExtrudeGeometry(heartShape, extrudeSettings);
    geometry.center();

    const material = new THREE.MeshPhysicalMaterial({
        color: 0xff2a6d,
        roughness: 0.2,
        metalness: 0.1,
        clearcoat: 1.0,
        clearcoatRoughness: 0.1,
        transmission: 0.1,
        transparent: true,
        opacity: 1.0
    });

    heartMesh = new THREE.Mesh(geometry, material);
    heartMesh.scale.set(0.12, 0.12, 0.12);
    heartMesh.rotation.z = Math.PI;
    scene.add(heartMesh);
}

// 写真ギャラリーの生成（配列のインデックスを完全に固定化して管理）
function createPhotoGallery() {
    photoMeshes = memories.map((mem, index) => {
        const group = new THREE.Group();
        group.position.x = 0;
        group.position.y = 0;
        group.position.z = (index === 0) ? 0 : -3;
        group.visible = (index === 0);
        scene.add(group);

        return { mesh: group, caption: mem.caption, index: index, rotationY: 0 };
    });

    memories.forEach((mem, index) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = mem.url;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const targetWidth = 800;
            const targetHeight = 1000;
            canvas.width = targetWidth;
            canvas.height = targetHeight;
            const ctx = canvas.getContext('2d');

            const imgAspect = img.width / img.height;
            const targetAspect = targetWidth / targetHeight;
            let drawWidth, drawHeight, offsetX, offsetY;

            if (imgAspect > targetAspect) {
                drawHeight = targetHeight;
                drawWidth = img.width * (targetHeight / img.height);
                offsetX = (targetWidth - drawWidth) / 2;
                offsetY = 0;
            } else {
                drawWidth = targetWidth;
                drawHeight = img.height * (targetWidth / img.width);
                offsetX = 0;
                offsetY = (targetHeight - drawHeight) / 2;
            }

            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, targetWidth, targetHeight);
            ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);

            const texture = new THREE.CanvasTexture(canvas);
            texture.generateMipmaps = true;
            texture.minFilter = THREE.LinearMipmapLinearFilter;

            const frameGeo = new THREE.BoxGeometry(3.6, 4.6, 0.2);
            frameGeo.center();
            const frameMat = new THREE.MeshStandardMaterial({ 
                color: 0xfdf2f4,
                roughness: 0.2,
                metalness: 0.05
            });
            const frameMesh = new THREE.Mesh(frameGeo, frameMat);

            const photoGeo = new THREE.PlaneGeometry(3.0, 4.0);
            const photoMat = new THREE.MeshBasicMaterial({ 
                map: texture,
                transparent: true,
                alphaTest: 0.05
            });
            const photoMesh = new THREE.Mesh(photoGeo, photoMat);
            photoMesh.position.z = 0.11;

            const group = photoMeshes[index].mesh;
            group.add(frameMesh);
            group.add(photoMesh);

            if (index === currentPhotoIndex) {
                updateCaption();
            }
        };
    });
}

// ポインター操作
function onPointerDown(e) {
    if (mode === 'transitioning') return;
    isDragging = true;
    previousMousePosition = { x: e.clientX, y: e.clientY };
}

function onPointerMove(e) {
    if (!isDragging || mode === 'transitioning') return;

    const deltaX = e.clientX - previousMousePosition.x;
    targetVelocityX = deltaX * 50;

    previousMousePosition = { x: e.clientX, y: e.clientY };
}

function onPointerUp(e) {
    if (!isDragging) return;
    isDragging = false;
    targetVelocityX = 0;
}

// プログレスバー更新
function updateProgressBar(speed) {
    const bar = document.getElementById('progress-bar');
    if (!bar) return;
    const ratio = Math.min(speed / speedThreshold, 1.0);
    bar.style.width = (ratio * 100) + '%';
}

// 最初のハート爆発演出
function triggerHeartExplosion() {
    mode = 'transitioning';
    document.getElementById('instruction-banner').style.opacity = '0';

    const startTime = performance.now();
    
    function animateExplosion(time) {
        const elapsed = (time - startTime) / 500;
        
        if (elapsed < 1) {
            const scale = 0.12 * (1 - elapsed * 0.8);
            if (heartMesh) heartMesh.scale.set(scale, scale, scale);
            if (heartMesh && heartMesh.material) heartMesh.material.opacity = 1 - elapsed;
            requestAnimationFrame(animateExplosion);
        } else {
            if (heartMesh) scene.remove(heartMesh);
            createParticles();
            
            setTimeout(() => {
                createPhotoGallery();
                mode = 'photos';
                document.getElementById('photo-ui').classList.remove('hidden');
                document.getElementById('reset-btn').classList.remove('hidden');
                document.getElementById('instruction-banner').style.opacity = '1';
                document.getElementById('guide-text').textContent = 'スピーディーに回して次の思い出へ進もう！';
                currentSpeedLevel = 0;
                updateProgressBar(0);
            }, 300);
        }
    }

    requestAnimationFrame(animateExplosion);
}

// 次の写真への移行演出
function triggerPhotoTransition() {
    const oldObj = photoMeshes[currentPhotoIndex];
    const nextIndex = (currentPhotoIndex + 1) % memories.length;
    const newObj = photoMeshes[nextIndex];

    if (!oldObj || !newObj) return;

    mode = 'transitioning';
    document.getElementById('guide-text').textContent = '✨ クラッカーパーン！次の思い出へ ✨';

    createParticles();

    const startTime = performance.now();
    const startRotY = oldObj.rotationY;
    const targetRotY = startRotY + Math.PI * 4;
    const duration = 800;

    function animateHoldTransition(time) {
        const elapsed = time - startTime;
        const progress = Math.min(elapsed / duration, 1.0);
        const easeProgress = 1 - Math.pow(1 - progress, 3);

        oldObj.rotationY = startRotY + (targetRotY - startRotY) * easeProgress;
        oldObj.mesh.rotation.y = oldObj.rotationY;

        if (progress < 1) {
            requestAnimationFrame(animateHoldTransition);
        } else {
            oldObj.mesh.visible = false;
            oldObj.rotationY = 0;
            oldObj.mesh.rotation.y = 0;

            currentPhotoIndex = nextIndex;
            if (newObj) {
                newObj.mesh.visible = true;
                newObj.rotationY = 0;
                newObj.mesh.rotation.y = 0;
            }

            updateCaption();
            mode = 'photos';
            currentSpeedLevel = 0;
            updateProgressBar(0);
            document.getElementById('guide-text').textContent = 'スピーディーに回して次の思い出へ進もう！';
        }
    }

    requestAnimationFrame(animateHoldTransition);
}

// クラッカー（紙吹雪）
function createParticles() {
    const particleCount = 150;
    const geometry = new THREE.BufferGeometry();
    const positions = [];
    const velocities = [];
    const colors = [];

    const colorPalette = [0xff2a6d, 0xff758c, 0xffeb3b, 0x00e5ff, 0xff6b81, 0xff4757];

    for (let i = 0; i < particleCount; i++) {
        positions.push(0, 0, 0);

        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos((Math.random() * 2) - 1);
        const speed = 0.06 + Math.random() * 0.15;

        velocities.push({
            x: speed * Math.sin(phi) * Math.cos(theta),
            y: speed * Math.sin(phi) * Math.sin(theta),
            z: speed * Math.cos(phi)
        });

        const col = new THREE.Color(colorPalette[Math.floor(Math.random() * colorPalette.length)]);
        colors.push(col.r, col.g, col.b);
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
        size: 0.2,
        vertexColors: true,
        transparent: true,
        opacity: 1.0,
        blending: THREE.NormalBlending
    });

    const mesh = new THREE.Points(geometry, material);
    scene.add(mesh);

    particlesSystems.push({
        mesh: mesh,
        velocities: velocities,
        age: 0
    });
}

function updateCaption() {
    const captionEl = document.getElementById('photo-caption');
    if (captionEl && memories[currentPhotoIndex]) {
        captionEl.textContent = memories[currentPhotoIndex].caption;
    }
}

// 最初からやり直す
function resetApp() {
    if (heartMesh) scene.remove(heartMesh);
    
    particlesSystems.forEach(p => scene.remove(p.mesh));
    particlesSystems = [];

    photoMeshes.forEach(p => {
        if (p && p.mesh) scene.remove(p.mesh);
    });
    photoMeshes = [];

    currentPhotoIndex = 0;
    mode = 'heart';
    heartRotationY = 0;
    currentVelocityX = 0;
    targetVelocityX = 0;
    currentSpeedLevel = 0;
    updateProgressBar(0);

    document.getElementById('photo-ui').classList.add('hidden');
    document.getElementById('reset-btn').classList.add('hidden');
    document.getElementById('instruction-banner').style.opacity = '1';
    document.getElementById('guide-text').textContent = '左右にスワイプして、ぐるぐる高速回転させよう！';

    createHeart();
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);

    currentVelocityX += (targetVelocityX - currentVelocityX) * 0.15;

    if (!isDragging) {
        targetVelocityX *= 1.5;
        currentVelocityX *= 1.5;
    }

    if (mode !== 'transitioning') {
        const speedMagnitude = Math.abs(currentVelocityX);
        
        currentSpeedLevel += (speedMagnitude - currentSpeedLevel) * 0.2;
        updateProgressBar(currentSpeedLevel);

        if (currentSpeedLevel >= speedThreshold) {
            isDragging = false;
            targetVelocityX = 0;
            currentVelocityX = 0;
            if (mode === 'heart') {
                triggerHeartExplosion();
            } else if (mode === 'photos') {
                triggerPhotoTransition();
            }
        }

        if (mode === 'heart' && heartMesh) {
            heartRotationY += currentVelocityX;
            if (!isDragging && Math.abs(currentVelocityX) < 0.001) {
                heartRotationY += 0.005;
            }
            heartMesh.rotation.y = heartRotationY;
        } else if (mode === 'photos') {
            const currentObj = photoMeshes[currentPhotoIndex];
            if (currentObj) {
                currentObj.rotationY += currentVelocityX;
                currentObj.mesh.rotation.y = currentObj.rotationY;
            }
        }
    }

    // パーティクル管理
    for (let i = particlesSystems.length - 1; i >= 0; i--) {
        const ps = particlesSystems[i];
        ps.age++;
        const positions = ps.mesh.geometry.attributes.position.array;
        
        for (let j = 0; j < ps.velocities.length; j++) {
            const v = ps.velocities[j];
            positions[j * 3] += v.x;
            positions[j * 3 + 1] += v.y;
            positions[j * 3 + 2] += v.z;
            v.y -= 0.003;
        }
        ps.mesh.geometry.attributes.position.needsUpdate = true;

        if (ps.age > 100) {
            ps.mesh.material.opacity = Math.max(0, 1 - (ps.age - 100) / 40);
        }

        if (ps.age > 140) {
            scene.remove(ps.mesh);
            ps.mesh.geometry.dispose();
            ps.mesh.material.dispose();
            particlesSystems.splice(i, 1);
        }
    }

    renderer.render(scene, camera);
}
