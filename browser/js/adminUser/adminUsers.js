app.config(function ($stateProvider) {

    $stateProvider.state('admin', {
        url: '/admin',
        templateUrl: 'js/adminUser/admin.html',
        controller: 'AdminController'
        // controller: function ($scope) {

        // },
        // data: {
        //     authenticate: true
        // }
    });

});

app.config(function ($stateProvider) {

    $stateProvider.state('admin.users', {
        url: '/user-management',
        templateUrl: 'js/adminUser/adminUsers.html',
        controller: 'AdminController'
        // controller: function ($scope) {
        //     // SecretStash.getStash().then(function (stash) {
        //     //     $scope.stash = stash;
        //     // });
        // },
        // // The following data.authenticate is read by an event listener
        // // that controls access to this state. Refer to app.js.
        // data: {
        //     authenticate: true
        // }
    });

});

app.controller('AdminController', function ($scope, AdminUserFactory, $log, AdminFriendsFactory, ProductFactory) {
    
    AdminUserFactory.getAllUsers()
    .then(function (allUsers) {
        $scope.allUsers = allUsers;
    })
    .catch($log.error);

    $scope.deleteAUser = AdminUserFactory.deleteAUser;



    ProductFactory.getAllFriends()
    .then(function (allFriends) {
        $scope.allFriends = allFriends;
    })
    .catch($log.error);


    $scope.deleteAFriend = function(friendId){
        AdminFriendsFactory.deleteAFriend(friendId)
        .then(function (deleted) {
            return deleted;
        })
        .catch($log.error);
    }

});


app.factory('AdminUserFactory', function($http, $log){

  return {

    getAllUsers: function() {
      return $http.get('/api/users')
      .then(function(response) {
        return response.data;
      })
      .catch($log.error);
    },

    deleteAUser: function(userId) {
        return $http.delete('/api/users/' + userId)
        .then(function(response) {
            return response.data;
        })
        .catch($log.error);
    }

  };

});
