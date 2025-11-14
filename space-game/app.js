// 이미지 로더 (에러 처리 포함)
function loadTexture(path) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = path;
    img.onload = () => {
      console.log("이미지 로드 완료:", path);
      resolve(img);
    };
    img.onerror = () => {
      reject(new Error("이미지 로드 실패: " + path));
    };
  });
}

window.onload = async () => {
  const canvas = document.getElementById("myCanvas");
  const ctx = canvas.getContext("2d");

  try {
    // ★ 배경, 플레이어, 적 이미지 로드
    const spaceBgImg = await loadTexture("./assets/starBackground.png"); 
    const heroImg    = await loadTexture("./assets/player.png");
    const enemyImg   = await loadTexture("./assets/enemyShip.png");

    // 3. 별이 있는 우주 배경 (createPattern 사용)
    let pattern = null;
    try {
      pattern = ctx.createPattern(spaceBgImg, "repeat");
    } catch (e) {
      console.error("createPattern 에러:", e);
    }

    if (pattern) {
      ctx.fillStyle = pattern;
    } else {
      ctx.fillStyle = "black";
    }
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 1. 플레이어 우주선 + 양옆 보조 우주선 2기
    const centerX = canvas.width / 2;
    const mainY = canvas.height - heroImg.height * 2;

    const mainX = centerX - heroImg.width / 2;
    ctx.drawImage(heroImg, mainX, mainY);

    const subScale = 0.6;
    const subW = heroImg.width * subScale;
    const subH = heroImg.height * subScale;
    const gap = 40;

    const subY = mainY + (heroImg.height - subH);

    const leftX = mainX - gap - subW;
    const rightX = mainX + heroImg.width + gap;

    ctx.drawImage(heroImg, leftX, subY, subW, subH);
    ctx.drawImage(heroImg, rightX, subY, subW, subH);

    // 2. 적군 우주선 피라미드 배치
    createEnemies2(ctx, canvas, enemyImg);

  } catch (err) {
    console.error("메인 루프 에러:", err);
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "white";
    ctx.font = "20px Arial";
    ctx.fillText("에러 발생: 콘솔을 확인하세요", 20, 40);
  }
};

// enemy 우주선 피라미드 (위가 가장 넓고 아래로 갈수록 좁아지는 형태)
function createEnemies2(ctx, canvas, enemyImg) {
  const enemyW = enemyImg.width;
  const enemyH = enemyImg.height;

  const startY = 40;
  const gapX = 8;
  const gapY = 10;

  const countsPerRow = [5, 4, 3, 2, 1];  // 원하는 피라미드 형태

  countsPerRow.forEach((count, row) => {
    const totalWidth = count * enemyW + (count - 1) * gapX;
    const startX = (canvas.width - totalWidth) / 2;
    const y = startY + row * (enemyH + gapY);

    for (let i = 0; i < count; i++) {
      const x = startX + i * (enemyW + gapX);
      ctx.drawImage(enemyImg, x, y);
    }
  });
}
