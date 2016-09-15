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


app.controller('ProductController', function ($scope, ProductFactory, $log) {
    ProductFactory.getAllFriends()
    .then(function(allFriends) {
        $scope.allFriends = allFriends;
    })
    .catch($log.error);

    $scope.getReviews = ProductFactory.getReviews;

});
