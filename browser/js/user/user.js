app.config(function($stateProvider) {
	$stateProvider.state('profile', {
		url: '/profile',
		templateUrl: 'js/user/profile.html',
		controller: 'ProfileCtrl'
	});
});

// NEED TO USE FORM VALIDATIONS FOR EMAIL, ADDRESS, ETC
app.controller('', function($scope, $state, $http, AuthService) {
	// Get from ng-model in signup.html
	$scope.signUp = {};
	$scope.checkInfo = {};
	$scope.error = null;

	$scope.sendSignUp = function(signUpInfo) {
		$scope.error = null;

		if ($scope.signUp.password !== $scope.checkInfo.passwordConfirm) {
			$scope.error = 'Passwords do not match, please re-enter password.';
		}
		else {
			$http.post('/signup', signUpInfo)
			.then(function() {
				AuthService.login(signUpInfo)
				.then(function() {
					$state.go('home');
				});
			})
			.catch(function() {
				$scope.error = 'Invalid signup credentials.';
			})
		}
	}
});
