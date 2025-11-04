let topZ = 1;

function bringToFront(el) {
  // 식물끼리만 위로 (유리 z=30보다 낮게 유지됨)
  el.style.zIndex = String(++topZ);
}

function registerDropZone(zone) {
  zone.addEventListener("dragenter", (e) => {
    e.preventDefault();
    zone.classList.add("dragover");
  });

  zone.addEventListener("dragover", (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  });

  zone.addEventListener("dragleave", () => {
    zone.classList.remove("dragover");
  });

  zone.addEventListener("drop", (e) => {
    e.preventDefault();
    zone.classList.remove("dragover");

    const plantId = e.dataTransfer.getData("text/plain");
    const plant = document.getElementById(plantId);
    if (!plant) return;

    if (zone.id === "terrarium") {
      // 1) 병 내부 기준 박스 찾기 (.jar-walls)
      const glass = zone.querySelector(".jar-walls");
      const terrRect = zone.getBoundingClientRect();
      const glassRect = glass ? glass.getBoundingClientRect() : terrRect;

      // 2) 현재 보이는 크기를 px로 잠궈서 커지는 문제 방지
      const cs = getComputedStyle(plant);
      plant.style.width = cs.width;
      plant.style.height = "auto";
      plant.style.maxWidth = "none";

      // 3) 병 내부 좌표로 변환 (jar-walls 기준)
      const cursorX = e.clientX - glassRect.left;
      const cursorY = e.clientY - glassRect.top;

      // 4) 최종 left/top은 terrarium 기준이므로 jar-walls의 오프셋을 더함
      const jarOffsetLeft = glassRect.left - terrRect.left;
      const jarOffsetTop  = glassRect.top  - terrRect.top;

      // 5) 배치
      zone.appendChild(plant);
      plant.style.position = "absolute";

      const imgW = parseFloat(plant.style.width) || plant.width || 80;
      const imgH = (plant.naturalWidth && plant.naturalHeight)
        ? (imgW * plant.naturalHeight / plant.naturalWidth)
        : (plant.height || 80);

      // 6) 병 내부 범위로 클램프
      const clampedX = Math.max(0, Math.min(cursorX - imgW / 2, glassRect.width  - imgW));
      const clampedY = Math.max(0, Math.min(cursorY - imgH / 2, glassRect.height - imgH));

      plant.style.left = (jarOffsetLeft + clampedX) + "px";
      plant.style.top  = (jarOffsetTop  + clampedY) + "px";

      // 자동 최상위 금지 (더블클릭 때만 bringToFront)
    } else {
      // 패널로 되돌리기: 흐름 레이아웃 복구
      const holder = document.createElement("div");
      holder.className = "plant-holder";

      plant.style.position = "";
      plant.style.left = "";
      plant.style.top = "";
      plant.style.zIndex = "";
      plant.style.width = "";
      plant.style.height = "";
      plant.style.maxWidth = "";

      holder.appendChild(plant);
      zone.appendChild(holder);
    }
  });
}

function makePlantDraggable(plant) {
  plant.setAttribute("draggable", "true");

  plant.addEventListener("dragstart", (e) => {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", plant.id);
    plant.classList.add("dragging");

    try {
      const offsetX = Math.floor((plant.width || 80) / 2);
      const offsetY = Math.floor((plant.height || 80) / 2);
      e.dataTransfer.setDragImage(plant, offsetX, offsetY);
    } catch (_) {}
  });

  plant.addEventListener("dragend", () => {
    plant.classList.remove("dragging");
  });

  // 더블클릭 시에만 맨 앞으로 (유리보다 위로는 못 감)
  plant.addEventListener("dblclick", () => bringToFront(plant));
}

document.addEventListener("DOMContentLoaded", () => {
  // 드래그 가능한 식물 등록
  for (let i = 1; i <= 14; i++) {
    const p = document.getElementById(`plant${i}`);
    if (p) makePlantDraggable(p);
  }

  // 드롭 존 등록
  const terrarium = document.getElementById("terrarium");
  const left = document.getElementById("left-container");
  const right = document.getElementById("right-container");
  [terrarium, left, right].forEach((z) => z && registerDropZone(z));
});
