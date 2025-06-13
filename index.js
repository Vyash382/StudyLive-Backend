const express = require('express')
const dotenv = require('dotenv')
const {connect} = require('./connectDB.js')
const { userRouter } = require('./Routes/UserRoute.js');
const cors = require('cors');
dotenv.config();
connect();
const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/user',userRouter);
app.listen(process.env.PORT || 5000,()=>{
    console.log(`Server Listening on port ${process.env.PORT}`)
});

