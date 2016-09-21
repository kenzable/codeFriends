var sinon = require('sinon');
var expect = require('chai').expect;

var Sequelize = require('sequelize');

var db = require('../../../server/db');

var Friend = db.model('friend');

describe('Friend Model', function() {
	
	before(function () {
		return db.sync({force: true});
	});

	it('has a friend name, description, hours, and price', function() {
		return Friend.create({
			name: "Cat",
			review: "It's a cute cat!",
			numHours: 3,
			price: 60
		})
		.then(function (savedFriend) {
			expect(savedFriend.name).to.equal("Cat");
			expect(savedFriend.description).to.equal("It's a cute cat!");
			expect(savedFriend.numHours).to.equal(3);
			expect(savedFriend.price).to.equal(60);
		});
	})

	it('requires price', function () {

	    var friend = Friend.build({
			name: "Cat",
			review: "It's a cute cat!",
			numHours: 3
		});

	    return Friend.validate()
	    .then(function(result) {
	      expect(result).to.be.an.instanceOf(Error);
	      expect(result.message).to.contain('Friend was not created');
	    });

	});

	it('requires name', function () {

	    var friend = Friend.build({
			review: "It's a cute cat!",
			numHours: 3,
			price: 60
		});

	    return Friend.validate()
	    .then(function(result) {
	      expect(result).to.be.an.instanceOf(Error);
	      expect(result.message).to.contain('Friend was not created');
	    });

	});

	it('default value for ratings is 3', function () {

	    var friend = Friend.build({
			name: "Cat",
			review: "It's a cute cat!",
			numHours: 3,
			price: 60
		});

	    return friend.validate()
	    .then(function(savedFriend) {
	    	expect(savedFriend.ratings).to.equal([3]);
	    });

	});
});