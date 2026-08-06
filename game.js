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
    selectedShip: 0 // 0: Drone, 1: Scout, 2: Cruiser
};

const SHIPS = [
    { name: '🛸 Дрон-добытчик', color: 0x0284c7, speed: 300, yieldMul: 1.0 },
    { name: '🛰️ Скоростной Разведчик', color: 0x38bdf8, speed: 450, yieldMul: 1.2 },
    { name: '⚔️ Тяжелый Крейсер', color: 0x818cf8, speed: 220, yieldMul: 1.8 }
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
let hangarShipGroup;
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

function preload() {}

function create() {
    sceneRef = this;
    const width = sceneRef.cameras.main.width;
    const height = sceneRef.cameras.main.height;

    // 1. Starfield Background
    for (let i = 0; i < 120; i++) {
        const x = Phaser.Math.Between(0, width);
        const y = Phaser.Math.Between(0, height);
        const star = sceneRef.add.circle(x, y, Phaser.Math.FloatBetween(0.5, 2.0), 0xffffff, Phaser.Math.FloatBetween(0.3, 0.9));
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
            playerShip.x = Phaser.Math.Clamp(pointer.x, 30, width - 30);
        }
    });

    // Fetch initial player data from backend
    fetchPlayerData();
}

function update(time, delta) {
    // Twinkle stars
    stars.forEach(s => {
        s.alpha += Phaser.Math.FloatBetween(-0.02, 0.02);
        if (s.alpha > 0.9) s.alpha = 0.9;
        if (s.alpha < 0.2) s.alpha = 0.2;
    });

    if (currentMode === 'hangar' && hangarShipGroup) {
        hangarShipGroup.rotation += 0.005;
    }

    if (isGaming) {
        // Keyboard controls
        if (cursors.left.isDown && playerShip) {
            playerShip.x -= 6;
        } else if (cursors.right.isDown && playerShip) {
            playerShip.x += 6;
        }

        // Move falling items and meteors
        itemsGroup.getChildren().forEach(item => {
            item.y += item.speed;
            // Collision check
            if (playerShip && Phaser.Math.Distance.Between(playerShip.x, playerShip.y, item.x, item.y) < 35) {
                collectedCrystals += item.value;
                collectedMetal += item.value * 2;
                document.getElementById('game-crystals').innerText = collectedCrystals;
                if (tg) tg.HapticFeedback.impactOccurred('light');

                // Floating text
                showFloatingText(item.x, item.y, `+${item.value} 💎`);
                item.destroy();
            } else if (item.y > sceneRef.cameras.main.height + 50) {
                item.destroy();
            }
        });

        meteorsGroup.getChildren().forEach(m => {
            m.y += m.speed;
            m.rotation += 0.03;
            if (playerShip && Phaser.Math.Distance.Between(playerShip.x, playerShip.y, m.x, m.y) < 35) {
                // Meteor hit effect
                showFloatingText(m.x, m.y, '💥 Удар!');
                if (tg) tg.HapticFeedback.notificationOccurred('warning');
                m.destroy();
            } else if (m.y > sceneRef.cameras.main.height + 50) {
                m.destroy();
            }
        });
    }
}

/* 🛸 HANGAR SCENE BUILDER */
function createHangarScene() {
    const width = sceneRef.cameras.main.width;
    const height = sceneRef.cameras.main.height;

    if (hangarShipGroup) hangarShipGroup.destroy();
    hangarShipGroup = sceneRef.add.container(width / 2, height / 2 - 20);

    const shipData = SHIPS[playerData.selectedShip];

    // Ship Body (Procedural Sci-Fi 2D Graphic)
    const body = sceneRef.add.polygon(0, 0, [0, -50, 35, 30, -35, 30], shipData.color);
    const core = sceneRef.add.circle(0, 0, 12, 0xffffff);
    const aura = sceneRef.add.circle(0, 0, 60, shipData.color, 0.2);

    hangarShipGroup.add([aura, body, core]);
}

/* 🎮 MINIGAME LAUNCHER */
function startMinigame() {
    const width = sceneRef.cameras.main.width;
    const height = sceneRef.cameras.main.height;

    if (hangarShipGroup) hangarShipGroup.setVisible(false);

    // Create Player Spaceship
    const shipData = SHIPS[playerData.selectedShip];
    if (playerShip) playerShip.destroy();
    playerShip = sceneRef.add.polygon(width / 2, height - 120, [0, -30, 20, 20, -20, 20], shipData.color);

    isGaming = true;
    gameTimer = 20;
    collectedCrystals = 0;
    collectedMetal = 0;
    document.getElementById('game-crystals').innerText = 0;
    document.getElementById('game-timer').innerText = gameTimer;

    // Spawners
    sceneRef.time.addEvent({
        delay: 600,
        callback: spawnLootItem,
        loop: true
    });

    sceneRef.time.addEvent({
        delay: 900,
        callback: spawnMeteor,
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

function spawnLootItem() {
    if (!isGaming) return;
    const x = Phaser.Math.Between(40, sceneRef.cameras.main.width - 40);
    const item = sceneRef.add.circle(x, -20, 10, 0x38bdf8);
    item.speed = Phaser.Math.Between(4, 7);
    item.value = Phaser.Math.Between(5, 15);
    itemsGroup.add(item);
}

function spawnMeteor() {
    if (!isGaming) return;
    const x = Phaser.Math.Between(40, sceneRef.cameras.main.width - 40);
    const m = sceneRef.add.circle(x, -30, Phaser.Math.Between(12, 22), 0x64748b);
    m.speed = Phaser.Math.Between(5, 8);
    meteorsGroup.add(m);
}

function endMinigame() {
    isGaming = false;
    if (timerEvent) timerEvent.destroy();
    if (playerShip) playerShip.destroy();
    itemsGroup.clear(true, true);
    meteorsGroup.clear(true, true);

    if (hangarShipGroup) hangarShipGroup.setVisible(true);

    // Send rewards to backend
    fetch('/api/minigame_reward', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            telegram_id: telegramId,
            metal: collectedMetal,
            crystal: collectedCrystals,
            deuterium: 10
        })
    })
    .then(res => res.json())
    .then(data => {
        if (data.status === 'success') {
            playerData.metal = data.new_total.metal;
            playerData.crystal = data.new_total.crystal;
            playerData.deuterium = data.new_total.deuterium;
            updateUI();
            alert(`🎉 Рейд завершен!\nДобыто: +${collectedMetal} Металла, +${collectedCrystals} Кристаллов!`);
        }
    })
    .catch(err => console.error('Reward error:', err));

    switchMode('hangar');
}

function showFloatingText(x, y, str) {
    const txt = sceneRef.add.text(x, y, str, { fontSize: '16px', fill: '#38bdf8', fontStyle: 'bold' });
    sceneRef.tweens.add({
        targets: txt,
        y: y - 40,
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
        mainBtn.innerText = '🚀 Сменить Корабль в Ангаре';
    }
}

function handleMainAction() {
    if (currentMode === 'runner') {
        startMinigame();
    } else {
        // Cycle selected ship
        playerData.selectedShip = (playerData.selectedShip + 1) % SHIPS.length;
        createHangarScene();
        if (tg) tg.HapticFeedback.selectionChanged();
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
