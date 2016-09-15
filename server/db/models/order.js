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
      type: Sequelize.JSON,
      allowNull: false,
      get: function() {
          return JSON.parse(this.getDataValue('items'));
      },
      set: function(val) {
          return this.setDataValue('items', JSON.stringify(val));
      }
    }
});
