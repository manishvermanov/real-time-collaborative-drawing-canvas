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

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);
const PORT = 3000;


app.get('/', (req, response)=>{
  response.send("op")
})

io.on("connection", (socket) => {
  console.log("New client connected:", socket.id);

  socket.on("join-room", ({ roomId, username }) => joinRoom(socket, roomId, username,io));
  socket.on("stroke", (stroke) => handleStroke(socket, stroke));
  socket.on("clear-room", () => handleClear(socket, io));
  socket.on("disconnect", () => handleDisconnect(socket, io));
  socket.on("cursor", (data) => {
  socket.to(socket.data.roomId).emit("cursor", {
    id: socket.id,
    username: socket.data.username,
    x: data.x,
    y: data.y
  });
});
});

httpServer.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
