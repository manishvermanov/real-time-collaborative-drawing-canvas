// export function initSocket(roomId, username) {
//   const socket = io();

//   socket.on("connect", () => {
//     console.log("Connected to server:", socket.id);
//     socket.emit("join-room", { roomId, username });
//   });

//   return socket;
// }


function initSocket(roomId, username) {
  const socket = io("https://enchanting-clarity-production-a5a7.up.railway.app/", {
    transports: ["websocket"],
    withCredentials: false
  });

  socket.on("connect", () => {
    console.log("Connected to server:", socket.id);
    socket.emit("join-room", { roomId, username });
  });

  return socket;
}

// Make it usable globally
window.initSocket = initSocket;
