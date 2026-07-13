const express = require('express');
const router = express.Router();
const pool = require("../db.js");

//for mitler's eyes. async calls are just to send a command to the database and pray something comes back, its done asynchronously so 
// that the entire server doesn't sit there waiting for the database to respond, single threaded but allows you to move on to do something else
/*
data = [[{name: alice},{name: anis}][metadata]], [rows] = data[0], rows is [{json}, {}]
Yo, try to do all your filtering and checking logic with mysql rather than js
*/
router.get('/', async (req, res) => { 
    //grab all the nikkes
    try {
        const [rows] = await pool.query("SELECT * FROM characters UNION ALL SELECT * FROM treasures ORDER BY name ASC"); //use [rows] to do result[0], destructure array to grab data only and not metadata. {data, metadata}
        res.status(200).json(rows);
    }
    catch (error){
        console.error("Database query for all characters failed", error);
        res.status(500).json({error: "Failed to fetch all characters"});
    }
});

router.post('/create/new', async (req, res) => {
    //create the initial unranked layer, where all nikkes are initially in
    //args: username, title, description
    try{
        const {username, title, description} = req.body; //grab all the params in the request body
        const [existing] = await pool.query("SELECT username FROM tierrows where username = ?", [username]);//grab all usernames from the tier layers that match username

        if (existing.length > 0){ //For now, users can only make one tier list
            return res.status(400).json({error: "A tier list already exists"});
        }

        const [rows] = await pool.query("SELECT name FROM characters UNION ALL SELECT name FROM treasures"); // grab all character names
        const all_names = rows.map(row => row.name);

        const [creation] = await pool.query(`INSERT INTO tierrows (username, tier_title, layer_title, description, sort_order, isUnranked, nikkes) 
            VALUES (?, ?, ?, ?, ?, ?, ?)`, [username, title, "Unranked", description, 1, true, JSON.stringify(all_names)]); //create a new unranked row with all nikkes in the JSON field

        const [newlyMade] = await pool.query("select * from tierrows where id = ?", [creation.insertId]); 

        res.status(201).json(newlyMade);
    }
    catch (error){
        console.error("Database query to create initial ranking failed", error);
        res.status(500).json({error: "Failed to create the foundation of the tier list"});
    }
});

router.delete('/:username', async (req, res) => {
    //delete the tierlist a user has
    try {
        const {username} = req.params;
        const [result] = await pool.query("delete from tierrows where username = ?", [username]);
        
        if (result.affectedRows === 0){
            res.status(404).json({error: "No tier list found for this user to delete"})
        }
        else{
            res.status(200).json({message: "tierlist has been deleted"});
        }
    }
    catch(error){
        console.error("Database query to delete custom tierlist failed");
        res.status(500).json({error: "Failed to delete the tier list"});
    }
});

router.get('/retrieve/:username', async(req, res) => {
    //grab all tier lists layers for a user
    //arg: username
    try{
        const {username} = req.params;
        const [rows] = await pool.query("SELECT * FROM tierrows where username = ? ORDER BY sort_order DESC", [username]); //grab all layers ordered by the sort_order

        res.status(200).json(rows)
    }
    catch (error){
        console.error("Database query for tier lists failed", error);
        res.status(500).json({error: "Failed to retrieve any tier lists"});
    }
});

router.post('/create/add', async (req, res) => {
    //add a new layer 
    //arg: username, existing title_layer, layer_title
    try{
        const {username, tier_title, layer_title} = req.body;
        const [rows] = await pool.query("SELECT MAX(sort_order) as max_order FROM tierrows where username = ?", [username]); //Grabs the greatest of sort_order as max_order
        const [titles] = await pool.query("SELECT layer_title FROM tierrows where username = ? and layer_title = ?", [username, layer_title]);

        if (rows[0].max_order === null){
            return res.status(404).json({error: "No existing tier list for this user"});
        }
        
        if (titles.length > 0){
            return res.status(409).json({error: "No two layers should have the same name"});
        }

        const [creation] = await pool.query(`INSERT INTO tierrows (username, tier_title, layer_title, description, sort_order, isUnranked, nikkes)
            VALUES (?, ?, ?, ?, ?, ?, ?)`, [username, tier_title, layer_title, "", (rows[0].max_order + 1), false, JSON.stringify([])]);
        
        const [newlyMade] = await pool.query(`select * from tierrows where id = ?`, [creation.insertId]);
        res.status(200).json(newlyMade);
    }
    catch(error){
        console.error("Database query failed to add a layer", error);
        res.status(500).json({error: "Failed to create a layer"});
    }
});

router.post('/create/delete', async (req, res) => {
    //delete a layer, rescue nikkes into unranked pile, and update sort_order. 
    //must use a singular conneciton rather any random one from the pool than pool, because we are doing 4 separate queries that all modify the db, and can leave the db corrupted if any of the queries fail
    const connection = await pool.getConnection();
    try{
        const {username, layer_title} = req.body;
        
        await connection.beginTransaction(); //tell connection to start all-or-nothing transaction

        if (layer_title === "Unranked"){
            await connection.rollback();
            return res.status(404).json({error: "You cannot delete the Unranked Layer"});
        }

        const [layerToDelete] = await connection.query("SELECT id, sort_order, nikkes FROM tierrows where username = ? and layer_title = ?", [username, layer_title]);       //grab all characters within the layer you want to delete
        const [unrankedLayer] = await connection.query("SELECT * FROM tierrows where username = ? and isUnranked = ?", [username, true]); //grab the unranked layer
        
        if (layerToDelete.length <= 0){
            await connection.rollback();
            return res.status(404).json({error: "No existing tier list for this user"});
        }
        
        //update the unranked nikkes by appending the ones from the layer you are going to delete
        if (layerToDelete[0].nikkes.length > 0){
            const updatedList = [...(unrankedLayer[0].nikkes || []), ...(layerToDelete[0].nikkes || [])].sort();
            await connection.query("UPDATE tierrows SET nikkes = ? where id = ?", [JSON.stringify(updatedList), unrankedLayer[0].id]);
        }   

        //delete the layer and update the sort_order numbers
        await connection.query("DELETE FROM tierrows where id = ?", [layerToDelete[0].id]);
        await connection.query("UPDATE tierrows SET sort_order = sort_order - 1 where username = ? and sort_order > ?", [username, layerToDelete[0].sort_order]);
        
        const [newlyUpdated] = await connection.query("select * from tierrows where username = ? order by sort_order DESC", [username]);
        connection.commit();
        res.status(200).json(newlyUpdated);
    }
    catch(error){
        await connection.rollback();
        console.error("Database query to delete layer has failed", error);
        res.status(500).json({error: "Failed to delete layer"});
    }
    finally {
        //release the connection back to the pool
        connection.release();
    }
});

router.post('/move/up', async (req, res) => {
    //swaps the selected tier layer location with the layer directly above it
    const connection = await pool.getConnection();
    try{
        const {username, tier_title, layer_title} = req.body;
        await connection.beginTransaction();

        if (layer_title === "Unranked"){
            await connection.rollback();
            return res.status(404).json({error: "You cannot move the Unranked Layer"});
        }
        
        const [rows] = await connection.query("select * from tierrows where username = ? and tier_title = ? and layer_title = ?", [username, tier_title, layer_title]);
        if (rows.length <= 0){
            await connection.rollback();
            return res.status(404).json({error: "Tier layer doesn't exist"});
        }

        const [layer_above] = await connection.query("select * from tierrows where username = ? and tier_title = ? and sort_order = ?", [username, tier_title, rows[0].sort_order + 1]);
        if (layer_above.length <= 0){
            await connection.rollback();
            return res.status(404).json({error: "Why the hell are you trying to move the top layer even higher"});
        }

        await connection.query("Update tierrows set sort_order = ? where id = ?", [layer_above[0].sort_order, rows[0].id]);
        await connection.query("Update tierrows set sort_order = ? where id = ?", [rows[0].sort_order, layer_above[0].id]);
        
        const [newlyUpdated] = await connection.query("select * from tierrows where username = ? and tier_title = ? order by sort_order DESC", [username, tier_title]);
        connection.commit();
        res.status(200).json(newlyUpdated);
    }
    catch(error){
        await connection.rollback();
        console.error("Database query to move a tier layer up one has failed", error);
        res.status(500).json({error: "Failed to move layer up"});
    }
    finally{
        connection.release();
    }
});

router.post('/move/down', async (req, res) => {
    //swaps the selected tier layer location with the layer directly above it
    const connection = await pool.getConnection();
    try{
        const {username, tier_title, layer_title} = req.body;
        await connection.beginTransaction();

        if (layer_title === "Unranked"){
            await connection.rollback();
            return res.status(404).json({error: "You cannot move the Unranked Layer"});
        }
        
        const [rows] = await connection.query("select * from tierrows where username = ? and tier_title = ? and layer_title = ?", [username, tier_title, layer_title]);
        if (rows.length <= 0){
            await connection.rollback();
            return res.status(404).json({error: "Tier layer doesn't exist"});
        }

        const [layer_below] = await connection.query("select * from tierrows where username = ? and tier_title = ? and sort_order = ?", [username, tier_title, rows[0].sort_order - 1]);
        
        if (layer_below.length <= 0){
            await connection.rollback();
            return res.status(400).json({error: "No layer below to swap with."});
        }

        if (layer_below[0].isUnranked === 1){
            await connection.rollback();
            return res.status(400).json({error: "You can't move the layer below the unranked layer"});
        }

        await connection.query("Update tierrows set sort_order = ? where id = ?", [layer_below[0].sort_order, rows[0].id]);
        await connection.query("Update tierrows set sort_order = ? where id = ?", [rows[0].sort_order, layer_below[0].id]);
        
        const [newlyUpdated] = await connection.query("select * from tierrows where username = ? and tier_title = ? order by sort_order DESC", [username, tier_title]);
        connection.commit();
        res.status(200).json(newlyUpdated);
    }
    catch(error){
        await connection.rollback();
        console.error("Database query to move a tier layer down one has failed", error); 
        res.status(500).json({error: "Failed to move layer down"});
    }
    finally{
        connection.release();
    }
});

router.post('/character/move', async (req, res) => {
    const connection = await pool.getConnection();
    try{
        const {username, tier_title, layer_title_location, layer_title_destination, nikke} = req.body;

        await connection.beginTransaction();

        const [current] = await connection.query("select * from tierrows where username = ? and tier_title = ? and layer_title = ?", [username, tier_title, layer_title_location]);
        const [destination] = await connection.query("select * from tierrows where username = ? and tier_title = ? and layer_title = ?", [username, tier_title, layer_title_destination]);
    
        if (current.length <= 0){
            await connection.rollback();
            return res.status(404).json({error: "Current tier for nikke not found"});
        }
    
        if (destination.length <= 0){
            await connection.rollback();
            return res.status(404).json({error: "Location tier for nikke not found"});
        }
    
        if (current[0].nikkes && current[0].nikkes.includes(nikke)){
            const location_nikkes = current[0].nikkes.filter((nikke_list) => nikke_list !== nikke);
            const destination_nikkes = [...(destination[0].nikkes || []), nikke].sort();
    
            await connection.query("update tierrows set nikkes = ? where username = ? and tier_title = ? and layer_title = ?", [JSON.stringify(location_nikkes), username, tier_title, layer_title_location]);
            await connection.query("update tierrows set nikkes = ? where username = ? and tier_title = ? and  layer_title = ?", [JSON.stringify(destination_nikkes), username, tier_title, layer_title_destination]);
        }
        else{
            await connection.rollback();
            return res.status(400).json({error: "Cannot move a nikke that doesn't exist in the current tier for some reason"});
        }
    
        const [newlyMade] = await connection.query("select * from tierrows where username = ? and tier_title = ? order by sort_order DESC", [username, tier_title]);
        await connection.commit();
        res.status(200).json(newlyMade);

    }
    catch(error){
        await connection.rollback();
        console.error("Failed to move character:", error);
        res.status(500).json({error: "Database failed to move character"});
    }
    finally{
        connection.release();
    }
});

module.exports = router;