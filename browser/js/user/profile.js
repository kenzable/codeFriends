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
        controller: 'ProfileController',
        templateUrl: 'js/user/profile_history.html',
    });
});

app.controller('ProfileController', function ($scope, ProfileFactory, AuthService) {
    
    AuthService.getLoggedInUser()
    .then(function (user) {
        $scope.user = user; 
        return user;
    })
    .then(function (theUser) {
        ProfileFactory.getOrderHistory(theUser.id)
        .then(function (orders) {
            $scope.orders = orders;
        });
    });

    $scope.updateProfile = ProfileFactory.updateProfile;

});
