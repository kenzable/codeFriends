'use strict';

var db = require('./server/db/_db.js');
var Cart = db.model('cart');
var Feedback = db.model('feedback');
var Friend = db.model('friend');
var Order = db.model('order');
var User = db.model('user');







db.sync({ force: true })
.then(function() {
	console.log('seed successful');
})
.catch(function(err) {
	console.log(err);
})