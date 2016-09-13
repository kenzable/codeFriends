'use strict';
var router = require('express').Router(); // eslint-disable-line new-cap
module.exports = router;

// router.use('/members', require('./members'));
router.use('/api', require('./api'));
router.use('/auth', require('./auth'));

// Make sure this is after all of
// the registered routes!
router.use(function (req, res) {
    res.status(404).end();
});
