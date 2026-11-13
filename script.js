
const board = document.getElementById("board");
const scoreEl = document.getElementById("score");
const timeEl = document.getElementById("time");
const poppedEl = document.getElementById("popped");
const recordEl = document.getElementById("record");
const levelEl = document.getElementById("level");
const progressBar = document.getElementById("progressBar");
const progressText = document.getElementById("progressText");
const message = document.getElementById("message");

const ROWS = 9;
const COLS = 9;

const COLORS = ["red", "blue", "green", "purple", "orange"];

let grid = [];
let score = 0;
let popped = 0;
let time = 90;
let level = 1;
let running = false;
let timer = null;
let selectedGroup = [];
let record = Number(localStorage.getItem("bubbleRecord")) || 0;

recordEl.textContent = record;

function randomColor() {
  return COLORS[Math.floor(Math.random() * COLORS.length)];
}

function createGrid() {
  grid = [];

  for (let r = 0; r < ROWS; r++) {
    const row = [];

    for (let c = 0; c < COLS; c++) {
      let color;

      do {
        color = randomColor();
      } while (
        (c >= 2 &&
          row[c - 1] === color &&
          row[c - 2] === color) ||
        (r >= 2 &&
          grid[r - 1][c] === color &&
          grid[r - 2][c] === color)
      );

      row.push(color);
    }

    grid.push(row);
  }
}

function renderBoard() {
  board.innerHTML = "";

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const cell = document.createElement("button");

      cell.type = "button";
      cell.className = `cell ${grid[r][c] || "empty"}`;
      cell.setAttribute("aria-label", `${r + 1}-qator, ${c + 1}-ustun`);

      if (selectedGroup.some(p => p.r === r && p.c === c)) {
        cell.classList.add("selected");
      }

      cell.addEventListener("click", () => handleCellClick(r, c));

      board.appendChild(cell);
    }
  }
}

function getGroup(startR, startC) {
  const color = grid[startR][startC];

  if (!color) return [];

  const stack = [{ r: startR, c: startC }];
  const visited = new Set();
  const group = [];

  while (stack.length) {
    const current = stack.pop();
    const key = `${current.r},${current.c}`;

    if (visited.has(key)) continue;
    visited.add(key);

    const { r, c } = current;

    if (
      r < 0 || r >= ROWS ||
      c < 0 || c >= COLS ||
      grid[r][c] !== color
    ) continue;

    group.push({ r, c });

    stack.push(
      { r: r - 1, c },
      { r: r + 1, c },
      { r, c: c - 1 },
      { r, c: c + 1 }
    );
  }

  return group;
}

function handleCellClick(r, c) {
  if (!running || !grid[r][c]) return;

  const group = getGroup(r, c);

  if (group.length < 3) {
    selectedGroup = [];
    renderBoard();
    return;
  }

  selectedGroup = group;
  renderBoard();

  setTimeout(() => {
    if (!running) return;

    group.forEach(point => {
      grid[point.r][point.c] = null;
    });

    const count = group.length;
    const gained = count * 10 + Math.max(0, count - 3) * 5;

    score += gained;
    popped += count;

    applyGravity();
    refillBoard();
    updateStats();
    selectedGroup = [];
    renderBoard();

    if (isBoardBlocked()) {
      createGrid();
      renderBoard();
    }

  }, 150);
}

function applyGravity() {
  for (let c = 0; c < COLS; c++) {
    const remaining = [];

    for (let r = ROWS - 1; r >= 0; r--) {
      if (grid[r][c]) {
        remaining.push(grid[r][c]);
      }
    }

    for (let r = ROWS - 1; r >= 0; r--) {
      grid[r][c] = remaining[ROWS - 1 - r] || null;
    }
  }
}

function refillBoard() {
  for (let c = 0; c < COLS; c++) {
    for (let r = 0; r < ROWS; r++) {
      if (!grid[r][c]) {
        grid[r][c] = randomColor();
      }
    }
  }
}

function isBoardBlocked() {
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (grid[r][c] && getGroup(r, c).length >= 3) {
        return false;
      }
    }
  }

  return true;
}

function updateStats() {
  scoreEl.textContent = score;
  poppedEl.textContent = popped;
  timeEl.textContent = time;

  level = Math.floor(score / 150) + 1;
  levelEl.textContent = level + "-DARAJA";

  const progress = score % 150;
  progressBar.style.width = (progress / 150 * 100) + "%";
  progressText.textContent = progress + " / 150";

  if (score > record) {
    record = score;
    localStorage.setItem("bubbleRecord", record);
    recordEl.textContent = record;
  }
}

function finishGame(title) {
  if (!running) return;

  running = false;
  clearInterval(timer);

  message.style.display = "flex";
  message.innerHTML = `
    <div class="message-icon">🏆</div>
    <h2>${title}</h2>
    <p>
      To‘plangan ball: <b style="color:#ffd21f">${score}</b><br>
      Portlatilgan pufakchalar: <b style="color:#ffd21f">${popped}</b><br>
      Rekord: <b style="color:#ffd21f">${record}</b>
    </p>
    <button id="startBtn">QAYTA O‘YNASH</button>
  `;

  document.getElementById("startBtn").addEventListener("click", startGame);
}

function startGame() {
  clearInterval(timer);

  score = 0;
  popped = 0;
  time = 90;
  level = 1;
  selectedGroup = [];

  createGrid();
  updateStats();
  renderBoard();

  running = true;
  message.style.display = "none";

  timer = setInterval(() => {
    if (!running) return;

    time--;
    updateStats();

    if (time <= 0) {
      finishGame("Vaqt tugadi!");
    }
  }, 1000);
}

document.getElementById("startBtn").addEventListener("click", startGame);
document.getElementById("restartBtn").addEventListener("click", startGame);

document.getElementById("helpBtn").addEventListener("click", () => {
  message.style.display = "flex";
  message.innerHTML = `
    <div class="message-icon">📖</div>
    <h2>O‘YIN QOIDALARI</h2>
    <p>
      1. Bir xil rangdagi kamida 3 ta yonma-yon pufakchani toping.<br>
      2. Ularning birini bosing.<br>
      3. Pufakchalar yo‘qoladi va yangilari paydo bo‘ladi.<br>
      4. Katta guruhlar ko‘proq ball beradi.<br>
      5. 90 soniyada imkon qadar ko‘p ball yig‘ing!
    </p>
    <button id="continueBtn">O‘YINGA QAYTISH</button>
  `;

  document.getElementById("continueBtn").addEventListener("click", () => {
    message.style.display = "none";
  });
});
