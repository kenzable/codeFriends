app.config(function ($stateProvider) {

    $stateProvider.state('signup', {
        url: '/signup',
        templateUrl: 'js/login/signup.html',
        controller: 'SingupCtrl'
    });

});

app.controller('SingupCtrl', function ($scope, AuthService, $state) {

    // $scope.signup = {};
    // $scope.error = null;

    // $scope.sendLogin = function (loginInfo) {

    //     $scope.error = null;

    //     AuthService.login(loginInfo).then(function () {
    //         $state.go('home');
    //     }).catch(function () {
    //         $scope.error = 'Invalid login credentials.';
    //     });

    // };

    
});