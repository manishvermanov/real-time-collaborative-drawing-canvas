// rooms.js
import { addStroke, getRoomStrokes, clearRoom, ensureRoom } from "./drawing-state.js";

const rooms = {}; // Keeps basic user and room info

export function joinRoom(socket, roomId, username, io) {
  socket.join(roomId);
  socket.data.roomId = roomId;
  socket.data.username = username || "Anonymous";

  ensureRoom(roomId, rooms);

  rooms[roomId].users.push({ id: socket.id, name: socket.data.username });

  // Send existing canvas state to the new user
  socket.emit("init-canvas", getRoomStrokes(roomId, rooms));

  // Notify others
  socket.to(roomId).emit("user-joined", { id: socket.id, name: socket.data.username });

  // Send updated user list to everyone in this room
  const userNames = rooms[roomId].users.map((u) => u.name);
  io.to(roomId).emit("update-user-list", userNames);

  console.log(`${socket.data.username} joined room ${roomId}`);
  console.log("Emitting update-user-list for room:", roomId, userNames);
}


export function handleStroke(socket, stroke) {
  const roomId = socket.data.roomId;
  if (!roomId) return;

  addStroke(roomId, stroke, rooms);
  socket.to(roomId).emit("stroke", stroke);
}

export function handleClear(socket, io) {
  const roomId = socket.data.roomId;
  if (!roomId) return;
  clearRoom(roomId, rooms);
  io.to(roomId).emit("clear-canvas");
}

export function handleDisconnect(socket, io) {
  const roomId = socket.data.roomId;
  const username = socket.data.username || "Anonymous";
  console.log(`User disconnected: ${username} (${socket.id})`);

  if (roomId && rooms[roomId]) {
    rooms[roomId].users = rooms[roomId].users.filter(u => u.id !== socket.id);
    socket.to(roomId).emit("user-left", { id: socket.id, name: username });

    // Send updated user list again
    const userNames = rooms[roomId].users.map(u => u.name);
    io.to(roomId).emit("update-user-list", userNames);

    // Delete room if empty
    if (rooms[roomId].users.length === 0) {
      delete rooms[roomId];
      console.log(`Deleted empty room: ${roomId}`);
    }
  }
}
