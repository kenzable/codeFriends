'use strict';
var Sequelize = require('sequelize');
var db = require('../_db');

module.exports = db.define('order', {
    // date: {
    //     type: Sequelize.DATE,
    //     defaultValue: Sequelize.NOW
    //     // default values for dates => current time
    // },
    total: {
        type: Sequelize.INTEGER,
        allowNull: false
    },
    items: {
        type: Sequelize.ARRAY(Sequelize.TEXT),
        allowNull: false
    }
});
