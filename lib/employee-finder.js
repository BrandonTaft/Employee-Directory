'use strict';

var Employee = require('../models/employee');
//Search DB for employee by name
//This can return multiples 
var findByName = function(name, callback) {
  Employee.find({
    "fullName": {
      "$regex": name, "$options": "i"
    }
  }, callback).sort("fullName");
};
// If multiples are returned a message with the options will be sent
// Once the user selects and sends back the number corresponding with the specific employee id
// Will Search DB for employee by I.D., then send the employee info
var findById = function(id, callback) {
  Employee.findOne({
    "_id": id
  }, callback);
};

module.exports.findByName = findByName;

module.exports.findById = findById;
