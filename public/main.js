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

    $scope.getNumReviews = ProductFactory.getNumReviews(1);

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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyIsImFib3V0L2Fib3V0LmpzIiwiY2FydC9jYXJ0LmpzIiwiY2hlY2tvdXQvY2hlY2tvdXQuanMiLCJkb2NzL2RvY3MuanMiLCJmc2EvZnNhLXByZS1idWlsdC5qcyIsImhvbWUvaG9tZS5qcyIsImxvZ2luL2xvZ2luLmpzIiwibWVtYmVycy1vbmx5L21lbWJlcnMtb25seS5qcyIsInByb2R1Y3QvcHJvZHVjdC5qcyIsInNpZ251cC9zaWdudXAuanMiLCJjb21tb24vZmFjdG9yaWVzL0NhcnRGYWN0b3J5LmpzIiwiY29tbW9uL2ZhY3Rvcmllcy9DaGVja291dEZhY3RvcnkuanMiLCJjb21tb24vZmFjdG9yaWVzL1Byb2R1Y3RGYWN0b3J5LmpzIiwiY29tbW9uL2RpcmVjdGl2ZXMvZ3JhY2Vob3BwZXItbG9nby9ncmFjZWhvcHBlci1sb2dvLmpzIiwiY29tbW9uL2RpcmVjdGl2ZXMvbmF2YmFyL25hdmJhci5qcyJdLCJuYW1lcyI6WyJ3aW5kb3ciLCJhcHAiLCJhbmd1bGFyIiwibW9kdWxlIiwiY29uZmlnIiwiJHVybFJvdXRlclByb3ZpZGVyIiwiJGxvY2F0aW9uUHJvdmlkZXIiLCJodG1sNU1vZGUiLCJvdGhlcndpc2UiLCJ3aGVuIiwibG9jYXRpb24iLCJyZWxvYWQiLCJydW4iLCIkcm9vdFNjb3BlIiwiQXV0aFNlcnZpY2UiLCIkc3RhdGUiLCJkZXN0aW5hdGlvblN0YXRlUmVxdWlyZXNBdXRoIiwic3RhdGUiLCJkYXRhIiwiYXV0aGVudGljYXRlIiwiJG9uIiwiZXZlbnQiLCJ0b1N0YXRlIiwidG9QYXJhbXMiLCJpc0F1dGhlbnRpY2F0ZWQiLCJwcmV2ZW50RGVmYXVsdCIsImdldExvZ2dlZEluVXNlciIsInRoZW4iLCJ1c2VyIiwiZ28iLCJuYW1lIiwiJHN0YXRlUHJvdmlkZXIiLCJ1cmwiLCJjb250cm9sbGVyIiwidGVtcGxhdGVVcmwiLCIkc2NvcGUiLCJGdWxsc3RhY2tQaWNzIiwiaW1hZ2VzIiwiXyIsInNodWZmbGUiLCJDYXJ0RmFjdG9yeSIsIiRsb2ciLCJpdGVtcyIsImdldEl0ZW1zIiwidG90YWwiLCJnZXRUb3RhbCIsImdldFVzZXJDYXJ0IiwiY2FydCIsImNhdGNoIiwiZXJyb3IiLCJhZGRUb0NhcnQiLCJmcmllbmRJZCIsImFkZEZyaWVuZFRvQ2FydCIsImNsZWFyQ2FydCIsInNhdmVDYXJ0IiwiZGVsZXRlSXRlbSIsInB1cmNoYXNlIiwib3JkZXIiLCJuZXdPcmRlciIsIkVycm9yIiwiZmFjdG9yeSIsImlvIiwib3JpZ2luIiwiY29uc3RhbnQiLCJsb2dpblN1Y2Nlc3MiLCJsb2dpbkZhaWxlZCIsImxvZ291dFN1Y2Nlc3MiLCJzZXNzaW9uVGltZW91dCIsIm5vdEF1dGhlbnRpY2F0ZWQiLCJub3RBdXRob3JpemVkIiwiJHEiLCJBVVRIX0VWRU5UUyIsInN0YXR1c0RpY3QiLCJyZXNwb25zZUVycm9yIiwicmVzcG9uc2UiLCIkYnJvYWRjYXN0Iiwic3RhdHVzIiwicmVqZWN0IiwiJGh0dHBQcm92aWRlciIsImludGVyY2VwdG9ycyIsInB1c2giLCIkaW5qZWN0b3IiLCJnZXQiLCJzZXJ2aWNlIiwiJGh0dHAiLCJTZXNzaW9uIiwib25TdWNjZXNzZnVsTG9naW4iLCJjcmVhdGUiLCJmcm9tU2VydmVyIiwibG9naW4iLCJjcmVkZW50aWFscyIsInBvc3QiLCJtZXNzYWdlIiwibG9nb3V0IiwiZGVzdHJveSIsInNlbGYiLCJzZXNzaW9uSWQiLCJQcm9kdWN0RmFjdG9yeSIsIm15SW50ZXJ2YWwiLCJub1dyYXBTbGlkZXMiLCJhY3RpdmUiLCJzbGlkZXMiLCJjdXJySW5kZXgiLCJhZGRTbGlkZSIsIm5ld1dpZHRoIiwibGVuZ3RoIiwiaW1hZ2UiLCJ0ZXh0IiwiaWQiLCJyYW5kb21pemUiLCJpbmRleGVzIiwiZ2VuZXJhdGVJbmRleGVzQXJyYXkiLCJhc3NpZ25OZXdJbmRleGVzVG9TbGlkZXMiLCJpIiwibCIsInBvcCIsImFycmF5IiwidG1wIiwiY3VycmVudCIsInRvcCIsIk1hdGgiLCJmbG9vciIsInJhbmRvbSIsInNlbmRMb2dpbiIsImxvZ2luSW5mbyIsInRlbXBsYXRlIiwiU2VjcmV0U3Rhc2giLCJnZXRTdGFzaCIsInN0YXNoIiwiZ2V0QWxsRnJpZW5kcyIsImFsbEZyaWVuZHMiLCJnZXROdW1SZXZpZXdzIiwic2lnblVwIiwiY2hlY2tJbmZvIiwic2VuZFNpZ25VcCIsInNpZ25VcEluZm8iLCJwYXNzd29yZCIsInBhc3N3b3JkQ29uZmlybSIsImdldENhcnRJdGVtcyIsImN1cnJlbnRJdGVtcyIsImxvY2FsU3RvcmFnZSIsImdldEl0ZW0iLCJzbGljZSIsImNhbGwiLCJKU09OIiwicGFyc2UiLCJnZXRDYXJ0VG90YWwiLCJjdXJyZW50VG90YWwiLCJjYWNoZWRDYXJ0SXRlbXMiLCJjYWNoZWRDYXJ0VG90YWwiLCJjYWxjdWxhdGVUb3RhbCIsIml0ZW1zQXJyYXkiLCJyZWR1Y2UiLCJhIiwiYiIsInByaWNlIiwibWFrZUpTT04iLCJzdHJpbmdpZnkiLCJPYmplY3QiLCJhc3NpZ24iLCJyZW1vdmVJdGVtIiwiY29uY2F0Iiwic2V0SXRlbSIsImZyaWVuZCIsImhvdXJzIiwibnVtSG91cnMiLCJpbmRleCIsImZpbmRJbmRleCIsIml0ZW0iLCJzcGxpY2UiLCJjaGVja291dEZhY3QiLCJnZXRGcmllbmQiLCJjb3VudCIsImRpcmVjdGl2ZSIsInJlc3RyaWN0Iiwic2NvcGUiLCJsaW5rIiwibGFiZWwiLCJhdXRoIiwiaXNMb2dnZWRJbiIsInNldFVzZXIiLCJyZW1vdmVVc2VyIl0sIm1hcHBpbmdzIjoiQUFBQTs7OztBQUNBQSxPQUFBQyxHQUFBLEdBQUFDLFFBQUFDLE1BQUEsQ0FBQSx1QkFBQSxFQUFBLENBQUEsYUFBQSxFQUFBLFdBQUEsRUFBQSxjQUFBLEVBQUEsV0FBQSxDQUFBLENBQUE7O0FBRUFGLElBQUFHLE1BQUEsQ0FBQSxVQUFBQyxrQkFBQSxFQUFBQyxpQkFBQSxFQUFBO0FBQ0E7QUFDQUEsc0JBQUFDLFNBQUEsQ0FBQSxJQUFBO0FBQ0E7QUFDQUYsdUJBQUFHLFNBQUEsQ0FBQSxHQUFBO0FBQ0E7QUFDQUgs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Q0F2Syx1QkFBQU8sR0FBQSxDQUFBbUQsWUFBQUwsYUFBQSxFQUFBbUgsVUFBQTtBQUNBeEssdUJBQUFPLEdBQUEsQ0FBQW1ELFlBQUFKLGNBQUEsRUFBQWtILFVBQUE7QUFFQTs7QUE5Q0EsS0FBQTtBQWtEQSxDQXBEQSIsImZpbGUiOiJtYWluLmpzIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBzdHJpY3QnO1xud2luZG93LmFwcCA9IGFuZ3VsYXIubW9kdWxlKCdGdWxsc3RhY2tHZW5lcmF0ZWRBcHAnLCBbJ2ZzYVByZUJ1aWx0JywgJ3VpLnJvdXRlcicsICd1aS5ib290c3RyYXAnLCAnbmdBbmltYXRlJ10pO1xuXG5hcHAuY29uZmlnKGZ1bmN0aW9uICgkdXJsUm91dGVyUHJvdmlkZXIsICRsb2NhdGlvblByb3ZpZGVyKSB7XG4gICAgLy8gVGhpcyB0dXJucyBvZmYgaGFzaGJhbmcgdXJscyAoLyNhYm91dCkgYW5kIGNoYW5nZXMgaXQgdG8gc29tZXRoaW5nIG5vcm1hbCAoL2Fib3V0KVxuICAgICRsb2NhdGlvblByb3ZpZGVyLmh0bWw1TW9kZSh0cnVlKTtcbiAgICAvLyBJZiB3ZSBnbyB0byBhIFVSTCB0aGF0IHVpLXJvdXRlciBkb2Vzbid0IGhhdmUgcmVnaXN0ZXJlZCwgZ28gdG8gdGhlIFwiL1wiIHVybC5cbiAgICAkdXJsUm91dGVyUHJvdmlkZXIub3RoZXJ3aXNlKCcvJyk7XG4gICAgLy8gVHJpZ2dlciBwYWdlIHJlZnJlc2ggd2hlbiBhY2Nlc3NpbmcgYW4gT0F1dGggcm91dGVcbiAgICAkdXJsUm91dGVyUHJvdmlkZXIud2hlbignL2F1dGgvOnByb3ZpZGVyJywgZnVuY3Rpb24gKCkge1xuICAgICAgICB3aW5kb3cubG9jYXRpb24ucmVsb2FkKCk7XG4gICAgfSk7XG59KTtcblxuLy8gVGhpcyBhcHAucnVuIGlzIGZvciBjb250cm9sbGluZyBhY2Nlc3MgdG8gc3BlY2lmaWMgc3RhdGVzLlxuYXBwLnJ1bihmdW5jdGlvbiAoJHJvb3RTY29wZSwgQXV0aFNlcnZpY2UsICRzdGF0ZSkge1xuXG4gICAgLy8gVGhlIGdpdmVuIHN0YXRlIHJlcXVpcmVzIGFuIGF1dGhlbnRpY2F0ZWQgdXNlci5cbiAgICB2YXIgZGVzdGluYXRpb25TdGF0ZVJlcXVpcmVzQXV0aCA9IGZ1bmN0aW9uIChzdGF0ZSkge1xuICAgICAgICByZXR1cm4gc3RhdGUuZGF0YSAmJiBzdGF0ZS5kYXRhLmF1dGhlbnRpY2F0ZTtcbiAgICB9O1xuXG4gICAgLy8gJHN0YXRlQ2hhbmdlU3RhcnQgaXMgYW4gZXZlbnQgZmlyZWRcbiAgICAvLyB3aGVuZXZlciB0aGUgcHJvY2VzcyBvZiBjaGFuZ2luZyBhIHN0YXRlIGJlZ2lucy5cbiAgICAkcm9vdFNjb3BlLiRvbignJHN0YXRlQ2hhbmdlU3RhcnQnLCBmdW5jdGlvbiAoZXZlbnQsIHRvU3RhdGUsIHRvUGFyYW1zKSB7XG5cbiAgICAgICAgaWYgKCFkZXN0aW5hdGlvblN0YXRlUmVxdWlyZXNBdXRoKHRvU3RhdGUpKSB7XG4gICAgICAgICAgICAvLyBUaGUgZGVzdGluYXRpb24gc3RhdGUgZG9lcyBub3QgcmVxdWlyZSBhdXRoZW50aWNhdGlvblxuICAgICAgICAgICAgLy8gU2hvcnQgY2lyY3VpdCB3aXRoIHJldHVybi5cbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChBdXRoU2VydmljZS5pc0F1dGhlbnRpY2F0ZWQoKSkge1xuICAgICAgICAgICAgLy8gVGhlIHVzZXIgaXMgYXV0aGVudGljYXRlZC5cbiAgICAgICAgICAgIC8vIFNob3J0IGNpcmN1aXQgd2l0aCByZXR1cm4uXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICAvLyBDYW5jZWwgbmF2aWdhdGluZyB0byBuZXcgc3RhdGUuXG4gICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG5cbiAgICAgICAgQXV0aFNlcnZpY2UuZ2V0TG9nZ2VkSW5Vc2VyKCkudGhlbihmdW5jdGlvbiAodXNlcikge1xuICAgICAgICAgICAgLy8gSWYgYSB1c2VyIGlzIHJldHJpZXZlZCwgdGhlbiByZW5hdmlnYXRlIHRvIHRoZSBkZXN0aW5hdGlvblxuICAgICAgICAgICAgLy8gKHRoZSBzZWNvbmQgdGltZSwgQXV0aFNlcnZpY2UuaXNBdXRoZW50aWNhdGVkKCkgd2lsbCB3b3JrKVxuICAgICAgICAgICAgLy8gb3RoZXJ3aXNlLCBpZiBubyB1c2VyIGlzIGxvZ2dlZCBpbiwgZ28gdG8gXCJsb2dpblwiIHN0YXRlLlxuICAgICAgICAgICAgaWYgKHVzZXIpIHtcbiAgICAgICAgICAgICAgICAkc3RhdGUuZ28odG9TdGF0ZS5uYW1lLCB0b1BhcmFtcyk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICRzdGF0ZS5nbygnbG9naW4nKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICB9KTtcblxufSk7XG4iLCJhcHAuY29uZmlnKGZ1bmN0aW9uICgkc3RhdGVQcm92aWRlcikge1xuXG4gICAgLy8gUmVnaXN0ZXIgb3VyICphYm91dCogc3RhdGUuXG4gICAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2Fib3V0Jywge1xuICAgICAgICB1cmw6ICcvYWJvdXQnLFxuICAgICAgICBjb250cm9sbGVyOiAnQWJvdXRDb250cm9sbGVyJyxcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdqcy9hYm91dC9hYm91dC5odG1sJ1xuICAgIH0pO1xuXG59KTtcblxuYXBwLmNvbnRyb2xsZXIoJ0Fib3V0Q29udHJvbGxlcicsIGZ1bmN0aW9uICgkc2NvcGUsIEZ1bGxzdGFja1BpY3MpIHtcblxuICAgIC8vIEltYWdlcyBvZiBiZWF1dGlmdWwgRnVsbHN0YWNrIHBlb3BsZS5cbiAgICAkc2NvcGUuaW1hZ2VzID0gXy5zaHVmZmxlKEZ1bGxzdGFja1BpY3MpO1xuXG59KTtcbiIsImFwcC5jb25maWcoZnVuY3Rpb24gKCRzdGF0ZVByb3ZpZGVyKSB7XG4gICAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2NhcnQnLCB7XG4gICAgICAgIHVybDogJy9jYXJ0JyxcbiAgICAgICAgY29udHJvbGxlcjogJ0NhcnRDb250cm9sbGVyJyxcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdqcy9jYXJ0L2NhcnQuaHRtbCdcbiAgICB9KTtcbn0pO1xuXG5cbmFwcC5jb25maWcoZnVuY3Rpb24gKCRzdGF0ZVByb3ZpZGVyKSB7XG4gICAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2NhcnQuY2hlY2tvdXQnLCB7XG4gICAgICAgIHVybDogJy9jaGVja291dCcsXG4gICAgICAgIGNvbnRyb2xsZXI6ICdDYXJ0Q29udHJvbGxlcicsXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnanMvY2hlY2tvdXQvY2hlY2tvdXQuaHRtbCdcbiAgICB9KTtcbn0pO1xuXG5cbmFwcC5jb250cm9sbGVyKCdDYXJ0Q29udHJvbGxlcicsIGZ1bmN0aW9uICgkc2NvcGUsIENhcnRGYWN0b3J5LCAkbG9nLCAkcm9vdFNjb3BlKSB7XG4gICRzY29wZS5pdGVtcyA9IENhcnRGYWN0b3J5LmdldEl0ZW1zKCk7XG4gICRzY29wZS50b3RhbCA9IENhcnRGYWN0b3J5LmdldFRvdGFsKCk7XG5cbiAgJHJvb3RTY29wZS4kb24oJ2F1dGgtbG9naW4tc3VjY2VzcycsIGZ1bmN0aW9uKCl7XG4gICAgQ2FydEZhY3RvcnkuZ2V0VXNlckNhcnQoKVxuICAgIC50aGVuKGZ1bmN0aW9uKGNhcnQpe1xuICAgICAgJHNjb3BlLml0ZW1zID0gY2FydC5pdGVtcztcbiAgICAgICRzY29wZS50b3RhbCA9IGNhcnQudG90YWw7XG4gICAgfSlcbiAgICAuY2F0Y2goJGxvZy5lcnJvcik7XG4gIH0pO1xuXG4gICRyb290U2NvcGUuJG9uKCdhdXRoLWxvZ291dC1zdWNjZXNzJywgZnVuY3Rpb24oKXtcbiAgICAkc2NvcGUuaXRlbXMgPSBDYXJ0RmFjdG9yeS5nZXRJdGVtcygpO1xuICAgICRzY29wZS50b3RhbCA9IENhcnRGYWN0b3J5LmdldFRvdGFsKCk7XG4gIH0pO1xuXG4gICRzY29wZS5nZXRVc2VyQ2FydCA9IGZ1bmN0aW9uKCl7XG4gICAgQ2FydEZhY3RvcnkuZ2V0VXNlckNhcnQoKVxuICAgIC50aGVuKGZ1bmN0aW9uKGNhcnQpe1xuICAgICAgJHNjb3BlLml0ZW1zID0gY2FydC5pdGVtcztcbiAgICAgICRzY29wZS50b3RhbCA9IGNhcnQudG90YWw7XG4gICAgfSlcbiAgICAuY2F0Y2goJGxvZy5lcnJvcilcbiAgfVxuICAkc2NvcGUuYWRkVG9DYXJ0ID0gZnVuY3Rpb24oZnJpZW5kSWQpe1xuICAgIENhcnRGYWN0b3J5LmFkZEZyaWVuZFRvQ2FydChmcmllbmRJZClcbiAgICAudGhlbihmdW5jdGlvbihjYXJ0KXtcbiAgICAgICRzY29wZS5pdGVtcyA9IGNhcnQuaXRlbXM7XG4gICAgICAkc2NvcGUudG90YWwgPSBjYXJ0LnRvdGFsO1xuICAgIH0pXG4gICAgLmNhdGNoKCRsb2cuZXJyb3IpO1xuICB9XG4gICRzY29wZS5jbGVhckNhcnQgPSBmdW5jdGlvbigpe1xuICAgIHZhciBjYXJ0ID0gQ2FydEZhY3RvcnkuY2xlYXJDYXJ0KCk7XG4gICAgICAkc2NvcGUuaXRlbXMgPSBjYXJ0Lml0ZW1zO1xuICAgICAgJHNjb3BlLnRvdGFsID0gY2FydC50b3RhbDtcbiAgfVxuICAkc2NvcGUuc2F2ZUNhcnQgPSBDYXJ0RmFjdG9yeS5zYXZlQ2FydDtcblxuICAgJHNjb3BlLmRlbGV0ZUl0ZW0gPSBmdW5jdGlvbihmcmllbmRJZCl7XG4gICAgdmFyIGNhcnQgPSBDYXJ0RmFjdG9yeS5kZWxldGVJdGVtKGZyaWVuZElkKTtcbiAgICAgICRzY29wZS5pdGVtcyA9IGNhcnQuaXRlbXM7XG4gICAgICAkc2NvcGUudG90YWwgPSBjYXJ0LnRvdGFsO1xuICB9XG4gICRzY29wZS5wdXJjaGFzZSA9IGZ1bmN0aW9uKCl7XG4gICAgQ2FydEZhY3RvcnkucHVyY2hhc2UoKVxuICAgIC50aGVuKGZ1bmN0aW9uKG9yZGVyKXtcbiAgICAgICRzY29wZS5uZXdPcmRlciA9IG9yZGVyO1xuICAgICAgJHNjb3BlLml0ZW1zID0gQ2FydEZhY3RvcnkuZ2V0SXRlbXMoKTtcbiAgICAgICRzY29wZS50b3RhbCA9IENhcnRGYWN0b3J5LmdldFRvdGFsKCk7XG4gICAgfSlcbiAgICAuY2F0Y2goJGxvZy5lcnJvcik7XG4gIH07XG59KTtcbiIsImFwcC5jb25maWcoZnVuY3Rpb24gKCRzdGF0ZVByb3ZpZGVyKSB7XG4gICAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2NvbXBsZXRlJywge1xuICAgICAgICB1cmw6ICcvY29tcGxldGUnLFxuICAgICAgICBjb250cm9sbGVyOiAnQ2hlY2tvdXRDb250cm9sbGVyJyxcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdqcy9jaGVja291dC9jaGVja291dENvbXBsZXRlLmh0bWwnXG4gICAgfSk7XG59KTtcblxuYXBwLmNvbnRyb2xsZXIoJ0NoZWNrb3V0Q29udHJvbGxlcicsIGZ1bmN0aW9uICgkc2NvcGUpIHtcblx0JHNjb3BlLnRvdGFsID0gODA7IC8vdGVzdFxufSk7XG5cbiIsImFwcC5jb25maWcoZnVuY3Rpb24gKCRzdGF0ZVByb3ZpZGVyKSB7XG4gICAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2RvY3MnLCB7XG4gICAgICAgIHVybDogJy9kb2NzJyxcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdqcy9zaG9wcGluZ0NhcnQvc2hvcHBpbmctY2FydC5odG1sJ1xuICAgIH0pO1xufSk7XG4iLCIoZnVuY3Rpb24gKCkge1xuXG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgLy8gSG9wZSB5b3UgZGlkbid0IGZvcmdldCBBbmd1bGFyISBEdWgtZG95LlxuICAgIGlmICghd2luZG93LmFuZ3VsYXIpIHRocm93IG5ldyBFcnJvcignSSBjYW5cXCd0IGZpbmQgQW5ndWxhciEnKTtcblxuICAgIHZhciBhcHAgPSBhbmd1bGFyLm1vZHVsZSgnZnNhUHJlQnVpbHQnLCBbXSk7XG5cbiAgICBhcHAuZmFjdG9yeSgnU29ja2V0JywgZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAoIXdpbmRvdy5pbykgdGhyb3cgbmV3IEVycm9yKCdzb2NrZXQuaW8gbm90IGZvdW5kIScpO1xuICAgICAgICByZXR1cm4gd2luZG93LmlvKHdpbmRvdy5sb2NhdGlvbi5vcmlnaW4pO1xuICAgIH0pO1xuXG4gICAgLy8gQVVUSF9FVkVOVFMgaXMgdXNlZCB0aHJvdWdob3V0IG91ciBhcHAgdG9cbiAgICAvLyBicm9hZGNhc3QgYW5kIGxpc3RlbiBmcm9tIGFuZCB0byB0aGUgJHJvb3RTY29wZVxuICAgIC8vIGZvciBpbXBvcnRhbnQgZXZlbnRzIGFib3V0IGF1dGhlbnRpY2F0aW9uIGZsb3cuXG4gICAgYXBwLmNvbnN0YW50KCdBVVRIX0VWRU5UUycsIHtcbiAgICAgICAgbG9naW5TdWNjZXNzOiAnYXV0aC1sb2dpbi1zdWNjZXNzJyxcbiAgICAgICAgbG9naW5GYWlsZWQ6ICdhdXRoLWxvZ2luLWZhaWxlZCcsXG4gICAgICAgIGxvZ291dFN1Y2Nlc3M6ICdhdXRoLWxvZ291dC1zdWNjZXNzJyxcbiAgICAgICAgc2Vzc2lvblRpbWVvdXQ6ICdhdXRoLXNlc3Npb24tdGltZW91dCcsXG4gICAgICAgIG5vdEF1dGhlbnRpY2F0ZWQ6ICdhdXRoLW5vdC1hdXRoZW50aWNhdGVkJyxcbiAgICAgICAgbm90QXV0aG9yaXplZDogJ2F1dGgtbm90LWF1dGhvcml6ZWQnXG4gICAgfSk7XG5cbiAgICBhcHAuZmFjdG9yeSgnQXV0aEludGVyY2VwdG9yJywgZnVuY3Rpb24gKCRyb290U2NvcGUsICRxLCBBVVRIX0VWRU5UUykge1xuICAgICAgICB2YXIgc3RhdHVzRGljdCA9IHtcbiAgICAgICAgICAgIDQwMTogQVVUSF9FVkVOVFMubm90QXV0aGVudGljYXRlZCxcbiAgICAgICAgICAgIDQwMzogQVVUSF9FVkVOVFMubm90QXV0aG9yaXplZCxcbiAgICAgICAgICAgIDQxOTogQVVUSF9FVkVOVFMuc2Vzc2lvblRpbWVvdXQsXG4gICAgICAgICAgICA0NDA6IEFVVEhfRVZFTlRTLnNlc3Npb25UaW1lb3V0XG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICByZXNwb25zZUVycm9yOiBmdW5jdGlvbiAocmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLiRicm9hZGNhc3Qoc3RhdHVzRGljdFtyZXNwb25zZS5zdGF0dXNdLCByZXNwb25zZSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuICRxLnJlamVjdChyZXNwb25zZSlcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9KTtcblxuICAgIGFwcC5jb25maWcoZnVuY3Rpb24gKCRodHRwUHJvdmlkZXIpIHtcbiAgICAgICAgJGh0dHBQcm92aWRlci5pbnRlcmNlcHRvcnMucHVzaChbXG4gICAgICAgICAgICAnJGluamVjdG9yJyxcbiAgICAgICAgICAgIGZ1bmN0aW9uICgkaW5qZWN0b3IpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gJGluamVjdG9yLmdldCgnQXV0aEludGVyY2VwdG9yJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIF0pO1xuICAgIH0pO1xuXG4gICAgYXBwLnNlcnZpY2UoJ0F1dGhTZXJ2aWNlJywgZnVuY3Rpb24gKCRodHRwLCBTZXNzaW9uLCAkcm9vdFNjb3BlLCBBVVRIX0VWRU5UUywgJHEpIHtcblxuICAgICAgICBmdW5jdGlvbiBvblN1Y2Nlc3NmdWxMb2dpbihyZXNwb25zZSkge1xuICAgICAgICAgICAgdmFyIHVzZXIgPSByZXNwb25zZS5kYXRhLnVzZXI7XG4gICAgICAgICAgICBTZXNzaW9uLmNyZWF0ZSh1c2VyKTtcbiAgICAgICAgICAgICRyb290U2NvcGUuJGJyb2FkY2FzdChBVVRIX0VWRU5UUy5sb2dpblN1Y2Nlc3MpO1xuICAgICAgICAgICAgcmV0dXJuIHVzZXI7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBVc2VzIHRoZSBzZXNzaW9uIGZhY3RvcnkgdG8gc2VlIGlmIGFuXG4gICAgICAgIC8vIGF1dGhlbnRpY2F0ZWQgdXNlciBpcyBjdXJyZW50bHkgcmVnaXN0ZXJlZC5cbiAgICAgICAgdGhpcy5pc0F1dGhlbnRpY2F0ZWQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gISFTZXNzaW9uLnVzZXI7XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5nZXRMb2dnZWRJblVzZXIgPSBmdW5jdGlvbiAoZnJvbVNlcnZlcikge1xuXG4gICAgICAgICAgICAvLyBJZiBhbiBhdXRoZW50aWNhdGVkIHNlc3Npb24gZXhpc3RzLCB3ZVxuICAgICAgICAgICAgLy8gcmV0dXJuIHRoZSB1c2VyIGF0dGFjaGVkIHRvIHRoYXQgc2Vzc2lvblxuICAgICAgICAgICAgLy8gd2l0aCBhIHByb21pc2UuIFRoaXMgZW5zdXJlcyB0aGF0IHdlIGNhblxuICAgICAgICAgICAgLy8gYWx3YXlzIGludGVyZmFjZSB3aXRoIHRoaXMgbWV0aG9kIGFzeW5jaHJvbm91c2x5LlxuXG4gICAgICAgICAgICAvLyBPcHRpb25hbGx5LCBpZiB0cnVlIGlzIGdpdmVuIGFzIHRoZSBmcm9tU2VydmVyIHBhcmFtZXRlcixcbiAgICAgICAgICAgIC8vIHRoZW4gdGhpcyBjYWNoZWQgdmFsdWUgd2lsbCBub3QgYmUgdXNlZC5cblxuICAgICAgICAgICAgaWYgKHRoaXMuaXNBdXRoZW50aWNhdGVkKCkgJiYgZnJvbVNlcnZlciAhPT0gdHJ1ZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiAkcS53aGVuKFNlc3Npb24udXNlcik7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIE1ha2UgcmVxdWVzdCBHRVQgL3Nlc3Npb24uXG4gICAgICAgICAgICAvLyBJZiBpdCByZXR1cm5zIGEgdXNlciwgY2FsbCBvblN1Y2Nlc3NmdWxMb2dpbiB3aXRoIHRoZSByZXNwb25zZS5cbiAgICAgICAgICAgIC8vIElmIGl0IHJldHVybnMgYSA0MDEgcmVzcG9uc2UsIHdlIGNhdGNoIGl0IGFuZCBpbnN0ZWFkIHJlc29sdmUgdG8gbnVsbC5cbiAgICAgICAgICAgIHJldHVybiAkaHR0cC5nZXQoJy9zZXNzaW9uJykudGhlbihvblN1Y2Nlc3NmdWxMb2dpbikuY2F0Y2goZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLmxvZ2luID0gZnVuY3Rpb24gKGNyZWRlbnRpYWxzKSB7XG4gICAgICAgICAgICByZXR1cm4gJGh0dHAucG9zdCgnL2xvZ2luJywgY3JlZGVudGlhbHMpXG4gICAgICAgICAgICAgICAgLnRoZW4ob25TdWNjZXNzZnVsTG9naW4pXG4gICAgICAgICAgICAgICAgLmNhdGNoKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuICRxLnJlamVjdCh7IG1lc3NhZ2U6ICdJbnZhbGlkIGxvZ2luIGNyZWRlbnRpYWxzLicgfSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5sb2dvdXQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gJGh0dHAuZ2V0KCcvbG9nb3V0JykudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgU2Vzc2lvbi5kZXN0cm95KCk7XG4gICAgICAgICAgICAgICAgJHJvb3RTY29wZS4kYnJvYWRjYXN0KEFVVEhfRVZFTlRTLmxvZ291dFN1Y2Nlc3MpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH07XG5cbiAgICB9KTtcblxuICAgIGFwcC5zZXJ2aWNlKCdTZXNzaW9uJywgZnVuY3Rpb24gKCRyb290U2NvcGUsIEFVVEhfRVZFTlRTKSB7XG5cbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgICAgICRyb290U2NvcGUuJG9uKEFVVEhfRVZFTlRTLm5vdEF1dGhlbnRpY2F0ZWQsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHNlbGYuZGVzdHJveSgpO1xuICAgICAgICB9KTtcblxuICAgICAgICAkcm9vdFNjb3BlLiRvbihBVVRIX0VWRU5UUy5zZXNzaW9uVGltZW91dCwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgc2VsZi5kZXN0cm95KCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHRoaXMudXNlciA9IG51bGw7XG5cbiAgICAgICAgdGhpcy5jcmVhdGUgPSBmdW5jdGlvbiAoc2Vzc2lvbklkLCB1c2VyKSB7XG4gICAgICAgICAgICB0aGlzLnVzZXIgPSB1c2VyO1xuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMuZGVzdHJveSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHRoaXMudXNlciA9IG51bGw7XG4gICAgICAgIH07XG5cbiAgICB9KTtcblxufSgpKTtcbiIsImFwcC5jb25maWcoZnVuY3Rpb24gKCRzdGF0ZVByb3ZpZGVyKSB7XG4gICAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2hvbWUnLCB7XG4gICAgICAgIHVybDogJy8nLFxuICAgICAgICB0ZW1wbGF0ZVVybDogJ2pzL2hvbWUvaG9tZS5odG1sJ1xuICAgIH0pO1xufSk7XG5cbmFwcC5jb250cm9sbGVyKCdDYXJvdXNlbEN0cmwnLCBmdW5jdGlvbiAoJHNjb3BlLCAkbG9nLCBQcm9kdWN0RmFjdG9yeSkge1xuICAkc2NvcGUubXlJbnRlcnZhbCA9IDUwMDA7XG4gICRzY29wZS5ub1dyYXBTbGlkZXMgPSBmYWxzZTtcbiAgJHNjb3BlLmFjdGl2ZSA9IDA7XG4gIHZhciBzbGlkZXMgPSAkc2NvcGUuc2xpZGVzID0gW107XG4gIHZhciBjdXJySW5kZXggPSAwO1xuXG4gICRzY29wZS5hZGRTbGlkZSA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBuZXdXaWR0aCA9IDYwMCArIHNsaWRlcy5sZW5ndGggKyAxO1xuICAgIHNsaWRlcy5wdXNoKHtcbiAgICAgIC8vIGltYWdlOiAnLy91bnNwbGFzaC5pdC8nICsgbmV3V2lkdGggKyAnLzMwMCcsXG4gICAgICBpbWFnZTogJy8vd3d3LmNvZGVybWF0Y2gubWUvYXNzZXRzL0NvZGVyLXctQnVkZHktNWE4M2ZkNTcwMmNmNjdmNWU5MzcwNGI2YzUzMTYyMDMuc3ZnJyxcbiAgICAgIHRleHQ6IFsnTmljZSBpbWFnZScsJ0F3ZXNvbWUgcGhvdG9ncmFwaCcsJ1RoYXQgaXMgc28gY29vbCcsJ0kgbG92ZSB0aGF0J11bc2xpZGVzLmxlbmd0aCAlIDRdLFxuICAgICAgaWQ6IGN1cnJJbmRleCsrXG4gICAgfSk7XG4gIH07XG5cbiAgJHNjb3BlLnJhbmRvbWl6ZSA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBpbmRleGVzID0gZ2VuZXJhdGVJbmRleGVzQXJyYXkoKTtcbiAgICBhc3NpZ25OZXdJbmRleGVzVG9TbGlkZXMoaW5kZXhlcyk7XG4gIH07XG5cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCA0OyBpKyspIHtcbiAgICAkc2NvcGUuYWRkU2xpZGUoKTtcbiAgfVxuXG4gIC8vIFJhbmRvbWl6ZSBsb2dpYyBiZWxvd1xuXG4gIGZ1bmN0aW9uIGFzc2lnbk5ld0luZGV4ZXNUb1NsaWRlcyhpbmRleGVzKSB7XG4gICAgZm9yICh2YXIgaSA9IDAsIGwgPSBzbGlkZXMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgICBzbGlkZXNbaV0uaWQgPSBpbmRleGVzLnBvcCgpO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGdlbmVyYXRlSW5kZXhlc0FycmF5KCkge1xuICAgIHZhciBpbmRleGVzID0gW107XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjdXJySW5kZXg7ICsraSkge1xuICAgICAgaW5kZXhlc1tpXSA9IGk7XG4gICAgfVxuICAgIHJldHVybiBzaHVmZmxlKGluZGV4ZXMpO1xuICB9XG5cbiAgLy8gaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL3F1ZXN0aW9ucy85NjI4MDIjOTYyODkwXG4gIGZ1bmN0aW9uIHNodWZmbGUoYXJyYXkpIHtcbiAgICB2YXIgdG1wLCBjdXJyZW50LCB0b3AgPSBhcnJheS5sZW5ndGg7XG5cbiAgICBpZiAodG9wKSB7XG4gICAgICB3aGlsZSAoLS10b3ApIHtcbiAgICAgICAgY3VycmVudCA9IE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqICh0b3AgKyAxKSk7XG4gICAgICAgIHRtcCA9IGFycmF5W2N1cnJlbnRdO1xuICAgICAgICBhcnJheVtjdXJyZW50XSA9IGFycmF5W3RvcF07XG4gICAgICAgIGFycmF5W3RvcF0gPSB0bXA7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIGFycmF5O1xuICB9XG59KTsiLCJhcHAuY29uZmlnKGZ1bmN0aW9uICgkc3RhdGVQcm92aWRlcikge1xuXG4gICAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2xvZ2luJywge1xuICAgICAgICB1cmw6ICcvbG9naW4nLFxuICAgICAgICB0ZW1wbGF0ZVVybDogJ2pzL2xvZ2luL2xvZ2luLmh0bWwnLFxuICAgICAgICBjb250cm9sbGVyOiAnTG9naW5DdHJsJ1xuICAgIH0pO1xuXG59KTtcblxuYXBwLmNvbnRyb2xsZXIoJ0xvZ2luQ3RybCcsIGZ1bmN0aW9uICgkc2NvcGUsIEF1dGhTZXJ2aWNlLCAkc3RhdGUpIHtcblxuICAgICRzY29wZS5sb2dpbiA9IHt9O1xuICAgICRzY29wZS5lcnJvciA9IG51bGw7XG5cbiAgICAkc2NvcGUuc2VuZExvZ2luID0gZnVuY3Rpb24gKGxvZ2luSW5mbykge1xuXG4gICAgICAgICRzY29wZS5lcnJvciA9IG51bGw7XG5cbiAgICAgICAgQXV0aFNlcnZpY2UubG9naW4obG9naW5JbmZvKVxuICAgICAgICAudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAkc3RhdGUuZ28oJ2hvbWUnKTtcbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICRzY29wZS5lcnJvciA9ICdJbnZhbGlkIGxvZ2luIGNyZWRlbnRpYWxzLic7XG4gICAgICAgIH0pO1xuXG4gICAgfTtcblxufSk7XG4iLCJhcHAuY29uZmlnKGZ1bmN0aW9uICgkc3RhdGVQcm92aWRlcikge1xuXG4gICAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ21lbWJlcnNPbmx5Jywge1xuICAgICAgICB1cmw6ICcvbWVtYmVycy1hcmVhJyxcbiAgICAgICAgdGVtcGxhdGU6ICc8aW1nIG5nLXJlcGVhdD1cIml0ZW0gaW4gc3Rhc2hcIiB3aWR0aD1cIjMwMFwiIG5nLXNyYz1cInt7IGl0ZW0gfX1cIiAvPicsXG4gICAgICAgIGNvbnRyb2xsZXI6IGZ1bmN0aW9uICgkc2NvcGUsIFNlY3JldFN0YXNoKSB7XG4gICAgICAgICAgICBTZWNyZXRTdGFzaC5nZXRTdGFzaCgpLnRoZW4oZnVuY3Rpb24gKHN0YXNoKSB7XG4gICAgICAgICAgICAgICAgJHNjb3BlLnN0YXNoID0gc3Rhc2g7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcbiAgICAgICAgLy8gVGhlIGZvbGxvd2luZyBkYXRhLmF1dGhlbnRpY2F0ZSBpcyByZWFkIGJ5IGFuIGV2ZW50IGxpc3RlbmVyXG4gICAgICAgIC8vIHRoYXQgY29udHJvbHMgYWNjZXNzIHRvIHRoaXMgc3RhdGUuIFJlZmVyIHRvIGFwcC5qcy5cbiAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgYXV0aGVudGljYXRlOiB0cnVlXG4gICAgICAgIH1cbiAgICB9KTtcblxufSk7XG5cbmFwcC5mYWN0b3J5KCdTZWNyZXRTdGFzaCcsIGZ1bmN0aW9uICgkaHR0cCkge1xuXG4gICAgdmFyIGdldFN0YXNoID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gJGh0dHAuZ2V0KCcvYXBpL21lbWJlcnMvc2VjcmV0LXN0YXNoJykudGhlbihmdW5jdGlvbiAocmVzcG9uc2UpIHtcbiAgICAgICAgICAgIHJldHVybiByZXNwb25zZS5kYXRhO1xuICAgICAgICB9KTtcbiAgICB9O1xuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgZ2V0U3Rhc2g6IGdldFN0YXNoXG4gICAgfTtcblxufSk7XG4iLCJhcHAuY29uZmlnKGZ1bmN0aW9uICgkc3RhdGVQcm92aWRlcikge1xuICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdwcm9kdWN0Jywge1xuICAgICAgICB1cmw6ICcvcHJvZHVjdCcsXG4gICAgICAgIGNvbnRyb2xsZXI6ICdQcm9kdWN0Q29udHJvbGxlcicsXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnanMvcHJvZHVjdC9wcm9kdWN0Lmh0bWwnXG4gICAgfSk7XG59KTtcblxuXG5hcHAuY29uZmlnKGZ1bmN0aW9uICgkc3RhdGVQcm92aWRlcikge1xuICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdwcm9kdWN0LmRlc2NyaXB0aW9uJywge1xuICAgICAgICB1cmw6ICcvZGVzY3JpcHRpb24nLFxuICAgICAgICB0ZW1wbGF0ZVVybDogJ2pzL3Byb2R1Y3QvcHJvZHVjdC1kZXNjcmlwdGlvbi5odG1sJ1xuICAgIH0pO1xufSk7XG5cblxuYXBwLmNvbmZpZyhmdW5jdGlvbiAoJHN0YXRlUHJvdmlkZXIpIHtcbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgncHJvZHVjdC5yZXZpZXcnLCB7XG4gICAgICAgIHVybDogJy9yZXZpZXcnLFxuICAgICAgICB0ZW1wbGF0ZVVybDogJ2pzL3Byb2R1Y3QvcHJvZHVjdC1yZXZpZXcuaHRtbCdcbiAgICB9KTtcbn0pO1xuXG5cblxuYXBwLmNvbnRyb2xsZXIoJ1Byb2R1Y3RDb250cm9sbGVyJywgZnVuY3Rpb24gKCRzY29wZSwgUHJvZHVjdEZhY3RvcnksIENhcnRGYWN0b3J5LCAkbG9nKSB7XG4gICAgXG4gICAgUHJvZHVjdEZhY3RvcnkuZ2V0QWxsRnJpZW5kcygpXG4gICAgLnRoZW4oZnVuY3Rpb24oYWxsRnJpZW5kcykge1xuICAgICAgICAkc2NvcGUuYWxsRnJpZW5kcyA9IGFsbEZyaWVuZHM7XG4gICAgfSlcbiAgICAuY2F0Y2goJGxvZy5lcnJvcik7XG5cbiAgICAkc2NvcGUuZ2V0TnVtUmV2aWV3cyA9IFByb2R1Y3RGYWN0b3J5LmdldE51bVJldmlld3MoMSk7XG5cblxuICAgICRzY29wZS5hZGRUb0NhcnQgPSBmdW5jdGlvbihmcmllbmRJZCl7XG4gICAgICAgIENhcnRGYWN0b3J5LmFkZEZyaWVuZFRvQ2FydChmcmllbmRJZClcbiAgICAgICAgLnRoZW4oZnVuY3Rpb24oY2FydCl7XG4gICAgICAgICAgJHNjb3BlLml0ZW1zID0gY2FydC5pdGVtcztcbiAgICAgICAgICAkc2NvcGUudG90YWwgPSBjYXJ0LnRvdGFsO1xuICAgICAgICB9KVxuICAgICAgICAuY2F0Y2goJGxvZy5lcnJvcik7XG4gICAgfVxuXG5cbn0pO1xuXG4iLCJhcHAuY29uZmlnKGZ1bmN0aW9uKCRzdGF0ZVByb3ZpZGVyKSB7XG5cdCRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdzaWdudXAnLCB7XG5cdFx0dXJsOiAnL3NpZ251cCcsXG5cdFx0dGVtcGxhdGVVcmw6ICdqcy9zaWdudXAvc2lnbnVwLmh0bWwnLFxuXHRcdGNvbnRyb2xsZXI6ICdTaWduVXBDdHJsJ1xuXHR9KTtcbn0pO1xuXG4vLyBORUVEIFRPIFVTRSBGT1JNIFZBTElEQVRJT05TIEZPUiBFTUFJTCwgQUREUkVTUywgRVRDXG5hcHAuY29udHJvbGxlcignU2lnblVwQ3RybCcsIGZ1bmN0aW9uKCRzY29wZSwgJHN0YXRlLCAkaHR0cCwgQXV0aFNlcnZpY2UpIHtcblx0Ly8gR2V0IGZyb20gbmctbW9kZWwgaW4gc2lnbnVwLmh0bWxcblx0JHNjb3BlLnNpZ25VcCA9IHt9O1xuXHQkc2NvcGUuY2hlY2tJbmZvID0ge307XG5cdCRzY29wZS5lcnJvciA9IG51bGw7XG5cblx0JHNjb3BlLnNlbmRTaWduVXAgPSBmdW5jdGlvbihzaWduVXBJbmZvKSB7XG5cdFx0JHNjb3BlLmVycm9yID0gbnVsbDtcblxuXHRcdGlmICgkc2NvcGUuc2lnblVwLnBhc3N3b3JkICE9PSAkc2NvcGUuY2hlY2tJbmZvLnBhc3N3b3JkQ29uZmlybSkge1xuXHRcdFx0JHNjb3BlLmVycm9yID0gJ1Bhc3N3b3JkcyBkbyBub3QgbWF0Y2gsIHBsZWFzZSByZS1lbnRlciBwYXNzd29yZC4nO1xuXHRcdH1cblx0XHRlbHNlIHtcblx0XHRcdCRodHRwLnBvc3QoJy9zaWdudXAnLCBzaWduVXBJbmZvKVxuXHRcdFx0LnRoZW4oZnVuY3Rpb24oKSB7XG5cdFx0XHRcdEF1dGhTZXJ2aWNlLmxvZ2luKHNpZ25VcEluZm8pXG5cdFx0XHRcdC50aGVuKGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdCRzdGF0ZS5nbygnaG9tZScpO1xuXHRcdFx0XHR9KTtcblx0XHRcdH0pXG5cdFx0XHQuY2F0Y2goZnVuY3Rpb24oKSB7XG5cdFx0XHRcdCRzY29wZS5lcnJvciA9ICdJbnZhbGlkIHNpZ251cCBjcmVkZW50aWFscy4nO1xuXHRcdFx0fSlcblx0XHR9XG5cdH1cbn0pO1xuIiwiYXBwLmZhY3RvcnkoJ0NhcnRGYWN0b3J5JywgZnVuY3Rpb24oJGh0dHAsICRsb2cpe1xuICBmdW5jdGlvbiBnZXRDYXJ0SXRlbXMoKXtcbiAgICB2YXIgY3VycmVudEl0ZW1zID0gbG9jYWxTdG9yYWdlLmdldEl0ZW0oJ2NhcnRJdGVtcycpO1xuICAgIGlmIChjdXJyZW50SXRlbXMpIHJldHVybiBbXS5zbGljZS5jYWxsKEpTT04ucGFyc2UoY3VycmVudEl0ZW1zKSk7XG4gICAgZWxzZSByZXR1cm4gW107XG4gIH1cblxuICBmdW5jdGlvbiBnZXRDYXJ0VG90YWwoKXtcbiAgICB2YXIgY3VycmVudFRvdGFsID0gbG9jYWxTdG9yYWdlLmdldEl0ZW0oJ2NhcnRUb3RhbCcpO1xuICAgIGlmIChjdXJyZW50VG90YWwpIHJldHVybiBKU09OLnBhcnNlKGN1cnJlbnRUb3RhbCk7XG4gICAgZWxzZSByZXR1cm4gMDtcbiAgfVxuXG4gIHZhciBjYWNoZWRDYXJ0SXRlbXMgPSBnZXRDYXJ0SXRlbXMoKTtcbiAgdmFyIGNhY2hlZENhcnRUb3RhbCA9IGdldENhcnRUb3RhbCgpO1xuXG4gIGZ1bmN0aW9uIGNhbGN1bGF0ZVRvdGFsKGl0ZW1zQXJyYXkpe1xuICAgIHJldHVybiBpdGVtc0FycmF5LnJlZHVjZShmdW5jdGlvbihhLCBiKXtcbiAgICAgIHJldHVybiBhICsgYi5wcmljZTtcbiAgICB9LCAwKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIG1ha2VKU09OKGFycmF5KXtcbiAgLy9jb252ZXJ0IHRoZSBpdGVtcyBhcnJheSBpbnRvIGEganNvbiBzdHJpbmcgb2YgYW4gYXJyYXktbGlrZSBvYmplY3RcbiAgICByZXR1cm4gSlNPTi5zdHJpbmdpZnkoT2JqZWN0LmFzc2lnbih7bGVuZ3RoOiBhcnJheS5sZW5ndGh9LCBhcnJheSkpO1xuICB9XG5cbiAgZnVuY3Rpb24gY2xlYXJDYXJ0KCl7XG4gICAgY2FjaGVkQ2FydEl0ZW1zID0gW107XG4gICAgY2FjaGVkQ2FydFRvdGFsID0gMDtcbiAgICBsb2NhbFN0b3JhZ2UucmVtb3ZlSXRlbSgnY2FydEl0ZW1zJyk7XG4gICAgbG9jYWxTdG9yYWdlLnJlbW92ZUl0ZW0oJ2NhcnRUb3RhbCcpO1xuICB9XG5cbiAgcmV0dXJuIHtcbiAgICBnZXRVc2VyQ2FydDogZnVuY3Rpb24oKXtcbiAgICAgIHJldHVybiAkaHR0cC5nZXQoJy9hcGkvY2FydCcpXG4gICAgICAudGhlbihmdW5jdGlvbihyZXNwb25zZSl7XG4gICAgICAgIGlmICh0eXBlb2YgcmVzcG9uc2UuZGF0YSA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgICBjYWNoZWRDYXJ0SXRlbXMgPSBjYWNoZWRDYXJ0SXRlbXMuY29uY2F0KHJlc3BvbnNlLmRhdGEpO1xuICAgICAgICAgIC8vdXBkYXRlIGxvY2FsIHN0b3JhZ2UgdG8gcmVsZWN0IHRoZSBjYWNoZWQgdmFsdWVzXG4gICAgICAgICAgY2FjaGVkQ2FydFRvdGFsID0gY2FsY3VsYXRlVG90YWwoY2FjaGVkQ2FydEl0ZW1zKVxuICAgICAgICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKCdjYXJ0SXRlbXMnLCBtYWtlSlNPTihjYWNoZWRDYXJ0SXRlbXMpKTtcbiAgICAgICAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbSgnY2FydFRvdGFsJywgY2FjaGVkQ2FydFRvdGFsKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4ge2l0ZW1zOiBjYWNoZWRDYXJ0SXRlbXMsIHRvdGFsOiBjYWNoZWRDYXJ0VG90YWx9O1xuICAgICAgfSlcbiAgICAgIC5jYXRjaCgkbG9nLmVycm9yKVxuICAgIH0sXG4gICAgYWRkRnJpZW5kVG9DYXJ0OiBmdW5jdGlvbihmcmllbmRJZCl7XG4gICAgICByZXR1cm4gJGh0dHAuZ2V0KCcvYXBpL2ZyaWVuZHMvJyArIGZyaWVuZElkKVxuICAgICAgLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICB2YXIgZnJpZW5kID0gcmVzcG9uc2UuZGF0YTtcbiAgICAgICAgY2FjaGVkQ2FydFRvdGFsICs9IGZyaWVuZC5wcmljZTtcbiAgICAgICAgY2FjaGVkQ2FydEl0ZW1zLnB1c2goe2ZyaWVuZElkOiBmcmllbmQuaWQsIG5hbWU6IGZyaWVuZC5uYW1lLCBwcmljZTogZnJpZW5kLnByaWNlLCBob3VyczogZnJpZW5kLm51bUhvdXJzfSk7XG4gICAgICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKCdjYXJ0VG90YWwnLCBjYWNoZWRDYXJ0VG90YWwpO1xuICAgICAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbSgnY2FydEl0ZW1zJywgbWFrZUpTT04oY2FjaGVkQ2FydEl0ZW1zKSk7XG4gICAgICAgIHJldHVybiB7aXRlbXM6IGNhY2hlZENhcnRJdGVtcywgdG90YWw6IGNhY2hlZENhcnRUb3RhbH07XG4gICAgICB9KVxuICAgICAgLmNhdGNoKCRsb2cuZXJyb3IpO1xuICAgIH0sXG4gICAgc2F2ZUNhcnQ6IGZ1bmN0aW9uKCl7XG4gICAgICByZXR1cm4gJGh0dHAucG9zdCgnL2FwaS9jYXJ0Jywge2l0ZW1zOiBjYWNoZWRDYXJ0SXRlbXN9KVxuICAgICAgLnRoZW4oZnVuY3Rpb24oKXtcbiAgICAgICAgY2xlYXJDYXJ0KCk7XG4gICAgICB9KVxuICAgICAgLmNhdGNoKCRsb2cuZXJyb3IpO1xuICAgIH0sXG4gICAgZ2V0SXRlbXM6IGZ1bmN0aW9uKCl7XG4gICAgICByZXR1cm4gY2FjaGVkQ2FydEl0ZW1zO1xuICAgIH0sXG4gICAgZ2V0VG90YWw6IGZ1bmN0aW9uKCl7XG4gICAgICByZXR1cm4gY2FjaGVkQ2FydFRvdGFsO1xuICAgIH0sXG4gICAgY2xlYXJDYXJ0OiBmdW5jdGlvbigpe1xuICAgICAgY2xlYXJDYXJ0KCk7XG4gICAgICByZXR1cm4ge2l0ZW1zOiBjYWNoZWRDYXJ0SXRlbXMsIHRvdGFsOiBjYWNoZWRDYXJ0VG90YWx9O1xuICAgIH0sXG4gICAgZGVsZXRlSXRlbTogZnVuY3Rpb24oZnJpZW5kSWQpe1xuICAgICAgdmFyIGluZGV4ID0gY2FjaGVkQ2FydEl0ZW1zLmZpbmRJbmRleChmdW5jdGlvbihpdGVtKXtcbiAgICAgICAgcmV0dXJuIGl0ZW0uZnJpZW5kSWQgPT09IGZyaWVuZElkO1xuICAgICAgfSk7XG4gICAgICBjYWNoZWRDYXJ0SXRlbXMuc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgIGNhY2hlZENhcnRUb3RhbCA9IGNhbGN1bGF0ZVRvdGFsKGNhY2hlZENhcnRJdGVtcyk7XG4gICAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbSgnY2FydFRvdGFsJywgY2FjaGVkQ2FydFRvdGFsKTtcbiAgICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKCdjYXJ0SXRlbXMnLCBtYWtlSlNPTihjYWNoZWRDYXJ0SXRlbXMpKTtcblxuICAgICAgcmV0dXJuIHtpdGVtczogY2FjaGVkQ2FydEl0ZW1zLCB0b3RhbDogY2FjaGVkQ2FydFRvdGFsfTtcbiAgICB9LFxuICAgIHB1cmNoYXNlOiBmdW5jdGlvbigpe1xuICAgICAgcmV0dXJuICRodHRwLnBvc3QoJy9hcGkvY2FydC9wdXJjaGFzZScsIHtpdGVtczogY2FjaGVkQ2FydEl0ZW1zfSlcbiAgICAgIC50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgY2xlYXJDYXJ0KCk7XG4gICAgICAgIHJldHVybiByZXNwb25zZS5kYXRhO1xuICAgICAgfSlcbiAgICAgIC5jYXRjaCgkbG9nLmVycm9yKTtcbiAgICB9XG4gIH1cbn0pO1xuIiwiYXBwLmZhY3RvcnkoJ0NoZWNrb3V0RmFjdG9yeScsIGZ1bmN0aW9uKCRodHRwLCAkbG9nKXtcblx0dmFyIGNoZWNrb3V0RmFjdCA9IHt9O1xuXHRyZXR1cm4gY2hlY2tvdXRGYWN0O1xufSk7XG4iLCJhcHAuZmFjdG9yeSgnUHJvZHVjdEZhY3RvcnknLCBmdW5jdGlvbigkaHR0cCwgJGxvZyl7XG5cbiAgcmV0dXJuIHtcblxuICAgIGdldEFsbEZyaWVuZHM6IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuICRodHRwLmdldCgnL2FwaS9mcmllbmRzJylcbiAgICAgIC50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG4gICAgICAgIHJldHVybiByZXNwb25zZS5kYXRhO1xuICAgICAgfSlcbiAgICAgIC5jYXRjaCgkbG9nLmVycm9yKTtcbiAgICB9LFxuXG4gICAgZ2V0RnJpZW5kOiBmdW5jdGlvbihmcmllbmRJZCkge1xuICAgICAgcmV0dXJuICRodHRwLmdldCgnL2FwaS9mcmllbmRzLycgKyBmcmllbmRJZClcbiAgICAgIC50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgcmV0dXJuIHJlc3BvbnNlLmRhdGE7XG4gICAgICB9KVxuICAgICAgLmNhdGNoKCRsb2cuZXJyb3IpXG4gICAgfSxcblxuICAgIC8vIGZyaWVuZFJhdGluZzogZnVuY3Rpb25cblxuICAgIGdldE51bVJldmlld3M6IGZ1bmN0aW9uKGZyaWVuZElkKSB7XG4gICAgICByZXR1cm4gJGh0dHAuZ2V0KCcvYXBpL2ZyaWVuZHMvJyArIGZyaWVuZElkICsgJy9mZWVkYmFjaycpXG4gICAgICAudGhlbihmdW5jdGlvbihyZXNwb25zZSkge1xuICAgICAgICByZXR1cm4gcmVzcG9uc2UuZGF0YS5jb3VudDtcbiAgICAgIH0pXG4gICAgICAuY2F0Y2goJGxvZy5lcnJvcilcbiAgICB9LFxuXG4gICAgLy8gZ2V0UmF0aW5nOiBmdW5jdGlvbihmcmllbmRJZCkge1xuXG4gICAgLy8gfVxuXG5cbiAgfTsgLy9lbmQgb2YgcmV0dXJuXG5cbn0pO1xuIiwiYXBwLmRpcmVjdGl2ZSgnZ3JhY2Vob3BwZXJMb2dvJywgZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB7XG4gICAgICAgIHJlc3RyaWN0OiAnRScsXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnanMvY29tbW9uL2RpcmVjdGl2ZXMvZ3JhY2Vob3BwZXItbG9nby9ncmFjZWhvcHBlci1sb2dvLmh0bWwnXG4gICAgfTtcbn0pO1xuIiwiYXBwLmRpcmVjdGl2ZSgnbmF2YmFyJywgZnVuY3Rpb24gKCRyb290U2NvcGUsIEF1dGhTZXJ2aWNlLCBBVVRIX0VWRU5UUywgJHN0YXRlLCBDYXJ0RmFjdG9yeSwgJGxvZykge1xuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgcmVzdHJpY3Q6ICdFJyxcbiAgICAgICAgc2NvcGU6IHt9LFxuICAgICAgICB0ZW1wbGF0ZVVybDogJ2pzL2NvbW1vbi9kaXJlY3RpdmVzL25hdmJhci9uYXZiYXIuaHRtbCcsXG4gICAgICAgIGxpbms6IGZ1bmN0aW9uIChzY29wZSkge1xuXG4gICAgICAgICAgICBzY29wZS5pdGVtcyA9IFtcbiAgICAgICAgICAgICAgICB7IGxhYmVsOiAnSG9tZScsIHN0YXRlOiAnaG9tZScgfSxcbiAgICAgICAgICAgICAgICB7IGxhYmVsOiAnQWJvdXQnLCBzdGF0ZTogJ2Fib3V0JyB9LFxuICAgICAgICAgICAgICAgIHsgbGFiZWw6ICdDaGVja291dCcsIHN0YXRlOiAnY2FydCcgfSxcbiAgICAgICAgICAgICAgICB7IGxhYmVsOiAnTWVtYmVycyBPbmx5Jywgc3RhdGU6ICdtZW1iZXJzT25seScsIGF1dGg6IHRydWUgfVxuICAgICAgICAgICAgXTtcblxuICAgICAgICAgICAgc2NvcGUudXNlciA9IG51bGw7XG5cbiAgICAgICAgICAgIHNjb3BlLmlzTG9nZ2VkSW4gPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIEF1dGhTZXJ2aWNlLmlzQXV0aGVudGljYXRlZCgpO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgc2NvcGUubG9nb3V0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIENhcnRGYWN0b3J5LnNhdmVDYXJ0KClcbiAgICAgICAgICAgICAgICAudGhlbihmdW5jdGlvbigpe1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gQXV0aFNlcnZpY2UubG9nb3V0KCk7XG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgJHN0YXRlLmdvKCdob21lJyk7XG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAuY2F0Y2goJGxvZy5lcnJvcik7XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICB2YXIgc2V0VXNlciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBBdXRoU2VydmljZS5nZXRMb2dnZWRJblVzZXIoKS50aGVuKGZ1bmN0aW9uICh1c2VyKSB7XG4gICAgICAgICAgICAgICAgICAgIHNjb3BlLnVzZXIgPSB1c2VyO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgdmFyIHJlbW92ZVVzZXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgc2NvcGUudXNlciA9IG51bGw7XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBzZXRVc2VyKCk7XG5cbiAgICAgICAgICAgICRyb290U2NvcGUuJG9uKEFVVEhfRVZFTlRTLmxvZ2luU3VjY2Vzcywgc2V0VXNlcik7XG4gICAgICAgICAgICAkcm9vdFNjb3BlLiRvbihBVVRIX0VWRU5UUy5sb2dvdXRTdWNjZXNzLCByZW1vdmVVc2VyKTtcbiAgICAgICAgICAgICRyb290U2NvcGUuJG9uKEFVVEhfRVZFTlRTLnNlc3Npb25UaW1lb3V0LCByZW1vdmVVc2VyKTtcblxuICAgICAgICB9XG5cbiAgICB9O1xuXG59KTtcblxuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
