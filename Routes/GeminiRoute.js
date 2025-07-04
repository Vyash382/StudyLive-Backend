const express = require('express');
const GeminiRouter = express.Router();
const { client, connect } = require('../connectDB.js');
const { verifyJWT } = require('../utils/VerifyJWT.js');
const {gemini} = require('../GeminiApi.js');
GeminiRouter.post('/summary',async (req,res)=>{
    const {group_id,content} = req.body;
    const response = 'summary creation in progress';
    console.log(response);
    await client.query('UPDATE groups SET summary = $1 WHERE id = $2', [response, group_id]);
    res.send(response);
});
module.exports = {GeminiRouter};