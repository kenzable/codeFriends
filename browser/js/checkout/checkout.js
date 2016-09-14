app.config(function ($stateProvider) {
    $stateProvider.state('checkout', {
        url: '/checkout',
        // controller: 'CheckoutController',
        templateUrl: 'js/checkout/checkout.html'
    });
});


// app.controller('CheckoutController', function ($scope, CheckoutFactory, $log) {
//   $scope.items = CartFactory.getItems();
//   $scope.total = CartFactory.getTotal();

//   $scope.getUserCart = function(){
//     CartFactory.getUserCart()
//     .then(function(cart){
//       $scope.items = cart.items;
//       $scope.total = cart.total;
//     })
//     .catch($log.error)
//   }
//   $scope.addToCart = function(friendId){
//     CartFactory.addFriendToCart(friendId)
//     .then(function(friend){
//       $scope.added = friend;
//     })
//     .catch($log.error);
//   }
//   $scope.saveCart = CartFactory.saveCart;
// });