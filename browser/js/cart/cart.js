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
      console.log(cart);
      $scope.items = cart.items;
      $scope.total = cart.total;
    })
    .catch($log.error)
  }
  $scope.addToCart = function(friendId){
    CartFactory.addFriendToCart(friendId)
    .then(function(friend){
      $scope.added = friend;
      $scope.total = CartFactory.getTotal();
    })
    .catch($log.error);
  }
  $scope.saveCart = CartFactory.saveCart;
});
