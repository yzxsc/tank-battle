// ===== 坦克大战 Tank Battle =====
// 完整版坦克大战游戏

(() => {
    'use strict';

    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const overlay = document.getElementById('overlay');
    const overlayTitle = document.getElementById('overlay-title');
    const overlayMessage = document.getElementById('overlay-message');
    const startBtn = document.getElementById('start-btn');

    // ===== 游戏常量 =====
    const TILE_SIZE = 32;
    const GRID_SIZE = 20;
    const CANVAS_SIZE = TILE_SIZE * GRID_SIZE; // 640
    const TANK_SIZE = TILE_SIZE * 2 - 4; // 60
    const BULLET_SIZE = 6;

    const DIR = { UP: 0, RIGHT: 1, DOWN: 2, LEFT: 3 };
    const DIR_VECTORS = [
        { x: 0, y: -1 },
        { x: 1, y: 0 },
        { x: 0, y: 1 },
        { x: -1, y: 0 }
    ];

    const TILE = {
        EMPTY: 0,
        BRICK: 1,
        STEEL: 2,
        GRASS: 3,
        WATER: 4,
        BASE: 5
    };

    // ===== 关卡数据 =====
    // 20x20 格地图
    const LEVELS = [
        // 第1关 - 入门
        [
            "....................",
            "....................",
            ".BBBB....BBBB..BBBB.",
            ".B..B....B..B..B..B.",
            ".B..B....B..B..B..B.",
            ".BBBB....BBBB..BBBB.",
            "....................",
            "....SSSS....BBBB....",
            "....S..S....B..B....",
            "....S..S....B..B....",
            "....SSSS....BBBB....",
            "....................",
            ".BBBB....BBBB..BBBB.",
            ".B..B....B..B..B..B.",
            ".B..B....B..B..B..B.",
            ".BBBB....BBBB..BBBB.",
            "....................",
            "........BBB.........",
            "........B*B.........",
            "........BBB........."
        ],
        // 第2关 - 复杂
        [
            "....................",
            ".BBBBBB....BBBBBB...",
            ".B....B....B....B...",
            ".B....B....B....B...",
            ".BBBBBB....BBBBBB...",
            "....................",
            "..SS....BBBB....SS..",
            "..SS....B..B....SS..",
            "........B..B........",
            "..GGGG..BBBB..GGGG..",
            "..GGGG........GGGG..",
            "........BBBB........",
            "..SS....B..B....SS..",
            "..SS....B..B....SS..",
            "........BBBB........",
            ".BBBBBB....BBBBBB...",
            ".B....B....B....B...",
            ".B....B.BBB.B....B..",
            ".BBBBBB.B*B.BBBBBB..",
            "........BBB........."
        ],
        // 第3关 - 迷宫
        [
            "BB................BB",
            "BB.BBBBBBBBBBBBBB.BB",
            "...B............B...",
            ".S.B.BBBBBB.BBBB.B.S",
            ".S.B.B....B.B..B.B.S",
            "...B.B.SS.B.B..B.B..",
            "BB.B.B.SS.B.BBBB.B.B",
            "BB.B.B....B......B.B",
            "...B.BBBBBB.BBBBBB..",
            "...B........B.......",
            "...B.GGGGGG.B.GGGG..",
            "BB.B.G....G.B.G..G..",
            "BB.B.G.BB.G.B.G..G..",
            "...B.G.BB.G.B.GGGG..",
            "...B.G....G.B.......",
            "...B.GGGGGG.BBBBBB..",
            "...B................",
            "BB.BBBBBBBB.BBB.BBBB",
            "BB.........BB*B.....",
            "...........BBBB....."
        ]
    ];

    // ===== 游戏状态 =====
    const game = {
        running: false,
        paused: false,
        gameOver: false,
        score: 0,
        lives: 3,
        level: 0,
        enemiesLeft: 10,
        enemiesSpawned: 0,
        maxEnemies: 10,
        activeEnemies: 4,
        spawnTimer: 0,
        spawnInterval: 180,
        baseAlive: true,
        powerUpActive: false,
        powerUpTimer: 0,
        keys: {},
        player: null,
        enemies: [],
        bullets: [],
        explosions: [],
        powerUps: [],
        map: Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(0)),
        spawnPoints: [],
        playerSpawnPoint: null,
        basePos: null,
        shake: 0,
        flashFreeze: 0,
        baseShielded: 0,
        scorePopups: []
    };

    // ===== 工具函数 =====
    function rectCollision(a, b) {
        return a.x < b.x + b.w &&
               a.x + a.w > b.x &&
               a.y < b.y + b.h &&
               a.y + a.h > b.y;
    }

    function getTileAt(x, y) {
        const col = Math.floor(x / TILE_SIZE);
        const row = Math.floor(y / TILE_SIZE);
        if (col < 0 || col >= GRID_SIZE || row < 0 || row >= GRID_SIZE) return TILE.STEEL;
        return game.map[row]?.[col] ?? TILE.EMPTY;
    }

    function setTileAt(col, row, value) {
        if (col >= 0 && col < GRID_SIZE && row >= 0 && row < GRID_SIZE) {
            game.map[row][col] = value;
        }
    }

    function randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    // ===== 加载关卡 =====
    function loadLevel(levelIndex) {
        const levelData = LEVELS[levelIndex % LEVELS.length];
        game.map = [];
        game.spawnPoints = [];
        game.basePos = null;

        for (let row = 0; row < GRID_SIZE; row++) {
            game.map[row] = [];
            for (let col = 0; col < GRID_SIZE; col++) {
                const char = levelData[row]?.[col] ?? '.';
                let tile = TILE.EMPTY;
                switch (char) {
                    case 'B': tile = TILE.BRICK; break;
                    case 'S': tile = TILE.STEEL; break;
                    case 'G': tile = TILE.GRASS; break;
                    case 'W': tile = TILE.WATER; break;
                    case '*':
                        tile = TILE.BASE;
                        game.basePos = { col, row };
                        break;
                    default: tile = TILE.EMPTY;
                }
                game.map[row][col] = tile;
            }
        }

        // 设置敌人出生点（上方三个位置）
        game.spawnPoints = [
            { x: 0, y: 0 },
            { x: 9 * TILE_SIZE, y: 0 },
            { x: 18 * TILE_SIZE, y: 0 }
        ];

        // 玩家出生点
        game.playerSpawnPoint = {
            x: 6 * TILE_SIZE,
            y: 18 * TILE_SIZE
        };
    }

    // ===== 坦克类 =====
    class Tank {
        constructor(x, y, type) {
            this.x = x;
            this.y = y;
            this.w = TANK_SIZE;
            this.h = TANK_SIZE;
            this.direction = type === 'player' ? DIR.UP : DIR.DOWN;
            this.type = type; // 'player' | 'basic' | 'fast' | 'armor' | 'heavy'
            this.alive = true;
            this.shootCooldown = 0;
            this.moveTimer = 0;
            this.dirChangeTimer = 0;
            this.spawnTimer = 60; // 出生保护时间
            this.shield = type === 'player' ? 90 : 60;
            this.bulletSpeed = 6;
            this.canDestroySteel = false;
            this.maxBullets = 1;
            this.activeBullets = 0;
            this.aiTarget = null;

            // 类型属性
            switch (type) {
                case 'player':
                    this.speed = 2.5;
                    this.health = 1;
                    this.color = '#FFD700';
                    this.bodyColor = '#DAA520';
                    this.level = 0; // 升级等级
                    this.maxBullets = 1;
                    break;
                case 'basic':
                    this.speed = 1.2;
                    this.health = 1;
                    this.color = '#8B7355';
                    this.bodyColor = '#5D4E37';
                    this.bulletSpeed = 4;
                    this.scoreValue = 100;
                    break;
                case 'fast':
                    this.speed = 2.5;
                    this.health = 1;
                    this.color = '#E0E0E0';
                    this.bodyColor = '#909090';
                    this.bulletSpeed = 6;
                    this.scoreValue = 200;
                    break;
                case 'armor':
                    this.speed = 1.5;
                    this.health = 2;
                    this.color = '#3CB371';
                    this.bodyColor = '#2E8B57';
                    this.bulletSpeed = 5;
                    this.scoreValue = 300;
                    break;
                case 'heavy':
                    this.speed = 1.0;
                    this.health = 4;
                    this.color = '#DC143C';
                    this.bodyColor = '#8B0000';
                    this.bulletSpeed = 5;
                    this.scoreValue = 400;
                    this.dropPowerUp = true;
                    break;
            }
        }

        update() {
            if (!this.alive) return;

            if (this.spawnTimer > 0) {
                this.spawnTimer--;
                return;
            }

            if (this.shield > 0) this.shield--;
            if (this.shootCooldown > 0) this.shootCooldown--;

            if (this.type === 'player') {
                this.updatePlayer();
            } else {
                this.updateAI();
            }
        }

        updatePlayer() {
            let moved = false;
            let newDir = this.direction;
            let dx = 0, dy = 0;

            if (game.keys['ArrowUp'] || game.keys['KeyW']) {
                newDir = DIR.UP; dy = -this.speed; moved = true;
            } else if (game.keys['ArrowDown'] || game.keys['KeyS']) {
                newDir = DIR.DOWN; dy = this.speed; moved = true;
            } else if (game.keys['ArrowLeft'] || game.keys['KeyA']) {
                newDir = DIR.LEFT; dx = -this.speed; moved = true;
            } else if (game.keys['ArrowRight'] || game.keys['KeyD']) {
                newDir = DIR.RIGHT; dx = this.speed; moved = true;
            }

            if (moved) {
                if (this.direction !== newDir) {
                    this.direction = newDir;
                    this.alignToGrid();
                } else {
                    this.tryMove(dx, dy);
                }
            }
        }

        updateAI() {
            this.moveTimer--;
            this.dirChangeTimer--;

            // 随机改变方向
            if (this.dirChangeTimer <= 0) {
                this.dirChangeTimer = randomInt(60, 180);
                // 30% 概率追击玩家或基地
                if (Math.random() < 0.3 && game.player?.alive) {
                    this.chooseDirectionToward(game.player.x, game.player.y);
                } else if (Math.random() < 0.2 && game.basePos) {
                    this.chooseDirectionToward(game.basePos.col * TILE_SIZE, game.basePos.row * TILE_SIZE);
                } else {
                    this.direction = randomInt(0, 3);
                }
                this.alignToGrid();
            }

            // 移动
            const v = DIR_VECTORS[this.direction];
            const dx = v.x * this.speed;
            const dy = v.y * this.speed;
            const oldX = this.x, oldY = this.y;
            this.tryMove(dx, dy);

            // 如果撞墙了，立即换方向
            if (this.x === oldX && this.y === oldY) {
                this.direction = randomInt(0, 3);
                this.alignToGrid();
                this.dirChangeTimer = randomInt(30, 90);
            }

            // 随机射击
            if (this.shootCooldown <= 0 && Math.random() < 0.02) {
                this.shoot();
            }
        }

        chooseDirectionToward(tx, ty) {
            const dx = tx - this.x;
            const dy = ty - this.y;
            if (Math.abs(dx) > Math.abs(dy)) {
                this.direction = dx > 0 ? DIR.RIGHT : DIR.LEFT;
            } else {
                this.direction = dy > 0 ? DIR.DOWN : DIR.UP;
            }
        }

        alignToGrid() {
            // 对齐到瓦片网格，便于通过通道
            if (this.direction === DIR.UP || this.direction === DIR.DOWN) {
                this.x = Math.round(this.x / TILE_SIZE) * TILE_SIZE;
            } else {
                this.y = Math.round(this.y / TILE_SIZE) * TILE_SIZE;
            }
        }

        tryMove(dx, dy) {
            const newX = this.x + dx;
            const newY = this.y + dy;

            // 边界检测
            if (newX < 0 || newX + this.w > CANVAS_SIZE) return false;
            if (newY < 0 || newY + this.h > CANVAS_SIZE) return false;

            // 与地图碰撞
            if (this.collidesWithMap(newX, newY)) return false;

            // 与其他坦克碰撞
            if (this.collidesWithTanks(newX, newY)) return false;

            this.x = newX;
            this.y = newY;
            return true;
        }

        collidesWithMap(x, y) {
            const corners = [
                { x: x + 2, y: y + 2 },
                { x: x + this.w - 2, y: y + 2 },
                { x: x + 2, y: y + this.h - 2 },
                { x: x + this.w - 2, y: y + this.h - 2 }
            ];
            for (const c of corners) {
                const tile = getTileAt(c.x, c.y);
                if (tile === TILE.BRICK || tile === TILE.STEEL ||
                    tile === TILE.WATER || tile === TILE.BASE) {
                    return true;
                }
            }
            return false;
        }

        collidesWithTanks(x, y) {
            const newRect = { x, y, w: this.w, h: this.h };
            if (this.type !== 'player' && game.player?.alive) {
                if (rectCollision(newRect, game.player)) return true;
            }
            for (const t of game.enemies) {
                if (t === this || !t.alive) continue;
                if (rectCollision(newRect, t)) return true;
            }
            if (this.type === 'player') {
                for (const t of game.enemies) {
                    if (!t.alive) continue;
                    if (rectCollision(newRect, t)) return true;
                }
            }
            return false;
        }

        shoot() {
            if (this.shootCooldown > 0) return;
            if (this.activeBullets >= this.maxBullets) return;

            const v = DIR_VECTORS[this.direction];
            const cx = this.x + this.w / 2;
            const cy = this.y + this.h / 2;

            const bullet = new Bullet(
                cx - BULLET_SIZE / 2,
                cy - BULLET_SIZE / 2,
                v.x * this.bulletSpeed,
                v.y * this.bulletSpeed,
                this.type === 'player' ? 'player' : 'enemy',
                this.canDestroySteel,
                this
            );
            game.bullets.push(bullet);
            this.activeBullets++;
            this.shootCooldown = this.type === 'player' ? 15 : 40;
        }

        hit() {
            if (this.shield > 0) return false;
            this.health--;
            if (this.health <= 0) {
                this.die();
                return true;
            }
            // 装甲坦克受击变色提示
            this.shield = 10;
            return false;
        }

        die() {
            this.alive = false;
            game.explosions.push(new Explosion(this.x + this.w/2, this.y + this.h/2, 'large'));

            if (this.type === 'player') {
                game.lives--;
                game.shake = 20;
                if (game.lives <= 0) {
                    endGame(false);
                } else {
                    // 重生
                    setTimeout(() => respawnPlayer(), 1500);
                }
            } else {
                game.score += this.scoreValue || 100;
                game.scorePopups.push(new ScorePopup(this.x + this.w/2, this.y + this.h/2, this.scoreValue || 100));
                game.enemiesLeft--;

                // 重型坦克掉落道具
                if (this.dropPowerUp) {
                    spawnPowerUp();
                }

                // 关卡完成检查
                if (game.enemiesLeft <= 0) {
                    setTimeout(() => nextLevel(), 1500);
                }
            }
        }

        upgrade() {
            if (this.type !== 'player') return;
            this.level = Math.min(this.level + 1, 3);
            switch (this.level) {
                case 1:
                    this.bulletSpeed = 8;
                    break;
                case 2:
                    this.maxBullets = 2;
                    break;
                case 3:
                    this.canDestroySteel = true;
                    break;
            }
        }

        draw() {
            if (!this.alive) return;

            ctx.save();

            // 出生闪烁
            if (this.spawnTimer > 0) {
                if (Math.floor(this.spawnTimer / 5) % 2 === 0) {
                    ctx.restore();
                    return;
                }
            }

            // 护盾效果
            if (this.shield > 0 && this.spawnTimer <= 0) {
                ctx.strokeStyle = `rgba(0, 200, 255, ${0.6 + Math.sin(Date.now()/100) * 0.4})`;
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(this.x + this.w/2, this.y + this.h/2, this.w/2 + 4, 0, Math.PI * 2);
                ctx.stroke();
            }

            const cx = this.x + this.w / 2;
            const cy = this.y + this.h / 2;
            ctx.translate(cx, cy);
            ctx.rotate((this.direction * Math.PI) / 2);

            this.drawTankBody();

            ctx.restore();
        }

        drawTankBody() {
            const s = this.w;
            const half = s / 2;

            // 履带
            ctx.fillStyle = '#1a1a1a';
            ctx.fillRect(-half, -half, 10, s);
            ctx.fillRect(half - 10, -half, 10, s);

            // 履带纹路
            ctx.fillStyle = '#333';
            for (let i = 0; i < 6; i++) {
                ctx.fillRect(-half + 1, -half + 2 + i * 10, 8, 2);
                ctx.fillRect(half - 9, -half + 2 + i * 10, 8, 2);
            }

            // 主体
            ctx.fillStyle = this.bodyColor;
            ctx.fillRect(-half + 10, -half + 6, s - 20, s - 12);

            // 主体高光
            ctx.fillStyle = this.color;
            ctx.fillRect(-half + 12, -half + 8, s - 24, s - 16);

            // 主体阴影
            ctx.fillStyle = this.bodyColor;
            ctx.fillRect(-half + 12, -half + 8, s - 24, 4);

            // 炮塔
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(0, 0, 10, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = this.bodyColor;
            ctx.beginPath();
            ctx.arc(0, 0, 10, 0, Math.PI * 2);
            ctx.stroke();

            // 炮管
            ctx.fillStyle = '#222';
            ctx.fillRect(-3, -half, 6, half + 5);

            // 重型坦克标记
            if (this.type === 'heavy') {
                ctx.fillStyle = '#FFD700';
                ctx.font = 'bold 12px monospace';
                ctx.textAlign = 'center';
                ctx.fillText('★', 0, 4);
            }

            // 玩家等级标记
            if (this.type === 'player' && this.level > 0) {
                ctx.fillStyle = '#FFD700';
                ctx.font = 'bold 10px monospace';
                ctx.textAlign = 'center';
                ctx.fillText('★'.repeat(this.level), 0, 4);
            }
        }
    }

    // ===== 子弹类 =====
    class Bullet {
        constructor(x, y, vx, vy, owner, canDestroySteel, ownerTank) {
            this.x = x;
            this.y = y;
            this.w = BULLET_SIZE;
            this.h = BULLET_SIZE;
            this.vx = vx;
            this.vy = vy;
            this.owner = owner;
            this.canDestroySteel = canDestroySteel;
            this.ownerTank = ownerTank;
            this.alive = true;
        }

        update() {
            this.x += this.vx;
            this.y += this.vy;

            // 边界检测
            if (this.x < 0 || this.x > CANVAS_SIZE ||
                this.y < 0 || this.y > CANVAS_SIZE) {
                this.destroy();
                return;
            }

            // 与地图碰撞
            this.checkMapCollision();
            if (!this.alive) return;

            // 与坦克碰撞
            this.checkTankCollision();
            if (!this.alive) return;

            // 与其他子弹碰撞
            this.checkBulletCollision();
        }

        checkMapCollision() {
            const col = Math.floor((this.x + this.w/2) / TILE_SIZE);
            const row = Math.floor((this.y + this.h/2) / TILE_SIZE);

            if (col < 0 || col >= GRID_SIZE || row < 0 || row >= GRID_SIZE) {
                this.destroy();
                return;
            }

            const tile = game.map[row][col];

            if (tile === TILE.BRICK) {
                // 破坏砖墙 - 根据方向破坏一片
                this.breakBricks(col, row);
                this.destroy();
            } else if (tile === TILE.STEEL) {
                if (this.canDestroySteel) {
                    setTileAt(col, row, TILE.EMPTY);
                    game.explosions.push(new Explosion(col * TILE_SIZE + TILE_SIZE/2, row * TILE_SIZE + TILE_SIZE/2, 'small'));
                }
                this.destroy();
            } else if (tile === TILE.BASE) {
                setTileAt(col, row, TILE.EMPTY);
                game.baseAlive = false;
                game.shake = 30;
                game.explosions.push(new Explosion(col * TILE_SIZE + TILE_SIZE/2, row * TILE_SIZE + TILE_SIZE/2, 'huge'));
                this.destroy();
                setTimeout(() => endGame(false), 1500);
            }
        }

        breakBricks(col, row) {
            // 根据子弹方向破坏一行/列砖块
            if (Math.abs(this.vx) > Math.abs(this.vy)) {
                // 水平移动 - 破坏垂直两块
                setTileAt(col, row, TILE.EMPTY);
                if (row > 0 && game.map[row-1][col] === TILE.BRICK) setTileAt(col, row-1, TILE.EMPTY);
                if (row < GRID_SIZE-1 && game.map[row+1][col] === TILE.BRICK) setTileAt(col, row+1, TILE.EMPTY);
            } else {
                setTileAt(col, row, TILE.EMPTY);
                if (col > 0 && game.map[row][col-1] === TILE.BRICK) setTileAt(col-1, row, TILE.EMPTY);
                if (col < GRID_SIZE-1 && game.map[row][col+1] === TILE.BRICK) setTileAt(col+1, row, TILE.EMPTY);
            }
            game.explosions.push(new Explosion(this.x, this.y, 'tiny'));
        }

        checkTankCollision() {
            // 玩家子弹打敌人
            if (this.owner === 'player') {
                for (const enemy of game.enemies) {
                    if (!enemy.alive) continue;
                    if (rectCollision(this, enemy)) {
                        enemy.hit();
                        this.destroy();
                        return;
                    }
                }
            } else {
                // 敌人子弹打玩家
                if (game.player?.alive && rectCollision(this, game.player)) {
                    if (!game.player.hit()) {
                        // hit返回false说明没死，可能在出生保护期
                    }
                    this.destroy();
                    return;
                }
            }
        }

        checkBulletCollision() {
            for (const b of game.bullets) {
                if (b === this || !b.alive) continue;
                if (b.owner === this.owner) continue;
                if (rectCollision(this, b)) {
                    this.destroy();
                    b.destroy();
                    return;
                }
            }
        }

        destroy() {
            this.alive = false;
            if (this.ownerTank && this.ownerTank.alive) {
                this.ownerTank.activeBullets = Math.max(0, this.ownerTank.activeBullets - 1);
            }
        }

        draw() {
            if (!this.alive) return;
            ctx.fillStyle = this.owner === 'player' ? '#FFD700' : '#FF6B35';
            ctx.fillRect(this.x, this.y, this.w, this.h);
            // 拖尾光晕
            ctx.fillStyle = this.owner === 'player' ? 'rgba(255, 215, 0, 0.3)' : 'rgba(255, 107, 53, 0.3)';
            ctx.fillRect(this.x - 1, this.y - 1, this.w + 2, this.h + 2);
        }
    }

    // ===== 爆炸效果 =====
    class Explosion {
        constructor(x, y, size = 'medium') {
            this.x = x;
            this.y = y;
            this.size = size;
            this.life = size === 'tiny' ? 10 : (size === 'small' ? 15 : (size === 'huge' ? 40 : 25));
            this.maxLife = this.life;
            this.particles = [];

            const count = size === 'tiny' ? 5 : (size === 'small' ? 10 : (size === 'huge' ? 30 : 15));
            for (let i = 0; i < count; i++) {
                const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
                const speed = 1 + Math.random() * 3;
                this.particles.push({
                    x: 0, y: 0,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    size: 2 + Math.random() * 4
                });
            }
        }

        update() {
            this.life--;
            for (const p of this.particles) {
                p.x += p.vx;
                p.y += p.vy;
                p.vx *= 0.95;
                p.vy *= 0.95;
            }
        }

        draw() {
            const ratio = this.life / this.maxLife;
            ctx.save();
            ctx.translate(this.x, this.y);

            for (const p of this.particles) {
                const alpha = ratio;
                const r = 255;
                const g = Math.floor(150 + 100 * ratio);
                const b = Math.floor(50 * ratio);
                ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size * ratio, 0, Math.PI * 2);
                ctx.fill();
            }

            // 中心光晕
            if (this.size !== 'tiny') {
                const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, 30 * ratio);
                grad.addColorStop(0, `rgba(255, 255, 200, ${ratio * 0.8})`);
                grad.addColorStop(1, 'rgba(255, 100, 0, 0)');
                ctx.fillStyle = grad;
                ctx.fillRect(-40, -40, 80, 80);
            }

            ctx.restore();
        }

        get alive() {
            return this.life > 0;
        }
    }

    // ===== 分数弹出效果 =====
    class ScorePopup {
        constructor(x, y, score) {
            this.x = x;
            this.y = y;
            this.score = score;
            this.life = 60;
        }

        update() {
            this.y -= 0.5;
            this.life--;
        }

        draw() {
            const alpha = Math.min(1, this.life / 30);
            ctx.fillStyle = `rgba(255, 215, 0, ${alpha})`;
            ctx.font = 'bold 16px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('+' + this.score, this.x, this.y);
        }

        get alive() {
            return this.life > 0;
        }
    }

    // ===== 道具类 =====
    class PowerUp {
        constructor(x, y, type) {
            this.x = x;
            this.y = y;
            this.w = TILE_SIZE;
            this.h = TILE_SIZE;
            this.type = type; // 'star' | 'life' | 'shield' | 'bomb' | 'freeze'
            this.life = 600; // 10秒
            this.alive = true;
        }

        update() {
            this.life--;
            if (this.life <= 0) this.alive = false;

            if (game.player?.alive && rectCollision(this, game.player)) {
                this.collect();
            }
        }

        collect() {
            this.alive = false;
            game.score += 500;
            game.scorePopups.push(new ScorePopup(this.x + this.w/2, this.y + this.h/2, 500));

            switch (this.type) {
                case 'star':
                    game.player.upgrade();
                    break;
                case 'life':
                    game.lives++;
                    break;
                case 'shield':
                    game.player.shield = 300;
                    break;
                case 'bomb':
                    // 清除所有敌人
                    for (const e of game.enemies) {
                        if (e.alive) {
                            e.die();
                        }
                    }
                    game.shake = 15;
                    break;
                case 'freeze':
                    game.flashFreeze = 300;
                    break;
            }
        }

        draw() {
            if (!this.alive) return;
            // 闪烁
            if (this.life < 180 && Math.floor(this.life / 10) % 2 === 0) return;

            ctx.save();
            const cx = this.x + this.w/2;
            const cy = this.y + this.h/2;
            const pulse = 1 + Math.sin(Date.now() / 200) * 0.1;

            // 背景圆
            ctx.fillStyle = 'rgba(255, 215, 0, 0.3)';
            ctx.beginPath();
            ctx.arc(cx, cy, 14 * pulse, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#FFD700';
            ctx.strokeStyle = '#8B4513';
            ctx.lineWidth = 2;

            const symbols = {
                star: '★',
                life: '♥',
                shield: '🛡',
                bomb: '💣',
                freeze: '❄'
            };

            ctx.font = 'bold 20px monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(symbols[this.type] || '?', cx, cy);

            ctx.restore();
        }
    }

    // ===== 生成敌人 =====
    function spawnEnemy() {
        if (game.enemiesSpawned >= game.maxEnemies) return;
        if (game.enemies.filter(e => e.alive).length >= game.activeEnemies) return;

        // 选择一个未占用的出生点
        const availablePoints = game.spawnPoints.filter(p => {
            const rect = { x: p.x, y: p.y, w: TANK_SIZE, h: TANK_SIZE };
            if (game.player?.alive && rectCollision(rect, game.player)) return false;
            for (const e of game.enemies) {
                if (e.alive && rectCollision(rect, e)) return false;
            }
            return true;
        });

        if (availablePoints.length === 0) return;

        const point = availablePoints[randomInt(0, availablePoints.length - 1)];

        // 根据关卡和随机决定类型
        const types = ['basic', 'fast', 'armor', 'heavy'];
        const weights = [
            Math.max(40 - game.level * 5, 15),
            25,
            20 + game.level * 3,
            5 + game.level * 5
        ];
        const totalWeight = weights.reduce((a, b) => a + b, 0);
        let rand = Math.random() * totalWeight;
        let type = 'basic';
        for (let i = 0; i < types.length; i++) {
            rand -= weights[i];
            if (rand <= 0) {
                type = types[i];
                break;
            }
        }

        const enemy = new Tank(point.x, point.y, type);
        game.enemies.push(enemy);
        game.enemiesSpawned++;
    }

    // ===== 生成道具 =====
    function spawnPowerUp() {
        // 找一个空地
        let attempts = 50;
        while (attempts-- > 0) {
            const col = randomInt(1, GRID_SIZE - 2);
            const row = randomInt(1, GRID_SIZE - 2);
            if (game.map[row][col] === TILE.EMPTY) {
                const types = ['star', 'life', 'shield', 'bomb', 'freeze'];
                const type = types[randomInt(0, types.length - 1)];
                game.powerUps.push(new PowerUp(col * TILE_SIZE, row * TILE_SIZE, type));
                return;
            }
        }
    }

    // ===== 渲染地图 =====
    function drawMap() {
        for (let row = 0; row < GRID_SIZE; row++) {
            const rowData = game.map[row];
            if (!rowData) continue;
            for (let col = 0; col < GRID_SIZE; col++) {
                const tile = rowData[col];
                const x = col * TILE_SIZE;
                const y = row * TILE_SIZE;

                if (tile === TILE.BRICK) {
                    drawBrick(x, y);
                } else if (tile === TILE.STEEL) {
                    drawSteel(x, y);
                } else if (tile === TILE.WATER) {
                    drawWater(x, y);
                } else if (tile === TILE.BASE) {
                    drawBase(x, y);
                }
                // 草丛最后画，覆盖坦克
            }
        }
    }

    function drawBrick(x, y) {
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
        ctx.fillStyle = '#A0522D';
        ctx.fillRect(x + 1, y + 1, TILE_SIZE - 2, TILE_SIZE - 2);

        // 砖块纹路
        ctx.fillStyle = '#5D2906';
        ctx.fillRect(x, y + TILE_SIZE/2 - 1, TILE_SIZE, 2);
        ctx.fillRect(x + TILE_SIZE/4 - 1, y, 2, TILE_SIZE/2);
        ctx.fillRect(x + 3*TILE_SIZE/4 - 1, y + TILE_SIZE/2, 2, TILE_SIZE/2);
    }

    function drawSteel(x, y) {
        ctx.fillStyle = '#606060';
        ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
        ctx.fillStyle = '#909090';
        ctx.fillRect(x + 2, y + 2, TILE_SIZE - 4, TILE_SIZE - 4);
        ctx.fillStyle = '#404040';
        ctx.fillRect(x + 2, y + 2, TILE_SIZE - 4, 2);
        ctx.fillRect(x + 2, y + 2, 2, TILE_SIZE - 4);
        // 高光
        ctx.fillStyle = '#B0B0B0';
        ctx.fillRect(x + 4, y + 4, 4, 4);
        ctx.fillRect(x + TILE_SIZE - 8, y + TILE_SIZE - 8, 4, 4);
    }

    function drawWater(x, y) {
        const t = Date.now() / 500;
        ctx.fillStyle = '#1E90FF';
        ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
        ctx.fillStyle = '#87CEEB';
        for (let i = 0; i < 3; i++) {
            const offset = Math.sin(t + i) * 3;
            ctx.fillRect(x + 4 + offset, y + 6 + i * 10, 8, 2);
            ctx.fillRect(x + 18 - offset, y + 10 + i * 10, 8, 2);
        }
    }

    function drawGrass(x, y) {
        ctx.fillStyle = 'rgba(34, 139, 34, 0.7)';
        ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
        ctx.fillStyle = 'rgba(50, 205, 50, 0.6)';
        for (let i = 0; i < 6; i++) {
            const px = x + (i * 5 + 2) % TILE_SIZE;
            const py = y + (i * 7 + 4) % TILE_SIZE;
            ctx.fillRect(px, py, 3, 6);
        }
    }

    function drawBase(x, y) {
        if (!game.baseAlive) {
            // 摧毁的基地
            ctx.fillStyle = '#444';
            ctx.fillRect(x + 4, y + 4, TILE_SIZE - 8, TILE_SIZE - 8);
            ctx.fillStyle = '#666';
            ctx.font = '20px monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('💀', x + TILE_SIZE/2, y + TILE_SIZE/2);
            return;
        }
        // 基地图案 - 老鹰
        ctx.fillStyle = '#FFD700';
        ctx.fillRect(x + 2, y + 2, TILE_SIZE - 4, TILE_SIZE - 4);
        ctx.font = '22px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🦅', x + TILE_SIZE/2, y + TILE_SIZE/2);

        // 基地护盾效果
        if (game.baseShielded > 0) {
            ctx.strokeStyle = `rgba(0, 200, 255, ${0.6 + Math.sin(Date.now()/100) * 0.4})`;
            ctx.lineWidth = 2;
            ctx.strokeRect(x, y, TILE_SIZE, TILE_SIZE);
        }
    }

    function drawGrassLayer() {
        for (let row = 0; row < GRID_SIZE; row++) {
            const rowData = game.map[row];
            if (!rowData) continue;
            for (let col = 0; col < GRID_SIZE; col++) {
                if (rowData[col] === TILE.GRASS) {
                    drawGrass(col * TILE_SIZE, row * TILE_SIZE);
                }
            }
        }
    }

    // ===== 游戏控制 =====
    function startGame() {
        game.running = true;
        game.paused = false;
        game.gameOver = false;
        game.score = 0;
        game.lives = 3;
        game.level = 0;
        game.enemies = [];
        game.bullets = [];
        game.explosions = [];
        game.powerUps = [];
        game.scorePopups = [];

        startLevel();
        hideOverlay();
    }

    function startLevel() {
        loadLevel(game.level);
        game.enemiesSpawned = 0;
        game.enemiesLeft = game.maxEnemies;
        game.spawnTimer = 60;
        game.baseAlive = true;
        game.enemies = [];
        game.bullets = [];
        game.powerUps = [];

        respawnPlayer();
        updateHUD();
    }

    function respawnPlayer() {
        game.player = new Tank(game.playerSpawnPoint.x, game.playerSpawnPoint.y, 'player');
        game.player.shield = 120;
    }

    function nextLevel() {
        game.level++;
        showLevelComplete();
        setTimeout(() => {
            hideOverlay();
            startLevel();
        }, 2500);
    }

    function endGame(victory) {
        game.gameOver = true;
        game.running = false;
        showGameOver(victory);
    }

    function pauseGame() {
        game.paused = !game.paused;
        if (game.paused) {
            showPaused();
        } else {
            hideOverlay();
        }
    }

    // ===== UI 控制 =====
    function showOverlay(title, message, btnText = '继续') {
        overlayTitle.textContent = title;
        overlayMessage.innerHTML = message;
        startBtn.textContent = btnText;
        overlay.classList.remove('hidden');
    }

    function hideOverlay() {
        overlay.classList.add('hidden');
    }

    function showPaused() {
        showOverlay('游戏暂停', '按 <kbd>P</kbd> 继续游戏<br>按 <kbd>R</kbd> 重新开始', '继续');
    }

    function showLevelComplete() {
        showOverlay(
            `第 ${game.level} 关完成! ⭐`,
            `当前分数: <strong>${game.score}</strong><br>剩余生命: <strong>${game.lives}</strong><br><br>准备进入下一关...`,
            '继续'
        );
    }

    function showGameOver(victory) {
        const title = victory ? '🎉 游戏胜利!' : '💀 游戏结束';
        const msg = `最终分数: <strong>${game.score}</strong><br>到达关卡: <strong>${game.level + 1}</strong><br><br>${victory ? '你是真正的坦克王者!' : '基地或生命已经耗尽...'}`;
        showOverlay(title, msg, '再来一局');
    }

    function updateHUD() {
        document.getElementById('score').textContent = game.score;
        document.getElementById('lives').textContent = Math.max(0, game.lives);
        document.getElementById('level').textContent = game.level + 1;
        document.getElementById('enemies-left').textContent = Math.max(0, game.enemiesLeft);
    }

    // ===== 主循环 =====
    function update() {
        if (!game.running || game.paused) return;

        // 屏幕震动衰减
        if (game.shake > 0) game.shake--;
        if (game.flashFreeze > 0) game.flashFreeze--;
        if (game.baseShielded > 0) game.baseShielded--;

        // 玩家
        if (game.player) {
            game.player.update();
            if (game.keys['Space']) {
                game.player.shoot();
            }
        }

        // 敌人
        if (game.flashFreeze <= 0) {
            for (const e of game.enemies) {
                e.update();
            }
        }

        // 子弹
        for (const b of game.bullets) {
            b.update();
        }

        // 爆炸
        for (const exp of game.explosions) {
            exp.update();
        }

        // 道具
        for (const p of game.powerUps) {
            p.update();
        }

        // 分数弹出
        for (const sp of game.scorePopups) {
            sp.update();
        }

        // 清理死亡对象
        game.bullets = game.bullets.filter(b => b.alive);
        game.enemies = game.enemies.filter(e => e.alive || e.spawnTimer > 0);
        game.explosions = game.explosions.filter(e => e.alive);
        game.powerUps = game.powerUps.filter(p => p.alive);
        game.scorePopups = game.scorePopups.filter(s => s.alive);

        // 实际上敌人死了就移除
        game.enemies = game.enemies.filter(e => e.alive);

        // 生成敌人
        game.spawnTimer--;
        if (game.spawnTimer <= 0 && game.enemiesSpawned < game.maxEnemies) {
            spawnEnemy();
            game.spawnTimer = game.spawnInterval;
        }

        updateHUD();
    }

    function draw() {
        // 清屏
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

        // 屏幕震动
        ctx.save();
        if (game.shake > 0) {
            const sx = (Math.random() - 0.5) * game.shake;
            const sy = (Math.random() - 0.5) * game.shake;
            ctx.translate(sx, sy);
        }

        // 背景网格
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
        ctx.lineWidth = 1;
        for (let i = 0; i <= GRID_SIZE; i++) {
            ctx.beginPath();
            ctx.moveTo(i * TILE_SIZE, 0);
            ctx.lineTo(i * TILE_SIZE, CANVAS_SIZE);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(0, i * TILE_SIZE);
            ctx.lineTo(CANVAS_SIZE, i * TILE_SIZE);
            ctx.stroke();
        }

        // 地图
        drawMap();

        // 道具
        for (const p of game.powerUps) {
            p.draw();
        }

        // 坦克
        if (game.player?.alive) game.player.draw();
        for (const e of game.enemies) {
            e.draw();
        }

        // 子弹
        for (const b of game.bullets) {
            b.draw();
        }

        // 爆炸
        for (const exp of game.explosions) {
            exp.draw();
        }

        // 草丛覆盖
        drawGrassLayer();

        // 分数弹出
        for (const sp of game.scorePopups) {
            sp.draw();
        }

        // 冰冻效果
        if (game.flashFreeze > 0) {
            ctx.fillStyle = `rgba(135, 206, 250, ${Math.min(0.3, game.flashFreeze / 300)})`;
            ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 14px monospace';
            ctx.fillText('❄ 冰冻!', 10, 20);
        }

        ctx.restore();
    }

    function gameLoop() {
        try {
            update();
            draw();
        } catch (err) {
            console.error('Game loop error:', err);
        }
        requestAnimationFrame(gameLoop);
    }

    // ===== 输入处理 =====
    document.addEventListener('keydown', (e) => {
        game.keys[e.code] = true;

        if (e.code === 'KeyP' && game.running) {
            pauseGame();
            e.preventDefault();
        }
        if (e.code === 'KeyR') {
            startGame();
            e.preventDefault();
        }
        if (e.code === 'Space') {
            e.preventDefault();
        }
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
            e.preventDefault();
        }
    });

    document.addEventListener('keyup', (e) => {
        game.keys[e.code] = false;
    });

    startBtn.addEventListener('click', startGame);

    // 启动游戏循环
    gameLoop();
})();
