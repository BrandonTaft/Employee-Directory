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
const finder = require('../lib/finder')
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
//   //Creates a session to track number of texts from user
//   const smsCount = req.session.counter || 0;
//   //Sets the reply message on the first text from the user
//   let message = 'Whatever Bro';
//   //Sets the reply for each subsequent text
//   if(smsCount > 0) {
//     message = `OK, this is Reminder #${smsCount + 1}`;
//   }
//   //Updates  the session
//   req.session.counter = smsCount + 1;
  
//   //Creates and sends the Auto Response with the reply message
//   const twiml = new MessagingResponse();
//   twiml.message(message);

  const body = req.body.Body;
  res.type('text/xml');
  //Check for the cookie and which numeric input was sent back by user
  if (req.cookies.cachedReminders !== undefined && !isNaN(body)) {
    var cachedReminders = req.cookies.cachedReminders;
    var reminderId = cachedReminders[body];
    if (reminderId === undefined) {
        const name = req.body.Body;
        repository.create(name).then(() => {
          res.writeHead(200, { 'Content-Type': 'text/xml' });
          res.end(twiml.toString());
        }).catch((error) => console.log(error));
      
    } else {
      // If an ID is found will then search for that particular reminder
      //Use twiml-generator to create TwiML response with the results
      //Then send appropriate response to Twilio and in turn to the original sender
      finder.findById(vId, function(err, reminder) {
        res.clearCookie('cachedReminders');
        res.send(twimlGenerator.singleReminder(reminder).toString());
      })
    }
  } else {
    // If a cookie is not found will proceed with name lookup 
    // Use twiml-generator to create TwiML response with the results
    // Then send appropriate response to Twilio and in turn to the original sender
    finder.findByName(body, function(err, reminders) {
      if (reminders.length === 0) {
        res.send(twimlGenerator.notFound().toString());
      } else if (reminders.length === 1) {
        res.send(twimlGenerator.singleReminder(reminders[0]).toString());
      } else {
        // To cache the list of possible matches
        // For the return message this builds a numbered menu of possible matches to choose from
        var options = _.map(reminders, function(it, index) {
          return { option: index + 1, name: it.name, id: it.id };
        });
        // Create cookie to store the selection options in so the app can remember
        // Which selection goes with which id #
        // Twilio sends cookie back with every HTTP request to our app
        // User will text back the number that corresponds with a particular reminder
        // Twilio will then send it back formus to parse and determine what to do next

        var cachedReminders = _.object(_.map(options, function(it) { return [it.option, it.id]; }));
        res.cookie('cachedReminders', cachedReminders, { maxAge: 1000 * 60 * 60 });

        res.send(twimlGenerator.multipleReminders(options).toString());
      }
    });
  }
  
});


module.exports = router;