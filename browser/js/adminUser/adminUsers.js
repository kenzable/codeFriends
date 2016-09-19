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

app.factory('AdminUserFactory', function($http, $log){
    var cachedUsers = [];

    function getItemIndex(id){
        return cachedUsers.findIndex(function(user){
          return user.id === id;
        });
    }

  return {

    getAllUsers: function() {
      return $http.get('/api/users')
      .then(function(response) {
        angular.copy(response.data, cachedUsers);
        return cachedUsers;
      })
      .catch($log.error);
    },

    deleteAUser: function(userId) {
        return $http.delete('/api/users/' + userId)
        .then(function(response) {
            cachedUsers.splice(getItemIndex(userId), 1);
            return response.data;
        })
        .catch($log.error);
    }
  };
});
