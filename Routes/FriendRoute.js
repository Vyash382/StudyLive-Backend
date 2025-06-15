const express = require('express')
const friendRouter = express.Router();
const {client} = require('../connectDB.js');
const { verifyJWT } = require('../utils/VerifyJWT.js');
friendRouter.post('/sendRequest',verifyJWT,async(req,res)=>{
    try{
    const sender = req.user.id;
    const {receiver} = req.body;
    const response = await client.query(`insert into friend_requests (sender_id,receiver_id,status) values ($1,$2,'pending')`,[sender,receiver]);
    console.log(response);
    res.status(200).json({type:true,message:"Friend Request sent"});
    }
    catch(e){
        res.status(400).json({type:false,message:e});
    }
});
friendRouter.post('/unfriend',verifyJWT,async(req,res)=>{
    try{
    const sender = req.user.id;
    const {receiver} = req.body;
    const response = await client.query(`DELETE FROM friend_requests WHERE (sender_id = $1 AND receiver_id = $2) OR (sender_id = $2 AND receiver_id = $1)`,[sender, receiver]);
    res.status(200).json({type:true,message:"Unfriend Successful"});
    }
    catch(e){
        res.status(400).json({type:false,message:e});
    }
});

module.exports = {friendRouter};