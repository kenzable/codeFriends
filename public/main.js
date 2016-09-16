'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

window.app = angular.module('FullstackGeneratedApp', ['fsaPreBuilt', 'ui.router', 'ui.bootstrap', 'ngAnimate', 'ngTagsInput']);

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

    $scope.tags = [{ text: 'just' }, { text: 'some' }, { text: 'cool' }, { text: 'tags' }];

    $scope.myInterval = 5000;
    $scope.noWrapSlides = false;
    $scope.active = 0;
    var slides = $scope.slides = [];
    var currIndex = 0;

    $scope.addSlide = function () {
        slides.push({
            image: '//www.codermatch.me/assets/Coder-w-Buddy-5a83fd5702cf67f5e93704b6c5316203.svg',
            text: ['Nice image', 'Awesome photograph', 'That is so cool', 'I love that'][slides.length % 4],
            id: currIndex++
        });
    };

    for (var i = 0; i < 4; i++) {
        $scope.addSlide();
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
        url: '/product/:friendId',
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

app.controller('ProductController', function ($scope, ProductFactory, CartFactory, $log, $stateParams) {

    ProductFactory.getAllFriends().then(function (allFriends) {
        $scope.allFriends = allFriends;
    }).catch($log.error);

    $scope.getNumReviews = ProductFactory.getNumReviews;

    $scope.id = $stateParams.friendId;

    ProductFactory.getFriend($scope.id).then(function (friend) {
        $scope.friend = friend;
    }).catch($log.error);

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

app.directive('gracehopperLogo', function () {
    return {
        restrict: 'E',
        templateUrl: 'js/common/directives/gracehopper-logo/gracehopper-logo.html'
    };
});

app.directive('navbar', function ($rootScope, AuthService, AUTH_EVENTS, $state, CartFactory, $log) {

    return {
        restrict: 'E',
        scope: {},
        templateUrl: 'js/common/directives/navbar/navbar.html',
        link: function link(scope) {

            scope.items = [{ label: 'Home', state: 'home' }, { label: 'About', state: 'about' }, { label: 'Checkout', state: 'cart' }, { label: 'Members Only', state: 'membersOnly', auth: true }];

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
<<<<<<< HEAD
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyIsImFib3V0L2Fib3V0LmpzIiwiY2FydC9jYXJ0LmpzIiwiY2hlY2tvdXQvY2hlY2tvdXQuanMiLCJkb2NzL2RvY3MuanMiLCJmc2EvZnNhLXByZS1idWlsdC5qcyIsImhvbWUvaG9tZS5qcyIsImxvZ2luL2xvZ2luLmpzIiwibWVtYmVycy1vbmx5L21lbWJlcnMtb25seS5qcyIsInByb2R1Y3QvcHJvZHVjdC5qcyIsInNpZ251cC9zaWdudXAuanMiLCJjb21tb24vZmFjdG9yaWVzL0NhcnRGYWN0b3J5LmpzIiwiY29tbW9uL2ZhY3Rvcmllcy9DaGVja291dEZhY3RvcnkuanMiLCJjb21tb24vZmFjdG9yaWVzL1Byb2R1Y3RGYWN0b3J5LmpzIiwiY29tbW9uL2RpcmVjdGl2ZXMvZ3JhY2Vob3BwZXItbG9nby9ncmFjZWhvcHBlci1sb2dvLmpzIiwiY29tbW9uL2RpcmVjdGl2ZXMvbmF2YmFyL25hdmJhci5qcyJdLCJuYW1lcyI6WyJ3aW5kb3ciLCJhcHAiLCJhbmd1bGFyIiwibW9kdWxlIiwiY29uZmlnIiwiJHVybFJvdXRlclByb3ZpZGVyIiwiJGxvY2F0aW9uUHJvdmlkZXIiLCJodG1sNU1vZGUiLCJvdGhlcndpc2UiLCJ3aGVuIiwibG9jYXRpb24iLCJyZWxvYWQiLCJydW4iLCIkcm9vdFNjb3BlIiwiQXV0aFNlcnZpY2UiLCIkc3RhdGUiLCJkZXN0aW5hdGlvblN0YXRlUmVxdWlyZXNBdXRoIiwic3RhdGUiLCJkYXRhIiwiYXV0aGVudGljYXRlIiwiJG9uIiwiZXZlbnQiLCJ0b1N0YXRlIiwidG9QYXJhbXMiLCJpc0F1dGhlbnRpY2F0ZWQiLCJwcmV2ZW50RGVmYXVsdCIsImdldExvZ2dlZEluVXNlciIsInRoZW4iLCJ1c2VyIiwiZ28iLCJuYW1lIiwiJHN0YXRlUHJvdmlkZXIiLCJ1cmwiLCJjb250cm9sbGVyIiwidGVtcGxhdGVVcmwiLCIkc2NvcGUiLCJGdWxsc3RhY2tQaWNzIiwiaW1hZ2VzIiwiXyIsInNodWZmbGUiLCJDYXJ0RmFjdG9yeSIsIiRsb2ciLCJpdGVtcyIsImdldEl0ZW1zIiwidG90YWwiLCJnZXRUb3RhbCIsImdldFVzZXJDYXJ0IiwiY2FydCIsImNhdGNoIiwiZXJyb3IiLCJhZGRUb0NhcnQiLCJmcmllbmRJZCIsImFkZEZyaWVuZFRvQ2FydCIsImNsZWFyQ2FydCIsInNhdmVDYXJ0IiwiZGVsZXRlSXRlbSIsInB1cmNoYXNlIiwib3JkZXIiLCJuZXdPcmRlciIsIkVycm9yIiwiZmFjdG9yeSIsImlvIiwib3JpZ2luIiwiY29uc3RhbnQiLCJsb2dpblN1Y2Nlc3MiLCJsb2dpbkZhaWxlZCIsImxvZ291dFN1Y2Nlc3MiLCJzZXNzaW9uVGltZW91dCIsIm5vdEF1dGhlbnRpY2F0ZWQiLCJub3RBdXRob3JpemVkIiwiJHEiLCJBVVRIX0VWRU5UUyIsInN0YXR1c0RpY3QiLCJyZXNwb25zZUVycm9yIiwicmVzcG9uc2UiLCIkYnJvYWRjYXN0Iiwic3RhdHVzIiwicmVqZWN0IiwiJGh0dHBQcm92aWRlciIsImludGVyY2VwdG9ycyIsInB1c2giLCIkaW5qZWN0b3IiLCJnZXQiLCJzZXJ2aWNlIiwiJGh0dHAiLCJTZXNzaW9uIiwib25TdWNjZXNzZnVsTG9naW4iLCJjcmVhdGUiLCJmcm9tU2VydmVyIiwibG9naW4iLCJjcmVkZW50aWFscyIsInBvc3QiLCJtZXNzYWdlIiwibG9nb3V0IiwiZGVzdHJveSIsInNlbGYiLCJzZXNzaW9uSWQiLCJQcm9kdWN0RmFjdG9yeSIsInRhZ3MiLCJ0ZXh0IiwibXlJbnRlcnZhbCIsIm5vV3JhcFNsaWRlcyIsImFjdGl2ZSIsInNsaWRlcyIsImN1cnJJbmRleCIsImFkZFNsaWRlIiwiaW1hZ2UiLCJsZW5ndGgiLCJpZCIsImkiLCJzZW5kTG9naW4iLCJsb2dpbkluZm8iLCJ0ZW1wbGF0ZSIsIlNlY3JldFN0YXNoIiwiZ2V0U3Rhc2giLCJzdGFzaCIsImdldEFsbEZyaWVuZHMiLCJhbGxGcmllbmRzIiwiZ2V0TnVtUmV2aWV3cyIsInNpZ25VcCIsImNoZWNrSW5mbyIsInNlbmRTaWduVXAiLCJzaWduVXBJbmZvIiwicGFzc3dvcmQiLCJwYXNzd29yZENvbmZpcm0iLCJnZXRDYXJ0SXRlbXMiLCJjdXJyZW50SXRlbXMiLCJsb2NhbFN0b3JhZ2UiLCJnZXRJdGVtIiwic2xpY2UiLCJjYWxsIiwiSlNPTiIsInBhcnNlIiwiZ2V0Q2FydFRvdGFsIiwiY3VycmVudFRvdGFsIiwiY2FjaGVkQ2FydEl0ZW1zIiwiY2FjaGVkQ2FydFRvdGFsIiwiY2FsY3VsYXRlVG90YWwiLCJpdGVtc0FycmF5IiwicmVkdWNlIiwiYSIsImIiLCJwcmljZSIsIm1ha2VKU09OIiwiYXJyYXkiLCJzdHJpbmdpZnkiLCJPYmplY3QiLCJhc3NpZ24iLCJyZW1vdmVJdGVtIiwiY29uY2F0Iiwic2V0SXRlbSIsImZyaWVuZCIsImhvdXJzIiwibnVtSG91cnMiLCJpbmRleCIsImZpbmRJbmRleCIsIml0ZW0iLCJzcGxpY2UiLCJjaGVja291dEZhY3QiLCJnZXRGcmllbmQiLCJjb3VudCIsImRpcmVjdGl2ZSIsInJlc3RyaWN0Iiwic2NvcGUiLCJsaW5rIiwibGFiZWwiLCJhdXRoIiwiaXNMb2dnZWRJbiIsInNldFVzZXIiLCJyZW1vdmVVc2VyIl0sIm1hcHBpbmdzIjoiQUFBQTs7OztBQUNBQSxPQUFBQyxHQUFBLEdBQUFDLFFBQUFDLE1BQUEsQ0FBQSx1QkFBQSxFQUFBLENBQUEsYUFBQSxFQUFBLFdBQUEsRUFBQSxjQUFBLEVBQUEsV0FBQSxFQUFBLGFBQUEsQ0FBQSxDQUFBOztBQUVBRixJQUFBRyxNQUFBLENBQUEsVUFBQUMsa0JBQUEsRUFBQUMsaUJBQUEsRUFBQTtBQUNBO0FBQ0FBLHNCQUFBQyxTQUFBLENBQUEsSUFBQTtBQUNBO0FBQ0FGLHVCQUFBRyxTQUFBLENBQUEsR0FBQTtBQUNBO0FBQ0FILHVCQUFBSSxJQUFBLENBQUEsaUJBQUEsRUFBQSxZQUFBO0FBQ0FULGVBQUFVLFFBQUEsQ0FBQUMsTUFBQTtBQUNBLEtBRkE7QUFHQSxDQVRBOztBQVdBO0FBQ0FWLElBQUFXLEdBQUEsQ0FBQSxVQUFBQyxVQUFBLEVB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LGFBRkE7O0FBSUE0STs7QUFFQTNKLHVCQUFBTyxHQUFBLENBQUFtRCxZQUFBUCxZQUFBLEVBQUF3RyxPQUFBO0FBQ0EzSix1QkFBQU8sR0FBQSxDQUFBbUQsWUFBQUwsYUFBQSxFQUFBdUcsVUFBQTtBQUNBNUosdUJBQUFPLEdBQUEsQ0FBQW1ELFlBQUFKLGNBQUEsRUFBQXNHLFVBQUE7QUFFQTs7QUE5Q0EsS0FBQTtBQWtEQSxDQXBEQSIsImZpbGUiOiJtYWluLmpzIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBzdHJpY3QnO1xud2luZG93LmFwcCA9IGFuZ3VsYXIubW9kdWxlKCdGdWxsc3RhY2tHZW5lcmF0ZWRBcHAnLCBbJ2ZzYVByZUJ1aWx0JywgJ3VpLnJvdXRlcicsICd1aS5ib290c3RyYXAnLCAnbmdBbmltYXRlJywgJ25nVGFnc0lucHV0J10pO1xuXG5hcHAuY29uZmlnKGZ1bmN0aW9uICgkdXJsUm91dGVyUHJvdmlkZXIsICRsb2NhdGlvblByb3ZpZGVyKSB7XG4gICAgLy8gVGhpcyB0dXJucyBvZmYgaGFzaGJhbmcgdXJscyAoLyNhYm91dCkgYW5kIGNoYW5nZXMgaXQgdG8gc29tZXRoaW5nIG5vcm1hbCAoL2Fib3V0KVxuICAgICRsb2NhdGlvblByb3ZpZGVyLmh0bWw1TW9kZSh0cnVlKTtcbiAgICAvLyBJZiB3ZSBnbyB0byBhIFVSTCB0aGF0IHVpLXJvdXRlciBkb2Vzbid0IGhhdmUgcmVnaXN0ZXJlZCwgZ28gdG8gdGhlIFwiL1wiIHVybC5cbiAgICAkdXJsUm91dGVyUHJvdmlkZXIub3RoZXJ3aXNlKCcvJyk7XG4gICAgLy8gVHJpZ2dlciBwYWdlIHJlZnJlc2ggd2hlbiBhY2Nlc3NpbmcgYW4gT0F1dGggcm91dGVcbiAgICAkdXJsUm91dGVyUHJvdmlkZXIud2hlbignL2F1dGgvOnByb3ZpZGVyJywgZnVuY3Rpb24gKCkge1xuICAgICAgICB3aW5kb3cubG9jYXRpb24ucmVsb2FkKCk7XG4gICAgfSk7XG59KTtcblxuLy8gVGhpcyBhcHAucnVuIGlzIGZvciBjb250cm9sbGluZyBhY2Nlc3MgdG8gc3BlY2lmaWMgc3RhdGVzLlxuYXBwLnJ1bihmdW5jdGlvbiAoJHJvb3RTY29wZSwgQXV0aFNlcnZpY2UsICRzdGF0ZSkge1xuXG4gICAgLy8gVGhlIGdpdmVuIHN0YXRlIHJlcXVpcmVzIGFuIGF1dGhlbnRpY2F0ZWQgdXNlci5cbiAgICB2YXIgZGVzdGluYXRpb25TdGF0ZVJlcXVpcmVzQXV0aCA9IGZ1bmN0aW9uIChzdGF0ZSkge1xuICAgICAgICByZXR1cm4gc3RhdGUuZGF0YSAmJiBzdGF0ZS5kYXRhLmF1dGhlbnRpY2F0ZTtcbiAgICB9O1xuXG4gICAgLy8gJHN0YXRlQ2hhbmdlU3RhcnQgaXMgYW4gZXZlbnQgZmlyZWRcbiAgICAvLyB3aGVuZXZlciB0aGUgcHJvY2VzcyBvZiBjaGFuZ2luZyBhIHN0YXRlIGJlZ2lucy5cbiAgICAkcm9vdFNjb3BlLiRvbignJHN0YXRlQ2hhbmdlU3RhcnQnLCBmdW5jdGlvbiAoZXZlbnQsIHRvU3RhdGUsIHRvUGFyYW1zKSB7XG5cbiAgICAgICAgaWYgKCFkZXN0aW5hdGlvblN0YXRlUmVxdWlyZXNBdXRoKHRvU3RhdGUpKSB7XG4gICAgICAgICAgICAvLyBUaGUgZGVzdGluYXRpb24gc3RhdGUgZG9lcyBub3QgcmVxdWlyZSBhdXRoZW50aWNhdGlvblxuICAgICAgICAgICAgLy8gU2hvcnQgY2lyY3VpdCB3aXRoIHJldHVybi5cbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChBdXRoU2VydmljZS5pc0F1dGhlbnRpY2F0ZWQoKSkge1xuICAgICAgICAgICAgLy8gVGhlIHVzZXIgaXMgYXV0aGVudGljYXRlZC5cbiAgICAgICAgICAgIC8vIFNob3J0IGNpcmN1aXQgd2l0aCByZXR1cm4uXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICAvLyBDYW5jZWwgbmF2aWdhdGluZyB0byBuZXcgc3RhdGUuXG4gICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG5cbiAgICAgICAgQXV0aFNlcnZpY2UuZ2V0TG9nZ2VkSW5Vc2VyKCkudGhlbihmdW5jdGlvbiAodXNlcikge1xuICAgICAgICAgICAgLy8gSWYgYSB1c2VyIGlzIHJldHJpZXZlZCwgdGhlbiByZW5hdmlnYXRlIHRvIHRoZSBkZXN0aW5hdGlvblxuICAgICAgICAgICAgLy8gKHRoZSBzZWNvbmQgdGltZSwgQXV0aFNlcnZpY2UuaXNBdXRoZW50aWNhdGVkKCkgd2lsbCB3b3JrKVxuICAgICAgICAgICAgLy8gb3RoZXJ3aXNlLCBpZiBubyB1c2VyIGlzIGxvZ2dlZCBpbiwgZ28gdG8gXCJsb2dpblwiIHN0YXRlLlxuICAgICAgICAgICAgaWYgKHVzZXIpIHtcbiAgICAgICAgICAgICAgICAkc3RhdGUuZ28odG9TdGF0ZS5uYW1lLCB0b1BhcmFtcyk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICRzdGF0ZS5nbygnbG9naW4nKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICB9KTtcblxufSk7XG4iLCJhcHAuY29uZmlnKGZ1bmN0aW9uICgkc3RhdGVQcm92aWRlcikge1xuXG4gICAgLy8gUmVnaXN0ZXIgb3VyICphYm91dCogc3RhdGUuXG4gICAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2Fib3V0Jywge1xuICAgICAgICB1cmw6ICcvYWJvdXQnLFxuICAgICAgICBjb250cm9sbGVyOiAnQWJvdXRDb250cm9sbGVyJyxcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdqcy9hYm91dC9hYm91dC5odG1sJ1xuICAgIH0pO1xuXG59KTtcblxuYXBwLmNvbnRyb2xsZXIoJ0Fib3V0Q29udHJvbGxlcicsIGZ1bmN0aW9uICgkc2NvcGUsIEZ1bGxzdGFja1BpY3MpIHtcblxuICAgIC8vIEltYWdlcyBvZiBiZWF1dGlmdWwgRnVsbHN0YWNrIHBlb3BsZS5cbiAgICAkc2NvcGUuaW1hZ2VzID0gXy5zaHVmZmxlKEZ1bGxzdGFja1BpY3MpO1xuXG59KTtcbiIsImFwcC5jb25maWcoZnVuY3Rpb24gKCRzdGF0ZVByb3ZpZGVyKSB7XG4gICAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2NhcnQnLCB7XG4gICAgICAgIHVybDogJy9jYXJ0JyxcbiAgICAgICAgY29udHJvbGxlcjogJ0NhcnRDb250cm9sbGVyJyxcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdqcy9jYXJ0L2NhcnQuaHRtbCdcbiAgICB9KTtcbn0pO1xuXG5cbmFwcC5jb25maWcoZnVuY3Rpb24gKCRzdGF0ZVByb3ZpZGVyKSB7XG4gICAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2NhcnQuY2hlY2tvdXQnLCB7XG4gICAgICAgIHVybDogJy9jaGVja291dCcsXG4gICAgICAgIGNvbnRyb2xsZXI6ICdDYXJ0Q29udHJvbGxlcicsXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnanMvY2hlY2tvdXQvY2hlY2tvdXQuaHRtbCdcbiAgICB9KTtcbn0pO1xuXG5cbmFwcC5jb250cm9sbGVyKCdDYXJ0Q29udHJvbGxlcicsIGZ1bmN0aW9uICgkc2NvcGUsIENhcnRGYWN0b3J5LCAkbG9nLCAkcm9vdFNjb3BlKSB7XG4gICRzY29wZS5pdGVtcyA9IENhcnRGYWN0b3J5LmdldEl0ZW1zKCk7XG4gICRzY29wZS50b3RhbCA9IENhcnRGYWN0b3J5LmdldFRvdGFsKCk7XG5cbiAgJHJvb3RTY29wZS4kb24oJ2F1dGgtbG9naW4tc3VjY2VzcycsIGZ1bmN0aW9uKCl7XG4gICAgQ2FydEZhY3RvcnkuZ2V0VXNlckNhcnQoKVxuICAgIC50aGVuKGZ1bmN0aW9uKGNhcnQpe1xuICAgICAgJHNjb3BlLml0ZW1zID0gY2FydC5pdGVtcztcbiAgICAgICRzY29wZS50b3RhbCA9IGNhcnQudG90YWw7XG4gICAgfSlcbiAgICAuY2F0Y2goJGxvZy5lcnJvcik7XG4gIH0pO1xuXG4gICRyb290U2NvcGUuJG9uKCdhdXRoLWxvZ291dC1zdWNjZXNzJywgZnVuY3Rpb24oKXtcbiAgICAkc2NvcGUuaXRlbXMgPSBDYXJ0RmFjdG9yeS5nZXRJdGVtcygpO1xuICAgICRzY29wZS50b3RhbCA9IENhcnRGYWN0b3J5LmdldFRvdGFsKCk7XG4gIH0pO1xuXG4gICRzY29wZS5nZXRVc2VyQ2FydCA9IGZ1bmN0aW9uKCl7XG4gICAgQ2FydEZhY3RvcnkuZ2V0VXNlckNhcnQoKVxuICAgIC50aGVuKGZ1bmN0aW9uKGNhcnQpe1xuICAgICAgJHNjb3BlLml0ZW1zID0gY2FydC5pdGVtcztcbiAgICAgICRzY29wZS50b3RhbCA9IGNhcnQudG90YWw7XG4gICAgfSlcbiAgICAuY2F0Y2goJGxvZy5lcnJvcilcbiAgfVxuICAkc2NvcGUuYWRkVG9DYXJ0ID0gZnVuY3Rpb24oZnJpZW5kSWQpe1xuICAgIENhcnRGYWN0b3J5LmFkZEZyaWVuZFRvQ2FydChmcmllbmRJZClcbiAgICAudGhlbihmdW5jdGlvbihjYXJ0KXtcbiAgICAgICRzY29wZS5pdGVtcyA9IGNhcnQuaXRlbXM7XG4gICAgICAkc2NvcGUudG90YWwgPSBjYXJ0LnRvdGFsO1xuICAgIH0pXG4gICAgLmNhdGNoKCRsb2cuZXJyb3IpO1xuICB9XG4gICRzY29wZS5jbGVhckNhcnQgPSBmdW5jdGlvbigpe1xuICAgIHZhciBjYXJ0ID0gQ2FydEZhY3RvcnkuY2xlYXJDYXJ0KCk7XG4gICAgICAkc2NvcGUuaXRlbXMgPSBjYXJ0Lml0ZW1zO1xuICAgICAgJHNjb3BlLnRvdGFsID0gY2FydC50b3RhbDtcbiAgfVxuICAkc2NvcGUuc2F2ZUNhcnQgPSBDYXJ0RmFjdG9yeS5zYXZlQ2FydDtcblxuICAgJHNjb3BlLmRlbGV0ZUl0ZW0gPSBmdW5jdGlvbihmcmllbmRJZCl7XG4gICAgdmFyIGNhcnQgPSBDYXJ0RmFjdG9yeS5kZWxldGVJdGVtKGZyaWVuZElkKTtcbiAgICAgICRzY29wZS5pdGVtcyA9IGNhcnQuaXRlbXM7XG4gICAgICAkc2NvcGUudG90YWwgPSBjYXJ0LnRvdGFsO1xuICB9XG4gICRzY29wZS5wdXJjaGFzZSA9IGZ1bmN0aW9uKCl7XG4gICAgQ2FydEZhY3RvcnkucHVyY2hhc2UoKVxuICAgIC50aGVuKGZ1bmN0aW9uKG9yZGVyKXtcbiAgICAgICRzY29wZS5uZXdPcmRlciA9IG9yZGVyO1xuICAgICAgJHNjb3BlLml0ZW1zID0gQ2FydEZhY3RvcnkuZ2V0SXRlbXMoKTtcbiAgICAgICRzY29wZS50b3RhbCA9IENhcnRGYWN0b3J5LmdldFRvdGFsKCk7XG4gICAgfSlcbiAgICAuY2F0Y2goJGxvZy5lcnJvcik7XG4gIH07XG59KTtcbiIsImFwcC5jb25maWcoZnVuY3Rpb24gKCRzdGF0ZVByb3ZpZGVyKSB7XG4gICAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2NvbXBsZXRlJywge1xuICAgICAgICB1cmw6ICcvY29tcGxldGUnLFxuICAgICAgICBjb250cm9sbGVyOiAnQ2hlY2tvdXRDb250cm9sbGVyJyxcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdqcy9jaGVja291dC9jaGVja291dENvbXBsZXRlLmh0bWwnXG4gICAgfSk7XG59KTtcblxuYXBwLmNvbnRyb2xsZXIoJ0NoZWNrb3V0Q29udHJvbGxlcicsIGZ1bmN0aW9uICgkc2NvcGUpIHtcblx0JHNjb3BlLnRvdGFsID0gODA7IC8vdGVzdFxufSk7XG5cbiIsImFwcC5jb25maWcoZnVuY3Rpb24gKCRzdGF0ZVByb3ZpZGVyKSB7XG4gICAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2RvY3MnLCB7XG4gICAgICAgIHVybDogJy9kb2NzJyxcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdqcy9zaG9wcGluZ0NhcnQvc2hvcHBpbmctY2FydC5odG1sJ1xuICAgIH0pO1xufSk7XG4iLCIoZnVuY3Rpb24gKCkge1xuXG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgLy8gSG9wZSB5b3UgZGlkbid0IGZvcmdldCBBbmd1bGFyISBEdWgtZG95LlxuICAgIGlmICghd2luZG93LmFuZ3VsYXIpIHRocm93IG5ldyBFcnJvcignSSBjYW5cXCd0IGZpbmQgQW5ndWxhciEnKTtcblxuICAgIHZhciBhcHAgPSBhbmd1bGFyLm1vZHVsZSgnZnNhUHJlQnVpbHQnLCBbXSk7XG5cbiAgICBhcHAuZmFjdG9yeSgnU29ja2V0JywgZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAoIXdpbmRvdy5pbykgdGhyb3cgbmV3IEVycm9yKCdzb2NrZXQuaW8gbm90IGZvdW5kIScpO1xuICAgICAgICByZXR1cm4gd2luZG93LmlvKHdpbmRvdy5sb2NhdGlvbi5vcmlnaW4pO1xuICAgIH0pO1xuXG4gICAgLy8gQVVUSF9FVkVOVFMgaXMgdXNlZCB0aHJvdWdob3V0IG91ciBhcHAgdG9cbiAgICAvLyBicm9hZGNhc3QgYW5kIGxpc3RlbiBmcm9tIGFuZCB0byB0aGUgJHJvb3RTY29wZVxuICAgIC8vIGZvciBpbXBvcnRhbnQgZXZlbnRzIGFib3V0IGF1dGhlbnRpY2F0aW9uIGZsb3cuXG4gICAgYXBwLmNvbnN0YW50KCdBVVRIX0VWRU5UUycsIHtcbiAgICAgICAgbG9naW5TdWNjZXNzOiAnYXV0aC1sb2dpbi1zdWNjZXNzJyxcbiAgICAgICAgbG9naW5GYWlsZWQ6ICdhdXRoLWxvZ2luLWZhaWxlZCcsXG4gICAgICAgIGxvZ291dFN1Y2Nlc3M6ICdhdXRoLWxvZ291dC1zdWNjZXNzJyxcbiAgICAgICAgc2Vzc2lvblRpbWVvdXQ6ICdhdXRoLXNlc3Npb24tdGltZW91dCcsXG4gICAgICAgIG5vdEF1dGhlbnRpY2F0ZWQ6ICdhdXRoLW5vdC1hdXRoZW50aWNhdGVkJyxcbiAgICAgICAgbm90QXV0aG9yaXplZDogJ2F1dGgtbm90LWF1dGhvcml6ZWQnXG4gICAgfSk7XG5cbiAgICBhcHAuZmFjdG9yeSgnQXV0aEludGVyY2VwdG9yJywgZnVuY3Rpb24gKCRyb290U2NvcGUsICRxLCBBVVRIX0VWRU5UUykge1xuICAgICAgICB2YXIgc3RhdHVzRGljdCA9IHtcbiAgICAgICAgICAgIDQwMTogQVVUSF9FVkVOVFMubm90QXV0aGVudGljYXRlZCxcbiAgICAgICAgICAgIDQwMzogQVVUSF9FVkVOVFMubm90QXV0aG9yaXplZCxcbiAgICAgICAgICAgIDQxOTogQVVUSF9FVkVOVFMuc2Vzc2lvblRpbWVvdXQsXG4gICAgICAgICAgICA0NDA6IEFVVEhfRVZFTlRTLnNlc3Npb25UaW1lb3V0XG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICByZXNwb25zZUVycm9yOiBmdW5jdGlvbiAocmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLiRicm9hZGNhc3Qoc3RhdHVzRGljdFtyZXNwb25zZS5zdGF0dXNdLCByZXNwb25zZSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuICRxLnJlamVjdChyZXNwb25zZSlcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9KTtcblxuICAgIGFwcC5jb25maWcoZnVuY3Rpb24gKCRodHRwUHJvdmlkZXIpIHtcbiAgICAgICAgJGh0dHBQcm92aWRlci5pbnRlcmNlcHRvcnMucHVzaChbXG4gICAgICAgICAgICAnJGluamVjdG9yJyxcbiAgICAgICAgICAgIGZ1bmN0aW9uICgkaW5qZWN0b3IpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gJGluamVjdG9yLmdldCgnQXV0aEludGVyY2VwdG9yJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIF0pO1xuICAgIH0pO1xuXG4gICAgYXBwLnNlcnZpY2UoJ0F1dGhTZXJ2aWNlJywgZnVuY3Rpb24gKCRodHRwLCBTZXNzaW9uLCAkcm9vdFNjb3BlLCBBVVRIX0VWRU5UUywgJHEpIHtcblxuICAgICAgICBmdW5jdGlvbiBvblN1Y2Nlc3NmdWxMb2dpbihyZXNwb25zZSkge1xuICAgICAgICAgICAgdmFyIHVzZXIgPSByZXNwb25zZS5kYXRhLnVzZXI7XG4gICAgICAgICAgICBTZXNzaW9uLmNyZWF0ZSh1c2VyKTtcbiAgICAgICAgICAgICRyb290U2NvcGUuJGJyb2FkY2FzdChBVVRIX0VWRU5UUy5sb2dpblN1Y2Nlc3MpO1xuICAgICAgICAgICAgcmV0dXJuIHVzZXI7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBVc2VzIHRoZSBzZXNzaW9uIGZhY3RvcnkgdG8gc2VlIGlmIGFuXG4gICAgICAgIC8vIGF1dGhlbnRpY2F0ZWQgdXNlciBpcyBjdXJyZW50bHkgcmVnaXN0ZXJlZC5cbiAgICAgICAgdGhpcy5pc0F1dGhlbnRpY2F0ZWQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gISFTZXNzaW9uLnVzZXI7XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5nZXRMb2dnZWRJblVzZXIgPSBmdW5jdGlvbiAoZnJvbVNlcnZlcikge1xuXG4gICAgICAgICAgICAvLyBJZiBhbiBhdXRoZW50aWNhdGVkIHNlc3Npb24gZXhpc3RzLCB3ZVxuICAgICAgICAgICAgLy8gcmV0dXJuIHRoZSB1c2VyIGF0dGFjaGVkIHRvIHRoYXQgc2Vzc2lvblxuICAgICAgICAgICAgLy8gd2l0aCBhIHByb21pc2UuIFRoaXMgZW5zdXJlcyB0aGF0IHdlIGNhblxuICAgICAgICAgICAgLy8gYWx3YXlzIGludGVyZmFjZSB3aXRoIHRoaXMgbWV0aG9kIGFzeW5jaHJvbm91c2x5LlxuXG4gICAgICAgICAgICAvLyBPcHRpb25hbGx5LCBpZiB0cnVlIGlzIGdpdmVuIGFzIHRoZSBmcm9tU2VydmVyIHBhcmFtZXRlcixcbiAgICAgICAgICAgIC8vIHRoZW4gdGhpcyBjYWNoZWQgdmFsdWUgd2lsbCBub3QgYmUgdXNlZC5cblxuICAgICAgICAgICAgaWYgKHRoaXMuaXNBdXRoZW50aWNhdGVkKCkgJiYgZnJvbVNlcnZlciAhPT0gdHJ1ZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiAkcS53aGVuKFNlc3Npb24udXNlcik7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIE1ha2UgcmVxdWVzdCBHRVQgL3Nlc3Npb24uXG4gICAgICAgICAgICAvLyBJZiBpdCByZXR1cm5zIGEgdXNlciwgY2FsbCBvblN1Y2Nlc3NmdWxMb2dpbiB3aXRoIHRoZSByZXNwb25zZS5cbiAgICAgICAgICAgIC8vIElmIGl0IHJldHVybnMgYSA0MDEgcmVzcG9uc2UsIHdlIGNhdGNoIGl0IGFuZCBpbnN0ZWFkIHJlc29sdmUgdG8gbnVsbC5cbiAgICAgICAgICAgIHJldHVybiAkaHR0cC5nZXQoJy9zZXNzaW9uJykudGhlbihvblN1Y2Nlc3NmdWxMb2dpbikuY2F0Y2goZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLmxvZ2luID0gZnVuY3Rpb24gKGNyZWRlbnRpYWxzKSB7XG4gICAgICAgICAgICByZXR1cm4gJGh0dHAucG9zdCgnL2xvZ2luJywgY3JlZGVudGlhbHMpXG4gICAgICAgICAgICAgICAgLnRoZW4ob25TdWNjZXNzZnVsTG9naW4pXG4gICAgICAgICAgICAgICAgLmNhdGNoKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuICRxLnJlamVjdCh7IG1lc3NhZ2U6ICdJbnZhbGlkIGxvZ2luIGNyZWRlbnRpYWxzLicgfSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5sb2dvdXQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gJGh0dHAuZ2V0KCcvbG9nb3V0JykudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgU2Vzc2lvbi5kZXN0cm95KCk7XG4gICAgICAgICAgICAgICAgJHJvb3RTY29wZS4kYnJvYWRjYXN0KEFVVEhfRVZFTlRTLmxvZ291dFN1Y2Nlc3MpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH07XG5cbiAgICB9KTtcblxuICAgIGFwcC5zZXJ2aWNlKCdTZXNzaW9uJywgZnVuY3Rpb24gKCRyb290U2NvcGUsIEFVVEhfRVZFTlRTKSB7XG5cbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgICAgICRyb290U2NvcGUuJG9uKEFVVEhfRVZFTlRTLm5vdEF1dGhlbnRpY2F0ZWQsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHNlbGYuZGVzdHJveSgpO1xuICAgICAgICB9KTtcblxuICAgICAgICAkcm9vdFNjb3BlLiRvbihBVVRIX0VWRU5UUy5zZXNzaW9uVGltZW91dCwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgc2VsZi5kZXN0cm95KCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHRoaXMudXNlciA9IG51bGw7XG5cbiAgICAgICAgdGhpcy5jcmVhdGUgPSBmdW5jdGlvbiAoc2Vzc2lvbklkLCB1c2VyKSB7XG4gICAgICAgICAgICB0aGlzLnVzZXIgPSB1c2VyO1xuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMuZGVzdHJveSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHRoaXMudXNlciA9IG51bGw7XG4gICAgICAgIH07XG5cbiAgICB9KTtcblxufSgpKTtcbiIsImFwcC5jb25maWcoZnVuY3Rpb24gKCRzdGF0ZVByb3ZpZGVyKSB7XG4gICAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2hvbWUnLCB7XG4gICAgICAgIHVybDogJy8nLFxuICAgICAgICB0ZW1wbGF0ZVVybDogJ2pzL2hvbWUvaG9tZS5odG1sJ1xuICAgIH0pO1xufSk7XG5cbmFwcC5jb250cm9sbGVyKCdDYXJvdXNlbEN0cmwnLCBmdW5jdGlvbiAoJHNjb3BlLCAkbG9nLCBQcm9kdWN0RmFjdG9yeSkge1xuXG4gICRzY29wZS50YWdzID0gW1xuICAgIHsgdGV4dDogJ2p1c3QnIH0sXG4gICAgeyB0ZXh0OiAnc29tZScgfSxcbiAgICB7IHRleHQ6ICdjb29sJyB9LFxuICAgIHsgdGV4dDogJ3RhZ3MnIH1cbiAgXTtcblxuICAkc2NvcGUubXlJbnRlcnZhbCA9IDUwMDA7XG4gICRzY29wZS5ub1dyYXBTbGlkZXMgPSBmYWxzZTtcbiAgJHNjb3BlLmFjdGl2ZSA9IDA7XG4gIHZhciBzbGlkZXMgPSAkc2NvcGUuc2xpZGVzID0gW107XG4gIHZhciBjdXJySW5kZXggPSAwO1xuXG4gICRzY29wZS5hZGRTbGlkZSA9IGZ1bmN0aW9uKCkge1xuICAgIHNsaWRlcy5wdXNoKHtcbiAgICAgIGltYWdlOiAnLy93d3cuY29kZXJtYXRjaC5tZS9hc3NldHMvQ29kZXItdy1CdWRkeS01YTgzZmQ1NzAyY2Y2N2Y1ZTkzNzA0YjZjNTMxNjIwMy5zdmcnLFxuICAgICAgdGV4dDogWydOaWNlIGltYWdlJywgJ0F3ZXNvbWUgcGhvdG9ncmFwaCcsICdUaGF0IGlzIHNvIGNvb2wnLCAnSSBsb3ZlIHRoYXQnXVtzbGlkZXMubGVuZ3RoICUgNF0sXG4gICAgICBpZDogY3VyckluZGV4KytcbiAgICB9KTtcbiAgfTtcblxuICBmb3IgKHZhciBpID0gMDsgaSA8IDQ7IGkrKykge1xuICAgICRzY29wZS5hZGRTbGlkZSgpO1xuICB9XG5cbn0pO1xuIiwiYXBwLmNvbmZpZyhmdW5jdGlvbiAoJHN0YXRlUHJvdmlkZXIpIHtcblxuICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdsb2dpbicsIHtcbiAgICAgICAgdXJsOiAnL2xvZ2luJyxcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdqcy9sb2dpbi9sb2dpbi5odG1sJyxcbiAgICAgICAgY29udHJvbGxlcjogJ0xvZ2luQ3RybCdcbiAgICB9KTtcblxufSk7XG5cbmFwcC5jb250cm9sbGVyKCdMb2dpbkN0cmwnLCBmdW5jdGlvbiAoJHNjb3BlLCBBdXRoU2VydmljZSwgJHN0YXRlKSB7XG5cbiAgICAkc2NvcGUubG9naW4gPSB7fTtcbiAgICAkc2NvcGUuZXJyb3IgPSBudWxsO1xuXG4gICAgJHNjb3BlLnNlbmRMb2dpbiA9IGZ1bmN0aW9uIChsb2dpbkluZm8pIHtcblxuICAgICAgICAkc2NvcGUuZXJyb3IgPSBudWxsO1xuXG4gICAgICAgIEF1dGhTZXJ2aWNlLmxvZ2luKGxvZ2luSW5mbylcbiAgICAgICAgLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgJHN0YXRlLmdvKCdob21lJyk7XG4gICAgICAgIH0pXG4gICAgICAgIC5jYXRjaChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAkc2NvcGUuZXJyb3IgPSAnSW52YWxpZCBsb2dpbiBjcmVkZW50aWFscy4nO1xuICAgICAgICB9KTtcblxuICAgIH07XG5cbn0pO1xuIiwiYXBwLmNvbmZpZyhmdW5jdGlvbiAoJHN0YXRlUHJvdmlkZXIpIHtcblxuICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdtZW1iZXJzT25seScsIHtcbiAgICAgICAgdXJsOiAnL21lbWJlcnMtYXJlYScsXG4gICAgICAgIHRlbXBsYXRlOiAnPGltZyBuZy1yZXBlYXQ9XCJpdGVtIGluIHN0YXNoXCIgd2lkdGg9XCIzMDBcIiBuZy1zcmM9XCJ7eyBpdGVtIH19XCIgLz4nLFxuICAgICAgICBjb250cm9sbGVyOiBmdW5jdGlvbiAoJHNjb3BlLCBTZWNyZXRTdGFzaCkge1xuICAgICAgICAgICAgU2VjcmV0U3Rhc2guZ2V0U3Rhc2goKS50aGVuKGZ1bmN0aW9uIChzdGFzaCkge1xuICAgICAgICAgICAgICAgICRzY29wZS5zdGFzaCA9IHN0YXNoO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG4gICAgICAgIC8vIFRoZSBmb2xsb3dpbmcgZGF0YS5hdXRoZW50aWNhdGUgaXMgcmVhZCBieSBhbiBldmVudCBsaXN0ZW5lclxuICAgICAgICAvLyB0aGF0IGNvbnRyb2xzIGFjY2VzcyB0byB0aGlzIHN0YXRlLiBSZWZlciB0byBhcHAuanMuXG4gICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgIGF1dGhlbnRpY2F0ZTogdHJ1ZVxuICAgICAgICB9XG4gICAgfSk7XG5cbn0pO1xuXG5hcHAuZmFjdG9yeSgnU2VjcmV0U3Rhc2gnLCBmdW5jdGlvbiAoJGh0dHApIHtcblxuICAgIHZhciBnZXRTdGFzaCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuICRodHRwLmdldCgnL2FwaS9tZW1iZXJzL3NlY3JldC1zdGFzaCcpLnRoZW4oZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICByZXR1cm4gcmVzcG9uc2UuZGF0YTtcbiAgICAgICAgfSk7XG4gICAgfTtcblxuICAgIHJldHVybiB7XG4gICAgICAgIGdldFN0YXNoOiBnZXRTdGFzaFxuICAgIH07XG5cbn0pO1xuIiwiYXBwLmNvbmZpZyhmdW5jdGlvbiAoJHN0YXRlUHJvdmlkZXIpIHtcbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgncHJvZHVjdCcsIHtcbiAgICAgICAgdXJsOiAnL3Byb2R1Y3QnLFxuICAgICAgICBjb250cm9sbGVyOiAnUHJvZHVjdENvbnRyb2xsZXInLFxuICAgICAgICB0ZW1wbGF0ZVVybDogJ2pzL3Byb2R1Y3QvcHJvZHVjdC5odG1sJ1xuICAgIH0pO1xufSk7XG5cblxuYXBwLmNvbmZpZyhmdW5jdGlvbiAoJHN0YXRlUHJvdmlkZXIpIHtcbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgncHJvZHVjdC5kZXNjcmlwdGlvbicsIHtcbiAgICAgICAgdXJsOiAnL2Rlc2NyaXB0aW9uJyxcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdqcy9wcm9kdWN0L3Byb2R1Y3QtZGVzY3JpcHRpb24uaHRtbCdcbiAgICB9KTtcbn0pO1xuXG5cbmFwcC5jb25maWcoZnVuY3Rpb24gKCRzdGF0ZVByb3ZpZGVyKSB7XG4gICAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ3Byb2R1Y3QucmV2aWV3Jywge1xuICAgICAgICB1cmw6ICcvcmV2aWV3JyxcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdqcy9wcm9kdWN0L3Byb2R1Y3QtcmV2aWV3Lmh0bWwnXG4gICAgfSk7XG59KTtcblxuXG5cbmFwcC5jb250cm9sbGVyKCdQcm9kdWN0Q29udHJvbGxlcicsIGZ1bmN0aW9uICgkc2NvcGUsIFByb2R1Y3RGYWN0b3J5LCBDYXJ0RmFjdG9yeSwgJGxvZykge1xuICAgIFxuICAgIFByb2R1Y3RGYWN0b3J5LmdldEFsbEZyaWVuZHMoKVxuICAgIC50aGVuKGZ1bmN0aW9uKGFsbEZyaWVuZHMpIHtcbiAgICAgICAgJHNjb3BlLmFsbEZyaWVuZHMgPSBhbGxGcmllbmRzO1xuICAgIH0pXG4gICAgLmNhdGNoKCRsb2cuZXJyb3IpO1xuXG4gICAgJHNjb3BlLmdldE51bVJldmlld3MgPSBQcm9kdWN0RmFjdG9yeS5nZXROdW1SZXZpZXdzO1xuXG5cbiAgICAkc2NvcGUuYWRkVG9DYXJ0ID0gZnVuY3Rpb24oZnJpZW5kSWQpe1xuICAgICAgICBDYXJ0RmFjdG9yeS5hZGRGcmllbmRUb0NhcnQoZnJpZW5kSWQpXG4gICAgICAgIC50aGVuKGZ1bmN0aW9uKGNhcnQpe1xuICAgICAgICAgICRzY29wZS5pdGVtcyA9IGNhcnQuaXRlbXM7XG4gICAgICAgICAgJHNjb3BlLnRvdGFsID0gY2FydC50b3RhbDtcbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKCRsb2cuZXJyb3IpO1xuICAgIH1cblxuXG59KTtcblxuIiwiYXBwLmNvbmZpZyhmdW5jdGlvbigkc3RhdGVQcm92aWRlcikge1xuXHQkc3RhdGVQcm92aWRlci5zdGF0ZSgnc2lnbnVwJywge1xuXHRcdHVybDogJy9zaWdudXAnLFxuXHRcdHRlbXBsYXRlVXJsOiAnanMvc2lnbnVwL3NpZ251cC5odG1sJyxcblx0XHRjb250cm9sbGVyOiAnU2lnblVwQ3RybCdcblx0fSk7XG59KTtcblxuLy8gTkVFRCBUTyBVU0UgRk9STSBWQUxJREFUSU9OUyBGT1IgRU1BSUwsIEFERFJFU1MsIEVUQ1xuYXBwLmNvbnRyb2xsZXIoJ1NpZ25VcEN0cmwnLCBmdW5jdGlvbigkc2NvcGUsICRzdGF0ZSwgJGh0dHAsIEF1dGhTZXJ2aWNlKSB7XG5cdC8vIEdldCBmcm9tIG5nLW1vZGVsIGluIHNpZ251cC5odG1sXG5cdCRzY29wZS5zaWduVXAgPSB7fTtcblx0JHNjb3BlLmNoZWNrSW5mbyA9IHt9O1xuXHQkc2NvcGUuZXJyb3IgPSBudWxsO1xuXG5cdCRzY29wZS5zZW5kU2lnblVwID0gZnVuY3Rpb24oc2lnblVwSW5mbykge1xuXHRcdCRzY29wZS5lcnJvciA9IG51bGw7XG5cblx0XHRpZiAoJHNjb3BlLnNpZ25VcC5wYXNzd29yZCAhPT0gJHNjb3BlLmNoZWNrSW5mby5wYXNzd29yZENvbmZpcm0pIHtcblx0XHRcdCRzY29wZS5lcnJvciA9ICdQYXNzd29yZHMgZG8gbm90IG1hdGNoLCBwbGVhc2UgcmUtZW50ZXIgcGFzc3dvcmQuJztcblx0XHR9XG5cdFx0ZWxzZSB7XG5cdFx0XHQkaHR0cC5wb3N0KCcvc2lnbnVwJywgc2lnblVwSW5mbylcblx0XHRcdC50aGVuKGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRBdXRoU2VydmljZS5sb2dpbihzaWduVXBJbmZvKVxuXHRcdFx0XHQudGhlbihmdW5jdGlvbigpIHtcblx0XHRcdFx0XHQkc3RhdGUuZ28oJ2hvbWUnKTtcblx0XHRcdFx0fSk7XG5cdFx0XHR9KVxuXHRcdFx0LmNhdGNoKGZ1bmN0aW9uKCkge1xuXHRcdFx0XHQkc2NvcGUuZXJyb3IgPSAnSW52YWxpZCBzaWdudXAgY3JlZGVudGlhbHMuJztcblx0XHRcdH0pXG5cdFx0fVxuXHR9XG59KTtcbiIsImFwcC5mYWN0b3J5KCdDYXJ0RmFjdG9yeScsIGZ1bmN0aW9uKCRodHRwLCAkbG9nKXtcbiAgZnVuY3Rpb24gZ2V0Q2FydEl0ZW1zKCl7XG4gICAgdmFyIGN1cnJlbnRJdGVtcyA9IGxvY2FsU3RvcmFnZS5nZXRJdGVtKCdjYXJ0SXRlbXMnKTtcbiAgICBpZiAoY3VycmVudEl0ZW1zKSByZXR1cm4gW10uc2xpY2UuY2FsbChKU09OLnBhcnNlKGN1cnJlbnRJdGVtcykpO1xuICAgIGVsc2UgcmV0dXJuIFtdO1xuICB9XG5cbiAgZnVuY3Rpb24gZ2V0Q2FydFRvdGFsKCl7XG4gICAgdmFyIGN1cnJlbnRUb3RhbCA9IGxvY2FsU3RvcmFnZS5nZXRJdGVtKCdjYXJ0VG90YWwnKTtcbiAgICBpZiAoY3VycmVudFRvdGFsKSByZXR1cm4gSlNPTi5wYXJzZShjdXJyZW50VG90YWwpO1xuICAgIGVsc2UgcmV0dXJuIDA7XG4gIH1cblxuICB2YXIgY2FjaGVkQ2FydEl0ZW1zID0gZ2V0Q2FydEl0ZW1zKCk7XG4gIHZhciBjYWNoZWRDYXJ0VG90YWwgPSBnZXRDYXJ0VG90YWwoKTtcblxuICBmdW5jdGlvbiBjYWxjdWxhdGVUb3RhbChpdGVtc0FycmF5KXtcbiAgICByZXR1cm4gaXRlbXNBcnJheS5yZWR1Y2UoZnVuY3Rpb24oYSwgYil7XG4gICAgICByZXR1cm4gYSArIGIucHJpY2U7XG4gICAgfSwgMCk7XG4gIH1cblxuICBmdW5jdGlvbiBtYWtlSlNPTihhcnJheSl7XG4gIC8vY29udmVydCB0aGUgaXRlbXMgYXJyYXkgaW50byBhIGpzb24gc3RyaW5nIG9mIGFuIGFycmF5LWxpa2Ugb2JqZWN0XG4gICAgcmV0dXJuIEpTT04uc3RyaW5naWZ5KE9iamVjdC5hc3NpZ24oe2xlbmd0aDogYXJyYXkubGVuZ3RofSwgYXJyYXkpKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGNsZWFyQ2FydCgpe1xuICAgIGNhY2hlZENhcnRJdGVtcyA9IFtdO1xuICAgIGNhY2hlZENhcnRUb3RhbCA9IDA7XG4gICAgbG9jYWxTdG9yYWdlLnJlbW92ZUl0ZW0oJ2NhcnRJdGVtcycpO1xuICAgIGxvY2FsU3RvcmFnZS5yZW1vdmVJdGVtKCdjYXJ0VG90YWwnKTtcbiAgfVxuXG4gIHJldHVybiB7XG4gICAgZ2V0VXNlckNhcnQ6IGZ1bmN0aW9uKCl7XG4gICAgICByZXR1cm4gJGh0dHAuZ2V0KCcvYXBpL2NhcnQnKVxuICAgICAgLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICBpZiAodHlwZW9mIHJlc3BvbnNlLmRhdGEgPT09ICdvYmplY3QnKSB7XG4gICAgICAgICAgY2FjaGVkQ2FydEl0ZW1zID0gY2FjaGVkQ2FydEl0ZW1zLmNvbmNhdChyZXNwb25zZS5kYXRhKTtcbiAgICAgICAgICAvL3VwZGF0ZSBsb2NhbCBzdG9yYWdlIHRvIHJlbGVjdCB0aGUgY2FjaGVkIHZhbHVlc1xuICAgICAgICAgIGNhY2hlZENhcnRUb3RhbCA9IGNhbGN1bGF0ZVRvdGFsKGNhY2hlZENhcnRJdGVtcylcbiAgICAgICAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbSgnY2FydEl0ZW1zJywgbWFrZUpTT04oY2FjaGVkQ2FydEl0ZW1zKSk7XG4gICAgICAgICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oJ2NhcnRUb3RhbCcsIGNhY2hlZENhcnRUb3RhbCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHtpdGVtczogY2FjaGVkQ2FydEl0ZW1zLCB0b3RhbDogY2FjaGVkQ2FydFRvdGFsfTtcbiAgICAgIH0pXG4gICAgICAuY2F0Y2goJGxvZy5lcnJvcilcbiAgICB9LFxuICAgIGFkZEZyaWVuZFRvQ2FydDogZnVuY3Rpb24oZnJpZW5kSWQpe1xuICAgICAgcmV0dXJuICRodHRwLmdldCgnL2FwaS9mcmllbmRzLycgKyBmcmllbmRJZClcbiAgICAgIC50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgdmFyIGZyaWVuZCA9IHJlc3BvbnNlLmRhdGE7XG4gICAgICAgIGNhY2hlZENhcnRUb3RhbCArPSBmcmllbmQucHJpY2U7XG4gICAgICAgIGNhY2hlZENhcnRJdGVtcy5wdXNoKHtmcmllbmRJZDogZnJpZW5kLmlkLCBuYW1lOiBmcmllbmQubmFtZSwgcHJpY2U6IGZyaWVuZC5wcmljZSwgaG91cnM6IGZyaWVuZC5udW1Ib3Vyc30pO1xuICAgICAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbSgnY2FydFRvdGFsJywgY2FjaGVkQ2FydFRvdGFsKTtcbiAgICAgICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oJ2NhcnRJdGVtcycsIG1ha2VKU09OKGNhY2hlZENhcnRJdGVtcykpO1xuICAgICAgICByZXR1cm4ge2l0ZW1zOiBjYWNoZWRDYXJ0SXRlbXMsIHRvdGFsOiBjYWNoZWRDYXJ0VG90YWx9O1xuICAgICAgfSlcbiAgICAgIC5jYXRjaCgkbG9nLmVycm9yKTtcbiAgICB9LFxuICAgIHNhdmVDYXJ0OiBmdW5jdGlvbigpe1xuICAgICAgcmV0dXJuICRodHRwLnBvc3QoJy9hcGkvY2FydCcsIHtpdGVtczogY2FjaGVkQ2FydEl0ZW1zfSlcbiAgICAgIC50aGVuKGZ1bmN0aW9uKCl7XG4gICAgICAgIGNsZWFyQ2FydCgpO1xuICAgICAgfSlcbiAgICAgIC5jYXRjaCgkbG9nLmVycm9yKTtcbiAgICB9LFxuICAgIGdldEl0ZW1zOiBmdW5jdGlvbigpe1xuICAgICAgcmV0dXJuIGNhY2hlZENhcnRJdGVtcztcbiAgICB9LFxuICAgIGdldFRvdGFsOiBmdW5jdGlvbigpe1xuICAgICAgcmV0dXJuIGNhY2hlZENhcnRUb3RhbDtcbiAgICB9LFxuICAgIGNsZWFyQ2FydDogZnVuY3Rpb24oKXtcbiAgICAgIGNsZWFyQ2FydCgpO1xuICAgICAgcmV0dXJuIHtpdGVtczogY2FjaGVkQ2FydEl0ZW1zLCB0b3RhbDogY2FjaGVkQ2FydFRvdGFsfTtcbiAgICB9LFxuICAgIGRlbGV0ZUl0ZW06IGZ1bmN0aW9uKGZyaWVuZElkKXtcbiAgICAgIHZhciBpbmRleCA9IGNhY2hlZENhcnRJdGVtcy5maW5kSW5kZXgoZnVuY3Rpb24oaXRlbSl7XG4gICAgICAgIHJldHVybiBpdGVtLmZyaWVuZElkID09PSBmcmllbmRJZDtcbiAgICAgIH0pO1xuICAgICAgY2FjaGVkQ2FydEl0ZW1zLnNwbGljZShpbmRleCwgMSk7XG4gICAgICBjYWNoZWRDYXJ0VG90YWwgPSBjYWxjdWxhdGVUb3RhbChjYWNoZWRDYXJ0SXRlbXMpO1xuICAgICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oJ2NhcnRUb3RhbCcsIGNhY2hlZENhcnRUb3RhbCk7XG4gICAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbSgnY2FydEl0ZW1zJywgbWFrZUpTT04oY2FjaGVkQ2FydEl0ZW1zKSk7XG5cbiAgICAgIHJldHVybiB7aXRlbXM6IGNhY2hlZENhcnRJdGVtcywgdG90YWw6IGNhY2hlZENhcnRUb3RhbH07XG4gICAgfSxcbiAgICBwdXJjaGFzZTogZnVuY3Rpb24oKXtcbiAgICAgIHJldHVybiAkaHR0cC5wb3N0KCcvYXBpL2NhcnQvcHVyY2hhc2UnLCB7aXRlbXM6IGNhY2hlZENhcnRJdGVtc30pXG4gICAgICAudGhlbihmdW5jdGlvbihyZXNwb25zZSl7XG4gICAgICAgIGNsZWFyQ2FydCgpO1xuICAgICAgICByZXR1cm4gcmVzcG9uc2UuZGF0YTtcbiAgICAgIH0pXG4gICAgICAuY2F0Y2goJGxvZy5lcnJvcik7XG4gICAgfVxuICB9XG59KTtcbiIsImFwcC5mYWN0b3J5KCdDaGVja291dEZhY3RvcnknLCBmdW5jdGlvbigkaHR0cCwgJGxvZyl7XG5cdHZhciBjaGVja291dEZhY3QgPSB7fTtcblx0cmV0dXJuIGNoZWNrb3V0RmFjdDtcbn0pO1xuIiwiYXBwLmZhY3RvcnkoJ1Byb2R1Y3RGYWN0b3J5JywgZnVuY3Rpb24oJGh0dHAsICRsb2cpe1xuXG4gIHJldHVybiB7XG5cbiAgICBnZXRBbGxGcmllbmRzOiBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiAkaHR0cC5nZXQoJy9hcGkvZnJpZW5kcycpXG4gICAgICAudGhlbihmdW5jdGlvbihyZXNwb25zZSkge1xuICAgICAgICByZXR1cm4gcmVzcG9uc2UuZGF0YTtcbiAgICAgIH0pXG4gICAgICAuY2F0Y2goJGxvZy5lcnJvcik7XG4gICAgfSxcblxuICAgIGdldEZyaWVuZDogZnVuY3Rpb24oZnJpZW5kSWQpIHtcbiAgICAgIHJldHVybiAkaHR0cC5nZXQoJy9hcGkvZnJpZW5kcy8nICsgZnJpZW5kSWQpXG4gICAgICAudGhlbihmdW5jdGlvbihyZXNwb25zZSl7XG4gICAgICAgIHJldHVybiByZXNwb25zZS5kYXRhO1xuICAgICAgfSlcbiAgICAgIC5jYXRjaCgkbG9nLmVycm9yKVxuICAgIH0sXG5cbiAgICAvLyBmcmllbmRSYXRpbmc6IGZ1bmN0aW9uXG5cbiAgICBnZXROdW1SZXZpZXdzOiBmdW5jdGlvbihmcmllbmRJZCkge1xuICAgICAgcmV0dXJuICRodHRwLmdldCgnL2FwaS9mcmllbmRzLycgKyBmcmllbmRJZCArICcvZmVlZGJhY2snKVxuICAgICAgLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2UpIHtcbiAgICAgICAgcmV0dXJuIHJlc3BvbnNlLmRhdGEuY291bnQ7XG4gICAgICB9KVxuICAgICAgLmNhdGNoKCRsb2cuZXJyb3IpXG4gICAgfSxcblxuICAgIC8vIGdldFJhdGluZzogZnVuY3Rpb24oZnJpZW5kSWQpIHtcblxuICAgIC8vIH1cblxuXG4gIH07IC8vZW5kIG9mIHJldHVyblxuXG59KTtcbiIsImFwcC5kaXJlY3RpdmUoJ2dyYWNlaG9wcGVyTG9nbycsIGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4ge1xuICAgICAgICByZXN0cmljdDogJ0UnLFxuICAgICAgICB0ZW1wbGF0ZVVybDogJ2pzL2NvbW1vbi9kaXJlY3RpdmVzL2dyYWNlaG9wcGVyLWxvZ28vZ3JhY2Vob3BwZXItbG9nby5odG1sJ1xuICAgIH07XG59KTtcbiIsImFwcC5kaXJlY3RpdmUoJ25hdmJhcicsIGZ1bmN0aW9uICgkcm9vdFNjb3BlLCBBdXRoU2VydmljZSwgQVVUSF9FVkVOVFMsICRzdGF0ZSwgQ2FydEZhY3RvcnksICRsb2cpIHtcblxuICAgIHJldHVybiB7XG4gICAgICAgIHJlc3RyaWN0OiAnRScsXG4gICAgICAgIHNjb3BlOiB7fSxcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdqcy9jb21tb24vZGlyZWN0aXZlcy9uYXZiYXIvbmF2YmFyLmh0bWwnLFxuICAgICAgICBsaW5rOiBmdW5jdGlvbiAoc2NvcGUpIHtcblxuICAgICAgICAgICAgc2NvcGUuaXRlbXMgPSBbXG4gICAgICAgICAgICAgICAgeyBsYWJlbDogJ0hvbWUnLCBzdGF0ZTogJ2hvbWUnIH0sXG4gICAgICAgICAgICAgICAgeyBsYWJlbDogJ0Fib3V0Jywgc3RhdGU6ICdhYm91dCcgfSxcbiAgICAgICAgICAgICAgICB7IGxhYmVsOiAnQ2hlY2tvdXQnLCBzdGF0ZTogJ2NhcnQnIH0sXG4gICAgICAgICAgICAgICAgeyBsYWJlbDogJ01lbWJlcnMgT25seScsIHN0YXRlOiAnbWVtYmVyc09ubHknLCBhdXRoOiB0cnVlIH1cbiAgICAgICAgICAgIF07XG5cbiAgICAgICAgICAgIHNjb3BlLnVzZXIgPSBudWxsO1xuXG4gICAgICAgICAgICBzY29wZS5pc0xvZ2dlZEluID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBBdXRoU2VydmljZS5pc0F1dGhlbnRpY2F0ZWQoKTtcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIHNjb3BlLmxvZ291dCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBDYXJ0RmFjdG9yeS5zYXZlQ2FydCgpXG4gICAgICAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24oKXtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIEF1dGhTZXJ2aWNlLmxvZ291dCgpO1xuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICRzdGF0ZS5nbygnaG9tZScpO1xuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgLmNhdGNoKCRsb2cuZXJyb3IpO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgdmFyIHNldFVzZXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgQXV0aFNlcnZpY2UuZ2V0TG9nZ2VkSW5Vc2VyKCkudGhlbihmdW5jdGlvbiAodXNlcikge1xuICAgICAgICAgICAgICAgICAgICBzY29wZS51c2VyID0gdXNlcjtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIHZhciByZW1vdmVVc2VyID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHNjb3BlLnVzZXIgPSBudWxsO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgc2V0VXNlcigpO1xuXG4gICAgICAgICAgICAkcm9vdFNjb3BlLiRvbihBVVRIX0VWRU5UUy5sb2dpblN1Y2Nlc3MsIHNldFVzZXIpO1xuICAgICAgICAgICAgJHJvb3RTY29wZS4kb24oQVVUSF9FVkVOVFMubG9nb3V0U3VjY2VzcywgcmVtb3ZlVXNlcik7XG4gICAgICAgICAgICAkcm9vdFNjb3BlLiRvbihBVVRIX0VWRU5UUy5zZXNzaW9uVGltZW91dCwgcmVtb3ZlVXNlcik7XG5cbiAgICAgICAgfVxuXG4gICAgfTtcblxufSk7XG5cbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==
=======
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyIsImFib3V0L2Fib3V0LmpzIiwiY2FydC9jYXJ0LmpzIiwiY2hlY2tvdXQvY2hlY2tvdXQuanMiLCJkb2NzL2RvY3MuanMiLCJmc2EvZnNhLXByZS1idWlsdC5qcyIsImhvbWUvaG9tZS5qcyIsImxvZ2luL2xvZ2luLmpzIiwibWVtYmVycy1vbmx5L21lbWJlcnMtb25seS5qcyIsInByb2R1Y3QvcHJvZHVjdC5qcyIsInNpZ251cC9zaWdudXAuanMiLCJjb21tb24vZmFjdG9yaWVzL0NhcnRGYWN0b3J5LmpzIiwiY29tbW9uL2ZhY3Rvcmllcy9DaGVja291dEZhY3RvcnkuanMiLCJjb21tb24vZmFjdG9yaWVzL1Byb2R1Y3RGYWN0b3J5LmpzIiwiY29tbW9uL2RpcmVjdGl2ZXMvZ3JhY2Vob3BwZXItbG9nby9ncmFjZWhvcHBlci1sb2dvLmpzIiwiY29tbW9uL2RpcmVjdGl2ZXMvbmF2YmFyL25hdmJhci5qcyJdLCJuYW1lcyI6WyJ3aW5kb3ciLCJhcHAiLCJhbmd1bGFyIiwibW9kdWxlIiwiY29uZmlnIiwiJHVybFJvdXRlclByb3ZpZGVyIiwiJGxvY2F0aW9uUHJvdmlkZXIiLCJodG1sNU1vZGUiLCJvdGhlcndpc2UiLCJ3aGVuIiwibG9jYXRpb24iLCJyZWxvYWQiLCJydW4iLCIkcm9vdFNjb3BlIiwiQXV0aFNlcnZpY2UiLCIkc3RhdGUiLCJkZXN0aW5hdGlvblN0YXRlUmVxdWlyZXNBdXRoIiwic3RhdGUiLCJkYXRhIiwiYXV0aGVudGljYXRlIiwiJG9uIiwiZXZlbnQiLCJ0b1N0YXRlIiwidG9QYXJhbXMiLCJpc0F1dGhlbnRpY2F0ZWQiLCJwcmV2ZW50RGVmYXVsdCIsImdldExvZ2dlZEluVXNlciIsInRoZW4iLCJ1c2VyIiwiZ28iLCJuYW1lIiwiJHN0YXRlUHJvdmlkZXIiLCJ1cmwiLCJjb250cm9sbGVyIiwidGVtcGxhdGVVcmwiLCIkc2NvcGUiLCJGdWxsc3RhY2tQaWNzIiwiaW1hZ2VzIiwiXyIsInNodWZmbGUiLCJDYXJ0RmFjdG9yeSIsIiRsb2ciLCJpdGVtcyIsImdldEl0ZW1zIiwidG90YWwiLCJnZXRUb3RhbCIsImdldFVzZXJDYXJ0IiwiY2FydCIsImNhdGNoIiwiZXJyb3IiLCJhZGRUb0NhcnQiLCJmcmllbmRJZCIsImFkZEZyaWVuZFRvQ2FydCIsImNsZWFyQ2FydCIsInNhdmVDYXJ0IiwiZGVsZXRlSXRlbSIsInB1cmNoYXNlIiwib3JkZXIiLCJuZXdPcmRlciIsIkVycm9yIiwiZmFjdG9yeSIsImlvIiwib3JpZ2luIiwiY29uc3RhbnQiLCJsb2dpblN1Y2Nlc3MiLCJsb2dpbkZhaWxlZCIsImxvZ291dFN1Y2Nlc3MiLCJzZXNzaW9uVGltZW91dCIsIm5vdEF1dGhlbnRpY2F0ZWQiLCJub3RBdXRob3JpemVkIiwiJHEiLCJBVVRIX0VWRU5UUyIsInN0YXR1c0RpY3QiLCJyZXNwb25zZUVycm9yIiwicmVzcG9uc2UiLCIkYnJvYWRjYXN0Iiwic3RhdHVzIiwicmVqZWN0IiwiJGh0dHBQcm92aWRlciIsImludGVyY2VwdG9ycyIsInB1c2giLCIkaW5qZWN0b3IiLCJnZXQiLCJzZXJ2aWNlIiwiJGh0dHAiLCJTZXNzaW9uIiwib25TdWNjZXNzZnVsTG9naW4iLCJjcmVhdGUiLCJmcm9tU2VydmVyIiwibG9naW4iLCJjcmVkZW50aWFscyIsInBvc3QiLCJtZXNzYWdlIiwibG9nb3V0IiwiZGVzdHJveSIsInNlbGYiLCJzZXNzaW9uSWQiLCJQcm9kdWN0RmFjdG9yeSIsInRhZ3MiLCJ0ZXh0IiwibXlJbnRlcnZhbCIsIm5vV3JhcFNsaWRlcyIsImFjdGl2ZSIsInNsaWRlcyIsImN1cnJJbmRleCIsImFkZFNsaWRlIiwibmV3V2lkdGgiLCJsZW5ndGgiLCJpbWFnZSIsImlkIiwicmFuZG9taXplIiwiaW5kZXhlcyIsImdlbmVyYXRlSW5kZXhlc0FycmF5IiwiYXNzaWduTmV3SW5kZXhlc1RvU2xpZGVzIiwiaSIsImwiLCJwb3AiLCJhcnJheSIsInRtcCIsImN1cnJlbnQiLCJ0b3AiLCJNYXRoIiwiZmxvb3IiLCJyYW5kb20iLCJzZW5kTG9naW4iLCJsb2dpbkluZm8iLCJ0ZW1wbGF0ZSIsIlNlY3JldFN0YXNoIiwiZ2V0U3Rhc2giLCJzdGFzaCIsIiRzdGF0ZVBhcmFtcyIsImdldEFsbEZyaWVuZHMiLCJhbGxGcmllbmRzIiwiZ2V0TnVtUmV2aWV3cyIsImdldEZyaWVuZCIsImZyaWVuZCIsInNpZ25VcCIsImNoZWNrSW5mbyIsInNlbmRTaWduVXAiLCJzaWduVXBJbmZvIiwicGFzc3dvcmQiLCJwYXNzd29yZENvbmZpcm0iLCJnZXRDYXJ0SXRlbXMiLCJjdXJyZW50SXRlbXMiLCJsb2NhbFN0b3JhZ2UiLCJnZXRJdGVtIiwic2xpY2UiLCJjYWxsIiwiSlNPTiIsInBhcnNlIiwiZ2V0Q2FydFRvdGFsIiwiY3VycmVudFRvdGFsIiwiY2FjaGVkQ2FydEl0ZW1zIiwiY2FjaGVkQ2FydFRvdGFsIiwiY2FsY3VsYXRlVG90YWwiLCJpdGVtc0FycmF5IiwicmVkdWNlIiwiYSIsImIiLCJwcmljZSIsIm1ha2VKU09OIiwic3RyaW5naWZ5IiwiT2JqZWN0IiwiYXNzaWduIiwicmVtb3ZlSXRlbSIsImNvbmNhdCIsInNldEl0ZW0iLCJob3VycyIsIm51bUhvdXJzIiwiaW5kZXgiLCJmaW5kSW5kZXgiLCJpdGVtIiwic3BsaWNlIiwiY2hlY2tvdXRGYWN0IiwiY291bnQiLCJkaXJlY3RpdmUiLCJyZXN0cmljdCIsInNjb3BlIiwibGluayIsImxhYmVsIiwiYXV0aCIsImlzTG9nZ2VkSW4iLCJzZXRVc2VyIiwicmVtb3ZlVXNlciJdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7QUFDQUEsT0FBQUMsR0FBQSxHQUFBQyxRQUFBQyxNQUFBLENBQUEsdUJBQUEsRUFBQSxDQUFBLGFBQUEsRUFBQSxXQUFBLEVBQUEsY0FBQSxFQUFBLFdBQUEsRUFBQSxhQUFBLENBQUEsQ0FBQTs7QUFFQUYsSUFBQUcsTUFBQSxDQUFBLFVBQUFDLGtCQUFBLEVBQUFDLGlCQUFBLEVBQUE7QUFDQTtBQUNBQSxzQkFBQUMsU0FBQSxDQUFBLElBQUE7QUFDQTtBQUNBRix1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QUE7QUFDQVosMkJBQUFjLEVBQUEsQ0FBQSxNQUFBO0FBQ0EsaUJBTkEsRUFPQW1CLEtBUEEsQ0FPQVAsS0FBQVEsS0FQQTtBQVFBLGFBVEE7O0FBV0EsZ0JBQUFxSSxVQUFBLFNBQUFBLE9BQUEsR0FBQTtBQUNBeEssNEJBQUFZLGVBQUEsR0FBQUMsSUFBQSxDQUFBLFVBQUFDLElBQUEsRUFBQTtBQUNBcUosMEJBQUFySixJQUFBLEdBQUFBLElBQUE7QUFDQSxpQkFGQTtBQUdBLGFBSkE7O0FBTUEsZ0JBQUEySixhQUFBLFNBQUFBLFVBQUEsR0FBQTtBQUNBTixzQkFBQXJKLElBQUEsR0FBQSxJQUFBO0FBQ0EsYUFGQTs7QUFJQTBKOztBQUVBekssdUJBQUFPLEdBQUEsQ0FBQW1ELFlBQUFQLFlBQUEsRUFBQXNILE9BQUE7QUFDQXpLLHVCQUFBTyxHQUFBLENBQUFtRCxZQUFBTCxhQUFBLEVBQUFxSCxVQUFBO0FBQ0ExSyx1QkFBQU8sR0FBQSxDQUFBbUQsWUFBQUosY0FBQSxFQUFBb0gsVUFBQTtBQUVBOztBQTlDQSxLQUFBO0FBa0RBLENBcERBIiwiZmlsZSI6Im1haW4uanMiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCc7XG53aW5kb3cuYXBwID0gYW5ndWxhci5tb2R1bGUoJ0Z1bGxzdGFja0dlbmVyYXRlZEFwcCcsIFsnZnNhUHJlQnVpbHQnLCAndWkucm91dGVyJywgJ3VpLmJvb3RzdHJhcCcsICduZ0FuaW1hdGUnLCAnbmdUYWdzSW5wdXQnXSk7XG5cbmFwcC5jb25maWcoZnVuY3Rpb24gKCR1cmxSb3V0ZXJQcm92aWRlciwgJGxvY2F0aW9uUHJvdmlkZXIpIHtcbiAgICAvLyBUaGlzIHR1cm5zIG9mZiBoYXNoYmFuZyB1cmxzICgvI2Fib3V0KSBhbmQgY2hhbmdlcyBpdCB0byBzb21ldGhpbmcgbm9ybWFsICgvYWJvdXQpXG4gICAgJGxvY2F0aW9uUHJvdmlkZXIuaHRtbDVNb2RlKHRydWUpO1xuICAgIC8vIElmIHdlIGdvIHRvIGEgVVJMIHRoYXQgdWktcm91dGVyIGRvZXNuJ3QgaGF2ZSByZWdpc3RlcmVkLCBnbyB0byB0aGUgXCIvXCIgdXJsLlxuICAgICR1cmxSb3V0ZXJQcm92aWRlci5vdGhlcndpc2UoJy8nKTtcbiAgICAvLyBUcmlnZ2VyIHBhZ2UgcmVmcmVzaCB3aGVuIGFjY2Vzc2luZyBhbiBPQXV0aCByb3V0ZVxuICAgICR1cmxSb3V0ZXJQcm92aWRlci53aGVuKCcvYXV0aC86cHJvdmlkZXInLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHdpbmRvdy5sb2NhdGlvbi5yZWxvYWQoKTtcbiAgICB9KTtcbn0pO1xuXG4vLyBUaGlzIGFwcC5ydW4gaXMgZm9yIGNvbnRyb2xsaW5nIGFjY2VzcyB0byBzcGVjaWZpYyBzdGF0ZXMuXG5hcHAucnVuKGZ1bmN0aW9uICgkcm9vdFNjb3BlLCBBdXRoU2VydmljZSwgJHN0YXRlKSB7XG5cbiAgICAvLyBUaGUgZ2l2ZW4gc3RhdGUgcmVxdWlyZXMgYW4gYXV0aGVudGljYXRlZCB1c2VyLlxuICAgIHZhciBkZXN0aW5hdGlvblN0YXRlUmVxdWlyZXNBdXRoID0gZnVuY3Rpb24gKHN0YXRlKSB7XG4gICAgICAgIHJldHVybiBzdGF0ZS5kYXRhICYmIHN0YXRlLmRhdGEuYXV0aGVudGljYXRlO1xuICAgIH07XG5cbiAgICAvLyAkc3RhdGVDaGFuZ2VTdGFydCBpcyBhbiBldmVudCBmaXJlZFxuICAgIC8vIHdoZW5ldmVyIHRoZSBwcm9jZXNzIG9mIGNoYW5naW5nIGEgc3RhdGUgYmVnaW5zLlxuICAgICRyb290U2NvcGUuJG9uKCckc3RhdGVDaGFuZ2VTdGFydCcsIGZ1bmN0aW9uIChldmVudCwgdG9TdGF0ZSwgdG9QYXJhbXMpIHtcblxuICAgICAgICBpZiAoIWRlc3RpbmF0aW9uU3RhdGVSZXF1aXJlc0F1dGgodG9TdGF0ZSkpIHtcbiAgICAgICAgICAgIC8vIFRoZSBkZXN0aW5hdGlvbiBzdGF0ZSBkb2VzIG5vdCByZXF1aXJlIGF1dGhlbnRpY2F0aW9uXG4gICAgICAgICAgICAvLyBTaG9ydCBjaXJjdWl0IHdpdGggcmV0dXJuLlxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKEF1dGhTZXJ2aWNlLmlzQXV0aGVudGljYXRlZCgpKSB7XG4gICAgICAgICAgICAvLyBUaGUgdXNlciBpcyBhdXRoZW50aWNhdGVkLlxuICAgICAgICAgICAgLy8gU2hvcnQgY2lyY3VpdCB3aXRoIHJldHVybi5cbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIENhbmNlbCBuYXZpZ2F0aW5nIHRvIG5ldyBzdGF0ZS5cbiAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcblxuICAgICAgICBBdXRoU2VydmljZS5nZXRMb2dnZWRJblVzZXIoKS50aGVuKGZ1bmN0aW9uICh1c2VyKSB7XG4gICAgICAgICAgICAvLyBJZiBhIHVzZXIgaXMgcmV0cmlldmVkLCB0aGVuIHJlbmF2aWdhdGUgdG8gdGhlIGRlc3RpbmF0aW9uXG4gICAgICAgICAgICAvLyAodGhlIHNlY29uZCB0aW1lLCBBdXRoU2VydmljZS5pc0F1dGhlbnRpY2F0ZWQoKSB3aWxsIHdvcmspXG4gICAgICAgICAgICAvLyBvdGhlcndpc2UsIGlmIG5vIHVzZXIgaXMgbG9nZ2VkIGluLCBnbyB0byBcImxvZ2luXCIgc3RhdGUuXG4gICAgICAgICAgICBpZiAodXNlcikge1xuICAgICAgICAgICAgICAgICRzdGF0ZS5nbyh0b1N0YXRlLm5hbWUsIHRvUGFyYW1zKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgJHN0YXRlLmdvKCdsb2dpbicpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgIH0pO1xuXG59KTtcbiIsImFwcC5jb25maWcoZnVuY3Rpb24gKCRzdGF0ZVByb3ZpZGVyKSB7XG5cbiAgICAvLyBSZWdpc3RlciBvdXIgKmFib3V0KiBzdGF0ZS5cbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnYWJvdXQnLCB7XG4gICAgICAgIHVybDogJy9hYm91dCcsXG4gICAgICAgIGNvbnRyb2xsZXI6ICdBYm91dENvbnRyb2xsZXInLFxuICAgICAgICB0ZW1wbGF0ZVVybDogJ2pzL2Fib3V0L2Fib3V0Lmh0bWwnXG4gICAgfSk7XG5cbn0pO1xuXG5hcHAuY29udHJvbGxlcignQWJvdXRDb250cm9sbGVyJywgZnVuY3Rpb24gKCRzY29wZSwgRnVsbHN0YWNrUGljcykge1xuXG4gICAgLy8gSW1hZ2VzIG9mIGJlYXV0aWZ1bCBGdWxsc3RhY2sgcGVvcGxlLlxuICAgICRzY29wZS5pbWFnZXMgPSBfLnNodWZmbGUoRnVsbHN0YWNrUGljcyk7XG5cbn0pO1xuIiwiYXBwLmNvbmZpZyhmdW5jdGlvbiAoJHN0YXRlUHJvdmlkZXIpIHtcbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnY2FydCcsIHtcbiAgICAgICAgdXJsOiAnL2NhcnQnLFxuICAgICAgICBjb250cm9sbGVyOiAnQ2FydENvbnRyb2xsZXInLFxuICAgICAgICB0ZW1wbGF0ZVVybDogJ2pzL2NhcnQvY2FydC5odG1sJ1xuICAgIH0pO1xufSk7XG5cblxuYXBwLmNvbmZpZyhmdW5jdGlvbiAoJHN0YXRlUHJvdmlkZXIpIHtcbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnY2FydC5jaGVja291dCcsIHtcbiAgICAgICAgdXJsOiAnL2NoZWNrb3V0JyxcbiAgICAgICAgY29udHJvbGxlcjogJ0NhcnRDb250cm9sbGVyJyxcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdqcy9jaGVja291dC9jaGVja291dC5odG1sJ1xuICAgIH0pO1xufSk7XG5cblxuYXBwLmNvbnRyb2xsZXIoJ0NhcnRDb250cm9sbGVyJywgZnVuY3Rpb24gKCRzY29wZSwgQ2FydEZhY3RvcnksICRsb2csICRyb290U2NvcGUpIHtcbiAgJHNjb3BlLml0ZW1zID0gQ2FydEZhY3RvcnkuZ2V0SXRlbXMoKTtcbiAgJHNjb3BlLnRvdGFsID0gQ2FydEZhY3RvcnkuZ2V0VG90YWwoKTtcblxuICAkcm9vdFNjb3BlLiRvbignYXV0aC1sb2dpbi1zdWNjZXNzJywgZnVuY3Rpb24oKXtcbiAgICBDYXJ0RmFjdG9yeS5nZXRVc2VyQ2FydCgpXG4gICAgLnRoZW4oZnVuY3Rpb24oY2FydCl7XG4gICAgICAkc2NvcGUuaXRlbXMgPSBjYXJ0Lml0ZW1zO1xuICAgICAgJHNjb3BlLnRvdGFsID0gY2FydC50b3RhbDtcbiAgICB9KVxuICAgIC5jYXRjaCgkbG9nLmVycm9yKTtcbiAgfSk7XG5cbiAgJHJvb3RTY29wZS4kb24oJ2F1dGgtbG9nb3V0LXN1Y2Nlc3MnLCBmdW5jdGlvbigpe1xuICAgICRzY29wZS5pdGVtcyA9IENhcnRGYWN0b3J5LmdldEl0ZW1zKCk7XG4gICAgJHNjb3BlLnRvdGFsID0gQ2FydEZhY3RvcnkuZ2V0VG90YWwoKTtcbiAgfSk7XG5cbiAgJHNjb3BlLmdldFVzZXJDYXJ0ID0gZnVuY3Rpb24oKXtcbiAgICBDYXJ0RmFjdG9yeS5nZXRVc2VyQ2FydCgpXG4gICAgLnRoZW4oZnVuY3Rpb24oY2FydCl7XG4gICAgICAkc2NvcGUuaXRlbXMgPSBjYXJ0Lml0ZW1zO1xuICAgICAgJHNjb3BlLnRvdGFsID0gY2FydC50b3RhbDtcbiAgICB9KVxuICAgIC5jYXRjaCgkbG9nLmVycm9yKVxuICB9XG4gICRzY29wZS5hZGRUb0NhcnQgPSBmdW5jdGlvbihmcmllbmRJZCl7XG4gICAgQ2FydEZhY3RvcnkuYWRkRnJpZW5kVG9DYXJ0KGZyaWVuZElkKVxuICAgIC50aGVuKGZ1bmN0aW9uKGNhcnQpe1xuICAgICAgJHNjb3BlLml0ZW1zID0gY2FydC5pdGVtcztcbiAgICAgICRzY29wZS50b3RhbCA9IGNhcnQudG90YWw7XG4gICAgfSlcbiAgICAuY2F0Y2goJGxvZy5lcnJvcik7XG4gIH1cbiAgJHNjb3BlLmNsZWFyQ2FydCA9IGZ1bmN0aW9uKCl7XG4gICAgdmFyIGNhcnQgPSBDYXJ0RmFjdG9yeS5jbGVhckNhcnQoKTtcbiAgICAgICRzY29wZS5pdGVtcyA9IGNhcnQuaXRlbXM7XG4gICAgICAkc2NvcGUudG90YWwgPSBjYXJ0LnRvdGFsO1xuICB9XG4gICRzY29wZS5zYXZlQ2FydCA9IENhcnRGYWN0b3J5LnNhdmVDYXJ0O1xuXG4gICAkc2NvcGUuZGVsZXRlSXRlbSA9IGZ1bmN0aW9uKGZyaWVuZElkKXtcbiAgICB2YXIgY2FydCA9IENhcnRGYWN0b3J5LmRlbGV0ZUl0ZW0oZnJpZW5kSWQpO1xuICAgICAgJHNjb3BlLml0ZW1zID0gY2FydC5pdGVtcztcbiAgICAgICRzY29wZS50b3RhbCA9IGNhcnQudG90YWw7XG4gIH1cbiAgJHNjb3BlLnB1cmNoYXNlID0gZnVuY3Rpb24oKXtcbiAgICBDYXJ0RmFjdG9yeS5wdXJjaGFzZSgpXG4gICAgLnRoZW4oZnVuY3Rpb24ob3JkZXIpe1xuICAgICAgJHNjb3BlLm5ld09yZGVyID0gb3JkZXI7XG4gICAgICAkc2NvcGUuaXRlbXMgPSBDYXJ0RmFjdG9yeS5nZXRJdGVtcygpO1xuICAgICAgJHNjb3BlLnRvdGFsID0gQ2FydEZhY3RvcnkuZ2V0VG90YWwoKTtcbiAgICB9KVxuICAgIC5jYXRjaCgkbG9nLmVycm9yKTtcbiAgfTtcbn0pO1xuIiwiYXBwLmNvbmZpZyhmdW5jdGlvbiAoJHN0YXRlUHJvdmlkZXIpIHtcbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnY29tcGxldGUnLCB7XG4gICAgICAgIHVybDogJy9jb21wbGV0ZScsXG4gICAgICAgIGNvbnRyb2xsZXI6ICdDaGVja291dENvbnRyb2xsZXInLFxuICAgICAgICB0ZW1wbGF0ZVVybDogJ2pzL2NoZWNrb3V0L2NoZWNrb3V0Q29tcGxldGUuaHRtbCdcbiAgICB9KTtcbn0pO1xuXG5hcHAuY29udHJvbGxlcignQ2hlY2tvdXRDb250cm9sbGVyJywgZnVuY3Rpb24gKCRzY29wZSkge1xuXHQkc2NvcGUudG90YWwgPSA4MDsgLy90ZXN0XG59KTtcblxuIiwiYXBwLmNvbmZpZyhmdW5jdGlvbiAoJHN0YXRlUHJvdmlkZXIpIHtcbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnZG9jcycsIHtcbiAgICAgICAgdXJsOiAnL2RvY3MnLFxuICAgICAgICB0ZW1wbGF0ZVVybDogJ2pzL3Nob3BwaW5nQ2FydC9zaG9wcGluZy1jYXJ0Lmh0bWwnXG4gICAgfSk7XG59KTtcbiIsIihmdW5jdGlvbiAoKSB7XG5cbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICAvLyBIb3BlIHlvdSBkaWRuJ3QgZm9yZ2V0IEFuZ3VsYXIhIER1aC1kb3kuXG4gICAgaWYgKCF3aW5kb3cuYW5ndWxhcikgdGhyb3cgbmV3IEVycm9yKCdJIGNhblxcJ3QgZmluZCBBbmd1bGFyIScpO1xuXG4gICAgdmFyIGFwcCA9IGFuZ3VsYXIubW9kdWxlKCdmc2FQcmVCdWlsdCcsIFtdKTtcblxuICAgIGFwcC5mYWN0b3J5KCdTb2NrZXQnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmICghd2luZG93LmlvKSB0aHJvdyBuZXcgRXJyb3IoJ3NvY2tldC5pbyBub3QgZm91bmQhJyk7XG4gICAgICAgIHJldHVybiB3aW5kb3cuaW8od2luZG93LmxvY2F0aW9uLm9yaWdpbik7XG4gICAgfSk7XG5cbiAgICAvLyBBVVRIX0VWRU5UUyBpcyB1c2VkIHRocm91Z2hvdXQgb3VyIGFwcCB0b1xuICAgIC8vIGJyb2FkY2FzdCBhbmQgbGlzdGVuIGZyb20gYW5kIHRvIHRoZSAkcm9vdFNjb3BlXG4gICAgLy8gZm9yIGltcG9ydGFudCBldmVudHMgYWJvdXQgYXV0aGVudGljYXRpb24gZmxvdy5cbiAgICBhcHAuY29uc3RhbnQoJ0FVVEhfRVZFTlRTJywge1xuICAgICAgICBsb2dpblN1Y2Nlc3M6ICdhdXRoLWxvZ2luLXN1Y2Nlc3MnLFxuICAgICAgICBsb2dpbkZhaWxlZDogJ2F1dGgtbG9naW4tZmFpbGVkJyxcbiAgICAgICAgbG9nb3V0U3VjY2VzczogJ2F1dGgtbG9nb3V0LXN1Y2Nlc3MnLFxuICAgICAgICBzZXNzaW9uVGltZW91dDogJ2F1dGgtc2Vzc2lvbi10aW1lb3V0JyxcbiAgICAgICAgbm90QXV0aGVudGljYXRlZDogJ2F1dGgtbm90LWF1dGhlbnRpY2F0ZWQnLFxuICAgICAgICBub3RBdXRob3JpemVkOiAnYXV0aC1ub3QtYXV0aG9yaXplZCdcbiAgICB9KTtcblxuICAgIGFwcC5mYWN0b3J5KCdBdXRoSW50ZXJjZXB0b3InLCBmdW5jdGlvbiAoJHJvb3RTY29wZSwgJHEsIEFVVEhfRVZFTlRTKSB7XG4gICAgICAgIHZhciBzdGF0dXNEaWN0ID0ge1xuICAgICAgICAgICAgNDAxOiBBVVRIX0VWRU5UUy5ub3RBdXRoZW50aWNhdGVkLFxuICAgICAgICAgICAgNDAzOiBBVVRIX0VWRU5UUy5ub3RBdXRob3JpemVkLFxuICAgICAgICAgICAgNDE5OiBBVVRIX0VWRU5UUy5zZXNzaW9uVGltZW91dCxcbiAgICAgICAgICAgIDQ0MDogQVVUSF9FVkVOVFMuc2Vzc2lvblRpbWVvdXRcbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHJlc3BvbnNlRXJyb3I6IGZ1bmN0aW9uIChyZXNwb25zZSkge1xuICAgICAgICAgICAgICAgICRyb290U2NvcGUuJGJyb2FkY2FzdChzdGF0dXNEaWN0W3Jlc3BvbnNlLnN0YXR1c10sIHJlc3BvbnNlKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gJHEucmVqZWN0KHJlc3BvbnNlKVxuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH0pO1xuXG4gICAgYXBwLmNvbmZpZyhmdW5jdGlvbiAoJGh0dHBQcm92aWRlcikge1xuICAgICAgICAkaHR0cFByb3ZpZGVyLmludGVyY2VwdG9ycy5wdXNoKFtcbiAgICAgICAgICAgICckaW5qZWN0b3InLFxuICAgICAgICAgICAgZnVuY3Rpb24gKCRpbmplY3Rvcikge1xuICAgICAgICAgICAgICAgIHJldHVybiAkaW5qZWN0b3IuZ2V0KCdBdXRoSW50ZXJjZXB0b3InKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgXSk7XG4gICAgfSk7XG5cbiAgICBhcHAuc2VydmljZSgnQXV0aFNlcnZpY2UnLCBmdW5jdGlvbiAoJGh0dHAsIFNlc3Npb24sICRyb290U2NvcGUsIEFVVEhfRVZFTlRTLCAkcSkge1xuXG4gICAgICAgIGZ1bmN0aW9uIG9uU3VjY2Vzc2Z1bExvZ2luKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICB2YXIgdXNlciA9IHJlc3BvbnNlLmRhdGEudXNlcjtcbiAgICAgICAgICAgIFNlc3Npb24uY3JlYXRlKHVzZXIpO1xuICAgICAgICAgICAgJHJvb3RTY29wZS4kYnJvYWRjYXN0KEFVVEhfRVZFTlRTLmxvZ2luU3VjY2Vzcyk7XG4gICAgICAgICAgICByZXR1cm4gdXNlcjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFVzZXMgdGhlIHNlc3Npb24gZmFjdG9yeSB0byBzZWUgaWYgYW5cbiAgICAgICAgLy8gYXV0aGVudGljYXRlZCB1c2VyIGlzIGN1cnJlbnRseSByZWdpc3RlcmVkLlxuICAgICAgICB0aGlzLmlzQXV0aGVudGljYXRlZCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiAhIVNlc3Npb24udXNlcjtcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLmdldExvZ2dlZEluVXNlciA9IGZ1bmN0aW9uIChmcm9tU2VydmVyKSB7XG5cbiAgICAgICAgICAgIC8vIElmIGFuIGF1dGhlbnRpY2F0ZWQgc2Vzc2lvbiBleGlzdHMsIHdlXG4gICAgICAgICAgICAvLyByZXR1cm4gdGhlIHVzZXIgYXR0YWNoZWQgdG8gdGhhdCBzZXNzaW9uXG4gICAgICAgICAgICAvLyB3aXRoIGEgcHJvbWlzZS4gVGhpcyBlbnN1cmVzIHRoYXQgd2UgY2FuXG4gICAgICAgICAgICAvLyBhbHdheXMgaW50ZXJmYWNlIHdpdGggdGhpcyBtZXRob2QgYXN5bmNocm9ub3VzbHkuXG5cbiAgICAgICAgICAgIC8vIE9wdGlvbmFsbHksIGlmIHRydWUgaXMgZ2l2ZW4gYXMgdGhlIGZyb21TZXJ2ZXIgcGFyYW1ldGVyLFxuICAgICAgICAgICAgLy8gdGhlbiB0aGlzIGNhY2hlZCB2YWx1ZSB3aWxsIG5vdCBiZSB1c2VkLlxuXG4gICAgICAgICAgICBpZiAodGhpcy5pc0F1dGhlbnRpY2F0ZWQoKSAmJiBmcm9tU2VydmVyICE9PSB0cnVlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICRxLndoZW4oU2Vzc2lvbi51c2VyKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gTWFrZSByZXF1ZXN0IEdFVCAvc2Vzc2lvbi5cbiAgICAgICAgICAgIC8vIElmIGl0IHJldHVybnMgYSB1c2VyLCBjYWxsIG9uU3VjY2Vzc2Z1bExvZ2luIHdpdGggdGhlIHJlc3BvbnNlLlxuICAgICAgICAgICAgLy8gSWYgaXQgcmV0dXJucyBhIDQwMSByZXNwb25zZSwgd2UgY2F0Y2ggaXQgYW5kIGluc3RlYWQgcmVzb2x2ZSB0byBudWxsLlxuICAgICAgICAgICAgcmV0dXJuICRodHRwLmdldCgnL3Nlc3Npb24nKS50aGVuKG9uU3VjY2Vzc2Z1bExvZ2luKS5jYXRjaChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMubG9naW4gPSBmdW5jdGlvbiAoY3JlZGVudGlhbHMpIHtcbiAgICAgICAgICAgIHJldHVybiAkaHR0cC5wb3N0KCcvbG9naW4nLCBjcmVkZW50aWFscylcbiAgICAgICAgICAgICAgICAudGhlbihvblN1Y2Nlc3NmdWxMb2dpbilcbiAgICAgICAgICAgICAgICAuY2F0Y2goZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gJHEucmVqZWN0KHsgbWVzc2FnZTogJ0ludmFsaWQgbG9naW4gY3JlZGVudGlhbHMuJyB9KTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLmxvZ291dCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiAkaHR0cC5nZXQoJy9sb2dvdXQnKS50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBTZXNzaW9uLmRlc3Ryb3koKTtcbiAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLiRicm9hZGNhc3QoQVVUSF9FVkVOVFMubG9nb3V0U3VjY2Vzcyk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfTtcblxuICAgIH0pO1xuXG4gICAgYXBwLnNlcnZpY2UoJ1Nlc3Npb24nLCBmdW5jdGlvbiAoJHJvb3RTY29wZSwgQVVUSF9FVkVOVFMpIHtcblxuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICAgICAgJHJvb3RTY29wZS4kb24oQVVUSF9FVkVOVFMubm90QXV0aGVudGljYXRlZCwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgc2VsZi5kZXN0cm95KCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgICRyb290U2NvcGUuJG9uKEFVVEhfRVZFTlRTLnNlc3Npb25UaW1lb3V0LCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBzZWxmLmRlc3Ryb3koKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgdGhpcy51c2VyID0gbnVsbDtcblxuICAgICAgICB0aGlzLmNyZWF0ZSA9IGZ1bmN0aW9uIChzZXNzaW9uSWQsIHVzZXIpIHtcbiAgICAgICAgICAgIHRoaXMudXNlciA9IHVzZXI7XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5kZXN0cm95ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdGhpcy51c2VyID0gbnVsbDtcbiAgICAgICAgfTtcblxuICAgIH0pO1xuXG59KCkpO1xuIiwiYXBwLmNvbmZpZyhmdW5jdGlvbiAoJHN0YXRlUHJvdmlkZXIpIHtcbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnaG9tZScsIHtcbiAgICAgICAgdXJsOiAnLycsXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnanMvaG9tZS9ob21lLmh0bWwnXG4gICAgfSk7XG59KTtcblxuYXBwLmNvbnRyb2xsZXIoJ0Nhcm91c2VsQ3RybCcsIGZ1bmN0aW9uICgkc2NvcGUsICRsb2csIFByb2R1Y3RGYWN0b3J5KSB7XG5cbiAgJHNjb3BlLnRhZ3MgPSBbXG4gICAgeyB0ZXh0OiAnanVzdCcgfSxcbiAgICB7IHRleHQ6ICdzb21lJyB9LFxuICAgIHsgdGV4dDogJ2Nvb2wnIH0sXG4gICAgeyB0ZXh0OiAndGFncycgfVxuICBdO1xuXG4gICRzY29wZS5teUludGVydmFsID0gNTAwMDtcbiAgJHNjb3BlLm5vV3JhcFNsaWRlcyA9IGZhbHNlO1xuICAkc2NvcGUuYWN0aXZlID0gMDtcbiAgdmFyIHNsaWRlcyA9ICRzY29wZS5zbGlkZXMgPSBbXTtcbiAgdmFyIGN1cnJJbmRleCA9IDA7XG5cbiAgJHNjb3BlLmFkZFNsaWRlID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIG5ld1dpZHRoID0gNjAwICsgc2xpZGVzLmxlbmd0aCArIDE7XG4gICAgc2xpZGVzLnB1c2goe1xuICAgICAgLy8gaW1hZ2U6ICcvL3Vuc3BsYXNoLml0LycgKyBuZXdXaWR0aCArICcvMzAwJyxcbiAgICAgIGltYWdlOiAnLy93d3cuY29kZXJtYXRjaC5tZS9hc3NldHMvQ29kZXItdy1CdWRkeS01YTgzZmQ1NzAyY2Y2N2Y1ZTkzNzA0YjZjNTMxNjIwMy5zdmcnLFxuICAgICAgdGV4dDogWydOaWNlIGltYWdlJywnQXdlc29tZSBwaG90b2dyYXBoJywnVGhhdCBpcyBzbyBjb29sJywnSSBsb3ZlIHRoYXQnXVtzbGlkZXMubGVuZ3RoICUgNF0sXG4gICAgICBpZDogY3VyckluZGV4KytcbiAgICB9KTtcbiAgfTtcblxuICAkc2NvcGUucmFuZG9taXplID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGluZGV4ZXMgPSBnZW5lcmF0ZUluZGV4ZXNBcnJheSgpO1xuICAgIGFzc2lnbk5ld0luZGV4ZXNUb1NsaWRlcyhpbmRleGVzKTtcbiAgfTtcblxuICBmb3IgKHZhciBpID0gMDsgaSA8IDQ7IGkrKykge1xuICAgICRzY29wZS5hZGRTbGlkZSgpO1xuICB9XG5cbiAgLy8gUmFuZG9taXplIGxvZ2ljIGJlbG93XG5cbiAgZnVuY3Rpb24gYXNzaWduTmV3SW5kZXhlc1RvU2xpZGVzKGluZGV4ZXMpIHtcbiAgICBmb3IgKHZhciBpID0gMCwgbCA9IHNsaWRlcy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgIHNsaWRlc1tpXS5pZCA9IGluZGV4ZXMucG9wKCk7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gZ2VuZXJhdGVJbmRleGVzQXJyYXkoKSB7XG4gICAgdmFyIGluZGV4ZXMgPSBbXTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGN1cnJJbmRleDsgKytpKSB7XG4gICAgICBpbmRleGVzW2ldID0gaTtcbiAgICB9XG4gICAgcmV0dXJuIHNodWZmbGUoaW5kZXhlcyk7XG4gIH1cblxuICAvLyBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vcXVlc3Rpb25zLzk2MjgwMiM5NjI4OTBcbiAgZnVuY3Rpb24gc2h1ZmZsZShhcnJheSkge1xuICAgIHZhciB0bXAsIGN1cnJlbnQsIHRvcCA9IGFycmF5Lmxlbmd0aDtcblxuICAgIGlmICh0b3ApIHtcbiAgICAgIHdoaWxlICgtLXRvcCkge1xuICAgICAgICBjdXJyZW50ID0gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogKHRvcCArIDEpKTtcbiAgICAgICAgdG1wID0gYXJyYXlbY3VycmVudF07XG4gICAgICAgIGFycmF5W2N1cnJlbnRdID0gYXJyYXlbdG9wXTtcbiAgICAgICAgYXJyYXlbdG9wXSA9IHRtcDtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gYXJyYXk7XG4gIH1cbn0pO1xuIiwiYXBwLmNvbmZpZyhmdW5jdGlvbiAoJHN0YXRlUHJvdmlkZXIpIHtcblxuICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdsb2dpbicsIHtcbiAgICAgICAgdXJsOiAnL2xvZ2luJyxcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdqcy9sb2dpbi9sb2dpbi5odG1sJyxcbiAgICAgICAgY29udHJvbGxlcjogJ0xvZ2luQ3RybCdcbiAgICB9KTtcblxufSk7XG5cbmFwcC5jb250cm9sbGVyKCdMb2dpbkN0cmwnLCBmdW5jdGlvbiAoJHNjb3BlLCBBdXRoU2VydmljZSwgJHN0YXRlKSB7XG5cbiAgICAkc2NvcGUubG9naW4gPSB7fTtcbiAgICAkc2NvcGUuZXJyb3IgPSBudWxsO1xuXG4gICAgJHNjb3BlLnNlbmRMb2dpbiA9IGZ1bmN0aW9uIChsb2dpbkluZm8pIHtcblxuICAgICAgICAkc2NvcGUuZXJyb3IgPSBudWxsO1xuXG4gICAgICAgIEF1dGhTZXJ2aWNlLmxvZ2luKGxvZ2luSW5mbylcbiAgICAgICAgLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgJHN0YXRlLmdvKCdob21lJyk7XG4gICAgICAgIH0pXG4gICAgICAgIC5jYXRjaChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAkc2NvcGUuZXJyb3IgPSAnSW52YWxpZCBsb2dpbiBjcmVkZW50aWFscy4nO1xuICAgICAgICB9KTtcblxuICAgIH07XG5cbn0pO1xuIiwiYXBwLmNvbmZpZyhmdW5jdGlvbiAoJHN0YXRlUHJvdmlkZXIpIHtcblxuICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdtZW1iZXJzT25seScsIHtcbiAgICAgICAgdXJsOiAnL21lbWJlcnMtYXJlYScsXG4gICAgICAgIHRlbXBsYXRlOiAnPGltZyBuZy1yZXBlYXQ9XCJpdGVtIGluIHN0YXNoXCIgd2lkdGg9XCIzMDBcIiBuZy1zcmM9XCJ7eyBpdGVtIH19XCIgLz4nLFxuICAgICAgICBjb250cm9sbGVyOiBmdW5jdGlvbiAoJHNjb3BlLCBTZWNyZXRTdGFzaCkge1xuICAgICAgICAgICAgU2VjcmV0U3Rhc2guZ2V0U3Rhc2goKS50aGVuKGZ1bmN0aW9uIChzdGFzaCkge1xuICAgICAgICAgICAgICAgICRzY29wZS5zdGFzaCA9IHN0YXNoO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG4gICAgICAgIC8vIFRoZSBmb2xsb3dpbmcgZGF0YS5hdXRoZW50aWNhdGUgaXMgcmVhZCBieSBhbiBldmVudCBsaXN0ZW5lclxuICAgICAgICAvLyB0aGF0IGNvbnRyb2xzIGFjY2VzcyB0byB0aGlzIHN0YXRlLiBSZWZlciB0byBhcHAuanMuXG4gICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgIGF1dGhlbnRpY2F0ZTogdHJ1ZVxuICAgICAgICB9XG4gICAgfSk7XG5cbn0pO1xuXG5hcHAuZmFjdG9yeSgnU2VjcmV0U3Rhc2gnLCBmdW5jdGlvbiAoJGh0dHApIHtcblxuICAgIHZhciBnZXRTdGFzaCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuICRodHRwLmdldCgnL2FwaS9tZW1iZXJzL3NlY3JldC1zdGFzaCcpLnRoZW4oZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICByZXR1cm4gcmVzcG9uc2UuZGF0YTtcbiAgICAgICAgfSk7XG4gICAgfTtcblxuICAgIHJldHVybiB7XG4gICAgICAgIGdldFN0YXNoOiBnZXRTdGFzaFxuICAgIH07XG5cbn0pO1xuIiwiYXBwLmNvbmZpZyhmdW5jdGlvbiAoJHN0YXRlUHJvdmlkZXIpIHtcbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgncHJvZHVjdCcsIHtcbiAgICAgICAgdXJsOiAnL3Byb2R1Y3QvOmZyaWVuZElkJyxcbiAgICAgICAgY29udHJvbGxlcjogJ1Byb2R1Y3RDb250cm9sbGVyJyxcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdqcy9wcm9kdWN0L3Byb2R1Y3QuaHRtbCdcbiAgICB9KTtcbn0pO1xuXG5cbmFwcC5jb25maWcoZnVuY3Rpb24gKCRzdGF0ZVByb3ZpZGVyKSB7XG4gICAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ3Byb2R1Y3QuZGVzY3JpcHRpb24nLCB7XG4gICAgICAgIHVybDogJy9kZXNjcmlwdGlvbicsXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnanMvcHJvZHVjdC9wcm9kdWN0LWRlc2NyaXB0aW9uLmh0bWwnXG4gICAgfSk7XG59KTtcblxuXG5hcHAuY29uZmlnKGZ1bmN0aW9uICgkc3RhdGVQcm92aWRlcikge1xuICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdwcm9kdWN0LnJldmlldycsIHtcbiAgICAgICAgdXJsOiAnL3JldmlldycsXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnanMvcHJvZHVjdC9wcm9kdWN0LXJldmlldy5odG1sJ1xuICAgIH0pO1xufSk7XG5cblxuXG5hcHAuY29udHJvbGxlcignUHJvZHVjdENvbnRyb2xsZXInLCBmdW5jdGlvbiAoJHNjb3BlLCBQcm9kdWN0RmFjdG9yeSwgQ2FydEZhY3RvcnksICRsb2csICRzdGF0ZVBhcmFtcykge1xuICAgIFxuICAgIFByb2R1Y3RGYWN0b3J5LmdldEFsbEZyaWVuZHMoKVxuICAgIC50aGVuKGZ1bmN0aW9uKGFsbEZyaWVuZHMpIHtcbiAgICAgICAgJHNjb3BlLmFsbEZyaWVuZHMgPSBhbGxGcmllbmRzO1xuICAgIH0pXG4gICAgLmNhdGNoKCRsb2cuZXJyb3IpO1xuXG4gICAgJHNjb3BlLmdldE51bVJldmlld3MgPSBQcm9kdWN0RmFjdG9yeS5nZXROdW1SZXZpZXdzO1xuXG4gICAgJHNjb3BlLmlkID0gJHN0YXRlUGFyYW1zLmZyaWVuZElkXG5cbiAgICBQcm9kdWN0RmFjdG9yeS5nZXRGcmllbmQoJHNjb3BlLmlkKVxuICAgIC50aGVuKGZ1bmN0aW9uKGZyaWVuZCkge1xuICAgICAgICAkc2NvcGUuZnJpZW5kID0gZnJpZW5kO1xuICAgIH0pXG4gICAgLmNhdGNoKCRsb2cuZXJyb3IpO1xuXG4gICAgJHNjb3BlLmFkZFRvQ2FydCA9IGZ1bmN0aW9uKGZyaWVuZElkKXtcbiAgICAgICAgQ2FydEZhY3RvcnkuYWRkRnJpZW5kVG9DYXJ0KGZyaWVuZElkKVxuICAgICAgICAudGhlbihmdW5jdGlvbihjYXJ0KXtcbiAgICAgICAgICAkc2NvcGUuaXRlbXMgPSBjYXJ0Lml0ZW1zO1xuICAgICAgICAgICRzY29wZS50b3RhbCA9IGNhcnQudG90YWw7XG4gICAgICAgIH0pXG4gICAgICAgIC5jYXRjaCgkbG9nLmVycm9yKTtcbiAgICB9XG5cblxufSk7XG5cbiIsImFwcC5jb25maWcoZnVuY3Rpb24oJHN0YXRlUHJvdmlkZXIpIHtcblx0JHN0YXRlUHJvdmlkZXIuc3RhdGUoJ3NpZ251cCcsIHtcblx0XHR1cmw6ICcvc2lnbnVwJyxcblx0XHR0ZW1wbGF0ZVVybDogJ2pzL3NpZ251cC9zaWdudXAuaHRtbCcsXG5cdFx0Y29udHJvbGxlcjogJ1NpZ25VcEN0cmwnXG5cdH0pO1xufSk7XG5cbi8vIE5FRUQgVE8gVVNFIEZPUk0gVkFMSURBVElPTlMgRk9SIEVNQUlMLCBBRERSRVNTLCBFVENcbmFwcC5jb250cm9sbGVyKCdTaWduVXBDdHJsJywgZnVuY3Rpb24oJHNjb3BlLCAkc3RhdGUsICRodHRwLCBBdXRoU2VydmljZSkge1xuXHQvLyBHZXQgZnJvbSBuZy1tb2RlbCBpbiBzaWdudXAuaHRtbFxuXHQkc2NvcGUuc2lnblVwID0ge307XG5cdCRzY29wZS5jaGVja0luZm8gPSB7fTtcblx0JHNjb3BlLmVycm9yID0gbnVsbDtcblxuXHQkc2NvcGUuc2VuZFNpZ25VcCA9IGZ1bmN0aW9uKHNpZ25VcEluZm8pIHtcblx0XHQkc2NvcGUuZXJyb3IgPSBudWxsO1xuXG5cdFx0aWYgKCRzY29wZS5zaWduVXAucGFzc3dvcmQgIT09ICRzY29wZS5jaGVja0luZm8ucGFzc3dvcmRDb25maXJtKSB7XG5cdFx0XHQkc2NvcGUuZXJyb3IgPSAnUGFzc3dvcmRzIGRvIG5vdCBtYXRjaCwgcGxlYXNlIHJlLWVudGVyIHBhc3N3b3JkLic7XG5cdFx0fVxuXHRcdGVsc2Uge1xuXHRcdFx0JGh0dHAucG9zdCgnL3NpZ251cCcsIHNpZ25VcEluZm8pXG5cdFx0XHQudGhlbihmdW5jdGlvbigpIHtcblx0XHRcdFx0QXV0aFNlcnZpY2UubG9naW4oc2lnblVwSW5mbylcblx0XHRcdFx0LnRoZW4oZnVuY3Rpb24oKSB7XG5cdFx0XHRcdFx0JHN0YXRlLmdvKCdob21lJyk7XG5cdFx0XHRcdH0pO1xuXHRcdFx0fSlcblx0XHRcdC5jYXRjaChmdW5jdGlvbigpIHtcblx0XHRcdFx0JHNjb3BlLmVycm9yID0gJ0ludmFsaWQgc2lnbnVwIGNyZWRlbnRpYWxzLic7XG5cdFx0XHR9KVxuXHRcdH1cblx0fVxufSk7XG4iLCJhcHAuZmFjdG9yeSgnQ2FydEZhY3RvcnknLCBmdW5jdGlvbigkaHR0cCwgJGxvZyl7XG4gIGZ1bmN0aW9uIGdldENhcnRJdGVtcygpe1xuICAgIHZhciBjdXJyZW50SXRlbXMgPSBsb2NhbFN0b3JhZ2UuZ2V0SXRlbSgnY2FydEl0ZW1zJyk7XG4gICAgaWYgKGN1cnJlbnRJdGVtcykgcmV0dXJuIFtdLnNsaWNlLmNhbGwoSlNPTi5wYXJzZShjdXJyZW50SXRlbXMpKTtcbiAgICBlbHNlIHJldHVybiBbXTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGdldENhcnRUb3RhbCgpe1xuICAgIHZhciBjdXJyZW50VG90YWwgPSBsb2NhbFN0b3JhZ2UuZ2V0SXRlbSgnY2FydFRvdGFsJyk7XG4gICAgaWYgKGN1cnJlbnRUb3RhbCkgcmV0dXJuIEpTT04ucGFyc2UoY3VycmVudFRvdGFsKTtcbiAgICBlbHNlIHJldHVybiAwO1xuICB9XG5cbiAgdmFyIGNhY2hlZENhcnRJdGVtcyA9IGdldENhcnRJdGVtcygpO1xuICB2YXIgY2FjaGVkQ2FydFRvdGFsID0gZ2V0Q2FydFRvdGFsKCk7XG5cbiAgZnVuY3Rpb24gY2FsY3VsYXRlVG90YWwoaXRlbXNBcnJheSl7XG4gICAgcmV0dXJuIGl0ZW1zQXJyYXkucmVkdWNlKGZ1bmN0aW9uKGEsIGIpe1xuICAgICAgcmV0dXJuIGEgKyBiLnByaWNlO1xuICAgIH0sIDApO1xuICB9XG5cbiAgZnVuY3Rpb24gbWFrZUpTT04oYXJyYXkpe1xuICAvL2NvbnZlcnQgdGhlIGl0ZW1zIGFycmF5IGludG8gYSBqc29uIHN0cmluZyBvZiBhbiBhcnJheS1saWtlIG9iamVjdFxuICAgIHJldHVybiBKU09OLnN0cmluZ2lmeShPYmplY3QuYXNzaWduKHtsZW5ndGg6IGFycmF5Lmxlbmd0aH0sIGFycmF5KSk7XG4gIH1cblxuICBmdW5jdGlvbiBjbGVhckNhcnQoKXtcbiAgICBjYWNoZWRDYXJ0SXRlbXMgPSBbXTtcbiAgICBjYWNoZWRDYXJ0VG90YWwgPSAwO1xuICAgIGxvY2FsU3RvcmFnZS5yZW1vdmVJdGVtKCdjYXJ0SXRlbXMnKTtcbiAgICBsb2NhbFN0b3JhZ2UucmVtb3ZlSXRlbSgnY2FydFRvdGFsJyk7XG4gIH1cblxuICByZXR1cm4ge1xuICAgIGdldFVzZXJDYXJ0OiBmdW5jdGlvbigpe1xuICAgICAgcmV0dXJuICRodHRwLmdldCgnL2FwaS9jYXJ0JylcbiAgICAgIC50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgaWYgKHR5cGVvZiByZXNwb25zZS5kYXRhID09PSAnb2JqZWN0Jykge1xuICAgICAgICAgIGNhY2hlZENhcnRJdGVtcyA9IGNhY2hlZENhcnRJdGVtcy5jb25jYXQocmVzcG9uc2UuZGF0YSk7XG4gICAgICAgICAgLy91cGRhdGUgbG9jYWwgc3RvcmFnZSB0byByZWxlY3QgdGhlIGNhY2hlZCB2YWx1ZXNcbiAgICAgICAgICBjYWNoZWRDYXJ0VG90YWwgPSBjYWxjdWxhdGVUb3RhbChjYWNoZWRDYXJ0SXRlbXMpXG4gICAgICAgICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oJ2NhcnRJdGVtcycsIG1ha2VKU09OKGNhY2hlZENhcnRJdGVtcykpO1xuICAgICAgICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKCdjYXJ0VG90YWwnLCBjYWNoZWRDYXJ0VG90YWwpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB7aXRlbXM6IGNhY2hlZENhcnRJdGVtcywgdG90YWw6IGNhY2hlZENhcnRUb3RhbH07XG4gICAgICB9KVxuICAgICAgLmNhdGNoKCRsb2cuZXJyb3IpXG4gICAgfSxcbiAgICBhZGRGcmllbmRUb0NhcnQ6IGZ1bmN0aW9uKGZyaWVuZElkKXtcbiAgICAgIHJldHVybiAkaHR0cC5nZXQoJy9hcGkvZnJpZW5kcy8nICsgZnJpZW5kSWQpXG4gICAgICAudGhlbihmdW5jdGlvbihyZXNwb25zZSl7XG4gICAgICAgIHZhciBmcmllbmQgPSByZXNwb25zZS5kYXRhO1xuICAgICAgICBjYWNoZWRDYXJ0VG90YWwgKz0gZnJpZW5kLnByaWNlO1xuICAgICAgICBjYWNoZWRDYXJ0SXRlbXMucHVzaCh7ZnJpZW5kSWQ6IGZyaWVuZC5pZCwgbmFtZTogZnJpZW5kLm5hbWUsIHByaWNlOiBmcmllbmQucHJpY2UsIGhvdXJzOiBmcmllbmQubnVtSG91cnN9KTtcbiAgICAgICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oJ2NhcnRUb3RhbCcsIGNhY2hlZENhcnRUb3RhbCk7XG4gICAgICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKCdjYXJ0SXRlbXMnLCBtYWtlSlNPTihjYWNoZWRDYXJ0SXRlbXMpKTtcbiAgICAgICAgcmV0dXJuIHtpdGVtczogY2FjaGVkQ2FydEl0ZW1zLCB0b3RhbDogY2FjaGVkQ2FydFRvdGFsfTtcbiAgICAgIH0pXG4gICAgICAuY2F0Y2goJGxvZy5lcnJvcik7XG4gICAgfSxcbiAgICBzYXZlQ2FydDogZnVuY3Rpb24oKXtcbiAgICAgIHJldHVybiAkaHR0cC5wb3N0KCcvYXBpL2NhcnQnLCB7aXRlbXM6IGNhY2hlZENhcnRJdGVtc30pXG4gICAgICAudGhlbihmdW5jdGlvbigpe1xuICAgICAgICBjbGVhckNhcnQoKTtcbiAgICAgIH0pXG4gICAgICAuY2F0Y2goJGxvZy5lcnJvcik7XG4gICAgfSxcbiAgICBnZXRJdGVtczogZnVuY3Rpb24oKXtcbiAgICAgIHJldHVybiBjYWNoZWRDYXJ0SXRlbXM7XG4gICAgfSxcbiAgICBnZXRUb3RhbDogZnVuY3Rpb24oKXtcbiAgICAgIHJldHVybiBjYWNoZWRDYXJ0VG90YWw7XG4gICAgfSxcbiAgICBjbGVhckNhcnQ6IGZ1bmN0aW9uKCl7XG4gICAgICBjbGVhckNhcnQoKTtcbiAgICAgIHJldHVybiB7aXRlbXM6IGNhY2hlZENhcnRJdGVtcywgdG90YWw6IGNhY2hlZENhcnRUb3RhbH07XG4gICAgfSxcbiAgICBkZWxldGVJdGVtOiBmdW5jdGlvbihmcmllbmRJZCl7XG4gICAgICB2YXIgaW5kZXggPSBjYWNoZWRDYXJ0SXRlbXMuZmluZEluZGV4KGZ1bmN0aW9uKGl0ZW0pe1xuICAgICAgICByZXR1cm4gaXRlbS5mcmllbmRJZCA9PT0gZnJpZW5kSWQ7XG4gICAgICB9KTtcbiAgICAgIGNhY2hlZENhcnRJdGVtcy5zcGxpY2UoaW5kZXgsIDEpO1xuICAgICAgY2FjaGVkQ2FydFRvdGFsID0gY2FsY3VsYXRlVG90YWwoY2FjaGVkQ2FydEl0ZW1zKTtcbiAgICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKCdjYXJ0VG90YWwnLCBjYWNoZWRDYXJ0VG90YWwpO1xuICAgICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oJ2NhcnRJdGVtcycsIG1ha2VKU09OKGNhY2hlZENhcnRJdGVtcykpO1xuXG4gICAgICByZXR1cm4ge2l0ZW1zOiBjYWNoZWRDYXJ0SXRlbXMsIHRvdGFsOiBjYWNoZWRDYXJ0VG90YWx9O1xuICAgIH0sXG4gICAgcHVyY2hhc2U6IGZ1bmN0aW9uKCl7XG4gICAgICByZXR1cm4gJGh0dHAucG9zdCgnL2FwaS9jYXJ0L3B1cmNoYXNlJywge2l0ZW1zOiBjYWNoZWRDYXJ0SXRlbXN9KVxuICAgICAgLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICBjbGVhckNhcnQoKTtcbiAgICAgICAgcmV0dXJuIHJlc3BvbnNlLmRhdGE7XG4gICAgICB9KVxuICAgICAgLmNhdGNoKCRsb2cuZXJyb3IpO1xuICAgIH1cbiAgfVxufSk7XG4iLCJhcHAuZmFjdG9yeSgnQ2hlY2tvdXRGYWN0b3J5JywgZnVuY3Rpb24oJGh0dHAsICRsb2cpe1xuXHR2YXIgY2hlY2tvdXRGYWN0ID0ge307XG5cdHJldHVybiBjaGVja291dEZhY3Q7XG59KTtcbiIsImFwcC5mYWN0b3J5KCdQcm9kdWN0RmFjdG9yeScsIGZ1bmN0aW9uKCRodHRwLCAkbG9nKXtcblxuICByZXR1cm4ge1xuXG4gICAgZ2V0QWxsRnJpZW5kczogZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gJGh0dHAuZ2V0KCcvYXBpL2ZyaWVuZHMnKVxuICAgICAgLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2UpIHtcbiAgICAgICAgcmV0dXJuIHJlc3BvbnNlLmRhdGE7XG4gICAgICB9KVxuICAgICAgLmNhdGNoKCRsb2cuZXJyb3IpO1xuICAgIH0sXG5cbiAgICBnZXRGcmllbmQ6IGZ1bmN0aW9uKGZyaWVuZElkKSB7XG4gICAgICByZXR1cm4gJGh0dHAuZ2V0KCcvYXBpL2ZyaWVuZHMvJyArIGZyaWVuZElkKVxuICAgICAgLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICByZXR1cm4gcmVzcG9uc2UuZGF0YTtcbiAgICAgIH0pXG4gICAgICAuY2F0Y2goJGxvZy5lcnJvcilcbiAgICB9LFxuXG4gICAgLy8gZnJpZW5kUmF0aW5nOiBmdW5jdGlvblxuXG4gICAgZ2V0TnVtUmV2aWV3czogZnVuY3Rpb24oZnJpZW5kSWQpIHtcbiAgICAgIHJldHVybiAkaHR0cC5nZXQoJy9hcGkvZnJpZW5kcy8nICsgZnJpZW5kSWQgKyAnL2ZlZWRiYWNrJylcbiAgICAgIC50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG4gICAgICAgIHJldHVybiByZXNwb25zZS5kYXRhLmNvdW50O1xuICAgICAgfSlcbiAgICAgIC5jYXRjaCgkbG9nLmVycm9yKVxuICAgIH0sXG5cbiAgICAvLyBnZXRSYXRpbmc6IGZ1bmN0aW9uKGZyaWVuZElkKSB7XG5cbiAgICAvLyB9XG5cblxuICB9OyAvL2VuZCBvZiByZXR1cm5cblxufSk7XG4iLCJhcHAuZGlyZWN0aXZlKCdncmFjZWhvcHBlckxvZ28nLCBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgcmVzdHJpY3Q6ICdFJyxcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdqcy9jb21tb24vZGlyZWN0aXZlcy9ncmFjZWhvcHBlci1sb2dvL2dyYWNlaG9wcGVyLWxvZ28uaHRtbCdcbiAgICB9O1xufSk7XG4iLCJhcHAuZGlyZWN0aXZlKCduYXZiYXInLCBmdW5jdGlvbiAoJHJvb3RTY29wZSwgQXV0aFNlcnZpY2UsIEFVVEhfRVZFTlRTLCAkc3RhdGUsIENhcnRGYWN0b3J5LCAkbG9nKSB7XG5cbiAgICByZXR1cm4ge1xuICAgICAgICByZXN0cmljdDogJ0UnLFxuICAgICAgICBzY29wZToge30sXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnanMvY29tbW9uL2RpcmVjdGl2ZXMvbmF2YmFyL25hdmJhci5odG1sJyxcbiAgICAgICAgbGluazogZnVuY3Rpb24gKHNjb3BlKSB7XG5cbiAgICAgICAgICAgIHNjb3BlLml0ZW1zID0gW1xuICAgICAgICAgICAgICAgIHsgbGFiZWw6ICdIb21lJywgc3RhdGU6ICdob21lJyB9LFxuICAgICAgICAgICAgICAgIHsgbGFiZWw6ICdBYm91dCcsIHN0YXRlOiAnYWJvdXQnIH0sXG4gICAgICAgICAgICAgICAgeyBsYWJlbDogJ0NoZWNrb3V0Jywgc3RhdGU6ICdjYXJ0JyB9LFxuICAgICAgICAgICAgICAgIHsgbGFiZWw6ICdNZW1iZXJzIE9ubHknLCBzdGF0ZTogJ21lbWJlcnNPbmx5JywgYXV0aDogdHJ1ZSB9XG4gICAgICAgICAgICBdO1xuXG4gICAgICAgICAgICBzY29wZS51c2VyID0gbnVsbDtcblxuICAgICAgICAgICAgc2NvcGUuaXNMb2dnZWRJbiA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gQXV0aFNlcnZpY2UuaXNBdXRoZW50aWNhdGVkKCk7XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBzY29wZS5sb2dvdXQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgQ2FydEZhY3Rvcnkuc2F2ZUNhcnQoKVxuICAgICAgICAgICAgICAgIC50aGVuKGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBBdXRoU2VydmljZS5sb2dvdXQoKTtcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgIC50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAkc3RhdGUuZ28oJ2hvbWUnKTtcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgIC5jYXRjaCgkbG9nLmVycm9yKTtcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIHZhciBzZXRVc2VyID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIEF1dGhTZXJ2aWNlLmdldExvZ2dlZEluVXNlcigpLnRoZW4oZnVuY3Rpb24gKHVzZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgc2NvcGUudXNlciA9IHVzZXI7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICB2YXIgcmVtb3ZlVXNlciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBzY29wZS51c2VyID0gbnVsbDtcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIHNldFVzZXIoKTtcblxuICAgICAgICAgICAgJHJvb3RTY29wZS4kb24oQVVUSF9FVkVOVFMubG9naW5TdWNjZXNzLCBzZXRVc2VyKTtcbiAgICAgICAgICAgICRyb290U2NvcGUuJG9uKEFVVEhfRVZFTlRTLmxvZ291dFN1Y2Nlc3MsIHJlbW92ZVVzZXIpO1xuICAgICAgICAgICAgJHJvb3RTY29wZS4kb24oQVVUSF9FVkVOVFMuc2Vzc2lvblRpbWVvdXQsIHJlbW92ZVVzZXIpO1xuXG4gICAgICAgIH1cblxuICAgIH07XG5cbn0pO1xuXG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
>>>>>>> a88d336f4e848fb5e5d8313e37720f16e442b62f
