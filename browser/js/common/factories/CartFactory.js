app.factory('CartFactory', function($http, $log){
  function getCartItems(){
    var currentItems = localStorage.getItem('cartItems');
    if (currentItems) return [].slice.call(JSON.parse(currentItems));
    else return [];
  }

  var cachedCartItems = getCartItems();

  function makeJSON(array){
  //convert the items array into a json string of an array-like object
    return JSON.stringify(Object.assign({length: array.length}, array));
  }

  function getItemIndex(itemId){
    return cachedCartItems.findIndex(function(item){
      return item.itemId === itemId;
    });
  }

  function clearCart(){
    cachedCartItems = [];
    localStorage.removeItem('cartItems');
  }

  return {
    getCartTotal: function() {
      if (cachedCartItems.length) {
        return cachedCartItems.reduce(function(a, b){
          return a + (b.price * b.qty);
        }, 0);
      }
      else return 0;
    },
    getSavedItems: function(){
      return $http.get('/api/userCart')
      .then(function(response){
        var cart = response.data;
        if (cart) {
          cachedCartItems = cachedCartItems.concat(cart.items);
          localStorage.setItem('cartItems', makeJSON(cachedCartItems)); 
        }
      })
      .catch($log.error)
    },
    addFriendToCart: function(friendId, qty){
      return $http.get('/api/friends/' + friendId)
      .then(function(response){
        var friend = response.data;
        cachedCartItems.push({itemId: (cachedCartItems.length + 1), friendId: friend.id, name: friend.name, price: friend.price,
          hours: friend.numHours, qty: +qty});
        localStorage.setItem('cartItems', makeJSON(cachedCartItems));
      })
      .catch($log.error);
    },
    saveCart: function(){
      return $http.post('/api/userCart', {items: cachedCartItems})
      .then(function(){
        clearCart();
      })
      .catch($log.error);
    },
    getItems: function(){
      return cachedCartItems;
    },
    clearCart: function(){
      clearCart();
    },
    deleteItem: function(itemId){
      cachedCartItems.splice(getItemIndex(itemId), 1);
      localStorage.setItem('cartItems', makeJSON(cachedCartItems));
    },
    purchase: function(){
      return $http.post('/api/orders/purchase', {items: cachedCartItems})
      .then(function(data){
        console.log(data);
        clearCart();
      })
      .catch($log.error);
    },
    updateQty: function(itemId, diff){
      var index = getItemIndex(itemId)
      var item = cachedCartItems[index];
      item.qty += diff;
      if (item.qty === 0) {
        cachedCartItems.splice(index, 1);
      }
      localStorage.setItem('cartItems', makeJSON(cachedCartItems));
    },
    getItemTotal(itemId){
      var item = cachedCartItems[getItemIndex(itemId)];
      return item.price * item.qty;
    }
  }
});
