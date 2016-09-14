app.config(function ($stateProvider) {
    $stateProvider.state('product', {
        url: '/product',
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