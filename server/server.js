// server.js
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import path from "path";
import { fileURLToPath } from "url";
import {
  joinRoom,
  handleStroke,
  handleClear,
  handleDisconnect
} from "./rooms.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, "../client")));

io.on("connection", (socket) => {
  console.log("New client connected:", socket.id);

  socket.on("join-room", ({ roomId, username }) => joinRoom(socket, roomId, username,io));
  socket.on("stroke", (stroke) => handleStroke(socket, stroke));
  socket.on("clear-room", () => handleClear(socket, io));
  socket.on("disconnect", () => handleDisconnect(socket, io));
});

httpServer.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
