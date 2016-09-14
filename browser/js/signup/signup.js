app.config(function($stateProvider) {
	$stateProvider.state('signup', {
		url: '/signup',
		templateUrl: 'js/signup/signup.html',
		controller: 'SignUpCtrl'
	});
});

// NEED TO USE FORM VALIDATIONS FOR EMAIL, ADDRESS, ETC
app.controller('SignUpCtrl', function($scope, $state, $http, AuthService) {
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
		};
	}
});