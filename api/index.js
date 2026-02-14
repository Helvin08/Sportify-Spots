const express = require("express");
const serverless = require("serverless-http");

const app = express();

app.get("/", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "Sportify Spots API is running 🚀"
  });
});

module.exports = serverless(app);
