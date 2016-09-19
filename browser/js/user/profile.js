app.config(function ($stateProvider) {
    $stateProvider.state('profile', {
        url: '/profile/:id',
        controller: 'ProfileController',
        templateUrl: 'js/user/profile.html'
      
    });
});

app.config(function ($stateProvider) {
    $stateProvider.state('profile.history', {
        url: '/history',
        // controller: 'ProfileController',
        templateUrl: 'js/user/profile_history.html'
    });
});

app.controller('ProfileController', function ($scope, ProfileFactory, AuthService) {

	$scope.updateProfile = ProfileFactory.updateProfile;

    AuthService.getLoggedInUser()
    .then(function (user) {

        $scope.user = user;
    });

    $scope.updateProfile = ProfileFactory.updateProfile;
	
});


app.factory('ProfileFactory', function ($http, $log) {
	var obj = {};
	// var cachedUser = [];

	obj.updateProfile = function(profile, profileId) {
		return $http.put('/api/users/' + profileId, profile)
		.then(function (updated) {
			console.log(updated.data);
			// angular.copy(cachedUser, updated.data);
			return updated.data;
		})
		.catch($log.error)
	}

	return obj;
});
