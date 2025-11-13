export function setupCanvas(socket, roomId, username) {
  const canvas = document.getElementById("drawingCanvas");
  const ctx = canvas.getContext("2d");

  // Adjust canvas size
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight - 60;

  let drawing = false;
  let color = document.getElementById("colorPicker").value;
  let size = document.getElementById("brushSize").value;

  document.getElementById("colorPicker").addEventListener("change", (e) => {
    color = e.target.value;
  });

  document.getElementById("brushSize").addEventListener("input", (e) => {
    size = e.target.value;
  });

  canvas.addEventListener("mousedown", () => {
    drawing = true;
  });

  canvas.addEventListener("mouseup", () => {
    drawing = false;
    ctx.beginPath();
  });

  canvas.addEventListener("mousemove", (e) => {
    if (!drawing) return;
    const x = e.clientX;
    const y = e.clientY;
    const stroke = { x, y, color, size };
    drawStroke(stroke);
    socket.emit("stroke", stroke);
  });

  // Draw function (same as before)
  function drawStroke({ x, y, color, size }) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, size / 2, 0, Math.PI * 2);
    ctx.fill();
  }

  // Receive strokes from others
  socket.on("stroke", (stroke) => drawStroke(stroke));

  // Clear button
  document.getElementById("clearBtn").addEventListener("click", () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    socket.emit("clear-room");
  });

  socket.on("clear-canvas", () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  });

  // Debug 
  // socket.onAny((event, ...args) => {
  //   console.log("Received event:", event, args);
  // });


  // Displaying room and user list

  const roomNameEl = document.getElementById("roomName");
  const userListEl = document.getElementById("userList");

  if (roomNameEl) 
    roomNameEl.textContent = `Room: ${roomId}`;

  // Local cache of users
  let users = [username];

 function updateUserList(userNames = []) {
  const userListEl = document.getElementById("userList");
  if (!userListEl) return;

  userListEl.innerHTML = ""; // clear list

  userNames.forEach((name) => {
    const li = document.createElement("li");
    li.textContent = name === username ? `${name} (You)` : name;
    userListEl.appendChild(li);
  });
}
// When joining a room, load all existing strokes
socket.on("init-canvas", (strokes) => {
  if (!Array.isArray(strokes)) return;

  // Clear canvas before replaying strokes
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Redraw every saved stroke one-by-one
  for (const s of strokes) {
    drawStroke(s);
  }
});


  // Show yourself immediately
  updateUserList();

  // Update list when server sends new info
  socket.on("update-user-list", (userNames) => {
    console.log("Received update-user-list:", userNames);
    updateUserList(userNames);
  });

  // Log join/leave for debugging
  // socket.on("user-joined", (user) => console.log(`${user.name} joined`));
  // socket.on("user-left", (user) => console.log(`${user.name} left`));
}

// console.log("hello")