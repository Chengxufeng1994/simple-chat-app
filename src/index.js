const http = require('http');
const path = require('path');
const Filter = require('bad-words');
const express = require('express');
const socketIO = require('socket.io');
const morgan = require('morgan');

const {
  generateMessage,
  generateLocationMessage,
} = require('./utils/messages');
const {
  addUser,
  removeUser,
  getUser,
  getUsersInRoom,
} = require('./utils/users');

const publicDirectoryPath = path.join(__dirname, '..', 'public');
const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0';

const app = express();
const server = http.createServer(app);
const { Server } = socketIO;
const io = new Server(server);

// Setup static directory to serve
app.use(express.static(publicDirectoryPath));
app.use(morgan('combined'));

let count = 0;
/**
 * server (emit) -> client (receive) - countUpdated
 * client (emit) -> server (receive) - increment
 */

io.on('connection', (socket) => {
  console.log('New WebSocket connected');

  socket.on('join', ({ username, room }, callback) => {
    /**
     * socket.emit, io.emit, socket.broadcast.emit
     * io.to.emit, socket.broadcast.to.emit
     */
    // console.log(socket.id);
    // console.log(socket.rooms);
    const newUser = {
      id: socket.id,
      username,
      room,
    };
    const { error, user } = addUser(newUser);
    if (error) {
      callback?.(error);
    }

    socket.join(room);
    socket.emit(
      'message',
      generateMessage('Admin', `Welcome ${user.username}`)
    );
    socket.broadcast
      .to(user.room)
      .emit('message', generateMessage('Admin', `${username} has joined!`));
    io.to(user.room).emit('roomData', {
      room: user.room,
      users: getUsersInRoom(user.room),
    });
    callback?.();
  });

  socket.on('sendMessage', (message, callback) => {
    const user = getUser(socket.id);
    const filter = new Filter();

    if (filter.isProfane(message)) {
      // console.log(filter.clean(`Don't be an ${message}`));
      return callback?.('Profanity is not allowed!');
    }

    io.to(user.room).emit('message', generateMessage(user.username, message));
    callback?.();
  });

  socket.on('sendLocation', (position, callback) => {
    const user = getUser(socket.id);
    const { latitude, longitude } = position;

    io.to(user.room).emit(
      'locationMessage',
      generateLocationMessage(
        user.username,
        `https://google.com/maps?q=${latitude},${longitude}`
      )
    );
    callback?.();
  });

  socket.on('disconnect', () => {
    const user = removeUser(socket.id);
    if (user) {
      io.emit(
        'message',
        generateMessage('Admin', `${user.username} has left!`)
      );
      io.to(user.room).emit('roomData', {
        room: user.room,
        users: getUsersInRoom(user.room),
      });
    }
  });
});

server.listen(PORT, HOST, () => {
  console.log(`Server is listen on http://${HOST}:${PORT}`);
});
