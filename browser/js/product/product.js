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


app.controller('ProductController', function($scope, $log, ProductFactory, $stateParams) {
    $scope.id = $stateParams.friendId;


    $scope.getStars = ProductFactory.getStars;


    ProductFactory.getFriend($scope.id)
    .then(function(friend) {
        $scope.friend = friend;
    })
    .catch($log.error);


    ProductFactory.getFriendReviews($scope.friendId)
    .then(function(feedback) {
        $scope.reviewRows = feedback.rows;
        $scope.friend.numRevs = feedback.count;
        $scope.friend.avgRating = ProductFactory.getAvgRating(feedback.rows);
    })
    .catch($log.error)
});

