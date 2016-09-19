var router = require('express').Router(); // eslint-disable-line new-cap
var Cart = require('../../db').model('cart');
var Cart = require('../../db').model('cart');
var Order = require('../../db').model('order');
var Friend = require('../../db').model('friend');
var Promise = require('bluebird');

router.get('/', function(req, res, next){
  req.user.getCart()
  .then(function(cart){
    if (cart) {
      res.json(cart);
    }
    else res.end();
  })
  .catch(next);
});

router.post('/', function(req, res, next){
  Cart.findOrCreate({where: {userId: req.user.id}})
  .spread(function(cart){
    return cart.update(req.body);
  })
  .then(function(){
    res.sendStatus(204);
  })
  .catch(next);
});

module.exports = router;
