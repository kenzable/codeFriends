app.config(function ($stateProvider) {
    $stateProvider.state('docs.description', {
        url: '/description',
        templateUrl: 'js/product/product-description.html'
    });
});


app.config(function ($stateProvider) {
    $stateProvider.state('docs.review', {
        url: '/review',
        templateUrl: 'js/product/product-review.html'
    });
});