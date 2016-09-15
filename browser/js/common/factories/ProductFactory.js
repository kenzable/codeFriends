app.factory('ProductFactory', function($http, $log){

  return {
    getFriend: function(friendId){
      return $http.get('/api/friends/' + friendId)
      .then(function(response){
        var friend = response.data;
        return friend
      })
      .catch($log.error)
    } // end of getFriend

  } //end of return

});
