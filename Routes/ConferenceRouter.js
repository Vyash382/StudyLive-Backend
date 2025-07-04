const express = require('express');
const axios = require('axios');
const ConferenceRouter = express.Router();
const { verifyJWT } = require('../utils/VerifyJWT.js');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { getIO, getConnectedUsers } = require('../SocketServer.js');
const { client } = require('../connectDB.js');
require('dotenv').config();

// Generate Management Token
const generateManagementToken = () => {
  const payload = {
    access_key: process.env.HMS_APP_ACCESS_KEY,
    type: 'management',
    version: 2,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60,
    jti: uuidv4(),
  };

  return jwt.sign(payload, process.env.HMS_APP_SECRET, {
    algorithm: 'HS256',
    header: {
      alg: 'HS256',
      typ: 'JWT',
      version: 2,
    },
  });
};

// Generate App Token
const generateAppToken = (room_id, user_id, role) => {
  const payload = {
    access_key: process.env.HMS_APP_ACCESS_KEY,
    room_id,
    user_id:String(user_id),
    role,
    type: 'app',
    version: 2,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60,
    jti: uuidv4(),
  };

  return jwt.sign(payload, process.env.HMS_APP_SECRET, {
    algorithm: 'HS256',
    header: {
      alg: 'HS256',
      typ: 'JWT',
      version: 2,
    },
  });
};

// Create Room
ConferenceRouter.post('/create-room',verifyJWT,async (req, res) => {
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
    const response2 = await client.query('insert into groups (name,created_by) values ($1,$2) returning id',[roomName,req.user.id]);
    const id = response2.rows[0].id;
    const response3 = await client.query('insert into group_members (group_id,user_id) values ($1,$2)',[id,req.user.id]);
    response.data.group_id=id;
    res.status(200).json(response.data);
  } catch (error) {
    console.error('Room creation error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Room creation failed' });
  }
});

// Generate Token (App JWT - no 404s)
ConferenceRouter.post('/get-token', verifyJWT, async (req, res) => {
  const user_id = req.user.id;
  const { room_id, role } = req.body;

  try {
    const token = generateAppToken(room_id, user_id, role);
    res.status(200).json({ token });
  } catch (err) {
    console.error('Token generation error:', err.message);
    res.status(500).json({ error: 'Token generation failed' });
  }
});

// Send Invitations
ConferenceRouter.post('/send-invitation', verifyJWT, async (req, res) => {
  const { invitees, roomName, roomId,group_id } = req.body;
  const connectedUsers = getConnectedUsers(); // Map<userId, socketId>

  try {
    const userResult = await client.query('SELECT name FROM users WHERE id = $1', [req.user.id]);
    const inviterName = userResult.rows[0]?.name;
    const io = getIO();

    const data = { inviter: inviterName, roomName, roomId,group_id };

    invitees.forEach((inviteeId) => {
      const socketId = connectedUsers.get(Number(inviteeId));
      if (socketId) {
        io.to(socketId).emit('invitation', data);
      }
    });

    res.status(200).json({ type: true, message: 'Invitations sent successfully' });

  } catch (err) {
    console.error('Error sending invitation:', err);
    res.status(500).json({ type: false, message: 'Failed to send invitations' });
  }
});
ConferenceRouter.post('/accept-invitation',verifyJWT,async (req,res)=>{

  const {group_id} = req.body;
  const response3 = await client.query('insert into group_members (group_id,user_id) values ($1,$2)',[group_id,req.user.id]);
  res.status(200).json({type:true,message:'Successful'});
})
ConferenceRouter.post('/get-previous',verifyJWT,async(req,res)=>{
    const user = req.user;
    const response = await client.query(`SELECT 
    g.name AS name,
    g.summary AS summary,
    ARRAY_AGG(u.email) AS members
    FROM group_members gm_current
    JOIN groups g ON gm_current.group_id = g.id
    JOIN group_members gm_all ON g.id = gm_all.group_id
    JOIN users u ON gm_all.user_id = u.id
    WHERE gm_current.user_id = $1
    GROUP BY g.id;`,[user.id]);
    res.send(response.rows);
})
ConferenceRouter.post('/recording-webhook', (req, res) => {
  const event = req.body;

  if (event.type === 'recording.success' ||
  event.type === "beam.recording.success") {
    
    console.log("Got recording:", event.data.assets[0].url);
    
  } else {
    
    console.log("Ignored event:", event.type);
  }

  res.sendStatus(200);
});
module.exports = { ConferenceRouter };
