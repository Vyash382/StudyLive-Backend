const express = require('express');
const axios = require('axios');
const ConferenceRouter = express.Router();
const {verifyJWT} = require('../utils/VerifyJWT.js');
const jwt = require('jsonwebtoken')
const { v4: uuidv4 } = require('uuid');
const { getIO, getConnectedUsers } = require('../SocketServer.js');
const { client } = require('../connectDB.js');
require('dotenv').config();
const generateManagementToken = () => {
  const payload = {
    access_key: process.env.HMS_APP_ACCESS_KEY,
    type: 'management',
    version: 2,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60, // 24 hours
    jti: uuidv4(), // ✅ add this line
  };

  const token = jwt.sign(payload, process.env.HMS_APP_SECRET, {
    algorithm: 'HS256',
    header: {
      alg: 'HS256',
      typ: 'JWT',
      version: 2,
    },
  });

  return token;
};
ConferenceRouter.post('/create-room', async (req, res) => {
  const { roomName } = req.body;
  const managementToken = generateManagementToken();
  try {
    const response = await axios.post(
      'https://api.100ms.live/v2/rooms',
      {
        name: roomName,
        description: 'StudyLive session room',
        template_id: process.env.HMS_TEMPLATE_ID,
      },
      {
        headers: {
          Authorization: `Bearer ${managementToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    res.status(200).json(response.data);
  } catch (error) {
    console.error('Room creation error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Room creation failed' });
  }
});
ConferenceRouter.post('/get-token',verifyJWT,async (req, res) => {
  const user_id = req.user.id; // from your JWT
  const { room_id, role } = req.body;

  try {
    const response = await axios.post(
      'https://api.100ms.live/v2/room-tokens',
      {
        user_id,
        role,
        room_id,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.HMS_APP_SECRET}`,
          'Content-Type': 'application/json',
        },
      }
    );

    res.status(200).json({ token: response.data.token });
  } catch (error) {
    console.error('Token generation error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Token generation failed' });
  }
});
ConferenceRouter.post('/send-invitation', verifyJWT, async (req, res) => {
  const { invitees, roomName, roomId } = req.body; // destructuring object, not array!
  const connectedUsers = getConnectedUsers(); // e.g., { "userId1": "socketId1", ... }

  try {
    const userResult = await client.query('SELECT name FROM users WHERE id = $1', [req.user.id]);
    const inviterName = userResult.rows[0]?.name;

    const io = getIO();

    const data = {
      inviter: inviterName,
      roomName,
      roomId
    };
    console.log(connectedUsers);
    invitees.forEach((inviteeId) => {
      console.log(typeof(inviteeId));
      console.log(inviteeId);
      const socketId = connectedUsers.get(Number(inviteeId));
      console.log(socketId);
      if (socketId) {
        io.to(socketId).emit('invitation', data);
        console.log(`Sent invitation to ${inviteeId} at socket ${socketId}`);
      }
    });

    res.status(200).json({ type: true, message: 'Invitations sent successfully' });

  } catch (err) {
    console.error('Error sending invitation:', err);
    res.status(500).json({ type: false, message: 'Failed to send invitations' });
  }
});

module.exports = {ConferenceRouter};
