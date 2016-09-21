'use strict';
var router = require('express').Router();
// var HTTP_Error = require('../utils').HTTP_Error;
module.exports = router;

var Order = require('../../db/models/order.js');
var Friend = require('../../db/models/friend.js');
var Promise = require('bluebird');


router.get('/', function (req, res, next) {
	Order.findAll({order: [['id', 'ASC']]})
	.then(function(orders) {
		res.json(orders);
	})
	.catch(next);
});

router.post('/purchase', function(req, res, next){
  var items = req.body.items;
  var order = Order.build({items: items});

  order.calculateTotal()
  .then(function(orderTotal){
    order.total = orderTotal;
    return order.save();
  })
  .then(function(){
    return order.setUser(req.user);
  })
  .then(function(){
    if (req.user) return req.user.getCart();
  })
  .then(function(cart){
    if (cart) return cart.destroy();
  })
  .then(function(){
    res.json(order);
  })
  .catch(next);
});


router.get('/:id', function (req, res, next) {
	Order.findById(req.params.id)
	.then(function(order) {
		if (!order) res.sendStatus(400); //throw HTTP_Error(404, 'order not found');
		res.json(order);
	})
	.catch(next);
});

router.get('/history/:userId', function (req, res, next) {
  Order.findAll({
    where: {
      userId: req.params.userId
    }
  })
  .then(function(orders) {
    if (!orders) res.sendStatus(400); //throw HTTP_Error(404, 'order not found');
    res.json(orders);
  })
  .catch(next);
});


router.delete('/:id', function (req, res, next) {
	Order.destroy({
		where: {id: req.params.id}
	})
	.then(function(orderDestroyed) {
		if (!orderDestroyed) res.sendStatus(400); //throw HTTP_Error(404, 'order not destroyed');
		res.sendStatus(204);
	})
	.catch(next);
});

router.put('/:id/:status', function (req, res, next) {
  Order.findById(req.params.id)
  .then(function (foundOrder) {
    if (foundOrder) {
      foundOrder.update({status: req.params.status})
      .then(function(updatedOrder) {
        console.log('route', updatedOrder);
        res.status(200).json(updatedOrder);
      });
    } 
    else res.sendStatus(404);
  })
  .catch(next);
});
