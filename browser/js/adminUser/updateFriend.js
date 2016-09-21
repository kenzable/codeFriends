app.config(function ($stateProvider) {

    $stateProvider.state('admin.updateFriend', {
        url: '/product-management/:friendId',
        templateUrl: 'js/adminUser/updateFriend.html',
        controller: 'AdminFriend',
        // // The following data.authenticate is read by an event listener
        // // that controls access to this state. Refer to app.js.
        data: {
            authenticate: true
        }
    });
});

app.controller('AdminController', function ($scope, $log, AdminFriendsFactory) {


});
