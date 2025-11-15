function setupCanvas(socket, roomId, username) {
  const drawCanvas = document.getElementById("drawingCanvas");
  const drawCtx = drawCanvas.getContext("2d");

  const cursorCanvas = document.getElementById("cursorCanvas");
  const cursorCtx = cursorCanvas.getContext("2d");

  const wrapper = document.getElementById("canvasWrapper");

  // --------------------------
  // STROKE GROUPING
  // --------------------------
  let strokeCounter = 0;
  let currentStrokeId = null;

  // Shapes & image helpers
  let shapeStart = null;        // {x,y} for rect/circle/line start
  let pendingImagePos = null;   // {x,y} where image will be placed

  // --------------------------
  // PERFORMANCE: FPS (optional)
  // --------------------------
  let fpsFrames = 0;
  let fpsLastTime = performance.now();
  const fpsEl = document.getElementById("fpsDisplay");

  function fpsLoop(now) {
    fpsFrames++;
    const diff = now - fpsLastTime;
    if (diff >= 1000) {
      const fps = Math.round((fpsFrames * 1000) / diff);
      fpsFrames = 0;
      fpsLastTime = now;
      if (fpsEl) fpsEl.textContent = `FPS: ${fps}`;
    }
    requestAnimationFrame(fpsLoop);
  }
  requestAnimationFrame(fpsLoop);

  // --------------------------
  // POSITION HELPER
  // --------------------------
  function getPos(e) {
    const rect = drawCanvas.getBoundingClientRect();
    if (e.touches && e.touches[0]) {
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

  // --------------------------
  // CANVAS RESIZE
  // --------------------------
  function resizeCanvas() {
    const rect = wrapper.getBoundingClientRect();
    drawCanvas.width = cursorCanvas.width = rect.width;
    drawCanvas.height = cursorCanvas.height = rect.height;

    // Clear and re-render cursors after resize
    cursorCtx.clearRect(0, 0, cursorCanvas.width, cursorCanvas.height);
  }
  resizeCanvas();
  // window.addEventListener("resize", resizeCanvas);

  // --------------------------
  // STATE
  // --------------------------
  let otherCursors = {};
  let myCursor = { x: null, y: null };
  let lastCursorEmit = 0;

  let drawing = false;
  let lastX = null;
  let lastY = null;

  let color = document.getElementById("colorPicker").value;
  let size = Number(document.getElementById("brushSize").value);

  // "brush" | "eraser" | "rect" | "circle" | "line" | "image"
  let currentTool = "brush";

  // TOOL BUTTONS (matching your HTML)
  const brushBtn = document.getElementById("brushBtn");
  const eraserBtn = document.getElementById("eraserBtn");
  const rectBtn = document.getElementById("rectBtn");
  const circleBtn = document.getElementById("circleBtn");
  const lineBtn = document.getElementById("lineBtn");
  const imageBtn = document.getElementById("imgBtn");

  // Hidden file input for image tool
  const imageInput = document.getElementById("imageInput");

  // --------------------------
  // RESET DRAWING STATE
  // --------------------------
  function resetDrawingState() {
    drawing = false;
    currentStrokeId = null;
    lastX = null;
    lastY = null;
    shapeStart = null;
    pendingImagePos = null;
  }

  // --------------------------
  // TOOL BUTTON UI
  // --------------------------
  function updateToolButtons() {
    const allToolBtns = [brushBtn, eraserBtn, rectBtn, circleBtn, lineBtn, imageBtn];
    allToolBtns.forEach(btn => {
      if (btn) btn.classList.remove("tool-selected");
    });

    if (currentTool === "brush" && brushBtn) brushBtn.classList.add("tool-selected");
    if (currentTool === "eraser" && eraserBtn) eraserBtn.classList.add("tool-selected");
    if (currentTool === "rect" && rectBtn) rectBtn.classList.add("tool-selected");
    if (currentTool === "circle" && circleBtn) circleBtn.classList.add("tool-selected");
    if (currentTool === "line" && lineBtn) lineBtn.classList.add("tool-selected");
    if (currentTool === "image" && imageBtn) imageBtn.classList.add("tool-selected");
  }
  updateToolButtons();

  // --------------------------
  // TOOL SELECTION HANDLERS
  // --------------------------
  if (brushBtn) {
    brushBtn.addEventListener("click", () => {
      currentTool = "brush";
      resetDrawingState();
      updateToolButtons();
      renderCursors();
    });
  }

  if (eraserBtn) {
    eraserBtn.addEventListener("click", () => {
      currentTool = "eraser";
      resetDrawingState();
      updateToolButtons();
      renderCursors();
    });
  }

  if (rectBtn) {
    rectBtn.addEventListener("click", () => {
      currentTool = "rect";
      resetDrawingState();
      updateToolButtons();
      renderCursors();
    });
  }

  if (circleBtn) {
    circleBtn.addEventListener("click", () => {
      currentTool = "circle";
      resetDrawingState();
      updateToolButtons();
      renderCursors();
    });
  }

  if (lineBtn) {
    lineBtn.addEventListener("click", () => {
      currentTool = "line";
      resetDrawingState();
      updateToolButtons();
      renderCursors();
    });
  }

  if (imageBtn) {
    imageBtn.addEventListener("click", () => {
      currentTool = "image";
      resetDrawingState();
      updateToolButtons();
      renderCursors();
    });
  }

  // --------------------------
  // COLOR & SIZE
  // --------------------------
  document.getElementById("colorPicker").addEventListener("change", (e) => {
    color = e.target.value;
  });

  document.getElementById("brushSize").addEventListener("input", (e) => {
    size = Number(e.target.value);
  });

  // --------------------------
  // BASIC FREEHAND DRAWING
  // --------------------------
  function drawFreehandStroke({ x, y, lastX, lastY, color, size }) {
    drawCtx.strokeStyle = color;
    drawCtx.lineWidth = size;
    drawCtx.lineCap = "round";
    drawCtx.lineJoin = "round";

    drawCtx.beginPath();
    drawCtx.moveTo(lastX ?? x, lastY ?? y);
    drawCtx.lineTo(x, y);
    drawCtx.stroke();
  }

  // --------------------------
  // SHAPE DRAWING HELPERS
  // --------------------------
  function drawShapeOnCtx(ctx, type, start, end, color, size) {
    if (!start || !end) return;
    const { x: x1, y: y1 } = start;
    const { x: x2, y: y2 } = end;

    ctx.strokeStyle = color;
    ctx.lineWidth = size;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    if (type === "line") {
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      return;
    }

    if (type === "rect") {
      const w = x2 - x1;
      const h = y2 - y1;
      ctx.strokeRect(x1, y1, w, h);
      return;
    }

    if (type === "circle") {
      const dx = x2 - x1;
      const dy = y2 - y1;
      const r = Math.sqrt(dx * dx + dy * dy);
      ctx.beginPath();
      ctx.arc(x1, y1, r, 0, Math.PI * 2);
      ctx.stroke();
      return;
    }
  }

  // --------------------------
  // GENERIC drawStroke (for server replay)
  // --------------------------
  function drawStroke(stroke) {
    if (!stroke) return;

    // Shapes
    if (stroke.type === "rect" || stroke.type === "circle" || stroke.type === "line") {
      const start = { x: stroke.startX, y: stroke.startY };
      const end = { x: stroke.endX, y: stroke.endY };
      drawShapeOnCtx(drawCtx, stroke.type, start, end, stroke.color, stroke.size);
      return;
    }

    // Image
    if (stroke.type === "image" && stroke.dataUrl) {
      const img = new Image();
      img.onload = () => {
        const w = stroke.w || img.width;
        const h = stroke.h || img.height;
        drawCtx.drawImage(img, stroke.x, stroke.y, w, h);
      };
      img.src = stroke.dataUrl;
      return;
    }

    // Default: freehand
    drawFreehandStroke(stroke);
  }

  // --------------------------
  // CURSOR RENDERING
  // --------------------------
  function renderCursors(extraShapePreview) {
    cursorCtx.clearRect(0, 0, cursorCanvas.width, cursorCanvas.height);

    // Other users' cursors
    Object.values(otherCursors).forEach(cursor => {
      cursorCtx.fillStyle = cursor.color;
      cursorCtx.beginPath();
      cursorCtx.arc(cursor.x, cursor.y, 6, 0, Math.PI * 2);
      cursorCtx.fill();

      cursorCtx.font = "12px Arial";
      cursorCtx.fillText(cursor.username, cursor.x + 10, cursor.y + 4);
    });

    if (myCursor.x == null || myCursor.y == null) return;

    // Eraser cursor: square
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
      return;
    }

    // Brush cursor: pencil + circle
    if (currentTool === "brush") {
      cursorCtx.strokeStyle = color;
      cursorCtx.lineWidth = 2;

      // Pencil line
      cursorCtx.beginPath();
      cursorCtx.moveTo(myCursor.x, myCursor.y);
      cursorCtx.lineTo(myCursor.x + 14, myCursor.y - 18);
      cursorCtx.stroke();

      // Brush size circle
      cursorCtx.beginPath();
      cursorCtx.arc(myCursor.x, myCursor.y, size / 2, 0, Math.PI * 2);
      cursorCtx.stroke();

      return;
    }

    // Shapes & Image = "+" crosshair
    if (
      currentTool === "rect" ||
      currentTool === "circle" ||
      currentTool === "line" ||
      currentTool === "image"
    ) {
      const len = 8;
      cursorCtx.strokeStyle = color;
      cursorCtx.lineWidth = 1;

      cursorCtx.beginPath();
      cursorCtx.moveTo(myCursor.x, myCursor.y - len);
      cursorCtx.lineTo(myCursor.x, myCursor.y + len);
      cursorCtx.moveTo(myCursor.x - len, myCursor.y);
      cursorCtx.lineTo(myCursor.x + len, myCursor.y);
      cursorCtx.stroke();
    }

    // Shape preview on cursor canvas
    if (extraShapePreview && extraShapePreview.type) {
      drawShapeOnCtx(
        cursorCtx,
        extraShapePreview.type,
        extraShapePreview.start,
        extraShapePreview.end,
        color,
        size
      );
    }
  }

  // --------------------------
  // HANDLE MOVE (mouse + touch)
  // --------------------------
  function handleMove(e) {
    if (e.cancelable) e.preventDefault();
    const { x, y } = getPos(e);

    myCursor.x = x;
    myCursor.y = y;

    const now = Date.now();
    if (now - lastCursorEmit > 30) {
      socket.emit("cursor", { x, y });
      lastCursorEmit = now;
    }

    // Not drawing: just update cursor
    if (!drawing && currentTool !== "image") {
      renderCursors();
      return;
    }

    // SHAPES: preview only while drawing
    if (currentTool === "rect" || currentTool === "circle" || currentTool === "line") {
      if (!shapeStart) {
        shapeStart = { x, y };
      }
      const preview = {
        type: currentTool,
        start: shapeStart,
        end: { x, y }
      };
      renderCursors(preview);
      return;
    }

    // IMAGE: no live drawing, just cursor
    if (currentTool === "image") {
      renderCursors();
      return;
    }

    // BRUSH / ERASER FREEHAND
    if (!currentStrokeId) return; // safety

    const strokeColor = currentTool === "eraser" ? "#ffffff" : color;
    const strokeSize = currentTool === "eraser" ? size * 2 : size;

    const stroke = {
      type: "freehand",
      strokeId: currentStrokeId,
      x,
      y,
      lastX,
      lastY,
      color: strokeColor,
      size: strokeSize
    };

    renderCursors(); // no preview
    drawFreehandStroke(stroke);
    socket.emit("stroke", stroke);

    lastX = x;
    lastY = y;
  }

  drawCanvas.addEventListener("mousemove", handleMove);
  drawCanvas.addEventListener("touchmove", handleMove);

  // --------------------------
  // START / END DRAWING
  // --------------------------
  function startDrawingAt(e) {
    const { x, y } = getPos(e);

    if (currentTool === "image") {
      // Fully reset any previous drawing state
      drawing = false;
      shapeStart = null;
      currentStrokeId = null;

      // Choose position, then open file picker
      pendingImagePos = { x, y };
      if (imageInput) {
        imageInput.value = "";
        imageInput.click();
      }
      return;
    }

    drawing = true;
    strokeCounter++;
    currentStrokeId = strokeCounter;
    lastX = x;
    lastY = y;

    if (currentTool === "rect" || currentTool === "circle" || currentTool === "line") {
      shapeStart = { x, y };
    }
  }

  function endDrawingAt(e) {
    if (!drawing) return;
    drawing = false;

    const pos = e ? getPos(e) : null;
    const endX = pos ? pos.x : lastX;
    const endY = pos ? pos.y : lastY;

    // Commit shape to canvas + server
    if (
      shapeStart &&
      (currentTool === "rect" || currentTool === "circle" || currentTool === "line")
    ) {
      const stroke = {
        type: currentTool,
        strokeId: currentStrokeId,
        startX: shapeStart.x,
        startY: shapeStart.y,
        endX: endX,
        endY: endY,
        color,
        size
      };

      renderCursors(); // clear preview
      drawStroke(stroke);
      socket.emit("stroke", stroke);
    }

    shapeStart = null;
    lastX = lastY = null;
    currentStrokeId = null;
  }

  drawCanvas.addEventListener("mousedown", (e) => startDrawingAt(e));
  drawCanvas.addEventListener("mouseup", (e) => endDrawingAt(e));

  drawCanvas.addEventListener("touchstart", (e) => {
    if (e.cancelable) e.preventDefault();
    startDrawingAt(e);
  });

  drawCanvas.addEventListener("touchend", (e) => {
    if (e.cancelable) e.preventDefault();
    endDrawingAt(e);
  });

  // --------------------------
  // IMAGE INPUT HANDLING
  // --------------------------
  if (imageInput) {
    imageInput.addEventListener("change", (e) => {
      const file = e.target.files && e.target.files[0];

      // If dialog was cancelled or no position was chosen
      if (!file || !pendingImagePos) return;

      const reader = new FileReader();

      reader.onload = function (ev) {
  const img = new Image();
  img.onload = () => {

    // ----- AUTO SCALE -----
    const maxDim = 200;  
    let w = img.width;
    let h = img.height;
    const scale = Math.min(maxDim / w, maxDim / h, 1);
    w *= scale;
    h *= scale;

    // ----- COMPRESS -----
    const temp = document.createElement("canvas");
    const tctx = temp.getContext("2d");
    temp.width = w;
    temp.height = h;
    tctx.drawImage(img, 0, 0, w, h);

    // JPEG compression reduces huge images from 1.5MB → 100k
    const compressedDataUrl = temp.toDataURL("image/jpeg", 0.7);

    console.log("COMPRESSED SIZE:", compressedDataUrl.length);

    const stroke = {
      type: "image",
      strokeId: Date.now() + Math.random(),
      x: pendingImagePos.x,
      y: pendingImagePos.y,
      w,
      h,
      dataUrl: compressedDataUrl
    };

    drawStroke(stroke);
    socket.emit("stroke", stroke);

    pendingImagePos = null;
    drawing = false;
    renderCursors();
  };

  img.src = ev.target.result;
};


      reader.readAsDataURL(file);
    });
  }

  // --------------------------
  // UNDO / REDO / CLEAR
  // --------------------------
  const undoBtn = document.getElementById("undoBtn");
  const redoBtn = document.getElementById("redoBtn");
  const clearBtn = document.getElementById("clearBtn");

  if (undoBtn) undoBtn.addEventListener("click", () => socket.emit("undo"));
  if (redoBtn) redoBtn.addEventListener("click", () => socket.emit("redo"));

  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      drawCtx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
      cursorCtx.clearRect(0, 0, cursorCanvas.width, cursorCanvas.height);
      resetDrawingState();
      socket.emit("clear-room");
    });
  }

  // --------------------------
  // SERVER EVENTS
  // --------------------------
  socket.on("stroke", (stroke) => {
    drawStroke(stroke);
  });

  socket.on("clear-canvas", () => {
    drawCtx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
    cursorCtx.clearRect(0, 0, cursorCanvas.width, cursorCanvas.height);
    resetDrawingState();
  });

  socket.on("update-canvas", (strokes) => {
    drawCtx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
    strokes.forEach((s) => drawStroke(s));
  });

  socket.on("init-canvas", (strokes) => {
    drawCtx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
    strokes.forEach((s) => drawStroke(s));
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

  socket.on("update-user-list", (users) => {
    const userListEl = document.getElementById("userList");
    if (!userListEl) return;

    userListEl.innerHTML = "";
    users.forEach((u) => {
      const li = document.createElement("li");
      li.innerHTML = `
        <span class="user-dot" style="background:${u.color}"></span>
        <span style="color:${u.color}">
          ${u.name || "(no name)"}${u.name === username ? " (You)" : ""}
        </span>
      `;
      userListEl.appendChild(li);
    });
  });

  // ROOM LABEL
  const roomNameEl = document.getElementById("roomName");
  if (roomNameEl) {
    roomNameEl.textContent = roomId;
  }
}

window.setupCanvas = setupCanvas;
