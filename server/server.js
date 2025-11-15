console.log("=== RUNNING SERVER ===");

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
  res.send("Backend is  again running");
});

io.on("connection", (socket) => {
  console.log("[SERVER] Client connected:", socket.id);

  socket.on("join-room", ({ roomId, username, clientId }) => {
    console.log("[SERVER] join-room received:", roomId, username, clientId);

    // IMPORTANT: joinRoom now stores reference so we don't import rooms again
    joinRoom(socket, roomId, username, clientId, io);
  });

  socket.on("stroke", (stroke) => handleStroke(socket, stroke));
  socket.on("clear-room", () => handleClear(socket, io));
  socket.on("undo", () => handleUndo(socket, io));
  socket.on("redo", () => handleRedo(socket, io));

  // CURSOR EVENTS — use rooms reference from rooms.js directly
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

  socket.on("ping-check", (data) => {
    // just bounce back same payload
    socket.emit("pong-check", data);
  });

  socket.on("disconnect", () => handleDisconnect(socket, io));
});

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
