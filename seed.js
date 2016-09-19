'use strict';

var chalk = require('chalk');
var Promise = require('bluebird');
var Faker = require('faker');

var db = require('./server/db');
var User = db.model('user');
var Friend = db.model('friend');
var Cart = db.model('cart');
var Order = db.model('order');
var Feedback = db.model('feedback');


var seedUser = function() {
  var createUser = function() {
    var user = {
      email: Faker.internet.email(),
      password: 'thing',
      name: Faker.name.findName(),
      age: Faker.random.number(100),
      twitter_id: Faker.name.firstName(),
      facebook_id: Faker.name.firstName(),
      google_id: Faker.name.firstName()
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
      name: Faker.name.lastName(),
      description: Faker.lorem.paragraph(),
      numHours: Faker.random.number(24),
      price: Faker.random.number(1000),
      imageUrl: Faker.image.animals(),
      tags: Faker.lorem.words().split(" ")
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
    var numItems = Faker.random.number(10);
    var cart = { items: [] };

    for (var i = 0; i < numItems; i++) {
      cart.items.push(Faker.random.number(100000))
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
    var numItems = Faker.random.number(10) + 1;
    var order = {
      total: Faker.random.number(1000000),
      items: []
    };

    for (var i = 0; i < numItems; i++) {
      order.items.push(Faker.random.number(10000))
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
      title: Faker.lorem.sentence(),
      rating: Faker.random.number(5),
      review: Faker.lorem.paragraph()
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
})
.finally(function() {
  db.close();
  return null;
});



