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
