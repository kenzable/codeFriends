'use strict';

var chalk = require('chalk');
var Promise = require('sequelize').Promise;
var faker = require('./Faker/faker');

var db = require('./server/db');
var User = db.model('user');
var Friend = db.model('friend');
var Cart = db.model('cart');
var Order = db.model('order');
var Feedback = db.model('feedback');

var randomEmail = faker.Internet.email();
var randomWord = faker.Lorem.words();
var randomName = faker.Name.findName();
var randomNum = faker.random.number(100);
var randomHandles = faker.Name.firstName();

// var randomDescription = faker.Lorem.paragraph();
// var randomImg = faker.Image.animals();


var seedUser = function() {
	var user = {
		email: randomEmail,
		password: 'randomWord',
		name: randomName,
		age: randomNum,
		twitter_id: randomHandles,
		facebook_id: randomHandles,
		google_id: randomHandles
	}

	var UserPromises = [];
	for (var i = 0; i < 15; i++) {
		UserPromises.push(User.create(user))
	}

	return UserPromises;
};

// var seedFriend = function() {
// 	var friend = {
// 		name: randomName,
// 		description: randomDescription,
// 		numHours: randomNum,
// 		price: randomNum,
// 		imageUrl: randomImg,
// 		tags: randomWord
// 	}
// };

// var seedCart = function() {

// };

// var seedOrder = function() {

// };

// var seedFeedback = function() {

// };

// WILL HAVE TO CONCAT RETURNED PROMISE ARRAYS TO SEED ALL MODELS
var seedPromises = seedUser();

db.sync({ force: true })
.then(function() {
	Promise.all(seedPromises);
})
.then(function() {
	console.log(chalk.green('seed successful'));
})
.catch(function(err) {
	console.error(chalk.red(err));
});



