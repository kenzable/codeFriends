var sinon = require('sinon');
var expect = require('chai').expect;

var Sequelize = require('sequelize');

var db = require('../../../server/db');

var Feedback = db.model('feedback');

describe('Feedback Model', function() {
	
	before(function () {
		return db.sync({force: true});
	});

	it('has title and review fields', function() {
		return Feedback.create({
			title: "This product is awesome!",
			review: "I would buy it again",
			rating: 3
		})
		.then(function (savedFeedback) {
			expect(savedFeedback.title).to.equal("This product is awesome!");
			expect(savedFeedback.review).to.equal("I would buy it again");
			expect(savedFeedback.rating).to.equal(3);
		});
	})

	it('requires content', function () {

	    var feedback = Feedback.build({
	      title: "This product is awesome!",
	      rating: 4
	    });

	    return feedback.validate()
	    .then(function(result) {
	      expect(result).to.be.an.instanceOf(Error);
	      expect(result.message).to.contain('review cannot be null');
	    });

	});

	it('requires rating', function () {

	    var feedback = Feedback.build({
	      title: "This product is awesome!",
	      review: "I would buy it again"
	    });

	    return feedback.validate()
	    .then(function(result) {
	      expect(result).to.be.an.instanceOf(Error);
	      expect(result.message).to.contain('rating cannot be null');
	    });

	});

	it('does not require title', function () {

	    var feedback = Feedback.build({
	      review: "I would buy it again",
	      rating: 3
	    });

	    return feedback.validate()
	    .then(function(result) {
	      expect(result).to.be.an.instanceOf(Error);
	      expect(result.message).to.contain('title could be null');
	    });

	});
});