// rooms.js
import {
  addStroke,
  getRoomStrokes,
  clearRoom,
  ensureRoom,
  undoStroke,
  redoStroke
} from "./drawing-state.js";

const rooms = {}; // Keeps users + strokes

// Assign user color
function assignColor() {
  const colors = [
    "#ff4b4b", "#3fa7ff", "#4dff91",
    "#ff8a3f", "#b04bff", "#ff3fcf"
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

export function joinRoom(socket, roomId, username, clientId, io) {
  roomId = roomId.trim();
  username = username.trim();

  socket.join(roomId);
  socket.data.roomId = roomId;
  socket.data.username = username;
  socket.data.clientId = clientId;

  ensureRoom(roomId, rooms);

  let user = rooms[roomId].users.find(u => u.clientId === clientId);

  // NEW USER
  if (!user) {
    user = {
      clientId,
      id: socket.id,
      name: username,
      color: assignColor()
    };
    rooms[roomId].users.push(user);
  }
  // RECONNECTING USER
  else {
    user.id = socket.id;  // live socket id
    user.name = username; // update name if changed
  }

  socket.emit("init-canvas", getRoomStrokes(roomId, rooms));

  io.to(roomId).emit("update-user-list",
    rooms[roomId].users.map(u => ({
      id: u.id,
      name: u.name,
      color: u.color
    }))
  );
}





// Undo / Redo

export function handleUndo(socket, io) {
  const roomId = socket.data.roomId;
  if (!roomId) return;

  undoStroke(roomId, rooms);
  io.to(roomId).emit("update-canvas", getRoomStrokes(roomId, rooms));
}

export function handleRedo(socket, io) {
  const roomId = socket.data.roomId;
  if (!roomId) return;

  redoStroke(roomId, rooms);
  io.to(roomId).emit("update-canvas", getRoomStrokes(roomId, rooms));
}



// Stroke handling


export function handleStroke(socket, stroke) {
  const roomId = socket.data.roomId;
  if (!roomId) return;

  // Correct stroke grouping
  addStroke(roomId, stroke.strokeId, stroke, rooms);

  // Broadcast to everyone except sender
  socket.to(roomId).emit("stroke", stroke);
}



// Clear canvas


export function handleClear(socket, io) {
  const roomId = socket.data.roomId;
  if (!roomId) return;

  clearRoom(roomId, rooms);
  io.to(roomId).emit("clear-canvas");
}


// Disconnect


export function handleDisconnect(socket, io) {
  const roomId = socket.data.roomId;
  const username = socket.data.username || "Anonymous";

  console.log(`User disconnected: ${username} (${socket.id})`);

  if (roomId && rooms[roomId]) {
    // Remove user
    const usr = rooms[roomId].users.find(u => u.id === socket.id);
if (usr) usr.id = null; // mark offline but preserve color + clientId


    socket.to(roomId).emit("user-left", { id: socket.id, name: username });

    // Update user list
    const userList = rooms[roomId].users.map(u => ({
      id: u.id,
      name: u.name,
      color: u.color
    }));

    io.to(roomId).emit("update-user-list", userList);

    // Delete room if empty
    if (rooms[roomId].users.length === 0) {
      delete rooms[roomId];
      console.log(`Deleted empty room: ${roomId}`);
    }
  }
}

export { rooms };
