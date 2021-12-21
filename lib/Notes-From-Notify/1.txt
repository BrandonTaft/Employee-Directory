'use strict';
const express = require('express');
const session = require('express-session');
const moment = require('moment');
const Appointment = require('../models/Appointment');
const repository = require('../repositories/AppointmentRepository');
const MessagingResponse = require('twilio').twiml.MessagingResponse;
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const phoneNumber = process.env.TWILIO_PHONE_NUMBER;
const bodyParser = require("body-parser");
const twilio = require('twilio');
const client = require("twilio")(accountSid, authToken);
const _ =  require('underscore');
const twimlGenerator = require('../lib/twiml-generator');

require('dotenv').config()
/* eslint-disable new-cap */


//********************* Middleware *********************//
const router = express.Router();
router.use(bodyParser.urlencoded({
  extended: false
}));

router.use(bodyParser.json());
router.use(session({ secret: 'SECRETKEY' }));

//*********** Get All Items From The Database ***********//

router.get('/', function (req, res, next) {
  repository.findAll().then(function (appointments) {
    res.json(appointments);
  }).catch((error) => console.log(error));
});


//************* Add Items To The Database **************//

router.post('/', function (req, res, next) {
  const name = req.body.name;
  const notification = req.body.notification;
  const time = moment(req.body.time, 'YYYY-MM-DD hh:mma');
  const appointment = new Appointment({
    name: name,
    notification: parseInt(notification)
  })

  appointment.save().then(function () {
    res.redirect('/');
    console.log(appointment);
  }).catch((error) => console.log(error));
});


//*********** Update Items In The Database *************//

router.put('/:id', (req, res) => {
  const { id } = req.params;
  const reminder = { name: req.body.name, done: req.body.done };
  repository.updateById(id, reminder)
    .then(res.status(200).json([]))
    .catch((error) => console.log(error));
});


//*********** Delete Item From The Database *************//

router.delete('/:id', (req, res) => {
  const { id } = req.params;
  repository.deleteById(id).then((ok) => {
    console.log(ok);
    console.log(`Deleted record with id: ${id}`);
    res.status(200).json([]);
  }).catch((error) => console.log(error));
});


//****************** Deliver Message *******************//

router.post("/send-message", async (req, res) => {
  try {
    let response = await client.messages.create({
      body: req.body.message,
      from: phoneNumber,
      to: req.body.to
    })

    res.status(200).json({
      response: response,
      message: `Message Sent To ${req.body.to}`
    })
  } catch (err) {
    console.log(err);
    res.status(500).json({
      Error: err
    })
  }
})


//******* Recieve Message And Send Auto Response ********//

router.post('/sms', (req, res) => {
  //Creates a session to track number of texts from user
  const smsCount = req.session.counter || 0;
  //Sets the reply message on the first text from the user
  let message = 'OK, Got It';
  //Sets the reply for each subsequent text
  if(smsCount > 0) {
    message = `OK, this is Reminder #${smsCount + 1}`;
  }
  //Updates  the session
  req.session.counter = smsCount + 1;
  
  //Creates and sends the Auto Response with the reply message
  const twiml = new MessagingResponse();
  twiml.message(message);

  //Extracts the data from the incoming text
  //Then Creates MongoDB Document
  const name = req.body.Body;
  repository.create(name).then(() => {
    res.writeHead(200, { 'Content-Type': 'text/xml' });
    res.end(twiml.toString());
  }).catch((error) => console.log(error));
});


module.exports = router;
