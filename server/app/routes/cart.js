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

router.post('/purchase', function(req, res, next){
  console.log(req.body.items);
  var items = req.body.items;
  Promise.map(items, function(item){
    console.log('inside the map');
    return Friend.findById(item.friendId);
  })
  .then(function(friends){
    return friends.reduce(function(a, b){
      return a + b.price;
    }, 0);
  })
  .then(function(total){
    console.log('total', total);
    return Order.create({items: items, total: total});
  })
  .then(function(order){
    console.log('order', order);
    return req.user.addOrder(order);
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
