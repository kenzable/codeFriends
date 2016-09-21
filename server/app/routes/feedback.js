'use strict';

var router = require('express').Router();
// var HTTP_Error = require('../utils').HTTP_Error;
var Feedback = require('../../db/models/feedback.js');


// router.get('/', function (req, res, next) {
// 	Feedback.findAll()
// 	.then(function(allFeedback) {
// 		res.json(allFeedback);
// 	})
// 	.catch(next);
// });

// Write new feedback for specific friend
router.post('/', function (req, res, next) {
    var review = Feedback.build(req.body);
    review.userId = req.user ? req.user.id : null;
    review.save()
    .then(function (createdFeedback) {
        res.status(201).json(createdFeedback);
    })
    .catch(next);
});

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

module.exports = router;