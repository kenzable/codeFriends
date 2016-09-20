'use strict';

var Sequelize = require('sequelize');
var db = require('../_db');
var Friend = db.model('friend');

module.exports = db.define('feedback', {
    // SCHEMA
    review: {
        type: Sequelize.TEXT,
        allowNull: false
    },
    rating: {
        type: Sequelize.INTEGER,
        allowNull: false
    },
    title: {
        type: Sequelize.TEXT
    }
}, {
    // OPTIONS
    hooks: {
        afterValidate: function(review) {
            return Friend.findById(review.friendId)
            .then(function(reviewedFriend) {
                var newRatings = reviewedFriend.dataValues.ratings;
                newRatings.push(review.dataValues.rating);

                var newRevs = ++reviewedFriend.dataValues.numRevs;

                var updateObj = {
                    numRevs: newRevs,
                    ratings: newRatings
                };
                reviewedFriend.update(updateObj, { fields: ['numRevs', 'ratings']})
            })
            .catch(console.error.bind(console));
        }
    },

    classMethods: {
        findByFriendId: function(id) {
            return this.findAll({
                where: {
                    friendId: id
                }
            })
        }
    }
});
