const mongoose = require('mongoose');

mongoose.connect("mongodb://localhost:27017/LoginSignup", { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log("MongoDB Connected Successfully!");
  })
  .catch((error) => {
    console.error("Failed to Connect to MongoDB:", error);
  });

const logInSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Name is required"]
  },
  password: {
    type: String,
    required: [true, "Password is required"]
  },
  age: {
    type: Number,
    required: [true, "Age is required"]
  },
  gender: {
    type: String,
    enum: ["male", "female", "other"],
    required: [true, "Gender is required"]
  }
});

const LogIn = mongoose.model("LogIn", logInSchema);

module.exports = LogIn;
