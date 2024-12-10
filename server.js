// Import the required modules
var express = require("express"); // Express framework for building web applications
var app = express(); // Create an Express application instance
const path = require("path"); // Node.js module to handle file and directory paths
var fs = require("fs"); 

// const port = process.env.PORT || 3000
const port = 3000

// Middleware to parse JSON data from incoming requests
app.use(express.json());

// Middleware to serve static files
app.use(express.static(path.join(__dirname, '../Frontend')));

// Default route to serve the index.html
app.get('/AfterSchoolActivities', (req, res) => {
    res.sendFile(path.join(__dirname, '../Frontend', 'index.html'));
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

// Connecting to the Mongodb
const MongoClient = require('mongodb').MongoClient;
let db;
MongoClient.connect('mongodb+srv://ridafarheen321:Iminfogirl123@cluster0.fgisn9c.mongodb.net', (err, client) => {
db = client.db('Webstore');
console.log('Connected to MongoDB');
})
    
// Logger Middleware: Logs each HTTP request with the method, URL, and timestamp
app.use((req, res, next) => {
    const method = req.method; // HTTP method (GET, POST and PUT)
    const url = req.url;       // Accessing URL 
    const timestamp = new Date().toISOString(); // Current timestamp
    console.log(`[${timestamp}] ${method} request to ${url}`);
    next(); // Passing control to the next middleware 
});  
  
// Middleware to handle CORS (Cross-Origin Resource Sharing)
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*'); // Allow all origins
    res.setHeader("Access-Control-Allow-Credentials", "true");
    // OPTIONS Method: Before sending certain types of requests (like PUT, DELETE, or those with custom headers), 
    // Browsers make a preflight OPTIONS request to check if the server allows the actual request
    // HEAD Method: Retrieves the headers for a resource without returning the resource body itself unlike GET Method
    res.setHeader("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT"); // OPTIONS
    res.setHeader("Access-Control-Allow-Headers", "Access-Control-Allow-Headers, Origin,Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers");
    next(); // Continue to the next middleware  
});

// Middleware to handle requests for specific collections dynamically
// The collection name will be extracted from the route parameter
app.param('collectionName', (req, res, next, collectionName) => { 
    req.collection = db.collection(collectionName); // Set the collection reference in the request object
    return next(); // Pass control to the next middleware  
});

// GET endpoint to fetch all documents from a specified collection
app.get('/AfterSchoolActivities/:collectionName', (req, res, next) => {
    req.collection.find({}).toArray((e, results) => { // Retrieve all documents from the collection
    if (e) return next(e); // Pass any errors to the error handler
        res.send(results); // Send the results as the response
    });
});
  
// Handle 404 errors for undefined routes
app.use(function(req, res) {         
res.status(404); // Set status to 404
res.send("File not found!"); 
});

app.listen(port, () => {
console.log('Express.js server running')
})