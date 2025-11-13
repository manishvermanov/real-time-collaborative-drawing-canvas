export function initSocket(roomId, username) {
  const socket = io();

  socket.on("connect", () => {
    console.log("Connected to server:", socket.id);
    socket.emit("join-room", { roomId, username });
  });

  return socket;
}
