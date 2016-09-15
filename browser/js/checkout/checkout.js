app.config(function ($stateProvider) {
    $stateProvider.state('checkout', {
        url: '/checkout',
        controller: 'CartController',
        templateUrl: 'js/checkout/checkout.html'
    });
});

app.config(function ($stateProvider) {
    $stateProvider.state('complete', {
        url: '/complete',
        controller: 'CheckoutController',
        templateUrl: 'js/checkout/checkoutComplete.html'
    });
});

app.controller('CheckoutController', function ($scope) {
	$scope.total = 80; //test
});

