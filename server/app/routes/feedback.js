'use strict';
var router = require('express').Router();
// var HTTP_Error = require('../utils').HTTP_Error;
module.exports = router;

var Feedback = require('../../db/models/feedback.js');
var User = require('../../db/models/user.js');

// router.get('/', function (req, res, next) {
// 	Feedback.findAll()
// 	.then(function(allFeedback) {
// 		res.json(allFeedback);
// 	})
// 	.catch(next);
// });

// Write new feedback for specific friend
router.post('/', function (req, res, next) {
    User.findById({
        where: {id: req.user.id}
    })
    .spread(function (user, wasCreatedBool) {
        return Feedback.create(req.body)
        .then(function (createdFeedback) {
            return createdFeedback.setUser(user);
        });
    })
    .then(function (createdFeedback) {
        res.sendStatus(200);
    })
    .catch(next);
});


// router.get('/:id', function (req, res, next) {
// 	Feedback.findById(req.params.id)
// 	.then(function (feedback) {
// 		if (!feedback) throw HTTP_Error(404, 'feedback not found');
// 		res.json(feedback);
// 	})
// 	.catch(next);
// });


// Delete review for a particular friend
router.delete('/:feedbackId', function (req, res, next) {
	Feedback.destroy({
		where: {id: req.params.feedbackId}
	})
	.then(function(feedbackDestroyed) {
		if (!feedbackDestroyed) res.sendStatus(400);// throw HTTP_Error(404, 'feedback not destroyed');
		res.sendStatus(204);
	})
	.catch(next);
});
