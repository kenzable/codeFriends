'use strict';

var chalk = require('chalk');
var Promise = require('sequelize').Promise;
var faker = require('./faker');

var db = require('./server/db');
var User = db.model('user');
var Friend = db.model('friend');
var Cart = db.model('cart');
var Order = db.model('order');
var Feedback = db.model('feedback');


var seedUser = function() {
	var createUser = function() {
		var user = {
			email: faker.Internet.email(),
			password: 'thing',
			name: faker.Name.findName(),
			age: faker.random.number(100),
			twitter_id: faker.Name.firstName(),
			facebook_id: faker.Name.firstName(),
			google_id: faker.Name.firstName()
		}
		return user;
	};
	var UserPromises = [];

	for (var i = 0; i < 15; i++) {
		UserPromises.push(User.create(createUser()));
	}

	return UserPromises;
};

var seedFriend = function() {
	var createFriend = function() {
		var friend = {
			name: faker.Name.lastName(),
			description: faker.Lorem.paragraph(),
			numHours: faker.random.number(24),
			price: faker.random.number(1000),
			imageUrl: faker.Image.animals(),
			tags: faker.Lorem.words()
		}
		return friend;
	};
	var FriendPromises = [];

	for (var i = 0; i < 20; i++) {
		FriendPromises.push(Friend.create(createFriend()));
	}

	return FriendPromises;
};

var seedCart = function() {
	var createCart = function() {
		var numItems = faker.random.number(10);
		var cart = { items: [] };

		for (var i = 0; i < numItems; i++) {
			cart.items.push(faker.random.number(100000))
		}

		return cart;
	};
	var CartPromises = [];

	for (var i = 0; i < 20; i++) {
		CartPromises.push(Cart.create(createCart()));
	}

	return CartPromises;
};

var seedOrder = function() {
	var createOrder = function() {
		var numItems = faker.random.number(10) + 1;
		var order = {
			total: faker.random.number(1000000),
			items: []
		};

		for (var i = 0; i < numItems; i++) {
			order.items.push(faker.random.number(10000))
		}

		return order;
	};
	var OrderPromises = [];

	for (var i = 0; i < 20; i++) {
		OrderPromises.push(Order.create(createOrder()));
	}

	return OrderPromises;
};

var seedFeedback = function() {
	var createFeedback = function() {
		var feedback = {
			title: faker.Lorem.sentence(),
			rating: faker.random.number(5),
			review: faker.Lorem.paragraph()
		};
		return feedback;
	};
	var FeedbackPromises = [];

	for (var i = 0; i < 20; i++) {
		FeedbackPromises.push(Feedback.create(createFeedback()));
	}

	return FeedbackPromises;
};


db.sync({ force: true })
.then(function() {
	return Promise.all(seedUser().concat(seedFriend(), seedCart(), seedOrder(), seedFeedback()));
})
.then(function() {
	console.log(chalk.green('seed successful'));
})
.catch(function(err) {
	console.log(chalk.red(err));
});



