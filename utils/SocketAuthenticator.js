const jwt = require('jsonwebtoken');
const socketAuthenticator = (socket,next)=>{
    const token = socket.handshake.headers['authorization']?.split(' ')[1];
    if (!token) return next(new Error('Authentication error'));

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.userId = decoded.id;
        next();
    } catch (err) {
        console.log('JWT verification failed:', err);
        return next(new Error('Authentication error'));
  }
}
module.exports ={socketAuthenticator};