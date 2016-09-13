var router = require('express').Router(); // eslint-disable-line new-cap
var Cart = require('../../db').model('cart');
var Order = require('../../db').model('order');
var Friend = require('../../db').model('friend');
var Promise = require('bluebird');

router.get('/', function(req, res, next){
  Cart.findOne({where: {userId: req.user.id}})
  .then(function(cart){
    res.json(cart.items);
  })
  .catch(next);
});

router.post('/purchase', function(req, res, next){
//Will refactor this once I review the cart model!
//also need to figure out how we're getting cart items from client side
  var total;
  var items = req.body.items; //hopefully this is already an array??
  Promise.map(items, function(itemId){
    return Friend.findbyId(itemId);
  })
  .then(function(friends){
    total = friends.reduce(function(a, b){
      return a + b.price;
    });
    return total;
  })
  .then(function(total){

  })
  .catch(next);

  var newOrder;

  Order.build({items: req.body.items});









  Order.create({items: req.body.items})
  .then(function(order){
    newOrder = order;
    return Cart.findOne({where: {userId: req.user.id}});
  })
  .then(function(){
    res.json(newOrder);
  })
  .catch(next);
});

module.exports = router;
