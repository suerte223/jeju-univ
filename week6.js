let plantList = []; 
let topZ = 1;       

function dragElement(terrariumElement) {
  let pos1 = 0,
      pos2 = 0,
      pos3 = 0,
      pos4 = 0;

  terrariumElement.style.position = "absolute";
  terrariumElement.style.zIndex = topZ++;

  plantList.push(terrariumElement);

  terrariumElement.onpointerdown = pointerDrag;

  terrariumElement.ondblclick = function () {
    bringToFront(terrariumElement);
  };

  function pointerDrag(e) {
    e.preventDefault();
    pos3 = e.clientX;
    pos4 = e.clientY;
    document.onpointermove = elementDrag;
    document.onpointerup = stopElementDrag;
  }

  function elementDrag(e) {
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;

    terrariumElement.style.left = (terrariumElement.offsetLeft - pos1) + "px";
    terrariumElement.style.top = (terrariumElement.offsetTop - pos2) + "px";
  }

  function stopElementDrag() {
    document.onpointermove = null;
    document.onpointerup = null;
  }
}

function bringToFront(target) {
  const maxZ = Math.max(...plantList.map(p => parseInt(p.style.zIndex) || 0), 0);
  target.style.zIndex = maxZ + 1;
  console.log(`${target.id} 맨 앞으로 올라감 (z-index: ${maxZ + 1})`);
}

document.addEventListener("DOMContentLoaded", () => {
  for (let i = 1; i <= 14; i++) {
    const plant = document.getElementById(`plant${i}`);
    if (plant) dragElement(plant);
  }
});
