const express = require('express');
const admin = require('firebase-admin');
const router = express.Router();
const twilio = require('twilio');
require('dotenv').config({ path: './config.env' })

const client = new twilio(process.env.accountSid, process.env.authToken);
const firestore = admin.firestore();

router.post('/whatsapp', async (req, res) => {
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

router.post('/data-entry', async (req, res) => {
    const setNumber = req?.query.setNumber;
    if (!setNumber || setNumber == 0) {
        res.status(400).json({ message: "please enter valid number" })
    }
    try {
        for (let i = 1; i <= setNumber; i++) {
            const setDocRef = firestore.collection('DummyData').doc(`Set${i}`);

            await setDocRef.set({
                name: `Set${i}`,
            });

            await setDocRef.collection('subSets').doc(`Set${i}A`).set({
                subSet1: `Data for Set${i}A subSet1`,
            });

            await setDocRef.collection('subSets').doc(`Set${i}B`).set({
                subSet2: `Data for Set${i}B subSet2`,
            });
        }

        res.status(201).json({ message: 'Data added successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to add data' });
    }
});

router.get('/query', async (req, res) => {
    const setNumber = req.query.setNumber;

    if (!setNumber) {
        return res.status(400).json({ message: 'Please provide a valid setNumber' });
    }

    try {
        const setDocRef = firestore.collection('DummyData').doc(`Set${setNumber}`);
        const subSetsQuery = await setDocRef.collection('subSets').get();

        const results = [];

        subSetsQuery.forEach((doc) => {
            const data = doc.data();
            results.push(data);
        });
        if (results.length == 0) {
            res.status(404).json({ message: "not available" })
        }

        res.status(200).json({ message: 'Success', data: results });
    } catch (error) {
        console.error('Error getting documents: ', error);
        res.status(500).json({ message: 'An error occurred', error: error });
    }
});


module.exports = router;