app.config(function ($stateProvider) {
    $stateProvider.state('product', {
        url: '/product',
        controller: 'ProductController',
        templateUrl: 'js/product/product.html'
    });
});


app.config(function ($stateProvider) {
    $stateProvider.state('product.description', {
        url: '/description',
        templateUrl: 'js/product/product-description.html'
    });
});


app.config(function ($stateProvider) {
    $stateProvider.state('product.review', {
        url: '/review',
        templateUrl: 'js/product/product-review.html'
    });
});


app.controller('ProductController', function ($scope, ProductFactory, CartFactory, $log) {
 
  $scope.product = ProductFactory.getFriend(1);


    $scope.addToCart = function(friendId){
    CartFactory.addFriendToCart(friendId)
    .then(function(cart){
      $scope.items = cart.items;
      $scope.total = cart.total;
      
    })
    .catch($log.error);
  }

});