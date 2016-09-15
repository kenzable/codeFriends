app.config(function ($stateProvider) {
    $stateProvider.state('cart', {
        url: '/cart',
        controller: 'CartController',
        templateUrl: 'js/cart/cart.html'
    });
});

app.controller('CartController', function ($scope, CartFactory, $log) {
  $scope.items = CartFactory.getItems();
  $scope.total = CartFactory.getTotal();

  $scope.getUserCart = function(){
    CartFactory.getUserCart()
    .then(function(cart){
      $scope.items = cart.items;
      $scope.total = cart.total;
    })
    .catch($log.error)
  }
  $scope.addToCart = function(friendId, qty){
    CartFactory.addFriendToCart(friendId, qty)
    .then(function(cart){
      $scope.items = cart.items;
      $scope.total = cart.total;
    })
    .catch($log.error);
  }
  $scope.clearCart = function(){
    var cart = CartFactory.clearCart();
      $scope.items = cart.items;
      $scope.total = cart.total;
  }
  $scope.saveCart = CartFactory.saveCart;
  $scope.purchase = function(){
    CartFactory.purchase()
    .then(function(order){
      $scope.newOrder = order;
      $scope.items = CartFactory.getItems();
      $scope.total = CartFactory.getTotal();
    })
    .catch($log.error);
  };
});
