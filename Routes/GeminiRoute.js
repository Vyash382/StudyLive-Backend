const express = require('express');
const GeminiRouter = express.Router();
const { client, connect } = require('../connectDB.js');
const { verifyJWT } = require('../utils/VerifyJWT.js');
GeminiRouter.post('/summary',(req,res)=>{
    const {group_id,content} = req.body;
    console.log(group_id);
    console.log(content);
    res.send('good');
});
module.exports = {GeminiRouter};