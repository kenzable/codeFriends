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

    $scope.getReviews = ProductFactory.getReviews;

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

        getReviews: function getReviews(friendId) {
            return $http.get('/api/friends/' + friendId + '/feedback').then(function (response) {
                return response.data;
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

            scope.items = [{ label: 'Home', state: 'home' }, { label: 'About', state: 'about' }, { label: 'Cart Testing State!', state: 'cart' }, { label: 'Members Only', state: 'membersOnly', auth: true }];

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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyIsImFib3V0L2Fib3V0LmpzIiwiY2FydC9jYXJ0LmpzIiwiY2hlY2tvdXQvY2hlY2tvdXQuanMiLCJkb2NzL2RvY3MuanMiLCJmc2EvZnNhLXByZS1idWlsdC5qcyIsImhvbWUvaG9tZS5qcyIsImxvZ2luL2xvZ2luLmpzIiwibWVtYmVycy1vbmx5L21lbWJlcnMtb25seS5qcyIsInByb2R1Y3QvcHJvZHVjdC5qcyIsInNpZ251cC9zaWdudXAuanMiLCJjb21tb24vZmFjdG9yaWVzL0NhcnRGYWN0b3J5LmpzIiwiY29tbW9uL2ZhY3Rvcmllcy9DaGVja291dEZhY3RvcnkuanMiLCJjb21tb24vZmFjdG9yaWVzL0Z1bGxzdGFja1BpY3MuanMiLCJjb21tb24vZmFjdG9yaWVzL1Byb2R1Y3RGYWN0b3J5LmpzIiwiY29tbW9uL2ZhY3Rvcmllcy9SYW5kb21HcmVldGluZ3MuanMiLCJjb21tb24vZGlyZWN0aXZlcy9ncmFjZWhvcHBlci1sb2dvL2dyYWNlaG9wcGVyLWxvZ28uanMiLCJjb21tb24vZGlyZWN0aXZlcy9uYXZiYXIvbmF2YmFyLmpzIl0sIm5hbWVzIjpbIndpbmRvdyIsImFwcCIsImFuZ3VsYXIiLCJtb2R1bGUiLCJjb25maWciLCIkdXJsUm91dGVyUHJvdmlkZXIiLCIkbG9jYXRpb25Qcm92aWRlciIsImh0bWw1TW9kZSIsIm90aGVyd2lzZSIsIndoZW4iLCJsb2NhdGlvbiIsInJlbG9hZCIsInJ1biIsIiRyb290U2NvcGUiLCJBdXRoU2VydmljZSIsIiRzdGF0ZSIsImRlc3RpbmF0aW9uU3RhdGVSZXF1aXJlc0F1dGgiLCJzdGF0ZSIsImRhdGEiLCJhdXRoZW50aWNhdGUiLCIkb24iLCJldmVudCIsInRvU3RhdGUiLCJ0b1BhcmFtcyIsImlzQXV0aGVudGljYXRlZCIsInByZXZlbnREZWZhdWx0IiwiZ2V0TG9nZ2VkSW5Vc2VyIiwidGhlbiIsInVzZXIiLCJnbyIsIm5hbWUiLCIkc3RhdGVQcm92aWRlciIsInVybCIsImNvbnRyb2xsZXIiLCJ0ZW1wbGF0ZVVybCIsIiRzY29wZSIsIkZ1bGxzdGFja1BpY3MiLCJpbWFnZXMiLCJfIiwic2h1ZmZsZSIsIkNhcnRGYWN0b3J5IiwiJGxvZyIsIml0ZW1zIiwiZ2V0SXRlbXMiLCJ0b3RhbCIsImdldFRvdGFsIiwiZ2V0VXNlckNhcnQiLCJjYXJ0IiwiY2F0Y2giLCJlcnJvciIsImFkZFRvQ2FydCIsImZyaWVuZElkIiwiYWRkRnJpZW5kVG9DYXJ0IiwiY2xlYXJDYXJ0Iiwic2F2ZUNhcnQiLCJkZWxldGVJdGVtIiwicHVyY2hhc2UiLCJvcmRlciIsIm5ld09yZGVyIiwiRXJyb3IiLCJmYWN0b3J5IiwiaW8iLCJvcmlnaW4iLCJjb25zdGFudCIsImxvZ2luU3VjY2VzcyIsImxvZ2luRmFpbGVkIiwibG9nb3V0U3VjY2VzcyIsInNlc3Npb25UaW1lb3V0Iiwibm90QXV0aGVudGljYXRlZCIsIm5vdEF1dGhvcml6ZWQiLCIkcSIsIkFVVEhfRVZFTlRTIiwic3RhdHVzRGljdCIsInJlc3BvbnNlRXJyb3IiLCJyZXNwb25zZSIsIiRicm9hZGNhc3QiLCJzdGF0dXMiLCJyZWplY3QiLCIkaHR0cFByb3ZpZGVyIiwiaW50ZXJjZXB0b3JzIiwicHVzaCIsIiRpbmplY3RvciIsImdldCIsInNlcnZpY2UiLCIkaHR0cCIsIlNlc3Npb24iLCJvblN1Y2Nlc3NmdWxMb2dpbiIsImNyZWF0ZSIsImZyb21TZXJ2ZXIiLCJsb2dpbiIsImNyZWRlbnRpYWxzIiwicG9zdCIsIm1lc3NhZ2UiLCJsb2dvdXQiLCJkZXN0cm95Iiwic2VsZiIsInNlc3Npb25JZCIsIlByb2R1Y3RGYWN0b3J5IiwibXlJbnRlcnZhbCIsIm5vV3JhcFNsaWRlcyIsImFjdGl2ZSIsInNsaWRlcyIsImN1cnJJbmRleCIsImFkZFNsaWRlIiwibmV3V2lkdGgiLCJsZW5ndGgiLCJpbWFnZSIsInRleHQiLCJpZCIsInJhbmRvbWl6ZSIsImluZGV4ZXMiLCJnZW5lcmF0ZUluZGV4ZXNBcnJheSIsImFzc2lnbk5ld0luZGV4ZXNUb1NsaWRlcyIsImkiLCJsIiwicG9wIiwiYXJyYXkiLCJ0bXAiLCJjdXJyZW50IiwidG9wIiwiTWF0aCIsImZsb29yIiwicmFuZG9tIiwic2VuZExvZ2luIiwibG9naW5JbmZvIiwidGVtcGxhdGUiLCJTZWNyZXRTdGFzaCIsImdldFN0YXNoIiwic3Rhc2giLCJnZXRBbGxGcmllbmRzIiwiYWxsRnJpZW5kcyIsImdldFJldmlld3MiLCJzaWduVXAiLCJjaGVja0luZm8iLCJzZW5kU2lnblVwIiwic2lnblVwSW5mbyIsInBhc3N3b3JkIiwicGFzc3dvcmRDb25maXJtIiwiZ2V0Q2FydEl0ZW1zIiwiY3VycmVudEl0ZW1zIiwibG9jYWxTdG9yYWdlIiwiZ2V0SXRlbSIsInNsaWNlIiwiY2FsbCIsIkpTT04iLCJwYXJzZSIsImdldENhcnRUb3RhbCIsImN1cnJlbnRUb3RhbCIsImNhY2hlZENhcnRJdGVtcyIsImNhY2hlZENhcnRUb3RhbCIsImNhbGN1bGF0ZVRvdGFsIiwiaXRlbXNBcnJheSIsInJlZHVjZSIsImEiLCJiIiwicHJpY2UiLCJtYWtlSlNPTiIsInN0cmluZ2lmeSIsIk9iamVjdCIsImFzc2lnbiIsInJlbW92ZUl0ZW0iLCJjb25jYXQiLCJzZXRJdGVtIiwiZnJpZW5kIiwiaG91cnMiLCJudW1Ib3VycyIsImluZGV4IiwiZmluZEluZGV4IiwiaXRlbSIsInNwbGljZSIsImNoZWNrb3V0RmFjdCIsImdldEZyaWVuZCIsImdldFJhbmRvbUZyb21BcnJheSIsImFyciIsImdyZWV0aW5ncyIsImdldFJhbmRvbUdyZWV0aW5nIiwiZGlyZWN0aXZlIiwicmVzdHJpY3QiLCJzY29wZSIsImxpbmsiLCJsYWJlbCIsImF1dGgiLCJpc0xvZ2dlZEluIiwic2V0VXNlciIsInJlbW92ZVVzZXIiXSwibWFwcGluZ3MiOiJBQUFBOzs7O0FBQ0FBLE9BQUFDLEdBQUEsR0FBQUMsUUFBQUMsTUFBQSxDQUFBLHVCQUFBLEVBQUEsQ0FBQSxhQUFBLEVBQUEsV0FBQSxFQUFBLGNBQUEsRUFBQSxXQUFBLENBQUEsQ0FBQTs7QUFFQUYs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Syx1QkFBQU8sR0FBQSxDQUFBbUQsWUFBQUwsYUFBQSxFQUFBc0gsVUFBQTtBQUNBM0ssdUJBQUFPLEdBQUEsQ0FBQW1ELFlBQUFKLGNBQUEsRUFBQXFILFVBQUE7QUFFQTs7QUE5Q0EsS0FBQTtBQWtEQSxDQXBEQSIsImZpbGUiOiJtYWluLmpzIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBzdHJpY3QnO1xud2luZG93LmFwcCA9IGFuZ3VsYXIubW9kdWxlKCdGdWxsc3RhY2tHZW5lcmF0ZWRBcHAnLCBbJ2ZzYVByZUJ1aWx0JywgJ3VpLnJvdXRlcicsICd1aS5ib290c3RyYXAnLCAnbmdBbmltYXRlJ10pO1xuXG5hcHAuY29uZmlnKGZ1bmN0aW9uICgkdXJsUm91dGVyUHJvdmlkZXIsICRsb2NhdGlvblByb3ZpZGVyKSB7XG4gICAgLy8gVGhpcyB0dXJucyBvZmYgaGFzaGJhbmcgdXJscyAoLyNhYm91dCkgYW5kIGNoYW5nZXMgaXQgdG8gc29tZXRoaW5nIG5vcm1hbCAoL2Fib3V0KVxuICAgICRsb2NhdGlvblByb3ZpZGVyLmh0bWw1TW9kZSh0cnVlKTtcbiAgICAvLyBJZiB3ZSBnbyB0byBhIFVSTCB0aGF0IHVpLXJvdXRlciBkb2Vzbid0IGhhdmUgcmVnaXN0ZXJlZCwgZ28gdG8gdGhlIFwiL1wiIHVybC5cbiAgICAkdXJsUm91dGVyUHJvdmlkZXIub3RoZXJ3aXNlKCcvJyk7XG4gICAgLy8gVHJpZ2dlciBwYWdlIHJlZnJlc2ggd2hlbiBhY2Nlc3NpbmcgYW4gT0F1dGggcm91dGVcbiAgICAkdXJsUm91dGVyUHJvdmlkZXIud2hlbignL2F1dGgvOnByb3ZpZGVyJywgZnVuY3Rpb24gKCkge1xuICAgICAgICB3aW5kb3cubG9jYXRpb24ucmVsb2FkKCk7XG4gICAgfSk7XG59KTtcblxuLy8gVGhpcyBhcHAucnVuIGlzIGZvciBjb250cm9sbGluZyBhY2Nlc3MgdG8gc3BlY2lmaWMgc3RhdGVzLlxuYXBwLnJ1bihmdW5jdGlvbiAoJHJvb3RTY29wZSwgQXV0aFNlcnZpY2UsICRzdGF0ZSkge1xuXG4gICAgLy8gVGhlIGdpdmVuIHN0YXRlIHJlcXVpcmVzIGFuIGF1dGhlbnRpY2F0ZWQgdXNlci5cbiAgICB2YXIgZGVzdGluYXRpb25TdGF0ZVJlcXVpcmVzQXV0aCA9IGZ1bmN0aW9uIChzdGF0ZSkge1xuICAgICAgICByZXR1cm4gc3RhdGUuZGF0YSAmJiBzdGF0ZS5kYXRhLmF1dGhlbnRpY2F0ZTtcbiAgICB9O1xuXG4gICAgLy8gJHN0YXRlQ2hhbmdlU3RhcnQgaXMgYW4gZXZlbnQgZmlyZWRcbiAgICAvLyB3aGVuZXZlciB0aGUgcHJvY2VzcyBvZiBjaGFuZ2luZyBhIHN0YXRlIGJlZ2lucy5cbiAgICAkcm9vdFNjb3BlLiRvbignJHN0YXRlQ2hhbmdlU3RhcnQnLCBmdW5jdGlvbiAoZXZlbnQsIHRvU3RhdGUsIHRvUGFyYW1zKSB7XG5cbiAgICAgICAgaWYgKCFkZXN0aW5hdGlvblN0YXRlUmVxdWlyZXNBdXRoKHRvU3RhdGUpKSB7XG4gICAgICAgICAgICAvLyBUaGUgZGVzdGluYXRpb24gc3RhdGUgZG9lcyBub3QgcmVxdWlyZSBhdXRoZW50aWNhdGlvblxuICAgICAgICAgICAgLy8gU2hvcnQgY2lyY3VpdCB3aXRoIHJldHVybi5cbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChBdXRoU2VydmljZS5pc0F1dGhlbnRpY2F0ZWQoKSkge1xuICAgICAgICAgICAgLy8gVGhlIHVzZXIgaXMgYXV0aGVudGljYXRlZC5cbiAgICAgICAgICAgIC8vIFNob3J0IGNpcmN1aXQgd2l0aCByZXR1cm4uXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICAvLyBDYW5jZWwgbmF2aWdhdGluZyB0byBuZXcgc3RhdGUuXG4gICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG5cbiAgICAgICAgQXV0aFNlcnZpY2UuZ2V0TG9nZ2VkSW5Vc2VyKCkudGhlbihmdW5jdGlvbiAodXNlcikge1xuICAgICAgICAgICAgLy8gSWYgYSB1c2VyIGlzIHJldHJpZXZlZCwgdGhlbiByZW5hdmlnYXRlIHRvIHRoZSBkZXN0aW5hdGlvblxuICAgICAgICAgICAgLy8gKHRoZSBzZWNvbmQgdGltZSwgQXV0aFNlcnZpY2UuaXNBdXRoZW50aWNhdGVkKCkgd2lsbCB3b3JrKVxuICAgICAgICAgICAgLy8gb3RoZXJ3aXNlLCBpZiBubyB1c2VyIGlzIGxvZ2dlZCBpbiwgZ28gdG8gXCJsb2dpblwiIHN0YXRlLlxuICAgICAgICAgICAgaWYgKHVzZXIpIHtcbiAgICAgICAgICAgICAgICAkc3RhdGUuZ28odG9TdGF0ZS5uYW1lLCB0b1BhcmFtcyk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICRzdGF0ZS5nbygnbG9naW4nKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICB9KTtcblxufSk7XG4iLCJhcHAuY29uZmlnKGZ1bmN0aW9uICgkc3RhdGVQcm92aWRlcikge1xuXG4gICAgLy8gUmVnaXN0ZXIgb3VyICphYm91dCogc3RhdGUuXG4gICAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2Fib3V0Jywge1xuICAgICAgICB1cmw6ICcvYWJvdXQnLFxuICAgICAgICBjb250cm9sbGVyOiAnQWJvdXRDb250cm9sbGVyJyxcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdqcy9hYm91dC9hYm91dC5odG1sJ1xuICAgIH0pO1xuXG59KTtcblxuYXBwLmNvbnRyb2xsZXIoJ0Fib3V0Q29udHJvbGxlcicsIGZ1bmN0aW9uICgkc2NvcGUsIEZ1bGxzdGFja1BpY3MpIHtcblxuICAgIC8vIEltYWdlcyBvZiBiZWF1dGlmdWwgRnVsbHN0YWNrIHBlb3BsZS5cbiAgICAkc2NvcGUuaW1hZ2VzID0gXy5zaHVmZmxlKEZ1bGxzdGFja1BpY3MpO1xuXG59KTtcbiIsImFwcC5jb25maWcoZnVuY3Rpb24gKCRzdGF0ZVByb3ZpZGVyKSB7XG4gICAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2NhcnQnLCB7XG4gICAgICAgIHVybDogJy9jYXJ0JyxcbiAgICAgICAgY29udHJvbGxlcjogJ0NhcnRDb250cm9sbGVyJyxcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdqcy9jYXJ0L2NhcnQuaHRtbCdcbiAgICB9KTtcbn0pO1xuXG5cbmFwcC5jb25maWcoZnVuY3Rpb24gKCRzdGF0ZVByb3ZpZGVyKSB7XG4gICAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2NhcnQuY2hlY2tvdXQnLCB7XG4gICAgICAgIHVybDogJy9jaGVja291dCcsXG4gICAgICAgIGNvbnRyb2xsZXI6ICdDYXJ0Q29udHJvbGxlcicsXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnanMvY2hlY2tvdXQvY2hlY2tvdXQuaHRtbCdcbiAgICB9KTtcbn0pO1xuXG5cbmFwcC5jb250cm9sbGVyKCdDYXJ0Q29udHJvbGxlcicsIGZ1bmN0aW9uICgkc2NvcGUsIENhcnRGYWN0b3J5LCAkbG9nLCAkcm9vdFNjb3BlKSB7XG4gICRzY29wZS5pdGVtcyA9IENhcnRGYWN0b3J5LmdldEl0ZW1zKCk7XG4gICRzY29wZS50b3RhbCA9IENhcnRGYWN0b3J5LmdldFRvdGFsKCk7XG5cbiAgJHJvb3RTY29wZS4kb24oJ2F1dGgtbG9naW4tc3VjY2VzcycsIGZ1bmN0aW9uKCl7XG4gICAgQ2FydEZhY3RvcnkuZ2V0VXNlckNhcnQoKVxuICAgIC50aGVuKGZ1bmN0aW9uKGNhcnQpe1xuICAgICAgJHNjb3BlLml0ZW1zID0gY2FydC5pdGVtcztcbiAgICAgICRzY29wZS50b3RhbCA9IGNhcnQudG90YWw7XG4gICAgfSlcbiAgICAuY2F0Y2goJGxvZy5lcnJvcik7XG4gIH0pO1xuXG4gICRyb290U2NvcGUuJG9uKCdhdXRoLWxvZ291dC1zdWNjZXNzJywgZnVuY3Rpb24oKXtcbiAgICAkc2NvcGUuaXRlbXMgPSBDYXJ0RmFjdG9yeS5nZXRJdGVtcygpO1xuICAgICRzY29wZS50b3RhbCA9IENhcnRGYWN0b3J5LmdldFRvdGFsKCk7XG4gIH0pO1xuXG4gICRzY29wZS5nZXRVc2VyQ2FydCA9IGZ1bmN0aW9uKCl7XG4gICAgQ2FydEZhY3RvcnkuZ2V0VXNlckNhcnQoKVxuICAgIC50aGVuKGZ1bmN0aW9uKGNhcnQpe1xuICAgICAgJHNjb3BlLml0ZW1zID0gY2FydC5pdGVtcztcbiAgICAgICRzY29wZS50b3RhbCA9IGNhcnQudG90YWw7XG4gICAgfSlcbiAgICAuY2F0Y2goJGxvZy5lcnJvcilcbiAgfVxuICAkc2NvcGUuYWRkVG9DYXJ0ID0gZnVuY3Rpb24oZnJpZW5kSWQpe1xuICAgIENhcnRGYWN0b3J5LmFkZEZyaWVuZFRvQ2FydChmcmllbmRJZClcbiAgICAudGhlbihmdW5jdGlvbihjYXJ0KXtcbiAgICAgICRzY29wZS5pdGVtcyA9IGNhcnQuaXRlbXM7XG4gICAgICAkc2NvcGUudG90YWwgPSBjYXJ0LnRvdGFsO1xuICAgIH0pXG4gICAgLmNhdGNoKCRsb2cuZXJyb3IpO1xuICB9XG4gICRzY29wZS5jbGVhckNhcnQgPSBmdW5jdGlvbigpe1xuICAgIHZhciBjYXJ0ID0gQ2FydEZhY3RvcnkuY2xlYXJDYXJ0KCk7XG4gICAgICAkc2NvcGUuaXRlbXMgPSBjYXJ0Lml0ZW1zO1xuICAgICAgJHNjb3BlLnRvdGFsID0gY2FydC50b3RhbDtcbiAgfVxuICAkc2NvcGUuc2F2ZUNhcnQgPSBDYXJ0RmFjdG9yeS5zYXZlQ2FydDtcblxuICAgJHNjb3BlLmRlbGV0ZUl0ZW0gPSBmdW5jdGlvbihmcmllbmRJZCl7XG4gICAgdmFyIGNhcnQgPSBDYXJ0RmFjdG9yeS5kZWxldGVJdGVtKGZyaWVuZElkKTtcbiAgICAgICRzY29wZS5pdGVtcyA9IGNhcnQuaXRlbXM7XG4gICAgICAkc2NvcGUudG90YWwgPSBjYXJ0LnRvdGFsO1xuICB9XG4gICRzY29wZS5wdXJjaGFzZSA9IGZ1bmN0aW9uKCl7XG4gICAgQ2FydEZhY3RvcnkucHVyY2hhc2UoKVxuICAgIC50aGVuKGZ1bmN0aW9uKG9yZGVyKXtcbiAgICAgICRzY29wZS5uZXdPcmRlciA9IG9yZGVyO1xuICAgICAgJHNjb3BlLml0ZW1zID0gQ2FydEZhY3RvcnkuZ2V0SXRlbXMoKTtcbiAgICAgICRzY29wZS50b3RhbCA9IENhcnRGYWN0b3J5LmdldFRvdGFsKCk7XG4gICAgfSlcbiAgICAuY2F0Y2goJGxvZy5lcnJvcik7XG4gIH07XG59KTtcbiIsImFwcC5jb25maWcoZnVuY3Rpb24gKCRzdGF0ZVByb3ZpZGVyKSB7XG4gICAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2NvbXBsZXRlJywge1xuICAgICAgICB1cmw6ICcvY29tcGxldGUnLFxuICAgICAgICBjb250cm9sbGVyOiAnQ2hlY2tvdXRDb250cm9sbGVyJyxcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdqcy9jaGVja291dC9jaGVja291dENvbXBsZXRlLmh0bWwnXG4gICAgfSk7XG59KTtcblxuYXBwLmNvbnRyb2xsZXIoJ0NoZWNrb3V0Q29udHJvbGxlcicsIGZ1bmN0aW9uICgkc2NvcGUpIHtcblx0JHNjb3BlLnRvdGFsID0gODA7IC8vdGVzdFxufSk7XG5cbiIsImFwcC5jb25maWcoZnVuY3Rpb24gKCRzdGF0ZVByb3ZpZGVyKSB7XG4gICAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2RvY3MnLCB7XG4gICAgICAgIHVybDogJy9kb2NzJyxcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdqcy9zaG9wcGluZ0NhcnQvc2hvcHBpbmctY2FydC5odG1sJ1xuICAgIH0pO1xufSk7XG4iLCIoZnVuY3Rpb24gKCkge1xuXG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgLy8gSG9wZSB5b3UgZGlkbid0IGZvcmdldCBBbmd1bGFyISBEdWgtZG95LlxuICAgIGlmICghd2luZG93LmFuZ3VsYXIpIHRocm93IG5ldyBFcnJvcignSSBjYW5cXCd0IGZpbmQgQW5ndWxhciEnKTtcblxuICAgIHZhciBhcHAgPSBhbmd1bGFyLm1vZHVsZSgnZnNhUHJlQnVpbHQnLCBbXSk7XG5cbiAgICBhcHAuZmFjdG9yeSgnU29ja2V0JywgZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAoIXdpbmRvdy5pbykgdGhyb3cgbmV3IEVycm9yKCdzb2NrZXQuaW8gbm90IGZvdW5kIScpO1xuICAgICAgICByZXR1cm4gd2luZG93LmlvKHdpbmRvdy5sb2NhdGlvbi5vcmlnaW4pO1xuICAgIH0pO1xuXG4gICAgLy8gQVVUSF9FVkVOVFMgaXMgdXNlZCB0aHJvdWdob3V0IG91ciBhcHAgdG9cbiAgICAvLyBicm9hZGNhc3QgYW5kIGxpc3RlbiBmcm9tIGFuZCB0byB0aGUgJHJvb3RTY29wZVxuICAgIC8vIGZvciBpbXBvcnRhbnQgZXZlbnRzIGFib3V0IGF1dGhlbnRpY2F0aW9uIGZsb3cuXG4gICAgYXBwLmNvbnN0YW50KCdBVVRIX0VWRU5UUycsIHtcbiAgICAgICAgbG9naW5TdWNjZXNzOiAnYXV0aC1sb2dpbi1zdWNjZXNzJyxcbiAgICAgICAgbG9naW5GYWlsZWQ6ICdhdXRoLWxvZ2luLWZhaWxlZCcsXG4gICAgICAgIGxvZ291dFN1Y2Nlc3M6ICdhdXRoLWxvZ291dC1zdWNjZXNzJyxcbiAgICAgICAgc2Vzc2lvblRpbWVvdXQ6ICdhdXRoLXNlc3Npb24tdGltZW91dCcsXG4gICAgICAgIG5vdEF1dGhlbnRpY2F0ZWQ6ICdhdXRoLW5vdC1hdXRoZW50aWNhdGVkJyxcbiAgICAgICAgbm90QXV0aG9yaXplZDogJ2F1dGgtbm90LWF1dGhvcml6ZWQnXG4gICAgfSk7XG5cbiAgICBhcHAuZmFjdG9yeSgnQXV0aEludGVyY2VwdG9yJywgZnVuY3Rpb24gKCRyb290U2NvcGUsICRxLCBBVVRIX0VWRU5UUykge1xuICAgICAgICB2YXIgc3RhdHVzRGljdCA9IHtcbiAgICAgICAgICAgIDQwMTogQVVUSF9FVkVOVFMubm90QXV0aGVudGljYXRlZCxcbiAgICAgICAgICAgIDQwMzogQVVUSF9FVkVOVFMubm90QXV0aG9yaXplZCxcbiAgICAgICAgICAgIDQxOTogQVVUSF9FVkVOVFMuc2Vzc2lvblRpbWVvdXQsXG4gICAgICAgICAgICA0NDA6IEFVVEhfRVZFTlRTLnNlc3Npb25UaW1lb3V0XG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICByZXNwb25zZUVycm9yOiBmdW5jdGlvbiAocmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLiRicm9hZGNhc3Qoc3RhdHVzRGljdFtyZXNwb25zZS5zdGF0dXNdLCByZXNwb25zZSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuICRxLnJlamVjdChyZXNwb25zZSlcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9KTtcblxuICAgIGFwcC5jb25maWcoZnVuY3Rpb24gKCRodHRwUHJvdmlkZXIpIHtcbiAgICAgICAgJGh0dHBQcm92aWRlci5pbnRlcmNlcHRvcnMucHVzaChbXG4gICAgICAgICAgICAnJGluamVjdG9yJyxcbiAgICAgICAgICAgIGZ1bmN0aW9uICgkaW5qZWN0b3IpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gJGluamVjdG9yLmdldCgnQXV0aEludGVyY2VwdG9yJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIF0pO1xuICAgIH0pO1xuXG4gICAgYXBwLnNlcnZpY2UoJ0F1dGhTZXJ2aWNlJywgZnVuY3Rpb24gKCRodHRwLCBTZXNzaW9uLCAkcm9vdFNjb3BlLCBBVVRIX0VWRU5UUywgJHEpIHtcblxuICAgICAgICBmdW5jdGlvbiBvblN1Y2Nlc3NmdWxMb2dpbihyZXNwb25zZSkge1xuICAgICAgICAgICAgdmFyIHVzZXIgPSByZXNwb25zZS5kYXRhLnVzZXI7XG4gICAgICAgICAgICBTZXNzaW9uLmNyZWF0ZSh1c2VyKTtcbiAgICAgICAgICAgICRyb290U2NvcGUuJGJyb2FkY2FzdChBVVRIX0VWRU5UUy5sb2dpblN1Y2Nlc3MpO1xuICAgICAgICAgICAgcmV0dXJuIHVzZXI7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBVc2VzIHRoZSBzZXNzaW9uIGZhY3RvcnkgdG8gc2VlIGlmIGFuXG4gICAgICAgIC8vIGF1dGhlbnRpY2F0ZWQgdXNlciBpcyBjdXJyZW50bHkgcmVnaXN0ZXJlZC5cbiAgICAgICAgdGhpcy5pc0F1dGhlbnRpY2F0ZWQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gISFTZXNzaW9uLnVzZXI7XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5nZXRMb2dnZWRJblVzZXIgPSBmdW5jdGlvbiAoZnJvbVNlcnZlcikge1xuXG4gICAgICAgICAgICAvLyBJZiBhbiBhdXRoZW50aWNhdGVkIHNlc3Npb24gZXhpc3RzLCB3ZVxuICAgICAgICAgICAgLy8gcmV0dXJuIHRoZSB1c2VyIGF0dGFjaGVkIHRvIHRoYXQgc2Vzc2lvblxuICAgICAgICAgICAgLy8gd2l0aCBhIHByb21pc2UuIFRoaXMgZW5zdXJlcyB0aGF0IHdlIGNhblxuICAgICAgICAgICAgLy8gYWx3YXlzIGludGVyZmFjZSB3aXRoIHRoaXMgbWV0aG9kIGFzeW5jaHJvbm91c2x5LlxuXG4gICAgICAgICAgICAvLyBPcHRpb25hbGx5LCBpZiB0cnVlIGlzIGdpdmVuIGFzIHRoZSBmcm9tU2VydmVyIHBhcmFtZXRlcixcbiAgICAgICAgICAgIC8vIHRoZW4gdGhpcyBjYWNoZWQgdmFsdWUgd2lsbCBub3QgYmUgdXNlZC5cblxuICAgICAgICAgICAgaWYgKHRoaXMuaXNBdXRoZW50aWNhdGVkKCkgJiYgZnJvbVNlcnZlciAhPT0gdHJ1ZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiAkcS53aGVuKFNlc3Npb24udXNlcik7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIE1ha2UgcmVxdWVzdCBHRVQgL3Nlc3Npb24uXG4gICAgICAgICAgICAvLyBJZiBpdCByZXR1cm5zIGEgdXNlciwgY2FsbCBvblN1Y2Nlc3NmdWxMb2dpbiB3aXRoIHRoZSByZXNwb25zZS5cbiAgICAgICAgICAgIC8vIElmIGl0IHJldHVybnMgYSA0MDEgcmVzcG9uc2UsIHdlIGNhdGNoIGl0IGFuZCBpbnN0ZWFkIHJlc29sdmUgdG8gbnVsbC5cbiAgICAgICAgICAgIHJldHVybiAkaHR0cC5nZXQoJy9zZXNzaW9uJykudGhlbihvblN1Y2Nlc3NmdWxMb2dpbikuY2F0Y2goZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLmxvZ2luID0gZnVuY3Rpb24gKGNyZWRlbnRpYWxzKSB7XG4gICAgICAgICAgICByZXR1cm4gJGh0dHAucG9zdCgnL2xvZ2luJywgY3JlZGVudGlhbHMpXG4gICAgICAgICAgICAgICAgLnRoZW4ob25TdWNjZXNzZnVsTG9naW4pXG4gICAgICAgICAgICAgICAgLmNhdGNoKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuICRxLnJlamVjdCh7IG1lc3NhZ2U6ICdJbnZhbGlkIGxvZ2luIGNyZWRlbnRpYWxzLicgfSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5sb2dvdXQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gJGh0dHAuZ2V0KCcvbG9nb3V0JykudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgU2Vzc2lvbi5kZXN0cm95KCk7XG4gICAgICAgICAgICAgICAgJHJvb3RTY29wZS4kYnJvYWRjYXN0KEFVVEhfRVZFTlRTLmxvZ291dFN1Y2Nlc3MpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH07XG5cbiAgICB9KTtcblxuICAgIGFwcC5zZXJ2aWNlKCdTZXNzaW9uJywgZnVuY3Rpb24gKCRyb290U2NvcGUsIEFVVEhfRVZFTlRTKSB7XG5cbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgICAgICRyb290U2NvcGUuJG9uKEFVVEhfRVZFTlRTLm5vdEF1dGhlbnRpY2F0ZWQsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHNlbGYuZGVzdHJveSgpO1xuICAgICAgICB9KTtcblxuICAgICAgICAkcm9vdFNjb3BlLiRvbihBVVRIX0VWRU5UUy5zZXNzaW9uVGltZW91dCwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgc2VsZi5kZXN0cm95KCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHRoaXMudXNlciA9IG51bGw7XG5cbiAgICAgICAgdGhpcy5jcmVhdGUgPSBmdW5jdGlvbiAoc2Vzc2lvbklkLCB1c2VyKSB7XG4gICAgICAgICAgICB0aGlzLnVzZXIgPSB1c2VyO1xuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMuZGVzdHJveSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHRoaXMudXNlciA9IG51bGw7XG4gICAgICAgIH07XG5cbiAgICB9KTtcblxufSgpKTtcbiIsImFwcC5jb25maWcoZnVuY3Rpb24gKCRzdGF0ZVByb3ZpZGVyKSB7XG4gICAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2hvbWUnLCB7XG4gICAgICAgIHVybDogJy8nLFxuICAgICAgICB0ZW1wbGF0ZVVybDogJ2pzL2hvbWUvaG9tZS5odG1sJ1xuICAgIH0pO1xufSk7XG5cbmFwcC5jb250cm9sbGVyKCdDYXJvdXNlbEN0cmwnLCBmdW5jdGlvbiAoJHNjb3BlLCAkbG9nLCBQcm9kdWN0RmFjdG9yeSkge1xuICAkc2NvcGUubXlJbnRlcnZhbCA9IDUwMDA7XG4gICRzY29wZS5ub1dyYXBTbGlkZXMgPSBmYWxzZTtcbiAgJHNjb3BlLmFjdGl2ZSA9IDA7XG4gIHZhciBzbGlkZXMgPSAkc2NvcGUuc2xpZGVzID0gW107XG4gIHZhciBjdXJySW5kZXggPSAwO1xuXG4gICRzY29wZS5hZGRTbGlkZSA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBuZXdXaWR0aCA9IDYwMCArIHNsaWRlcy5sZW5ndGggKyAxO1xuICAgIHNsaWRlcy5wdXNoKHtcbiAgICAgIC8vIGltYWdlOiAnLy91bnNwbGFzaC5pdC8nICsgbmV3V2lkdGggKyAnLzMwMCcsXG4gICAgICBpbWFnZTogJy8vd3d3LmNvZGVybWF0Y2gubWUvYXNzZXRzL0NvZGVyLXctQnVkZHktNWE4M2ZkNTcwMmNmNjdmNWU5MzcwNGI2YzUzMTYyMDMuc3ZnJyxcbiAgICAgIHRleHQ6IFsnTmljZSBpbWFnZScsJ0F3ZXNvbWUgcGhvdG9ncmFwaCcsJ1RoYXQgaXMgc28gY29vbCcsJ0kgbG92ZSB0aGF0J11bc2xpZGVzLmxlbmd0aCAlIDRdLFxuICAgICAgaWQ6IGN1cnJJbmRleCsrXG4gICAgfSk7XG4gIH07XG5cbiAgJHNjb3BlLnJhbmRvbWl6ZSA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBpbmRleGVzID0gZ2VuZXJhdGVJbmRleGVzQXJyYXkoKTtcbiAgICBhc3NpZ25OZXdJbmRleGVzVG9TbGlkZXMoaW5kZXhlcyk7XG4gIH07XG5cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCA0OyBpKyspIHtcbiAgICAkc2NvcGUuYWRkU2xpZGUoKTtcbiAgfVxuXG4gIC8vIFJhbmRvbWl6ZSBsb2dpYyBiZWxvd1xuXG4gIGZ1bmN0aW9uIGFzc2lnbk5ld0luZGV4ZXNUb1NsaWRlcyhpbmRleGVzKSB7XG4gICAgZm9yICh2YXIgaSA9IDAsIGwgPSBzbGlkZXMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgICBzbGlkZXNbaV0uaWQgPSBpbmRleGVzLnBvcCgpO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGdlbmVyYXRlSW5kZXhlc0FycmF5KCkge1xuICAgIHZhciBpbmRleGVzID0gW107XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjdXJySW5kZXg7ICsraSkge1xuICAgICAgaW5kZXhlc1tpXSA9IGk7XG4gICAgfVxuICAgIHJldHVybiBzaHVmZmxlKGluZGV4ZXMpO1xuICB9XG5cbiAgLy8gaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL3F1ZXN0aW9ucy85NjI4MDIjOTYyODkwXG4gIGZ1bmN0aW9uIHNodWZmbGUoYXJyYXkpIHtcbiAgICB2YXIgdG1wLCBjdXJyZW50LCB0b3AgPSBhcnJheS5sZW5ndGg7XG5cbiAgICBpZiAodG9wKSB7XG4gICAgICB3aGlsZSAoLS10b3ApIHtcbiAgICAgICAgY3VycmVudCA9IE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqICh0b3AgKyAxKSk7XG4gICAgICAgIHRtcCA9IGFycmF5W2N1cnJlbnRdO1xuICAgICAgICBhcnJheVtjdXJyZW50XSA9IGFycmF5W3RvcF07XG4gICAgICAgIGFycmF5W3RvcF0gPSB0bXA7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIGFycmF5O1xuICB9XG59KTsiLCJhcHAuY29uZmlnKGZ1bmN0aW9uICgkc3RhdGVQcm92aWRlcikge1xuXG4gICAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2xvZ2luJywge1xuICAgICAgICB1cmw6ICcvbG9naW4nLFxuICAgICAgICB0ZW1wbGF0ZVVybDogJ2pzL2xvZ2luL2xvZ2luLmh0bWwnLFxuICAgICAgICBjb250cm9sbGVyOiAnTG9naW5DdHJsJ1xuICAgIH0pO1xuXG59KTtcblxuYXBwLmNvbnRyb2xsZXIoJ0xvZ2luQ3RybCcsIGZ1bmN0aW9uICgkc2NvcGUsIEF1dGhTZXJ2aWNlLCAkc3RhdGUpIHtcblxuICAgICRzY29wZS5sb2dpbiA9IHt9O1xuICAgICRzY29wZS5lcnJvciA9IG51bGw7XG5cbiAgICAkc2NvcGUuc2VuZExvZ2luID0gZnVuY3Rpb24gKGxvZ2luSW5mbykge1xuXG4gICAgICAgICRzY29wZS5lcnJvciA9IG51bGw7XG5cbiAgICAgICAgQXV0aFNlcnZpY2UubG9naW4obG9naW5JbmZvKVxuICAgICAgICAudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAkc3RhdGUuZ28oJ2hvbWUnKTtcbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICRzY29wZS5lcnJvciA9ICdJbnZhbGlkIGxvZ2luIGNyZWRlbnRpYWxzLic7XG4gICAgICAgIH0pO1xuXG4gICAgfTtcblxufSk7XG4iLCJhcHAuY29uZmlnKGZ1bmN0aW9uICgkc3RhdGVQcm92aWRlcikge1xuXG4gICAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ21lbWJlcnNPbmx5Jywge1xuICAgICAgICB1cmw6ICcvbWVtYmVycy1hcmVhJyxcbiAgICAgICAgdGVtcGxhdGU6ICc8aW1nIG5nLXJlcGVhdD1cIml0ZW0gaW4gc3Rhc2hcIiB3aWR0aD1cIjMwMFwiIG5nLXNyYz1cInt7IGl0ZW0gfX1cIiAvPicsXG4gICAgICAgIGNvbnRyb2xsZXI6IGZ1bmN0aW9uICgkc2NvcGUsIFNlY3JldFN0YXNoKSB7XG4gICAgICAgICAgICBTZWNyZXRTdGFzaC5nZXRTdGFzaCgpLnRoZW4oZnVuY3Rpb24gKHN0YXNoKSB7XG4gICAgICAgICAgICAgICAgJHNjb3BlLnN0YXNoID0gc3Rhc2g7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcbiAgICAgICAgLy8gVGhlIGZvbGxvd2luZyBkYXRhLmF1dGhlbnRpY2F0ZSBpcyByZWFkIGJ5IGFuIGV2ZW50IGxpc3RlbmVyXG4gICAgICAgIC8vIHRoYXQgY29udHJvbHMgYWNjZXNzIHRvIHRoaXMgc3RhdGUuIFJlZmVyIHRvIGFwcC5qcy5cbiAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgYXV0aGVudGljYXRlOiB0cnVlXG4gICAgICAgIH1cbiAgICB9KTtcblxufSk7XG5cbmFwcC5mYWN0b3J5KCdTZWNyZXRTdGFzaCcsIGZ1bmN0aW9uICgkaHR0cCkge1xuXG4gICAgdmFyIGdldFN0YXNoID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gJGh0dHAuZ2V0KCcvYXBpL21lbWJlcnMvc2VjcmV0LXN0YXNoJykudGhlbihmdW5jdGlvbiAocmVzcG9uc2UpIHtcbiAgICAgICAgICAgIHJldHVybiByZXNwb25zZS5kYXRhO1xuICAgICAgICB9KTtcbiAgICB9O1xuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgZ2V0U3Rhc2g6IGdldFN0YXNoXG4gICAgfTtcblxufSk7XG4iLCJhcHAuY29uZmlnKGZ1bmN0aW9uICgkc3RhdGVQcm92aWRlcikge1xuICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdwcm9kdWN0Jywge1xuICAgICAgICB1cmw6ICcvcHJvZHVjdCcsXG4gICAgICAgIGNvbnRyb2xsZXI6ICdQcm9kdWN0Q29udHJvbGxlcicsXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnanMvcHJvZHVjdC9wcm9kdWN0Lmh0bWwnXG4gICAgfSk7XG59KTtcblxuXG5hcHAuY29uZmlnKGZ1bmN0aW9uICgkc3RhdGVQcm92aWRlcikge1xuICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdwcm9kdWN0LmRlc2NyaXB0aW9uJywge1xuICAgICAgICB1cmw6ICcvZGVzY3JpcHRpb24nLFxuICAgICAgICB0ZW1wbGF0ZVVybDogJ2pzL3Byb2R1Y3QvcHJvZHVjdC1kZXNjcmlwdGlvbi5odG1sJ1xuICAgIH0pO1xufSk7XG5cblxuYXBwLmNvbmZpZyhmdW5jdGlvbiAoJHN0YXRlUHJvdmlkZXIpIHtcbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgncHJvZHVjdC5yZXZpZXcnLCB7XG4gICAgICAgIHVybDogJy9yZXZpZXcnLFxuICAgICAgICB0ZW1wbGF0ZVVybDogJ2pzL3Byb2R1Y3QvcHJvZHVjdC1yZXZpZXcuaHRtbCdcbiAgICB9KTtcbn0pO1xuXG5cblxuYXBwLmNvbnRyb2xsZXIoJ1Byb2R1Y3RDb250cm9sbGVyJywgZnVuY3Rpb24gKCRzY29wZSwgUHJvZHVjdEZhY3RvcnksIENhcnRGYWN0b3J5LCAkbG9nKSB7XG4gICAgUHJvZHVjdEZhY3RvcnkuZ2V0QWxsRnJpZW5kcygpXG4gICAgLnRoZW4oZnVuY3Rpb24oYWxsRnJpZW5kcykge1xuICAgICAgICAkc2NvcGUuYWxsRnJpZW5kcyA9IGFsbEZyaWVuZHM7XG4gICAgfSlcbiAgICAuY2F0Y2goJGxvZy5lcnJvcik7XG5cbiAgICAkc2NvcGUuZ2V0UmV2aWV3cyA9IFByb2R1Y3RGYWN0b3J5LmdldFJldmlld3M7XG5cbiAgICAkc2NvcGUuYWRkVG9DYXJ0ID0gZnVuY3Rpb24oZnJpZW5kSWQpe1xuICAgICAgICBDYXJ0RmFjdG9yeS5hZGRGcmllbmRUb0NhcnQoZnJpZW5kSWQpXG4gICAgICAgIC50aGVuKGZ1bmN0aW9uKGNhcnQpe1xuICAgICAgICAgICRzY29wZS5pdGVtcyA9IGNhcnQuaXRlbXM7XG4gICAgICAgICAgJHNjb3BlLnRvdGFsID0gY2FydC50b3RhbDtcbiAgICAgICAgICBcbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKCRsb2cuZXJyb3IpO1xuICAgIH1cblxuXG5cbn0pO1xuXG4iLCJhcHAuY29uZmlnKGZ1bmN0aW9uKCRzdGF0ZVByb3ZpZGVyKSB7XG5cdCRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdzaWdudXAnLCB7XG5cdFx0dXJsOiAnL3NpZ251cCcsXG5cdFx0dGVtcGxhdGVVcmw6ICdqcy9zaWdudXAvc2lnbnVwLmh0bWwnLFxuXHRcdGNvbnRyb2xsZXI6ICdTaWduVXBDdHJsJ1xuXHR9KTtcbn0pO1xuXG4vLyBORUVEIFRPIFVTRSBGT1JNIFZBTElEQVRJT05TIEZPUiBFTUFJTCwgQUREUkVTUywgRVRDXG5hcHAuY29udHJvbGxlcignU2lnblVwQ3RybCcsIGZ1bmN0aW9uKCRzY29wZSwgJHN0YXRlLCAkaHR0cCwgQXV0aFNlcnZpY2UpIHtcblx0Ly8gR2V0IGZyb20gbmctbW9kZWwgaW4gc2lnbnVwLmh0bWxcblx0JHNjb3BlLnNpZ25VcCA9IHt9O1xuXHQkc2NvcGUuY2hlY2tJbmZvID0ge307XG5cdCRzY29wZS5lcnJvciA9IG51bGw7XG5cblx0JHNjb3BlLnNlbmRTaWduVXAgPSBmdW5jdGlvbihzaWduVXBJbmZvKSB7XG5cdFx0JHNjb3BlLmVycm9yID0gbnVsbDtcblxuXHRcdGlmICgkc2NvcGUuc2lnblVwLnBhc3N3b3JkICE9PSAkc2NvcGUuY2hlY2tJbmZvLnBhc3N3b3JkQ29uZmlybSkge1xuXHRcdFx0JHNjb3BlLmVycm9yID0gJ1Bhc3N3b3JkcyBkbyBub3QgbWF0Y2gsIHBsZWFzZSByZS1lbnRlciBwYXNzd29yZC4nO1xuXHRcdH1cblx0XHRlbHNlIHtcblx0XHRcdCRodHRwLnBvc3QoJy9zaWdudXAnLCBzaWduVXBJbmZvKVxuXHRcdFx0LnRoZW4oZnVuY3Rpb24oKSB7XG5cdFx0XHRcdEF1dGhTZXJ2aWNlLmxvZ2luKHNpZ25VcEluZm8pXG5cdFx0XHRcdC50aGVuKGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdCRzdGF0ZS5nbygnaG9tZScpO1xuXHRcdFx0XHR9KTtcblx0XHRcdH0pXG5cdFx0XHQuY2F0Y2goZnVuY3Rpb24oKSB7XG5cdFx0XHRcdCRzY29wZS5lcnJvciA9ICdJbnZhbGlkIHNpZ251cCBjcmVkZW50aWFscy4nO1xuXHRcdFx0fSlcblx0XHR9XG5cdH1cbn0pO1xuIiwiYXBwLmZhY3RvcnkoJ0NhcnRGYWN0b3J5JywgZnVuY3Rpb24oJGh0dHAsICRsb2cpe1xuICBmdW5jdGlvbiBnZXRDYXJ0SXRlbXMoKXtcbiAgICB2YXIgY3VycmVudEl0ZW1zID0gbG9jYWxTdG9yYWdlLmdldEl0ZW0oJ2NhcnRJdGVtcycpO1xuICAgIGlmIChjdXJyZW50SXRlbXMpIHJldHVybiBbXS5zbGljZS5jYWxsKEpTT04ucGFyc2UoY3VycmVudEl0ZW1zKSk7XG4gICAgZWxzZSByZXR1cm4gW107XG4gIH1cblxuICBmdW5jdGlvbiBnZXRDYXJ0VG90YWwoKXtcbiAgICB2YXIgY3VycmVudFRvdGFsID0gbG9jYWxTdG9yYWdlLmdldEl0ZW0oJ2NhcnRUb3RhbCcpO1xuICAgIGlmIChjdXJyZW50VG90YWwpIHJldHVybiBKU09OLnBhcnNlKGN1cnJlbnRUb3RhbCk7XG4gICAgZWxzZSByZXR1cm4gMDtcbiAgfVxuXG4gIHZhciBjYWNoZWRDYXJ0SXRlbXMgPSBnZXRDYXJ0SXRlbXMoKTtcbiAgdmFyIGNhY2hlZENhcnRUb3RhbCA9IGdldENhcnRUb3RhbCgpO1xuXG4gIGZ1bmN0aW9uIGNhbGN1bGF0ZVRvdGFsKGl0ZW1zQXJyYXkpe1xuICAgIHJldHVybiBpdGVtc0FycmF5LnJlZHVjZShmdW5jdGlvbihhLCBiKXtcbiAgICAgIHJldHVybiBhICsgYi5wcmljZTtcbiAgICB9LCAwKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIG1ha2VKU09OKGFycmF5KXtcbiAgLy9jb252ZXJ0IHRoZSBpdGVtcyBhcnJheSBpbnRvIGEganNvbiBzdHJpbmcgb2YgYW4gYXJyYXktbGlrZSBvYmplY3RcbiAgICByZXR1cm4gSlNPTi5zdHJpbmdpZnkoT2JqZWN0LmFzc2lnbih7bGVuZ3RoOiBhcnJheS5sZW5ndGh9LCBhcnJheSkpO1xuICB9XG5cbiAgZnVuY3Rpb24gY2xlYXJDYXJ0KCl7XG4gICAgY2FjaGVkQ2FydEl0ZW1zID0gW107XG4gICAgY2FjaGVkQ2FydFRvdGFsID0gMDtcbiAgICBsb2NhbFN0b3JhZ2UucmVtb3ZlSXRlbSgnY2FydEl0ZW1zJyk7XG4gICAgbG9jYWxTdG9yYWdlLnJlbW92ZUl0ZW0oJ2NhcnRUb3RhbCcpO1xuICB9XG5cbiAgcmV0dXJuIHtcbiAgICBnZXRVc2VyQ2FydDogZnVuY3Rpb24oKXtcbiAgICAgIHJldHVybiAkaHR0cC5nZXQoJy9hcGkvY2FydCcpXG4gICAgICAudGhlbihmdW5jdGlvbihyZXNwb25zZSl7XG4gICAgICAgIGlmICh0eXBlb2YgcmVzcG9uc2UuZGF0YSA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgICBjYWNoZWRDYXJ0SXRlbXMgPSBjYWNoZWRDYXJ0SXRlbXMuY29uY2F0KHJlc3BvbnNlLmRhdGEpO1xuICAgICAgICAgIC8vdXBkYXRlIGxvY2FsIHN0b3JhZ2UgdG8gcmVsZWN0IHRoZSBjYWNoZWQgdmFsdWVzXG4gICAgICAgICAgY2FjaGVkQ2FydFRvdGFsID0gY2FsY3VsYXRlVG90YWwoY2FjaGVkQ2FydEl0ZW1zKVxuICAgICAgICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKCdjYXJ0SXRlbXMnLCBtYWtlSlNPTihjYWNoZWRDYXJ0SXRlbXMpKTtcbiAgICAgICAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbSgnY2FydFRvdGFsJywgY2FjaGVkQ2FydFRvdGFsKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4ge2l0ZW1zOiBjYWNoZWRDYXJ0SXRlbXMsIHRvdGFsOiBjYWNoZWRDYXJ0VG90YWx9O1xuICAgICAgfSlcbiAgICAgIC5jYXRjaCgkbG9nLmVycm9yKVxuICAgIH0sXG4gICAgYWRkRnJpZW5kVG9DYXJ0OiBmdW5jdGlvbihmcmllbmRJZCl7XG4gICAgICByZXR1cm4gJGh0dHAuZ2V0KCcvYXBpL2ZyaWVuZHMvJyArIGZyaWVuZElkKVxuICAgICAgLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICB2YXIgZnJpZW5kID0gcmVzcG9uc2UuZGF0YTtcbiAgICAgICAgY2FjaGVkQ2FydFRvdGFsICs9IGZyaWVuZC5wcmljZTtcbiAgICAgICAgY2FjaGVkQ2FydEl0ZW1zLnB1c2goe2ZyaWVuZElkOiBmcmllbmQuaWQsIG5hbWU6IGZyaWVuZC5uYW1lLCBwcmljZTogZnJpZW5kLnByaWNlLCBob3VyczogZnJpZW5kLm51bUhvdXJzfSk7XG4gICAgICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKCdjYXJ0VG90YWwnLCBjYWNoZWRDYXJ0VG90YWwpO1xuICAgICAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbSgnY2FydEl0ZW1zJywgbWFrZUpTT04oY2FjaGVkQ2FydEl0ZW1zKSk7XG4gICAgICAgIHJldHVybiB7aXRlbXM6IGNhY2hlZENhcnRJdGVtcywgdG90YWw6IGNhY2hlZENhcnRUb3RhbH07XG4gICAgICB9KVxuICAgICAgLmNhdGNoKCRsb2cuZXJyb3IpO1xuICAgIH0sXG4gICAgc2F2ZUNhcnQ6IGZ1bmN0aW9uKCl7XG4gICAgICByZXR1cm4gJGh0dHAucG9zdCgnL2FwaS9jYXJ0Jywge2l0ZW1zOiBjYWNoZWRDYXJ0SXRlbXN9KVxuICAgICAgLnRoZW4oZnVuY3Rpb24oKXtcbiAgICAgICAgY2xlYXJDYXJ0KCk7XG4gICAgICB9KVxuICAgICAgLmNhdGNoKCRsb2cuZXJyb3IpO1xuICAgIH0sXG4gICAgZ2V0SXRlbXM6IGZ1bmN0aW9uKCl7XG4gICAgICByZXR1cm4gY2FjaGVkQ2FydEl0ZW1zO1xuICAgIH0sXG4gICAgZ2V0VG90YWw6IGZ1bmN0aW9uKCl7XG4gICAgICByZXR1cm4gY2FjaGVkQ2FydFRvdGFsO1xuICAgIH0sXG4gICAgY2xlYXJDYXJ0OiBmdW5jdGlvbigpe1xuICAgICAgY2xlYXJDYXJ0KCk7XG4gICAgICByZXR1cm4ge2l0ZW1zOiBjYWNoZWRDYXJ0SXRlbXMsIHRvdGFsOiBjYWNoZWRDYXJ0VG90YWx9O1xuICAgIH0sXG4gICAgZGVsZXRlSXRlbTogZnVuY3Rpb24oZnJpZW5kSWQpe1xuICAgICAgdmFyIGluZGV4ID0gY2FjaGVkQ2FydEl0ZW1zLmZpbmRJbmRleChmdW5jdGlvbihpdGVtKXtcbiAgICAgICAgcmV0dXJuIGl0ZW0uZnJpZW5kSWQgPT09IGZyaWVuZElkO1xuICAgICAgfSk7XG4gICAgICBjYWNoZWRDYXJ0SXRlbXMuc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgIGNhY2hlZENhcnRUb3RhbCA9IGNhbGN1bGF0ZVRvdGFsKGNhY2hlZENhcnRJdGVtcyk7XG4gICAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbSgnY2FydFRvdGFsJywgY2FjaGVkQ2FydFRvdGFsKTtcbiAgICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKCdjYXJ0SXRlbXMnLCBtYWtlSlNPTihjYWNoZWRDYXJ0SXRlbXMpKTtcblxuICAgICAgcmV0dXJuIHtpdGVtczogY2FjaGVkQ2FydEl0ZW1zLCB0b3RhbDogY2FjaGVkQ2FydFRvdGFsfTtcbiAgICB9LFxuICAgIHB1cmNoYXNlOiBmdW5jdGlvbigpe1xuICAgICAgcmV0dXJuICRodHRwLnBvc3QoJy9hcGkvY2FydC9wdXJjaGFzZScsIHtpdGVtczogY2FjaGVkQ2FydEl0ZW1zfSlcbiAgICAgIC50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgY2xlYXJDYXJ0KCk7XG4gICAgICAgIHJldHVybiByZXNwb25zZS5kYXRhO1xuICAgICAgfSlcbiAgICAgIC5jYXRjaCgkbG9nLmVycm9yKTtcbiAgICB9XG4gIH1cbn0pO1xuIiwiYXBwLmZhY3RvcnkoJ0NoZWNrb3V0RmFjdG9yeScsIGZ1bmN0aW9uKCRodHRwLCAkbG9nKXtcblx0dmFyIGNoZWNrb3V0RmFjdCA9IHt9O1xuXHRyZXR1cm4gY2hlY2tvdXRGYWN0O1xufSk7XG4iLCJhcHAuZmFjdG9yeSgnRnVsbHN0YWNrUGljcycsIGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gW1xuICAgICAgICAnaHR0cHM6Ly9wYnMudHdpbWcuY29tL21lZGlhL0I3Z0JYdWxDQUFBWFFjRS5qcGc6bGFyZ2UnLFxuICAgICAgICAnaHR0cHM6Ly9mYmNkbi1zcGhvdG9zLWMtYS5ha2FtYWloZC5uZXQvaHBob3Rvcy1hay14YXAxL3QzMS4wLTgvMTA4NjI0NTFfMTAyMDU2MjI5OTAzNTkyNDFfODAyNzE2ODg0MzMxMjg0MTEzN19vLmpwZycsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQi1MS1VzaElnQUV5OVNLLmpwZycsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQjc5LVg3b0NNQUFrdzd5LmpwZycsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQi1VajlDT0lJQUlGQWgwLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQjZ5SXlGaUNFQUFxbDEyLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0UtVDc1bFdBQUFtcXFKLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0V2WkFnLVZBQUFrOTMyLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0VnTk1lT1hJQUlmRGhLLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0VReUlETldnQUF1NjBCLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0NGM1Q1UVc4QUUybEdKLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0FlVnc1U1dvQUFBTHNqLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0FhSklQN1VrQUFsSUdzLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0FRT3c5bFdFQUFZOUZsLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQi1PUWJWckNNQUFOd0lNLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQjliX2Vyd0NZQUF3UmNKLnBuZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQjVQVGR2bkNjQUVBbDR4LmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQjRxd0MwaUNZQUFsUEdoLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQjJiMzN2UklVQUE5bzFELmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQndwSXdyMUlVQUF2TzJfLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQnNTc2VBTkNZQUVPaEx3LmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0o0dkxmdVV3QUFkYTRMLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0k3d3pqRVZFQUFPUHBTLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0lkSHZUMlVzQUFubkhWLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0dDaVBfWVdZQUFvNzVWLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQ0lTNEpQSVdJQUkzN3F1LmpwZzpsYXJnZSdcbiAgICBdO1xufSk7XG4iLCJhcHAuZmFjdG9yeSgnUHJvZHVjdEZhY3RvcnknLCBmdW5jdGlvbigkaHR0cCwgJGxvZyl7XG5cbiAgcmV0dXJuIHtcblxuICAgIGdldEFsbEZyaWVuZHM6IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuICRodHRwLmdldCgnL2FwaS9mcmllbmRzJylcbiAgICAgIC50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG4gICAgICAgIHJldHVybiByZXNwb25zZS5kYXRhO1xuICAgICAgfSlcbiAgICAgIC5jYXRjaCgkbG9nLmVycm9yKTtcbiAgICB9LFxuXG4gICAgZ2V0RnJpZW5kOiBmdW5jdGlvbihmcmllbmRJZCkge1xuICAgICAgcmV0dXJuICRodHRwLmdldCgnL2FwaS9mcmllbmRzLycgKyBmcmllbmRJZClcbiAgICAgIC50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgcmV0dXJuIHJlc3BvbnNlLmRhdGE7XG4gICAgICB9KVxuICAgICAgLmNhdGNoKCRsb2cuZXJyb3IpXG4gICAgfSxcblxuICAgIC8vIGZyaWVuZFJhdGluZzogZnVuY3Rpb25cblxuICAgIGdldFJldmlld3M6IGZ1bmN0aW9uKGZyaWVuZElkKSB7XG4gICAgICByZXR1cm4gJGh0dHAuZ2V0KCcvYXBpL2ZyaWVuZHMvJyArIGZyaWVuZElkICsgJy9mZWVkYmFjaycpXG4gICAgICAudGhlbihmdW5jdGlvbihyZXNwb25zZSkge1xuICAgICAgICByZXR1cm4gcmVzcG9uc2UuZGF0YTtcbiAgICAgIH0pXG4gICAgICAuY2F0Y2goJGxvZy5lcnJvcilcbiAgICB9LFxuXG4gICAgLy8gZ2V0UmF0aW5nOiBmdW5jdGlvbihmcmllbmRJZCkge1xuXG4gICAgLy8gfVxuXG5cbiAgfTsgLy9lbmQgb2YgcmV0dXJuXG5cbn0pO1xuIiwiYXBwLmZhY3RvcnkoJ1JhbmRvbUdyZWV0aW5ncycsIGZ1bmN0aW9uICgpIHtcblxuICAgIHZhciBnZXRSYW5kb21Gcm9tQXJyYXkgPSBmdW5jdGlvbiAoYXJyKSB7XG4gICAgICAgIHJldHVybiBhcnJbTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogYXJyLmxlbmd0aCldO1xuICAgIH07XG5cbiAgICB2YXIgZ3JlZXRpbmdzID0gW1xuICAgICAgICAnSGVsbG8sIHdvcmxkIScsXG4gICAgICAgICdBdCBsb25nIGxhc3QsIEkgbGl2ZSEnLFxuICAgICAgICAnSGVsbG8sIHNpbXBsZSBodW1hbi4nLFxuICAgICAgICAnV2hhdCBhIGJlYXV0aWZ1bCBkYXkhJyxcbiAgICAgICAgJ0lcXCdtIGxpa2UgYW55IG90aGVyIHByb2plY3QsIGV4Y2VwdCB0aGF0IEkgYW0geW91cnMuIDopJyxcbiAgICAgICAgJ1RoaXMgZW1wdHkgc3RyaW5nIGlzIGZvciBMaW5kc2F5IExldmluZS4nLFxuICAgICAgICAn44GT44KT44Gr44Gh44Gv44CB44Om44O844K244O85qeY44CCJyxcbiAgICAgICAgJ1dlbGNvbWUuIFRvLiBXRUJTSVRFLicsXG4gICAgICAgICc6RCcsXG4gICAgICAgICdZZXMsIEkgdGhpbmsgd2VcXCd2ZSBtZXQgYmVmb3JlLicsXG4gICAgICAgICdHaW1tZSAzIG1pbnMuLi4gSSBqdXN0IGdyYWJiZWQgdGhpcyByZWFsbHkgZG9wZSBmcml0dGF0YScsXG4gICAgICAgICdJZiBDb29wZXIgY291bGQgb2ZmZXIgb25seSBvbmUgcGllY2Ugb2YgYWR2aWNlLCBpdCB3b3VsZCBiZSB0byBuZXZTUVVJUlJFTCEnLFxuICAgIF07XG5cbiAgICByZXR1cm4ge1xuICAgICAgICBncmVldGluZ3M6IGdyZWV0aW5ncyxcbiAgICAgICAgZ2V0UmFuZG9tR3JlZXRpbmc6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBnZXRSYW5kb21Gcm9tQXJyYXkoZ3JlZXRpbmdzKTtcbiAgICAgICAgfVxuICAgIH07XG5cbn0pO1xuIiwiYXBwLmRpcmVjdGl2ZSgnZ3JhY2Vob3BwZXJMb2dvJywgZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB7XG4gICAgICAgIHJlc3RyaWN0OiAnRScsXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnanMvY29tbW9uL2RpcmVjdGl2ZXMvZ3JhY2Vob3BwZXItbG9nby9ncmFjZWhvcHBlci1sb2dvLmh0bWwnXG4gICAgfTtcbn0pO1xuIiwiYXBwLmRpcmVjdGl2ZSgnbmF2YmFyJywgZnVuY3Rpb24gKCRyb290U2NvcGUsIEF1dGhTZXJ2aWNlLCBBVVRIX0VWRU5UUywgJHN0YXRlLCBDYXJ0RmFjdG9yeSwgJGxvZykge1xuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgcmVzdHJpY3Q6ICdFJyxcbiAgICAgICAgc2NvcGU6IHt9LFxuICAgICAgICB0ZW1wbGF0ZVVybDogJ2pzL2NvbW1vbi9kaXJlY3RpdmVzL25hdmJhci9uYXZiYXIuaHRtbCcsXG4gICAgICAgIGxpbms6IGZ1bmN0aW9uIChzY29wZSkge1xuXG4gICAgICAgICAgICBzY29wZS5pdGVtcyA9IFtcbiAgICAgICAgICAgICAgICB7IGxhYmVsOiAnSG9tZScsIHN0YXRlOiAnaG9tZScgfSxcbiAgICAgICAgICAgICAgICB7IGxhYmVsOiAnQWJvdXQnLCBzdGF0ZTogJ2Fib3V0JyB9LFxuICAgICAgICAgICAgICAgIHsgbGFiZWw6ICdDYXJ0IFRlc3RpbmcgU3RhdGUhJywgc3RhdGU6ICdjYXJ0JyB9LFxuICAgICAgICAgICAgICAgIHsgbGFiZWw6ICdNZW1iZXJzIE9ubHknLCBzdGF0ZTogJ21lbWJlcnNPbmx5JywgYXV0aDogdHJ1ZSB9XG4gICAgICAgICAgICBdO1xuXG4gICAgICAgICAgICBzY29wZS51c2VyID0gbnVsbDtcblxuICAgICAgICAgICAgc2NvcGUuaXNMb2dnZWRJbiA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gQXV0aFNlcnZpY2UuaXNBdXRoZW50aWNhdGVkKCk7XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBzY29wZS5sb2dvdXQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgQ2FydEZhY3Rvcnkuc2F2ZUNhcnQoKVxuICAgICAgICAgICAgICAgIC50aGVuKGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBBdXRoU2VydmljZS5sb2dvdXQoKTtcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgIC50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAkc3RhdGUuZ28oJ2hvbWUnKTtcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgIC5jYXRjaCgkbG9nLmVycm9yKTtcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIHZhciBzZXRVc2VyID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIEF1dGhTZXJ2aWNlLmdldExvZ2dlZEluVXNlcigpLnRoZW4oZnVuY3Rpb24gKHVzZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgc2NvcGUudXNlciA9IHVzZXI7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICB2YXIgcmVtb3ZlVXNlciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBzY29wZS51c2VyID0gbnVsbDtcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIHNldFVzZXIoKTtcblxuICAgICAgICAgICAgJHJvb3RTY29wZS4kb24oQVVUSF9FVkVOVFMubG9naW5TdWNjZXNzLCBzZXRVc2VyKTtcbiAgICAgICAgICAgICRyb290U2NvcGUuJG9uKEFVVEhfRVZFTlRTLmxvZ291dFN1Y2Nlc3MsIHJlbW92ZVVzZXIpO1xuICAgICAgICAgICAgJHJvb3RTY29wZS4kb24oQVVUSF9FVkVOVFMuc2Vzc2lvblRpbWVvdXQsIHJlbW92ZVVzZXIpO1xuXG4gICAgICAgIH1cblxuICAgIH07XG5cbn0pO1xuXG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
