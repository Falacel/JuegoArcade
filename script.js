const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const startButton = document.getElementById('start-button');
const restartButton = document.getElementById('restart-button');
const scoreDisplay = document.getElementById('score-display');
const healthDisplay = document.getElementById('health-display');
const messageDisplay = document.getElementById('message');

let gameState = 'menu';
let score = 0;
let health = 3;
let player, enemies, bullets;
let keys = {};
let lastTimestamp = 0;
const FPS = 60;

const GAME_WIDTH = 600;
const GAME_HEIGHT = 800;
canvas.width = GAME_WIDTH;
canvas.height = GAME_HEIGHT;

let enemySpawnTimer = 1.5;
let spawnTimeReduction = 0.01; 
let minSpawnTime = 0.5;
let lastSpawnTime = 0;

// ===========================
// Clases de objetos del juego 
// ===========================
class GameObject {
constructor(x, y, width, height) {
this.x = x;
this.y = y;
this.width = width;
this.height = height;
this.isAlive = true;
}

getBounds() {
    return {
        x: this.x,
        y: this.y,
        width: this.width,
        height: this.height
    };
}

}

class Player extends GameObject {
constructor() {
super(GAME_WIDTH / 2 - 25, GAME_HEIGHT - 70, 50, 50);
this.speed = 300;
this.fireRate = 0.3; 
this.lastShotTime = 0;
this.health = 3;
}

draw() {
    // Dibujar una nave espacial con SVG
    ctx.fillStyle = '#3498db';
    ctx.beginPath();
    ctx.moveTo(this.x, this.y + this.height);
    ctx.lineTo(this.x + this.width / 2, this.y);
    ctx.lineTo(this.x + this.width, this.y + this.height);
    ctx.closePath();
    ctx.fill();
}

update(deltaTime) {
    
    if (keys['ArrowLeft'] || keys['a']) {
        this.x -= this.speed * deltaTime;
    }
    if (keys['ArrowRight'] || keys['d']) {
        this.x += this.speed * deltaTime;
    }
    // Limitar al jugador para que no salga del canvas
    if (this.x < 0) this.x = 0;
    if (this.x + this.width > GAME_WIDTH) this.x = GAME_WIDTH - this.width;

    // Disparar
    if ((keys[' ']) && Date.now() / 1000 - this.lastShotTime > this.fireRate) {
        this.shoot();
        this.lastShotTime = Date.now() / 1000;
    }
}

shoot() {
    const bullet = new Bullet(this.x + this.width / 2 - 2.5, this.y, 5, 10);
    bullets.push(bullet);
}

}

class Enemy extends GameObject {
constructor(x, y) {
super(x, y, 40, 40);
this.speed = Math.random() * 100 + 50;
this.isHit = false; 
}

draw() {
    // Dibujar un enemigo con SVG
    ctx.fillStyle = '#e74c3c';
    ctx.beginPath();
    ctx.arc(this.x + this.width / 2, this.y + this.height / 2, this.width / 2, 0, Math.PI * 2);
    ctx.fill();
}

update(deltaTime) {
    this.y += this.speed * deltaTime;
}

}

class Bullet extends GameObject {
constructor(x, y, width, height) {
super(x, y, width, height);
this.speed = 500;
}

draw() {
    // Dibujar una bala
    ctx.fillStyle = '#f1c40f';
    ctx.fillRect(this.x, this.y, this.width, this.height);
}

update(deltaTime) {
    this.y -= this.speed * deltaTime;
}

}

// ====================
// Lógica de colisiones 
// ====================

function checkCollision(rect1, rect2) {
return rect1.x < rect2.x + rect2.width &&
rect1.x + rect1.width > rect2.x &&
rect1.y < rect2.y + rect2.height &&
rect1.y + rect1.height > rect2.y;
}

// ==========================
// Lógica del juego principal 
// ==========================
function startGame() {
gameState = 'playing';
score = 0;
health = 3;
player = new Player();
enemies = [];
bullets = [];
scoreDisplay.textContent = 'Puntuación: 0';
healthDisplay.textContent = 'Vida: 3';
startButton.style.display = 'none';
restartButton.style.display = 'none';
messageDisplay.textContent = '';
gameLoop(0);
}

function spawnEnemy() {
const x = Math.random() * (GAME_WIDTH - 40);
enemies.push(new Enemy(x, -50));
}

function updateDifficulty() {
const reduction = Math.floor(score / 60) * spawnTimeReduction;
enemySpawnTimer = Math.max(1.5 - reduction, minSpawnTime);
}

function gameLoop(timestamp) {
if (gameState !== 'playing') return;

const deltaTime = (timestamp - lastTimestamp) / 1000;
lastTimestamp = timestamp;

// Limpiar el canvas
ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

// Actualizar y dibujar el jugador
player.update(deltaTime);
player.draw();

// Actualizar y dibujar las balas, y chequear colisiones
bullets = bullets.filter(bullet => {
    bullet.update(deltaTime);
    bullet.draw();
    
    // Colisión bala-enemigo
    for (let i = 0; i < enemies.length; i++) {
        if (checkCollision(bullet.getBounds(), enemies[i].getBounds())) {
            enemies[i].isHit = true; 
            score += 10;
            scoreDisplay.textContent = `Puntuación: ${score}`;
            updateDifficulty();
            return false; 
        }
    }
    
    return bullet.y > 0;
});

// Actualizar y dibujar los enemigos, y chequear colisiones
if (Date.now() / 1000 - lastSpawnTime > enemySpawnTimer) {
    spawnEnemy();
    lastSpawnTime = Date.now() / 1000;
}

enemies = enemies.filter(enemy => {
    enemy.update(deltaTime);
    enemy.draw();
    
    // Colisión jugador-enemigo
    if (checkCollision(player.getBounds(), enemy.getBounds())) {
        health--;
        healthDisplay.textContent = `Vida: ${health}`;
        if (health <= 0) {
            endGame();
        }
        return false; // Elimina al enemigo
    }

    // El enemigo se fue de la pantalla o ha sido golpeado por una bala
    return enemy.y < GAME_HEIGHT && !enemy.isHit;
});

requestAnimationFrame(gameLoop);

}

function endGame() {
gameState = 'gameOver';
ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
messageDisplay.textContent = '¡JUEGO TERMINADO! Puntuación: ${score}';
restartButton.style.display = 'block';
}

// ==================
// Gestión de eventos 
// ==================
document.addEventListener('keydown', (e) => {
keys[e.key] = true;
});

document.addEventListener('keyup', (e) => {
keys[e.key] = false;
});

// Controles táctiles
canvas.addEventListener('touchstart', (e) => {
const touchX = e.touches[0].clientX - canvas.getBoundingClientRect().left;
player.x = touchX - player.width / 2;
});

canvas.addEventListener('touchmove', (e) => {
const touchX = e.touches[0].clientX - canvas.getBoundingClientRect().left;
player.x = touchX - player.width / 2;
e.preventDefault();
});

startButton.addEventListener('click', startGame);
restartButton.addEventListener('click', startGame);