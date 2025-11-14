function setupCanvas(socket, roomId, username) { 
  const drawCanvas = document.getElementById("drawingCanvas");
  const drawCtx = drawCanvas.getContext("2d");

  const cursorCanvas = document.getElementById("cursorCanvas");
  const cursorCtx = cursorCanvas.getContext("2d");

  // Match sizes
  drawCanvas.width = cursorCanvas.width = window.innerWidth;
  drawCanvas.height = cursorCanvas.height = window.innerHeight - 60;

  let otherCursors = {};
  let lastCursorEmit = 0;

  let drawing = false;
  let color = document.getElementById("colorPicker").value;
  let size = document.getElementById("brushSize").value;

  document.getElementById("colorPicker").addEventListener("change", (e) => {
    color = e.target.value;
  });

  document.getElementById("brushSize").addEventListener("input", (e) => {
    size = e.target.value;
  });

  // Unified mousemove handler
  drawCanvas.addEventListener("mousemove", (e) => {
    const rect = drawCanvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const now = Date.now();
    if (now - lastCursorEmit > 30) {
      socket.emit("cursor", { x, y });
      lastCursorEmit = now;
    }

    if (drawing) {
      const stroke = { x, y, color, size };
      drawStroke(stroke);
      socket.emit("stroke", stroke);
    }
  });

  drawCanvas.addEventListener("mousedown", () => drawing = true);
  drawCanvas.addEventListener("mouseup", () => {
    drawing = false;
    drawCtx.beginPath();
  });

  function drawStroke({ x, y, color, size }) {
    drawCtx.fillStyle = color;
    drawCtx.beginPath();
    drawCtx.arc(x, y, size / 2, 0, Math.PI * 2);
    drawCtx.fill();
  }

  function drawOtherCursors() {
    cursorCtx.clearRect(0, 0, cursorCanvas.width, cursorCanvas.height);

    Object.values(otherCursors).forEach(cursor => {
      cursorCtx.beginPath();
      cursorCtx.fillStyle = "blue";
      cursorCtx.arc(cursor.x, cursor.y, 6, 0, Math.PI * 2);
      cursorCtx.fill();

      cursorCtx.fillStyle = "black";
      cursorCtx.font = "12px Arial";
      cursorCtx.fillText(cursor.username, cursor.x + 10, cursor.y + 4);
    });
  }

  socket.on("stroke", (stroke) => {
    drawStroke(stroke);
  });

  document.getElementById("clearBtn").addEventListener("click", () => {
    drawCtx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
    cursorCtx.clearRect(0, 0, cursorCanvas.width, cursorCanvas.height);
    socket.emit("clear-room");
  });

  socket.on("clear-canvas", () => {
    drawCtx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
    cursorCtx.clearRect(0, 0, cursorCanvas.width, cursorCanvas.height);
  });

  socket.on("init-canvas", (strokes) => {
    drawCtx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);

    for (const s of strokes) {
      drawStroke(s);
    }

    drawOtherCursors();
  });

  const roomNameEl = document.getElementById("roomName");
  if (roomNameEl) roomNameEl.textContent = `Room: ${roomId}`;

  function updateUserList(userNames = []) {
    const userListEl = document.getElementById("userList");
    if (!userListEl) return;

    userListEl.innerHTML = "";

    userNames.forEach((name) => {
      const li = document.createElement("li");
      li.textContent = name === username ? `${name} (You)` : name;
      userListEl.appendChild(li);
    });
  }

  socket.on("update-user-list", (userNames) => {
    updateUserList(userNames);
  });

  socket.on("cursor", (data) => {
    otherCursors[data.id] = {
      username: data.username,
      x: data.x,
      y: data.y
    };

    drawOtherCursors();
  });

  socket.on("user-left", (user) => {
    delete otherCursors[user.id];
    drawOtherCursors();
  });

  updateUserList([username]);
}

// Make function globally available
window.setupCanvas = setupCanvas;
