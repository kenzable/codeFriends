'use strict';
var router = require('express').Router();
var HTTP_Error = require('../utils').HTTP_Error;
module.exports = router;

var Order = require('../../db/models/order.js');

router.get('/', function (req, res, next) {
	Order.findAll()
	.then(function(orders) {
		res.json(orders);
	})
	.catch(next);
});

router.get('/:id', function (req, res, next) {
	Order.findById(req.params.id)
	.then(function(order) {
		if (!order) throw HTTP_Error(404, 'order not found');
		res.json(order);
	})
	.catch(next);
});

router.delete('/:id', function (req, res, next) {
	Order.destroy({
		where: {id: req.params.id}
	})
	.then(function(orderDestroyed) {
		if (!orderDestroyed) throw HTTP_Error(404, 'order not destroyed');
		res.sendStatus(204);
	})
	.catch(next);
});
