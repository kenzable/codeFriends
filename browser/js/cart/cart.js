app.config(function ($stateProvider) {
    $stateProvider.state('cart', {
        url: '/cart',
        controller: 'CartController',
        templateUrl: 'js/cart/cart.html'
    });
});

app.controller('CartController', function ($scope, CartFactory, $log) {
  $scope.cartTotal = localStorage.cartTotal || 0;

  $scope.getUserCart = function(){
    CartFactory.getUserCart()
    .then(function(items){
      $scope.items = items;
    })
    .catch($log.error)
  }
  $scope.addToCart = function(friendId){
    CartFactory.getFriend(friendId)
    .then(function(friend){
      var currentTotal = localStorage.getItem('cartTotal');
      var newTotal = currentTotal ? +currentTotal + friend.price : friend.price;
      localStorage.setItem('cartTotal', newTotal);
      $scope.cartTotal = newTotal;




    })
  }
});
