app.factory('AdminFriendsFactory', function($http, $log){

    var cachedFriends = [];

    function getItemIndex(id){
        return cachedFriends.findIndex(function(friend){
          return friend.id === id;
        });
    }

    return {

        getOneFriend: function(friendId){
          return $http.get('/api/friends/' + friendId)
          .then(function(response){
            return response.data;
          })
        },

        updateFriend: function(friendId, updates){
          return $http.put('/api/friends/' + friendId, updates)
          .then(function(response){
            return response.data;
          })
        },

        getAllFriends: function() {
          return $http.get('/api/friends')
          .then(function(response) {
            angular.copy(response.data, cachedFriends);
            return cachedFriends;
          })
        },

        deleteAFriend: function(friendId) {
            return $http.delete('/api/friends/' + friendId)
            .then(function(response) {
                cachedFriends.splice(getItemIndex(friendId), 1);
                return response.data;
            })
    }

  };

});
