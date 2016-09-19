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

    ProductFactory.getAllFriends()
    .then(function(allFriends) {
        $scope.allFriends = allFriends;
    })
    .catch($log.error);

    $scope.id = $stateParams.friendId;

    $scope.getStars = ProductFactory.getStars;

    $scope.getNumRevs = ProductFactory.getNumRevs;
    $scope.getAvgRating = ProductFactory.getAvgRating;


    ProductFactory.getFriendReviews($scope.id)
    .then(function(reviews) {
        $scope.friendReviews = reviews.rows;
    })
    .catch($log.error)


    ProductFactory.getFriend($scope.id)
    .then(function(friend) {
        $scope.friend = friend;
    })
    .catch($log.error);

  $scope.addToCart = function(friendId, qty){
    CartFactory.addFriendToCart(friendId, qty)
    .then(function(){
        $scope.added = true;
    })
    .catch($log.error);
  }

});





