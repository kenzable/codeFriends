var router = require('express').Router(); // eslint-disable-line new-cap
var Cart = require('../../db').model('cart');
var Order = require('../../db').model('order');
var Friend = require('../../db').model('friend');
var Promise = require('bluebird');

router.get('/', function(req, res, next){
  Cart.findOrCreate({where: {userId: req.user.id}})
  .then(function(cart){
    if (cart) {
      res.json(cart.items);
      return cart.destroy()
    }
    else res.end();
  })
  .catch(next);
});

router.post('/', function(req, res, next){
  Cart.create(req.body)
  .then(function(cart){
    return cart.setUser(req.user);
  })
  .then(function(cart){
    res.json(cart);
  })
  .catch(next);
});

router.post('/purchase', function(req, res, next){
  console.log(req.body.items);
  var items = req.body.items;
  Promise.map(items, function(item){
    return Friend.findById(item.friendId);
  })
  .then(function(friends){
    return friends.reduce(function(a, b){
      return a + b.price;
    }, 0);
  })
  .then(function(total){
    return Order.create({items: items, total: total});
  })
  .then(function(order){
    return order.setUser(req.user);
  })
  .then(function(order){
    res.json(order);
  })
  .catch(next);
});

  // Order.create({items: req.body.items})
  // .then(function(order){
  //   newOrder = order;
  //   return Cart.findOne({where: {userId: req.user.id}});
  // })
  // .then(function(){
  //   res.json(newOrder);
  // })
  // .catch(next);

module.exports = router;
