// =============================
// 이미지 로더
// =============================
function loadTexture(path) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = path;
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("이미지 로드 실패: " + path));
  });
}

// =============================
// 전역 상태 변수
// =============================
let enemies = [];
let lasers = [];
let explosions = [];
let keys = {};

let enemyLasers = [];
let enemyLaserImg;

// 게임 상태 관리
let score = 0;
let lives = 3;
let isGameOver = false;
let gameWon = false;

// 공격 쿨타임
let lastShotTime = 0;
const SHOT_DELAY = 200;

// 보스 관련 변수
let boss = null;
let isBossStage = false;

// 자원(이미지) 저장
let canvas, ctx;
let playerImg, playerLeftImg, playerRightImg;
let enemyImg, ufoImg;
let laserImg;
let lifeImg; 

let player = {};

window.onload = async () => {
  canvas = document.getElementById("myCanvas");
  ctx = canvas.getContext("2d");

  // =============================
  // 이미지 로드
  // =============================
  try {
    playerImg = await loadTexture("./assets/player.png");
    playerLeftImg = await loadTexture("./assets/playerLeft.png");
    playerRightImg = await loadTexture("./assets/playerRight.png");
    enemyImg = await loadTexture("./assets/enemyShip.png");
    ufoImg = await loadTexture("./assets/enemyUFO.png");
    laserImg = await loadTexture("./assets/laserRed.png");
    lifeImg = await loadTexture("./assets/life.png"); 
    enemyLaserImg = await loadTexture("./assets/laserGreen.png");
  } catch (err) {
    console.error(err);
    alert("이미지 로드 실패! assets 폴더를 확인해주세요.");
  }

  resetGame();

  // 키 입력 이벤트
  window.addEventListener("keydown", (e) => {
    keys[e.key] = true;
    if (isGameOver && e.key === "Enter") {
      resetGame();
    }
  });
  window.addEventListener("keyup", (e) => keys[e.key] = false);

  requestAnimationFrame(update);
};

// =============================
// 게임 초기화
// =============================
function resetGame() {
  score = 0;
  lives = 3;
  isGameOver = false;
  gameWon = false;
  lasers = [];
  explosions = [];
  lastShotTime = 0;
  
  enemyLasers = [];

  boss = null;
  isBossStage = false;

  player = {
    x: canvas.width / 2 - playerImg.width / 2,
    y: canvas.height - playerImg.height * 1.5,
    width: playerImg.width,
    height: playerImg.height,
  };

  createEnemies(canvas, enemyImg);
}

// =============================
// 메인 루프
// =============================
function update() {
  if (!isGameOver) {
    movePlayer(player, canvas);
    handleShooting();
    moveLasers();
    
    moveEnemyLasers();

    // 보스 유무에 따른 로직 분기
    if (!boss) moveEnemies();
    if (boss) updateBoss();

    checkCollisions();
  }

  drawScene(ctx, canvas);
  requestAnimationFrame(update);
}

// =============================
// 플레이어 이동
// =============================
function movePlayer(player, canvas) {
  const speed = 5;

  // 좌우 이동 (기본)
  if (keys["ArrowLeft"] || keys["a"]) player.x -= speed;
  if (keys["ArrowRight"] || keys["d"]) player.x += speed;

  // 상하 이동 (보스전에서만 잠금 해제!)
  if (boss) {
      if (keys["ArrowUp"] || keys["w"]) player.y -= speed;
      if (keys["ArrowDown"] || keys["s"]) player.y += speed;
  }

  // 화면 밖으로 나가지 않게 제한
  if (player.x < 0) player.x = 0;
  if (player.x + player.width > canvas.width) player.x = canvas.width - player.width;
  if (player.y < 0) player.y = 0;
  if (player.y + player.height > canvas.height) player.y = canvas.height - player.height;
}

// =============================
// 공격
// =============================
function handleShooting() {
  if (keys[" "]) {
    const currentTime = Date.now();
    if (currentTime - lastShotTime > SHOT_DELAY) {
      lasers.push({
        x: player.x + player.width / 2 - (laserImg.width / 2),
        y: player.y,
        width: laserImg.width,
        height: laserImg.height,
      });
      lastShotTime = currentTime;
    }
  }
}

// =============================
// 적 생성 및 이동
// =============================
function createEnemies(canvas, enemyImg) {
  enemies = [];
  const rows = 5;
  const cols = 5;
  const margin = 10;
  const startX = (canvas.width - (cols * enemyImg.width + (cols - 1) * margin)) / 2;
  const startY = 50;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      enemies.push({
        x: startX + c * (enemyImg.width + margin),
        y: startY + r * (enemyImg.height + margin),
        width: enemyImg.width,
        height: enemyImg.height,
      });
    }
  }
}

function moveEnemies() {
  enemies.forEach(enemy => enemy.y += 0.5);
}

// =============================
// 보스 (UFO) 로직
// =============================
function spawnBoss() {
    isBossStage = true;
    boss = {
        x: canvas.width / 2 - ufoImg.width / 2,
        y: 50,
        width: ufoImg.width,
        height: ufoImg.height,
        hp: 20,       // 체력
        maxHp: 20,
        vx: 3,        // X 속도
        vy: 0,        // Y 속도
        moveTimer: 0  // 방향 전환 타이머
    };
}

function updateBoss() {
    // 1. 랜덤 이동 로직
    boss.moveTimer--;
    if (boss.moveTimer <= 0) {
        // -5 ~ +5 사이 랜덤 속도
        boss.vx = (Math.random() - 0.5) * 10; 
        boss.vy = (Math.random() - 0.5) * 6;  
        boss.moveTimer = 60; // 1초마다 변경
    }

    boss.x += boss.vx;
    boss.y += boss.vy;

    // 2. 화면 밖으로 못 나가게 튕기기
    if (boss.x < 0) { boss.x = 0; boss.vx *= -1; }
    if (boss.x + boss.width > canvas.width) { boss.x = canvas.width - boss.width; boss.vx *= -1; }
    if (boss.y < 0) { boss.y = 0; boss.vy *= -1; }
    // 보스는 화면 절반 아래로는 안 내려오게 설정
    if (boss.y + boss.height > canvas.height / 2) { boss.y = canvas.height / 2 - boss.height; boss.vy *= -1; }

    if (typeof boss.shootTimer === 'undefined') {
        boss.shootTimer = 0;
    }

    // 보스 공격 로직
    boss.shootTimer--;
    if (boss.shootTimer <= 0) {
        // 레이저 발사!
        enemyLasers.push({
            x: boss.x + boss.width / 2 - enemyLaserImg.width / 2, // 보스 중앙
            y: boss.y + boss.height, // 보스 아래쪽
            width: enemyLaserImg.width,
            height: enemyLaserImg.height
        });

        // 다음 발사까지의 시간 (약 0.5초 ~ 1초 사이 랜덤하게 설정 가능)
        // 여기서는 40프레임(약 0.7초)마다 발사
        boss.shootTimer = 40; 
    }
  }

// =============================
// 충돌 감지
// =============================
function moveLasers() {
  lasers.forEach((l) => (l.y -= 10));
  lasers = lasers.filter((l) => l.y > -50);
}

function moveEnemyLasers() {
  // 레이저는 아래로 떨어짐 (속도 7)
  enemyLasers.forEach((l) => (l.y += 7));
  // 화면 밖으로 나가면 삭제
  enemyLasers = enemyLasers.filter((l) => l.y < canvas.height);
}

function checkCollisions() {
  // 1. 레이저 충돌 처리
  lasers.forEach((laser, li) => {
    // 쫄병 맞춤
    enemies.forEach((enemy, ei) => {
      if (checkRectCollision(laser, enemy)) {
        createExplosion(enemy.x + enemy.width/2, enemy.y + enemy.height/2);
        enemies.splice(ei, 1);
        lasers.splice(li, 1);
        score += 100;
      }
    });
    
    // 보스 맞춤
    if (boss && checkRectCollision(laser, boss)) {
        createExplosion(boss.x + boss.width/2, boss.y + boss.height/2 + 20);
        lasers.splice(li, 1);
        boss.hp--;
        
        if (boss.hp <= 0) {
            // [포인트] 보스 처치 시 2000점 획득!
            score += 2000;
            
            boss = null;
            isGameOver = true;
            gameWon = true;
        }
    }
  });

  // 2. 적 -> 플레이어 충돌 (목숨 감소)
  enemies.forEach((enemy, ei) => {
    if (checkRectCollision(player, enemy)) {
        createExplosion(player.x + player.width/2, player.y + player.height/2);
        enemies.splice(ei, 1); 
        loseLife();
    }
  });

  //보스 레이저 -> 플레이어 충돌 처리
  enemyLasers.forEach((laser, li) => {
      if (checkRectCollision(player, laser)) {
          // 플레이어 위치에 폭발 이펙트
          createExplosion(player.x + player.width/2, player.y + player.height/2);
          
          // 레이저 삭제
          enemyLasers.splice(li, 1);
          
          // 목숨 감소
          loseLife();
      }
  });

  // 3. 보스 -> 플레이어 충돌 (목숨 감소 + 튕겨내기)
  if (boss && checkRectCollision(player, boss)) {
      createExplosion(player.x + player.width/2, player.y + player.height/2);
      loseLife();
      
      // 안전지대로 리스폰
      player.x = canvas.width / 2 - playerImg.width / 2;
      player.y = canvas.height - playerImg.height * 1.5;
  }

  // 보스 등장 조건
  if (enemies.length === 0 && !isBossStage && !gameWon) {
      spawnBoss();
  }

  // 폭발 애니메이션
  explosions.forEach((ex) => {
    ex.radius += 2;
    ex.alpha -= 0.05;
  });
  explosions = explosions.filter((ex) => ex.alpha > 0);
}

function loseLife() {
    lives--; 
    if (lives <= 0) {
        lives = 0;
        isGameOver = true;
        gameWon = false;
    }
}

function checkRectCollision(r1, r2) {
    return (
        r1.x < r2.x + r2.width &&
        r1.x + r1.width > r2.x &&
        r1.y < r2.y + r2.height &&
        r1.y + r1.height > r2.y
    );
}

function createExplosion(x, y) {
    explosions.push({ x: x, y: y, radius: 1, alpha: 1 });
}

// =============================
// 화면 그리기
// =============================
function drawScene(ctx, canvas) {
  // 배경
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 적
  enemies.forEach((enemy) => {
    ctx.drawImage(enemyImg, enemy.x, enemy.y);
  });

  // 보스
  if (boss) {
      ctx.drawImage(ufoImg, boss.x, boss.y);
      // 체력바
      ctx.fillStyle = "gray";
      ctx.fillRect(boss.x, boss.y - 15, boss.width, 10);
      ctx.fillStyle = "red";
      ctx.fillRect(boss.x, boss.y - 15, boss.width * (boss.hp / boss.maxHp), 10);
  }

  // 플레이어
  if (lives > 0) {
    let currentImg = playerImg;
    if (keys["ArrowLeft"] || keys["a"]) currentImg = playerLeftImg;
    else if (keys["ArrowRight"] || keys["d"]) currentImg = playerRightImg;
    ctx.drawImage(currentImg, player.x, player.y);
  }

  // 레이저 & 폭발
  lasers.forEach((l) => ctx.drawImage(laserImg, l.x, l.y));
  enemyLasers.forEach((l) => ctx.drawImage(enemyLaserImg, l.x, l.y));
  explosions.forEach((ex) => {
    ctx.beginPath();
    ctx.arc(ex.x, ex.y, ex.radius, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255,200,50,${ex.alpha})`;
    ctx.fill();
  });

  drawUI(ctx, canvas);
}

// =============================
// UI 그리기
// =============================
function drawUI(ctx, canvas) {
  // 점수
  ctx.fillStyle = "white";
  ctx.font = "20px Arial";
  ctx.textAlign = "left";
  ctx.fillText(`Points: ${score}`, 20, canvas.height - 20);

  // 보스전 알림
  if (boss) {
      ctx.fillStyle = "yellow";
      ctx.textAlign = "center";
      ctx.fillText("BOSS BATTLE!!", canvas.width/2, 30);
  }

  // 생명 아이콘 그리기 (life.png)
  if (lifeImg) {
    const iconSize = 30; 
    for (let i = 0; i < lives; i++) {
        ctx.drawImage(
            lifeImg, 
            canvas.width - 50 - (i * 40),
            canvas.height - 50, 
            iconSize, 
            iconSize
        );
    }
  }

  // 종료 화면
  if (isGameOver) {
    ctx.fillStyle = "black"; 
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.font = "20px Arial";
    ctx.textAlign = "center";

    if (gameWon) {
      ctx.fillStyle = "green";
      ctx.fillText("Victory!!! Pew Pew... - Press [Enter] to start a new game Captain Pew Pew", canvas.width / 2, canvas.height / 2);
    } else {
      ctx.fillStyle = "red";
      ctx.fillText("You died !!! Press [Enter] to start a new game Captain Pew Pew", canvas.width / 2, canvas.height / 2);
    }
  }
}