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

  if (!clientId) {
    socket.emit("error-message", "Missing clientId.");
    return;
  }

  socket.join(roomId);
  socket.data.roomId = roomId;
  socket.data.username = username;
  socket.data.clientId = clientId;

  // Create room if not exists
  ensureRoom(roomId, rooms);
  socket.data._roomRef = rooms[roomId];

  // ---- GET USER BY clientId (persistent identity) ----
  let user = rooms[roomId].users.find(u => u.clientId === clientId);

  if (!user) {
    // NEW USER
    user = {
      clientId,
      id: socket.id,
      name: username,
      color: assignColor()
    };
    rooms[roomId].users.push(user);
  } else {
    // RECONNECT USER — keep color
    user.id = socket.id;
    user.name = username;
  }

  // Send previous strokes
  socket.emit("init-canvas", getRoomStrokes(roomId, rooms));

  // Update user list for everyone
  io.to(roomId).emit(
    "update-user-list",
    rooms[roomId].users.map(u => ({
      id: u.id,
      name: u.name,
      color: u.color
    }))
  );
}



// --------------------
// Undo / Redo
// --------------------

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



// --------------------
// Stroke Handling
// --------------------

export function handleStroke(socket, stroke) {
  const roomId = socket.data.roomId;
  if (!roomId) return;

  addStroke(roomId, stroke.strokeId, stroke, rooms);

  socket.to(roomId).emit("stroke", stroke);
}



// --------------------
// Clear canvas
// --------------------

export function handleClear(socket, io) {
  const roomId = socket.data.roomId;
  if (!roomId) return;

  clearRoom(roomId, rooms);
  io.to(roomId).emit("clear-canvas");
}



// --------------------
// Disconnect Handling (Fully FIXED)
// --------------------

export function handleDisconnect(socket, io) {
  const roomId = socket.data.roomId;
  const clientId = socket.data.clientId;

  if (!roomId || !rooms[roomId]) return;

  // Find persistent user
  const user = rooms[roomId].users.find(u => u.clientId === clientId);

  if (user) {
    user.id = null; // offline but keep identity
  }

  // Notify others
  socket.to(roomId).emit("user-left", {
    id: socket.id,
    name: socket.data.username
  });

  // Send updated user list
  io.to(roomId).emit(
    "update-user-list",
    rooms[roomId].users.map(u => ({
      id: u.id,
      name: u.name,
      color: u.color
    }))
  );


  const hasOnline = rooms[roomId].users.some(u => u.id !== null);

  if (!hasOnline) {
    delete rooms[roomId];
    console.log(`[ROOM DELETED] ${roomId}`);
  }
}



export { rooms };
