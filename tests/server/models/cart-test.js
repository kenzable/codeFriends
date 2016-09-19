var sinon = require('sinon');
var expect = require('chai').expect;

var Sequelize = require('sequelize');

var db = require('../../../server/db');

var Cart = db.model('cart');

describe('Cart model', function () {

    beforeEach('Sync DB', function () {
       return db.sync({ force: true });
    });

    describe('adding items to cart', function () {

        describe('items', function () {

          var cartData = [{itemId: 1,
                          friendId: 10,
                          name: 'Champlin',
                          price: 674,
                          hours: 18,
                          qty: 1}];

          beforeEach(function (done) {
            Cart.create({items: cartData})
            .then()
            .catch(done);
          });

          it('should be able to stringify into JSON', function (done) {
            Cart.findById(1)
            .then(function(cart){
                var comparison = JSON.stringify(cart.items) === JSON.stringify(cartData);
                expect(comparison).to.be.true;
                done();
            })
            .catch(done);
          });
        });
    });
});
