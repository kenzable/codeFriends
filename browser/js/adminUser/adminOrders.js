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

    function update(newOrder) {
      cachedOrders.forEach(function(order, idx) {
        console.log('hihi', order, idx);
        console.log('new order hihi', newOrder);
        if (order.id === newOrder.id) {
          console.log('hello???');
          angular.copy(newOrder, cachedOrders[idx]);
          console.log('inside of update', cachedOrders);
          return;
        }
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
    },

    updatedOrderStatus: function(orderId, selected) {
      return $http.put('/api/orders/' + orderId + "/" + selected)
      .then(function (response) {
        //console.log('updated', response);
        console.log('before updatedOrderStatus', cachedOrders);
        update(response.data);
        console.log('after updatedOrderStatus', cachedOrders);
        return response;
      })
      .catch($log.error);
    }

  };

});