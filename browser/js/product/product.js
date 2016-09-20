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


app.controller('ProductController', function($state, $scope, $log, ProductFactory, $stateParams, CartFactory) {
    $scope.id = $stateParams.friendId;

    $scope.addToCart = CartFactory.addFriendToCart;
    $scope.getStars = ProductFactory.getStars;


    ProductFactory.getFriendReviews($scope.id)
    .then(function(reviews){
        $scope.reviews = reviews;
    })
    .catch($log.error);

    ProductFactory.getFriend($scope.id)
    .then(function(friend) {
        $scope.friend = friend;
    })
    .catch($log.error);

    $scope.getAvgRating = ProductFactory.getAvgRating;

    $scope.submitReview = function(formObj){
        formObj.friendId = +$scope.id;
        formObj.rating = +formObj.rating;
        ProductFactory.submitReview(formObj)
        .then(function(){
            $scope.$digest();
        })
        .catch($log.error);
    }
});

