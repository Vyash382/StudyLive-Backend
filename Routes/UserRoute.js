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
userRouter.post('/getDetails',verifyJWT,(req,res)=>{ //My details
    res.status(200).json({type:true,user:req.user});
})
userRouter.post('/searchUsers', verifyJWT, async (req, res) => {
  const { id } = req.user;
  const { query } = req.body;

  if (!query) {
    return res.status(400).json({ type: false, message: "give the query" });
  }

  try {
    const response = await client.query(
      `SELECT id, name, email ,photo
        FROM users
        WHERE LOWER(name) LIKE '%' || LOWER($1) || '%'
        OR email = $1;`,
      [query]
    );

    const users = await Promise.all(
      response.rows.map(async (user) => {
        const status = await get_friend_status(user.id, id);
        return {
          ...user,
          status
        };
      })
    );

    return res.status(200).json({ type: true, results: users });
  } catch (err) {
    console.error("Search error:", err);
    return res.status(500).json({ type: false, message: "Server error" });
  }
});

async function get_friend_status(id1, id2) {
  const response = await client.query(
    `SELECT status 
     FROM friend_requests 
     WHERE (sender_id = $1 AND receiver_id = $2) 
        OR (sender_id = $2 AND receiver_id = $1)`,
    [id1, id2]
  );

  if (response.rows.length === 0) return "Add";

  if (response.rows[0].status === "accepted") return "Unfriend";
  else return "Action Pending";
}

module.exports= {userRouter};