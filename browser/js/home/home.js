app.config(function ($stateProvider) {
    $stateProvider.state('home', {
        url: '/',
        templateUrl: 'js/home/home.html'
    });
});

// For product presentation on home page
app.controller('HomeController', function ($scope, $q, ProductFactory, CartFactory, $log, $stateParams) {

  ProductFactory.getAllFriends()
  .then(function(friends) {
    if (friends) {
      $scope.allFriends = friends;
      // returns an array of product feedback [{count: xx, rows: yy}]
      return $q.all($scope.allFriends.map(function(friend) {
        return ProductFactory.getFriendReviews(friend.id)
      }))
    }
  })
  .then(function(feedback) {
    for (var i = 0; i < feedback.length; i++) {
      // Attach number of reviews to each friend
      $scope.allFriends[i].numRevs = feedback[i].count;

      // Calculate average rating
      $scope.allFriends[i].avgRating = ProductFactory.getAvgRating(feedback[i].rows);
    }
  })
  .catch($log.error);


  $scope.id = $stateParams.friendId;

  $scope.getStars = ProductFactory.getStars;


  ProductFactory.getFriend($scope.id)
  .then(function(friend) {
      $scope.friend = friend;
  })
  .catch($log.error);


  $scope.addToCart = function(friendId, qty){
    CartFactory.addFriendToCart(friendId, qty)
    .then(function(){
        $scope.added = true;
    })
    .catch($log.error);
  };

  ProductFactory.getAllTags()
  .then(function(tagArr) {
    $scope.allTags = tagArr;
  })
  .catch($log.error);

});


// for carousel
app.controller('CarouselCtrl', function ($scope, $log) {

  $scope.tags = [
    { text: 'just' },
    { text: 'some' },
    { text: 'cool' },
    { text: 'tags' }
  ];

  $scope.myInterval = 5000;
  $scope.noWrapSlides = false;
  $scope.active = 0;
  var slides = $scope.slides = [];
  var currIndex = 0;

  $scope.addSlide = function() {
    slides.push({
      image: '//www.codermatch.me/assets/Coder-w-Buddy-5a83fd5702cf67f5e93704b6c5316203.svg',
      text: ['Nice image', 'Awesome photograph', 'That is so cool', 'I love that'][slides.length % 4],
      id: currIndex++
    });
  };

  for (var i = 0; i < 4; i++) {
    $scope.addSlide();
  }

});
