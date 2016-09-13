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
});


//association between feedback and friend