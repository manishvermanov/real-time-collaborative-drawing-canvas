import { setupCanvas } from "./canvas.js";
import { initSocket } from "./websocket.js";

document.getElementById("joinBtn").addEventListener("click", () => {
  const username = document.getElementById("username").value.trim() || "Anonymous";
  const roomId = document.getElementById("roomId").value.trim() || "default";

  // hide join screen, show app
  document.getElementById("joinScreen").style.display = "none";
  document.getElementById("app").style.display = "block";

  const socket = initSocket(roomId, username);
  setupCanvas(socket, roomId, username);

});
