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
    },

    // friendRating: function

    getNumReviews: function(friendId) {
      return $http.get('/api/friends/' + friendId + '/feedback')
      .then(function(response) {
        return response.data.count;
      })
      .catch($log.error)
    },

    // getRating: function(friendId) {

    // }


  }; //end of return

});
