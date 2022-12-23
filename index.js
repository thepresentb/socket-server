const express = require("express");
const http = require("http");
const socketio = require("socket.io");
const cors = require("cors");
const app = express();
app.use(cors());
const server = http.createServer(app);
const io = socketio(server, {
  cors: {
    origin: "http://localhost:3000",
  },
});

app.get("/", (req, res) => {
  console.log("check");
  res.json("hello mn");
});

const listUserOnline = {};

io.on("connection", (socket) => {
  console.log("user connected", socket.id);
  global.socket = socket;

  socket.on("joinRoom", ({ userId, roomIds }) => {
    io.emit("userOnline", userId);

    // khoi tao list user online
    listUserOnline[socket.id] = userId;

    roomIds.map((roomId) => {
      socket.join(roomId);
    });
  });

  socket.on("joinOneRoom", (userId, roomId) => {
    socket.join(roomId);
  });

  socket.on("userStatus", (data, callback) => {
    const resultData = [];
    for (let x in listUserOnline) {
      if (data.includes(listUserOnline[x]) && !resultData.includes(listUserOnline[x])) {
        resultData.push(listUserOnline[x]);
      }
    }
    callback(resultData);
  });

  socket.on("sendMessage", (data) => {
    socket.to(data.room).emit("receiveMessage", data);
  });

  socket.on("reloadContact", (roomId) => {
    io.emit("newContact", roomId);
  });

  socket.on("disconnect", () => {
    console.log("user disconnected", socket.id);

    const idUserOffline = listUserOnline[socket.id];
    io.emit("userOffline", idUserOffline);

    delete listUserOnline[socket.id];
  });
});

server.listen(3001, () => {
  console.log("server running");
});
