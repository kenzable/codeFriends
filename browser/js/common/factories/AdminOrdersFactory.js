app.factory('AdminOrdersFactory', function($http, $log){
    var cachedOrders = [];

    function getItemIndex(id){
        return cachedOrders.findIndex(function(order){
          return order.id === id;
        });
    }

    function update(newOrder) {
      cachedOrders.forEach(function(order, idx) {
        if (order.id === newOrder.id) {
          angular.copy(newOrder, cachedOrders[idx]);
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
        update(response.data);
        return response;
      })
      .catch($log.error);
    }

  };

});