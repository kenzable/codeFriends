app.config(function ($stateProvider) {

    $stateProvider.state('admin.users', {
        url: '/user-management',
        templateUrl: 'js/adminUser/adminUsers.html',
        controller: 'AdminController',
        // // The following data.authenticate is read by an event listener
        // // that controls access to this state. Refer to app.js.
        data: {
            authenticate: true
        }
    });

});
