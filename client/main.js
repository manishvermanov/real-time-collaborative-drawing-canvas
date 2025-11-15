function getClientId() {
  let id = sessionStorage.getItem("clientId");
  if (!id) {
    id = "u-" + Math.random().toString(36).substr(2, 9);
    sessionStorage.setItem("clientId", id); //used session over local
  }
  return id;
}




document.getElementById("joinBtn").addEventListener("click", () => {
  const username = document.getElementById("username").value.trim();
  const roomId = document.getElementById("roomId").value.trim();
  const clientId = getClientId();

  if (!username) {
    alert("Please enter a username.");
    return;
  }

  if (!roomId) {
    alert("Please enter a room name.");
    return;
  }

  document.getElementById("joinScreen").style.display = "none";
  document.getElementById("app").style.display = "block";

  const socket = window.initSocket(roomId, username, clientId);
  window.setupCanvas(socket, roomId, username);
});
