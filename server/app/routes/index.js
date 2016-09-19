'use strict';
var router = require('express').Router(); // eslint-disable-line new-cap
var feedbackRouter = require('./feedback');
var cartRouter = require('./cart');
var friendsRouter = require('./friends');
var ordersRouter = require('./orders');
var usersRouter = require('./users')
var emailRouter = require('./email')



router.use('/feedback', feedbackRouter);
router.use('/userCart', cartRouter);
router.use('/orders', ordersRouter);
router.use('/friends', friendsRouter);
router.use('/users', usersRouter);
router.use('/email', emailRouter);

// Make sure this is after all of
// the registered routes!
router.use(function (req, res) {
    res.status(404).end();
});
module.exports = router;
