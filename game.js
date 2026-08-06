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
    { id: 'ship_scout', name: '⚡ Скоростной Перехватчик', speed: 500, yieldMul: 1.2, scale: 0.25 },
    { id: 'ship_cruiser', name: '⚔️ Тяжелый Крейсер', speed: 350, yieldMul: 1.8, scale: 0.28 }
];

// Phaser 3 Configuration
const config = {
    type: Phaser.AUTO,
    parent: 'game-container',
    width: window.innerWidth,
    height: window.innerHeight,
    backgroundColor: '#030712',
    physics: {
        default: 'arcade',
        arcade: { debug: false }
    },
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

function preload() {
    this.load.image('ship_scout', 'assets/scout.png');
    this.load.image('ship_cruiser', 'assets/cruiser.png');
    this.load.image('asteroid', 'assets/asteroid.png');
}

function create() {
    sceneRef = this;
    const width = sceneRef.cameras.main.width;
    const height = sceneRef.cameras.main.height;

    // 1. Starfield Background
    for (let i = 0; i < 150; i++) {
        const x = Phaser.Math.Between(0, width);
        const y = Phaser.Math.Between(0, height);
        const star = sceneRef.add.circle(
            x, y,
            Phaser.Math.FloatBetween(0.5, 2.2),
            0xffffff,
            Phaser.Math.FloatBetween(0.2, 0.9)
        );
        star.speed = Phaser.Math.FloatBetween(0.5, 2.0);
        stars.push(star);
    }

    // 2. Groups
    itemsGroup = sceneRef.add.group();
    meteorsGroup = sceneRef.add.group();

    // 3. Render Hangar Scene
    createHangarScene();

    // 4. Touch & Pointer Drag Controls (Mobile & Desktop)
    cursors = sceneRef.input.keyboard.createCursorKeys();
    sceneRef.input.on('pointermove', (pointer) => {
        if (isGaming && playerShip) {
            playerShip.x = Phaser.Math.Clamp(pointer.x, 40, width - 40);
        }
    });

    // Fetch initial player data from backend
    fetchPlayerData();
}

function update(time, delta) {
    const height = sceneRef.cameras.main.height;

    // Move starfield background downward for space speed feel
    stars.forEach(s => {
        s.y += s.speed;
        if (s.y > height) {
            s.y = -10;
            s.x = Phaser.Math.Between(0, sceneRef.cameras.main.width);
        }
    });

    if (currentMode === 'hangar' && hangarContainer) {
        hangarContainer.y = (height / 2 - 30) + Math.sin(time / 400) * 12;
    }

    if (isGaming) {
        const shipData = SHIPS[playerData.selectedShip];

        // Keyboard controls fallback
        if (cursors.left.isDown && playerShip) {
            playerShip.x -= shipData.speed * (delta / 1000);
        } else if (cursors.right.isDown && playerShip) {
            playerShip.x += shipData.speed * (delta / 1000);
        }

        if (playerShip) {
            playerShip.x = Phaser.Math.Clamp(playerShip.x, 40, sceneRef.cameras.main.width - 40);
        }

        // Falling Crystals
        itemsGroup.getChildren().forEach(item => {
            item.y += item.speed;
            item.rotation += 0.04;

            if (playerShip && Phaser.Math.Distance.Between(playerShip.x, playerShip.y, item.x, item.y) < 45) {
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

        // Falling Asteroid Meteors
        meteorsGroup.getChildren().forEach(m => {
            m.y += m.speed;
            m.rotation += 0.02;

            if (playerShip && Phaser.Math.Distance.Between(playerShip.x, playerShip.y, m.x, m.y) < 45) {
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
    hangarContainer = sceneRef.add.container(width / 2, height / 2 - 30);

    const shipData = SHIPS[playerData.selectedShip];

    // Aura ring behind ship
    const aura = sceneRef.add.circle(0, 0, 90, 0x38bdf8, 0.15);

    // Ship Sprite PNG
    const shipSprite = sceneRef.add.image(0, 0, shipData.id);
    shipSprite.setScale(shipData.scale);

    hangarContainer.add([aura, shipSprite]);
}

/* 🎮 MINIGAME LAUNCHER */
function startMinigame() {
    const width = sceneRef.cameras.main.width;
    const height = sceneRef.cameras.main.height;

    if (hangarContainer) hangarContainer.setVisible(false);

    const shipData = SHIPS[playerData.selectedShip];
    if (playerShip) playerShip.destroy();

    playerShip = sceneRef.add.image(width / 2, height - 140, shipData.id);
    playerShip.setScale(shipData.scale * 0.85);

    isGaming = true;
    gameTimer = 20;
    collectedCrystals = 0;
    collectedMetal = 0;
    document.getElementById('game-crystals').innerText = 0;
    document.getElementById('game-timer').innerText = gameTimer;

    // Spawners
    sceneRef.time.addEvent({
        delay: 500,
        callback: spawnCrystalItem,
        loop: true
    });

    sceneRef.time.addEvent({
        delay: 750,
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
    const x = Phaser.Math.Between(40, sceneRef.cameras.main.width - 40);

    // Glowing 2D Crystal Gem Shape
    const c = sceneRef.add.polygon(x, -20, [0, -12, 10, 0, 0, 12, -10, 0], 0x38bdf8);
    c.speed = Phaser.Math.Between(4, 7);
    c.value = Phaser.Math.Between(5, 15);
    itemsGroup.add(c);
}

function spawnMeteorItem() {
    if (!isGaming) return;
    const x = Phaser.Math.Between(40, sceneRef.cameras.main.width - 40);

    const m = sceneRef.add.image(x, -30, 'asteroid');
    m.setScale(Phaser.Math.FloatBetween(0.12, 0.22));
    m.speed = Phaser.Math.Between(5, 9);
    meteorsGroup.add(m);
}

function endMinigame() {
    isGaming = false;
    if (timerEvent) timerEvent.destroy();
    if (playerShip) playerShip.destroy();
    itemsGroup.clear(true, true);
    meteorsGroup.clear(true, true);

    if (hangarContainer) hangarContainer.setVisible(true);

    // Sync rewards with PostgreSQL DB backend
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
