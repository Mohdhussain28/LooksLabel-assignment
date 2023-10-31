const functions = require("firebase-functions");
const express = require('express');
const bodyParser = require('body-parser');
const admin = require('firebase-admin');
require('dotenv').config({ path: './config.env' })
var serviceAccount = require("./assignmentnumber-firebase-adminsdk-i2c8o-0f5ceaf56f.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});


const app = express();
app.use(bodyParser.json());
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
});

app.use("/data", require('./routes/controller'));

app.use((err, req, res, next) => {
    res.status(err.statusCode || 500).send(err.message || "Unexpected error!");
});


exports.app = functions.https.onRequest(app);
