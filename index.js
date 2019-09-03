require("dotenv").load();

// Express
const express = require("express");
const app = express();
const bodyParser = require("body-parser");

// CORS
// const cors = require('cors');
// app.use(cors());

// PORT
const PORT = process.env.PORT || 5000;
app.listen(PORT);

// Body Parser
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// require("./models/Documents");

// Session
const cookieSession = require("cookie-session");
app.use(
  cookieSession({
    maxAge: 30 * 24 * 60 * 60 * 1000,
    keys: [process.env.COOKIE_KEY]
  })
);

// Routes
const uploadRouter = require("./routes/db");
app.use("/api/db/", uploadRouter);

// Prod Client Routes
if (process.env.NODE_ENV === "production") {
  app.use(express.static("client/build"));
  app.use("*", express.static("client/build"));
}
