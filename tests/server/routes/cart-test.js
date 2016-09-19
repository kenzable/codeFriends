// Instantiate all models
var expect = require('chai').expect;

var Sequelize = require('sequelize');

var db = require('../../../server/db');

var supertest = require('supertest');

describe('Cart Route', function () {

    var app, Cart, User;

    beforeEach('Sync DB', function () {
        return db.sync({ force: true });
    });

    beforeEach('Create app', function () {
        app = require('../../../server/app')(db);
        Cart = db.model('cart');
        User = db.model('user');
    });

  describe('Requesting when user not logged in', function () {

    var guestAgent;

    beforeEach('Create guest agent', function () {
      guestAgent = supertest.agent(app);
    });

    it('should get 401 not authorized', function (done) {
      guestAgent.get('/api/userCart')
        .expect(401)
        .end(done);
    });

  });

  describe('Request cart when logged in', function () {

    var loggedInAgentNoCart, loggedInAgentWithCart;

    var userInfo1 = {
      name: 'Joe Coolman',
      email: 'joe@gmail.com',
      password: 'shoopdawoop'
    };

    var userInfo2 = {
      name: 'Jack White',
      email: 'whitestripes@gmail.com',
      password: 'elephant'
    };

    var cartData = [{itemId: 1,
                    friendId: 10,
                    name: 'Champlin',
                    price: 674,
                    hours: 18,
                    qty: 1}];

    beforeEach('Create users', function (done) {
      return User.create(userInfo1).then(function (user) {
        return User.create(userInfo2);
      })
      .then(function(user){
        done();
      })
      .catch(done);
      });

    beforeEach('Log in user1', function (done) {
      loggedInAgentNoCart = supertest.agent(app);
      loggedInAgentNoCart.post('/login').send(userInfo1).end(done);
    });

    beforeEach('Log in user2', function (done) {
      loggedInAgentWithCart = supertest.agent(app);
      loggedInAgentNoCart.post('/login').send(userInfo2).end(done);
    });

    beforeEach('give user2 cart', function (done) {
      loggedInAgentWithCart.post('/api/userCart').send(cartData).end(done);
    });

    it('should get a 204 when no cart data for user', function (done) {
      loggedInAgentNoCart.get('/api/userCart').expect(204).end(function (err, response) {
        if (err) return done(err);
        expect(response.body).to.be.empty;
        done();
      });
    });

    it('should get 200 and an object with cart data', function (done) {
      loggedInAgentWithCart.get('/api/userCart').expect(200).end(function (err, response) {
        if (err) return done(err);
        expect(response.body).to.be.an('object');
        done();
      });
    });

  });

});
