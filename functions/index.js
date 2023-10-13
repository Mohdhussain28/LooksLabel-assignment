const functions = require("firebase-functions");
const express = require('express');
const bodyParser = require('body-parser');
const admin = require('firebase-admin');
const twilio = require('twilio');
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

const client = new twilio(process.env.accountSid, process.env.authToken);
const firestore = admin.firestore();

app.post('/whatsapp', (req, res) => {
    const message = req.body.Body;
    const from = req.body.From;

    const usersCollection = firestore.collection('users');

    usersCollection.where('mobile', '==', from).get()
        .then((querySnapshot) => {
            if (querySnapshot.empty) {
                client.messages.create({
                    body: 'Welcome! Please register first by sending your mobile number.',
                    from: '+12295454651',
                    to: from,
                })
                    .then(() => {
                        res.status(200).json({ success: true, message: "successfully1" }).end();
                    })
                    .catch((error) => {
                        console.error('Error sending WhatsApp message:', error);
                        res.status(500).end();
                    });
            } else {
                const userData = querySnapshot.docs[0].data();

                if (!userData.city) {
                    usersCollection.doc(querySnapshot.docs[0].id).update({ city: message });

                    client.messages.create({
                        body: 'Thanks! Now, please reply with your age (numeric value).',
                        from: '+12295454651',
                        to: from,
                    })
                        .then(() => {
                            res.status(200).json({ success: true, message: "successfully7" }).end();
                        })
                        .catch((error) => {
                            console.error('Error sending WhatsApp message:', error);
                            res.status(500).json({ success: true, message: "successfully2" });
                        });
                } else if (!userData.age) {
                    const age = parseInt(message);
                    if (isNaN(age) || age < 18) {
                        client.messages.create({
                            body: 'Invalid age. Please reply with a valid age (numeric value above 18).',
                            from: '+12295454651',
                            to: from,
                        })
                            .then(() => {
                                res.status(200).json({ success: true, message: "successfully3" }).end();
                            })
                            .catch((error) => {
                                console.error('Error sending WhatsApp message:', error);
                                res.status(500).end();
                            });
                    } else {
                        usersCollection.doc(querySnapshot.docs[0].id).update({ age });
                        client.messages.create({
                            body: `Thank you for registering. Your city is ${userData.city} and age is ${age}.`,
                            from: '+12295454651',
                            to: from,
                        })
                            .then(() => {
                                res.status(200).json({ success: true, message: "successfully4" }).end();
                            })
                            .catch((error) => {
                                console.error('Error sending WhatsApp message:', error);
                                res.status(500).end();
                            });
                    }
                }
            }
        })
        .catch((error) => {
            console.error('Error querying Firestore:', error);
            res.status(500).end();
        });
});

exports.app = functions.https.onRequest(app);
