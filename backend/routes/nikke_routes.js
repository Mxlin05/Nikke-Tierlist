const express = require('express');
const router = express.Router();
const pool = require("../db.js");

//for mitler's eyes. async calls are just to send a command to the database and pray something comes back, its done asynchronously so 
// that the entire server doesn't sit there waiting for the database to respond, single threaded but allows you to move on to do something else

router.get('/', async (req, res) => { 
    //grab all the nikkes
    try {
        const [rows] = await pool.query("SELECT * FROM characters UNION ALL SELECT * FROM treasures"); //use [rows] to do result[0], destructure array to grab data only and not metadata. {data, metadata}
        res.json(rows);
    }
    catch (error){
        console.error("Database query for all characters failed", error);
        res.status(500).json({error: "Failed to fetch all characters"});
    }
});

module.exports = router;