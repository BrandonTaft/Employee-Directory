'use strict';

//***********USE TWILIO NODE HELPER LIBRARY TO EASILY CREATE RESPONSES********* */


var MessagingResponse = require('twilio').twiml.MessagingResponse,
  _ = require('underscore');

// Create response for when no results are found
var notFound = function() {
  var resp = new MessagingResponse();
  resp.message('We did not find the employee you\'re looking for');
  return resp;
};

// Sets Response for when we find a single match for the query
// Response includes list of the matching employees' names
// Along with incrementing number the user uses to make their selection 

var singleEmployee = function(employee) {
  var resp = new MessagingResponse();
  var message = resp.message();
  message.body(`${employee.fullName}\n${employee.phoneNumber}\n${employee.email}`);
  message.media(employee.imageUrl);
  return resp;
};

// Sets Response for when we find a multiple matches
// Response includes the contact info including a photo, 
// Which makes the response an MMS

var multipleEmployees = function(employees) {
  var resp = new MessagingResponse();
  var optionsMessage = _.reduce(employees, function(memo, it) {
    return memo += `\n${it.option} for ${it.fullName}`;
  }, '');

  resp.message(`We found multiple people, reply with:${optionsMessage}\nOr start over`);
  return resp;
};

module.exports.notFound = notFound;

module.exports.singleEmployee = singleEmployee;

module.exports.multipleEmployees = multipleEmployees;