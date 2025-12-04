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
// 전역 상태
// =============================
let enemies = [];
let lasers = [];
let explosions = [];
let keys = {};

window.onload = async () => {
  const canvas = document.getElementById("myCanvas");
  const ctx = canvas.getContext("2d");

  // 이미지 로드
  const playerImg = await loadTexture("./assets/player.png");
  const enemyImg = await loadTexture("./assets/enemyShip.png");

  // 플레이어 설정 (정중앙)
  const player = {
    x: canvas.width / 2 - playerImg.width / 2,
    y: canvas.height - playerImg.height * 1.5,
    width: playerImg.width,
    height: playerImg.height,
  };

  createEnemies(canvas, enemyImg);

  // 자동 레이저 발사
  setInterval(() => {
    lasers.push({
      x: player.x + player.width / 2 - 1,
      y: player.y,
      width: 3,
      height: 15,
    });
  }, 450);

  // 키 입력 이벤트
  window.addEventListener("keydown", (e) => keys[e.key] = true);
  window.addEventListener("keyup", (e) => keys[e.key] = false);

  update();

  // 게임 루프
  function update() {
    movePlayer(player, canvas);
    moveLasers();
    checkCollisions();

    drawScene(ctx, canvas, player, playerImg, enemyImg);
    requestAnimationFrame(update);
  }
};

// =============================
// 플레이어 이동 처리
// =============================
function movePlayer(player, canvas) {
  const speed = 5;

  if (keys["ArrowLeft"] || keys["a"]) player.x -= speed;
  if (keys["ArrowRight"] || keys["d"]) player.x += speed;

  if (player.x < 0) player.x = 0;
  if (player.x + player.width > canvas.width)
    player.x = canvas.width - player.width;
}

// =============================
// 적 생성(중앙 정렬)
// =============================
function createEnemies(canvas, enemyImg) {
  enemies = [];

  const rows = 5;
  const cols = 5;
  const margin = 10;

  const totalW = cols * enemyImg.width + (cols - 1) * margin;
  const startX = (canvas.width - totalW) / 2;
  const startY = 80;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      enemies.push({
        x: startX + c * (enemyImg.width + margin),
        y: startY + r * (enemyImg.height + margin),
        width: enemyImg.width,
        height: enemyImg.height
      });
    }
  }
}

// =============================
// 레이저 이동
// =============================
function moveLasers() {
  lasers.forEach(l => l.y -= 10);
  lasers = lasers.filter(l => l.y > -20);
}

// =============================
// 충돌 감지 + 폭발 효과
// =============================
function checkCollisions() {
  lasers.forEach((laser, li) => {
    enemies.forEach((enemy, ei) => {
      if (
        laser.x < enemy.x + enemy.width &&
        laser.x + laser.width > enemy.x &&
        laser.y < enemy.y + enemy.height &&
        laser.y + laser.height > enemy.y
      ) {
        explosions.push({
          x: enemy.x + enemy.width / 2,
          y: enemy.y + enemy.height / 2,
          radius: 1,
          alpha: 1
        });

        enemies.splice(ei, 1);
        lasers.splice(li, 1);
      }
    });
  });

  explosions.forEach(ex => {
    ex.radius += 2;
    ex.alpha -= 0.05;
  });
  explosions = explosions.filter(ex => ex.alpha > 0);
}

// =============================
// 씬 그리기
// =============================
function drawScene(ctx, canvas, player, playerImg, enemyImg) {
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  enemies.forEach(enemy => {
    ctx.drawImage(enemyImg, enemy.x, enemy.y);
  });

  ctx.drawImage(playerImg, player.x, player.y);

  ctx.fillStyle = "red";
  lasers.forEach(l => {
    ctx.fillRect(l.x, l.y, l.width, l.height);
  });

  explosions.forEach(ex => {
    ctx.beginPath();
    ctx.arc(ex.x, ex.y, ex.radius, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255,255,255,${ex.alpha})`;
    ctx.fill();
  });
}
