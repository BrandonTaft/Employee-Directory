'use strict';

const express = require('express')
const router = express.Router()
const twilio = require('twilio')
const employeeFinder = require('../lib/employee-finder')
const _ =  require('underscore')
const twimlGenerator = require('../lib/twiml-generator');


// When an SMS is recieved Twilio sends me an HTTP request 
// POST /directory/search/ will handle the HTTP request

router.post('/search/', function(req, res, next) {
  var body = req.body.Body;
  res.type('text/xml');

  //Check for the cookie and which numeric input was sent back by user
  if (req.cookies.cachedEmployees !== undefined && !isNaN(body)) {
    var cachedEmployees = req.cookies.cachedEmployees;
    var employeeId = cachedEmployees[body];
    if (employeeId === undefined) {
      res.send(twimlGenerator.notFound().toString());
    } else {
      // If an ID is found will then search for that particular employee
      //Use twiml-generator to create TwiML response with the results
      //Then send appropriate response to Twilio and in turn to the original sender
      employeeFinder.findById(employeeId, function(err, employee) {
        res.clearCookie('cachedEmployees');
        res.send(twimlGenerator.singleEmployee(employee).toString());
      });
    }
  } else {
    // If a cookie is not found will proceed with name lookup 
    // Use twiml-generator to create TwiML response with the results
    // Then send appropriate response to Twilio and in turn to the original sender
    employeeFinder.findByName(body, function(err, employees) {
      if (employees.length === 0) {
        res.send(twimlGenerator.notFound().toString());
      } else if (employees.length === 1) {
        res.send(twimlGenerator.singleEmployee(employees[0]).toString());
      } else {
        // To cache the list of possible matches
        // For the return message this builds a numbered menu of possible matches to choose from
        var options = _.map(employees, function(it, index) {
          return { option: index + 1, fullName: it.fullName, id: it.id };
        });
        // Create cookie to store the selection options in so the app can remember
        // Which selection goes with which id #
        // Twilio sends cookie back with every HTTP request to our app
        // User will text back the number that corresponds with a particular employee
        // Twilio will then send it back formus to parse and determine what to do next

        var cachedEmployees = _.object(_.map(options, function(it) { return [it.option, it.id]; }));
        res.cookie('cachedEmployees', cachedEmployees, { maxAge: 1000 * 60 * 60 });

        res.send(twimlGenerator.multipleEmployees(options).toString());
      }
    });
  }
});

module.exports = router;
