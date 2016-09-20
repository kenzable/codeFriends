app.filter('tagsFilter', function() {

  // In the return function, we must pass in a single parameter which will be the data we will work on.
  // We have the ability to support multiple other parameters that can be passed into the filter optionally
  return function(friendsArr, tagsList) {
    var output;

    if (!tagsList.length) return friendsArr;

    output = friendsArr.filter(function(friend){
    	var included = true;

    	tagsList.forEach(function(tag){
    		if (friend.tags.indexOf(tag) === -1) {
    			included = false;
    		}
    	});

   		return included
    });
    return output;
  }

});
