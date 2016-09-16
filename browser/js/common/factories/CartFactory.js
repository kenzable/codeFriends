app.factory('CartFactory', function($http, $log){
  function getCartItems(){
    var currentItems = localStorage.getItem('cartItems');
    if (currentItems) return [].slice.call(JSON.parse(currentItems));
    else return [];
  }

  function getCartTotal(){
    var currentTotal = localStorage.getItem('cartTotal');
    if (currentTotal) return JSON.parse(currentTotal);
    else return 0;
  }

  var cachedCartItems = getCartItems();
  var cachedCartTotal = getCartTotal();

  function calculateTotal(itemsArray){
    return itemsArray.reduce(function(a, b){
      return a + (b.price * b.qty);
    }, 0);
  }

  function makeJSON(array){
  //convert the items array into a json string of an array-like object
    return JSON.stringify(Object.assign({length: array.length}, array));
  }

  function clearCart(){
    cachedCartItems = [];
    cachedCartTotal = 0;
    localStorage.removeItem('cartItems');
    localStorage.removeItem('cartTotal');
  }

  return {
    getUserCart: function(){
      return $http.get('/api/userCart')
      .then(function(response){
        if (typeof response.data === 'object') {
          cachedCartItems = cachedCartItems.concat(response.data);
          //update local storage to relect the cached values
          cachedCartTotal = calculateTotal(cachedCartItems)
          localStorage.setItem('cartItems', makeJSON(cachedCartItems));
          localStorage.setItem('cartTotal', cachedCartTotal);
        }
      })
      .catch($log.error)
    },
    addFriendToCart: function(friendId, qty){
      return $http.get('/api/friends/' + friendId)
      .then(function(response){
        var friend = response.data;
        cachedCartTotal += friend.price;
        cachedCartItems.push({cartId: (cachedCartItems.length + 1), friendId: friend.id, name: friend.name, price: friend.price, hours: friend.numHours, qty: +qty});
        localStorage.setItem('cartTotal', cachedCartTotal);
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
    getTotal: function(){
      return cachedCartTotal;
    },
    clearCart: function(){
      clearCart();
    },
    deleteItem: function(cartId){
      var index = cachedCartItems.findIndex(function(item){
        return item.cartId === cartId;
      });
      cachedCartItems.splice(index, 1);
      cachedCartTotal = calculateTotal(cachedCartItems);
      localStorage.setItem('cartTotal', cachedCartTotal);
      localStorage.setItem('cartItems', makeJSON(cachedCartItems));
    },
    purchase: function(){
      return $http.post('/api/cart/purchase', {items: cachedCartItems})
      .then(function(response){
        clearCart();
      })
      .catch($log.error);
    },
    updateQty: function(cartId, diff){
      var index = cachedCartItems.findIndex(function(item){
        return item.cartId === cartId;
      });
      cachedCartItems[index].qty += diff;
      cachedCartTotal = calculateTotal(cachedCartItems);
      localStorage.setItem('cartTotal', cachedCartTotal);
      localStorage.setItem('cartItems', makeJSON(cachedCartItems));
    }
  }
});
