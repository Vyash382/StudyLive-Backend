const { Server } = require('socket.io');

const connectedUsers = new Map();
let io = null;

function initializeSocket(server) {
  io = new Server(server, {
    cors: {
      origin: '*', // Allow all origins (for dev); restrict in production
      methods: ['GET', 'POST'],
      credentials: false,
    },
  });

  const { socketAuthenticator } = require('./utils/SocketAuthenticator');
  io.use(socketAuthenticator);

  io.on('connection', (socket) => {
    const userId = socket.userId;
    console.log(`✅ User connected: ${userId}`);
    connectedUsers.set(userId, socket.id);
    console.log('🧑‍🤝‍🧑 Connected Users:', connectedUsers);

    // When the user joins a specific room
    socket.on('join-room', (roomId) => {
      socket.join(roomId);
      console.log(`📥 User ${userId} joined room ${roomId}`);
    });

    // Receive a drawing stroke from one peer and send it to others
    socket.on('send-drawing', ({ roomId, data }) => {
      socket.to(roomId).emit('receive-drawing', data);
    });

    // Receive text updates from one peer and broadcast to others
    socket.on('send-text', ({ roomId, content }) => {
      socket.to(roomId).emit('receive-text', content);
    });
    socket.on('send-group-messages',({ roomId,sender,data})=>{
      socket.to(roomId).emit('send-group-messages',{sender,data});
    })
    // Optional: log all events for debugging
    // socket.onAny((event, ...args) => {
    //   console.log(`📡 Event: ${event}`, args);
    // });

    // When user disconnects
    socket.on('disconnect', () => {
      console.log(`❌ User disconnected: ${userId}`);
      connectedUsers.delete(userId);
    });
  });
}

function getIO() {
  if (!io) {
    throw new Error('Socket.IO not initialized!');
  }
  return io;
}

function getConnectedUsers() {
  return connectedUsers;
}

module.exports = {
  initializeSocket,
  getIO,
  getConnectedUsers,
};
