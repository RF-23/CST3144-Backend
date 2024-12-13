// Import the required modules
var express = require("express"); // Express framework for building web applications
var app = express(); // Create an Express application instance
const path = require("path"); // Node.js module to handle file and directory paths
var fs = require("fs");

const port = process.env.PORT || 3000
// Middleware to parse JSON data from incoming requests
app.use(express.json());

// Middleware to serve static files
app.use(express.static(path.join(__dirname, '../Frontend')));

app.get('/', (req, res) => {
  res.send("Please access the website at /AfterSchoolActivities");
});

// Default route to serve the index.html
app.get('/AfterSchoolActivities', (req, res) => {
  res.sendFile(path.join(__dirname, '../Frontend', 'index.html'));
});

// Middleware to serve static files from the "image" directory
app.use(function (req, res, next) {
  const filePath = path.join(__dirname, "static", req.url);
  fs.stat(filePath, function (err, fileInfo) {
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
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  // OPTIONS Method: Before sending certain types of requests (like PUT, DELETE, or those with custom headers),
  // Browsers make a preflight OPTIONS request to check if the server allows the actual request
  // HEAD Method: Retrieves the headers for a resource without returning the resource body itself unlike GET Method
  res.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,OPTIONS,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Access-Control-Allow-Headers, Origin,Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers'
  );
  if (req.method === 'OPTIONS') {
    res.sendStatus(200); // Send HTTP 200 status for preflight requests
  } else {
    next(); // Continue to the next middleware
  }
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

// POST endpoint to save order details in the orders collection
app.post("/AfterSchoolActivities/orders", (req, res) => {
  const { fullName, phone, country, city, address, zip, cartItems } = req.body; // Extract these order details from the request body

  // Validate that the cart is not empty
  if (!cartItems || cartItems.length === 0) {
    return res.status(400).json({ error: "Cart is empty." }); // Returns an error if the cart is empty
  }

  // Prepare the order data object
  const orderData = {
    fullName,
    phone,
    country,
    city,
    address,
    zip,
    cartItems,
    orderDate: new Date(), // Adding the current date and time as the order date
  };

  const ordersCollection = db.collection("orders"); // Reference the 'orders' collection

  // Insert the order into the database
  ordersCollection.insertOne(orderData)
    .then((result) => {
      res.status(201).json({ message: "Order placed successfully", orderId: result.insertedId }); // Respond with the unique order _id from the orders collection 
    })
    .catch((error) => {
      console.error("Error inserting order into MongoDB:", error); // Log the error
      res.status(500).json({ error: "Failed to place order." }); // Respond with an error message
    });
});

// GET endpoint to retrieve the current inventory of a specific lesson by ID
app.get("/AfterSchoolActivities/lessons/:lessonId", (req, res) => {
  const lessonId = Number(req.params.lessonId); // Convert the lesson ID to a number since it's numeric

  const lessonsCollection = db.collection("lessons"); // Reference the 'lessons' collection

  // Find the lesson by its 'id' field
  lessonsCollection.findOne({ id: lessonId })
    .then((lesson) => {
      if (!lesson) {
        return res.status(404).json({ error: "Lesson not found" }); // Respond with an error if the lesson is not found
      }
      res.status(200).json({
        id: lesson.id, // Include the lesson's ID in the response
        title: lesson.title, // Include the lesson's title
        availableInventory: lesson.availableInventory // Include the available inventory
      });
    })
    .catch((error) => {
      console.error("Error fetching lesson inventory:", error); // Log the error
      res.status(500).json({ error: "Failed to fetch lesson inventory" }); // Respond with an error message
    });
});

// PUT endpoint to update the inventory for a specific lesson
app.put("/AfterSchoolActivities/lessons/:lessonId", (req, res) => {
  const lessonId = Number(req.params.lessonId); // Convert the lesson ID to a number
  const { quantity } = req.body; // Extract the quantity to decrement from the request body based on the users choice

  const lessonsCollection = db.collection("lessons"); // Reference the 'lessons' collection

  // Update the lesson's inventory by decrementing it with the specified quantity
  lessonsCollection.findOneAndUpdate(
    { id: lessonId }, // Query by the lesson's numeric ID
    {
      $inc: { availableInventory: -quantity } // Decrement the inventory
    },
    { returnDocument: "after" } // Return the updated document
  )
    .then((result) => {
      if (!result.value) {
        // Respond with an error if the lesson is not found
        return res.status(404).json({ error: "Lesson not found" });
      }
      // Respond with the updated inventory details
      res.status(200).json({
        message: "Inventory updated successfully",
        // Previous inventory value
        PreviousInventory: result.value.availableInventory,
        // Quantity deducted
        Quantity: quantity,
        // Updated inventory value
        UpdatedInventory: result.lastErrorObject.updatedExisting ? result.value.availableInventory - quantity : null,
      });
    })
    .catch((error) => {
      console.error("Error updating lesson inventory:", error); // Log the error
      res.status(500).json({ error: "Failed to update inventory" }); // Respond with an error message
    });
});

// GET endpoint to search lessons by various fields (inventory, price, title and location)
app.get("/AfterSchoolActivities/search/:query", (req, res) => {
  const query = req.params.query; // Extract the search query from the URL

  const lessonsCollection = db.collection("lessons"); // Reference the 'lessons' collection

  // Dynamic filter to search by numeric fields and text fields
  const filter = {
    // Performs a logical OR operation on multiple conditions
    $or: [
      { availableInventory: Number(query) }, // Search by inventory for numeric query
      { price: Number(query) },              // Search by price for numeric query
      // $regex: Searches for the query as a substring within the
      // $options: Ensures the search is case-insensitive
      { title: { $regex: query, $options: "i" } }, // Search by title 
      { location: { $regex: query, $options: "i" } } // Search by location 
    ]
  };

  // Find lessons matching the filter
  lessonsCollection.find(filter).toArray()
    .then((lessons) => {
      if (lessons.length === 0) {
        return res.status(404).json({ error: "No lessons found matching the query" }); // Respond with an error if no matches are found
      }
      res.status(200).json(lessons); // Respond with the matching lessons
    })
    .catch((error) => {
      console.error("Error fetching lessons:", error); // Log the error
      res.status(500).json({ error: "Failed to fetch lessons" }); // Respond with an error message
    });
});

// Error-handling middleware to handle unexpected errors
app.use((err, req, res, next) => {
  console.error("Error:", err); // Log the error
  res.status(500).send({ error: "Internal Server Error" }); // Respond with a generic error message
});

// Handle 404 errors for undefined routes
app.use(function (req, res) {
  res.status(404); // Set status to 404
  res.send("File not found!");
});

app.listen(port, () => {
  console.log('Express.js server running')
})