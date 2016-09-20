app.factory('ProfileFactory', function ($http, $log) {
	var obj = {};

	obj.updateProfile = function(profile, profileId) {
		return $http.put('/api/users/' + profileId, profile)
		.then(function (updated) {
			console.log(updated.data);
			return updated.data;
		})
		.catch($log.error)
	};

    obj.getOrderHistory = function (userId) {
        return $http.get('/api/orders/history/' + userId)
        .then(function (updated) {
            console.log('order history', updated.data);
            return updated.data;

        })
        .catch($log.error);
    };

	return obj;
});

