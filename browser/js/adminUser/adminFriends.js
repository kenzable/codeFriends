app.config(function ($stateProvider) {

    $stateProvider.state('admin.friends', {
        url: '/product-management',
        templateUrl: 'js/adminUser/adminFriends.html',
        controller: 'AdminController',
        // // The following data.authenticate is read by an event listener
        // // that controls access to this state. Refer to app.js.
        data: {
            authenticate: true
        }
    });

});
