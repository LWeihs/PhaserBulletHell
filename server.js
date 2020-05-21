// Parameters
const port = 8080;
const express = require('express');
const path = require('path');

const app = express();

app.use(express.static(path.join(__dirname, 'src')));
app.use(express.static(path.join(__dirname, 'dist')));
app.use(express.static(path.join(__dirname, 'data')));
app.listen(port, function() {
    console.log("Server running at: http://localhost:" + port)
});