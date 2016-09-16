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
        templateUrl: 'js/checkout/userInfo.html'
    });
});

app.controller('CartController', function ($scope, CartFactory, $log, $rootScope) {
  function updateCartScope() {
    $scope.items = CartFactory.getItems();
    $scope.total = CartFactory.getTotal();
  }

  updateCartScope();

  $rootScope.$on('auth-login-success', function(){
    CartFactory.getUserCart()
    .then(updateCartScope)
    .catch($log.error);
  });

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

   $scope.deleteItem = function(cartId){
    CartFactory.deleteItem(cartId);
    updateCartScope();
  }

  $scope.purchase = function(){
    CartFactory.purchase()
    .then(updateCartScope)
    .catch($log.error);
  };
  $scope.updateQty = function(cartId, diff){
    CartFactory.updateQty(cartId, diff)
    .then(updateCartScope)
    .catch($log.error);
  };
});
