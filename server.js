const express = require("express");
const { createServer } = require("http");
const cors = require("cors");
const { Server } = require("socket.io");

const app = express();
app.use(cors());
const httpServer = createServer(app);
const io = new Server(httpServer);

app.get("/", (req, res) => {
  res.json("hello");
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

httpServer.listen(3001, () => {
  console.log("server running");
});
