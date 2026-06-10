const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../db.js');

const router = express.Router();
 //register and login should ideadly also return the id and username, but its fine to just reload the page for now
router.post('/register', async (req, res) => {
    //register a user into the database for creating an account, and return a cookie
    try{
        const {username, password} = req.body; //grab the arguments in the api call

        const [existingUsers] = await pool.query('SELECT * FROM users WHERE username = ?', [username]); //grab all users that have the same username
        if (existingUsers.length > 0){
            return res.status(400).json({error: 'Username is already taken'});
        }

        const hashedPassword = await bcrypt.hash(password, 10); //hash the password 2^10 times

        const [result] = await pool.query('INSERT INTO users (username, password) VALUES (?, ?)', [username, hashedPassword]); // insert the new user into the database

        const token = jwt.sign(
            {userId: result.insertId, username: username},
            process.env.JWT_SECRET,
            {expiresIn: '7d'}
        )

        res.cookie('nikke_token', token, {
            httpOnly: true, //prevent javascript from reading the cookie
            secure: false,   //change this to true to use https encrypted tunnels later
            sameSite: 'lax', //protects against xss
            maxAge: 7*24*60*60*1000 
        });

        res.status(201).json({message: 'User created and logged in successfully'});
    }
    catch (error){
        console.error('Registration error: ', error);
        res.status(500).json({ error: 'Server error during registration '});
    }
});
//must use POST so sensitive information isn't stored in the URL like GET does
router.post('/login', async (req, res) => {
    //login a user, and return a token (check this)
    try{
        const {username, password} = req.body; //grab the arguments

        //users will only be results out of the [results, metadata] returned
        const [users] = await pool.query('SELECT * FROM users where username = ?', [username]); //check to see if there is a valid user in the database
        
        if (users.length <= 0){
            return res.status(400).json({error: 'Username doesn\'t exist'});
        }

        const currentUser = users[0]; //grab the actual user object from the sql query, as results is an array of users

        const isMatch = await bcrypt.compare(password, currentUser.password);

        if (isMatch){
             const token = jwt.sign(
                {userId: currentUser.id, username: username},
                process.env.JWT_SECRET,
                {expiresIn: '7d'}
            )

            res.cookie('nikke_token', token, { //set-cookie header is populated with encoded token
                httpOnly: true, //prevent javascript from reading the cookie
                secure: false,  //change this to true to use https encrypted tunnels later
                sameSite: 'lax', //protects against xss
                maxAge: 7*24*60*60*1000 
            });

            res.status(200).json({message: 'User logged in successfully'});
        }
        else{
            console.error('Passwords is incorrect for user: ', username);
            res.status(401).json({error: 'Password is incorrect'});
        }
    }
    catch (error){
        console.error('Login error', error);
        res.status(500).json({error: 'Server error during login'});
    }
});

router.get('/me', (req, res) => {
    try{
        const token = req.cookies.nikke_token; // grab token from the cookie jar
        if (!token){
            return res.status(401).json({error: "No token found"});
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET); //decrypt the token and make sure it is valid

        res.status(200).json({ //return the users id and username
            userId: decoded.userId,
            username: decoded.username
        });
    }
    catch (error){
        console.error("Token verification failed", error);
        res.status(401).json({error: "Invalid or expired token"});
    }
});

router.post('/logout', (req, res) => {
    //delete the cookie that the user is holding in the cookiejar to log out
    res.clearCookie('nikke_token', {//You MUST provide the exact same options (except maxAge) that you used when creating the cookie, or the browser might refuse to delete it!
        httpOnly: true, 
        secure: false,
        sameSite: 'lax'
    });

    res.status(200).json({message: "Logged out successfully"});
});

module.exports = router;