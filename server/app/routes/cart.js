var router = require('express').Router(); // eslint-disable-line new-cap
var Cart = require('../../db').model('cart');
var Cart = require('../../db').model('cart');
var Order = require('../../db').model('order');
var Friend = require('../../db').model('friend');
var Promise = require('bluebird');

router.get('/', function(req, res, next){
  Cart.findOrCreate({where: {userId: req.user.id}})
  .spread(function(cart, created){
    if (created) {
      cart.setUser(req.user);
    }
    res.status(201).json(cart);
  })
  .catch(next);
});

router.post('/', function(req, res, next){
  req.user.getCart()
  .then(function(cart){
    return cart.update(req.body);
  })
  .then(function(){
    res.sendStatus(200);
  })
  .catch(next);
});

module.exports = router;
