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

    getAvgRating: function(feedbackRows) {
      var friendRating = feedbackRows.map(function(row) {
          return row.rating;
      });

      var avgRating;

      if (friendRating.length) {
          var sum = friendRating.reduce(function(a, b) { return a + b});
          avgRating = Math.floor(sum / friendRating.length);
      }
      else { avgRating = 0 }

      return avgRating;
    }

  }; //end of return

});









