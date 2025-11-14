import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";

import {
  joinRoom,
  handleStroke,
  handleClear,
  handleDisconnect
} from "./rooms.js";

const app = express();
const httpServer = createServer(app);

// ✔ REQUIRED FOR NETLIFY + RAILWAY
const io = new Server(httpServer, {
  cors: {
    origin: "*",   // or put your Netlify URL
    methods: ["GET", "POST"]
  }
});

// ✔ REQUIRED FOR RAILWAY
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("Backend is running");
});

io.on("connection", (socket) => {
  console.log("New client connected:", socket.id);

  socket.on("join-room", ({ roomId, username }) =>
    joinRoom(socket, roomId, username, io)
  );

  socket.on("stroke", (stroke) =>
    handleStroke(socket, stroke)
  );

  socket.on("clear-room", () =>
    handleClear(socket, io)
  );

  socket.on("cursor", (data) => {
    socket.to(socket.data.roomId).emit("cursor", {
      id: socket.id,
      username: socket.data.username,
      x: data.x,
      y: data.y
    });
  });

  socket.on("disconnect", () =>
    handleDisconnect(socket, io)
  );
});

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
