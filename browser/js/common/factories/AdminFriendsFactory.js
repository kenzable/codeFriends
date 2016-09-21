app.factory('AdminFriendsFactory', function($http, $log){

    var cachedFriends = [];

    function getItemIndex(id){
        return cachedFriends.findIndex(function(friend){
          return friend.id === id;
        });
    }

    return {


        getAllFriends: function() {
          return $http.get('/api/friends')
          .then(function(response) {
            angular.copy(response.data, cachedFriends);
            return cachedFriends;
          })
          .catch($log.error);
        },

        deleteAFriend: function(friendId) {
            return $http.delete('/api/friends/' + friendId)
            .then(function(response) {
                cachedFriends.splice(getItemIndex(friendId), 1);
                return response.data;
            })
            .catch($log.error);
    }

  };

});
