// Import the required modules
var express = require("express"); // Express framework for building web applications
var app = express(); // Create an Express application instance
const path = require("path"); // Node.js module to handle file and directory paths
var fs = require("fs"); 

// Middleware to parse JSON data from incoming requests
app.use(express.json());

// Middleware to serve static files
app.use(express.static(path.join(__dirname)));

// Default route to serve the index.html
app.get('/AfterSchoolActivities', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Middleware to serve static files from the "image" directory
    app.use(function(req, res, next) { 
        const filePath = path.join(__dirname, "images", req.url); 
        fs.stat(filePath, function(err, fileInfo) { 
            if (err) { 
                next(); 
                return; 
            } 
            if (fileInfo.isFile()) res.sendFile(filePath); 
            else next(); 
        }); 
    });

    // Handle 404 errors for undefined routes
    app.use(function(req, res) { 
        res.status(404); // Set status to 404
        res.send("File not found!"); 
    });
