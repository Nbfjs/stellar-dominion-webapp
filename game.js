// Initialize Telegram WebApp SDK
const tg = window.Telegram?.WebApp;
if (tg) {
    tg.expand();
    tg.ready();
}

// Extract telegram_id from URL query params or WebApp initData
const urlParams = new URLSearchParams(window.location.search);
const telegramId = urlParams.get('telegram_id') || tg?.initDataUnsafe?.user?.id || 123456789;

// Game State
let currentMode = 'hangar'; // 'hangar' | 'runner'
let playerData = {
    metal: 500,
    crystal: 200,
    deuterium: 50,
    selectedShip: 0 // 0: Scout, 1: Cruiser
};

const SHIPS = [
    { id: 'tex_scout', name: '⚡ Скоростной Перехватчик', speed: 500, yieldMul: 1.2 },
    { id: 'tex_cruiser', name: '⚔️ Тяжелый Крейсер', speed: 380, yieldMul: 1.8 }
];

// Phaser 3 Configuration
const config = {
    type: Phaser.AUTO,
    parent: 'game-container',
    width: window.innerWidth,
    height: window.innerHeight,
    backgroundColor: '#030712',
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

const game = new Phaser.Game(config);

// Phaser objects
let sceneRef;
let stars = [];
let hangarContainer;
let playerShip;
let itemsGroup;
let meteorsGroup;

// Minigame variables
let isGaming = false;
let gameTimer = 20;
let timerEvent;
let collectedCrystals = 0;
let collectedMetal = 0;
let cursors;

/* 🎨 GENERATE HIGH-RES PROCEDURAL CANVAS TEXTURES */
function generateGameTextures(scene) {
    // 1. Scout Ship Texture (80x80)
    const cvScout = scene.textures.createCanvas('tex_scout', 80, 80);
    const ctxS = cvScout.context;
    ctxS.fillStyle = 'rgba(0,0,0,0)';
    ctxS.fillRect(0, 0, 80, 80);

    // Glowing Thruster Flame
    ctxS.fillStyle = '#38bdf8';
    ctxS.beginPath();
    ctxS.arc(40, 68, 10, 0, Math.PI * 2);
    ctxS.fill();

    // Metallic Hull
    ctxS.fillStyle = '#0284c7';
    ctxS.beginPath();
    ctxS.moveTo(40, 8);
    ctxS.lineTo(72, 60);
    ctxS.lineTo(40, 50);
    ctxS.lineTo(8, 60);
    ctxS.closePath();
    ctxS.fill();

    // Cyan Neon Wings
    ctxS.strokeStyle = '#38bdf8';
    ctxS.lineWidth = 3;
    ctxS.stroke();

    // Cockpit
    ctxS.fillStyle = '#e0f2fe';
    ctxS.beginPath();
    ctxS.ellipse(40, 32, 6, 12, 0, 0, Math.PI * 2);
    ctxS.fill();
    cvScout.refresh();

    // 2. Cruiser Ship Texture (90x90)
    const cvCruiser = scene.textures.createCanvas('tex_cruiser', 90, 90);
    const ctxC = cvCruiser.context;
    ctxC.fillStyle = 'rgba(0,0,0,0)';
    ctxC.fillRect(0, 0, 90, 90);

    // Twin Plasma Thrusters
    ctxC.fillStyle = '#818cf8';
    ctxC.beginPath();
    ctxC.arc(28, 76, 8, 0, Math.PI * 2);
    ctxC.arc(62, 76, 8, 0, Math.PI * 2);
    ctxC.fill();

    // Heavy Cruiser Armor Hull
    ctxC.fillStyle = '#4f46e5';
    ctxC.beginPath();
    ctxC.moveTo(45, 6);
    ctxC.lineTo(82, 40);
    ctxC.lineTo(74, 75);
    ctxC.lineTo(45, 62);
    ctxC.lineTo(16, 75);
    ctxC.lineTo(8, 40);
    ctxC.closePath();
    ctxC.fill();

    ctxC.strokeStyle = '#a5b4fc';
    ctxC.lineWidth = 4;
    ctxC.stroke();

    // Command Glass
    ctxC.fillStyle = '#c7d2fe';
    ctxC.beginPath();
    ctxC.arc(45, 34, 10, 0, Math.PI * 2);
    ctxC.fill();
    cvCruiser.refresh();

    // 3. Asteroid Meteor Texture (60x60)
    const cvAsteroid = scene.textures.createCanvas('tex_asteroid', 60, 60);
    const ctxA = cvAsteroid.context;
    ctxA.fillStyle = '#475569';
    ctxA.beginPath();
    ctxA.moveTo(30, 5);
    ctxA.lineTo(52, 18);
    ctxA.lineTo(56, 42);
    ctxA.lineTo(36, 56);
    ctxA.lineTo(12, 50);
    ctxA.lineTo(4, 28);
    ctxA.closePath();
    ctxA.fill();

    ctxA.strokeStyle = '#1e293b';
    ctxA.lineWidth = 3;
    ctxA.stroke();

    // Dark Craters
    ctxA.fillStyle = '#1e293b';
    ctxA.beginPath();
    ctxA.arc(24, 24, 7, 0, Math.PI * 2);
    ctxA.arc(40, 38, 5, 0, Math.PI * 2);
    ctxA.fill();
    cvAsteroid.refresh();

    // 4. Crystal Gem Texture (40x40)
    const cvCrystal = scene.textures.createCanvas('tex_crystal', 40, 40);
    const ctxCr = cvCrystal.context;
    ctxCr.fillStyle = '#38bdf8';
    ctxCr.beginPath();
    ctxCr.moveTo(20, 2);
    ctxCr.lineTo(36, 20);
    ctxCr.lineTo(20, 38);
    ctxCr.lineTo(4, 20);
    ctxCr.closePath();
    ctxCr.fill();

    ctxCr.fillStyle = '#e0f2fe';
    ctxCr.beginPath();
    ctxCr.moveTo(20, 2);
    ctxCr.lineTo(20, 38);
    ctxCr.lineTo(4, 20);
    ctxCr.closePath();
    ctxCr.fill();
    cvCrystal.refresh();
}

function preload() {}

function create() {
    sceneRef = this;
    const width = sceneRef.cameras.main.width;
    const height = sceneRef.cameras.main.height;

    // Generate crisp vector procedural textures
    generateGameTextures(sceneRef);

    // 1. Starfield Background
    for (let i = 0; i < 140; i++) {
        const x = Phaser.Math.Between(0, width);
        const y = Phaser.Math.Between(0, height);
        const star = sceneRef.add.circle(
            x, y,
            Phaser.Math.FloatBetween(0.6, 2.2),
            0xffffff,
            Phaser.Math.FloatBetween(0.2, 0.9)
        );
        star.speed = Phaser.Math.FloatBetween(0.5, 2.2);
        stars.push(star);
    }

    // 2. Groups
    itemsGroup = sceneRef.add.group();
    meteorsGroup = sceneRef.add.group();

    // 3. Render Hangar Scene
    createHangarScene();

    // 4. Input Setup
    cursors = sceneRef.input.keyboard.createCursorKeys();
    sceneRef.input.on('pointermove', (pointer) => {
        if (isGaming && playerShip) {
            playerShip.x = Phaser.Math.Clamp(pointer.x, 35, width - 35);
        }
    });

    // Fetch initial player data from backend
    fetchPlayerData();
}

function update(time, delta) {
    const height = sceneRef.cameras.main.height;

    // Move background starfield
    stars.forEach(s => {
        s.y += s.speed;
        if (s.y > height) {
            s.y = -10;
            s.x = Phaser.Math.Between(0, sceneRef.cameras.main.width);
        }
    });

    if (currentMode === 'hangar' && hangarContainer) {
        hangarContainer.y = (height / 2 - 20) + Math.sin(time / 350) * 10;
    }

    if (isGaming) {
        const shipData = SHIPS[playerData.selectedShip];

        // Keyboard navigation
        if (cursors.left.isDown && playerShip) {
            playerShip.x -= shipData.speed * (delta / 1000);
        } else if (cursors.right.isDown && playerShip) {
            playerShip.x += shipData.speed * (delta / 1000);
        }

        if (playerShip) {
            playerShip.x = Phaser.Math.Clamp(playerShip.x, 35, sceneRef.cameras.main.width - 35);
        }

        // Falling Crystals
        itemsGroup.getChildren().forEach(item => {
            item.y += item.speed;
            item.rotation += 0.04;

            if (playerShip && Phaser.Math.Distance.Between(playerShip.x, playerShip.y, item.x, item.y) < 42) {
                const yieldVal = Math.round(item.value * shipData.yieldMul);
                collectedCrystals += yieldVal;
                collectedMetal += yieldVal * 3;
                document.getElementById('game-crystals').innerText = collectedCrystals;

                if (tg?.HapticFeedback) tg.HapticFeedback.impactOccurred('medium');

                showFloatingText(item.x, item.y, `+${yieldVal} 💎`, '#38bdf8');
                item.destroy();
            } else if (item.y > height + 50) {
                item.destroy();
            }
        });

        // Falling Asteroids
        meteorsGroup.getChildren().forEach(m => {
            m.y += m.speed;
            m.rotation += 0.03;

            if (playerShip && Phaser.Math.Distance.Between(playerShip.x, playerShip.y, m.x, m.y) < 42) {
                showFloatingText(m.x, m.y, '💥 Удар!', '#ef4444');
                if (tg?.HapticFeedback) tg.HapticFeedback.notificationOccurred('warning');
                m.destroy();
            } else if (m.y > height + 50) {
                m.destroy();
            }
        });
    }
}

/* 🛸 HANGAR SCENE BUILDER */
function createHangarScene() {
    const width = sceneRef.cameras.main.width;
    const height = sceneRef.cameras.main.height;

    if (hangarContainer) hangarContainer.destroy();
    hangarContainer = sceneRef.add.container(width / 2, height / 2 - 20);

    const shipData = SHIPS[playerData.selectedShip];

    // Sci-Fi Aura Ring
    const aura = sceneRef.add.circle(0, 0, 80, 0x38bdf8, 0.15);

    // Ship Sprite
    const shipSprite = sceneRef.add.image(0, 0, shipData.id);

    hangarContainer.add([aura, shipSprite]);
}

/* 🎮 MINIGAME LAUNCHER */
function startMinigame() {
    const width = sceneRef.cameras.main.width;
    const height = sceneRef.cameras.main.height;

    // HIDE UI OVERLAYS TO GIVE 100% CLEAR SCREEN VIEW FOR FLIGHT
    document.body.classList.add('gaming-active');

    if (hangarContainer) hangarContainer.setVisible(false);

    const shipData = SHIPS[playerData.selectedShip];
    if (playerShip) playerShip.destroy();

    playerShip = sceneRef.add.image(width / 2, height - 120, shipData.id);

    isGaming = true;
    gameTimer = 20;
    collectedCrystals = 0;
    collectedMetal = 0;
    document.getElementById('game-crystals').innerText = 0;
    document.getElementById('game-timer').innerText = gameTimer;

    // Spawners
    sceneRef.time.addEvent({
        delay: 450,
        callback: spawnCrystalItem,
        loop: true
    });

    sceneRef.time.addEvent({
        delay: 650,
        callback: spawnMeteorItem,
        loop: true
    });

    // Countdown Timer
    if (timerEvent) timerEvent.destroy();
    timerEvent = sceneRef.time.addEvent({
        delay: 1000,
        callback: () => {
            gameTimer--;
            document.getElementById('game-timer').innerText = gameTimer;
            if (gameTimer <= 0) {
                endMinigame();
            }
        },
        loop: true
    });
}

function spawnCrystalItem() {
    if (!isGaming) return;
    const x = Phaser.Math.Between(35, sceneRef.cameras.main.width - 35);
    const c = sceneRef.add.image(x, -20, 'tex_crystal');
    c.speed = Phaser.Math.Between(4, 7);
    c.value = Phaser.Math.Between(6, 16);
    itemsGroup.add(c);
}

function spawnMeteorItem() {
    if (!isGaming) return;
    const x = Phaser.Math.Between(35, sceneRef.cameras.main.width - 35);
    const m = sceneRef.add.image(x, -30, 'tex_asteroid');
    m.speed = Phaser.Math.Between(5, 9);
    meteorsGroup.add(m);
}

function endMinigame() {
    isGaming = false;
    // RESTORE UI OVERLAY WHEN FLIGHT ENDS
    document.body.classList.remove('gaming-active');

    if (timerEvent) timerEvent.destroy();
    if (playerShip) playerShip.destroy();
    itemsGroup.clear(true, true);
    meteorsGroup.clear(true, true);

    if (hangarContainer) hangarContainer.setVisible(true);

    // Sync loot with PostgreSQL backend
    fetch('/api/minigame_reward', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            telegram_id: telegramId,
            metal: collectedMetal,
            crystal: collectedCrystals,
            deuterium: 15
        })
    })
    .then(res => res.json())
    .then(data => {
        if (data.status === 'success') {
            playerData.metal = data.new_total.metal;
            playerData.crystal = data.new_total.crystal;
            playerData.deuterium = data.new_total.deuterium;
            updateUI();
        }
    })
    .catch(err => console.error('Reward sync error:', err));

    switchMode('hangar');
}

function showFloatingText(x, y, str, colorHex) {
    const txt = sceneRef.add.text(x, y, str, {
        fontSize: '18px',
        fill: colorHex,
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 3
    });
    sceneRef.tweens.add({
        targets: txt,
        y: y - 45,
        alpha: 0,
        duration: 700,
        onComplete: () => txt.destroy()
    });
}

/* UI HELPERS */
function switchMode(mode) {
    currentMode = mode;
    document.getElementById('tab-hangar').classList.toggle('active', mode === 'hangar');
    document.getElementById('tab-runner').classList.toggle('active', mode === 'runner');

    const hud = document.getElementById('minigame-hud');
    const mainBtn = document.getElementById('main-action-btn');

    if (mode === 'runner') {
        hud.classList.remove('hidden');
        mainBtn.innerText = '⚡ НАЧАТЬ ВЫЛЕТ!';
    } else {
        hud.classList.add('hidden');
        const shipData = SHIPS[playerData.selectedShip];
        mainBtn.innerText = `🛸 Корабль: ${shipData.name} (Сменить)`;
    }
}

function handleMainAction() {
    if (currentMode === 'runner') {
        startMinigame();
    } else {
        // Cycle selected ship
        playerData.selectedShip = (playerData.selectedShip + 1) % SHIPS.length;
        createHangarScene();
        if (tg?.HapticFeedback) tg.HapticFeedback.selectionChanged();
        const shipData = SHIPS[playerData.selectedShip];
        document.getElementById('main-action-btn').innerText = `🛸 Корабль: ${shipData.name} (Сменить)`;
    }
}

function fetchPlayerData() {
    fetch(`/api/player?telegram_id=${telegramId}`)
        .then(res => res.json())
        .then(data => {
            if (data.resources) {
                playerData.metal = data.resources.metal;
                playerData.crystal = data.resources.crystal;
                playerData.deuterium = data.resources.deuterium;
                updateUI();
            }
        })
        .catch(err => console.log('Fetch player info offline fallback'));
}

function updateUI() {
    document.getElementById('res-metal').innerText = Math.floor(playerData.metal);
    document.getElementById('res-crystal').innerText = Math.floor(playerData.crystal);
    document.getElementById('res-deuterium').innerText = Math.floor(playerData.deuterium);
}

function closeWebApp() {
    if (tg) tg.close();
}
