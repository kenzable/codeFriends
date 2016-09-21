app.config(function ($stateProvider) {

    $stateProvider.state('admin.updateFriend', {
        url: '/product-management/:friendId',
        templateUrl: 'js/adminUser/updateFriend.html',
        controller: 'AdminFriend',
        // // The following data.authenticate is read by an event listener
        // // that controls access to this state. Refer to app.js.
        data: {
            authenticate: true
        }
    });
});

app.controller('AdminFriend', function ($scope, $stateParams, $state, $log, AdminFriendsFactory) {
    function trimObj(friendObj){
        var props = ['id', 'numRevs', 'ratings', 'createdAt', 'updatedAt'];
        props.forEach(function(prop){
            if (friendObj.hasOwnProperty(prop)) {
                delete friendObj[prop];
            }
        });
        return friendObj
    }

    $scope.id = $stateParams.friendId;

    AdminFriendsFactory.getOneFriend($scope.id)
    .then(function(foundFriend){
        $scope.friend = trimObj(foundFriend);
    })
    .catch($log.error);

    $scope.submitChanges = function(){
        var changes = $scope.friend;
        if (typeof changes.tags === 'string') changes.tags = changes.tags.split(',');
        changes.numHours = +changes.numHours;
        changes.price = +changes.price;

        AdminFriendsFactory.updateFriend($scope.id, changes)
        .then(function(){
            $state.reload();
        })
        .catch($log.error);
    }

});
