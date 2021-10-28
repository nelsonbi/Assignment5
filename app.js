const express = require('express');
const app = express();
app.set('trust proxy', true);
const bodyParser = require("body-parser");

// parse requests of content-type - application/json
app.use(bodyParser.json());
// parse requests of content-type - application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }));

// Import Routes
const boats = require('./routes/boats');

// Import middlewares
app.use('/boats', boats);

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}...`);
});