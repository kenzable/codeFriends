'use strict';


var expect = require('chai').expect;
var request = require('supertest');
var agent = request.agent(app);
var sinon = require('sinon');

var Sequelize = require('sequelize');

var db = require('../../../server/db');
var Friend = db.model('friend');
var app = require('../app');

describe('Friend Route:', function () {

  /**
   * First we clear the database before beginning each run
   */
  before(function () {
    return db.sync({force: true});
  });

	describe('GET /friends route/', function () {

		it('responds with an array via JSON', function () {

			return agent
			.get('/api/friends')
			.expect('Content-Type', /json/)
			.expect(200)
			.expect(function (res) {
				expect(res.body).to.be.an.instanceOf(Array);
				expect(res.body).to.have.length(0);
			})
		});


	  	it('returns an friend if there is one in the DB', function () {

			var friend = Friend.build({
				name: "Dog",
				description: "It's a cute dog!",
				numHours: 6,
				price: 120
			});

			return friend.save().then(function () {

				return agent
				.get('/api/friends')
				.expect(200)
				.expect(function (res) {
					expect(res.body).to.be.an.instanceOf(Array);
					expect(res.body[0].name).to.equal("Dog");
				});
			});
	    });
	});

	describe('GET /api/friends/:id', function () {

		var friend;

		before(function () {

			friend = Friend.build({
				name: "Cat",
				description: "It's a cute cat!",
				numHours: 2,
				price: 40
			});
		});
		
	    it('returns the JSON of the friend based on the id', function () {

    	return agent
	    	.get('/api/friends/' + friend.id)
	    	.expect(200)
	    	.expect(function (res) {
	       		if (typeof res.body === 'string') {
	        		res.body = JSON.parse(res.body);
	        	}
	        	expect(res.body.description).to.equal("It's a cute cat!");
      		});
    	});
	});
});
