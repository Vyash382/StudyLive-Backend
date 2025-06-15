const express = require('express');
const chatRouter = express.Router();
const { client } = require('../connectDB.js');
const { verifyJWT } = require('../utils/VerifyJWT.js');
const { multerUpload } = require('../utils/Cloudinary.js');
const { getIO, getConnectedUsers } = require('../SocketServer.js');
// ✅ Get all friends with the last message
chatRouter.post('/getFriends', verifyJWT, async (req, res) => {
  const my_id = req.user.id;

  try {
    const response = await client.query(
      `
      SELECT u.id, u.name, u.photo,
        (
          SELECT m.content
          FROM messages m
          WHERE 
            (m.sender_id = $1 AND m.receiver_id = u.id) OR 
            (m.sender_id = u.id AND m.receiver_id = $1)
          ORDER BY m.created_at DESC
          LIMIT 1
        ) AS lastMessage,
        (
          SELECT m.type
          FROM messages m
          WHERE 
            (m.sender_id = $1 AND m.receiver_id = u.id) OR 
            (m.sender_id = u.id AND m.receiver_id = $1)
          ORDER BY m.created_at DESC
          LIMIT 1
        ) AS type
      FROM users u
      WHERE u.id IN (
        SELECT sender_id FROM friend_requests WHERE receiver_id = $1 AND status = 'accepted'
        UNION
        SELECT receiver_id FROM friend_requests WHERE sender_id = $1 AND status = 'accepted'
      )
      `,
      [my_id]
    );

    res.status(200).json({ type: true, friends: response.rows });
  } catch (err) {
    console.error('Error fetching friends:', err);
    res.status(500).json({ type: false, msg: 'Server error' });
  }
});


// ✅ Get chat history between two users
chatRouter.post('/getChat', verifyJWT, async (req, res) => {
  const my_id = req.user.id;
  const { other_id } = req.body;

  if (!other_id) {
    return res.status(400).json({ type: false, message: 'Other user ID missing' });
  }

  try {
    const response = await client.query(
      `
      SELECT sender_id, type, content, created_at
      FROM messages
      WHERE (sender_id = $1 AND receiver_id = $2)
         OR (sender_id = $2 AND receiver_id = $1)
      ORDER BY created_at ASC
      `,
      [my_id, other_id]
    );
    res.status(200).json({ type: true, messages: response.rows });
  } catch (err) {
    console.error('Error fetching chat:', err);
    res.status(500).json({ type: false, error: 'Failed to fetch messages' });
  }
});



chatRouter.post(
  '/sendMessage',
  verifyJWT,
  multerUpload.single('file'),
  async (req, res) => {
    const my_id = req.user.id;
    const { other_id, content } = req.body;

    if (!other_id) {
      return res.status(400).json({ type: false, message: 'Receiver ID missing' });
    }

    try {
      let messageType = 'text';
      let messageContent = content;

      if (req.file) {
        messageType = 'media';
        messageContent = req.file.path;
      }

      const result = await client.query(
        `
        INSERT INTO messages (sender_id, receiver_id, type, content)
        VALUES ($1, $2, $3, $4)
        RETURNING sender_id, receiver_id, type, content, created_at
        `,
        [my_id, other_id, messageType, messageContent]
      );
      const connectedUsers = getConnectedUsers();
      const io = getIO();
      const socket_of_user = connectedUsers.get(Number(other_id)); 
      const data = {
        sender_id: my_id,
        type: messageType,
        content: messageContent,
      };

      if (socket_of_user) {
        io.to(socket_of_user).emit('newMessage', data); 
      }

      res.status(200).json({
        type: true,
        message: 'Sent Successfully',
        data: result.rows[0],
      });
    } catch (err) {
      console.error('Send message error:', err);
      res.status(500).json({ type: false, message: 'Internal Server Error' });
    }
  }
);


module.exports = { chatRouter };
