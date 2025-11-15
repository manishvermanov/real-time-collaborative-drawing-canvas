function initSocket(roomId, username, clientId) {
  const socket = io("http://localhost:3000/", {
    transports: ["websocket"],
    withCredentials: false,
    auth: { clientId }
  });

  socket.on("connect", () => {
    console.log("Connected to server:", socket.id);
    socket.emit("join-room", { roomId, username, clientId });

    // 🔹 Start latency checks when connected
    startLatencyProbe(socket);
  });

  socket.on("error-message", (msg) => {
    alert(msg);
  });

  return socket;
}

// 🔻 Simple latency measurement (round-trip)
function startLatencyProbe(socket) {
  let lastPingTime = null;

  // listen for pong
  socket.on("pong-check", (data) => {
    const now = performance.now();
    const rtt = now - data.startTime;           // round-trip
    const latency = Math.round(rtt / 2);        // approximate one-way

    const el = document.getElementById("latencyDisplay");
    if (el) el.textContent = `Latency: ${latency} ms`;
  });

  // send ping every 3 seconds
  setInterval(() => {
    lastPingTime = performance.now();
    socket.emit("ping-check", { startTime: lastPingTime });
  }, 3000);
}

window.initSocket = initSocket;
