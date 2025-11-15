console.log("=== RUNNING THIS SERVER FILE ===");

import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";

import {
  joinRoom,
  handleStroke,
  handleClear,
  handleDisconnect,
  handleUndo,
  handleRedo,
  rooms
} from "./rooms.js";

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});

const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("Backend is running");
});

io.on("connection", (socket) => {
  console.log("[SERVER] Client connected:", socket.id);

  // JOIN ROOM
  socket.on("join-room", ({ roomId, username, clientId }) => {
    console.log("[SERVER] join-room received:", roomId, username, clientId);
    joinRoom(socket, roomId, username, clientId, io);
  });

  // DRAW EVENTS
  socket.on("stroke", (stroke) => handleStroke(socket, stroke));
  socket.on("clear-room", () => handleClear(socket, io));
  socket.on("undo", () => handleUndo(socket, io));
  socket.on("redo", () => handleRedo(socket, io));

  // CURSOR BROADCAST
  socket.on("cursor", (pos) => {
    const roomId = socket.data.roomId;
    if (!roomId) return;

    const room = rooms[roomId];
    if (!room) return;

    const user = room.users.find(u => u.id === socket.id);
    if (!user) return;

    socket.to(roomId).emit("cursor", {
      id: socket.id,
      username: user.name,
      color: user.color,
      x: pos.x,
      y: pos.y
    });
  });

  // DISCONNECT
  socket.on("disconnect", () => handleDisconnect(socket, io));
});

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
