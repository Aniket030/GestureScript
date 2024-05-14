const express = require("express");
const session = require("express-session");
const MongoDBStore = require("connect-mongodb-session")(session);
const app = express();
const path = require("path");
const LogIn = require("./mongodb");
const uuid = require("uuid");
const bodyParser = require("body-parser");
const cron = require("node-cron");

// Include jQuery (assuming it's installed in your project)
app.use(express.static(path.join(__dirname, "node_modules/jquery/dist")));

app.use(bodyParser.urlencoded({ extended: false }));

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, '../public')));

// Session middleware configuration
const store = new MongoDBStore({
  uri: "mongodb://localhost:27017/yourdb", // MongoDB connection URI
  collection: "sessions",
});

app.use(
  session({
    genid: (_req) => {
      return uuid.v4(); // Generate unique session IDs using UUID
    },
    secret: 'your_secret_key_here', // Secret key for signing the session ID cookie
    resave: false,
    saveUninitialized: true,
    store: store,
    cookie: {
      maxAge: 24 * 60 * 60 * 1000, // 1 hour (in milliseconds)
    },
  })
);

// Route to check if the user is logged in
app.get("/check-login", (req, res) => {
  if (req.session.user) {
      // User is logged in
      res.json({ loggedIn: true });
  } else {
      // User is not logged in
      res.json({ loggedIn: false });
  }
});

// Middleware to check if user is authenticated
const isAuthenticated = (req, res, next) => {
  if (req.session.user) {
    return next(); // User is authenticated, proceed to next middleware
  } else {
    res.redirect("/login"); // User is not authenticated, redirect to login page
  }
};

// Route to check if user is authenticated
app.get("/check-authentication", (req, res) => {
  if (req.session.user) {
    res.status(200).send({ authenticated: true }); // User is authenticated
  } else {
    res.status(401).send({ authenticated: false }); // User is not authenticated
  }
});

// Route to serve login page
app.get("/login", (_req, res) => {
  res.sendFile(path.join(__dirname, "../public/login.html"));
});

// Route to serve signup page
app.get("/signup", (_req, res) => {
  res.sendFile(path.join(__dirname, "../public/signup.html"));
});

app.post("/login", async (req, res) => {
  const { name, password } = req.body;

  try {
    // Find a user with the provided name and password using the LogIn model
    const user = await LogIn.findOne({ name, password });

    if (user) {
      req.session.user = user; // Store user data in session

      // Send a response with a script to show the pop-up message and redirect to homepage
      res.send(`
        <script>
          alert('User logged in successfully.');
          window.location.href = "/";
        </script>
      `);
    } else {
      // Send a response with a script to show the pop-up message for invalid credentials
      res.send(`
        <script>
          alert('Invalid username or password');
          window.location.href = "/login"; // Redirect to login page after showing the message
        </script>
      `);
    }
  } catch (error) {
    console.error("Error occurred during login:", error);
    res.status(500).send("Error occurred during login. Please try again.");
  }
});


// Route to handle signup form submission
app.post("/signup", async (req, res) => {
  const { name, password, age, gender } = req.body;

  if (password.length < 7) {
    return res.send("Password must be at least 7 characters long.");
  }

  const data = {
    name,
    password,
    age,
    gender
  };

  try {
    await LogIn.create(data); // Create a new user including age and gender
    res.redirect("/login"); // Redirect to login page after signup
  } catch (error) {
    console.error("Error occurred during signup:", error);
    res.status(500).send("Error occurred during signup. Please try again.");
  }
});

// Route to handle logout
app.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Error occurred during logout:", err);
      res.status(500).send("Error occurred during logout. Please try again.");
    } else {
      res.redirect("/login"); // Redirect to login page after logout
    }
  });
});

// Protected routes - Only accessible to authenticated users
app.get("/", isAuthenticated, (_req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html")); // Render index page
});

app.get("/Training", isAuthenticated, (_req, res) => {
  res.sendFile(path.join(__dirname, "../public/templates/Training.html")); // Render about page
});

app.get("/Model", isAuthenticated, (_req, res) => {
  res.sendFile(path.join(__dirname, "../public/templates/Model.html")); // Render about page
});

app.get("/About", isAuthenticated, (_req, res) => {
  res.sendFile(path.join(__dirname, "../public/templates/About.html")); // Render contact page
});

// Add more protected routes as needed

// Schedule a cron job to clean up old sessions every day at midnight
cron.schedule("0 0 * * *", async () => {
  try {
    await store.clearExpiredSessions();
    console.log("Old sessions cleared successfully.");
  } catch (error) {
    console.error("Error clearing old sessions:", error);
  }
});

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});

