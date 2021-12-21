use strict';

//***********USE TWILIO NODE HELPER LIBRARY TO EASILY CREATE RESPONSES********* */


var MessagingResponse = require('twilio').twiml.MessagingResponse,
  _ = require('underscore');

// Create response for when no results are found
var notFound = function(req,res) {
  // var resp = new MessagingResponse();
  // resp.message('We did not find the Reminder you\'re looking for');
  // return resp;
  //Extracts the data from the incoming text
  //Then Creates MongoDB Document
  const name = req.body.Body;
  repository.create(name).then(() => {
    res.writeHead(200, { 'Content-Type': 'text/xml' });
    res.end(twiml.toString());
  }).catch((error) => console.log(error));
};

// Sets Response for when we find a single match for the query
// Response includes list of the matching reminder's names
// Along with incrementing number the user uses to make their selection 

var singleReminder = function(reminder) {
  var resp = new MessagingResponse();
  var message = resp.message();
  message.body(`${reminder.name}\n${reminder.notification}\n${reminder.done}`);
  //message.media(reminder.imageUrl);
  return resp;
};

// Sets Response for when we find a multiple matches
// Response includes the contact info including a photo, 
// Which makes the response an MMS

var multipleReminders = function(reminders) {
  var resp = new MessagingResponse();
  var optionsMessage = _.reduce(reminders, function(memo, it) {
    return memo += `\n${it.option} for ${it.name}`;
  }, '');

  resp.message(`We found reminders, reply with:${optionsMessage}\nOr start over`);
  return resp;
};

module.exports.notFound = notFound;

module.exports.singleReminder = singleReminder;

module.exports.multipleReminders = multipleReminders;