'use strict';
var router = require('express').Router();
var Mailgun = require('mailgun-js');
// var HTTP_Error = require('../utils').HTTP_Error;
module.exports = router;

var Order = require('../../db/models/order.js');
var Friend = require('../../db/models/friend.js');
var Promise = require('bluebird');

var api_key = 'key-41db0dce35d2a82ef5ccdfc02c59f7d1';
var domain = 'sandbox2a9bc24475174d6bab636084b47af603.mailgun.org';
var from_who = 'z1660218@gmail.com';


router.get('/', function (req, res, next) {
	Order.findAll()
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
  .then(function () {
    var mailgun = new Mailgun({apiKey: api_key, domain: domain});

    var data = {
    //Specify email data
      from: "z1660218@gmail.com", 
    //The email to contact
      to: "z1660218@students.niu.edu", 
    //Subject and text data  
      subject: 'Hello from Code Friends',
      html: 'We received your order and are working on it now. We will email you when it is shipped!' 
    }

    //Invokes the method to send emails given the above data with the helper library
    mailgun.messages().send(data, function (err, body) {
        //If there is an error, render the error page
        if (err) {
            //res.render('error', { error : err});
            console.log("got an error: ", err);
        }
        //Else we can greet    and leave
        else {
            //Here "submitted.jade" is the view file for this landing page 
            //We pass the variable "email" from the url parameter in an object rendered by Jade
            //res.render('submitted', { email : req.params.mail });
            console.log(body);
        }
    });

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
