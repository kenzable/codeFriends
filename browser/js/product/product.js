app.config(function ($stateProvider) {
    $stateProvider.state('product', {
        url: '/product/:friendId',
        templateUrl: 'js/product/product.html',
        controller: 'ProductController'
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

    $scope.id = $stateParams.friendId;

    $scope.getStars = ProductFactory.getStars;

    ProductFactory.getFriendReviews($scope.id)
    .then(function(reviews) {
        $scope.friendReviews = reviews.rows;
    })
    .catch($log.error)


    ProductFactory.getAllFriends()
    .then(function(allFriends) {
        $scope.allFriends = allFriends;
    })
    .catch($log.error);


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
    };

});





