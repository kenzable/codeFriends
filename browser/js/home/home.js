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
    if (friends) $scope.allFriends = friends;
  })
  .catch($log.error)

  $scope.getAvgRating = ProductFactory.getAvgRating;

  $scope.tagList = []

  $scope.addTag = function(tag){
    $scope.tagList.push(tag.text);
  };

  $scope.removeTag = function(tag){
    var index = $scope.tagList.indexOf(tag.text);
    $scope.tagList.splice(index, 1);
  };

  $scope.id = $stateParams.friendId;

  $scope.getStars = ProductFactory.getStars;


  ProductFactory.getFriend($scope.id)
  .then(function(friend) {
      $scope.friend = friend;
  })
  .catch($log.error);

  $scope.loadItems = ProductFactory.getAllTags;

  ProductFactory.getAllTags()
  .then(function(tagArr) {
    $scope.allTags = tagArr;
  })
  .catch($log.error);

});


// for carousel
app.controller('CarouselCtrl', function ($scope) {

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
