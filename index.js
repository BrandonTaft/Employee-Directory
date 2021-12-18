const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();


require('dotenv').config();



app.listen( process.env.PORT,() => {
    console.log("Server Is Running...")
})