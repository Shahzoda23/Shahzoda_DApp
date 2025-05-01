const express = require("express");
const path = require('path');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.static(path.join(__dirname, '..', 'public')));

const PORT = 4002;

app.get("/", (req, res) => {
  res.send("Dog Adoption API is running...");
});

// Optional: serve pets.json directly if needed
app.get("/pets", (req, res) => {
  res.sendFile(path.join(__dirname, 'pets.json'));
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
