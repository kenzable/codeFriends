/* janice */

var router = require('express').Router(); // eslint-disable-line new-cap
module.exports = router;
var User = require('../../db/models/user.js');
var Auth = require('../utils/auth.middleware')

router.get('/', Auth.assertAuthenticated, function (req, res, next) {

	User.findAll({})
	.then (function (users) {
		res.json(users);
	})
	.catch(next);
});

router.get('/:id', Auth.assertAuthenticated, function (req, res, next) {

	User.findById(req.params.id)
	.then (function (user) {
		if(!user) res.sendStatus(404)
		else req.json(user)
	})
	.catch(next);
});

router.put('/:id', Auth.assertAuthenticated, function (req, res, next) {

	User.update(req.body, {
		where: {id: req.params.id},
		returning: true
	})
	.then(function (result) {
		res.json(result)
	})
	.catch(next);
});

router.delete('/:id', Auth.assertAuthenticated, function (req, res, next) {

  	User.destroy({where: {id: req.params.id}})
  	.then(function (numDestroyed) {
  		if(!numDestroyed) throw Error('no user destroyed')
  		else res.sendStatus(204)
  	})
  	.catch(next);

});




