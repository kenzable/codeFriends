'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

window.app = angular.module('FullstackGeneratedApp', ['fsaPreBuilt', 'ui.router', 'ui.bootstrap', 'ngAnimate']);

app.config(function ($urlRouterProvider, $locationProvider) {
    // This turns off hashbang urls (/#about) and changes it to something normal (/about)
    $locationProvider.html5Mode(true);
    // If we go to a URL that ui-router doesn't have registered, go to the "/" url.
    $urlRouterProvider.otherwise('/');
    // Trigger page refresh when accessing an OAuth route
    $urlRouterProvider.when('/auth/:provider', function () {
        window.location.reload();
    });
});

// This app.run is for controlling access to specific states.
app.run(function ($rootScope, AuthService, $state) {

    // The given state requires an authenticated user.
    var destinationStateRequiresAuth = function destinationStateRequiresAuth(state) {
        return state.data && state.data.authenticate;
    };

    // $stateChangeStart is an event fired
    // whenever the process of changing a state begins.
    $rootScope.$on('$stateChangeStart', function (event, toState, toParams) {

        if (!destinationStateRequiresAuth(toState)) {
            // The destination state does not require authentication
            // Short circuit with return.
            return;
        }

        if (AuthService.isAuthenticated()) {
            // The user is authenticated.
            // Short circuit with return.
            return;
        }

        // Cancel navigating to new state.
        event.preventDefault();

        AuthService.getLoggedInUser().then(function (user) {
            // If a user is retrieved, then renavigate to the destination
            // (the second time, AuthService.isAuthenticated() will work)
            // otherwise, if no user is logged in, go to "login" state.
            if (user) {
                $state.go(toState.name, toParams);
            } else {
                $state.go('login');
            }
        });
    });
});

app.config(function ($stateProvider) {

    // Register our *about* state.
    $stateProvider.state('about', {
        url: '/about',
        controller: 'AboutController',
        templateUrl: 'js/about/about.html'
    });
});

app.controller('AboutController', function ($scope, FullstackPics) {

    // Images of beautiful Fullstack people.
    $scope.images = _.shuffle(FullstackPics);
});

app.config(function ($stateProvider) {
    $stateProvider.state('cart', {
        url: '/cart',
        controller: 'CartController',
        templateUrl: 'js/cart/cart.html'
    });
});

app.config(function ($stateProvider) {
    $stateProvider.state('cart.checkout', {
        url: '/checkout',
        controller: 'CartController',
        templateUrl: 'js/checkout/checkout.html'
    });
});

app.controller('CartController', function ($scope, CartFactory, $log, $rootScope) {
    $scope.items = CartFactory.getItems();
    $scope.total = CartFactory.getTotal();

    $rootScope.$on('auth-login-success', function () {
        CartFactory.getUserCart().then(function (cart) {
            $scope.items = cart.items;
            $scope.total = cart.total;
        }).catch($log.error);
    });

    $rootScope.$on('auth-logout-success', function () {
        $scope.items = CartFactory.getItems();
        $scope.total = CartFactory.getTotal();
    });

    $scope.getUserCart = function () {
        CartFactory.getUserCart().then(function (cart) {
            $scope.items = cart.items;
            $scope.total = cart.total;
        }).catch($log.error);
    };
    $scope.addToCart = function (friendId) {
        CartFactory.addFriendToCart(friendId).then(function (cart) {
            $scope.items = cart.items;
            $scope.total = cart.total;
        }).catch($log.error);
    };
    $scope.clearCart = function () {
        var cart = CartFactory.clearCart();
        $scope.items = cart.items;
        $scope.total = cart.total;
    };
    $scope.saveCart = CartFactory.saveCart;

    $scope.deleteItem = function (friendId) {
        var cart = CartFactory.deleteItem(friendId);
        $scope.items = cart.items;
        $scope.total = cart.total;
    };
    $scope.purchase = function () {
        CartFactory.purchase().then(function (order) {
            $scope.newOrder = order;
            $scope.items = CartFactory.getItems();
            $scope.total = CartFactory.getTotal();
        }).catch($log.error);
    };
});

app.config(function ($stateProvider) {
    $stateProvider.state('complete', {
        url: '/complete',
        controller: 'CheckoutController',
        templateUrl: 'js/checkout/checkoutComplete.html'
    });
});

app.controller('CheckoutController', function ($scope) {
    $scope.total = 80; //test
});

app.config(function ($stateProvider) {
    $stateProvider.state('docs', {
        url: '/docs',
        templateUrl: 'js/shoppingCart/shopping-cart.html'
    });
});

(function () {

    'use strict';

    // Hope you didn't forget Angular! Duh-doy.

    if (!window.angular) throw new Error('I can\'t find Angular!');

    var app = angular.module('fsaPreBuilt', []);

    app.factory('Socket', function () {
        if (!window.io) throw new Error('socket.io not found!');
        return window.io(window.location.origin);
    });

    // AUTH_EVENTS is used throughout our app to
    // broadcast and listen from and to the $rootScope
    // for important events about authentication flow.
    app.constant('AUTH_EVENTS', {
        loginSuccess: 'auth-login-success',
        loginFailed: 'auth-login-failed',
        logoutSuccess: 'auth-logout-success',
        sessionTimeout: 'auth-session-timeout',
        notAuthenticated: 'auth-not-authenticated',
        notAuthorized: 'auth-not-authorized'
    });

    app.factory('AuthInterceptor', function ($rootScope, $q, AUTH_EVENTS) {
        var statusDict = {
            401: AUTH_EVENTS.notAuthenticated,
            403: AUTH_EVENTS.notAuthorized,
            419: AUTH_EVENTS.sessionTimeout,
            440: AUTH_EVENTS.sessionTimeout
        };
        return {
            responseError: function responseError(response) {
                $rootScope.$broadcast(statusDict[response.status], response);
                return $q.reject(response);
            }
        };
    });

    app.config(function ($httpProvider) {
        $httpProvider.interceptors.push(['$injector', function ($injector) {
            return $injector.get('AuthInterceptor');
        }]);
    });

    app.service('AuthService', function ($http, Session, $rootScope, AUTH_EVENTS, $q) {

        function onSuccessfulLogin(response) {
            var user = response.data.user;
            Session.create(user);
            $rootScope.$broadcast(AUTH_EVENTS.loginSuccess);
            return user;
        }

        // Uses the session factory to see if an
        // authenticated user is currently registered.
        this.isAuthenticated = function () {
            return !!Session.user;
        };

        this.getLoggedInUser = function (fromServer) {

            // If an authenticated session exists, we
            // return the user attached to that session
            // with a promise. This ensures that we can
            // always interface with this method asynchronously.

            // Optionally, if true is given as the fromServer parameter,
            // then this cached value will not be used.

            if (this.isAuthenticated() && fromServer !== true) {
                return $q.when(Session.user);
            }

            // Make request GET /session.
            // If it returns a user, call onSuccessfulLogin with the response.
            // If it returns a 401 response, we catch it and instead resolve to null.
            return $http.get('/session').then(onSuccessfulLogin).catch(function () {
                return null;
            });
        };

        this.login = function (credentials) {
            return $http.post('/login', credentials).then(onSuccessfulLogin).catch(function () {
                return $q.reject({ message: 'Invalid login credentials.' });
            });
        };

        this.logout = function () {
            return $http.get('/logout').then(function () {
                Session.destroy();
                $rootScope.$broadcast(AUTH_EVENTS.logoutSuccess);
            });
        };
    });

    app.service('Session', function ($rootScope, AUTH_EVENTS) {

        var self = this;

        $rootScope.$on(AUTH_EVENTS.notAuthenticated, function () {
            self.destroy();
        });

        $rootScope.$on(AUTH_EVENTS.sessionTimeout, function () {
            self.destroy();
        });

        this.user = null;

        this.create = function (sessionId, user) {
            this.user = user;
        };

        this.destroy = function () {
            this.user = null;
        };
    });
})();

app.config(function ($stateProvider) {
    $stateProvider.state('home', {
        url: '/',
        templateUrl: 'js/home/home.html'
    });
});

app.controller('CarouselCtrl', function ($scope, $log, ProductFactory) {
    $scope.myInterval = 5000;
    $scope.noWrapSlides = false;
    $scope.active = 0;
    var slides = $scope.slides = [];
    var currIndex = 0;

    $scope.addSlide = function () {
        var newWidth = 600 + slides.length + 1;
        slides.push({
            // image: '//unsplash.it/' + newWidth + '/300',
            image: '//www.codermatch.me/assets/Coder-w-Buddy-5a83fd5702cf67f5e93704b6c5316203.svg',
            text: ['Nice image', 'Awesome photograph', 'That is so cool', 'I love that'][slides.length % 4],
            id: currIndex++
        });
    };

    $scope.randomize = function () {
        var indexes = generateIndexesArray();
        assignNewIndexesToSlides(indexes);
    };

    for (var i = 0; i < 4; i++) {
        $scope.addSlide();
    }

    // Randomize logic below

    function assignNewIndexesToSlides(indexes) {
        for (var i = 0, l = slides.length; i < l; i++) {
            slides[i].id = indexes.pop();
        }
    }

    function generateIndexesArray() {
        var indexes = [];
        for (var i = 0; i < currIndex; ++i) {
            indexes[i] = i;
        }
        return shuffle(indexes);
    }

    // http://stackoverflow.com/questions/962802#962890
    function shuffle(array) {
        var tmp,
            current,
            top = array.length;

        if (top) {
            while (--top) {
                current = Math.floor(Math.random() * (top + 1));
                tmp = array[current];
                array[current] = array[top];
                array[top] = tmp;
            }
        }

        return array;
    }
});
app.config(function ($stateProvider) {

    $stateProvider.state('login', {
        url: '/login',
        templateUrl: 'js/login/login.html',
        controller: 'LoginCtrl'
    });
});

app.controller('LoginCtrl', function ($scope, AuthService, $state) {

    $scope.login = {};
    $scope.error = null;

    $scope.sendLogin = function (loginInfo) {

        $scope.error = null;

        AuthService.login(loginInfo).then(function () {
            $state.go('home');
        }).catch(function () {
            $scope.error = 'Invalid login credentials.';
        });
    };
});

app.config(function ($stateProvider) {

    $stateProvider.state('membersOnly', {
        url: '/members-area',
        template: '<img ng-repeat="item in stash" width="300" ng-src="{{ item }}" />',
        controller: function controller($scope, SecretStash) {
            SecretStash.getStash().then(function (stash) {
                $scope.stash = stash;
            });
        },
        // The following data.authenticate is read by an event listener
        // that controls access to this state. Refer to app.js.
        data: {
            authenticate: true
        }
    });
});

app.factory('SecretStash', function ($http) {

    var getStash = function getStash() {
        return $http.get('/api/members/secret-stash').then(function (response) {
            return response.data;
        });
    };

    return {
        getStash: getStash
    };
});

app.config(function ($stateProvider) {
    $stateProvider.state('product', {
        url: '/product',
        controller: 'ProductController',
        templateUrl: 'js/product/product.html'
    });
});

app.config(function ($stateProvider) {
    $stateProvider.state('product.description', {
        url: '/description',
        templateUrl: 'js/product/product-description.html'
    });
});

app.config(function ($stateProvider) {
    $stateProvider.state('product.review', {
        url: '/review',
        templateUrl: 'js/product/product-review.html'
    });
});

app.controller('ProductController', function ($scope, ProductFactory, CartFactory, $log) {

    ProductFactory.getAllFriends().then(function (allFriends) {
        $scope.allFriends = allFriends;
    }).catch($log.error);

    $scope.getNumReviews = ProductFactory.getNumReviews;

    $scope.addToCart = function (friendId) {
        CartFactory.addFriendToCart(friendId).then(function (cart) {
            $scope.items = cart.items;
            $scope.total = cart.total;
        }).catch($log.error);
    };
});

app.config(function ($stateProvider) {
    $stateProvider.state('signup', {
        url: '/signup',
        templateUrl: 'js/signup/signup.html',
        controller: 'SignUpCtrl'
    });
});

// NEED TO USE FORM VALIDATIONS FOR EMAIL, ADDRESS, ETC
app.controller('SignUpCtrl', function ($scope, $state, $http, AuthService) {
    // Get from ng-model in signup.html
    $scope.signUp = {};
    $scope.checkInfo = {};
    $scope.error = null;

    $scope.sendSignUp = function (signUpInfo) {
        $scope.error = null;

        if ($scope.signUp.password !== $scope.checkInfo.passwordConfirm) {
            $scope.error = 'Passwords do not match, please re-enter password.';
        } else {
            $http.post('/signup', signUpInfo).then(function () {
                AuthService.login(signUpInfo).then(function () {
                    $state.go('home');
                });
            }).catch(function () {
                $scope.error = 'Invalid signup credentials.';
            });
        }
    };
});

app.factory('CartFactory', function ($http, $log) {
    function getCartItems() {
        var currentItems = localStorage.getItem('cartItems');
        if (currentItems) return [].slice.call(JSON.parse(currentItems));else return [];
    }

    function getCartTotal() {
        var currentTotal = localStorage.getItem('cartTotal');
        if (currentTotal) return JSON.parse(currentTotal);else return 0;
    }

    var cachedCartItems = getCartItems();
    var cachedCartTotal = getCartTotal();

    function calculateTotal(itemsArray) {
        return itemsArray.reduce(function (a, b) {
            return a + b.price;
        }, 0);
    }

    function makeJSON(array) {
        //convert the items array into a json string of an array-like object
        return JSON.stringify(Object.assign({ length: array.length }, array));
    }

    function _clearCart() {
        cachedCartItems = [];
        cachedCartTotal = 0;
        localStorage.removeItem('cartItems');
        localStorage.removeItem('cartTotal');
    }

    return {
        getUserCart: function getUserCart() {
            return $http.get('/api/cart').then(function (response) {
                if (_typeof(response.data) === 'object') {
                    cachedCartItems = cachedCartItems.concat(response.data);
                    //update local storage to relect the cached values
                    cachedCartTotal = calculateTotal(cachedCartItems);
                    localStorage.setItem('cartItems', makeJSON(cachedCartItems));
                    localStorage.setItem('cartTotal', cachedCartTotal);
                }
                return { items: cachedCartItems, total: cachedCartTotal };
            }).catch($log.error);
        },
        addFriendToCart: function addFriendToCart(friendId) {
            return $http.get('/api/friends/' + friendId).then(function (response) {
                var friend = response.data;
                cachedCartTotal += friend.price;
                cachedCartItems.push({ friendId: friend.id, name: friend.name, price: friend.price, hours: friend.numHours });
                localStorage.setItem('cartTotal', cachedCartTotal);
                localStorage.setItem('cartItems', makeJSON(cachedCartItems));
                return { items: cachedCartItems, total: cachedCartTotal };
            }).catch($log.error);
        },
        saveCart: function saveCart() {
            return $http.post('/api/cart', { items: cachedCartItems }).then(function () {
                _clearCart();
            }).catch($log.error);
        },
        getItems: function getItems() {
            return cachedCartItems;
        },
        getTotal: function getTotal() {
            return cachedCartTotal;
        },
        clearCart: function clearCart() {
            _clearCart();
            return { items: cachedCartItems, total: cachedCartTotal };
        },
        deleteItem: function deleteItem(friendId) {
            var index = cachedCartItems.findIndex(function (item) {
                return item.friendId === friendId;
            });
            cachedCartItems.splice(index, 1);
            cachedCartTotal = calculateTotal(cachedCartItems);
            localStorage.setItem('cartTotal', cachedCartTotal);
            localStorage.setItem('cartItems', makeJSON(cachedCartItems));

            return { items: cachedCartItems, total: cachedCartTotal };
        },
        purchase: function purchase() {
            return $http.post('/api/cart/purchase', { items: cachedCartItems }).then(function (response) {
                _clearCart();
                return response.data;
            }).catch($log.error);
        }
    };
});

app.factory('CheckoutFactory', function ($http, $log) {
    var checkoutFact = {};
    return checkoutFact;
});

app.factory('FullstackPics', function () {
    return ['https://pbs.twimg.com/media/B7gBXulCAAAXQcE.jpg:large', 'https://fbcdn-sphotos-c-a.akamaihd.net/hphotos-ak-xap1/t31.0-8/10862451_10205622990359241_8027168843312841137_o.jpg', 'https://pbs.twimg.com/media/B-LKUshIgAEy9SK.jpg', 'https://pbs.twimg.com/media/B79-X7oCMAAkw7y.jpg', 'https://pbs.twimg.com/media/B-Uj9COIIAIFAh0.jpg:large', 'https://pbs.twimg.com/media/B6yIyFiCEAAql12.jpg:large', 'https://pbs.twimg.com/media/CE-T75lWAAAmqqJ.jpg:large', 'https://pbs.twimg.com/media/CEvZAg-VAAAk932.jpg:large', 'https://pbs.twimg.com/media/CEgNMeOXIAIfDhK.jpg:large', 'https://pbs.twimg.com/media/CEQyIDNWgAAu60B.jpg:large', 'https://pbs.twimg.com/media/CCF3T5QW8AE2lGJ.jpg:large', 'https://pbs.twimg.com/media/CAeVw5SWoAAALsj.jpg:large', 'https://pbs.twimg.com/media/CAaJIP7UkAAlIGs.jpg:large', 'https://pbs.twimg.com/media/CAQOw9lWEAAY9Fl.jpg:large', 'https://pbs.twimg.com/media/B-OQbVrCMAANwIM.jpg:large', 'https://pbs.twimg.com/media/B9b_erwCYAAwRcJ.png:large', 'https://pbs.twimg.com/media/B5PTdvnCcAEAl4x.jpg:large', 'https://pbs.twimg.com/media/B4qwC0iCYAAlPGh.jpg:large', 'https://pbs.twimg.com/media/B2b33vRIUAA9o1D.jpg:large', 'https://pbs.twimg.com/media/BwpIwr1IUAAvO2_.jpg:large', 'https://pbs.twimg.com/media/BsSseANCYAEOhLw.jpg:large', 'https://pbs.twimg.com/media/CJ4vLfuUwAAda4L.jpg:large', 'https://pbs.twimg.com/media/CI7wzjEVEAAOPpS.jpg:large', 'https://pbs.twimg.com/media/CIdHvT2UsAAnnHV.jpg:large', 'https://pbs.twimg.com/media/CGCiP_YWYAAo75V.jpg:large', 'https://pbs.twimg.com/media/CIS4JPIWIAI37qu.jpg:large'];
});

app.factory('ProductFactory', function ($http, $log) {

    return {

        getAllFriends: function getAllFriends() {
            return $http.get('/api/friends').then(function (response) {
                return response.data;
            }).catch($log.error);
        },

        getFriend: function getFriend(friendId) {
            return $http.get('/api/friends/' + friendId).then(function (response) {
                return response.data;
            }).catch($log.error);
        },

        // friendRating: function

        getNumReviews: function getNumReviews(friendId) {
            return $http.get('/api/friends/' + friendId + '/feedback').then(function (response) {
                return response.data.count;
            }).catch($log.error);
        }

    }; //end of return
});

app.factory('RandomGreetings', function () {

    var getRandomFromArray = function getRandomFromArray(arr) {
        return arr[Math.floor(Math.random() * arr.length)];
    };

    var greetings = ['Hello, world!', 'At long last, I live!', 'Hello, simple human.', 'What a beautiful day!', 'I\'m like any other project, except that I am yours. :)', 'This empty string is for Lindsay Levine.', 'こんにちは、ユーザー様。', 'Welcome. To. WEBSITE.', ':D', 'Yes, I think we\'ve met before.', 'Gimme 3 mins... I just grabbed this really dope frittata', 'If Cooper could offer only one piece of advice, it would be to nevSQUIRREL!'];

    return {
        greetings: greetings,
        getRandomGreeting: function getRandomGreeting() {
            return getRandomFromArray(greetings);
        }
    };
});

app.directive('fullstackLogo', function () {
    return {
        restrict: 'E',
        templateUrl: 'js/common/directives/fullstack-logo/fullstack-logo.html'
    };
});

app.directive('navbar', function ($rootScope, AuthService, AUTH_EVENTS, $state, CartFactory, $log) {

    return {
        restrict: 'E',
        scope: {},
        templateUrl: 'js/common/directives/navbar/navbar.html',
        link: function link(scope) {

            scope.items = [{ label: 'Home', state: 'home' }, { label: 'About', state: 'about' }, { label: 'Documentation', state: 'docs' }, { label: 'Cart Testing State!', state: 'cart' }, { label: 'Members Only', state: 'membersOnly', auth: true }];

            scope.user = null;

            scope.isLoggedIn = function () {
                return AuthService.isAuthenticated();
            };

            scope.logout = function () {
                CartFactory.saveCart().then(function () {
                    return AuthService.logout();
                }).then(function () {
                    $state.go('home');
                }).catch($log.error);
            };

            var setUser = function setUser() {
                AuthService.getLoggedInUser().then(function (user) {
                    scope.user = user;
                });
            };

            var removeUser = function removeUser() {
                scope.user = null;
            };

            setUser();

            $rootScope.$on(AUTH_EVENTS.loginSuccess, setUser);
            $rootScope.$on(AUTH_EVENTS.logoutSuccess, removeUser);
            $rootScope.$on(AUTH_EVENTS.sessionTimeout, removeUser);
        }

    };
});

app.directive('randoGreeting', function (RandomGreetings) {

    return {
        restrict: 'E',
        templateUrl: 'js/common/directives/rando-greeting/rando-greeting.html',
        link: function link(scope) {
            scope.greeting = RandomGreetings.getRandomGreeting();
        }
    };
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyIsImFib3V0L2Fib3V0LmpzIiwiY2FydC9jYXJ0LmpzIiwiY2hlY2tvdXQvY2hlY2tvdXQuanMiLCJkb2NzL2RvY3MuanMiLCJmc2EvZnNhLXByZS1idWlsdC5qcyIsImhvbWUvaG9tZS5qcyIsImxvZ2luL2xvZ2luLmpzIiwibWVtYmVycy1vbmx5L21lbWJlcnMtb25seS5qcyIsInByb2R1Y3QvcHJvZHVjdC5qcyIsInNpZ251cC9zaWdudXAuanMiLCJjb21tb24vZmFjdG9yaWVzL0NhcnRGYWN0b3J5LmpzIiwiY29tbW9uL2ZhY3Rvcmllcy9DaGVja291dEZhY3RvcnkuanMiLCJjb21tb24vZmFjdG9yaWVzL0Z1bGxzdGFja1BpY3MuanMiLCJjb21tb24vZmFjdG9yaWVzL1Byb2R1Y3RGYWN0b3J5LmpzIiwiY29tbW9uL2ZhY3Rvcmllcy9SYW5kb21HcmVldGluZ3MuanMiLCJjb21tb24vZGlyZWN0aXZlcy9mdWxsc3RhY2stbG9nby9mdWxsc3RhY2stbG9nby5qcyIsImNvbW1vbi9kaXJlY3RpdmVzL25hdmJhci9uYXZiYXIuanMiLCJjb21tb24vZGlyZWN0aXZlcy9yYW5kby1ncmVldGluZy9yYW5kby1ncmVldGluZy5qcyJdLCJuYW1lcyI6WyJ3aW5kb3ciLCJhcHAiLCJhbmd1bGFyIiwibW9kdWxlIiwiY29uZmlnIiwiJHVybFJvdXRlclByb3ZpZGVyIiwiJGxvY2F0aW9uUHJvdmlkZXIiLCJodG1sNU1vZGUiLCJvdGhlcndpc2UiLCJ3aGVuIiwibG9jYXRpb24iLCJyZWxvYWQiLCJydW4iLCIkcm9vdFNjb3BlIiwiQXV0aFNlcnZpY2UiLCIkc3RhdGUiLCJkZXN0aW5hdGlvblN0YXRlUmVxdWlyZXNBdXRoIiwic3RhdGUiLCJkYXRhIiwiYXV0aGVudGljYXRlIiwiJG9uIiwiZXZlbnQiLCJ0b1N0YXRlIiwidG9QYXJhbXMiLCJpc0F1dGhlbnRpY2F0ZWQiLCJwcmV2ZW50RGVmYXVsdCIsImdldExvZ2dlZEluVXNlciIsInRoZW4iLCJ1c2VyIiwiZ28iLCJuYW1lIiwiJHN0YXRlUHJvdmlkZXIiLCJ1cmwiLCJjb250cm9sbGVyIiwidGVtcGxhdGVVcmwiLCIkc2NvcGUiLCJGdWxsc3RhY2tQaWNzIiwiaW1hZ2VzIiwiXyIsInNodWZmbGUiLCJDYXJ0RmFjdG9yeSIsIiRsb2ciLCJpdGVtcyIsImdldEl0ZW1zIiwidG90YWwiLCJnZXRUb3RhbCIsImdldFVzZXJDYXJ0IiwiY2FydCIsImNhdGNoIiwiZXJyb3IiLCJhZGRUb0NhcnQiLCJmcmllbmRJZCIsImFkZEZyaWVuZFRvQ2FydCIsImNsZWFyQ2FydCIsInNhdmVDYXJ0IiwiZGVsZXRlSXRlbSIsInB1cmNoYXNlIiwib3JkZXIiLCJuZXdPcmRlciIsIkVycm9yIiwiZmFjdG9yeSIsImlvIiwib3JpZ2luIiwiY29uc3RhbnQiLCJsb2dpblN1Y2Nlc3MiLCJsb2dpbkZhaWxlZCIsImxvZ291dFN1Y2Nlc3MiLCJzZXNzaW9uVGltZW91dCIsIm5vdEF1dGhlbnRpY2F0ZWQiLCJub3RBdXRob3JpemVkIiwiJHEiLCJBVVRIX0VWRU5UUyIsInN0YXR1c0RpY3QiLCJyZXNwb25zZUVycm9yIiwicmVzcG9uc2UiLCIkYnJvYWRjYXN0Iiwic3RhdHVzIiwicmVqZWN0IiwiJGh0dHBQcm92aWRlciIsImludGVyY2VwdG9ycyIsInB1c2giLCIkaW5qZWN0b3IiLCJnZXQiLCJzZXJ2aWNlIiwiJGh0dHAiLCJTZXNzaW9uIiwib25TdWNjZXNzZnVsTG9naW4iLCJjcmVhdGUiLCJmcm9tU2VydmVyIiwibG9naW4iLCJjcmVkZW50aWFscyIsInBvc3QiLCJtZXNzYWdlIiwibG9nb3V0IiwiZGVzdHJveSIsInNlbGYiLCJzZXNzaW9uSWQiLCJQcm9kdWN0RmFjdG9yeSIsIm15SW50ZXJ2YWwiLCJub1dyYXBTbGlkZXMiLCJhY3RpdmUiLCJzbGlkZXMiLCJjdXJySW5kZXgiLCJhZGRTbGlkZSIsIm5ld1dpZHRoIiwibGVuZ3RoIiwiaW1hZ2UiLCJ0ZXh0IiwiaWQiLCJyYW5kb21pemUiLCJpbmRleGVzIiwiZ2VuZXJhdGVJbmRleGVzQXJyYXkiLCJhc3NpZ25OZXdJbmRleGVzVG9TbGlkZXMiLCJpIiwibCIsInBvcCIsImFycmF5IiwidG1wIiwiY3VycmVudCIsInRvcCIsIk1hdGgiLCJmbG9vciIsInJhbmRvbSIsInNlbmRMb2dpbiIsImxvZ2luSW5mbyIsInRlbXBsYXRlIiwiU2VjcmV0U3Rhc2giLCJnZXRTdGFzaCIsInN0YXNoIiwiZ2V0QWxsRnJpZW5kcyIsImFsbEZyaWVuZHMiLCJnZXROdW1SZXZpZXdzIiwic2lnblVwIiwiY2hlY2tJbmZvIiwic2VuZFNpZ25VcCIsInNpZ25VcEluZm8iLCJwYXNzd29yZCIsInBhc3N3b3JkQ29uZmlybSIsImdldENhcnRJdGVtcyIsImN1cnJlbnRJdGVtcyIsImxvY2FsU3RvcmFnZSIsImdldEl0ZW0iLCJzbGljZSIsImNhbGwiLCJKU09OIiwicGFyc2UiLCJnZXRDYXJ0VG90YWwiLCJjdXJyZW50VG90YWwiLCJjYWNoZWRDYXJ0SXRlbXMiLCJjYWNoZWRDYXJ0VG90YWwiLCJjYWxjdWxhdGVUb3RhbCIsIml0ZW1zQXJyYXkiLCJyZWR1Y2UiLCJhIiwiYiIsInByaWNlIiwibWFrZUpTT04iLCJzdHJpbmdpZnkiLCJPYmplY3QiLCJhc3NpZ24iLCJyZW1vdmVJdGVtIiwiY29uY2F0Iiwic2V0SXRlbSIsImZyaWVuZCIsImhvdXJzIiwibnVtSG91cnMiLCJpbmRleCIsImZpbmRJbmRleCIsIml0ZW0iLCJzcGxpY2UiLCJjaGVja291dEZhY3QiLCJnZXRGcmllbmQiLCJjb3VudCIsImdldFJhbmRvbUZyb21BcnJheSIsImFyciIsImdyZWV0aW5ncyIsImdldFJhbmRvbUdyZWV0aW5nIiwiZGlyZWN0aXZlIiwicmVzdHJpY3QiLCJzY29wZSIsImxpbmsiLCJsYWJlbCIsImF1dGgiLCJpc0xvZ2dlZEluIiwic2V0VXNlciIsInJlbW92ZVVzZXIiLCJSYW5kb21HcmVldGluZ3MiLCJncmVldGluZyJdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7QUFDQUEsT0FBQUMsR0FBQSxH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R0EsYUFKQTs7QUFNQSxnQkFBQTZKLGFBQUEsU0FBQUEsVUFBQSxHQUFBO0FBQ0FOLHNCQUFBdkosSUFBQSxHQUFBLElBQUE7QUFDQSxhQUZBOztBQUlBNEo7O0FBRUEzSyx1QkFBQU8sR0FBQSxDQUFBbUQsWUFBQVAsWUFBQSxFQUFBd0gsT0FBQTtBQUNBM0ssdUJBQUFPLEdBQUEsQ0FBQW1ELFlBQUFMLGFBQUEsRUFBQXVILFVBQUE7QUFDQTVLLHVCQUFBTyxHQUFBLENBQUFtRCxZQUFBSixjQUFBLEVBQUFzSCxVQUFBO0FBRUE7O0FBL0NBLEtBQUE7QUFtREEsQ0FyREE7O0FDQUF4TCxJQUFBZ0wsU0FBQSxDQUFBLGVBQUEsRUFBQSxVQUFBUyxlQUFBLEVBQUE7O0FBRUEsV0FBQTtBQUNBUixrQkFBQSxHQURBO0FBRUFoSixxQkFBQSx5REFGQTtBQUdBa0osY0FBQSxjQUFBRCxLQUFBLEVBQUE7QUFDQUEsa0JBQUFRLFFBQUEsR0FBQUQsZ0JBQUFWLGlCQUFBLEVBQUE7QUFDQTtBQUxBLEtBQUE7QUFRQSxDQVZBIiwiZmlsZSI6Im1haW4uanMiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCc7XG53aW5kb3cuYXBwID0gYW5ndWxhci5tb2R1bGUoJ0Z1bGxzdGFja0dlbmVyYXRlZEFwcCcsIFsnZnNhUHJlQnVpbHQnLCAndWkucm91dGVyJywgJ3VpLmJvb3RzdHJhcCcsICduZ0FuaW1hdGUnXSk7XG5cbmFwcC5jb25maWcoZnVuY3Rpb24gKCR1cmxSb3V0ZXJQcm92aWRlciwgJGxvY2F0aW9uUHJvdmlkZXIpIHtcbiAgICAvLyBUaGlzIHR1cm5zIG9mZiBoYXNoYmFuZyB1cmxzICgvI2Fib3V0KSBhbmQgY2hhbmdlcyBpdCB0byBzb21ldGhpbmcgbm9ybWFsICgvYWJvdXQpXG4gICAgJGxvY2F0aW9uUHJvdmlkZXIuaHRtbDVNb2RlKHRydWUpO1xuICAgIC8vIElmIHdlIGdvIHRvIGEgVVJMIHRoYXQgdWktcm91dGVyIGRvZXNuJ3QgaGF2ZSByZWdpc3RlcmVkLCBnbyB0byB0aGUgXCIvXCIgdXJsLlxuICAgICR1cmxSb3V0ZXJQcm92aWRlci5vdGhlcndpc2UoJy8nKTtcbiAgICAvLyBUcmlnZ2VyIHBhZ2UgcmVmcmVzaCB3aGVuIGFjY2Vzc2luZyBhbiBPQXV0aCByb3V0ZVxuICAgICR1cmxSb3V0ZXJQcm92aWRlci53aGVuKCcvYXV0aC86cHJvdmlkZXInLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHdpbmRvdy5sb2NhdGlvbi5yZWxvYWQoKTtcbiAgICB9KTtcbn0pO1xuXG4vLyBUaGlzIGFwcC5ydW4gaXMgZm9yIGNvbnRyb2xsaW5nIGFjY2VzcyB0byBzcGVjaWZpYyBzdGF0ZXMuXG5hcHAucnVuKGZ1bmN0aW9uICgkcm9vdFNjb3BlLCBBdXRoU2VydmljZSwgJHN0YXRlKSB7XG5cbiAgICAvLyBUaGUgZ2l2ZW4gc3RhdGUgcmVxdWlyZXMgYW4gYXV0aGVudGljYXRlZCB1c2VyLlxuICAgIHZhciBkZXN0aW5hdGlvblN0YXRlUmVxdWlyZXNBdXRoID0gZnVuY3Rpb24gKHN0YXRlKSB7XG4gICAgICAgIHJldHVybiBzdGF0ZS5kYXRhICYmIHN0YXRlLmRhdGEuYXV0aGVudGljYXRlO1xuICAgIH07XG5cbiAgICAvLyAkc3RhdGVDaGFuZ2VTdGFydCBpcyBhbiBldmVudCBmaXJlZFxuICAgIC8vIHdoZW5ldmVyIHRoZSBwcm9jZXNzIG9mIGNoYW5naW5nIGEgc3RhdGUgYmVnaW5zLlxuICAgICRyb290U2NvcGUuJG9uKCckc3RhdGVDaGFuZ2VTdGFydCcsIGZ1bmN0aW9uIChldmVudCwgdG9TdGF0ZSwgdG9QYXJhbXMpIHtcblxuICAgICAgICBpZiAoIWRlc3RpbmF0aW9uU3RhdGVSZXF1aXJlc0F1dGgodG9TdGF0ZSkpIHtcbiAgICAgICAgICAgIC8vIFRoZSBkZXN0aW5hdGlvbiBzdGF0ZSBkb2VzIG5vdCByZXF1aXJlIGF1dGhlbnRpY2F0aW9uXG4gICAgICAgICAgICAvLyBTaG9ydCBjaXJjdWl0IHdpdGggcmV0dXJuLlxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKEF1dGhTZXJ2aWNlLmlzQXV0aGVudGljYXRlZCgpKSB7XG4gICAgICAgICAgICAvLyBUaGUgdXNlciBpcyBhdXRoZW50aWNhdGVkLlxuICAgICAgICAgICAgLy8gU2hvcnQgY2lyY3VpdCB3aXRoIHJldHVybi5cbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIENhbmNlbCBuYXZpZ2F0aW5nIHRvIG5ldyBzdGF0ZS5cbiAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcblxuICAgICAgICBBdXRoU2VydmljZS5nZXRMb2dnZWRJblVzZXIoKS50aGVuKGZ1bmN0aW9uICh1c2VyKSB7XG4gICAgICAgICAgICAvLyBJZiBhIHVzZXIgaXMgcmV0cmlldmVkLCB0aGVuIHJlbmF2aWdhdGUgdG8gdGhlIGRlc3RpbmF0aW9uXG4gICAgICAgICAgICAvLyAodGhlIHNlY29uZCB0aW1lLCBBdXRoU2VydmljZS5pc0F1dGhlbnRpY2F0ZWQoKSB3aWxsIHdvcmspXG4gICAgICAgICAgICAvLyBvdGhlcndpc2UsIGlmIG5vIHVzZXIgaXMgbG9nZ2VkIGluLCBnbyB0byBcImxvZ2luXCIgc3RhdGUuXG4gICAgICAgICAgICBpZiAodXNlcikge1xuICAgICAgICAgICAgICAgICRzdGF0ZS5nbyh0b1N0YXRlLm5hbWUsIHRvUGFyYW1zKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgJHN0YXRlLmdvKCdsb2dpbicpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgIH0pO1xuXG59KTtcbiIsImFwcC5jb25maWcoZnVuY3Rpb24gKCRzdGF0ZVByb3ZpZGVyKSB7XG5cbiAgICAvLyBSZWdpc3RlciBvdXIgKmFib3V0KiBzdGF0ZS5cbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnYWJvdXQnLCB7XG4gICAgICAgIHVybDogJy9hYm91dCcsXG4gICAgICAgIGNvbnRyb2xsZXI6ICdBYm91dENvbnRyb2xsZXInLFxuICAgICAgICB0ZW1wbGF0ZVVybDogJ2pzL2Fib3V0L2Fib3V0Lmh0bWwnXG4gICAgfSk7XG5cbn0pO1xuXG5hcHAuY29udHJvbGxlcignQWJvdXRDb250cm9sbGVyJywgZnVuY3Rpb24gKCRzY29wZSwgRnVsbHN0YWNrUGljcykge1xuXG4gICAgLy8gSW1hZ2VzIG9mIGJlYXV0aWZ1bCBGdWxsc3RhY2sgcGVvcGxlLlxuICAgICRzY29wZS5pbWFnZXMgPSBfLnNodWZmbGUoRnVsbHN0YWNrUGljcyk7XG5cbn0pO1xuIiwiYXBwLmNvbmZpZyhmdW5jdGlvbiAoJHN0YXRlUHJvdmlkZXIpIHtcbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnY2FydCcsIHtcbiAgICAgICAgdXJsOiAnL2NhcnQnLFxuICAgICAgICBjb250cm9sbGVyOiAnQ2FydENvbnRyb2xsZXInLFxuICAgICAgICB0ZW1wbGF0ZVVybDogJ2pzL2NhcnQvY2FydC5odG1sJ1xuICAgIH0pO1xufSk7XG5cblxuYXBwLmNvbmZpZyhmdW5jdGlvbiAoJHN0YXRlUHJvdmlkZXIpIHtcbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnY2FydC5jaGVja291dCcsIHtcbiAgICAgICAgdXJsOiAnL2NoZWNrb3V0JyxcbiAgICAgICAgY29udHJvbGxlcjogJ0NhcnRDb250cm9sbGVyJyxcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdqcy9jaGVja291dC9jaGVja291dC5odG1sJ1xuICAgIH0pO1xufSk7XG5cblxuYXBwLmNvbnRyb2xsZXIoJ0NhcnRDb250cm9sbGVyJywgZnVuY3Rpb24gKCRzY29wZSwgQ2FydEZhY3RvcnksICRsb2csICRyb290U2NvcGUpIHtcbiAgJHNjb3BlLml0ZW1zID0gQ2FydEZhY3RvcnkuZ2V0SXRlbXMoKTtcbiAgJHNjb3BlLnRvdGFsID0gQ2FydEZhY3RvcnkuZ2V0VG90YWwoKTtcblxuICAkcm9vdFNjb3BlLiRvbignYXV0aC1sb2dpbi1zdWNjZXNzJywgZnVuY3Rpb24oKXtcbiAgICBDYXJ0RmFjdG9yeS5nZXRVc2VyQ2FydCgpXG4gICAgLnRoZW4oZnVuY3Rpb24oY2FydCl7XG4gICAgICAkc2NvcGUuaXRlbXMgPSBjYXJ0Lml0ZW1zO1xuICAgICAgJHNjb3BlLnRvdGFsID0gY2FydC50b3RhbDtcbiAgICB9KVxuICAgIC5jYXRjaCgkbG9nLmVycm9yKTtcbiAgfSk7XG5cbiAgJHJvb3RTY29wZS4kb24oJ2F1dGgtbG9nb3V0LXN1Y2Nlc3MnLCBmdW5jdGlvbigpe1xuICAgICRzY29wZS5pdGVtcyA9IENhcnRGYWN0b3J5LmdldEl0ZW1zKCk7XG4gICAgJHNjb3BlLnRvdGFsID0gQ2FydEZhY3RvcnkuZ2V0VG90YWwoKTtcbiAgfSk7XG5cbiAgJHNjb3BlLmdldFVzZXJDYXJ0ID0gZnVuY3Rpb24oKXtcbiAgICBDYXJ0RmFjdG9yeS5nZXRVc2VyQ2FydCgpXG4gICAgLnRoZW4oZnVuY3Rpb24oY2FydCl7XG4gICAgICAkc2NvcGUuaXRlbXMgPSBjYXJ0Lml0ZW1zO1xuICAgICAgJHNjb3BlLnRvdGFsID0gY2FydC50b3RhbDtcbiAgICB9KVxuICAgIC5jYXRjaCgkbG9nLmVycm9yKVxuICB9XG4gICRzY29wZS5hZGRUb0NhcnQgPSBmdW5jdGlvbihmcmllbmRJZCl7XG4gICAgQ2FydEZhY3RvcnkuYWRkRnJpZW5kVG9DYXJ0KGZyaWVuZElkKVxuICAgIC50aGVuKGZ1bmN0aW9uKGNhcnQpe1xuICAgICAgJHNjb3BlLml0ZW1zID0gY2FydC5pdGVtcztcbiAgICAgICRzY29wZS50b3RhbCA9IGNhcnQudG90YWw7XG4gICAgfSlcbiAgICAuY2F0Y2goJGxvZy5lcnJvcik7XG4gIH1cbiAgJHNjb3BlLmNsZWFyQ2FydCA9IGZ1bmN0aW9uKCl7XG4gICAgdmFyIGNhcnQgPSBDYXJ0RmFjdG9yeS5jbGVhckNhcnQoKTtcbiAgICAgICRzY29wZS5pdGVtcyA9IGNhcnQuaXRlbXM7XG4gICAgICAkc2NvcGUudG90YWwgPSBjYXJ0LnRvdGFsO1xuICB9XG4gICRzY29wZS5zYXZlQ2FydCA9IENhcnRGYWN0b3J5LnNhdmVDYXJ0O1xuXG4gICAkc2NvcGUuZGVsZXRlSXRlbSA9IGZ1bmN0aW9uKGZyaWVuZElkKXtcbiAgICB2YXIgY2FydCA9IENhcnRGYWN0b3J5LmRlbGV0ZUl0ZW0oZnJpZW5kSWQpO1xuICAgICAgJHNjb3BlLml0ZW1zID0gY2FydC5pdGVtcztcbiAgICAgICRzY29wZS50b3RhbCA9IGNhcnQudG90YWw7XG4gIH1cbiAgJHNjb3BlLnB1cmNoYXNlID0gZnVuY3Rpb24oKXtcbiAgICBDYXJ0RmFjdG9yeS5wdXJjaGFzZSgpXG4gICAgLnRoZW4oZnVuY3Rpb24ob3JkZXIpe1xuICAgICAgJHNjb3BlLm5ld09yZGVyID0gb3JkZXI7XG4gICAgICAkc2NvcGUuaXRlbXMgPSBDYXJ0RmFjdG9yeS5nZXRJdGVtcygpO1xuICAgICAgJHNjb3BlLnRvdGFsID0gQ2FydEZhY3RvcnkuZ2V0VG90YWwoKTtcbiAgICB9KVxuICAgIC5jYXRjaCgkbG9nLmVycm9yKTtcbiAgfTtcbn0pO1xuIiwiYXBwLmNvbmZpZyhmdW5jdGlvbiAoJHN0YXRlUHJvdmlkZXIpIHtcbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnY29tcGxldGUnLCB7XG4gICAgICAgIHVybDogJy9jb21wbGV0ZScsXG4gICAgICAgIGNvbnRyb2xsZXI6ICdDaGVja291dENvbnRyb2xsZXInLFxuICAgICAgICB0ZW1wbGF0ZVVybDogJ2pzL2NoZWNrb3V0L2NoZWNrb3V0Q29tcGxldGUuaHRtbCdcbiAgICB9KTtcbn0pO1xuXG5hcHAuY29udHJvbGxlcignQ2hlY2tvdXRDb250cm9sbGVyJywgZnVuY3Rpb24gKCRzY29wZSkge1xuXHQkc2NvcGUudG90YWwgPSA4MDsgLy90ZXN0XG59KTtcblxuIiwiYXBwLmNvbmZpZyhmdW5jdGlvbiAoJHN0YXRlUHJvdmlkZXIpIHtcbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnZG9jcycsIHtcbiAgICAgICAgdXJsOiAnL2RvY3MnLFxuICAgICAgICB0ZW1wbGF0ZVVybDogJ2pzL3Nob3BwaW5nQ2FydC9zaG9wcGluZy1jYXJ0Lmh0bWwnXG4gICAgfSk7XG59KTtcbiIsIihmdW5jdGlvbiAoKSB7XG5cbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICAvLyBIb3BlIHlvdSBkaWRuJ3QgZm9yZ2V0IEFuZ3VsYXIhIER1aC1kb3kuXG4gICAgaWYgKCF3aW5kb3cuYW5ndWxhcikgdGhyb3cgbmV3IEVycm9yKCdJIGNhblxcJ3QgZmluZCBBbmd1bGFyIScpO1xuXG4gICAgdmFyIGFwcCA9IGFuZ3VsYXIubW9kdWxlKCdmc2FQcmVCdWlsdCcsIFtdKTtcblxuICAgIGFwcC5mYWN0b3J5KCdTb2NrZXQnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmICghd2luZG93LmlvKSB0aHJvdyBuZXcgRXJyb3IoJ3NvY2tldC5pbyBub3QgZm91bmQhJyk7XG4gICAgICAgIHJldHVybiB3aW5kb3cuaW8od2luZG93LmxvY2F0aW9uLm9yaWdpbik7XG4gICAgfSk7XG5cbiAgICAvLyBBVVRIX0VWRU5UUyBpcyB1c2VkIHRocm91Z2hvdXQgb3VyIGFwcCB0b1xuICAgIC8vIGJyb2FkY2FzdCBhbmQgbGlzdGVuIGZyb20gYW5kIHRvIHRoZSAkcm9vdFNjb3BlXG4gICAgLy8gZm9yIGltcG9ydGFudCBldmVudHMgYWJvdXQgYXV0aGVudGljYXRpb24gZmxvdy5cbiAgICBhcHAuY29uc3RhbnQoJ0FVVEhfRVZFTlRTJywge1xuICAgICAgICBsb2dpblN1Y2Nlc3M6ICdhdXRoLWxvZ2luLXN1Y2Nlc3MnLFxuICAgICAgICBsb2dpbkZhaWxlZDogJ2F1dGgtbG9naW4tZmFpbGVkJyxcbiAgICAgICAgbG9nb3V0U3VjY2VzczogJ2F1dGgtbG9nb3V0LXN1Y2Nlc3MnLFxuICAgICAgICBzZXNzaW9uVGltZW91dDogJ2F1dGgtc2Vzc2lvbi10aW1lb3V0JyxcbiAgICAgICAgbm90QXV0aGVudGljYXRlZDogJ2F1dGgtbm90LWF1dGhlbnRpY2F0ZWQnLFxuICAgICAgICBub3RBdXRob3JpemVkOiAnYXV0aC1ub3QtYXV0aG9yaXplZCdcbiAgICB9KTtcblxuICAgIGFwcC5mYWN0b3J5KCdBdXRoSW50ZXJjZXB0b3InLCBmdW5jdGlvbiAoJHJvb3RTY29wZSwgJHEsIEFVVEhfRVZFTlRTKSB7XG4gICAgICAgIHZhciBzdGF0dXNEaWN0ID0ge1xuICAgICAgICAgICAgNDAxOiBBVVRIX0VWRU5UUy5ub3RBdXRoZW50aWNhdGVkLFxuICAgICAgICAgICAgNDAzOiBBVVRIX0VWRU5UUy5ub3RBdXRob3JpemVkLFxuICAgICAgICAgICAgNDE5OiBBVVRIX0VWRU5UUy5zZXNzaW9uVGltZW91dCxcbiAgICAgICAgICAgIDQ0MDogQVVUSF9FVkVOVFMuc2Vzc2lvblRpbWVvdXRcbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHJlc3BvbnNlRXJyb3I6IGZ1bmN0aW9uIChyZXNwb25zZSkge1xuICAgICAgICAgICAgICAgICRyb290U2NvcGUuJGJyb2FkY2FzdChzdGF0dXNEaWN0W3Jlc3BvbnNlLnN0YXR1c10sIHJlc3BvbnNlKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gJHEucmVqZWN0KHJlc3BvbnNlKVxuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH0pO1xuXG4gICAgYXBwLmNvbmZpZyhmdW5jdGlvbiAoJGh0dHBQcm92aWRlcikge1xuICAgICAgICAkaHR0cFByb3ZpZGVyLmludGVyY2VwdG9ycy5wdXNoKFtcbiAgICAgICAgICAgICckaW5qZWN0b3InLFxuICAgICAgICAgICAgZnVuY3Rpb24gKCRpbmplY3Rvcikge1xuICAgICAgICAgICAgICAgIHJldHVybiAkaW5qZWN0b3IuZ2V0KCdBdXRoSW50ZXJjZXB0b3InKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgXSk7XG4gICAgfSk7XG5cbiAgICBhcHAuc2VydmljZSgnQXV0aFNlcnZpY2UnLCBmdW5jdGlvbiAoJGh0dHAsIFNlc3Npb24sICRyb290U2NvcGUsIEFVVEhfRVZFTlRTLCAkcSkge1xuXG4gICAgICAgIGZ1bmN0aW9uIG9uU3VjY2Vzc2Z1bExvZ2luKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICB2YXIgdXNlciA9IHJlc3BvbnNlLmRhdGEudXNlcjtcbiAgICAgICAgICAgIFNlc3Npb24uY3JlYXRlKHVzZXIpO1xuICAgICAgICAgICAgJHJvb3RTY29wZS4kYnJvYWRjYXN0KEFVVEhfRVZFTlRTLmxvZ2luU3VjY2Vzcyk7XG4gICAgICAgICAgICByZXR1cm4gdXNlcjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFVzZXMgdGhlIHNlc3Npb24gZmFjdG9yeSB0byBzZWUgaWYgYW5cbiAgICAgICAgLy8gYXV0aGVudGljYXRlZCB1c2VyIGlzIGN1cnJlbnRseSByZWdpc3RlcmVkLlxuICAgICAgICB0aGlzLmlzQXV0aGVudGljYXRlZCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiAhIVNlc3Npb24udXNlcjtcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLmdldExvZ2dlZEluVXNlciA9IGZ1bmN0aW9uIChmcm9tU2VydmVyKSB7XG5cbiAgICAgICAgICAgIC8vIElmIGFuIGF1dGhlbnRpY2F0ZWQgc2Vzc2lvbiBleGlzdHMsIHdlXG4gICAgICAgICAgICAvLyByZXR1cm4gdGhlIHVzZXIgYXR0YWNoZWQgdG8gdGhhdCBzZXNzaW9uXG4gICAgICAgICAgICAvLyB3aXRoIGEgcHJvbWlzZS4gVGhpcyBlbnN1cmVzIHRoYXQgd2UgY2FuXG4gICAgICAgICAgICAvLyBhbHdheXMgaW50ZXJmYWNlIHdpdGggdGhpcyBtZXRob2QgYXN5bmNocm9ub3VzbHkuXG5cbiAgICAgICAgICAgIC8vIE9wdGlvbmFsbHksIGlmIHRydWUgaXMgZ2l2ZW4gYXMgdGhlIGZyb21TZXJ2ZXIgcGFyYW1ldGVyLFxuICAgICAgICAgICAgLy8gdGhlbiB0aGlzIGNhY2hlZCB2YWx1ZSB3aWxsIG5vdCBiZSB1c2VkLlxuXG4gICAgICAgICAgICBpZiAodGhpcy5pc0F1dGhlbnRpY2F0ZWQoKSAmJiBmcm9tU2VydmVyICE9PSB0cnVlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICRxLndoZW4oU2Vzc2lvbi51c2VyKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gTWFrZSByZXF1ZXN0IEdFVCAvc2Vzc2lvbi5cbiAgICAgICAgICAgIC8vIElmIGl0IHJldHVybnMgYSB1c2VyLCBjYWxsIG9uU3VjY2Vzc2Z1bExvZ2luIHdpdGggdGhlIHJlc3BvbnNlLlxuICAgICAgICAgICAgLy8gSWYgaXQgcmV0dXJucyBhIDQwMSByZXNwb25zZSwgd2UgY2F0Y2ggaXQgYW5kIGluc3RlYWQgcmVzb2x2ZSB0byBudWxsLlxuICAgICAgICAgICAgcmV0dXJuICRodHRwLmdldCgnL3Nlc3Npb24nKS50aGVuKG9uU3VjY2Vzc2Z1bExvZ2luKS5jYXRjaChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMubG9naW4gPSBmdW5jdGlvbiAoY3JlZGVudGlhbHMpIHtcbiAgICAgICAgICAgIHJldHVybiAkaHR0cC5wb3N0KCcvbG9naW4nLCBjcmVkZW50aWFscylcbiAgICAgICAgICAgICAgICAudGhlbihvblN1Y2Nlc3NmdWxMb2dpbilcbiAgICAgICAgICAgICAgICAuY2F0Y2goZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gJHEucmVqZWN0KHsgbWVzc2FnZTogJ0ludmFsaWQgbG9naW4gY3JlZGVudGlhbHMuJyB9KTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLmxvZ291dCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiAkaHR0cC5nZXQoJy9sb2dvdXQnKS50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBTZXNzaW9uLmRlc3Ryb3koKTtcbiAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLiRicm9hZGNhc3QoQVVUSF9FVkVOVFMubG9nb3V0U3VjY2Vzcyk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfTtcblxuICAgIH0pO1xuXG4gICAgYXBwLnNlcnZpY2UoJ1Nlc3Npb24nLCBmdW5jdGlvbiAoJHJvb3RTY29wZSwgQVVUSF9FVkVOVFMpIHtcblxuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICAgICAgJHJvb3RTY29wZS4kb24oQVVUSF9FVkVOVFMubm90QXV0aGVudGljYXRlZCwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgc2VsZi5kZXN0cm95KCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgICRyb290U2NvcGUuJG9uKEFVVEhfRVZFTlRTLnNlc3Npb25UaW1lb3V0LCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBzZWxmLmRlc3Ryb3koKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgdGhpcy51c2VyID0gbnVsbDtcblxuICAgICAgICB0aGlzLmNyZWF0ZSA9IGZ1bmN0aW9uIChzZXNzaW9uSWQsIHVzZXIpIHtcbiAgICAgICAgICAgIHRoaXMudXNlciA9IHVzZXI7XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5kZXN0cm95ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdGhpcy51c2VyID0gbnVsbDtcbiAgICAgICAgfTtcblxuICAgIH0pO1xuXG59KCkpO1xuIiwiYXBwLmNvbmZpZyhmdW5jdGlvbiAoJHN0YXRlUHJvdmlkZXIpIHtcbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnaG9tZScsIHtcbiAgICAgICAgdXJsOiAnLycsXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnanMvaG9tZS9ob21lLmh0bWwnXG4gICAgfSk7XG59KTtcblxuYXBwLmNvbnRyb2xsZXIoJ0Nhcm91c2VsQ3RybCcsIGZ1bmN0aW9uICgkc2NvcGUsICRsb2csIFByb2R1Y3RGYWN0b3J5KSB7XG4gICRzY29wZS5teUludGVydmFsID0gNTAwMDtcbiAgJHNjb3BlLm5vV3JhcFNsaWRlcyA9IGZhbHNlO1xuICAkc2NvcGUuYWN0aXZlID0gMDtcbiAgdmFyIHNsaWRlcyA9ICRzY29wZS5zbGlkZXMgPSBbXTtcbiAgdmFyIGN1cnJJbmRleCA9IDA7XG5cbiAgJHNjb3BlLmFkZFNsaWRlID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIG5ld1dpZHRoID0gNjAwICsgc2xpZGVzLmxlbmd0aCArIDE7XG4gICAgc2xpZGVzLnB1c2goe1xuICAgICAgLy8gaW1hZ2U6ICcvL3Vuc3BsYXNoLml0LycgKyBuZXdXaWR0aCArICcvMzAwJyxcbiAgICAgIGltYWdlOiAnLy93d3cuY29kZXJtYXRjaC5tZS9hc3NldHMvQ29kZXItdy1CdWRkeS01YTgzZmQ1NzAyY2Y2N2Y1ZTkzNzA0YjZjNTMxNjIwMy5zdmcnLFxuICAgICAgdGV4dDogWydOaWNlIGltYWdlJywnQXdlc29tZSBwaG90b2dyYXBoJywnVGhhdCBpcyBzbyBjb29sJywnSSBsb3ZlIHRoYXQnXVtzbGlkZXMubGVuZ3RoICUgNF0sXG4gICAgICBpZDogY3VyckluZGV4KytcbiAgICB9KTtcbiAgfTtcblxuICAkc2NvcGUucmFuZG9taXplID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGluZGV4ZXMgPSBnZW5lcmF0ZUluZGV4ZXNBcnJheSgpO1xuICAgIGFzc2lnbk5ld0luZGV4ZXNUb1NsaWRlcyhpbmRleGVzKTtcbiAgfTtcblxuICBmb3IgKHZhciBpID0gMDsgaSA8IDQ7IGkrKykge1xuICAgICRzY29wZS5hZGRTbGlkZSgpO1xuICB9XG5cbiAgLy8gUmFuZG9taXplIGxvZ2ljIGJlbG93XG5cbiAgZnVuY3Rpb24gYXNzaWduTmV3SW5kZXhlc1RvU2xpZGVzKGluZGV4ZXMpIHtcbiAgICBmb3IgKHZhciBpID0gMCwgbCA9IHNsaWRlcy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgIHNsaWRlc1tpXS5pZCA9IGluZGV4ZXMucG9wKCk7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gZ2VuZXJhdGVJbmRleGVzQXJyYXkoKSB7XG4gICAgdmFyIGluZGV4ZXMgPSBbXTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGN1cnJJbmRleDsgKytpKSB7XG4gICAgICBpbmRleGVzW2ldID0gaTtcbiAgICB9XG4gICAgcmV0dXJuIHNodWZmbGUoaW5kZXhlcyk7XG4gIH1cblxuICAvLyBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vcXVlc3Rpb25zLzk2MjgwMiM5NjI4OTBcbiAgZnVuY3Rpb24gc2h1ZmZsZShhcnJheSkge1xuICAgIHZhciB0bXAsIGN1cnJlbnQsIHRvcCA9IGFycmF5Lmxlbmd0aDtcblxuICAgIGlmICh0b3ApIHtcbiAgICAgIHdoaWxlICgtLXRvcCkge1xuICAgICAgICBjdXJyZW50ID0gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogKHRvcCArIDEpKTtcbiAgICAgICAgdG1wID0gYXJyYXlbY3VycmVudF07XG4gICAgICAgIGFycmF5W2N1cnJlbnRdID0gYXJyYXlbdG9wXTtcbiAgICAgICAgYXJyYXlbdG9wXSA9IHRtcDtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gYXJyYXk7XG4gIH1cbn0pOyIsImFwcC5jb25maWcoZnVuY3Rpb24gKCRzdGF0ZVByb3ZpZGVyKSB7XG5cbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnbG9naW4nLCB7XG4gICAgICAgIHVybDogJy9sb2dpbicsXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnanMvbG9naW4vbG9naW4uaHRtbCcsXG4gICAgICAgIGNvbnRyb2xsZXI6ICdMb2dpbkN0cmwnXG4gICAgfSk7XG5cbn0pO1xuXG5hcHAuY29udHJvbGxlcignTG9naW5DdHJsJywgZnVuY3Rpb24gKCRzY29wZSwgQXV0aFNlcnZpY2UsICRzdGF0ZSkge1xuXG4gICAgJHNjb3BlLmxvZ2luID0ge307XG4gICAgJHNjb3BlLmVycm9yID0gbnVsbDtcblxuICAgICRzY29wZS5zZW5kTG9naW4gPSBmdW5jdGlvbiAobG9naW5JbmZvKSB7XG5cbiAgICAgICAgJHNjb3BlLmVycm9yID0gbnVsbDtcblxuICAgICAgICBBdXRoU2VydmljZS5sb2dpbihsb2dpbkluZm8pXG4gICAgICAgIC50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICRzdGF0ZS5nbygnaG9tZScpO1xuICAgICAgICB9KVxuICAgICAgICAuY2F0Y2goZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgJHNjb3BlLmVycm9yID0gJ0ludmFsaWQgbG9naW4gY3JlZGVudGlhbHMuJztcbiAgICAgICAgfSk7XG5cbiAgICB9O1xuXG59KTtcbiIsImFwcC5jb25maWcoZnVuY3Rpb24gKCRzdGF0ZVByb3ZpZGVyKSB7XG5cbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnbWVtYmVyc09ubHknLCB7XG4gICAgICAgIHVybDogJy9tZW1iZXJzLWFyZWEnLFxuICAgICAgICB0ZW1wbGF0ZTogJzxpbWcgbmctcmVwZWF0PVwiaXRlbSBpbiBzdGFzaFwiIHdpZHRoPVwiMzAwXCIgbmctc3JjPVwie3sgaXRlbSB9fVwiIC8+JyxcbiAgICAgICAgY29udHJvbGxlcjogZnVuY3Rpb24gKCRzY29wZSwgU2VjcmV0U3Rhc2gpIHtcbiAgICAgICAgICAgIFNlY3JldFN0YXNoLmdldFN0YXNoKCkudGhlbihmdW5jdGlvbiAoc3Rhc2gpIHtcbiAgICAgICAgICAgICAgICAkc2NvcGUuc3Rhc2ggPSBzdGFzaDtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuICAgICAgICAvLyBUaGUgZm9sbG93aW5nIGRhdGEuYXV0aGVudGljYXRlIGlzIHJlYWQgYnkgYW4gZXZlbnQgbGlzdGVuZXJcbiAgICAgICAgLy8gdGhhdCBjb250cm9scyBhY2Nlc3MgdG8gdGhpcyBzdGF0ZS4gUmVmZXIgdG8gYXBwLmpzLlxuICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgICBhdXRoZW50aWNhdGU6IHRydWVcbiAgICAgICAgfVxuICAgIH0pO1xuXG59KTtcblxuYXBwLmZhY3RvcnkoJ1NlY3JldFN0YXNoJywgZnVuY3Rpb24gKCRodHRwKSB7XG5cbiAgICB2YXIgZ2V0U3Rhc2ggPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiAkaHR0cC5nZXQoJy9hcGkvbWVtYmVycy9zZWNyZXQtc3Rhc2gnKS50aGVuKGZ1bmN0aW9uIChyZXNwb25zZSkge1xuICAgICAgICAgICAgcmV0dXJuIHJlc3BvbnNlLmRhdGE7XG4gICAgICAgIH0pO1xuICAgIH07XG5cbiAgICByZXR1cm4ge1xuICAgICAgICBnZXRTdGFzaDogZ2V0U3Rhc2hcbiAgICB9O1xuXG59KTtcbiIsImFwcC5jb25maWcoZnVuY3Rpb24gKCRzdGF0ZVByb3ZpZGVyKSB7XG4gICAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ3Byb2R1Y3QnLCB7XG4gICAgICAgIHVybDogJy9wcm9kdWN0JyxcbiAgICAgICAgY29udHJvbGxlcjogJ1Byb2R1Y3RDb250cm9sbGVyJyxcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdqcy9wcm9kdWN0L3Byb2R1Y3QuaHRtbCdcbiAgICB9KTtcbn0pO1xuXG5cbmFwcC5jb25maWcoZnVuY3Rpb24gKCRzdGF0ZVByb3ZpZGVyKSB7XG4gICAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ3Byb2R1Y3QuZGVzY3JpcHRpb24nLCB7XG4gICAgICAgIHVybDogJy9kZXNjcmlwdGlvbicsXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnanMvcHJvZHVjdC9wcm9kdWN0LWRlc2NyaXB0aW9uLmh0bWwnXG4gICAgfSk7XG59KTtcblxuXG5hcHAuY29uZmlnKGZ1bmN0aW9uICgkc3RhdGVQcm92aWRlcikge1xuICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdwcm9kdWN0LnJldmlldycsIHtcbiAgICAgICAgdXJsOiAnL3JldmlldycsXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnanMvcHJvZHVjdC9wcm9kdWN0LXJldmlldy5odG1sJ1xuICAgIH0pO1xufSk7XG5cblxuXG5hcHAuY29udHJvbGxlcignUHJvZHVjdENvbnRyb2xsZXInLCBmdW5jdGlvbiAoJHNjb3BlLCBQcm9kdWN0RmFjdG9yeSwgQ2FydEZhY3RvcnksICRsb2cpIHtcbiAgICBcbiAgICBQcm9kdWN0RmFjdG9yeS5nZXRBbGxGcmllbmRzKClcbiAgICAudGhlbihmdW5jdGlvbihhbGxGcmllbmRzKSB7XG4gICAgICAgICRzY29wZS5hbGxGcmllbmRzID0gYWxsRnJpZW5kcztcbiAgICB9KVxuICAgIC5jYXRjaCgkbG9nLmVycm9yKTtcblxuICAgICRzY29wZS5nZXROdW1SZXZpZXdzID0gUHJvZHVjdEZhY3RvcnkuZ2V0TnVtUmV2aWV3cztcblxuICAgICRzY29wZS5hZGRUb0NhcnQgPSBmdW5jdGlvbihmcmllbmRJZCl7XG4gICAgICAgIENhcnRGYWN0b3J5LmFkZEZyaWVuZFRvQ2FydChmcmllbmRJZClcbiAgICAgICAgLnRoZW4oZnVuY3Rpb24oY2FydCl7XG4gICAgICAgICAgJHNjb3BlLml0ZW1zID0gY2FydC5pdGVtcztcbiAgICAgICAgICAkc2NvcGUudG90YWwgPSBjYXJ0LnRvdGFsO1xuICAgICAgICB9KVxuICAgICAgICAuY2F0Y2goJGxvZy5lcnJvcik7XG4gICAgfVxuXG5cbn0pO1xuXG4iLCJhcHAuY29uZmlnKGZ1bmN0aW9uKCRzdGF0ZVByb3ZpZGVyKSB7XG5cdCRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdzaWdudXAnLCB7XG5cdFx0dXJsOiAnL3NpZ251cCcsXG5cdFx0dGVtcGxhdGVVcmw6ICdqcy9zaWdudXAvc2lnbnVwLmh0bWwnLFxuXHRcdGNvbnRyb2xsZXI6ICdTaWduVXBDdHJsJ1xuXHR9KTtcbn0pO1xuXG4vLyBORUVEIFRPIFVTRSBGT1JNIFZBTElEQVRJT05TIEZPUiBFTUFJTCwgQUREUkVTUywgRVRDXG5hcHAuY29udHJvbGxlcignU2lnblVwQ3RybCcsIGZ1bmN0aW9uKCRzY29wZSwgJHN0YXRlLCAkaHR0cCwgQXV0aFNlcnZpY2UpIHtcblx0Ly8gR2V0IGZyb20gbmctbW9kZWwgaW4gc2lnbnVwLmh0bWxcblx0JHNjb3BlLnNpZ25VcCA9IHt9O1xuXHQkc2NvcGUuY2hlY2tJbmZvID0ge307XG5cdCRzY29wZS5lcnJvciA9IG51bGw7XG5cblx0JHNjb3BlLnNlbmRTaWduVXAgPSBmdW5jdGlvbihzaWduVXBJbmZvKSB7XG5cdFx0JHNjb3BlLmVycm9yID0gbnVsbDtcblxuXHRcdGlmICgkc2NvcGUuc2lnblVwLnBhc3N3b3JkICE9PSAkc2NvcGUuY2hlY2tJbmZvLnBhc3N3b3JkQ29uZmlybSkge1xuXHRcdFx0JHNjb3BlLmVycm9yID0gJ1Bhc3N3b3JkcyBkbyBub3QgbWF0Y2gsIHBsZWFzZSByZS1lbnRlciBwYXNzd29yZC4nO1xuXHRcdH1cblx0XHRlbHNlIHtcblx0XHRcdCRodHRwLnBvc3QoJy9zaWdudXAnLCBzaWduVXBJbmZvKVxuXHRcdFx0LnRoZW4oZnVuY3Rpb24oKSB7XG5cdFx0XHRcdEF1dGhTZXJ2aWNlLmxvZ2luKHNpZ25VcEluZm8pXG5cdFx0XHRcdC50aGVuKGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdCRzdGF0ZS5nbygnaG9tZScpO1xuXHRcdFx0XHR9KTtcblx0XHRcdH0pXG5cdFx0XHQuY2F0Y2goZnVuY3Rpb24oKSB7XG5cdFx0XHRcdCRzY29wZS5lcnJvciA9ICdJbnZhbGlkIHNpZ251cCBjcmVkZW50aWFscy4nO1xuXHRcdFx0fSlcblx0XHR9XG5cdH1cbn0pO1xuIiwiYXBwLmZhY3RvcnkoJ0NhcnRGYWN0b3J5JywgZnVuY3Rpb24oJGh0dHAsICRsb2cpe1xuICBmdW5jdGlvbiBnZXRDYXJ0SXRlbXMoKXtcbiAgICB2YXIgY3VycmVudEl0ZW1zID0gbG9jYWxTdG9yYWdlLmdldEl0ZW0oJ2NhcnRJdGVtcycpO1xuICAgIGlmIChjdXJyZW50SXRlbXMpIHJldHVybiBbXS5zbGljZS5jYWxsKEpTT04ucGFyc2UoY3VycmVudEl0ZW1zKSk7XG4gICAgZWxzZSByZXR1cm4gW107XG4gIH1cblxuICBmdW5jdGlvbiBnZXRDYXJ0VG90YWwoKXtcbiAgICB2YXIgY3VycmVudFRvdGFsID0gbG9jYWxTdG9yYWdlLmdldEl0ZW0oJ2NhcnRUb3RhbCcpO1xuICAgIGlmIChjdXJyZW50VG90YWwpIHJldHVybiBKU09OLnBhcnNlKGN1cnJlbnRUb3RhbCk7XG4gICAgZWxzZSByZXR1cm4gMDtcbiAgfVxuXG4gIHZhciBjYWNoZWRDYXJ0SXRlbXMgPSBnZXRDYXJ0SXRlbXMoKTtcbiAgdmFyIGNhY2hlZENhcnRUb3RhbCA9IGdldENhcnRUb3RhbCgpO1xuXG4gIGZ1bmN0aW9uIGNhbGN1bGF0ZVRvdGFsKGl0ZW1zQXJyYXkpe1xuICAgIHJldHVybiBpdGVtc0FycmF5LnJlZHVjZShmdW5jdGlvbihhLCBiKXtcbiAgICAgIHJldHVybiBhICsgYi5wcmljZTtcbiAgICB9LCAwKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIG1ha2VKU09OKGFycmF5KXtcbiAgLy9jb252ZXJ0IHRoZSBpdGVtcyBhcnJheSBpbnRvIGEganNvbiBzdHJpbmcgb2YgYW4gYXJyYXktbGlrZSBvYmplY3RcbiAgICByZXR1cm4gSlNPTi5zdHJpbmdpZnkoT2JqZWN0LmFzc2lnbih7bGVuZ3RoOiBhcnJheS5sZW5ndGh9LCBhcnJheSkpO1xuICB9XG5cbiAgZnVuY3Rpb24gY2xlYXJDYXJ0KCl7XG4gICAgY2FjaGVkQ2FydEl0ZW1zID0gW107XG4gICAgY2FjaGVkQ2FydFRvdGFsID0gMDtcbiAgICBsb2NhbFN0b3JhZ2UucmVtb3ZlSXRlbSgnY2FydEl0ZW1zJyk7XG4gICAgbG9jYWxTdG9yYWdlLnJlbW92ZUl0ZW0oJ2NhcnRUb3RhbCcpO1xuICB9XG5cbiAgcmV0dXJuIHtcbiAgICBnZXRVc2VyQ2FydDogZnVuY3Rpb24oKXtcbiAgICAgIHJldHVybiAkaHR0cC5nZXQoJy9hcGkvY2FydCcpXG4gICAgICAudGhlbihmdW5jdGlvbihyZXNwb25zZSl7XG4gICAgICAgIGlmICh0eXBlb2YgcmVzcG9uc2UuZGF0YSA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgICBjYWNoZWRDYXJ0SXRlbXMgPSBjYWNoZWRDYXJ0SXRlbXMuY29uY2F0KHJlc3BvbnNlLmRhdGEpO1xuICAgICAgICAgIC8vdXBkYXRlIGxvY2FsIHN0b3JhZ2UgdG8gcmVsZWN0IHRoZSBjYWNoZWQgdmFsdWVzXG4gICAgICAgICAgY2FjaGVkQ2FydFRvdGFsID0gY2FsY3VsYXRlVG90YWwoY2FjaGVkQ2FydEl0ZW1zKVxuICAgICAgICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKCdjYXJ0SXRlbXMnLCBtYWtlSlNPTihjYWNoZWRDYXJ0SXRlbXMpKTtcbiAgICAgICAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbSgnY2FydFRvdGFsJywgY2FjaGVkQ2FydFRvdGFsKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4ge2l0ZW1zOiBjYWNoZWRDYXJ0SXRlbXMsIHRvdGFsOiBjYWNoZWRDYXJ0VG90YWx9O1xuICAgICAgfSlcbiAgICAgIC5jYXRjaCgkbG9nLmVycm9yKVxuICAgIH0sXG4gICAgYWRkRnJpZW5kVG9DYXJ0OiBmdW5jdGlvbihmcmllbmRJZCl7XG4gICAgICByZXR1cm4gJGh0dHAuZ2V0KCcvYXBpL2ZyaWVuZHMvJyArIGZyaWVuZElkKVxuICAgICAgLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICB2YXIgZnJpZW5kID0gcmVzcG9uc2UuZGF0YTtcbiAgICAgICAgY2FjaGVkQ2FydFRvdGFsICs9IGZyaWVuZC5wcmljZTtcbiAgICAgICAgY2FjaGVkQ2FydEl0ZW1zLnB1c2goe2ZyaWVuZElkOiBmcmllbmQuaWQsIG5hbWU6IGZyaWVuZC5uYW1lLCBwcmljZTogZnJpZW5kLnByaWNlLCBob3VyczogZnJpZW5kLm51bUhvdXJzfSk7XG4gICAgICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKCdjYXJ0VG90YWwnLCBjYWNoZWRDYXJ0VG90YWwpO1xuICAgICAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbSgnY2FydEl0ZW1zJywgbWFrZUpTT04oY2FjaGVkQ2FydEl0ZW1zKSk7XG4gICAgICAgIHJldHVybiB7aXRlbXM6IGNhY2hlZENhcnRJdGVtcywgdG90YWw6IGNhY2hlZENhcnRUb3RhbH07XG4gICAgICB9KVxuICAgICAgLmNhdGNoKCRsb2cuZXJyb3IpO1xuICAgIH0sXG4gICAgc2F2ZUNhcnQ6IGZ1bmN0aW9uKCl7XG4gICAgICByZXR1cm4gJGh0dHAucG9zdCgnL2FwaS9jYXJ0Jywge2l0ZW1zOiBjYWNoZWRDYXJ0SXRlbXN9KVxuICAgICAgLnRoZW4oZnVuY3Rpb24oKXtcbiAgICAgICAgY2xlYXJDYXJ0KCk7XG4gICAgICB9KVxuICAgICAgLmNhdGNoKCRsb2cuZXJyb3IpO1xuICAgIH0sXG4gICAgZ2V0SXRlbXM6IGZ1bmN0aW9uKCl7XG4gICAgICByZXR1cm4gY2FjaGVkQ2FydEl0ZW1zO1xuICAgIH0sXG4gICAgZ2V0VG90YWw6IGZ1bmN0aW9uKCl7XG4gICAgICByZXR1cm4gY2FjaGVkQ2FydFRvdGFsO1xuICAgIH0sXG4gICAgY2xlYXJDYXJ0OiBmdW5jdGlvbigpe1xuICAgICAgY2xlYXJDYXJ0KCk7XG4gICAgICByZXR1cm4ge2l0ZW1zOiBjYWNoZWRDYXJ0SXRlbXMsIHRvdGFsOiBjYWNoZWRDYXJ0VG90YWx9O1xuICAgIH0sXG4gICAgZGVsZXRlSXRlbTogZnVuY3Rpb24oZnJpZW5kSWQpe1xuICAgICAgdmFyIGluZGV4ID0gY2FjaGVkQ2FydEl0ZW1zLmZpbmRJbmRleChmdW5jdGlvbihpdGVtKXtcbiAgICAgICAgcmV0dXJuIGl0ZW0uZnJpZW5kSWQgPT09IGZyaWVuZElkO1xuICAgICAgfSk7XG4gICAgICBjYWNoZWRDYXJ0SXRlbXMuc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgIGNhY2hlZENhcnRUb3RhbCA9IGNhbGN1bGF0ZVRvdGFsKGNhY2hlZENhcnRJdGVtcyk7XG4gICAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbSgnY2FydFRvdGFsJywgY2FjaGVkQ2FydFRvdGFsKTtcbiAgICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKCdjYXJ0SXRlbXMnLCBtYWtlSlNPTihjYWNoZWRDYXJ0SXRlbXMpKTtcblxuICAgICAgcmV0dXJuIHtpdGVtczogY2FjaGVkQ2FydEl0ZW1zLCB0b3RhbDogY2FjaGVkQ2FydFRvdGFsfTtcbiAgICB9LFxuICAgIHB1cmNoYXNlOiBmdW5jdGlvbigpe1xuICAgICAgcmV0dXJuICRodHRwLnBvc3QoJy9hcGkvY2FydC9wdXJjaGFzZScsIHtpdGVtczogY2FjaGVkQ2FydEl0ZW1zfSlcbiAgICAgIC50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgY2xlYXJDYXJ0KCk7XG4gICAgICAgIHJldHVybiByZXNwb25zZS5kYXRhO1xuICAgICAgfSlcbiAgICAgIC5jYXRjaCgkbG9nLmVycm9yKTtcbiAgICB9XG4gIH1cbn0pO1xuIiwiYXBwLmZhY3RvcnkoJ0NoZWNrb3V0RmFjdG9yeScsIGZ1bmN0aW9uKCRodHRwLCAkbG9nKXtcblx0dmFyIGNoZWNrb3V0RmFjdCA9IHt9O1xuXHRyZXR1cm4gY2hlY2tvdXRGYWN0O1xufSk7XG4iLCJhcHAuZmFjdG9yeSgnRnVsbHN0YWNrUGljcycsIGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gW1xuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0I3Z0JYdWxDQUFBWFFjRS5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9mYmNkbi1zcGhvdG9zLWMtYS5ha2FtYWloZC5uZXQvaHBob3Rvcy1hay14YXAxL3QzMS4wLTgvMTA4NjI0NTFfMTAyMDU2MjI5OTAzNTkyNDFfODAyNzE2ODg0MzMxMjg0MTEzN19vLmpwZycsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQi1MS1VzaElnQUV5OVNLLmpwZycsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQjc5LVg3b0NNQUFrdzd5LmpwZycsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQi1VajlDT0lJQUlGQWgwLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQjZ5SXlGaUNFQUFxbDEyLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0UtVDc1bFdBQUFtcXFKLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0V2WkFnLVZBQUFrOTMyLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0VnTk1lT1hJQUlmRGhLLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0VReUlETldnQUF1NjBCLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0NGM1Q1UVc4QUUybEdKLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0FlVnc1U1dvQUFBTHNqLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0FhSklQN1VrQUFsSUdzLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0FRT3c5bFdFQUFZOUZsLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQi1PUWJWckNNQUFOd0lNLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQjliX2Vyd0NZQUF3UmNKLnBuZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQjVQVGR2bkNjQUVBbDR4LmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQjRxd0MwaUNZQUFsUEdoLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQjJiMzN2UklVQUE5bzFELmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQndwSXdyMUlVQUF2TzJfLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQnNTc2VBTkNZQUVPaEx3LmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0o0dkxmdVV3QUFkYTRMLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0k3d3pqRVZFQUFPUHBTLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0lkSHZUMlVzQUFubkhWLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0dDaVBfWVdZQUFvNzVWLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0lTNEpQSVdJQUkzN3F1LmpwZzpsYXJnZSdcbiAgICBdO1xufSk7XG4iLCJhcHAuZmFjdG9yeSgnUHJvZHVjdEZhY3RvcnknLCBmdW5jdGlvbigkaHR0cCwgJGxvZyl7XG5cbiAgcmV0dXJuIHtcblxuICAgIGdldEFsbEZyaWVuZHM6IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuICRodHRwLmdldCgnL2FwaS9mcmllbmRzJylcbiAgICAgIC50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG4gICAgICAgIHJldHVybiByZXNwb25zZS5kYXRhO1xuICAgICAgfSlcbiAgICAgIC5jYXRjaCgkbG9nLmVycm9yKTtcbiAgICB9LFxuXG4gICAgZ2V0RnJpZW5kOiBmdW5jdGlvbihmcmllbmRJZCkge1xuICAgICAgcmV0dXJuICRodHRwLmdldCgnL2FwaS9mcmllbmRzLycgKyBmcmllbmRJZClcbiAgICAgIC50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgcmV0dXJuIHJlc3BvbnNlLmRhdGE7XG4gICAgICB9KVxuICAgICAgLmNhdGNoKCRsb2cuZXJyb3IpXG4gICAgfSxcblxuICAgIC8vIGZyaWVuZFJhdGluZzogZnVuY3Rpb25cblxuICAgIGdldE51bVJldmlld3M6IGZ1bmN0aW9uKGZyaWVuZElkKSB7XG4gICAgICByZXR1cm4gJGh0dHAuZ2V0KCcvYXBpL2ZyaWVuZHMvJyArIGZyaWVuZElkICsgJy9mZWVkYmFjaycpXG4gICAgICAudGhlbihmdW5jdGlvbihyZXNwb25zZSkge1xuICAgICAgICByZXR1cm4gcmVzcG9uc2UuZGF0YS5jb3VudDtcbiAgICAgIH0pXG4gICAgICAuY2F0Y2goJGxvZy5lcnJvcilcbiAgICB9LFxuXG4gICAgLy8gZ2V0UmF0aW5nOiBmdW5jdGlvbihmcmllbmRJZCkge1xuXG4gICAgLy8gfVxuXG5cbiAgfTsgLy9lbmQgb2YgcmV0dXJuXG5cbn0pO1xuIiwiYXBwLmZhY3RvcnkoJ1JhbmRvbUdyZWV0aW5ncycsIGZ1bmN0aW9uICgpIHtcblxuICAgIHZhciBnZXRSYW5kb21Gcm9tQXJyYXkgPSBmdW5jdGlvbiAoYXJyKSB7XG4gICAgICAgIHJldHVybiBhcnJbTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogYXJyLmxlbmd0aCldO1xuICAgIH07XG5cbiAgICB2YXIgZ3JlZXRpbmdzID0gW1xuICAgICAgICAnSGVsbG8sIHdvcmxkIScsXG4gICAgICAgICdBdCBsb25nIGxhc3QsIEkgbGl2ZSEnLFxuICAgICAgICAnSGVsbG8sIHNpbXBsZSBodW1hbi4nLFxuICAgICAgICAnV2hhdCBhIGJlYXV0aWZ1bCBkYXkhJyxcbiAgICAgICAgJ0lcXCdtIGxpa2UgYW55IG90aGVyIHByb2plY3QsIGV4Y2VwdCB0aGF0IEkgYW0geW91cnMuIDopJyxcbiAgICAgICAgJ1RoaXMgZW1wdHkgc3RyaW5nIGlzIGZvciBMaW5kc2F5IExldmluZS4nLFxuICAgICAgICAn44GT44KT44Gr44Gh44Gv44CB44Om44O844K244O85qeY44CCJyxcbiAgICAgICAgJ1dlbGNvbWUuIFRvLiBXRUJTSVRFLicsXG4gICAgICAgICc6RCcsXG4gICAgICAgICdZZXMsIEkgdGhpbmsgd2VcXCd2ZSBtZXQgYmVmb3JlLicsXG4gICAgICAgICdHaW1tZSAzIG1pbnMuLi4gSSBqdXN0IGdyYWJiZWQgdGhpcyByZWFsbHkgZG9wZSBmcml0dGF0YScsXG4gICAgICAgICdJZiBDb29wZXIgY291bGQgb2ZmZXIgb25seSBvbmUgcGllY2Ugb2YgYWR2aWNlLCBpdCB3b3VsZCBiZSB0byBuZXZTUVVJUlJFTCEnLFxuICAgIF07XG5cbiAgICByZXR1cm4ge1xuICAgICAgICBncmVldGluZ3M6IGdyZWV0aW5ncyxcbiAgICAgICAgZ2V0UmFuZG9tR3JlZXRpbmc6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBnZXRSYW5kb21Gcm9tQXJyYXkoZ3JlZXRpbmdzKTtcbiAgICAgICAgfVxuICAgIH07XG5cbn0pO1xuIiwiYXBwLmRpcmVjdGl2ZSgnZnVsbHN0YWNrTG9nbycsIGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4ge1xuICAgICAgICByZXN0cmljdDogJ0UnLFxuICAgICAgICB0ZW1wbGF0ZVVybDogJ2pzL2NvbW1vbi9kaXJlY3RpdmVzL2Z1bGxzdGFjay1sb2dvL2Z1bGxzdGFjay1sb2dvLmh0bWwnXG4gICAgfTtcbn0pO1xuIiwiYXBwLmRpcmVjdGl2ZSgnbmF2YmFyJywgZnVuY3Rpb24gKCRyb290U2NvcGUsIEF1dGhTZXJ2aWNlLCBBVVRIX0VWRU5UUywgJHN0YXRlLCBDYXJ0RmFjdG9yeSwgJGxvZykge1xuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgcmVzdHJpY3Q6ICdFJyxcbiAgICAgICAgc2NvcGU6IHt9LFxuICAgICAgICB0ZW1wbGF0ZVVybDogJ2pzL2NvbW1vbi9kaXJlY3RpdmVzL25hdmJhci9uYXZiYXIuaHRtbCcsXG4gICAgICAgIGxpbms6IGZ1bmN0aW9uIChzY29wZSkge1xuXG4gICAgICAgICAgICBzY29wZS5pdGVtcyA9IFtcbiAgICAgICAgICAgICAgICB7IGxhYmVsOiAnSG9tZScsIHN0YXRlOiAnaG9tZScgfSxcbiAgICAgICAgICAgICAgICB7IGxhYmVsOiAnQWJvdXQnLCBzdGF0ZTogJ2Fib3V0JyB9LFxuICAgICAgICAgICAgICAgIHsgbGFiZWw6ICdEb2N1bWVudGF0aW9uJywgc3RhdGU6ICdkb2NzJyB9LFxuICAgICAgICAgICAgICAgIHsgbGFiZWw6ICdDYXJ0IFRlc3RpbmcgU3RhdGUhJywgc3RhdGU6ICdjYXJ0JyB9LFxuICAgICAgICAgICAgICAgIHsgbGFiZWw6ICdNZW1iZXJzIE9ubHknLCBzdGF0ZTogJ21lbWJlcnNPbmx5JywgYXV0aDogdHJ1ZSB9XG4gICAgICAgICAgICBdO1xuXG4gICAgICAgICAgICBzY29wZS51c2VyID0gbnVsbDtcblxuICAgICAgICAgICAgc2NvcGUuaXNMb2dnZWRJbiA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gQXV0aFNlcnZpY2UuaXNBdXRoZW50aWNhdGVkKCk7XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBzY29wZS5sb2dvdXQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgQ2FydEZhY3Rvcnkuc2F2ZUNhcnQoKVxuICAgICAgICAgICAgICAgIC50aGVuKGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBBdXRoU2VydmljZS5sb2dvdXQoKTtcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgIC50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAkc3RhdGUuZ28oJ2hvbWUnKTtcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgIC5jYXRjaCgkbG9nLmVycm9yKTtcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIHZhciBzZXRVc2VyID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIEF1dGhTZXJ2aWNlLmdldExvZ2dlZEluVXNlcigpLnRoZW4oZnVuY3Rpb24gKHVzZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgc2NvcGUudXNlciA9IHVzZXI7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICB2YXIgcmVtb3ZlVXNlciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBzY29wZS51c2VyID0gbnVsbDtcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIHNldFVzZXIoKTtcblxuICAgICAgICAgICAgJHJvb3RTY29wZS4kb24oQVVUSF9FVkVOVFMubG9naW5TdWNjZXNzLCBzZXRVc2VyKTtcbiAgICAgICAgICAgICRyb290U2NvcGUuJG9uKEFVVEhfRVZFTlRTLmxvZ291dFN1Y2Nlc3MsIHJlbW92ZVVzZXIpO1xuICAgICAgICAgICAgJHJvb3RTY29wZS4kb24oQVVUSF9FVkVOVFMuc2Vzc2lvblRpbWVvdXQsIHJlbW92ZVVzZXIpO1xuXG4gICAgICAgIH1cblxuICAgIH07XG5cbn0pO1xuXG4iLCJhcHAuZGlyZWN0aXZlKCdyYW5kb0dyZWV0aW5nJywgZnVuY3Rpb24gKFJhbmRvbUdyZWV0aW5ncykge1xuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgcmVzdHJpY3Q6ICdFJyxcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdqcy9jb21tb24vZGlyZWN0aXZlcy9yYW5kby1ncmVldGluZy9yYW5kby1ncmVldGluZy5odG1sJyxcbiAgICAgICAgbGluazogZnVuY3Rpb24gKHNjb3BlKSB7XG4gICAgICAgICAgICBzY29wZS5ncmVldGluZyA9IFJhbmRvbUdyZWV0aW5ncy5nZXRSYW5kb21HcmVldGluZygpO1xuICAgICAgICB9XG4gICAgfTtcblxufSk7XG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
