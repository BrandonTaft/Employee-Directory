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

//Search DB for employee by I.D.
var findById = function(id, callback) {
  Employee.findOne({
    "_id": id
  }, callback);
};

module.exports.findByName = findByName;

module.exports.findById = findById;
