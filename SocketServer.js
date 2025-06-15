// socketServer.js
const { Server } = require('socket.io');

const connectedUsers = new Map();
let io = null;

function initializeSocket(server) {
  io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
      credentials: false
    }
  });

  const { socketAuthenticator } = require('./utils/SocketAuthenticator');
  io.use(socketAuthenticator);

  io.on('connection', (socket) => {
    const userId = socket.userId;
    console.log(`✅ User connected: ${userId}`);
    connectedUsers.set(userId, socket.id);
    console.log(connectedUsers);
    socket.on('disconnect', () => {
      console.log(`❌ User disconnected: ${userId}`);
      connectedUsers.delete(userId);
    });
  });
}

function getIO() {
  if (!io) {
    throw new Error("Socket.IO not initialized!");
  }
  return io;
}

function getConnectedUsers() {
  return connectedUsers;
}

module.exports = {
  initializeSocket,
  getIO,
  getConnectedUsers
};
