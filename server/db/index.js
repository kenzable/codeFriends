'use strict';
var db = require('./_db');
module.exports = db;

// eslint-disable-next-line no-unused-vars
var User = require('./models/user');
var Cart = require('./models/cart');
var Feedback = require('./models/feedback');
var Friend = require('./models/friend');
var Order = require('./models/order');

// if we had more models, we could associate them in this file
// e.g. User.hasMany(Reports)

User.hasMany(Order);
Feedback.belongsTo(User);
Friend.hasMany(Feedback);
Cart.belongsTo(User);
