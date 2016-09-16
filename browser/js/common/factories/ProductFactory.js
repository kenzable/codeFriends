app.factory('ProductFactory', function($http, $log){

  return {

    getAllFriends: function() {
      return $http.get('/api/friends')
      .then(function(response) {
        return response.data;
      })
      .catch($log.error);
    },

    getFriend: function(friendId) {
      return $http.get('/api/friends/' + friendId)
      .then(function(response){
        return response.data;
      })
      .catch($log.error)
    }

  }; //end of return

});
