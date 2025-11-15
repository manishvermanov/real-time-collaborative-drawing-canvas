function setupCanvas(socket, roomId, username) {
  const drawCanvas = document.getElementById("drawingCanvas");
  const drawCtx = drawCanvas.getContext("2d");

  const cursorCanvas = document.getElementById("cursorCanvas");
  const cursorCtx = cursorCanvas.getContext("2d");

  const wrapper = document.getElementById("canvasWrapper");

  let strokeCounter = 0;
  let currentStrokeId = null;

  
  // POSITION HELPER (mouse + touch)

  function getPos(e) {
    const rect = drawCanvas.getBoundingClientRect();

    if (e.touches) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top
      };
    }

    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  }

 
  // AUTO-RESIZE CANVAS
 
  function resizeCanvas() {
    const rect = wrapper.getBoundingClientRect();
    drawCanvas.width = cursorCanvas.width = rect.width;
    drawCanvas.height = cursorCanvas.height = rect.height;
  }

  resizeCanvas();

  
    // UNDO / REDO BUTTONS
  
  document.getElementById("undoBtn").addEventListener("click", () => {
    socket.emit("undo");
  });

  document.getElementById("redoBtn").addEventListener("click", () => {
    socket.emit("redo");
  });

  
    // STATE

  let otherCursors = {};
  let myCursor = { x: null, y: null };
  let lastCursorEmit = 0;

  let drawing = false;
  let lastX = null;
  let lastY = null;

  let color = document.getElementById("colorPicker").value;
  let size = Number(document.getElementById("brushSize").value);

  let currentTool = "brush";

  const brushBtn = document.getElementById("brushBtn");
  const eraserBtn = document.getElementById("eraserBtn");

 
  function updateToolButtons() {
    brushBtn.classList.remove("tool-selected");
    eraserBtn.classList.remove("tool-selected");

    if (currentTool === "brush") brushBtn.classList.add("tool-selected");
    if (currentTool === "eraser") eraserBtn.classList.add("tool-selected");
  }

  updateToolButtons();

  brushBtn.addEventListener("click", () => {
    currentTool = "brush";
    updateToolButtons();
  });

  eraserBtn.addEventListener("click", () => {
    currentTool = "eraser";
    updateToolButtons();
  });


  document.getElementById("colorPicker").addEventListener("change", (e) => {
    color = e.target.value;
  });

  document.getElementById("brushSize").addEventListener("input", (e) => {
    size = Number(e.target.value);
  });


    // DRAWING LOGIC (Brush and Eraser)
 
  function drawStroke({ x, y, lastX, lastY, color, size }) {
    drawCtx.strokeStyle = color;
    drawCtx.lineWidth = size;
    drawCtx.lineCap = "round";
    drawCtx.lineJoin = "round";

    drawCtx.beginPath();

    if (lastX === null || lastY === null) {
      drawCtx.moveTo(x, y);
      drawCtx.lineTo(x, y);
    } else {
      drawCtx.moveTo(lastX, lastY);
      drawCtx.lineTo(x, y);
    }

    drawCtx.stroke();
  }

 
  //  CURSOR RENDERING (Self and Others)
  
  function renderCursors() {
    cursorCtx.clearRect(0, 0, cursorCanvas.width, cursorCanvas.height);

    // Other users
    Object.values(otherCursors).forEach(cursor => {
      cursorCtx.fillStyle = cursor.color;
      cursorCtx.beginPath();
      cursorCtx.arc(cursor.x, cursor.y, 6, 0, Math.PI * 2);
      cursorCtx.fill();

      cursorCtx.fillStyle = cursor.color;
      cursorCtx.font = "12px Arial";
      cursorCtx.fillText(cursor.username, cursor.x + 10, cursor.y + 4);
    });

    if (myCursor.x == null || myCursor.y == null) return;

    // Eraser cursor
    if (currentTool === "eraser") {
      const cursorSize = size * 2;

      cursorCtx.strokeStyle = "#888";
      cursorCtx.lineWidth = 2;

      cursorCtx.strokeRect(
        myCursor.x - cursorSize / 2,
        myCursor.y - cursorSize / 2,
        cursorSize,
        cursorSize
      );
    }

    // Brush cursor
    if (currentTool === "brush") {
      cursorCtx.strokeStyle = color;
      cursorCtx.lineWidth = 2;

      cursorCtx.beginPath();
      cursorCtx.moveTo(myCursor.x, myCursor.y);
      cursorCtx.lineTo(myCursor.x + 14, myCursor.y - 18);
      cursorCtx.stroke();

      cursorCtx.beginPath();
      cursorCtx.arc(myCursor.x, myCursor.y, size / 2, 0, Math.PI * 2);
      cursorCtx.stroke();
    }
  }


    // MAIN MOVEMENT HANDLER (Mouse and Touch)

  function handleMove(e) {
    e.preventDefault();
    const { x, y } = getPos(e);

    myCursor.x = x;
    myCursor.y = y;
    renderCursors();

    // cursor emit
    const now = Date.now();
    if (now - lastCursorEmit > 30) {
      socket.emit("cursor", { x, y });
      lastCursorEmit = now;
    }

    if (!drawing) return;

    let strokeColor = currentTool === "eraser" ? "#ffffff" : color;
    let strokeSize = currentTool === "eraser" ? size * 2 : size;

    const stroke = {
      strokeId: currentStrokeId,
      x,
      y,
      lastX,
      lastY,
      color: strokeColor,
      size: strokeSize
    };

    drawStroke(stroke);
    socket.emit("stroke", stroke);

    lastX = x;
    lastY = y;
  }

  
    // MOUSE and  TOUCH EVENTS

  drawCanvas.addEventListener("mousemove", handleMove);
  drawCanvas.addEventListener("touchmove", handleMove);

  drawCanvas.addEventListener("mousedown", (e) => {
    drawing = true;

    strokeCounter++;
    currentStrokeId = strokeCounter;

    const { x, y } = getPos(e);
    lastX = x;
    lastY = y;
  });

  drawCanvas.addEventListener("mouseup", () => {
    drawing = false;
    lastX = lastY = null;
    currentStrokeId = null;
  });

  drawCanvas.addEventListener("touchstart", (e) => {
    e.preventDefault();
    drawing = true;

    strokeCounter++;
    currentStrokeId = strokeCounter;

    const { x, y } = getPos(e);
    lastX = x;
    lastY = y;
  });

  drawCanvas.addEventListener("touchend", () => {
    drawing = false;
    lastX = lastY = null;
    currentStrokeId = null;
  });

 
  //  SERVER EVENTS
 
  socket.on("stroke", (stroke) => drawStroke(stroke));

  document.getElementById("clearBtn").addEventListener("click", () => {
    drawCtx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
    cursorCtx.clearRect(0, 0, cursorCanvas.width, cursorCanvas.height);
    socket.emit("clear-room");
  });

  socket.on("clear-canvas", () => {
    drawCtx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
    cursorCtx.clearRect(0, 0, cursorCanvas.width, cursorCanvas.height);
  });

  socket.on("update-canvas", (strokes) => {
    drawCtx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
    strokes.forEach(s => drawStroke(s));
  });

  socket.on("init-canvas", (strokes) => {
    drawCtx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
    strokes.forEach(s => drawStroke(s));
  });

  socket.on("cursor", (data) => {
    otherCursors[data.id] = {
      username: data.username,
      color: data.color,
      x: data.x,
      y: data.y
    };
    renderCursors();
  });

  socket.on("user-left", (user) => {
    delete otherCursors[user.id];
    renderCursors();
  });

  socket.on("error-message", (msg) => {
  console.warn("[SERVER ERROR]:", msg);
  alert(msg);
});



  const roomNameEl = document.getElementById("roomName");
  if (roomNameEl) roomNameEl.textContent = `Room: ${roomId}`;

  socket.on("update-user-list", (users) => {
    const userListEl = document.getElementById("userList");
    userListEl.innerHTML = "";

    users.forEach(u => {
      const li = document.createElement("li");
      li.innerHTML = `
        <span class="user-dot" style="background:${u.color}"></span>
        <span style="color:${u.color}">
          ${u.name}${u.name === username ? " (You)" : ""}
        </span>
      `;
      userListEl.appendChild(li);
    });
  });
}

window.setupCanvas = setupCanvas;
