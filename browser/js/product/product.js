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


app.controller('ProductController', function($scope, $log, ProductFactory, $stateParams) {
    $scope.friendId = $stateParams.friendId;

    ProductFactory.getFriend($scope.friendId)
    .then(function(friend) {
        $scope.friend = friend;
    })
    .catch($log.error)

    ProductFactory.getFriendReviews($scope.friendId)
    .then(function(feedback) {
        $scope.friend.numRevs = feedback.count;
        $scope.friend.avgRating = ProductFactory.getAvgRating(feedback.rows);
    })
    .catch($log.error)

});
