const express = require('express');
const notificationRouter = express.Router();
const { client } = require('../connectDB.js');
const { verifyJWT } = require('../utils/VerifyJWT.js');

notificationRouter.post('/getNotifications', verifyJWT, async (req, res) => {
    const { id } = req.user;

    try {
        const responses = await client.query(
            `SELECT sender_id, receiver_id, status FROM friend_requests 
             WHERE (sender_id = $1 AND status = 'accepted') 
             OR (receiver_id = $1 AND status = 'pending')`, 
            [id]
        );

        let results = [];

        for (let response of responses.rows) {
            let otherUserId;
            let type;

            if (response.sender_id == id) {
                otherUserId = response.receiver_id;
                type = 1;
            } else {
                otherUserId = response.sender_id;
                type = 2; 
            }

            const userDetails = await get_user_details(otherUserId);
            userDetails.type = type;
            results.push(userDetails);
        }

        return res.status(200).json({ type: true, results });

    } catch (err) {
        console.error('Error fetching notifications:', err);
        return res.status(500).json({ type: false, error: 'Server error' });
    }
});
notificationRouter.post('/acceptRequest',verifyJWT,async(req,res)=>{
    const {id} = req.user;
    const id2 = req.body.id;
    const response = await client.query(`update friend_requests set status = 'accepted' where sender_id=$1 and receiver_id=$2`,[id2,id]);
    res.status(200).json({type:true});
})
notificationRouter.post('/rejectRequest',verifyJWT,async (req,res)=>{
    const {id} = req.user;
    const id2 = req.body.id;
    const response = await client.query('delete from friend_requests  where sender_id=$1 and receiver_id=$2',[id2,id]);
    res.status(200).json({type:true});
})
async function get_user_details(id) {
    const response = await client.query('SELECT id, name, photo FROM users WHERE id = $1', [id]);
    return response.rows[0];
}

module.exports = { notificationRouter };
