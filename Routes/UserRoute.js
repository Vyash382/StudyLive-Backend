const express = require('express')
const userRouter = express.Router();
const {client} = require('../connectDB.js');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const {multerUpload} = require('../utils/Cloudinary.js');
const { verifyJWT } = require('../utils/VerifyJWT.js');
const saltRounds = 10;
userRouter.post('/login',async (req,res)=>{
    const {email,password} = req.body;
    if((!email) || (!password)){
        res.status(400).json({type:false,message:"Wrong Credentials"});
        return;
    }
    const userInDb = await client.query('select * from users where email=$1',[email]);
    const users = userInDb.rows;
    if(users.length==0){
        res.status(400).json({type:false,message:"Wrong Credentials"});
        return;
    }
    const hashedPassword = users[0].password;
    const id = users[0].id;
    const isMatch = await bcrypt.compare(password,hashedPassword);
    if (!isMatch) {
        res.status(400).json({type:false,message:"Wrong Credentials"});
        return;
    } 
    const token = jwt.sign(
            {id,email}, 
            process.env.JWT_SECRET,                
            { expiresIn: '1h' }                   
        );
    res.status(200).json({type:true,token});
})
userRouter.post('/register',multerUpload.single('file'),async(req,res)=>{
    
    if (!req.file) {
        return res.status(200).json({ type:false,message:"Give full details1"});
    }
    const fileUrl = req.file.path;
    const {name,email,password} = req.body;
    if((!name) || (!email) || (!password)){
        return res.status(200).json({ type:false,message:"Give full details2"});
    }
    const userInDb = await client.query('select * from users where email=$1',[email]);
    const users = userInDb.rows;
    if(users.length!=0){
        res.status(200).json({type:false,message:"User Already Exists"});
        return;
    }
    const hashedPassword = await bcrypt.hash(password,saltRounds);
    try {
        await client.query('insert into users (name,email,password,photo) values ($1,$2,$3,$4)',[name,email,hashedPassword,fileUrl]);
    } catch (error) {
        res.status(200).json({type:false,message:error});
        return;
    }
    res.status(200).json({type:true,message:"Account Created Successfully"});
})
userRouter.post('/getDetails',verifyJWT,(req,res)=>{
    res.status(200).json({type:true,user:req.user});
})

module.exports= {userRouter};