// ------------------------------------------------------------------
//  STELLAR DOMINION: ???? — Roguelite Space Shooter v6.0
//  ???????: Run Build Pew — ?????? ???????, ?????? ?????, ?????? ????????
// ------------------------------------------------------------------

const tg = window.Telegram?.WebApp;
if (tg) { tg.expand(); tg.ready(); tg.disableVerticalSwipes?.(); }

const URL_PARAMS = new URLSearchParams(window.location.search);
const TELEGRAM_ID = parseInt(
  URL_PARAMS.get('telegram_id') ||
  tg?.initDataUnsafe?.user?.id ||
  123456789
);
const API_BASE = URL_PARAMS.get('api') || '';

// --- PARTS CATALOG -------------------------------------------------
const PARTS = [
  { id:'cannon',  label:'????????? ?????',    icon:'?', desc:'+1 ??????, ??????? ????????',    col:0xf59e0b, rare:false },
  { id:'laser',   label:'???????? ?????????', icon:'??', desc:'??????????? ?? 3 ??????',        col:0xef4444, rare:true  },
  { id:'drone',   label:'??????? ????',       icon:'??', desc:'????-???? ????? ???? ?? ??????', col:0x10b981, rare:false },
  { id:'shield',  label:'????. ???',          icon:'??', desc:'????????? ????????? 5 ??????',   col:0x6366f1, rare:true  },
  { id:'crystal', label:'??????????',         icon:'??', desc:'x2 ????????? ?? ?????? ????????',col:0x38bdf8, rare:false },
  { id:'cargo',   label:'???????? ?????',     icon:'??', desc:'x2 ? ???????? ??????? ?????',   col:0xf97316, rare:true  },
  { id:'engine',  label:'????????? ??????',   icon:'??', desc:'+50% ???????? ???????',          col:0xa855f7, rare:false },
  { id:'spread',  label:'???????-?????',      icon:'??', desc:'3 ??????? ??????',               col:0xfbbf24, rare:false },
];

// --- ENEMY DEFINITIONS ---------------------------------------------
const ENEMY_DEF = {
  drone:   { name:'????-???????',     hp:45,  spd:125, sz:13, col:0xef4444, shcol:0xfca5a5, loot:{m:10, c:5 } },
  frigate: { name:'????????????',     hp:140, spd:72,  sz:20, col:0xf97316, shcol:0xfdba74, loot:{m:25, c:12} },
  heavy:   { name:'??????? ????????', hp:300, spd:42,  sz:28, col:0x7c3aed, shcol:0xa78bfa, loot:{m:50, c:22} },
  boss:    { name:'????????-???????', hp:900, spd:50,  sz:44, col:0xb91c1c, shcol:0xfca5a5, loot:{m:220,c:110} },
};

// --- WAVE DEFINITIONS ----------------------------------------------
const WAVES = [
  [ {t:'drone',  n:5} ],
  [ {t:'drone',  n:4}, {t:'frigate', n:2} ],
  [ {t:'frigate',n:3}, {t:'heavy',   n:2} ],
  [ {t:'heavy',  n:2}, {t:'frigate', n:2} ],
  [ {t:'boss',   n:1} ],
];
const TOTAL_WAVES = WAVES.length - 1;

// ------------------------------------------------------------------
//  SCENE: MenuScene
// ------------------------------------------------------------------
class MenuScene extends Phaser.Scene {
  constructor() { super({ key:'MenuScene' }); }

  create() {
    const W = this.scale.width, H = this.scale.height;
    this.cameras.main.setBackgroundColor('#060918');

    for (let i=0;i<120;i++) {
      const s = this.add.circle(
        Phaser.Math.Between(0,W), Phaser.Math.Between(0,H),
        Phaser.Math.FloatBetween(0.5,2.2), 0xffffff,
        Phaser.Math.FloatBetween(0.2,0.9)
      );
      this.tweens.add({ targets:s, alpha:Phaser.Math.FloatBetween(0.1,0.4), yoyo:true,
        repeat:-1, duration:Phaser.Math.Between(800,2500) });
    }

    this.add.text(W/2, H*0.12, 'STELLAR DOMINION', {
      fontFamily:'Arial Black, Arial', fontSize:'22px', fill:'#38bdf8',
      stroke:'#000', strokeThickness:5
    }).setOrigin(0.5);

    this.add.text(W/2, H*0.21, '????', {
      fontFamily:'Arial Black, Arial', fontSize:'40px', fill:'#fbbf24',
      stroke:'#000', strokeThickness:6
    }).setOrigin(0.5);

    const ship = this.add.graphics().setDepth(10);
    this.drawMenuShip(ship, W/2, H*0.42);
    this.tweens.add({ targets:ship, y:H*0.42-8, yoyo:true, repeat:-1, duration:1800, ease:'Sine.easeInOut' });

    const descLines = [
      '??????????? ?? ???? ?????????',
      '??????? ??????? ?? ????????? ???????',
      '?????????? ?????????-????????!',
    ];
    descLines.forEach((line,i) => {
      this.add.text(W/2, H*0.60 + i*26, line, {
        fontFamily:'Arial', fontSize:'14px', fill:'#cbd5e1',
        stroke:'#000', strokeThickness:3
      }).setOrigin(0.5);
    });

    const btnBorder = this.add.rectangle(W/2, H*0.80, 236, 60, 0x60a5fa).setDepth(0);
    const btnBg = this.add.rectangle(W/2, H*0.80, 230, 56, 0x1d4ed8).setDepth(1).setInteractive();
    this.add.text(W/2, H*0.80, '?????? ????', {
      fontFamily:'Arial Black, Arial', fontSize:'17px', fill:'#ffffff', stroke:'#000', strokeThickness:3
    }).setOrigin(0.5).setDepth(2);

    btnBg.on('pointerover', ()=>btnBg.setFillStyle(0x2563eb));
    btnBg.on('pointerout',  ()=>btnBg.setFillStyle(0x1d4ed8));
    btnBg.on('pointerdown', ()=>{
      this.cameras.main.fadeOut(300, 0,0,0);
      this.time.delayedCall(300, ()=>this.scene.start('GameScene'));
    });

    this.add.text(W/2, H*0.91, '5 ???? ?????? + ????????? ????', {
      fontFamily:'Arial', fontSize:'12px', fill:'#475569'
    }).setOrigin(0.5);
  }

  drawMenuShip(g, cx, cy) {
    g.fillStyle(0x1e40af); g.fillRoundedRect(cx-18,cy-18,36,36,5);
    g.fillStyle(0x60a5fa,0.7); g.fillRoundedRect(cx-12,cy-12,24,24,4);
    g.fillStyle(0xbae6fd); g.fillCircle(cx,cy,6);
    g.fillStyle(0xf59e0b); g.fillRoundedRect(cx-34,cy-10,20,20,3);
    g.fillStyle(0xa855f7); g.fillRoundedRect(cx+14,cy-10,20,20,3);
    g.fillStyle(0x38bdf8,0.8); g.fillTriangle(cx-10,cy+18,cx+10,cy+18,cx,cy+32);
    g.fillStyle(0x38bdf8,0.5); g.fillTriangle(cx-30,cy+8,cx-18,cy+8,cx-24,cy+18);
    g.fillStyle(0x38bdf8,0.5); g.fillTriangle(cx+18,cy+8,cx+30,cy+8,cx+24,cy+18);
  }
}

// ------------------------------------------------------------------
//  SCENE: GameScene
// ------------------------------------------------------------------
class GameScene extends Phaser.Scene {
  constructor() { super({ key:'GameScene' }); }

  create() {
    const W = this.W = this.scale.width;
    const H = this.H = this.scale.height;
    this.cameras.main.setBackgroundColor('#060918');
    this.cameras.main.fadeIn(300);

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
    this.loot       = { metal:0, crystal:0 };
    this.installedParts = [];

    this.enemies   = [];
    this.pBullets  = [];
    this.eBullets  = [];
    this.lootItems = [];

    this.shootTimer = 0;
    this.laserTimer = 0;
    this.droneTimer = 0;

    this.layerBg      = this.add.layer().setDepth(0);
    this.layerLoot    = this.add.layer().setDepth(2);
    this.layerEnemies = this.add.layer().setDepth(3);
    this.layerBullets = this.add.layer().setDepth(4);
    this.layerShip    = this.add.layer().setDepth(5);
    this.layerFx      = this.add.layer().setDepth(8);
    this.layerHud     = this.add.layer().setDepth(10);

    this.stars = [];
    for (let i=0;i<150;i++) {
      const r = Phaser.Math.FloatBetween(0.4,2.2);
      const s = this.add.circle(
        Phaser.Math.Between(0,W), Phaser.Math.Between(0,H),
        r, 0xffffff, Phaser.Math.FloatBetween(0.15,0.85)
      );
      s.vy = r * 0.4;
      this.layerBg.add(s);
      this.stars.push(s);
    }

    this.shipX = W/2;
    this.shipY = H * 0.7;
    this.shipContainer = this.add.container(this.shipX, this.shipY);
    this.layerShip.add(this.shipContainer);
    this.buildShipGraphics();
    this.buildHud();

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
    this.shipContainer.removeAll(true);
    const G = 30;
    const SLOTS = [
      {x:0,y:0},{x:-1,y:0},{x:1,y:0},{x:0,y:-1},
      {x:-2,y:0},{x:2,y:0},{x:0,y:-2},
      {x:-1,y:-1},{x:1,y:-1},{x:-1,y:1},{x:1,y:1},{x:0,y:1},
    ];

    const engGlow = this.add.graphics();
    engGlow.fillStyle(0x38bdf8, 0.6);
    engGlow.fillTriangle(-10,18,10,18,0,34);
    this.shipContainer.add(engGlow);
    this.engGlow = engGlow;

    const core = this.add.graphics();
    core.fillStyle(0x1e3a8a); core.fillRoundedRect(-15,-15,30,30,4);
    core.fillStyle(0x3b82f6,0.6); core.fillRoundedRect(-10,-10,20,20,3);
    core.fillStyle(0xbfdbfe); core.fillCircle(0,0,5);
    this.shipContainer.add(core);

    this.installedParts.forEach((partId, i) => {
      const slot = SLOTS[i+1];
      if (!slot) return;
      const pdef = PARTS.find(p=>p.id===partId);
      if (!pdef) return;
      const pg = this.add.graphics();
      pg.fillStyle(pdef.col, 0.9); pg.fillRoundedRect(slot.x*G-12,slot.y*G-12,24,24,4);
      pg.fillStyle(0xffffff,0.2);  pg.fillRoundedRect(slot.x*G-7, slot.y*G-7, 14,14,3);
      this.shipContainer.add(pg);
    });
  }

  buildHud() {
    const W = this.W, H = this.H;
    const S  = { fontFamily:'Arial,sans-serif', fontSize:'13px', fill:'#e2e8f0', stroke:'#000', strokeThickness:3 };
    const SB = { fontFamily:'Arial,sans-serif', fontSize:'15px', fill:'#38bdf8', fontStyle:'bold', stroke:'#000', strokeThickness:3 };

    this.hpBarBg = this.add.rectangle(W/2, H-16, W*0.6, 10, 0x1e293b).setOrigin(0.5);
    this.hpBar   = this.add.rectangle(W/2-W*0.3, H-16, W*0.6, 8, 0x22c55e).setOrigin(0,0.5);
    this.layerHud.add([this.hpBarBg, this.hpBar]);

    this.hudWave   = this.add.text(W/2, 10, '', SB).setOrigin(0.5,0).setDepth(10);
    this.hudLoot   = this.add.text(10, 10, '', S).setDepth(10);
    this.hudShield = this.add.text(W-10, 10, '', {...S, fill:'#818cf8'}).setOrigin(1,0).setDepth(10);
    this.hudParts  = this.add.text(10, H-32, '', {...S, fontSize:'11px', fill:'#64748b'}).setDepth(10);
    this.layerHud.add([this.hudWave, this.hudLoot, this.hudShield, this.hudParts]);

    this.hudMsg = this.add.text(W/2, H*0.45, '', {
      fontFamily:'Arial Black,Arial', fontSize:'22px', fill:'#fbbf24',
      stroke:'#000', strokeThickness:5, align:'center'
    }).setOrigin(0.5).setDepth(50).setAlpha(0);
    this.layerHud.add(this.hudMsg);

    this.updateHud();
  }

  updateHud() {
    const waveNum = Math.min(this.waveIndex+1, TOTAL_WAVES);
    const isBoss  = this.waveIndex === WAVES.length-1;
    this.hudWave.setText(
      isBoss ? '????????? ????' :
      (this.phase==='playing' && this.enemies.length>0)
        ? '????? ' + waveNum + '/' + TOTAL_WAVES + '  ??????: ' + this.enemies.length
        : '????? ' + waveNum + '/' + TOTAL_WAVES
    );
    this.hudLoot.setText('Metal: ' + this.loot.metal + '  Crystal: ' + this.loot.crystal);
    this.hudShield.setText(this.shieldHits>0 ? 'Shield: ' + this.shieldHits : '');
    this.hudParts.setText(this.installedParts.length>0
      ? 'Parts: ' + this.installedParts.map(id=>PARTS.find(p=>p.id===id)?.icon||'?').join(' ')
      : '');

    const ratio = Math.max(0, this.shipHp / this.shipMaxHp);
    this.hpBar.width = (this.W*0.6-2)*ratio;
    this.hpBar.x = this.W/2 - this.W*0.3 + 1;
    this.hpBar.setFillStyle(ratio>0.5?0x22c55e:ratio>0.25?0xeab308:0xef4444);
  }

  flashMsg(text, dur) {
    dur = dur || 1800;
    this.hudMsg.setText(text).setAlpha(1);
    this.tweens.killTweensOf(this.hudMsg);
    this.tweens.add({ targets:this.hudMsg, alpha:0, delay:dur-400, duration:400 });
  }

  buildJoystick() {
    this.joyRing  = this.add.graphics().setDepth(20).setAlpha(0);
    this.joyThumb = this.add.graphics().setDepth(21).setAlpha(0);
    this.layerHud.add([this.joyRing, this.joyThumb]);

    this.input.on('pointerdown', (p) => {
      if (this.phase !== 'playing') return;
      if (p.x < this.W*0.65) {
        this.joyActive = true;
        this.joyBase.set(p.x, p.y);
        this.joyDir.set(0,0);
        this.renderJoy(p.x,p.y,p.x,p.y);
      }
    });
    this.input.on('pointermove', (p) => {
      if (!this.joyActive) return;
      const dx = p.x-this.joyBase.x, dy = p.y-this.joyBase.y;
      const len = Math.sqrt(dx*dx+dy*dy), MAX=55;
      if (len>0.1) { const c=Math.min(len,MAX)/MAX; this.joyDir.set((dx/len)*c,(dy/len)*c); }
      this.renderJoy(this.joyBase.x,this.joyBase.y,this.joyBase.x+this.joyDir.x*42,this.joyBase.y+this.joyDir.y*42);
    });
    this.input.on('pointerup', () => {
      this.joyActive=false; this.joyDir.set(0,0);
      this.joyRing.setAlpha(0); this.joyThumb.setAlpha(0);
    });
  }

  renderJoy(bx,by,tx,ty) {
    this.joyRing.setAlpha(0.38).clear().lineStyle(2,0x94a3b8).strokeCircle(bx,by,55).fillStyle(0x94a3b8,0.15).fillCircle(bx,by,55);
    this.joyThumb.setAlpha(0.82).clear().fillStyle(0x38bdf8).fillCircle(tx,ty,23);
  }

  startWave() {
    if (this.waveIndex >= WAVES.length) { this.endVictory(); return; }
    const waveData = WAVES[this.waveIndex];
    const isBoss   = this.waveIndex === WAVES.length-1;
    this.flashMsg(isBoss ? '????????-???????!\n????????? ???!' : '????? ' + (this.waveIndex+1) + '!', 2200);

    let delay=600, total=0;
    waveData.forEach(group => {
      for (let i=0;i<group.n;i++) {
        this.time.delayedCall(delay+i*320, ()=>this.spawnEnemy(group.t));
        total++;
      }
      delay += group.n*320+500;
    });
    this.enemyQueue = total;
  }

  spawnEnemy(type) {
    const def=ENEMY_DEF[type], W=this.W, H=this.H;
    let x,y;
    const edge=Phaser.Math.Between(0,3);
    if (edge===0){x=Phaser.Math.Between(50,W-50);y=-50;}
    else if(edge===1){x=Phaser.Math.Between(50,W-50);y=H+50;}
    else if(edge===2){x=-50;y=Phaser.Math.Between(50,H-50);}
    else{x=W+50;y=Phaser.Math.Between(50,H-50);}

    const g=this.add.graphics();
    this.drawEnemyGfx(g,type,def,0);
    this.layerEnemies.add(g);

    const hpBg  = this.add.rectangle(0,-def.sz-8,def.sz*2.8,6,0x0f172a).setOrigin(0.5);
    const hpBar = this.add.rectangle(-def.sz*1.4+1,-def.sz-8,def.sz*2.8-2,4,0xef4444).setOrigin(0,0.5);
    this.layerEnemies.add([hpBg,hpBar]);

    this.enemies.push({type,def,g,hpBg,hpBar,x,y,hp:def.hp,maxHp:def.hp,
      shootCd:Phaser.Math.Between(2000,4000),alive:true,animT:0});
  }

  drawEnemyGfx(g,type,def,animT) {
    g.clear();
    const sz=def.sz, bob=Math.sin(animT*0.004)*3;
    if(type==='boss'){
      g.fillStyle(0x450a0a);g.fillRect(-sz,-sz+bob,sz*2,sz*2);
      g.fillStyle(def.col);g.fillRect(-sz+5,-sz+5+bob,sz*2-10,sz*2-10);
      g.fillStyle(0xff8888);g.fillCircle(0,bob,sz*0.38);
      g.fillStyle(0x991b1b);
      g.fillRect(-sz-8,-6+bob,10,12);g.fillRect(sz-2,-6+bob,10,12);g.fillRect(-6,-sz-8+bob,12,10);
    } else if(type==='heavy'){
      g.fillStyle(0x3b0764);g.fillRect(-sz,-sz+bob,sz*2,sz*2);
      g.fillStyle(def.col);g.fillRoundedRect(-sz+4,-sz+4+bob,sz*2-8,sz*2-8,4);
      g.fillStyle(def.shcol,0.4);g.fillCircle(0,bob,sz*0.45);
    } else if(type==='frigate'){
      g.fillStyle(0x431407);g.fillTriangle(0,-sz+bob,sz,sz+bob,-sz,sz+bob);
      g.fillStyle(def.col);g.fillTriangle(0,-sz+10+bob,sz-6,sz-4+bob,-sz+6,sz-4+bob);
      g.fillStyle(def.shcol,0.5);g.fillCircle(0,sz*0.2+bob,sz*0.28);
    } else {
      g.fillStyle(def.col);
      g.fillTriangle(0,-sz+bob,sz,0+bob,0,sz+bob);
      g.fillTriangle(0,-sz+bob,-sz,0+bob,0,sz+bob);
      g.fillStyle(def.shcol,0.6);g.fillCircle(0,bob,sz*0.35);
    }
  }

  update(time,delta) {
    const dt=delta/1000, W=this.W, H=this.H;

    this.stars.forEach(s=>{
      s.y+=s.vy;
      if(s.y>H+5){s.y=-5;s.x=Phaser.Math.Between(0,W);}
    });

    if(this.engGlow) this.engGlow.setAlpha(0.5+Math.sin(time/160)*0.35);
    if(this.phase!=='playing') return;

    const SPEED=210*this.speedMul;
    let vx=0,vy=0;
    if(this.joyActive){vx=this.joyDir.x*SPEED;vy=this.joyDir.y*SPEED;}
    else{
      if(this.cursors.left.isDown  ||this.wasd.A.isDown) vx=-SPEED;
      if(this.cursors.right.isDown ||this.wasd.D.isDown) vx= SPEED;
      if(this.cursors.up.isDown    ||this.wasd.W.isDown) vy=-SPEED;
      if(this.cursors.down.isDown  ||this.wasd.S.isDown) vy= SPEED;
    }
    this.shipX=Phaser.Math.Clamp(this.shipX+vx*dt,28,W-28);
    this.shipY=Phaser.Math.Clamp(this.shipY+vy*dt,28,H-28);
    this.shipContainer.setPosition(this.shipX,this.shipY);

    this.shootTimer-=delta;
    if(this.shootTimer<=0&&this.enemies.length>0){
      this.shootTimer=Math.round(650/this.cannons);
      this.doShoot();
    }
    if(this.hasLaser){
      this.laserTimer-=delta;
      if(this.laserTimer<=0&&this.enemies.length>0){this.laserTimer=2000;this.doLaser();}
    }
    if(this.hasDrone){
      this.droneTimer-=delta;
      if(this.droneTimer<=0){this.droneTimer=2200;this.droneSweep();}
    }

    this.enemies=this.enemies.filter(e=>e.alive);
    this.enemies.forEach(e=>{
      e.animT+=delta;
      this.drawEnemyGfx(e.g,e.type,e.def,e.animT);
      const dx=this.shipX-e.x,dy=this.shipY-e.y,dist=Math.hypot(dx,dy);
      if(dist>3){e.x+=(dx/dist)*e.def.spd*dt;e.y+=(dy/dist)*e.def.spd*dt;}
      e.g.setPosition(e.x,e.y);
      e.hpBg.setPosition(e.x,e.y);
      e.hpBar.x=e.x-e.def.sz*1.4+1;e.hpBar.y=e.y;
      e.hpBar.width=Math.max(0,(e.hp/e.maxHp)*(e.def.sz*2.8-2));
      e.shootCd-=delta;
      if(e.shootCd<=0){e.shootCd=e.type==='boss'?1200:Phaser.Math.Between(2500,4000);this.enemyShoot(e);}
      if(dist<e.def.sz+20) this.takeDamage(e.type==='boss'?16:9);
    });

    this.pBullets=this.pBullets.filter(b=>{
      if(!b.active)return false;
      b.g.x+=b.vx*dt;b.g.y+=b.vy*dt;b.life-=delta;
      if(b.life<0||b.g.x<-20||b.g.x>W+20||b.g.y<-20||b.g.y>H+20){b.g.destroy();return false;}
      let hit=false;
      this.enemies.forEach(e=>{
        if(!e.alive||hit)return;
        if(Math.hypot(b.g.x-e.x,b.g.y-e.y)<e.def.sz+5){
          e.hp-=b.dmg;if(e.hp<=0)this.killEnemy(e);hit=true;b.g.destroy();
        }
      });
      if(hit){b.active=false;return false;}
      return true;
    });

    this.eBullets=this.eBullets.filter(b=>{
      if(!b.active)return false;
      b.g.x+=b.vx*dt;b.g.y+=b.vy*dt;b.life-=delta;
      if(b.life<0){b.g.destroy();return false;}
      if(Math.hypot(b.g.x-this.shipX,b.g.y-this.shipY)<22){
        this.takeDamage(b.dmg);b.g.destroy();b.active=false;return false;
      }
      return true;
    });

    this.lootItems=this.lootItems.filter(l=>{
      if(!l.active)return false;
      if(Math.hypot(l.g.x-this.shipX,l.g.y-this.shipY)<55){
        this.loot.metal+=l.m;this.loot.crystal+=l.c;
        l.g.destroy();l.active=false;return false;
      }
      return true;
    });

    this.updateHud();
  }

  doShoot() {
    const target=this.getNearestEnemy();
    if(!target)return;
    const dx=target.x-this.shipX,dy=target.y-this.shipY;
    const SPD=500;
    for(let i=0;i<this.cannons;i++){
      const spread=(i-(this.cannons-1)/2)*0.18;
      const angle=Math.atan2(dy,dx)+spread;
      const g=this.add.circle(this.shipX,this.shipY,5,0xfde68a);
      this.layerBullets.add(g);
      this.pBullets.push({g,vx:Math.cos(angle)*SPD,vy:Math.sin(angle)*SPD,dmg:22,life:1600,active:true});
    }
    if(this.hasSpread){
      const ba=Math.atan2(dy,dx);
      for(const a of[-0.38,0.38]){
        const g=this.add.circle(this.shipX,this.shipY,4,0xfbbf24);
        this.layerBullets.add(g);
        this.pBullets.push({g,vx:Math.cos(ba+a)*440,vy:Math.sin(ba+a)*440,dmg:14,life:1300,active:true});
      }
    }
  }

  doLaser() {
    const sorted=[...this.enemies].sort((a,b)=>
      Math.hypot(a.x-this.shipX,a.y-this.shipY)-Math.hypot(b.x-this.shipX,b.y-this.shipY)
    );
    let pierced=0;
    for(const e of sorted){
      if(pierced>=3||!e.alive)break;
      e.hp-=60;if(e.hp<=0)this.killEnemy(e);pierced++;
      const line=this.add.graphics();
      line.lineStyle(4,0xef4444,0.9).lineBetween(this.shipX,this.shipY,e.x,e.y);
      this.layerFx.add(line);
      this.tweens.add({targets:line,alpha:0,duration:280,onComplete:()=>line.destroy()});
    }
  }

  droneSweep() {
    this.lootItems.forEach(l=>{
      if(!l.active)return;
      this.loot.metal+=l.m;this.loot.crystal+=l.c;
      this.tweens.add({targets:l.g,x:this.shipX,y:this.shipY,duration:350,onComplete:()=>l.g.destroy()});
      l.active=false;
    });
    this.lootItems=[];this.updateHud();
  }

  getNearestEnemy() {
    if(!this.enemies.length)return null;
    return this.enemies.filter(e=>e.alive).reduce((best,e)=>{
      const d=Math.hypot(e.x-this.shipX,e.y-this.shipY);
      const db=best?Math.hypot(best.x-this.shipX,best.y-this.shipY):Infinity;
      return d<db?e:best;
    },null);
  }

  enemyShoot(enemy) {
    const dx=this.shipX-enemy.x,dy=this.shipY-enemy.y;
    const SPD=230,shots=enemy.type==='boss'?3:1;
    for(let i=0;i<shots;i++){
      const spread=(i-(shots-1)/2)*0.28;
      const angle=Math.atan2(dy,dx)+spread;
      const g=this.add.circle(enemy.x,enemy.y,5,0xfca5a5);
      this.layerBullets.add(g);
      this.eBullets.push({g,vx:Math.cos(angle)*SPD,vy:Math.sin(angle)*SPD,dmg:enemy.type==='boss'?20:12,life:2500,active:true});
    }
  }

  takeDamage(dmg) {
    if(this.shieldHits>0){
      this.shieldHits=Math.max(0,this.shieldHits-1);
      const sh=this.add.circle(this.shipX,this.shipY,38,0x6366f1,0.55).setDepth(7);
      this.tweens.add({targets:sh,scaleX:1.4,scaleY:1.4,alpha:0,duration:280,onComplete:()=>sh.destroy()});
      this.updateHud();return;
    }
    this.shipHp=Math.max(0,this.shipHp-dmg);
    const flash=this.add.rectangle(this.W/2,this.H/2,this.W,this.H,0xff0000,0.15).setDepth(9);
    this.tweens.add({targets:flash,alpha:0,duration:220,onComplete:()=>flash.destroy()});
    this.updateHud();
    if(this.shipHp<=0)this.endDefeat();
  }

  killEnemy(e) {
    if(!e.alive)return;
    e.alive=false;
    const boom=this.add.circle(e.x,e.y,e.def.sz,0xfbbf24,0.85).setDepth(6);
    this.tweens.add({targets:boom,scaleX:2.8,scaleY:2.8,alpha:0,duration:320,onComplete:()=>boom.destroy()});
    e.g.destroy();e.hpBg.destroy();e.hpBar.destroy();
    const m=e.def.loot.m,c=this.hasCrySyn?e.def.loot.c*2:e.def.loot.c;
    for(let i=0;i<3;i++){
      const gx=e.x+Phaser.Math.Between(-22,22),gy=e.y+Phaser.Math.Between(-22,22);
      const isC=i===2;
      const lg=this.add.circle(gx,gy,7,isC?0x38bdf8:0xd97706).setDepth(2);
      this.layerLoot.add(lg);
      this.lootItems.push({g:lg,m:isC?0:Math.ceil(m/2),c:isC?c:0,active:true});
    }
    this.enemyQueue--;
    this.enemies=this.enemies.filter(e=>e.alive);
    if(this.enemyQueue<=0&&this.enemies.length===0)this.onWaveComplete();
  }

  onWaveComplete() {
    this.phase='partSelect';
    this.waveIndex++;
    this.pBullets.forEach(b=>b.g?.destroy());
    this.eBullets.forEach(b=>b.g?.destroy());
    this.pBullets=[];this.eBullets=[];
    if(this.waveIndex>=WAVES.length){
      this.time.delayedCall(600,()=>this.endVictory());
    } else {
      this.time.delayedCall(500,()=>this.showPartSelect());
    }
  }

  showPartSelect() {
    const W=this.W,H=this.H;
    const pool=[...PARTS].sort(()=>Math.random()-0.5).slice(0,3);
    const overlay=this.add.rectangle(W/2,H/2,W,H,0x000000,0.78).setDepth(60).setInteractive();
    const ui=[overlay];

    const title=this.add.text(W/2,H*0.12,'?????? ??????',{
      fontFamily:'Arial Black,Arial',fontSize:'22px',fill:'#38bdf8',stroke:'#000',strokeThickness:5
    }).setOrigin(0.5).setDepth(61);
    ui.push(title);

    const CW=Math.min(W*0.28,105),CH=160,GAP=12;
    const totalW=pool.length*(CW+GAP)-GAP;
    const startX=W/2-totalW/2;

    pool.forEach((part,i)=>{
      const cx=startX+i*(CW+GAP)+CW/2,cy=H*0.52;
      const border=this.add.rectangle(cx,cy,CW+4,CH+4,part.col,0.8).setDepth(61);
      const card=this.add.rectangle(cx,cy,CW,CH,0x0f172a).setDepth(62).setInteractive();
      const iconBg=this.add.rectangle(cx,cy-50,40,40,part.col,0.9).setDepth(63);
      const iconTxt=this.add.text(cx,cy-50,part.icon,{fontSize:'20px'}).setOrigin(0.5).setDepth(64);
      const nameTxt=this.add.text(cx,cy-18,part.label,{
        fontFamily:'Arial',fontSize:'11px',fill:'#f1f5f9',fontStyle:'bold',align:'center'
      }).setOrigin(0.5).setDepth(63).setWordWrapWidth(CW-8);
      const descTxt=this.add.text(cx,cy+20,part.desc,{
        fontFamily:'Arial',fontSize:'10px',fill:'#94a3b8',align:'center'
      }).setOrigin(0.5).setDepth(63).setWordWrapWidth(CW-8);
      const rareTxt=part.rare?this.add.text(cx,cy+60,'??????',{
        fontFamily:'Arial',fontSize:'11px',fill:'#fbbf24'
      }).setOrigin(0.5).setDepth(63):null;

      ui.push(border,card,iconBg,iconTxt,nameTxt,descTxt);
      if(rareTxt)ui.push(rareTxt);

      card.on('pointerover',()=>card.setFillStyle(0x1e293b));
      card.on('pointerout', ()=>card.setFillStyle(0x0f172a));
      card.on('pointerdown',()=>{
        ui.forEach(o=>o.destroy());
        this.applyPart(part.id);
        this.installedParts.push(part.id);
        this.buildShipGraphics();
        this.flashMsg(part.icon+' '+part.label+' ???????????!',1600);
        this.phase='playing';
        this.time.delayedCall(900,()=>this.startWave());
      });
    });
  }

  applyPart(id) {
    if(id==='cannon')  this.cannons=Math.min(this.cannons+1,5);
    if(id==='laser')   this.hasLaser=true;
    if(id==='drone')   this.hasDrone=true;
    if(id==='shield')  this.shieldHits=Math.min(this.shieldHits+5,20);
    if(id==='crystal') this.hasCrySyn=true;
    if(id==='cargo')   this.hasCargo=true;
    if(id==='engine')  this.speedMul=Math.min(this.speedMul+0.5,2.2);
    if(id==='spread')  this.hasSpread=true;
    this.updateHud();
  }

  endVictory() {
    this.phase='victory';this.cleanup();
    const finalM=this.hasCargo?this.loot.metal*2:this.loot.metal;
    const finalC=this.hasCargo?this.loot.crystal*2:this.loot.crystal;
    fetch(API_BASE+'/api/minigame_reward',{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({telegram_id:TELEGRAM_ID,metal:finalM,crystal:finalC,deuterium:30})}).catch(()=>{});
    this.showEndScreen(true,finalM,finalC,30);
  }

  endDefeat() {
    if(this.phase==='defeat')return;
    this.phase='defeat';this.cleanup();
    const finalM=Math.round(this.loot.metal*0.5);
    const finalC=Math.round(this.loot.crystal*0.5);
    fetch(API_BASE+'/api/minigame_reward',{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({telegram_id:TELEGRAM_ID,metal:finalM,crystal:finalC,deuterium:8})}).catch(()=>{});
    this.showEndScreen(false,finalM,finalC,8);
  }

  cleanup() {
    this.pBullets.forEach(b=>b.g?.destroy());this.pBullets=[];
    this.eBullets.forEach(b=>b.g?.destroy());this.eBullets=[];
    this.enemies.forEach(e=>{e.g?.destroy();e.hpBg?.destroy();e.hpBar?.destroy();});
    this.enemies=[];
  }

  showEndScreen(victory,metal,crystal,deut) {
    const W=this.W,H=this.H;
    this.add.rectangle(W/2,H/2,W,H,0x000000,0.82).setDepth(80);

    this.add.text(W/2,H*0.14,victory?'???? ????????!':'??????? ?????????',{
      fontFamily:'Arial Black,Arial',fontSize:'26px',fill:victory?'#fbbf24':'#ef4444',
      stroke:'#000',strokeThickness:6
    }).setOrigin(0.5).setDepth(81);

    this.add.text(W/2,H*0.26,victory
      ?'????????-??????? ?????????!\n??????? ? ????????????!'
      :'?????????! ????? ????????\n??????? ?????? ?? ????????.',{
      fontFamily:'Arial',fontSize:'14px',fill:'#cbd5e1',align:'center'
    }).setOrigin(0.5).setDepth(81);

    this.add.rectangle(W/2,H*0.38,W*0.7,1,0x334155).setDepth(81);
    this.add.text(W/2,H*0.43,'?????? ?????:',{fontFamily:'Arial',fontSize:'15px',fill:'#64748b'}).setOrigin(0.5).setDepth(81);

    [ ['Metal', metal, '#fbbf24'], ['Crystal', crystal, '#38bdf8'], ['Deuterium', deut, '#4ade80'] ]
    .forEach(([label,val,col],i)=>{
      this.add.text(W/2-80,H*0.51+i*34,label,{fontFamily:'Arial',fontSize:'16px',fill:'#e2e8f0'}).setDepth(81);
      this.add.text(W/2+80,H*0.51+i*34,'+'+val,{fontFamily:'Arial Black,Arial',fontSize:'16px',fill:col}).setOrigin(1,0).setDepth(81);
    });

    if(this.installedParts.length>0){
      this.add.text(W/2,H*0.70,'Parts: '+this.installedParts.map(id=>PARTS.find(p=>p.id===id)?.icon||'').join(' '),{
        fontFamily:'Arial',fontSize:'14px',fill:'#475569'
      }).setOrigin(0.5).setDepth(81);
    }

    this.add.rectangle(W/2,H*0.745,W*0.7,1,0x334155).setDepth(81);

    const retryBg=this.add.rectangle(W/2,H*0.805,200,50,0x1d4ed8).setDepth(82).setInteractive();
    this.add.text(W/2,H*0.805,'????? ? ????',{fontFamily:'Arial Black,Arial',fontSize:'15px',fill:'#fff'}).setOrigin(0.5).setDepth(83);
    retryBg.on('pointerover',()=>retryBg.setFillStyle(0x2563eb));
    retryBg.on('pointerout', ()=>retryBg.setFillStyle(0x1d4ed8));
    retryBg.on('pointerdown',()=>{this.cameras.main.fadeOut(250,0,0,0);this.time.delayedCall(250,()=>this.scene.restart());});

    const closeBg=this.add.rectangle(W/2,H*0.875,200,42,0x1e293b).setDepth(82).setInteractive();
    this.add.text(W/2,H*0.875,'??????? Mini App',{fontFamily:'Arial',fontSize:'13px',fill:'#64748b'}).setOrigin(0.5).setDepth(83);
    closeBg.on('pointerdown',()=>{if(tg)tg.close();});
  }
}

// ------------------------------------------------------------------
new Phaser.Game({
  type: Phaser.AUTO,
  width: window.innerWidth,
  height: window.innerHeight,
  backgroundColor: '#060918',
  scene: [MenuScene, GameScene],
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  input: { touch: true },
});
