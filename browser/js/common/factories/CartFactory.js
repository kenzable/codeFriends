app.factory('CartFactory', function($http, $log){
  return {
    getUserCart: function(){
      return $http.get('/api/cart')
      .then(function(response){
        return response.data;
      })
      .catch($log.error)
    },
    getFriend: function(friendId){
      return $http.get('/api/friends/' + friendId)
      .then(function(response){
        return response.data;
      })
      .catch($log.error);
    }
  }
});
