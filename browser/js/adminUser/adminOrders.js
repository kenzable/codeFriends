app.config(function ($stateProvider) {

    $stateProvider.state('admin.orders', {
        url: '/order-management',
        templateUrl: 'js/adminUser/adminOrders.html',
        controller: 'AdminController',
        // // The following data.authenticate is read by an event listener
        // // that controls access to this state. Refer to app.js.
        data: {
            authenticate: true
        }
    });

});
