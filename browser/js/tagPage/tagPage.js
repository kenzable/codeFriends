app.config(function ($stateProvider) {
    $stateProvider.state('tag', {
        url: '/tag/:tagName',
        templateUrl: 'js/tagPage/tagPage.html',
        controller: 'TagController'
    });
});

app.controller('TagController', function ($scope, ProductFactory, $log, $stateParams) {

	ProductFactory.getFriendByTag($stateParams.tagName)
	.then(function(friends){
		console.log('filtered friends!', friends)
		$scope.tagFriends = friends;
	})
	.catch($log.error);

	$scope.currentTag = $stateParams.tagName;
});
