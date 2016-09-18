'use strict';
var Sequelize = require('sequelize');
var db = require('../_db');
var Promise = require('bluebird');
var Friend = db.model('friend');

module.exports = db.define('order', {
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
  },
  {
    instanceMethods: {
      calculateTotal: function(){
        var items = this.items;
        return Promise.map(items, function(item){
          return Friend.findById(item.friendId);
        })
        .then(function(friends){
          return friends.reduce(function(a, b, i){
            return a + (b.price * items[i].qty);
          }, 0);
        })
        .catch(console.error.bind(console));
      }
    }
  });
