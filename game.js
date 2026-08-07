// ══════════════════════════════════════════════════════════════════
//  STELLAR DOMINION: РЕЙД v7.0 (Run Build Pew Style HD)
//  Fully procedural HD textures, Hex Shields, Bouncing Laser, Radar UI
// ══════════════════════════════════════════════════════════════════

const tg = window.Telegram?.WebApp;
if (tg) { tg.expand(); tg.ready(); tg.disableVerticalSwipes?.(); }

const URL_PARAMS = new URLSearchParams(window.location.search);
const TELEGRAM_ID = parseInt(
  URL_PARAMS.get('telegram_id') ||
  tg?.initDataUnsafe?.user?.id ||
  123456789
);
const API_BASE = URL_PARAMS.get('api') || '';

// ─── PARTS CATALOG ─────────────────────────────────────────────────
const PARTS = [
  { id:'cannon',  label:'Корветная Пушка',    icon:'⚡', desc:'+1 гатлинг-турель, быстрая стрельба', col:0xf59e0b, rare:false },
  { id:'laser',   label:'Рикошет-Лазер',      icon:'🔴', desc:'Розовый луч рекошетит по врагам',     col:0xec4899, rare:true  },
  { id:'drone',   label:'Шахтный Дрон',       icon:'🤖', desc:'Авто-магнит ресурсов на карте',       col:0x10b981, rare:false },
  { id:'shield',  label:'Силовой Щит',        icon:'💠', desc:'Шестиугольный барьер (+5 ударов)',    col:0x3b82f6, rare:true  },
  { id:'crystal', label:'Синтезатор',         icon:'💎', desc:'x2 кристаллов за всех врагов',        col:0x06b6d4, rare:false },
  { id:'cargo',   label:'Грузовой Отсек',     icon:'📦', desc:'x2 к финишной награде рейда',        col:0xf97316, rare:true  },
  { id:'engine',  label:'Форсажный Движок',   icon:'🌀', desc:'+50% скорость маневрирования',        col:0xa855f7, rare:false },
  { id:'spread',  label:'Разброс-Пушка',      icon:'💥', desc:'Веер из 3 плазменных зарядов',       col:0xeab308, rare:false },
];

// ─── ENEMY DEFINITIONS ─────────────────────────────────────────────
const ENEMY_DEF = {
  drone:   { name:'Дрон-Охотник',     hp:50,  spd:130, sz:16, loot:{m:12, c:6 } },
  frigate: { name:'Разведфрегат',     hp:150, spd:80,  sz:24, loot:{m:30, c:15} },
  heavy:   { name:'Тяжелый Крейсер',  hp:350, spd:48,  sz:34, loot:{m:65, c:30} },
  boss:    { name:'Командор-Охотник', hp:1100,spd:55,  sz:54, loot:{m:250,c:125} },
};

// ─── WAVE DEFINITIONS ──────────────────────────────────────────────
const WAVES = [
  [ {t:'drone',  n:6} ],
  [ {t:'drone',  n:5}, {t:'frigate', n:2} ],
  [ {t:'frigate',n:4}, {t:'heavy',   n:2} ],
  [ {t:'heavy',  n:3}, {t:'frigate', n:3} ],
  [ {t:'boss',   n:1} ],
];
const TOTAL_WAVES = WAVES.length - 1;

// ──────────────────────────────────────────────────────────────────
//  TEXTURE GENERATOR (Procedural HD Graphics like Run Build Pew)
// ──────────────────────────────────────────────────────────────────
function generateGameTextures(scene) {
  // 1. Block Frame (64x64) - Metallic module base
  if (!scene.textures.exists('block_base')) {
    const canvas = scene.textures.createCanvas('block_base', 64, 64);
    const ctx = canvas.context;
    
    // Dark steel border with chamfered corners
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, 64, 64);
    ctx.fillStyle = '#475569';
    ctx.fillRect(2, 2, 60, 60);

    // Inner panel
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(6, 6, 52, 52);
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(10, 10, 44, 44);

    // Corner rivets
    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.arc(6, 6, 3, 0, Math.PI*2);
    ctx.arc(58, 6, 3, 0, Math.PI*2);
    ctx.arc(6, 58, 3, 0, Math.PI*2);
    ctx.arc(58, 58, 3, 0, Math.PI*2);
    ctx.fill();

    // Center grid lines
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1;
    ctx.strokeRect(16, 16, 32, 32);

    canvas.refresh();
  }

  // 2. Shield Hex Field Texture (128x128)
  if (!scene.textures.exists('hex_shield')) {
    const canvas = scene.textures.createCanvas('hex_shield', 128, 128);
    const ctx = canvas.context;
    ctx.clearRect(0,0,128,128);

    // Glowing blue circle with honeycomb grid
    const grad = ctx.createRadialGradient(64,64,20, 64,64,62);
    grad.addColorStop(0, 'rgba(56, 189, 248, 0.1)');
    grad.addColorStop(0.8, 'rgba(56, 189, 248, 0.35)');
    grad.addColorStop(1, 'rgba(56, 189, 248, 0.85)');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(64, 64, 60, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(186, 230, 253, 0.6)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(64, 64, 60, 0, Math.PI * 2);
    ctx.stroke();

    // Hexagon pattern overlay
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
    const r = 12;
    for (let x = 10; x < 120; x += r * 1.5) {
      for (let y = 10; y < 120; y += r * Math.sqrt(3)) {
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const a = (i * Math.PI) / 3;
          const hx = x + r * Math.cos(a);
          const hy = y + r * Math.sin(a);
          if (i === 0) ctx.moveTo(hx, hy);
          else ctx.lineTo(hx, hy);
        }
        ctx.closePath();
        ctx.stroke();
      }
    }

    canvas.refresh();
  }
}

// ──────────────────────────────────────────────────────────────────
//  SCENE: MenuScene
// ──────────────────────────────────────────────────────────────────
class MenuScene extends Phaser.Scene {
  constructor() { super({ key:'MenuScene' }); }

  create() {
    generateGameTextures(this);
    const W = this.scale.width, H = this.scale.height;
    this.cameras.main.setBackgroundColor('#090d16');

    // Starfield background
    for (let i = 0; i < 140; i++) {
      const s = this.add.circle(
        Phaser.Math.Between(0, W), Phaser.Math.Between(0, H),
        Phaser.Math.FloatBetween(0.5, 2.2), 0xffffff,
        Phaser.Math.FloatBetween(0.2, 0.9)
      );
      this.tweens.add({
        targets: s, alpha: Phaser.Math.FloatBetween(0.1, 0.4),
        yoyo: true, repeat: -1, duration: Phaser.Math.Between(800, 2500)
      });
    }

    // Logo / Title
    this.add.text(W/2, H*0.11, 'STELLAR DOMINION', {
      fontFamily: 'Arial Black, Arial, sans-serif', fontSize: '20px', fill: '#38bdf8',
      stroke: '#000', strokeThickness: 5
    }).setOrigin(0.5);

    this.add.text(W/2, H*0.19, 'RUN BUILD PEW!', {
      fontFamily: 'Arial Black, Arial, sans-serif', fontSize: '34px', fill: '#fbbf24',
      stroke: '#000', strokeThickness: 6
    }).setOrigin(0.5);

    this.add.text(W/2, H*0.25, 'Модульный Рогалик-Шутер', {
      fontFamily: 'Arial, sans-serif', fontSize: '14px', fill: '#94a3b8'
    }).setOrigin(0.5);

    // Ship Preview Container
    const shipPrev = this.add.container(W/2, H*0.44);
    this.drawShipPreview(shipPrev);
    this.tweens.add({
      targets: shipPrev, y: H*0.44 - 10, yoyo: true, repeat: -1, duration: 1800, ease: 'Sine.easeInOut'
    });

    // Description text
    const descLines = [
      '🚀 Управляйте Крейсером и отбивайтесь от Охотников',
      '🔨 Присоединяйте случайные детали после каждой волны',
      '💥 Пробейтесь сквозь 5 волн и победите Босса!',
    ];
    descLines.forEach((line, i) => {
      this.add.text(W/2, H*0.62 + i*24, line, {
        fontFamily: 'Arial, sans-serif', fontSize: '13px', fill: '#cbd5e1',
        stroke: '#000', strokeThickness: 3
      }).setOrigin(0.5);
    });

    // Start Raid Button
    const btnBorder = this.add.rectangle(W/2, H*0.82, 234, 58, 0x38bdf8).setDepth(0);
    const btnBg = this.add.rectangle(W/2, H*0.82, 228, 52, 0x0284c7).setDepth(1).setInteractive();
    this.add.text(W/2, H*0.82, '⚔️ НАЧАТЬ РЕЙД', {
      fontFamily: 'Arial Black, Arial, sans-serif', fontSize: '18px', fill: '#ffffff',
      stroke: '#000', strokeThickness: 4
    }).setOrigin(0.5).setDepth(2);

    btnBg.on('pointerover', () => btnBg.setFillStyle(0x0369a1));
    btnBg.on('pointerout',  () => btnBg.setFillStyle(0x0284c7));
    btnBg.on('pointerdown', () => {
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.time.delayedCall(300, () => this.scene.start('GameScene'));
    });
  }

  drawShipPreview(container) {
    // Render 3x3 Modular Ship Block
    const G = 32;
    const grid = [
      {x:0, y:0, type:'core'},
      {x:-1, y:0, type:'cannon'},
      {x:1, y:0, type:'engine'},
      {x:0, y:-1, type:'laser'},
      {x:0, y:1, type:'shield'},
    ];

    grid.forEach(b => {
      const px = b.x * G, py = b.y * G;
      const img = this.add.image(px, py, 'block_base').setDisplaySize(30, 30);
      container.add(img);

      const g = this.add.graphics();
      if (b.type === 'core') {
        g.fillStyle(0x3b82f6); g.fillCircle(px, py, 8);
        g.fillStyle(0xbae6fd); g.fillCircle(px, py, 4);
      } else if (b.type === 'cannon') {
        g.fillStyle(0xf59e0b); g.fillRect(px-8, py-8, 16, 16);
        g.fillStyle(0x000000); g.fillRect(px-12, py-3, 8, 6);
      } else if (b.type === 'engine') {
        g.fillStyle(0xa855f7); g.fillRect(px-8, py-8, 16, 16);
        g.fillStyle(0x38bdf8); g.fillTriangle(px+8, py-6, px+8, py+6, px+18, py);
      } else if (b.type === 'laser') {
        g.fillStyle(0xec4899); g.fillCircle(px, py, 7);
        g.fillStyle(0xffffff); g.fillCircle(px, py, 3);
      } else if (b.type === 'shield') {
        g.fillStyle(0x3b82f6); g.fillRect(px-7, py-7, 14, 14);
      }
      container.add(g);
    });

    // Hex shield overlay preview
    const sh = this.add.image(0, 0, 'hex_shield').setDisplaySize(110, 110).setAlpha(0.6);
    container.add(sh);
  }
}

// ──────────────────────────────────────────────────────────────────
//  SCENE: GameScene (Core Roguelite Gameplay)
// ──────────────────────────────────────────────────────────────────
class GameScene extends Phaser.Scene {
  constructor() { super({ key:'GameScene' }); }

  create() {
    generateGameTextures(this);
    const W = this.W = this.scale.width;
    const H = this.H = this.scale.height;

    this.cameras.main.setBackgroundColor('#090d16');
    this.cameras.main.fadeIn(300);

    // State
    this.phase      = 'playing';
    this.waveIndex  = 0;
    this.enemyQueue = 0;
    this.shipHp     = 100;
    this.shipMaxHp  = 100;
    this.shieldHits = 0;
    this.speedMul   = 1.0;
    this.cannons    = 1;
    this.hasLaser   = false;
    this.hasSpread  = false;
    this.hasDrone   = false;
    this.hasCrySyn  = false;
    this.hasCargo   = false;

    this.loot           = { metal: 0, crystal: 0 };
    this.installedParts = [];

    // Entities
    this.enemies   = [];
    this.pBullets  = [];
    this.eBullets  = [];
    this.lootItems = [];
    this.laserFx   = [];

    // Timers
    this.shootTimer = 0;
    this.laserTimer = 0;
    this.droneTimer = 0;

    // Display Layers
    this.layerBg      = this.add.layer().setDepth(0);
    this.layerLoot    = this.add.layer().setDepth(2);
    this.layerEnemies = this.add.layer().setDepth(3);
    this.layerBullets = this.add.layer().setDepth(4);
    this.layerShip    = this.add.layer().setDepth(5);
    this.layerFx      = this.add.layer().setDepth(8);
    this.layerHud     = this.add.layer().setDepth(10);

    // Starfield
    this.stars = [];
    for (let i = 0; i < 150; i++) {
      const r = Phaser.Math.FloatBetween(0.4, 2.2);
      const s = this.add.circle(
        Phaser.Math.Between(0, W), Phaser.Math.Between(0, H),
        r, 0xffffff, Phaser.Math.FloatBetween(0.15, 0.85)
      );
      s.vy = r * 0.4;
      this.layerBg.add(s);
      this.stars.push(s);
    }

    // Player Ship Container
    this.shipX = W / 2;
    this.shipY = H * 0.72;
    this.shipContainer = this.add.container(this.shipX, this.shipY);
    this.layerShip.add(this.shipContainer);

    // Shield Sprite Overlay
    this.shieldSprite = this.add.image(0, 0, 'hex_shield').setDisplaySize(110, 110).setAlpha(0);
    this.shipContainer.add(this.shieldSprite);

    this.buildShipGraphics();
    this.buildHud();
    this.buildRadarUI();

    // Input Controls
    this.joyActive = false;
    this.joyBase   = new Phaser.Math.Vector2();
    this.joyDir    = new Phaser.Math.Vector2();
    this.buildJoystick();

    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = {
      W: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      S: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      A: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      D: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };

    this.time.delayedCall(700, () => this.startWave());
  }

  buildShipGraphics() {
    const shield = this.shieldSprite;
    this.shipContainer.removeAll(false);
    this.shipContainer.add(shield);

    const G = 30;
    const SLOTS = [
      {x:0,y:0},   // Core
      {x:-1,y:0},  // Left
      {x:1,y:0},   // Right
      {x:0,y:-1},  // Top
      {x:-2,y:0},  // Far Left
      {x:2,y:0},   // Far Right
      {x:0,y:-2},  // Far Top
      {x:-1,y:-1}, // Top-Left
      {x:1,y:-1},  // Top-Right
      {x:-1,y:1},  // Bottom-Left
      {x:1,y:1},   // Bottom-Right
      {x:0,y:1},   // Bottom
    ];

    // Engine Thrust Glow
    const engGlow = this.add.graphics();
    engGlow.fillStyle(0x38bdf8, 0.7);
    engGlow.fillTriangle(-12, 18, 12, 18, 0, 36);
    this.shipContainer.add(engGlow);
    this.engGlow = engGlow;

    // Core Block Sprite
    const coreBlock = this.add.image(0, 0, 'block_base').setDisplaySize(28, 28);
    const coreGfx   = this.add.graphics();
    coreGfx.fillStyle(0x2563eb); coreGfx.fillCircle(0, 0, 8);
    coreGfx.fillStyle(0x93c5fd); coreGfx.fillCircle(0, 0, 4);
    this.shipContainer.add([coreBlock, coreGfx]);

    // Installed Parts Render
    this.installedParts.forEach((partId, i) => {
      const slot = SLOTS[i+1];
      if (!slot) return;
      const px = slot.x * G, py = slot.y * G;
      const pdef = PARTS.find(p => p.id === partId);
      if (!pdef) return;

      const blk = this.add.image(px, py, 'block_base').setDisplaySize(28, 28);
      const gfx = this.add.graphics();

      if (partId === 'cannon') {
        gfx.fillStyle(0xf59e0b); gfx.fillRect(px-7, py-7, 14, 14);
        gfx.fillStyle(0x000000); gfx.fillRect(px-3, py-12, 6, 8);
      } else if (partId === 'laser') {
        gfx.fillStyle(0xec4899); gfx.fillCircle(px, py, 7);
        gfx.fillStyle(0xffffff); gfx.fillCircle(px, py, 3);
      } else if (partId === 'shield') {
        gfx.fillStyle(0x3b82f6); gfx.fillRect(px-7, py-7, 14, 14);
        gfx.fillStyle(0xbfdbfe); gfx.fillCircle(px, py, 4);
      } else if (partId === 'engine') {
        gfx.fillStyle(0xa855f7); gfx.fillRect(px-7, py-7, 14, 14);
        gfx.fillStyle(0x38bdf8); gfx.fillTriangle(px-5, py+7, px+5, py+7, px, py+14);
      } else {
        gfx.fillStyle(pdef.col); gfx.fillCircle(px, py, 6);
      }

      this.shipContainer.add([blk, gfx]);
    });
  }

  buildHud() {
    const W = this.W, H = this.H;
    const S = { fontFamily: 'Arial, sans-serif', fontSize: '13px', fill: '#e2e8f0', stroke: '#000', strokeThickness: 3 };
    const SB = { fontFamily: 'Arial Black, Arial, sans-serif', fontSize: '15px', fill: '#38bdf8', stroke: '#000', strokeThickness: 4 };

    // HP Bar
    this.hpBarBg = this.add.rectangle(W/2, H-16, W*0.55, 10, 0x1e293b).setOrigin(0.5);
    this.hpBar   = this.add.rectangle(W/2 - W*0.275, H-16, W*0.55, 8, 0x22c55e).setOrigin(0, 0.5);
    this.layerHud.add([this.hpBarBg, this.hpBar]);

    this.hudWave   = this.add.text(W/2, 12, '', SB).setOrigin(0.5, 0);
    this.hudLoot   = this.add.text(12, 12, '', S);
    this.hudShield = this.add.text(W-12, 12, '', {...S, fill: '#818cf8'}).setOrigin(1, 0);
    this.hudParts  = this.add.text(12, H-34, '', {...S, fontSize: '11px', fill: '#94a3b8'});

    this.layerHud.add([this.hudWave, this.hudLoot, this.hudShield, this.hudParts]);

    // Screen Notification Message
    this.hudMsg = this.add.text(W/2, H*0.42, '', {
      fontFamily: 'Arial Black, Arial, sans-serif', fontSize: '22px', fill: '#fbbf24',
      stroke: '#000', strokeThickness: 5, align: 'center'
    }).setOrigin(0.5).setAlpha(0);

    this.layerHud.add(this.hudMsg);
    this.updateHud();
  }

  buildRadarUI() {
    const W = this.W, H = this.H;
    const RW = 80, RH = 80;
    const RX = W - RW/2 - 10, RY = H - RH/2 - 10;

    // Mini-Radar Box (bottom right like in screenshot 3)
    this.radarBg = this.add.rectangle(RX, RY, RW, RH, 0x0f172a, 0.75).setStrokeStyle(1, 0x334155);
    this.radarGfx = this.add.graphics();
    this.layerHud.add([this.radarBg, this.radarGfx]);
  }

  updateRadarUI() {
    this.radarGfx.clear();
    const W = this.W, H = this.H;
    const RW = 80, RH = 80;
    const RX = W - RW/2 - 10, RY = H - RH/2 - 10;

    // Player Green Dot
    const px = RX + ((this.shipX / W) - 0.5) * (RW - 10);
    const py = RY + ((this.shipY / H) - 0.5) * (RH - 10);
    this.radarGfx.fillStyle(0x22c55e);
    this.radarGfx.fillCircle(px, py, 3);

    // Enemy Red Dots
    this.radarGfx.fillStyle(0xef4444);
    this.enemies.forEach(e => {
      if (!e.alive) return;
      const ex = RX + ((e.x / W) - 0.5) * (RW - 10);
      const ey = RY + ((e.y / H) - 0.5) * (RH - 10);
      this.radarGfx.fillCircle(ex, ey, e.type === 'boss' ? 5 : 2);
    });
  }

  updateHud() {
    const waveNum = Math.min(this.waveIndex + 1, TOTAL_WAVES);
    const isBoss  = this.waveIndex === WAVES.length - 1;

    this.hudWave.setText(
      isBoss ? '☠️ БОЙ С БОССОМ!' :
      (this.phase === 'playing' && this.enemies.length > 0)
        ? `Волна ${waveNum}/${TOTAL_WAVES}  •  Врагов: ${this.enemies.length}`
        : `Волна ${waveNum}/${TOTAL_WAVES}`
    );

    this.hudLoot.setText(`⛏️ ${this.loot.metal}   💎 ${this.loot.crystal}`);
    this.hudShield.setText(this.shieldHits > 0 ? `💠 Щит: ${this.shieldHits}` : '');
    this.hudParts.setText(
      this.installedParts.length > 0
        ? 'Модули: ' + this.installedParts.map(id => PARTS.find(p=>p.id===id)?.icon||'?').join(' ')
        : ''
    );

    // Shield Sprite update
    if (this.shieldHits > 0) {
      this.shieldSprite.setAlpha(0.75);
    } else {
      this.shieldSprite.setAlpha(0);
    }

    // Health Bar Color
    const ratio = Math.max(0, this.shipHp / this.shipMaxHp);
    this.hpBar.width = (this.W * 0.55 - 2) * ratio;
    this.hpBar.x = this.W/2 - this.W*0.275 + 1;
    this.hpBar.setFillStyle(ratio > 0.5 ? 0x22c55e : ratio > 0.25 ? 0xeab308 : 0xef4444);
  }

  flashMsg(text, dur = 1800) {
    this.hudMsg.setText(text).setAlpha(1);
    this.tweens.killTweensOf(this.hudMsg);
    this.tweens.add({ targets: this.hudMsg, alpha: 0, delay: dur - 400, duration: 400 });
  }

  buildJoystick() {
    this.joyRing  = this.add.graphics().setDepth(20).setAlpha(0);
    this.joyThumb = this.add.graphics().setDepth(21).setAlpha(0);
    this.layerHud.add([this.joyRing, this.joyThumb]);

    this.input.on('pointerdown', (p) => {
      if (this.phase !== 'playing') return;
      if (p.x < this.W * 0.65) {
        this.joyActive = true;
        this.joyBase.set(p.x, p.y);
        this.joyDir.set(0, 0);
        this.renderJoy(p.x, p.y, p.x, p.y);
      }
    });

    this.input.on('pointermove', (p) => {
      if (!this.joyActive) return;
      const dx = p.x - this.joyBase.x, dy = p.y - this.joyBase.y;
      const len = Math.sqrt(dx*dx + dy*dy), MAX = 55;
      if (len > 0.1) {
        const c = Math.min(len, MAX) / MAX;
        this.joyDir.set((dx/len)*c, (dy/len)*c);
      }
      this.renderJoy(this.joyBase.x, this.joyBase.y, this.joyBase.x + this.joyDir.x*42, this.joyBase.y + this.joyDir.y*42);
    });

    this.input.on('pointerup', () => {
      this.joyActive = false;
      this.joyDir.set(0, 0);
      this.joyRing.setAlpha(0);
      this.joyThumb.setAlpha(0);
    });
  }

  renderJoy(bx, by, tx, ty) {
    this.joyRing.setAlpha(0.4).clear().lineStyle(2, 0x94a3b8).strokeCircle(bx, by, 55).fillStyle(0x94a3b8, 0.15).fillCircle(bx, by, 55);
    this.joyThumb.setAlpha(0.85).clear().fillStyle(0x38bdf8).fillCircle(tx, ty, 23);
  }

  startWave() {
    if (this.waveIndex >= WAVES.length) { this.endVictory(); return; }
    const waveData = WAVES[this.waveIndex];
    const isBoss   = this.waveIndex === WAVES.length - 1;

    this.flashMsg(isBoss ? '☠️ БОСС-ОХОТНИК НА ПОДХОДЕ!
Приготовьтесь к бою!' : `🌊 Волна ${this.waveIndex+1}!`, 2200);

    let delay = 600, total = 0;
    waveData.forEach(group => {
      for (let i = 0; i < group.n; i++) {
        this.time.delayedCall(delay + i*320, () => this.spawnEnemy(group.t));
        total++;
      }
      delay += group.n * 320 + 500;
    });
    this.enemyQueue = total;
  }

  spawnEnemy(type) {
    const def = ENEMY_DEF[type], W = this.W, H = this.H;
    let x, y;
    const edge = Phaser.Math.Between(0, 3);
    if (edge === 0)      { x = Phaser.Math.Between(50, W-50); y = -50; }
    else if (edge === 1) { x = Phaser.Math.Between(50, W-50); y = H+50; }
    else if (edge === 2) { x = -50; y = Phaser.Math.Between(50, H-50); }
    else                 { x = W+50; y = Phaser.Math.Between(50, H-50); }

    const g = this.add.graphics();
    this.drawEnemyGfx(g, type, def, 0);
    this.layerEnemies.add(g);

    const hpBg  = this.add.rectangle(0, -def.sz-10, def.sz*2.8, 6, 0x0f172a).setOrigin(0.5);
    const hpBar = this.add.rectangle(-def.sz*1.4+1, -def.sz-10, def.sz*2.8-2, 4, 0xef4444).setOrigin(0, 0.5);
    this.layerEnemies.add([hpBg, hpBar]);

    this.enemies.push({
      type, def, g, hpBg, hpBar, x, y,
      hp: def.hp, maxHp: def.hp,
      shootCd: Phaser.Math.Between(1800, 3600),
      alive: true, animT: 0
    });
  }

  drawEnemyGfx(g, type, def, animT) {
    g.clear();
    const sz = def.sz, bob = Math.sin(animT * 0.005) * 3;

    if (type === 'boss') {
      g.fillStyle(0x7f1d1d); g.fillRoundedRect(-sz, -sz+bob, sz*2, sz*2, 8);
      g.fillStyle(0xd97706); g.fillRect(-sz+6, -sz+6+bob, sz*2-12, sz*2-12);
      g.fillStyle(0xffffff); g.fillCircle(0, bob, sz*0.4);
      g.fillStyle(0xef4444); g.fillCircle(0, bob, sz*0.22);
      g.fillStyle(0xd97706);
      g.fillTriangle(-sz+4, -sz+bob, -sz-10, -sz-16+bob, -sz+14, -sz+bob);
      g.fillTriangle(sz-4, -sz+bob, sz+10, -sz-16+bob, sz-14, -sz+bob);
    } else if (type === 'heavy') {
      g.fillStyle(0x991b1b); g.fillRoundedRect(-sz, -sz+bob, sz*2, sz*2, 6);
      g.fillStyle(0xf8fafc); g.fillRect(-sz+5, -sz+5+bob, sz*2-10, sz*2-10);
      g.fillStyle(0xef4444); g.fillCircle(0, bob, sz*0.35);
    } else if (type === 'frigate') {
      g.fillStyle(0x991b1b); g.fillTriangle(0, -sz-4+bob, sz+4, sz+bob, -sz-4, sz+bob);
      g.fillStyle(0xffffff); g.fillTriangle(0, -sz+6+bob, sz-4, sz-4+bob, -sz+4, sz-4+bob);
      g.fillStyle(0xef4444); g.fillCircle(0, sz*0.2+bob, sz*0.25);
    } else {
      g.fillStyle(0xd97706); g.fillCircle(0, bob, sz);
      g.fillStyle(0xffffff); g.fillCircle(0, bob, sz*0.65);
      g.fillStyle(0xef4444); g.fillCircle(0, bob, sz*0.35);
    }
  }

  update(time, delta) {
    const dt = delta / 1000, W = this.W, H = this.H;

    this.stars.forEach(s => {
      s.y += s.vy;
      if (s.y > H + 5) { s.y = -5; s.x = Phaser.Math.Between(0, W); }
    });

    if (this.engGlow) this.engGlow.setAlpha(0.5 + Math.sin(time/150)*0.35);

    if (this.phase !== 'playing') return;

    const SPEED = 210 * this.speedMul;
    let vx = 0, vy = 0;
    if (this.joyActive) {
      vx = this.joyDir.x * SPEED; vy = this.joyDir.y * SPEED;
    } else {
      if (this.cursors.left.isDown  || this.wasd.A.isDown) vx = -SPEED;
      if (this.cursors.right.isDown || this.wasd.D.isDown) vx =  SPEED;
      if (this.cursors.up.isDown    || this.wasd.W.isDown) vy = -SPEED;
      if (this.cursors.down.isDown  || this.wasd.S.isDown) vy =  SPEED;
    }

    this.shipX = Phaser.Math.Clamp(this.shipX + vx*dt, 28, W-28);
    this.shipY = Phaser.Math.Clamp(this.shipY + vy*dt, 28, H-28);
    this.shipContainer.setPosition(this.shipX, this.shipY);

    this.shootTimer -= delta;
    if (this.shootTimer <= 0 && this.enemies.length > 0) {
      this.shootTimer = Math.round(600 / this.cannons);
      this.doShoot();
    }

    if (this.hasLaser) {
      this.laserTimer -= delta;
      if (this.laserTimer <= 0 && this.enemies.length > 0) {
        this.laserTimer = 1800;
        this.doBouncingLaser();
      }
    }

    if (this.hasDrone) {
      this.droneTimer -= delta;
      if (this.droneTimer <= 0) {
        this.droneTimer = 2000;
        this.droneSweep();
      }
    }

    this.enemies = this.enemies.filter(e => e.alive);
    this.enemies.forEach(e => {
      e.animT += delta;
      this.drawEnemyGfx(e.g, e.type, e.def, e.animT);

      const dx = this.shipX - e.x, dy = this.shipY - e.y, dist = Math.hypot(dx, dy);
      if (dist > 4) {
        e.x += (dx/dist) * e.def.spd * dt;
        e.y += (dy/dist) * e.def.spd * dt;
      }

      e.g.setPosition(e.x, e.y);
      e.hpBg.setPosition(e.x, e.y);
      e.hpBar.x = e.x - e.def.sz*1.4 + 1; e.hpBar.y = e.y;
      e.hpBar.width = Math.max(0, (e.hp / e.maxHp) * (e.def.sz*2.8 - 2));

      e.shootCd -= delta;
      if (e.shootCd <= 0) {
        e.shootCd = e.type === 'boss' ? 1100 : Phaser.Math.Between(2200, 3800);
        this.enemyShoot(e);
      }

      if (dist < e.def.sz + 22) this.takeDamage(e.type === 'boss' ? 16 : 9);
    });

    this.pBullets = this.pBullets.filter(b => {
      if (!b.active) return false;
      b.g.x += b.vx * dt; b.g.y += b.vy * dt; b.life -= delta;
      if (b.life < 0 || b.g.x < -20 || b.g.x > W+20 || b.g.y < -20 || b.g.y > H+20) {
        b.g.destroy(); return false;
      }
      let hit = false;
      this.enemies.forEach(e => {
        if (!e.alive || hit) return;
        if (Math.hypot(b.g.x - e.x, b.g.y - e.y) < e.def.sz + 6) {
          e.hp -= b.dmg; if (e.hp <= 0) this.killEnemy(e);
          hit = true; b.g.destroy();
        }
      });
      if (hit) { b.active = false; return false; }
      return true;
    });

    this.eBullets = this.eBullets.filter(b => {
      if (!b.active) return false;
      b.g.x += b.vx * dt; b.g.y += b.vy * dt; b.life -= delta;
      if (b.life < 0) { b.g.destroy(); return false; }
      if (Math.hypot(b.g.x - this.shipX, b.g.y - this.shipY) < 24) {
        this.takeDamage(b.dmg); b.g.destroy(); b.active = false; return false;
      }
      return true;
    });

    this.lootItems = this.lootItems.filter(l => {
      if (!l.active) return false;
      if (Math.hypot(l.g.x - this.shipX, l.g.y - this.shipY) < 60) {
        this.loot.metal   += l.m;
        this.loot.crystal += l.c;
        l.g.destroy(); l.active = false; return false;
      }
      return true;
    });

    this.updateHud();
    this.updateRadarUI();
  }

  doShoot() {
    const target = this.getNearestEnemy();
    if (!target) return;
    const dx = target.x - this.shipX, dy = target.y - this.shipY;
    const SPD = 540;

    for (let i = 0; i < this.cannons; i++) {
      const spread = (i - (this.cannons-1)/2) * 0.16;
      const angle  = Math.atan2(dy, dx) + spread;
      const g = this.add.circle(this.shipX, this.shipY, 5, 0xfde68a);
      this.layerBullets.add(g);
      this.pBullets.push({ g, vx: Math.cos(angle)*SPD, vy: Math.sin(angle)*SPD, dmg: 24, life: 1500, active: true });
    }

    if (this.hasSpread) {
      const ba = Math.atan2(dy, dx);
      for (const a of [-0.36, 0.36]) {
        const g = this.add.circle(this.shipX, this.shipY, 4, 0xfbbf24);
        this.layerBullets.add(g);
        this.pBullets.push({ g, vx: Math.cos(ba+a)*460, vy: Math.sin(ba+a)*460, dmg: 15, life: 1300, active: true });
      }
    }
  }

  doBouncingLaser() {
    const sorted = [...this.enemies].filter(e => e.alive).sort((a,b) =>
      Math.hypot(a.x-this.shipX, a.y-this.shipY) - Math.hypot(b.x-this.shipX, b.y-this.shipY)
    );
    if (sorted.length === 0) return;

    const targets = sorted.slice(0, 4);
    const pts = [{x: this.shipX, y: this.shipY}, ...targets.map(e => ({x: e.x, y: e.y}))];

    const g = this.add.graphics();
    g.lineStyle(6, 0xf472b6, 0.95);
    for (let i = 0; i < pts.length - 1; i++) {
      g.lineBetween(pts[i].x, pts[i].y, pts[i+1].x, pts[i+1].y);
    }
    g.lineStyle(2, 0xffffff, 1);
    for (let i = 0; i < pts.length - 1; i++) {
      g.lineBetween(pts[i].x, pts[i].y, pts[i+1].x, pts[i+1].y);
    }
    this.layerFx.add(g);
    this.tweens.add({ targets: g, alpha: 0, duration: 320, onComplete: () => g.destroy() });

    targets.forEach(e => {
      e.hp -= 65;
      if (e.hp <= 0) this.killEnemy(e);
    });
  }

  droneSweep() {
    this.lootItems.forEach(l => {
      if (!l.active) return;
      this.loot.metal   += l.m;
      this.loot.crystal += l.c;
      this.tweens.add({ targets: l.g, x: this.shipX, y: this.shipY, duration: 320, onComplete: () => l.g.destroy() });
      l.active = false;
    });
    this.lootItems = [];
    this.updateHud();
  }

  getNearestEnemy() {
    if (!this.enemies.length) return null;
    return this.enemies.filter(e => e.alive).reduce((best, e) => {
      const d  = Math.hypot(e.x - this.shipX, e.y - this.shipY);
      const db = best ? Math.hypot(best.x - this.shipX, best.y - this.shipY) : Infinity;
      return d < db ? e : best;
    }, null);
  }

  enemyShoot(enemy) {
    const dx = this.shipX - enemy.x, dy = this.shipY - enemy.y;
    const SPD = 240, shots = enemy.type === 'boss' ? 3 : 1;
    for (let i = 0; i < shots; i++) {
      const spread = (i - (shots-1)/2) * 0.26;
      const angle  = Math.atan2(dy, dx) + spread;
      const g = this.add.circle(enemy.x, enemy.y, 5, 0xfca5a5);
      this.layerBullets.add(g);
      this.eBullets.push({ g, vx: Math.cos(angle)*SPD, vy: Math.sin(angle)*SPD, dmg: enemy.type==='boss'?20:12, life: 2500, active: true });
    }
  }

  takeDamage(dmg) {
    if (this.shieldHits > 0) {
      this.shieldHits = Math.max(0, this.shieldHits - 1);
      const sh = this.add.image(this.shipX, this.shipY, 'hex_shield').setDisplaySize(140, 140).setDepth(7);
      this.tweens.add({ targets: sh, scaleX: 1.3, scaleY: 1.3, alpha: 0, duration: 300, onComplete: () => sh.destroy() });
      this.updateHud();
      return;
    }

    this.shipHp = Math.max(0, this.shipHp - dmg);
    const flash = this.add.rectangle(this.W/2, this.H/2, this.W, this.H, 0xef4444, 0.18).setDepth(9);
    this.tweens.add({ targets: flash, alpha: 0, duration: 220, onComplete: () => flash.destroy() });

    this.updateHud();
    if (this.shipHp <= 0) this.endDefeat();
  }

  killEnemy(e) {
    if (!e.alive) return;
    e.alive = false;
    const boom = this.add.circle(e.x, e.y, e.def.sz, 0xfbbf24, 0.9).setDepth(6);
    this.tweens.add({ targets: boom, scaleX: 2.8, scaleY: 2.8, alpha: 0, duration: 320, onComplete: () => boom.destroy() });
    e.g.destroy(); e.hpBg.destroy(); e.hpBar.destroy();

    const m = e.def.loot.m, c = this.hasCrySyn ? e.def.loot.c * 2 : e.def.loot.c;
    for (let i = 0; i < 3; i++) {
      const gx = e.x + Phaser.Math.Between(-22, 22), gy = e.y + Phaser.Math.Between(-22, 22);
      const isC = (i === 2);
      const lg = this.add.circle(gx, gy, 7, isC ? 0x06b6d4 : 0xf59e0b).setDepth(2);
      this.layerLoot.add(lg);
      this.lootItems.push({ g: lg, m: isC ? 0 : Math.ceil(m/2), c: isC ? c : 0, active: true });
    }

    this.enemyQueue--;
    this.enemies = this.enemies.filter(e => e.alive);
    if (this.enemyQueue <= 0 && this.enemies.length === 0) this.onWaveComplete();
  }

  onWaveComplete() {
    this.phase = 'partSelect';
    this.waveIndex++;
    this.pBullets.forEach(b => b.g?.destroy());
    this.eBullets.forEach(b => b.g?.destroy());
    this.pBullets = []; this.eBullets = [];

    if (this.waveIndex >= WAVES.length) {
      this.time.delayedCall(600, () => this.endVictory());
    } else {
      this.time.delayedCall(500, () => this.showPartSelect());
    }
  }

  showPartSelect() {
    const W = this.W, H = this.H;
    const pool = [...PARTS].sort(() => Math.random() - 0.5).slice(0, 3);
    const overlay = this.add.rectangle(W/2, H/2, W, H, 0x000000, 0.8).setDepth(60).setInteractive();
    const ui = [overlay];

    const title = this.add.text(W/2, H*0.12, '🛠️ ВЫБЕРИТЕ МОДУЛЬ', {
      fontFamily: 'Arial Black, Arial, sans-serif', fontSize: '22px', fill: '#38bdf8', stroke: '#000', strokeThickness: 5
    }).setOrigin(0.5).setDepth(61);
    ui.push(title);

    const CW = Math.min(W * 0.28, 105), CH = 165, GAP = 12;
    const totalW = pool.length * (CW + GAP) - GAP;
    const startX = W/2 - totalW/2;

    pool.forEach((part, i) => {
      const cx = startX + i*(CW+GAP) + CW/2, cy = H*0.52;
      const border = this.add.rectangle(cx, cy, CW+4, CH+4, part.col, 0.85).setDepth(61);
      const card   = this.add.rectangle(cx, cy, CW, CH, 0x0f172a).setDepth(62).setInteractive();
      const iconBg = this.add.rectangle(cx, cy-52, 40, 40, part.col, 0.9).setDepth(63);
      const iconTxt = this.add.text(cx, cy-52, part.icon, { fontSize: '20px' }).setOrigin(0.5).setDepth(64);
      const nameTxt = this.add.text(cx, cy-18, part.label, {
        fontFamily: 'Arial, sans-serif', fontSize: '11px', fill: '#f1f5f9', fontStyle: 'bold', align: 'center'
      }).setOrigin(0.5).setDepth(63).setWordWrapWidth(CW-8);
      const descTxt = this.add.text(cx, cy+22, part.desc, {
        fontFamily: 'Arial, sans-serif', fontSize: '10px', fill: '#94a3b8', align: 'center'
      }).setOrigin(0.5).setDepth(63).setWordWrapWidth(CW-8);

      ui.push(border, card, iconBg, iconTxt, nameTxt, descTxt);

      card.on('pointerover', () => card.setFillStyle(0x1e293b));
      card.on('pointerout',  () => card.setFillStyle(0x0f172a));
      card.on('pointerdown', () => {
        ui.forEach(o => o.destroy());
        this.applyPart(part.id);
        this.installedParts.push(part.id);
        this.buildShipGraphics();
        this.flashMsg(`✅ ${part.icon} ${part.label} установлена!`, 1600);
        this.phase = 'playing';
        this.time.delayedCall(900, () => this.startWave());
      });
    });
  }

  applyPart(id) {
    if (id === 'cannon')  this.cannons = Math.min(this.cannons + 1, 5);
    if (id === 'laser')   this.hasLaser = true;
    if (id === 'drone')   this.hasDrone = true;
    if (id === 'shield')  this.shieldHits = Math.min(this.shieldHits + 5, 20);
    if (id === 'crystal') this.hasCrySyn = true;
    if (id === 'cargo')   this.hasCargo = true;
    if (id === 'engine')  this.speedMul = Math.min(this.speedMul + 0.5, 2.2);
    if (id === 'spread')  this.hasSpread = true;
    this.updateHud();
  }

  endVictory() {
    this.phase = 'victory'; this.cleanup();
    const finalM = this.hasCargo ? this.loot.metal * 2   : this.loot.metal;
    const finalC = this.hasCargo ? this.loot.crystal * 2 : this.loot.crystal;
    fetch(API_BASE + '/api/minigame_reward', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ telegram_id: TELEGRAM_ID, metal: finalM, crystal: finalC, deuterium: 30 })
    }).catch(() => {});
    this.showEndScreen(true, finalM, finalC, 30);
  }

  endDefeat() {
    if (this.phase === 'defeat') return;
    this.phase = 'defeat'; this.cleanup();
    const finalM = Math.round(this.loot.metal * 0.5);
    const finalC = Math.round(this.loot.crystal * 0.5);
    fetch(API_BASE + '/api/minigame_reward', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ telegram_id: TELEGRAM_ID, metal: finalM, crystal: finalC, deuterium: 8 })
    }).catch(() => {});
    this.showEndScreen(false, finalM, finalC, 8);
  }

  cleanup() {
    this.pBullets.forEach(b => b.g?.destroy()); this.pBullets = [];
    this.eBullets.forEach(b => b.g?.destroy()); this.eBullets = [];
    this.enemies.forEach(e => { e.g?.destroy(); e.hpBg?.destroy(); e.hpBar?.destroy(); });
    this.enemies = [];
  }

  showEndScreen(victory, metal, crystal, deut) {
    const W = this.W, H = this.H;
    this.add.rectangle(W/2, H/2, W, H, 0x000000, 0.85).setDepth(80);

    this.add.text(W/2, H*0.14, victory ? '🏆 РЕЙД ЗАВЕРШЁН!' : '💀 КРЕЙСЕР УНИЧТОЖЕН', {
      fontFamily: 'Arial Black, Arial, sans-serif', fontSize: '24px', fill: victory ? '#fbbf24' : '#ef4444',
      stroke: '#000', strokeThickness: 6
    }).setOrigin(0.5).setDepth(81);

    this.add.text(W/2, H*0.25, victory
      ? 'Командор-Охотник повержен!
Ресурсы успешно отправлены в Колонию!'
      : 'Отступаем! Часть ресурсов удалось спасти.', {
      fontFamily: 'Arial, sans-serif', fontSize: '13px', fill: '#cbd5e1', align: 'center'
    }).setOrigin(0.5).setDepth(81);

    this.add.rectangle(W/2, H*0.36, W*0.7, 1, 0x334155).setDepth(81);
    this.add.text(W/2, H*0.41, 'Добыча рейда:', { fontFamily: 'Arial, sans-serif', fontSize: '14px', fill: '#64748b' }).setOrigin(0.5).setDepth(81);

    [ ['Металл', metal, '#fbbf24'], ['Кристаллы', crystal, '#38bdf8'], ['Дейтерий', deut, '#4ade80'] ]
    .forEach(([label, val, col], i) => {
      this.add.text(W/2 - 75, H*0.48 + i*32, label, { fontFamily: 'Arial, sans-serif', fontSize: '15px', fill: '#e2e8f0' }).setDepth(81);
      this.add.text(W/2 + 75, H*0.48 + i*32, '+' + val, { fontFamily: 'Arial Black, Arial, sans-serif', fontSize: '15px', fill: col }).setOrigin(1, 0).setDepth(81);
    });

    if (this.installedParts.length > 0) {
      this.add.text(W/2, H*0.68, 'Модули: ' + this.installedParts.map(id => PARTS.find(p=>p.id===id)?.icon||'').join(' '), {
        fontFamily: 'Arial, sans-serif', fontSize: '13px', fill: '#475569'
      }).setOrigin(0.5).setDepth(81);
    }

    this.add.rectangle(W/2, H*0.73, W*0.7, 1, 0x334155).setDepth(81);

    const retryBg = this.add.rectangle(W/2, H*0.79, 190, 46, 0x0284c7).setDepth(82).setInteractive();
    this.add.text(W/2, H*0.79, '🔄 Снова в Рейд', { fontFamily: 'Arial Black, Arial, sans-serif', fontSize: '14px', fill: '#fff' }).setOrigin(0.5).setDepth(83);
    retryBg.on('pointerdown', () => { this.cameras.main.fadeOut(250, 0, 0, 0); this.time.delayedCall(250, () => this.scene.restart()); });

    const closeBg = this.add.rectangle(W/2, H*0.86, 190, 38, 0x1e293b).setDepth(82).setInteractive();
    this.add.text(W/2, H*0.86, '← Закрыть Mini App', { fontFamily: 'Arial, sans-serif', fontSize: '13px', fill: '#64748b' }).setOrigin(0.5).setDepth(83);
    closeBg.on('pointerdown', () => { if (tg) tg.close(); });
  }
}

// ──────────────────────────────────────────────────────────────────
new Phaser.Game({
  type: Phaser.AUTO,
  width: window.innerWidth,
  height: window.innerHeight,
  backgroundColor: '#090d16',
  scene: [MenuScene, GameScene],
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  input: { touch: true },
});
