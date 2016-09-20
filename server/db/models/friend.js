'use strict';

var Sequelize = require('sequelize');

var db = require('../_db');
// var Feedback = db.model('feedback');


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
	},
	numRevs: {
		type: Sequelize.INTEGER,
		defaultValue: 0
	},
	ratings: {
		type: Sequelize.ARRAY(Sequelize.INTEGER),
		defaultValue: [3]
	}
}, {
	// OPTIONS HERE
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
		},

		getAllTags: function() {
			var tagArr = [];
			return this.findAll()
			.then(function(friends) {
				friends.forEach(function(friend) {
					friend.tags.forEach(function(tag) {
						if (tagArr.indexOf(tag) === -1) {
							tagArr.push(tag);
						}
					})
				})
				return tagArr;
			})
		}
	}
});







