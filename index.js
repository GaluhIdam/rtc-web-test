const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
const server = http.createServer(app);

app.use(cors());

const io = new Server(server, {
  cors: {
    origin: "*", // Vite dev server
  },
});

const users = new Set();

const userSocketMap = new Map();

io.on("connection", (socket) => {
  socket.on("join", (userId) => {
    if (!userId) return;
    socket.userId = userId;
    users.add(userId);
    userSocketMap.set(userId, socket.id); // simpan socket id
    console.log(`${userId} joined`);
    socket.broadcast.emit("user-joined", userId);
  });

  socket.on("offer", ({ to, offer }) => {
    const toSocketId = userSocketMap.get(to);
    if (toSocketId) {
      io.to(toSocketId).emit("offer", { from: socket.userId, offer });
    }
  });

  socket.on("answer", ({ to, answer }) => {
    const toSocketId = userSocketMap.get(to);
    if (toSocketId) {
      io.to(toSocketId).emit("answer", { from: socket.userId, answer });
    }
  });

  socket.on("ice-candidate", ({ to, candidate }) => {
    const toSocketId = userSocketMap.get(to);
    if (toSocketId) {
      io.to(toSocketId).emit("ice-candidate", {
        from: socket.userId,
        candidate,
      });
    }
  });

  socket.on("disconnect", () => {
    if (socket.userId) {
      users.delete(socket.userId);
      userSocketMap.delete(socket.userId); // hapus mapping
      console.log("User disconnected:", socket.userId);
    }
  });
});

server.listen(5000, () => {
  console.log("Socket.IO server running on http://localhost:5000");
});
