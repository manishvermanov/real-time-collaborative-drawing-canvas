function initSocket(roomId, username, clientId) {
  const socket = io("https://enchanting-clarity-production-7496.up.railway.app/", {
    transports: ["websocket"],
    withCredentials: false,
    auth: { clientId }     
  });

  socket.on("connect", () => {
    console.log("Connected to server:", socket.id);

    socket.emit("join-room", { 
      roomId, 
      username, 
      clientId            
    });
  });

  socket.on("error-message", (msg) => {
    alert(msg);
  });

  return socket;
}

window.initSocket = initSocket;
