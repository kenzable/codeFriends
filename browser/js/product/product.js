app.config(function ($stateProvider) {
    $stateProvider.state('product', {
        url: '/product/:friendId',
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


app.controller('ProductController', function ($scope, ProductFactory, CartFactory, $log, $stateParams) {

    ProductFactory.getAllFriends()
    .then(function(allFriends) {
        $scope.allFriends = allFriends;
    })
    .catch($log.error);

    $scope.getNumReviews = ProductFactory.getNumReviews;

    $scope.id = $stateParams.friendId

    ProductFactory.getFriend($scope.id)
    .then(function(friend) {
        $scope.friend = friend;
    })
    .catch($log.error);

    $scope.addToCart = function(friendId){
        CartFactory.addFriendToCart(friendId)
        .then(function(cart){
          $scope.items = cart.items;
          $scope.total = cart.total;
        })
        .catch($log.error);
    }


});

