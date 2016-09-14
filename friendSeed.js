'use strict';

var chalk = require('chalk');
var Promise = require('sequelize').Promise;

var db = require('./server/db');
var User = db.model('user');
var Friend = db.model('friend');
var Cart = db.model('cart');
var Order = db.model('order');
var Feedback = db.model('feedback');


var seedUser = function() {

};

var seedFriend = function() {

};
var seedCart = function() {

};

var seedOrder = function() {

};

var seedFeedback = function() {

};


// var seedPromises = 

db.sync({ force: true })
// .then(function() {
// 	Promise.All()
// })
.then(function() {
	console.log(chalk.green('seed successful'));
})
.catch(function(err) {
	console.error(chalk.red(err));
});