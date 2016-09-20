'use strict';
var Sequelize = require('sequelize');
var db = require('../_db');
// var Friend = db.model('friend');

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
    // hooks: {
    //     afterSave: function(review) {
            
    //     }
    // },

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
