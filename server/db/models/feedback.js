'use strict';

var Sequelize = require('sequelize');
var db = require('../_db');

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
        afterSave: function(review) {
            return review.getFriend()
            .then(function(reviewedFriend) {
                reviewedFriend.update({
                    numRevs: ++reviewedFriend.numReviews,
                    rating: reviewedFriend.avgRating.push(review.rating)
                })
            })
        }
    },

    classMethods: {
        findByFriendId: function(id) {
            return this.findAndCountAll({   // returns .count and .rows
                where: {
                    friendId: id
                }
            })
        }
    }
});
