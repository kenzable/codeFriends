'use strict';
var router = require('express').Router(); // eslint-disable-line new-cap
const HTTP_Error = require('../utils').HTTP_Error;
module.exports = router;

var Order = require('../../db/models/order.js');

router.get('/', function (req, res, next) {
  Order.findAll()
  .then(orders => res.json(orders))
  .catch(next);
});

router.get('/:id', function (req, res, next) {
  Order.findById(req.params.id)
  .then(order => {
    if (!order) throw HTTP_Error(404, 'order not found');
    res.json(order);
  })
  .catch(next);
});

router.delete('/:id', function (req, res, next) {
  Order.destroy({
    where: {id: req.params.id}
  })
  .then(orderDestroyed => {
    if (!orderDestroyed) throw HTTP_Error(404, 'no order destroyed');
    res.sendStatus(204);
  })
  .catch(next);
});
