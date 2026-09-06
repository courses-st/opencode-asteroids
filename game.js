'use strict';

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const W = 800;
const H = 600;

// ── Input ─────────────────────────────────────────────────────────────────────
const keys = {};
const justPressed = {};

window.addEventListener('keydown', e => {
  justPressed[e.code] = !keys[e.code];
  keys[e.code] = true;
  if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code))
    e.preventDefault();
});
window.addEventListener('keyup', e => { keys[e.code] = false; });

function pressed(code) {
  const val = justPressed[code];
  justPressed[code] = false;
  return val;
}

// ── Utils ─────────────────────────────────────────────────────────────────────
const wrap  = (v, max) => ((v % max) + max) % max;
const dist  = (a, b)   => Math.hypot(a.x - b.x, a.y - b.y);
const rand  = (min, max) => min + Math.random() * (max - min);
const randInt = (min, max) => Math.floor(rand(min, max + 1));

// ── Bullet ────────────────────────────────────────────────────────────────────
class Bullet {
  constructor(x, y, angle) {
    this.x = x;
    this.y = y;
    const SPEED = 520;
    this.vx = Math.cos(angle) * SPEED;
    this.vy = Math.sin(angle) * SPEED;
    this.ttl  = 1.1;
    this.radius = 2;
    this.dead = false;
  }

  update(dt) {
    this.x = wrap(this.x + this.vx * dt, W);
    this.y = wrap(this.y + this.vy * dt, H);
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  draw() {
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ── Asteroid ──────────────────────────────────────────────────────────────────
const RADII  = [0, 16, 30, 50];   // por tamaño 1, 2, 3
const SPEEDS = [0, 85, 55, 32];   // velocidad base por tamaño
const POINTS = [0, 100, 50, 20];  // puntos por tamaño

class Asteroid {
  constructor(x, y, size = 3) {
    this.x    = x;
    this.y    = y;
    this.size = size;
    this.radius = RADII[size];
    this.dead = false;

    const angle = rand(0, Math.PI * 2);
    const speed = SPEEDS[size] + rand(-15, 15);
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.rotSpeed = rand(-1.2, 1.2);
    this.rot = rand(0, Math.PI * 2);
    this.points = POINTS[this.size];
    this.isShootingStar = false;
    this.dropChance = 0.15;

    // Polígono irregular
    const n = randInt(8, 13);
    this.verts = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const r = this.radius * rand(0.6, 1.0);
      this.verts.push([Math.cos(a) * r, Math.sin(a) * r]);
    }
  }

  update(dt) {
    this.x   = wrap(this.x + this.vx * dt, W);
    this.y   = wrap(this.y + this.vy * dt, H);
    this.rot += this.rotSpeed * dt;
  }

  split() {
    if (this.size <= 1) return [];
    return [
      new Asteroid(this.x, this.y, this.size - 1),
      new Asteroid(this.x, this.y, this.size - 1),
    ];
  }

  draw() {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rot);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth   = 1.5;
    ctx.lineJoin    = 'round';
    ctx.beginPath();
    ctx.moveTo(this.verts[0][0], this.verts[0][1]);
    for (let i = 1; i < this.verts.length; i++)
      ctx.lineTo(this.verts[i][0], this.verts[i][1]);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }
}

// ── Power-up ──────────────────────────────────────────────────────────────────
const POWERUP_TTL = 10;      // segundos antes de desaparecer
const POWERUP_FLASH = 3;     // segundos finales parpadeando
const SHIELD_MAX_CHARGES = 3; // golpes que absorbe el escudo
const SHIELD_RADIUS = 22;     // radio de la burbuja

class PowerUp {
  constructor(x, y, type = 'speed') {
    this.x      = x;
    this.y      = y;
    this.radius = 12;
    this.ttl    = POWERUP_TTL;
    this.bob    = 0;
    this.type   = type;
    this.dead   = false;
  }

  update(dt) {
    this.ttl -= dt;
    this.bob += dt * 3;
    if (this.ttl <= 0) this.dead = true;
  }

  draw() {
    // Parpadeo antes de expirar
    if (this.ttl < POWERUP_FLASH && Math.floor(this.ttl * 4) % 2 === 0) return;

    ctx.save();
    ctx.translate(this.x, this.y + Math.sin(this.bob) * 3);
    ctx.lineWidth   = 2.5;
    ctx.lineJoin    = 'round';
    ctx.lineCap     = 'round';

if (this.type === 'triple') {
      // Triple shot: tres balas en fila
      ctx.strokeStyle = '#4fc3ff';
      ctx.beginPath();
      ctx.moveTo(-9, -5);
      ctx.lineTo(-9,  5);
      ctx.moveTo( 0, -5);
      ctx.lineTo( 0,  5);
      ctx.moveTo( 9, -5);
      ctx.lineTo( 9,  5);
      ctx.stroke();
      ctx.restore();
      return;
    }

    if (this.type === 'shield') {
      // Escudo: contorno hexagonal
      ctx.strokeStyle = '#29e0ff';
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2 - Math.PI / 2;
        const px = Math.cos(a) * 10;
        const py = Math.sin(a) * 10;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.stroke();
      ctx.restore();
      return;
    }

    // Rayo (línea en zigzag) — velocidad
    ctx.strokeStyle = '#ffd700';
    ctx.beginPath();
    ctx.moveTo( 2, -10);
    ctx.lineTo(-7,  1);
    ctx.lineTo(-1,  1);
    ctx.lineTo(-2, 10);
    ctx.lineTo( 7, -1);
    ctx.lineTo( 1, -1);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }
}

// ── Estrella fugaz ────────────────────────────────────────────────────────────
const STAR_TTL   = 8;      // segundos antes de desaparecer
const STAR_FLASH = 2;      // segundos finales parpadeando
const STAR_MAX   = 2;      // máximo de estrellas vivas simultáneas

class ShootingStar extends Asteroid {
  constructor(x, y) {
    super(x, y, 1);
    const angle = rand(0, Math.PI * 2);
    const speed = rand(140, 220);
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.ttl    = STAR_TTL;
    this.points = 30;
    this.dropChance = 0.5;
    this.isShootingStar = true;
  }

  update(dt) {
    super.update(dt);
    this.ttl -= dt;
    if (this.ttl <= 0) {
      explode(this.x, this.y, 6);
      this.dead = true;
    }
  }

  split() { return []; }

  draw() {
    // Parpadeo antes de desaparecer
    if (this.ttl < STAR_FLASH && Math.floor(this.ttl * 6) % 2 === 0) return;

    // Estela de cometa
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth   = 1.5;
    ctx.beginPath();
    ctx.moveTo(this.x - this.vx * 0.09, this.y - this.vy * 0.09);
    ctx.lineTo(this.x, this.y);
    ctx.stroke();

    // Núcleo brillante
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(this.x, this.y, 4, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ── Skins ─────────────────────────────────────────────────────────────────────
const PUNTOS_ORIGINAL = 500;                  // precio de referencia de la nave original
const PRECIO_MORADA   = PUNTOS_ORIGINAL * 2;  // la nueva nave cuesta el doble de puntos

const SKINS = [
  { name: 'CLÁSICA',  stroke: '#fff',      flame: 'rgba(255,130,0,0.85)',  nose: 21, price: 0,             scale: 1, points: [[20,0],[-12,-9],[-7,0],[-12,9]] },
  { name: 'DELTA',    stroke: '#4dd6ff',   flame: 'rgba(60,200,255,0.85)', nose: 24, price: 0,             scale: 1, points: [[24,0],[2,-6],[-10,-10],[-5,0],[-10,10],[2,6]] },
  { name: 'VIKINGA',  stroke: '#ff5d5d',   flame: 'rgba(255,90,0,0.85)',   nose: 18, price: 0,             scale: 1, points: [[18,0],[-2,-13],[-11,-4],[-16,-8],[-8,0],[-16,8],[-11,4],[-2,13]] },
  { name: 'ESPECTRO', stroke: '#c88bff',   flame: 'rgba(170,255,90,0.85)', nose: 22, price: 0,             scale: 1, points: [[22,0],[0,-4],[-8,-11],[-4,-2],[-16,0],[-4,2],[-8,11],[0,4]] },
  { name: 'MORADA',   stroke: '#b224ff',   flame: 'rgba(190,60,255,0.85)', nose: 21, price: PRECIO_MORADA, scale: 2, points: [[20,0],[-12,-9],[-7,0],[-12,9]] },
];

let skinIndex = 0;
let skinMsgTimer = 0;
let skinMsg = '';
let ownedSkins = new Set([0]);

function currentSkin() { return SKINS[skinIndex]; }

function selectSkin(idx) {
  skinIndex = idx;
  skinMsgTimer = 2;
  skinMsg = `SKIN: ${currentSkin().name}`;
  if (ship) ship.radius = 12 * currentSkin().scale;
}

function nextSkin() {
  for (let i = 1; i <= SKINS.length; i++) {
    const idx = (skinIndex + i) % SKINS.length;
    const skin = SKINS[idx];
    if (skin.price === 0 || ownedSkins.has(idx)) { selectSkin(idx); return; }
    if (score >= skin.price) {
      score -= skin.price;
      ownedSkins.add(idx);
      selectSkin(idx);
      skinMsg = `¡COMPRASTE LA NAVE ${skin.name} (${skin.price} pts)!`;
      return;
    }
  }
  skinMsgTimer = 2;
  skinMsg = 'PUNTAJE INSUFICIENTE';
}

// ── Ship ──────────────────────────────────────────────────────────────────────
class Ship {
  constructor() { this.reset(); }

  reset() {
    this.x      = W / 2;
    this.y      = H / 2;
    this.angle  = -Math.PI / 2;
    this.vx     = 0;
    this.vy     = 0;
    this.radius = 12 * currentSkin().scale;
    this.thrusting     = false;
    this.invincible    = 3;
    this.shootCooldown = 0;
    this.speedTimer    = 0;
    this.tripleTimer   = 0;
    this.shieldCharges = 0;
    this.dead          = false;
  }

  update(dt) {
    if (this.dead) return;
    if (this.invincible    > 0) this.invincible    -= dt;
    if (this.shootCooldown > 0) this.shootCooldown -= dt;
    if (this.speedTimer    > 0) this.speedTimer    -= dt;
    if (this.tripleTimer   > 0) this.tripleTimer   -= dt;

    const ROT   = 3.5;   // rad/s
    const THRUST = 260;  // px/s²
    const DRAG   = 0.987;
    const speedMult = this.speedTimer > 0 ? 2 : 1;

    if (keys['ArrowLeft'])  this.angle -= ROT * dt;
    if (keys['ArrowRight']) this.angle += ROT * dt;

    this.thrusting = !!keys['ArrowUp'];
    if (this.thrusting) {
      this.vx += Math.cos(this.angle) * THRUST * speedMult * dt;
      this.vy += Math.sin(this.angle) * THRUST * speedMult * dt;
    }

    this.vx *= DRAG;
    this.vy *= DRAG;
    this.x = wrap(this.x + this.vx * dt, W);
    this.y = wrap(this.y + this.vy * dt, H);
  }

  tryShoot() {
    if (this.shootCooldown > 0 || this.dead) return [];
    this.shootCooldown = 0.2;
    const nose = currentSkin().nose * currentSkin().scale;
    const ox = this.x + Math.cos(this.angle) * nose;
    const oy = this.y + Math.sin(this.angle) * nose;
    if (this.tripleTimer <= 0) return [new Bullet(ox, oy, this.angle)];

    // Triple shot: tres balas paralelas desfasadas en perpendicular
    const SHOT_SPREAD = 8;
    const px = -Math.sin(this.angle) * SHOT_SPREAD;
    const py =  Math.cos(this.angle) * SHOT_SPREAD;
    return [
      new Bullet(ox - px, oy - py, this.angle),
      new Bullet(ox,      oy,      this.angle),
      new Bullet(ox + px, oy + py, this.angle),
    ];
  }

  draw() {
    if (this.dead) return;
    // Parpadeo durante invencibilidad de reaparición
    if (this.invincible > 0 && Math.floor(this.invincible * 8) % 2 === 0) return;

    const skin = currentSkin();

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    ctx.scale(skin.scale, skin.scale);
    ctx.strokeStyle = skin.stroke;
    ctx.lineWidth   = 1.5;
    ctx.lineJoin    = 'round';

// Burbuja del escudo
    if (this.shieldCharges > 0) {
      const t = performance.now() / 1000;
      const pulse = Math.sin(t * 5) * 1.5;
      const alpha = this.shieldCharges === 1
        ? 0.5 + 0.5 * Math.sin(t * 8)
        : 0.75;
      ctx.fillStyle   = `rgba(41,224,255,${(0.12 * alpha).toFixed(2)})`;
      ctx.strokeStyle = `rgba(41,224,255,${alpha.toFixed(2)})`;
      ctx.lineWidth   = 2;
      ctx.beginPath();
      ctx.arc(0, 0, SHIELD_RADIUS + pulse, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth   = 1.5;
    }

    // Silueta según skin
    ctx.beginPath();
    ctx.moveTo(skin.points[0][0], skin.points[0][1]);
    for (let i = 1; i < skin.points.length; i++)
      ctx.lineTo(skin.points[i][0], skin.points[i][1]);
    ctx.closePath();
    ctx.stroke();

    // Llama del propulsor
    if (this.thrusting && Math.random() > 0.35) {
      ctx.beginPath();
      ctx.moveTo(-8, -4);
      ctx.lineTo(-8 - rand(6, 14), 0);
      ctx.lineTo(-8,  4);
      ctx.strokeStyle = skin.flame;
      ctx.stroke();
    }

    ctx.restore();
  }
}

// ── Partículas (explosión) ────────────────────────────────────────────────────
class Particle {
  constructor(x, y) {
    this.x  = x;
    this.y  = y;
    const angle = rand(0, Math.PI * 2);
    const speed = rand(30, 130);
    this.vx   = Math.cos(angle) * speed;
    this.vy   = Math.sin(angle) * speed;
    this.life = rand(0.4, 1.1);
    this.ttl  = this.life;
    this.dead = false;
  }

  update(dt) {
    this.x  += this.vx * dt;
    this.y  += this.vy * dt;
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  draw() {
    const alpha = this.ttl / this.life;
    ctx.strokeStyle = `rgba(255,255,255,${alpha.toFixed(2)})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(this.x - this.vx * 0.05, this.y - this.vy * 0.05);
    ctx.stroke();
  }
}

// ── Estado del juego ──────────────────────────────────────────────────────────
let ship, bullets, asteroids, particles, powerups;
let score, lives, level;
let state;      // 'playing' | 'dead' | 'gameover'
let deadTimer;
let starTimer;

function spawnAsteroids(count) {
  const SAFE_DIST = 130;
  for (let i = 0; i < count; i++) {
    let x, y;
    do {
      x = rand(0, W);
      y = rand(0, H);
    } while (Math.hypot(x - W / 2, y - H / 2) < SAFE_DIST);
    asteroids.push(new Asteroid(x, y, 3));
  }
}

function initGame() {
  ship          = new Ship();
  bullets   = [];
  asteroids = [];
  particles = [];
  powerups  = [];
  score  = 0;
  lives  = 3;
  level  = 1;
  state  = 'playing';
  starTimer = rand(8, 14);
  spawnAsteroids(4);
}

function nextLevel() {
  level++;
  bullets   = [];
  particles = [];
  powerups  = [];
  asteroids = [];
  ship.reset();
  starTimer = rand(8, 14);
  spawnAsteroids(3 + level);
}

function explode(x, y, count = 8) {
  for (let i = 0; i < count; i++) particles.push(new Particle(x, y));
}

function killShip() {
  explode(ship.x, ship.y, 14);
  ship.dead = true;
  lives--;
  if (lives <= 0) {
    state = 'gameover';
  } else {
    state     = 'dead';
    deadTimer = 2;
  }
}

// ── Update ────────────────────────────────────────────────────────────────────
function update(dt) {
  if (pressed('KeyT')) nextSkin();
  if (skinMsgTimer > 0) skinMsgTimer -= dt;

  if (state === 'gameover') {
    if (pressed('Space')) initGame();
    particles.forEach(p => p.update(dt));
    particles = particles.filter(p => !p.dead);
    powerups.forEach(p => p.update(dt));
    powerups = powerups.filter(p => !p.dead);
    return;
  }

  if (state === 'dead') {
    deadTimer -= dt;
    particles.forEach(p => p.update(dt));
    particles = particles.filter(p => !p.dead);
    asteroids.forEach(a => a.update(dt));
    asteroids = asteroids.filter(a => !a.dead);
    powerups.forEach(p => p.update(dt));
    powerups = powerups.filter(p => !p.dead);
    if (deadTimer <= 0) { state = 'playing'; ship.reset(); }
    return;
  }

  // Disparar
  if (pressed('Space')) {
    bullets.push(...ship.tryShoot());
  }

  ship.update(dt);
  bullets.forEach(b => b.update(dt));
  asteroids.forEach(a => a.update(dt));
  particles.forEach(p => p.update(dt));
  powerups.forEach(p => p.update(dt));

  bullets   = bullets.filter(b => !b.dead);
  particles = particles.filter(p => !p.dead);
  powerups  = powerups.filter(p => !p.dead);

  // Bala vs asteroide
  const newAsteroids = [];
  for (const b of bullets) {
    for (const a of asteroids) {
      if (!a.dead && !b.dead && dist(b, a) < a.radius) {
        b.dead = true;
        a.dead = true;
        score += a.points;
        explode(a.x, a.y, a.size * 5);
        newAsteroids.push(...a.split());
        if (Math.random() < a.dropChance)
          powerups.push(new PowerUp(a.x, a.y, ['speed', 'triple', 'shield'][Math.floor(Math.random() * 3)]));
      }
    }
  }
  asteroids = asteroids.filter(a => !a.dead).concat(newAsteroids);
  bullets   = bullets.filter(b => !b.dead);

  // Nave vs power-up
  for (const p of powerups) {
    if (!p.dead && dist(ship, p) < ship.radius + p.radius) {
      p.dead = true;
      if (p.type === 'shield') ship.shieldCharges = SHIELD_MAX_CHARGES;
      else if (p.type === 'triple') ship.tripleTimer = 5;
      else ship.speedTimer = 5;
    }
  }
  powerups = powerups.filter(p => !p.dead);

  // Nave vs asteroide
  if (ship.invincible <= 0) {
    for (const a of asteroids) {
      if (!a.dead && dist(ship, a) < ship.radius + a.radius * 0.82) {
        if (ship.shieldCharges > 0) {
          // El escudo absorbe el golpe y destruye el asteroide
          ship.shieldCharges--;
          a.dead = true;
          explode(a.x, a.y, a.size * 5);
          score += a.points;
        } else {
          killShip();
        }
        break;
      }
    }
  }

  // Estrella fugaz periódica
  starTimer -= dt;
  const starsAlive = asteroids.filter(a => a.isShootingStar).length;
  if (starTimer <= 0 && starsAlive < STAR_MAX) {
    let x, y;
    do {
      x = rand(0, W);
      y = rand(0, H);
    } while (Math.hypot(x - ship.x, y - ship.y) < 150);
    asteroids.push(new ShootingStar(x, y));
    starTimer = rand(10, 18);
  }

  // Nivel completado
  if (!asteroids.some(a => !a.isShootingStar)) nextLevel();
}

// ── Draw ──────────────────────────────────────────────────────────────────────
function drawLifeIcon(x, y) {
  const skin = currentSkin();
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(0.45 * skin.scale, 0.45 * skin.scale);
  ctx.rotate(-Math.PI / 2);
  ctx.strokeStyle = skin.stroke;
  ctx.lineWidth   = 1.2 / 0.45;
  ctx.lineJoin    = 'round';
  ctx.beginPath();
  ctx.moveTo(skin.points[0][0], skin.points[0][1]);
  for (let i = 1; i < skin.points.length; i++)
    ctx.lineTo(skin.points[i][0], skin.points[i][1]);
  ctx.closePath();
  ctx.stroke();
  ctx.restore();
}

function drawHUD() {
  ctx.fillStyle = '#fff';
  ctx.font = '15px monospace';

  ctx.textAlign = 'left';
  ctx.fillText(`SCORE  ${score}`, 14, 26);

  let hudY = 46;
  if (ship.speedTimer > 0) {
    ctx.fillText(`VELOCIDAD ${ship.speedTimer.toFixed(1)}s`, 14, hudY);
    hudY += 20;
  }
  if (ship.tripleTimer > 0) {
    ctx.fillText(`TRIPLE ${ship.tripleTimer.toFixed(1)}s`, 14, hudY);
    hudY += 20;
  }
  if (ship.shieldCharges > 0) {
    ctx.fillStyle = '#29e0ff';
    ctx.fillText(`ESCUDO ${ship.shieldCharges}`, 14, hudY);
    ctx.fillStyle = '#fff';
  }

  ctx.textAlign = 'center';
  ctx.fillText(`NIVEL ${level}`, W / 2, 26);

  if (skinMsgTimer > 0) {
    ctx.fillStyle = currentSkin().stroke;
    ctx.fillText(skinMsg, W / 2, 46);
  }

  const locked = SKINS.find((sk, i) => !ownedSkins.has(i) && sk.price > 0);
  if (locked) {
    ctx.font = '12px monospace';
    ctx.fillStyle = locked.stroke;
    ctx.fillText(`NAVE ${locked.name}: ${locked.price} PTS (T)`, W / 2, 66);
  }

  const iconGap = 22 * currentSkin().scale;
  for (let i = 0; i < lives; i++)
    drawLifeIcon(W - 16 - i * iconGap, 18);

}

function drawOverlay(title, sub) {
  ctx.textAlign   = 'center';
  ctx.fillStyle   = '#fff';
  ctx.font        = 'bold 46px monospace';
  ctx.fillText(title, W / 2, H / 2 - 18);
  ctx.font        = '18px monospace';
  ctx.fillStyle   = 'rgba(255,255,255,0.65)';
  ctx.fillText(sub, W / 2, H / 2 + 22);
}

function draw() {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, W, H);

  particles.forEach(p => p.draw());
  asteroids.forEach(a => a.draw());
  bullets.forEach(b => b.draw());
  powerups.forEach(p => p.draw());
  ship.draw();

  drawHUD();

  if (state === 'gameover')
    drawOverlay('GAME OVER', `PUNTAJE: ${score}   —   ESPACIO PARA REINICIAR`);
}

// ── Loop principal ────────────────────────────────────────────────────────────
let lastTime = null;

function loop(ts) {
  const dt = lastTime === null ? 0 : Math.min((ts - lastTime) / 1000, 0.05);
  lastTime = ts;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}

initGame();
requestAnimationFrame(loop);
