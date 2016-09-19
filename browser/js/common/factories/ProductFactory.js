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

    getStars: function(rating) {
        var starArr = [];
        for (var i = 0; i < rating; i++) {
            starArr.push(true)
        }
        for (var j = 0; j < 5 - rating; j++) {
            starArr.push(false);
        }
        return starArr;
    },

    getFriendReviews: function(friendId) {
      return $http.get('/api/friends/' + friendId + '/feedback')
      .then(function(response) {
        return response.data;
      })
      .catch($log.error);
    },

    getNumRevs: function(friendId) {
      return $http.get('/api/friends/' + friendId + '/feedback')
      .then(function(response) {
        return response.data.count;
      })
      .catch($log.error);
    },

    getAvgRating: function(friendId) {
      return $http.get('/api/friends/' + friendId + '/feedback')
      .then(function(response) {
        var friendRatings = response.data.rows.map(function(row) {
          return row.rating;
        })
        console.log('FRAHND RATINGS', friendRatings);
        var avgRating;

        if (friendRatings.length) {
          var sum = friendRatings.reduce(function(a, b) { return a + b});
          avgRating = Math.floor(sum / friendRatings.length);
        }
        else { avgRating = 0 }

        return avgRating
      })
      .catch($log.error);
    }

  }; //end of return

});









