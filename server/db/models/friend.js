'use strict';

var Sequelize = require('sequelize');

var db = require('../_db');
// var Category = require('')


module.exports = db.define('friend', {
	// SCHEMA HERE
	name: {
		type: Sequelize.STRING,
		allowNull: false
	},
	description: {
		type: Sequelize.TEXT,
		allowNull: false
	},
	numHours: {
		// each hour-category will have a separate friendId
		// use this to determine which is viewed on product page and which are options
		type: Sequelize.INTEGER,
		allowNull: false
	},
	price: {
		type: Sequelize.INTEGER,
		allowNull: false
	},
	imageUrl: {
		// URL??
		type: Sequelize.STRING
	},
	tags: {
		type: Sequelize.ARRAY(Sequelize.STRING)
	}
}, {
	// KEEP IF WE ARE HAVING USERS INPUT THEIR OWN TAGS
	// hooks: {
	// 	beforeValidate: {
	// 		setTags: function(tags) {
	// 			if (typeof(tags) === 'string') {
	// 				var tagArr = tags.split(',').map(function(tag) {
	// 					return tag.trim();
	// 				})
	// 				this.setDataValue('tags', tagArr);
	// 			}
	// 			else {
	// 				this.setDataValue('tags', tags);
	// 			}
	// 		}
	// 	}
	// },
	classMethods: {
		findFriendsByTag: function(tag) {
			return this.findAll({
				where: {
					tags: { $overlap: [tag] }
				}
			})
		}
	}
});
