const express = require('express');
const dotenv = require('dotenv');
const http = require('http');
const cors = require('cors');
const { connect } = require('./connectDB.js');
const { userRouter } = require('./Routes/UserRoute.js');
const { friendRouter } = require('./Routes/FriendRoute.js');
const { notificationRouter } = require('./Routes/NotificationRoute.js');
const { chatRouter } = require('./Routes/ChatRoute.js');
const { initializeSocket } = require('./SocketServer.js'); 
const { ConferenceRouter } = require('./Routes/ConferenceRouter.js');
const { GeminiRouter } = require('./Routes/GeminiRoute.js');
const rateLimiter = require('./utils/RateLimitter.js');

dotenv.config();
connect();

const app = express();
const server = http.createServer(app);


app.use(cors({
    origin: '*',
    credentials: false
}));
app.use(express.json());
app.use(rateLimiter);


app.use('/api/user', userRouter);
app.use('/api/friend', friendRouter);
app.use('/api/notifications', notificationRouter);
app.use('/api/chat', chatRouter);
app.use('/api/conference', ConferenceRouter);
app.use('/api/gemini', GeminiRouter);


app.get('/', (req, res) => {
    res.send('Hello World');
});


initializeSocket(server);


app.use((err, req, res, next) => {
    console.error('🔥 Global Error:', err.stack);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal Server Error',
    });
});


process.on('unhandledRejection', (err) => {
    console.error('🚨 Unhandled Rejection:', err);
});


process.on('uncaughtException', (err) => {
    console.error('❌ Uncaught Exception:', err);
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
