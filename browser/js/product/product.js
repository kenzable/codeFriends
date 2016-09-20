app.config(function ($stateProvider) {
    $stateProvider.state('product', {
        url: '/product/:friendId',
        templateUrl: 'js/product/product.html',
        controller: 'ProductController'
    });
});


app.config(function ($stateProvider) {
    $stateProvider.state('product.review', {
        url: '/review',
        templateUrl: 'js/product/product-review.html'
    });
});


app.controller('ProductController', function($scope, $log, ProductFactory, $stateParams, CartFactory) {
    $scope.id = $stateParams.friendId;

    $scope.addToCart = CartFactory.addFriendToCart;
    $scope.getStars = ProductFactory.getStars;


    ProductFactory.getFriend($scope.id)
    .then(function(friend) {
        $scope.friend = friend;
    })
    .catch($log.error);

    $scope.getAvgRating = ProductFactory.getAvgRating;
});

