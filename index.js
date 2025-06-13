const express = require('express')
const dotenv = require('dotenv')
const {connect,client} = require('./connectDB.js')
const {multerUpload} = require('./utils/Cloudinary.js')
dotenv.config();
connect();
const app = express();
app.use(express.json());

app.listen(process.env.PORT || 5000,()=>{
    console.log(`Server Listening on port ${process.env.PORT}`)
});

