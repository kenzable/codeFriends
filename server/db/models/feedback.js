'use strict';
var Sequelize = require('sequelize');
var db = require('../_db');

module.exports = db.define('feedback', {
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
