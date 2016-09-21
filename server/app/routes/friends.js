var express = require('express');
var router = express.Router();
var Friend = require('../../db/models/friend.js');
var Feedback = require('../../db/models/feedback.js');
var Promise = require('sequelize').Promise;
var Auth = require('../utils/auth.middleware');
module.exports = router;


// Get all friends
router.get('/', function(req, res, next) {
	Friend.findAll()
	.then(function(friends) {
		res.json(friends)
	})
	.catch(next);
});

// Create new friend
router.post('/', function(req, res, next) {
	Friend.create({
		where: req.body
	})
	.then(function(createdFriend) {
		if (createdFriend) res.redirect('/createdFriend.id');
		else res.send('Friend was not created');
	})
	.catch(next);
});

// Get all unique tags for all friends
router.get('/tags', function(req, res, next) {
	Friend.getAllTags()
	.then(function(tagArr) {
		if (tagArr) res.json(tagArr);
		else res.sendStatus(204)
	})
	.catch(next);
});

//Get a list of friends filtered by one tag
router.get('/tags/:tagName', function(req, res, next){
	Friend.findFriendsByTag(req.params.tagName)
	.then(function(friends){
		if (friends) res.json(friends);
		else res.sendStatus(204);
	})
	.catch(next);
});

// Get specific friend
router.get('/:friendId', function(req, res, next) {
	Friend.findById(req.params.friendId)
	.then(function(foundFriend) {
		if (foundFriend) res.json(foundFriend);
		else res.sendStatus(204);
	})
	.catch(next);
});

// Modify a friend's details
router.put('/:friendId', Auth.assertAdmin, function(req, res, next) {
	Friend.findById(req.params.friendId)
	.then(function(foundFriend) {
		if (foundFriend) {
			foundFriend.update({
				where: req.body
			})
			.then(function(updatedFriend) {
				res.sendStatus(200).json(updatedFriend);
			})
		}
		else { res.sendStatus(204) }
	})
	.catch(next);
});

// Delete a friend
router.delete('/:friendId', Auth.assertAdmin, function(req, res, next) {
	Friend.destroy({
		where: {
			id: req.params.friendId
		}
	})
	.then(function(destroyedFriend) {
		if (destroyedFriend) res.sendStatus(204);
		else res.send('Why would you want to delete me??');
	})
	.catch(next);
});

// Feedback for one friend
router.get('/:friendId/feedback', function(req, res, next) {
	Feedback.findByFriendId(req.params.friendId)
	.then(function(feedback) {
		if (feedback) res.status(200).json(feedback);
		else res.send('No friend reviews!');
	})
	.catch(next);
})

