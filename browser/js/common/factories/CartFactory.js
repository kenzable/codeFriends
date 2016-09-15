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
      return a + b.price;
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
      return $http.get('/api/cart')
      .then(function(response){
        if (typeof response.data === 'object') {
          cachedCartItems = cachedCartItems.concat(response.data);
          //update local storage to relect the cached values
          cachedCartTotal = calculateTotal(cachedCartItems)
          localStorage.setItem('cartItems', makeJSON(cachedCartItems));
          localStorage.setItem('cartTotal', cachedCartTotal);
        }
        return {items: cachedCartItems, total: cachedCartTotal};
      })
      .catch($log.error)
    },
    addFriendToCart: function(friendId){
      return $http.get('/api/friends/' + friendId)
      .then(function(response){
        var friend = response.data;
        cachedCartTotal += friend.price;
        cachedCartItems.push({friendId: friend.id, name: friend.name, price: friend.price, hours: friend.numHours});
        localStorage.setItem('cartTotal', cachedCartTotal);
        localStorage.setItem('cartItems', makeJSON(cachedCartItems));
        return {items: cachedCartItems, total: cachedCartTotal};
      })
      .catch($log.error);
    },
    saveCart: function(){
      return $http.post('/api/cart', {items: cachedCartItems})
      .then(function(response){
        console.log(response.data);
        return response.data;
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
      return {items: cachedCartItems, total: cachedCartTotal};
    },
    deleteItem: function(friendId){
      cachedCartItems = cachedCartItems.filter(function(item){
        return item.friendId !== friendId;
      });
      cachedCartTotal = calculateTotal(cachedCartItems);
      localStorage.setItem('cartTotal', cachedCartTotal);
      localStorage.setItem('cartItems', makeJSON(cachedCartItems));

      return {items: cachedCartItems, total: cachedCartTotal};
    },
    purchase: function(){
      return $http.post('/api/cart/purchase', {items: cachedCartItems})
      .then(function(response){
        clearCart();
        return response.data;
      })
      .catch($log.error);
    }
  }
});
