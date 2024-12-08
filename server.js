// Import the required modules
var express = require("express"); // Express framework for building web applications
var app = express(); // Create an Express application instance
const path = require("path"); // Node.js module to handle file and directory paths

// Middleware to parse JSON data from incoming requests
app.use(express.json());


