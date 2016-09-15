var 
app.config(function ($stateProvider) {
    $stateProvider.state('checkout', {
        url: '/checkout',
        // controller: 'CheckoutController',
        templateUrl: 'js/checkout/checkout.html'
    });
});


// app.controller('CheckoutController', function ($scope, CheckoutFactory) {
// 	// $scope.items = CartFactory.getItems();
// 	// $scope.total = CartFactory.getTotal();

// 	// $scope.getUserCart = function(){
// 	// CartFactory.getUserCart()
// 	// .then(function(cart){
// 	//   $scope.items = cart.items;
// 	//   $scope.total = cart.total;
// 	// })
// 	// .catch($log.error)
// 	// }

// 	// $scope.addToCart = function(friendId){
// 	// CartFactory.addFriendToCart(friendId)
// 	// .then(function(friend){
// 	//   $scope.added = friend;
// 	// })
// 	// .catch($log.error);
// 	// }

// 	// $scope.saveCart = CartFactory.saveCart;

// });

// //checkout - using Stripe.js
// //Stripe event handlers

// (function($) { //ensuring the global variable jQuery will be bound to the "$" inside the closure 
// 	$(function() {
// 	  $('form.require-validation').bind('submit', function(e) {
// 	    var $form         = $(e.target).closest('form'),
// 	        inputSelector = ['input[type=email]', 'input[type=password]',
// 	                         'input[type=text]', 'input[type=file]',
// 	                         'textarea'].join(', '),
// 	        $inputs       = $form.find('.required').find(inputSelector),
// 	        $errorMessage = $form.find('div.error'),
// 	        valid         = true;

// 	    $errorMessage.addClass('hide');
// 	    $('.has-error').removeClass('has-error');
// 	    $inputs.each(function(i, el) {
// 	      var $input = $(el);
// 	      if ($input.val() === '') {
// 	        $input.parent().addClass('has-error');
// 	        $errorMessage.removeClass('hide');
// 	        e.preventDefault(); // cancel on first error
// 	      }
// 	    });
// 	  });
// 	});

// 	$(function() {
// 	  var $form = $("#payment-form");

// 	  $form.on('submit', function(e) {
// 	    if (!$form.data('cc-on-file')) {
// 	      e.preventDefault();
// 	      Stripe.setPublishableKey($form.data('stripe-publishable-key'));
// 	      Stripe.createToken({
// 	        number: $('.card-number').val(),
// 	        cvc: $('.card-cvc').val(),
// 	        exp_month: $('.card-expiry-month').val(),
// 	        exp_year: $('.card-expiry-year').val()
// 	      }, stripeResponseHandler);
// 	    }
// 	  });

// 	  function stripeResponseHandler(status, response) {
// 	    if (response.error) {
// 	      $('.error')
// 	        .removeClass('hide')
// 	        .find('.alert')
// 	        .text(response.error.message);
// 	    } else {
// 	      // token contains id, last4, and card type
// 	      var token = response['id'];
// 	      // insert the token into the form so it gets submitted to the server
// 	      $form.find('input[type=text]').empty();
// 	      $form.append("<input type='hidden' name='reservation[stripe_token]' value='" + token + "'/>");
// 	      $form.get(0).submit();
// 	    }
// 	  }
// 	})
// })(jQuery);