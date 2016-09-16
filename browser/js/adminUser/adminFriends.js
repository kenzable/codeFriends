app.config(function ($stateProvider) {

    $stateProvider.state('admin.friends', {
        url: '/product-management',
        templateUrl: 'js/adminUser/adminFriends.html',
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


app.factory('AdminFriendsFactory', function($http, $log){

  return {

        deleteAFriend: function(friendId) {
            return $http.delete('/api/friends/' + friendId)
            .then(function(response) {
                return response.data;
            })
            .catch($log.error);
    }

  };

});