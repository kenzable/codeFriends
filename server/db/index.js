'use strict';
var db = require('./_db');

// eslint-disable-next-line no-unused-vars
var User = require('./models/user');
var Cart = require('./models/cart');
var Friend = require('./models/friend');
var Feedback = require('./models/feedback');
var Order = require('./models/order');

// if we had more models, we could associate them in this file
// e.g. User.hasMany(Reports)

Order.belongsTo(User);
Feedback.belongsTo(User);
Friend.hasMany(Feedback);
Cart.belongsTo(User);
User.hasMany(Order);
User.hasOne(Cart);

module.exports = db;
