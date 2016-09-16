app.config(function ($stateProvider) {
    $stateProvider.state('cart', {
        url: '/cart',
        controller: 'CartController',
        templateUrl: 'js/cart/cart.html'
    });
});

app.config(function ($stateProvider) {
    $stateProvider.state('cart.checkout', {
        url: '/checkout',
        controller: 'CartController',
        templateUrl: 'js/checkout/checkout.html'
    });
});

app.controller('CartController', function ($scope, CartFactory, $log, $rootScope) {
  function updateCartScope() {
    $scope.items = CartFactory.getItems();
    $scope.total = CartFactory.getCartTotal();
  }

  updateCartScope();

<<<<<<< HEAD
  $rootScope.$on('auth-login-success', function(){
    CartFactory.getUserCart()
    .then(updateCartScope)
    .catch($log.error);
  });


=======
>>>>>>> 61c7abf2e25275fcdad7fc8db5e4a0628b77c129
  $rootScope.$on('auth-logout-success', updateCartScope);

  $scope.addToCart = function(friendId, qty){
    CartFactory.addFriendToCart(friendId, qty)
    .then(updateCartScope)
    .catch($log.error);
  }

  $scope.clearCart = function(){
    CartFactory.clearCart();
    updateCartScope();
  }

   $scope.deleteItem = function(itemId){
    CartFactory.deleteItem(itemId);
    updateCartScope();
  }

  $scope.purchase = function(){
    CartFactory.purchase()
    .then(updateCartScope)
    .catch($log.error);
  };
  $scope.updateQty = function(itemId, diff){
    CartFactory.updateQty(itemId, diff)
    .then(updateCartScope)
    .catch($log.error);
  };
  $scope.getItemTotal = CartFactory.getItemTotal;
});
