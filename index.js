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

dotenv.config();
connect();

const app = express();
const server = http.createServer(app);

app.use(cors({
    origin: '*',
    credentials: false
}));
app.use(express.json());

app.use('/api/user', userRouter);
app.use('/api/friend', friendRouter);
app.use('/api/notifications', notificationRouter);
app.use('/api/chat', chatRouter);
app.use('/api/conference',ConferenceRouter);
app.get('/',(req,res)=>{res.send('Hello World')});
initializeSocket(server); 

const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0' ,() => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
