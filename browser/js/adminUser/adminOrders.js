app.config(function ($stateProvider) {

    $stateProvider.state('admin.orders', {
        url: '/order-management',
        templateUrl: 'js/adminUser/adminOrders.html',
        controller: 'AdminController',
        // // The following data.authenticate is read by an event listener
        // // that controls access to this state. Refer to app.js.
        data: {
            authenticate: true
        }
    });

});


app.factory('AdminOrdersFactory', function($http, $log){
    var cachedOrders = [];

    function getItemIndex(id){
        return cachedOrders.findIndex(function(order){
          return order.id === id;
        });
    }

  return {

    getAllOrders: function() {
      return $http.get('/api/orders')
      .then(function(response) {
        angular.copy(response.data, cachedOrders);
        return cachedOrders;
      })
      .catch($log.error);
    },

    deleteAnOrder: function(orderId) {
        return $http.delete('/api/orders/' + orderId)
        .then(function(response) {
            cachedOrders.splice(getItemIndex(orderId), 1);
            return response.data;
        })
        .catch($log.error);
    }

  };

});