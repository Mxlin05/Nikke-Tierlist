const express = require('express');
const cors = require('cors');
const { spawn } = require('child_process');
const path = require('path');
const pool = require('./db');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000; 

app.use(cors({
    origin: 'http://localhost:5173', //react app URL
    credentials: true //tells browsers they are allowed to save cookies from this server
})); //Cross origin resource sharing middleware
app.use(express.json());
app.use(cookieParser()); //read incoming cookies into res.cookies

function executeStartupScrape() { 
    //creates a separate python process to run scrape.py in ./setup directory to scrape prydwen once on server startup
    if (process.env.NODEMON_APP_CHILD_LOOP){ //this element seems to track if the server has been restarted, and it isn't a new startup
        console.log("Skipping scraper run, cause it isn't startup");
        return;
    }

    console.log("Server just started, run the prydwen scraper once");

    const scriptPath = path.join(__dirname, 'setup', 'scrape.py'); //store the path to scrape.py
    const pythonProcess = spawn('python3', ['-u', scriptPath]); //spawn a python process to run the script as a user
    
    console.log("python process spawned");
    
    pythonProcess.stdout.on('data', (data) => { //reads the printouts 
        console.log(`Scrape.py printout: ${data.toString().trim()}`);
    });
    pythonProcess.stderr.on('data', (data) => { //reads errors
        console.error(`Scrape.py Error : ${data.toString().trim()}`);
    })
    pythonProcess.on('close', (code) => { //reads exit code
        console.log(`Scrape.py finished with exit code ${code}`)
    });
}

const nikkeRoutes = require("./routes/nikke_routes.js");
const authRoutes = require("./routes/auth_routes.js");

app.use('/api/nikkes', nikkeRoutes);
app.use('/api/auth', authRoutes);

//npm run dev

app.listen(PORT, () => { //start the server up by listening at the PORT for connections
    console.log(`Express server listening on http://localhost:${PORT}`);
    executeStartupScrape()
});