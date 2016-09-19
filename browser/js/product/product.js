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


app.controller('ProductController', function ($scope, $q, ProductFactory, CartFactory, $log, $stateParams) {

    ProductFactory.getAllFriends()
    .then(function(friends) {
        if (friends) {
            $scope.allFriends = friends;
            // returns an array of product feedback [{count: xx, rows: yy}]
            return $q.all($scope.allFriends.map(function(friend) {
                return ProductFactory.getFriendReviews(friend.id)
            }))
        }
    })
    .then(function(feedback) {
        for (var i = 0; i < feedback.length; i++) {
            // Attach number of reviews to each friend
            $scope.allFriends[i].numRevs = feedback[i].count;

           // Calculate average rating
            var friendRating = feedback[i].rows.map(function(row) {
                return row.rating;
            });

            var avgRating;

            if (friendRating.length) {
                var sum = friendRating.reduce(function(a, b) { return a + b});
                avgRating = Math.floor(sum / friendRating.length);
            }
            else { avgRating = 0 }

            $scope.allFriends[i].avgRating = avgRating;
        }
    })
    .catch($log.error);


    $scope.id = $stateParams.friendId;

    $scope.getStars = ProductFactory.getStars;


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