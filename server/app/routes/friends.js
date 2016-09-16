var express = require('express');
var router = express.Router();
var Friend = require('../../db/models/friend.js');
var Feedback = require('../../db/models/feedback.js');
var Promise = require('sequelize').Promise;

module.exports = router;


// Get all friends
router.get('/', function(req, res, next) {
	var allFriends;
	Friend.findAll()
	.then(function(friends) {
		if (friends) {
			allFriends = friends;
			return Promise.map(allFriends, function(friend) {
				return Feedback.findAndCount({
					where: {
						friendId: friend.id
					}
				})
			})
		}
		else { res.sendStatus(404) }
	})
	.then(function(feedback) {
		for (var i = 0; i < feedback.length; i++) {
			// Get number of reviews
			allFriends[i].dataValues.numRevs = feedback[i].count;

			// Get average rating
			var friendRating = feedback[i].rows.map(function(row) {
				return row.dataValues.rating;
			});

			var avgRating;

			if (friendRating.length) {
				var sum = friendRating.reduce(function(a, b) { return a + b});
				avgRating = Math.floor(sum / friendRating.length);
			}
			else { avgRating = 0 }

			allFriends[i].dataValues.avgRating = avgRating;
		}
		res.json(allFriends);
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

// Get specific friend
router.get('/:friendId', function(req, res, next) {
	Friend.findById(req.params.friendId)
	.then(function(foundFriend) {
		if (foundFriend) res.json(foundFriend);
		else res.sendStatus(404);
	})
	.catch(next);
});

// Modify a friend's details
router.put('/:friendId', function(req, res, next) {
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
		else res.sendStatus(404);
	})
	.catch(next);
});

// Delete a friend
router.delete('/:friendId', function(req, res, next) {
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









