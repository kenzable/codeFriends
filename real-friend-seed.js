'use strict';

var chalk = require('chalk');
var Promise = require('bluebird');

var db = require('./server/db');
var Friend = db.model('friend');
var User = db.model('user');


var seedFriend = function() {
  var friends = [
    {
      name: 'Hamill the pizzaFriend',
      description: 'Need we say more? Hamill is here for all of your cheesy, gooey, pepperoni-laden binges.',
      numHours: 3,
      price: 2,
      imageUrl: 'https://s-media-cache-ak0.pinimg.com/564x/63/9d/e1/639de1a0c27d39a9a99b8b682d334540.jpg',
      tags: ['pizza', 'indulge']
    },

    {
      name: 'Gutt the Night Owl',
      description: 'If 3 am is your time to shine, then let Guttormson keep you company until the Sun takes over!',
      numHours: 12,
      price: 35,
      imageUrl: 'http://www.myfreephotoshop.com/wp-content/uploads/2014/01/544.jpg',
      tags: ['late-night', 'all-nighter']
    },

    {
      name: 'Axel the Hacker',
      description: 'If hacking is your game, then Axel is your next best codeFriend!',
      numHours: 12,
      price: 30,
      imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/a/af/Villainc.svg',
      tags: ['hack', 'hacker', 'secrecy', 'fun']
    },

    {
      name: 'Health Bjerk',
      description: 'Bjerk loves long walks across your screen, Tuesday yoga, and Green Machine Naked Juices.',
      numHours: 3,
      price: 15,
      imageUrl: 'http://www.relaxandrelease.co.uk/wp-content/uploads/2015/06/Yoga-Cartoon-Character-Animation-Drawing-8-1000x562.jpg',
      tags: ['stress', 'indulge', 'fun']
    },

    {
      name: 'Krog the Encourager',
      description: 'We all know that coding grind when you just can\'t quite get your program to work. Well, Krog is here to help you through those frustrating times!',
      numHours: 6,
      price: 1,
      imageUrl: 'http://4.bp.blogspot.com/-9UeYPMn2zQY/TyWi954XnwI/AAAAAAAABUw/MKHdB_rksjo/s1600/encouragement002.gif',
      tags: ['happy', 'encouragement']
    },

    {
      name: 'Lief the Debugger',
      description: 'Better than the Chrome version.',
      numHours: 21,
      price: 85,
      imageUrl: 'http://www.metroid-database.com/sm/art/smart_cartoon04.jpg',
      tags: ['debugging', 'stress']
    },

    {
      name: 'Ness the Queuetie',
      description: 'Ness is only available while supplies last; get First In, and you\'ll be First Out with your new, QUEUE-t-as-heck fried Ness!',
      numHours: 3,
      price: 67,
      imageUrl: 'http://preview.cutcaster.com/902942954-cartoon-letter-q.jpg',
      tags: ['queue', 'data-structures']
    },

    {
      name: 'Bier the codeFriend',
      description: 'If you like pina coladas, and getting caught in the adverbial rain, Bier is the codeFriend for you! Grab a brew, grab your codeFriend, and settle in for an exciting evening of boozy coding! Must be 21 or older to buy. Pairs great with Hamill the Pizza Monster!',
      numHours: 9,
      price: 39,
      imageUrl: 'http://previews.123rf.com/images/lenm/lenm1011/lenm101100434/8268638-Illustration-of-Beer-Character-Giving-a-Thumbs-Up-Stock-Illustration-beer-cartoon-alcohol.jpg',
      tags: ['booze', 'fun', 'drinks', 'indulge']
    },

  ];


  var FriendPromises = [];

  friends.forEach(function(friend) {
    FriendPromises.push(Friend.create(friend))
  });

  return FriendPromises;
};


var seedUser = function() {
  var users = [
    {
      email: 'obama@barack.usa',
      password: 'potus',
      name: '\'Bama',
      age: 55,
      isAdmin: true
    },

    {
      email: 'turner.mackenzie.m@gmail.com',
      password: 'codeFriend',
      name: 'Mackenzie Turner',
      age: 24,
      isAdmin: true
    },

    {
      email: 'dyoungsmith@gmail.com',
      password: 'codeFriend',
      name: 'Dani YoungSmith',
      age: 24,
      isAdmin: true
    },

    {
      email: 'angela.minchoi@gmail.com',
      password: 'codeFriend',
      name: 'Angela Choi',
      age: 24,
      isAdmin: true
    },

    {
      email: 'pjm605@gmail.com',
      password: 'codeFriend',
      name: 'Janice Park',
      age: 25,
      isAdmin: true
    },

  ];

  var UserPromises = [];

  users.forEach(function(user) {
    UserPromises.push(User.create(user))
  });

  return UserPromises;
};


db.sync({ force: true })
.then(function() {
  return Promise.all(seedFriend().concat(seedUser()));
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
