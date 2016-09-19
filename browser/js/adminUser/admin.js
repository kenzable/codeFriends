app.config(function ($stateProvider) {

    $stateProvider.state('admin', {
        url: '/admin',
        templateUrl: 'js/adminUser/admin.html',
        controller: 'AdminController',
        data: {
            authenticate: true
        }
    });

});

app.controller('AdminController', function ($scope, AdminUserFactory, $log, AdminFriendsFactory, AdminOrdersFactory) {
    
    AdminUserFactory.getAllUsers()
    .then(function (allUsers) {
        $scope.allUsers = allUsers;
    })
    .catch($log.error);

    $scope.deleteAUser = AdminUserFactory.deleteAUser;


    AdminFriendsFactory.getAllFriends()
    .then(function (allFriends) {
        $scope.allFriends = allFriends;
    })
    .catch($log.error);

    $scope.deleteAFriend = AdminFriendsFactory.deleteAFriend;


    AdminOrdersFactory.getAllOrders()
    .then(function (allOrders) {
        $scope.allOrders = allOrders;
    })
    .catch($log.error);


    $scope.deleteAnOrder = AdminOrdersFactory.deleteAnOrder;

});