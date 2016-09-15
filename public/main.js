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
    $stateProvider.state('cart', {
        url: '/cart',
        controller: 'CartController',
        templateUrl: 'js/cart/cart.html'
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
    $stateProvider.state('checkout', {
        url: '/checkout',
        controller: 'CartController',
        templateUrl: 'js/checkout/checkout.html'
    });
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

app.controller('CarouselDemoCtrl', function ($scope) {
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

    $scope.product = ProductFactory.getFriend(1);

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
        getFriend: function getFriend(friendId) {
            return $http.get('/api/friends/' + friendId).then(function (response) {
                var friend = response.data;
                return friend;
            }).catch($log.error);
        } // end of getFriend

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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyIsImNhcnQvY2FydC5qcyIsImNoZWNrb3V0L2NoZWNrb3V0LmpzIiwiZG9jcy9kb2NzLmpzIiwiZnNhL2ZzYS1wcmUtYnVpbHQuanMiLCJob21lL2hvbWUuanMiLCJsb2dpbi9sb2dpbi5qcyIsImFib3V0L2Fib3V0LmpzIiwibWVtYmVycy1vbmx5L21lbWJlcnMtb25seS5qcyIsInByb2R1Y3QvcHJvZHVjdC5qcyIsInNpZ251cC9zaWdudXAuanMiLCJjb21tb24vZmFjdG9yaWVzL0NhcnRGYWN0b3J5LmpzIiwiY29tbW9uL2ZhY3Rvcmllcy9DaGVja291dEZhY3RvcnkuanMiLCJjb21tb24vZmFjdG9yaWVzL0Z1bGxzdGFja1BpY3MuanMiLCJjb21tb24vZmFjdG9yaWVzL1Byb2R1Y3RGYWN0b3J5LmpzIiwiY29tbW9uL2ZhY3Rvcmllcy9SYW5kb21HcmVldGluZ3MuanMiLCJjb21tb24vZGlyZWN0aXZlcy9mdWxsc3RhY2stbG9nby9mdWxsc3RhY2stbG9nby5qcyIsImNvbW1vbi9kaXJlY3RpdmVzL25hdmJhci9uYXZiYXIuanMiLCJjb21tb24vZGlyZWN0aXZlcy9yYW5kby1ncmVldGluZy9yYW5kby1ncmVldGluZy5qcyJdLCJuYW1lcyI6WyJ3aW5kb3ciLCJhcHAiLCJhbmd1bGFyIiwibW9kdWxlIiwiY29uZmlnIiwiJHVybFJvdXRlclByb3ZpZGVyIiwiJGxvY2F0aW9uUHJvdmlkZXIiLCJodG1sNU1vZGUiLCJvdGhlcndpc2UiLCJ3aGVuIiwibG9jYXRpb24iLCJyZWxvYWQiLCJydW4iLCIkcm9vdFNjb3BlIiwiQXV0aFNlcnZpY2UiLCIkc3RhdGUiLCJkZXN0aW5hdGlvblN0YXRlUmVxdWlyZXNBdXRoIiwic3RhdGUiLCJkYXRhIiwiYXV0aGVudGljYXRlIiwiJG9uIiwiZXZlbnQiLCJ0b1N0YXRlIiwidG9QYXJhbXMiLCJpc0F1dGhlbnRpY2F0ZWQiLCJwcmV2ZW50RGVmYXVsdCIsImdldExvZ2dlZEluVXNlciIsInRoZW4iLCJ1c2VyIiwiZ28iLCJuYW1lIiwiJHN0YXRlUHJvdmlkZXIiLCJ1cmwiLCJjb250cm9sbGVyIiwidGVtcGxhdGVVcmwiLCIkc2NvcGUiLCJDYXJ0RmFjdG9yeSIsIiRsb2ciLCJpdGVtcyIsImdldEl0ZW1zIiwidG90YWwiLCJnZXRUb3RhbCIsImdldFVzZXJDYXJ0IiwiY2FydCIsImNhdGNoIiwiZXJyb3IiLCJhZGRUb0NhcnQiLCJmcmllbmRJZCIsImFkZEZyaWVuZFRvQ2FydCIsImNsZWFyQ2FydCIsInNhdmVDYXJ0IiwiZGVsZXRlSXRlbSIsInB1cmNoYXNlIiwib3JkZXIiLCJuZXdPcmRlciIsIkVycm9yIiwiZmFjdG9yeSIsImlvIiwib3JpZ2luIiwiY29uc3RhbnQiLCJsb2dpblN1Y2Nlc3MiLCJsb2dpbkZhaWxlZCIsImxvZ291dFN1Y2Nlc3MiLCJzZXNzaW9uVGltZW91dCIsIm5vdEF1dGhlbnRpY2F0ZWQiLCJub3RBdXRob3JpemVkIiwiJHEiLCJBVVRIX0VWRU5UUyIsInN0YXR1c0RpY3QiLCJyZXNwb25zZUVycm9yIiwicmVzcG9uc2UiLCIkYnJvYWRjYXN0Iiwic3RhdHVzIiwicmVqZWN0IiwiJGh0dHBQcm92aWRlciIsImludGVyY2VwdG9ycyIsInB1c2giLCIkaW5qZWN0b3IiLCJnZXQiLCJzZXJ2aWNlIiwiJGh0dHAiLCJTZXNzaW9uIiwib25TdWNjZXNzZnVsTG9naW4iLCJjcmVhdGUiLCJmcm9tU2VydmVyIiwibG9naW4iLCJjcmVkZW50aWFscyIsInBvc3QiLCJtZXNzYWdlIiwibG9nb3V0IiwiZGVzdHJveSIsInNlbGYiLCJzZXNzaW9uSWQiLCJteUludGVydmFsIiwibm9XcmFwU2xpZGVzIiwiYWN0aXZlIiwic2xpZGVzIiwiY3VyckluZGV4IiwiYWRkU2xpZGUiLCJuZXdXaWR0aCIsImxlbmd0aCIsImltYWdlIiwidGV4dCIsImlkIiwicmFuZG9taXplIiwiaW5kZXhlcyIsImdlbmVyYXRlSW5kZXhlc0FycmF5IiwiYXNzaWduTmV3SW5kZXhlc1RvU2xpZGVzIiwiaSIsImwiLCJwb3AiLCJzaHVmZmxlIiwiYXJyYXkiLCJ0bXAiLCJjdXJyZW50IiwidG9wIiwiTWF0aCIsImZsb29yIiwicmFuZG9tIiwic2VuZExvZ2luIiwibG9naW5JbmZvIiwiRnVsbHN0YWNrUGljcyIsImltYWdlcyIsIl8iLCJ0ZW1wbGF0ZSIsIlNlY3JldFN0YXNoIiwiZ2V0U3Rhc2giLCJzdGFzaCIsIlByb2R1Y3RGYWN0b3J5IiwicHJvZHVjdCIsImdldEZyaWVuZCIsInNpZ25VcCIsImNoZWNrSW5mbyIsInNlbmRTaWduVXAiLCJzaWduVXBJbmZvIiwicGFzc3dvcmQiLCJwYXNzd29yZENvbmZpcm0iLCJnZXRDYXJ0SXRlbXMiLCJjdXJyZW50SXRlbXMiLCJsb2NhbFN0b3JhZ2UiLCJnZXRJdGVtIiwic2xpY2UiLCJjYWxsIiwiSlNPTiIsInBhcnNlIiwiZ2V0Q2FydFRvdGFsIiwiY3VycmVudFRvdGFsIiwiY2FjaGVkQ2FydEl0ZW1zIiwiY2FjaGVkQ2FydFRvdGFsIiwiY2FsY3VsYXRlVG90YWwiLCJpdGVtc0FycmF5IiwicmVkdWNlIiwiYSIsImIiLCJwcmljZSIsIm1ha2VKU09OIiwic3RyaW5naWZ5IiwiT2JqZWN0IiwiYXNzaWduIiwicmVtb3ZlSXRlbSIsImNvbmNhdCIsInNldEl0ZW0iLCJmcmllbmQiLCJob3VycyIsIm51bUhvdXJzIiwiaW5kZXgiLCJmaW5kSW5kZXgiLCJpdGVtIiwic3BsaWNlIiwiY2hlY2tvdXRGYWN0IiwiZ2V0UmFuZG9tRnJvbUFycmF5IiwiYXJyIiwiZ3JlZXRpbmdzIiwiZ2V0UmFuZG9tR3JlZXRpbmciLCJkaXJlY3RpdmUiLCJyZXN0cmljdCIsInNjb3BlIiwibGluayIsImxhYmVsIiwiYXV0aCIsImlzTG9nZ2VkSW4iLCJzZXRVc2VyIiwicmVtb3ZlVXNlciIsIlJhbmRvbUdyZWV0aW5ncyIsImdyZWV0aW5nIl0sIm1hcHBpbmdzIjoiQUFBQTs7OztBQUNBQSxPQUFBQyxHQUFBLEdBQUFDLFFBQUFDLE1BQUEsQ0FBQSx1QkFBQSxFQUFBLENBQUEsYUFBQSxF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QUFBLEVBQUE7QUFDQSxhQUZBOztBQUlBd0osa0JBQUF2RixNQUFBLEdBQUEsWUFBQTtBQUNBckQsNEJBQUFjLFFBQUEsR0FDQXZCLElBREEsQ0FDQSxZQUFBO0FBQ0EsMkJBQUFiLFlBQUEyRSxNQUFBLEVBQUE7QUFDQSxpQkFIQSxFQUlBOUQsSUFKQSxDQUlBLFlBQUE7QUFDQVosMkJBQUFjLEVBQUEsQ0FBQSxNQUFBO0FBQ0EsaUJBTkEsRUFPQWUsS0FQQSxDQU9BUCxLQUFBUSxLQVBBO0FBUUEsYUFUQTs7QUFXQSxnQkFBQXdJLFVBQUEsU0FBQUEsT0FBQSxHQUFBO0FBQ0F2Syw0QkFBQVksZUFBQSxHQUFBQyxJQUFBLENBQUEsVUFBQUMsSUFBQSxFQUFBO0FBQ0FvSiwwQkFBQXBKLElBQUEsR0FBQUEsSUFBQTtBQUNBLGlCQUZBO0FBR0EsYUFKQTs7QUFNQSxnQkFBQTBKLGFBQUEsU0FBQUEsVUFBQSxHQUFBO0FBQ0FOLHNCQUFBcEosSUFBQSxHQUFBLElBQUE7QUFDQSxhQUZBOztBQUlBeUo7O0FBRUF4Syx1QkFBQU8sR0FBQSxDQUFBK0MsWUFBQVAsWUFBQSxFQUFBeUgsT0FBQTtBQUNBeEssdUJBQUFPLEdBQUEsQ0FBQStDLFlBQUFMLGFBQUEsRUFBQXdILFVBQUE7QUFDQXpLLHVCQUFBTyxHQUFBLENBQUErQyxZQUFBSixjQUFBLEVBQUF1SCxVQUFBO0FBRUE7O0FBL0NBLEtBQUE7QUFtREEsQ0FyREE7O0FDQUFyTCxJQUFBNkssU0FBQSxDQUFBLGVBQUEsRUFBQSxVQUFBUyxlQUFBLEVBQUE7O0FBRUEsV0FBQTtBQUNBUixrQkFBQSxHQURBO0FBRUE3SSxxQkFBQSx5REFGQTtBQUdBK0ksY0FBQSxjQUFBRCxLQUFBLEVBQUE7QUFDQUEsa0JBQUFRLFFBQUEsR0FBQUQsZ0JBQUFWLGlCQUFBLEVBQUE7QUFDQTtBQUxBLEtBQUE7QUFRQSxDQVZBIiwiZmlsZSI6Im1haW4uanMiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCc7XG53aW5kb3cuYXBwID0gYW5ndWxhci5tb2R1bGUoJ0Z1bGxzdGFja0dlbmVyYXRlZEFwcCcsIFsnZnNhUHJlQnVpbHQnLCAndWkucm91dGVyJywgJ3VpLmJvb3RzdHJhcCcsICduZ0FuaW1hdGUnXSk7XG5cbmFwcC5jb25maWcoZnVuY3Rpb24gKCR1cmxSb3V0ZXJQcm92aWRlciwgJGxvY2F0aW9uUHJvdmlkZXIpIHtcbiAgICAvLyBUaGlzIHR1cm5zIG9mZiBoYXNoYmFuZyB1cmxzICgvI2Fib3V0KSBhbmQgY2hhbmdlcyBpdCB0byBzb21ldGhpbmcgbm9ybWFsICgvYWJvdXQpXG4gICAgJGxvY2F0aW9uUHJvdmlkZXIuaHRtbDVNb2RlKHRydWUpO1xuICAgIC8vIElmIHdlIGdvIHRvIGEgVVJMIHRoYXQgdWktcm91dGVyIGRvZXNuJ3QgaGF2ZSByZWdpc3RlcmVkLCBnbyB0byB0aGUgXCIvXCIgdXJsLlxuICAgICR1cmxSb3V0ZXJQcm92aWRlci5vdGhlcndpc2UoJy8nKTtcbiAgICAvLyBUcmlnZ2VyIHBhZ2UgcmVmcmVzaCB3aGVuIGFjY2Vzc2luZyBhbiBPQXV0aCByb3V0ZVxuICAgICR1cmxSb3V0ZXJQcm92aWRlci53aGVuKCcvYXV0aC86cHJvdmlkZXInLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHdpbmRvdy5sb2NhdGlvbi5yZWxvYWQoKTtcbiAgICB9KTtcbn0pO1xuXG4vLyBUaGlzIGFwcC5ydW4gaXMgZm9yIGNvbnRyb2xsaW5nIGFjY2VzcyB0byBzcGVjaWZpYyBzdGF0ZXMuXG5hcHAucnVuKGZ1bmN0aW9uICgkcm9vdFNjb3BlLCBBdXRoU2VydmljZSwgJHN0YXRlKSB7XG5cbiAgICAvLyBUaGUgZ2l2ZW4gc3RhdGUgcmVxdWlyZXMgYW4gYXV0aGVudGljYXRlZCB1c2VyLlxuICAgIHZhciBkZXN0aW5hdGlvblN0YXRlUmVxdWlyZXNBdXRoID0gZnVuY3Rpb24gKHN0YXRlKSB7XG4gICAgICAgIHJldHVybiBzdGF0ZS5kYXRhICYmIHN0YXRlLmRhdGEuYXV0aGVudGljYXRlO1xuICAgIH07XG5cbiAgICAvLyAkc3RhdGVDaGFuZ2VTdGFydCBpcyBhbiBldmVudCBmaXJlZFxuICAgIC8vIHdoZW5ldmVyIHRoZSBwcm9jZXNzIG9mIGNoYW5naW5nIGEgc3RhdGUgYmVnaW5zLlxuICAgICRyb290U2NvcGUuJG9uKCckc3RhdGVDaGFuZ2VTdGFydCcsIGZ1bmN0aW9uIChldmVudCwgdG9TdGF0ZSwgdG9QYXJhbXMpIHtcblxuICAgICAgICBpZiAoIWRlc3RpbmF0aW9uU3RhdGVSZXF1aXJlc0F1dGgodG9TdGF0ZSkpIHtcbiAgICAgICAgICAgIC8vIFRoZSBkZXN0aW5hdGlvbiBzdGF0ZSBkb2VzIG5vdCByZXF1aXJlIGF1dGhlbnRpY2F0aW9uXG4gICAgICAgICAgICAvLyBTaG9ydCBjaXJjdWl0IHdpdGggcmV0dXJuLlxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKEF1dGhTZXJ2aWNlLmlzQXV0aGVudGljYXRlZCgpKSB7XG4gICAgICAgICAgICAvLyBUaGUgdXNlciBpcyBhdXRoZW50aWNhdGVkLlxuICAgICAgICAgICAgLy8gU2hvcnQgY2lyY3VpdCB3aXRoIHJldHVybi5cbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIENhbmNlbCBuYXZpZ2F0aW5nIHRvIG5ldyBzdGF0ZS5cbiAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcblxuICAgICAgICBBdXRoU2VydmljZS5nZXRMb2dnZWRJblVzZXIoKS50aGVuKGZ1bmN0aW9uICh1c2VyKSB7XG4gICAgICAgICAgICAvLyBJZiBhIHVzZXIgaXMgcmV0cmlldmVkLCB0aGVuIHJlbmF2aWdhdGUgdG8gdGhlIGRlc3RpbmF0aW9uXG4gICAgICAgICAgICAvLyAodGhlIHNlY29uZCB0aW1lLCBBdXRoU2VydmljZS5pc0F1dGhlbnRpY2F0ZWQoKSB3aWxsIHdvcmspXG4gICAgICAgICAgICAvLyBvdGhlcndpc2UsIGlmIG5vIHVzZXIgaXMgbG9nZ2VkIGluLCBnbyB0byBcImxvZ2luXCIgc3RhdGUuXG4gICAgICAgICAgICBpZiAodXNlcikge1xuICAgICAgICAgICAgICAgICRzdGF0ZS5nbyh0b1N0YXRlLm5hbWUsIHRvUGFyYW1zKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgJHN0YXRlLmdvKCdsb2dpbicpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgIH0pO1xuXG59KTtcbiIsImFwcC5jb25maWcoZnVuY3Rpb24gKCRzdGF0ZVByb3ZpZGVyKSB7XG4gICAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2NhcnQnLCB7XG4gICAgICAgIHVybDogJy9jYXJ0JyxcbiAgICAgICAgY29udHJvbGxlcjogJ0NhcnRDb250cm9sbGVyJyxcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdqcy9jYXJ0L2NhcnQuaHRtbCdcbiAgICB9KTtcbn0pO1xuXG5cblxuYXBwLmNvbnRyb2xsZXIoJ0NhcnRDb250cm9sbGVyJywgZnVuY3Rpb24gKCRzY29wZSwgQ2FydEZhY3RvcnksICRsb2csICRyb290U2NvcGUpIHtcbiAgJHNjb3BlLml0ZW1zID0gQ2FydEZhY3RvcnkuZ2V0SXRlbXMoKTtcbiAgJHNjb3BlLnRvdGFsID0gQ2FydEZhY3RvcnkuZ2V0VG90YWwoKTtcblxuICAkcm9vdFNjb3BlLiRvbignYXV0aC1sb2dpbi1zdWNjZXNzJywgZnVuY3Rpb24oKXtcbiAgICBDYXJ0RmFjdG9yeS5nZXRVc2VyQ2FydCgpXG4gICAgLnRoZW4oZnVuY3Rpb24oY2FydCl7XG4gICAgICAkc2NvcGUuaXRlbXMgPSBjYXJ0Lml0ZW1zO1xuICAgICAgJHNjb3BlLnRvdGFsID0gY2FydC50b3RhbDtcbiAgICB9KVxuICAgIC5jYXRjaCgkbG9nLmVycm9yKTtcbiAgfSk7XG5cbiAgJHJvb3RTY29wZS4kb24oJ2F1dGgtbG9nb3V0LXN1Y2Nlc3MnLCBmdW5jdGlvbigpe1xuICAgICRzY29wZS5pdGVtcyA9IENhcnRGYWN0b3J5LmdldEl0ZW1zKCk7XG4gICAgJHNjb3BlLnRvdGFsID0gQ2FydEZhY3RvcnkuZ2V0VG90YWwoKTtcbiAgfSk7XG5cbiAgJHNjb3BlLmdldFVzZXJDYXJ0ID0gZnVuY3Rpb24oKXtcbiAgICBDYXJ0RmFjdG9yeS5nZXRVc2VyQ2FydCgpXG4gICAgLnRoZW4oZnVuY3Rpb24oY2FydCl7XG4gICAgICAkc2NvcGUuaXRlbXMgPSBjYXJ0Lml0ZW1zO1xuICAgICAgJHNjb3BlLnRvdGFsID0gY2FydC50b3RhbDtcbiAgICB9KVxuICAgIC5jYXRjaCgkbG9nLmVycm9yKVxuICB9XG4gICRzY29wZS5hZGRUb0NhcnQgPSBmdW5jdGlvbihmcmllbmRJZCl7XG4gICAgQ2FydEZhY3RvcnkuYWRkRnJpZW5kVG9DYXJ0KGZyaWVuZElkKVxuICAgIC50aGVuKGZ1bmN0aW9uKGNhcnQpe1xuICAgICAgJHNjb3BlLml0ZW1zID0gY2FydC5pdGVtcztcbiAgICAgICRzY29wZS50b3RhbCA9IGNhcnQudG90YWw7XG4gICAgfSlcbiAgICAuY2F0Y2goJGxvZy5lcnJvcik7XG4gIH1cbiAgJHNjb3BlLmNsZWFyQ2FydCA9IGZ1bmN0aW9uKCl7XG4gICAgdmFyIGNhcnQgPSBDYXJ0RmFjdG9yeS5jbGVhckNhcnQoKTtcbiAgICAgICRzY29wZS5pdGVtcyA9IGNhcnQuaXRlbXM7XG4gICAgICAkc2NvcGUudG90YWwgPSBjYXJ0LnRvdGFsO1xuICB9XG4gICRzY29wZS5zYXZlQ2FydCA9IENhcnRGYWN0b3J5LnNhdmVDYXJ0O1xuXG4gICAkc2NvcGUuZGVsZXRlSXRlbSA9IGZ1bmN0aW9uKGZyaWVuZElkKXtcbiAgICB2YXIgY2FydCA9IENhcnRGYWN0b3J5LmRlbGV0ZUl0ZW0oZnJpZW5kSWQpO1xuICAgICAgJHNjb3BlLml0ZW1zID0gY2FydC5pdGVtcztcbiAgICAgICRzY29wZS50b3RhbCA9IGNhcnQudG90YWw7XG4gIH1cbiAgJHNjb3BlLnB1cmNoYXNlID0gZnVuY3Rpb24oKXtcbiAgICBDYXJ0RmFjdG9yeS5wdXJjaGFzZSgpXG4gICAgLnRoZW4oZnVuY3Rpb24ob3JkZXIpe1xuICAgICAgJHNjb3BlLm5ld09yZGVyID0gb3JkZXI7XG4gICAgICAkc2NvcGUuaXRlbXMgPSBDYXJ0RmFjdG9yeS5nZXRJdGVtcygpO1xuICAgICAgJHNjb3BlLnRvdGFsID0gQ2FydEZhY3RvcnkuZ2V0VG90YWwoKTtcbiAgICB9KVxuICAgIC5jYXRjaCgkbG9nLmVycm9yKTtcbiAgfTtcbn0pO1xuIiwiYXBwLmNvbmZpZyhmdW5jdGlvbiAoJHN0YXRlUHJvdmlkZXIpIHtcbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnY2hlY2tvdXQnLCB7XG4gICAgICAgIHVybDogJy9jaGVja291dCcsXG4gICAgICAgIGNvbnRyb2xsZXI6ICdDYXJ0Q29udHJvbGxlcicsXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnanMvY2hlY2tvdXQvY2hlY2tvdXQuaHRtbCdcbiAgICB9KTtcbn0pO1xuXG5hcHAuY29uZmlnKGZ1bmN0aW9uICgkc3RhdGVQcm92aWRlcikge1xuICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdjb21wbGV0ZScsIHtcbiAgICAgICAgdXJsOiAnL2NvbXBsZXRlJyxcbiAgICAgICAgY29udHJvbGxlcjogJ0NoZWNrb3V0Q29udHJvbGxlcicsXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnanMvY2hlY2tvdXQvY2hlY2tvdXRDb21wbGV0ZS5odG1sJ1xuICAgIH0pO1xufSk7XG5cbmFwcC5jb250cm9sbGVyKCdDaGVja291dENvbnRyb2xsZXInLCBmdW5jdGlvbiAoJHNjb3BlKSB7XG5cdCRzY29wZS50b3RhbCA9IDgwOyAvL3Rlc3Rcbn0pO1xuXG4iLCJhcHAuY29uZmlnKGZ1bmN0aW9uICgkc3RhdGVQcm92aWRlcikge1xuICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdkb2NzJywge1xuICAgICAgICB1cmw6ICcvZG9jcycsXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnanMvc2hvcHBpbmdDYXJ0L3Nob3BwaW5nLWNhcnQuaHRtbCdcbiAgICB9KTtcbn0pO1xuIiwiKGZ1bmN0aW9uICgpIHtcblxuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIC8vIEhvcGUgeW91IGRpZG4ndCBmb3JnZXQgQW5ndWxhciEgRHVoLWRveS5cbiAgICBpZiAoIXdpbmRvdy5hbmd1bGFyKSB0aHJvdyBuZXcgRXJyb3IoJ0kgY2FuXFwndCBmaW5kIEFuZ3VsYXIhJyk7XG5cbiAgICB2YXIgYXBwID0gYW5ndWxhci5tb2R1bGUoJ2ZzYVByZUJ1aWx0JywgW10pO1xuXG4gICAgYXBwLmZhY3RvcnkoJ1NvY2tldCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKCF3aW5kb3cuaW8pIHRocm93IG5ldyBFcnJvcignc29ja2V0LmlvIG5vdCBmb3VuZCEnKTtcbiAgICAgICAgcmV0dXJuIHdpbmRvdy5pbyh3aW5kb3cubG9jYXRpb24ub3JpZ2luKTtcbiAgICB9KTtcblxuICAgIC8vIEFVVEhfRVZFTlRTIGlzIHVzZWQgdGhyb3VnaG91dCBvdXIgYXBwIHRvXG4gICAgLy8gYnJvYWRjYXN0IGFuZCBsaXN0ZW4gZnJvbSBhbmQgdG8gdGhlICRyb290U2NvcGVcbiAgICAvLyBmb3IgaW1wb3J0YW50IGV2ZW50cyBhYm91dCBhdXRoZW50aWNhdGlvbiBmbG93LlxuICAgIGFwcC5jb25zdGFudCgnQVVUSF9FVkVOVFMnLCB7XG4gICAgICAgIGxvZ2luU3VjY2VzczogJ2F1dGgtbG9naW4tc3VjY2VzcycsXG4gICAgICAgIGxvZ2luRmFpbGVkOiAnYXV0aC1sb2dpbi1mYWlsZWQnLFxuICAgICAgICBsb2dvdXRTdWNjZXNzOiAnYXV0aC1sb2dvdXQtc3VjY2VzcycsXG4gICAgICAgIHNlc3Npb25UaW1lb3V0OiAnYXV0aC1zZXNzaW9uLXRpbWVvdXQnLFxuICAgICAgICBub3RBdXRoZW50aWNhdGVkOiAnYXV0aC1ub3QtYXV0aGVudGljYXRlZCcsXG4gICAgICAgIG5vdEF1dGhvcml6ZWQ6ICdhdXRoLW5vdC1hdXRob3JpemVkJ1xuICAgIH0pO1xuXG4gICAgYXBwLmZhY3RvcnkoJ0F1dGhJbnRlcmNlcHRvcicsIGZ1bmN0aW9uICgkcm9vdFNjb3BlLCAkcSwgQVVUSF9FVkVOVFMpIHtcbiAgICAgICAgdmFyIHN0YXR1c0RpY3QgPSB7XG4gICAgICAgICAgICA0MDE6IEFVVEhfRVZFTlRTLm5vdEF1dGhlbnRpY2F0ZWQsXG4gICAgICAgICAgICA0MDM6IEFVVEhfRVZFTlRTLm5vdEF1dGhvcml6ZWQsXG4gICAgICAgICAgICA0MTk6IEFVVEhfRVZFTlRTLnNlc3Npb25UaW1lb3V0LFxuICAgICAgICAgICAgNDQwOiBBVVRIX0VWRU5UUy5zZXNzaW9uVGltZW91dFxuICAgICAgICB9O1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgcmVzcG9uc2VFcnJvcjogZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgJHJvb3RTY29wZS4kYnJvYWRjYXN0KHN0YXR1c0RpY3RbcmVzcG9uc2Uuc3RhdHVzXSwgcmVzcG9uc2UpO1xuICAgICAgICAgICAgICAgIHJldHVybiAkcS5yZWplY3QocmVzcG9uc2UpXG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfSk7XG5cbiAgICBhcHAuY29uZmlnKGZ1bmN0aW9uICgkaHR0cFByb3ZpZGVyKSB7XG4gICAgICAgICRodHRwUHJvdmlkZXIuaW50ZXJjZXB0b3JzLnB1c2goW1xuICAgICAgICAgICAgJyRpbmplY3RvcicsXG4gICAgICAgICAgICBmdW5jdGlvbiAoJGluamVjdG9yKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICRpbmplY3Rvci5nZXQoJ0F1dGhJbnRlcmNlcHRvcicpO1xuICAgICAgICAgICAgfVxuICAgICAgICBdKTtcbiAgICB9KTtcblxuICAgIGFwcC5zZXJ2aWNlKCdBdXRoU2VydmljZScsIGZ1bmN0aW9uICgkaHR0cCwgU2Vzc2lvbiwgJHJvb3RTY29wZSwgQVVUSF9FVkVOVFMsICRxKSB7XG5cbiAgICAgICAgZnVuY3Rpb24gb25TdWNjZXNzZnVsTG9naW4ocmVzcG9uc2UpIHtcbiAgICAgICAgICAgIHZhciB1c2VyID0gcmVzcG9uc2UuZGF0YS51c2VyO1xuICAgICAgICAgICAgU2Vzc2lvbi5jcmVhdGUodXNlcik7XG4gICAgICAgICAgICAkcm9vdFNjb3BlLiRicm9hZGNhc3QoQVVUSF9FVkVOVFMubG9naW5TdWNjZXNzKTtcbiAgICAgICAgICAgIHJldHVybiB1c2VyO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gVXNlcyB0aGUgc2Vzc2lvbiBmYWN0b3J5IHRvIHNlZSBpZiBhblxuICAgICAgICAvLyBhdXRoZW50aWNhdGVkIHVzZXIgaXMgY3VycmVudGx5IHJlZ2lzdGVyZWQuXG4gICAgICAgIHRoaXMuaXNBdXRoZW50aWNhdGVkID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuICEhU2Vzc2lvbi51c2VyO1xuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMuZ2V0TG9nZ2VkSW5Vc2VyID0gZnVuY3Rpb24gKGZyb21TZXJ2ZXIpIHtcblxuICAgICAgICAgICAgLy8gSWYgYW4gYXV0aGVudGljYXRlZCBzZXNzaW9uIGV4aXN0cywgd2VcbiAgICAgICAgICAgIC8vIHJldHVybiB0aGUgdXNlciBhdHRhY2hlZCB0byB0aGF0IHNlc3Npb25cbiAgICAgICAgICAgIC8vIHdpdGggYSBwcm9taXNlLiBUaGlzIGVuc3VyZXMgdGhhdCB3ZSBjYW5cbiAgICAgICAgICAgIC8vIGFsd2F5cyBpbnRlcmZhY2Ugd2l0aCB0aGlzIG1ldGhvZCBhc3luY2hyb25vdXNseS5cblxuICAgICAgICAgICAgLy8gT3B0aW9uYWxseSwgaWYgdHJ1ZSBpcyBnaXZlbiBhcyB0aGUgZnJvbVNlcnZlciBwYXJhbWV0ZXIsXG4gICAgICAgICAgICAvLyB0aGVuIHRoaXMgY2FjaGVkIHZhbHVlIHdpbGwgbm90IGJlIHVzZWQuXG5cbiAgICAgICAgICAgIGlmICh0aGlzLmlzQXV0aGVudGljYXRlZCgpICYmIGZyb21TZXJ2ZXIgIT09IHRydWUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gJHEud2hlbihTZXNzaW9uLnVzZXIpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBNYWtlIHJlcXVlc3QgR0VUIC9zZXNzaW9uLlxuICAgICAgICAgICAgLy8gSWYgaXQgcmV0dXJucyBhIHVzZXIsIGNhbGwgb25TdWNjZXNzZnVsTG9naW4gd2l0aCB0aGUgcmVzcG9uc2UuXG4gICAgICAgICAgICAvLyBJZiBpdCByZXR1cm5zIGEgNDAxIHJlc3BvbnNlLCB3ZSBjYXRjaCBpdCBhbmQgaW5zdGVhZCByZXNvbHZlIHRvIG51bGwuXG4gICAgICAgICAgICByZXR1cm4gJGh0dHAuZ2V0KCcvc2Vzc2lvbicpLnRoZW4ob25TdWNjZXNzZnVsTG9naW4pLmNhdGNoKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5sb2dpbiA9IGZ1bmN0aW9uIChjcmVkZW50aWFscykge1xuICAgICAgICAgICAgcmV0dXJuICRodHRwLnBvc3QoJy9sb2dpbicsIGNyZWRlbnRpYWxzKVxuICAgICAgICAgICAgICAgIC50aGVuKG9uU3VjY2Vzc2Z1bExvZ2luKVxuICAgICAgICAgICAgICAgIC5jYXRjaChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAkcS5yZWplY3QoeyBtZXNzYWdlOiAnSW52YWxpZCBsb2dpbiBjcmVkZW50aWFscy4nIH0pO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMubG9nb3V0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuICRodHRwLmdldCgnL2xvZ291dCcpLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIFNlc3Npb24uZGVzdHJveSgpO1xuICAgICAgICAgICAgICAgICRyb290U2NvcGUuJGJyb2FkY2FzdChBVVRIX0VWRU5UUy5sb2dvdXRTdWNjZXNzKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9O1xuXG4gICAgfSk7XG5cbiAgICBhcHAuc2VydmljZSgnU2Vzc2lvbicsIGZ1bmN0aW9uICgkcm9vdFNjb3BlLCBBVVRIX0VWRU5UUykge1xuXG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcblxuICAgICAgICAkcm9vdFNjb3BlLiRvbihBVVRIX0VWRU5UUy5ub3RBdXRoZW50aWNhdGVkLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBzZWxmLmRlc3Ryb3koKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgJHJvb3RTY29wZS4kb24oQVVUSF9FVkVOVFMuc2Vzc2lvblRpbWVvdXQsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHNlbGYuZGVzdHJveSgpO1xuICAgICAgICB9KTtcblxuICAgICAgICB0aGlzLnVzZXIgPSBudWxsO1xuXG4gICAgICAgIHRoaXMuY3JlYXRlID0gZnVuY3Rpb24gKHNlc3Npb25JZCwgdXNlcikge1xuICAgICAgICAgICAgdGhpcy51c2VyID0gdXNlcjtcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLmRlc3Ryb3kgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB0aGlzLnVzZXIgPSBudWxsO1xuICAgICAgICB9O1xuXG4gICAgfSk7XG5cbn0oKSk7XG4iLCJhcHAuY29uZmlnKGZ1bmN0aW9uICgkc3RhdGVQcm92aWRlcikge1xuICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdob21lJywge1xuICAgICAgICB1cmw6ICcvJyxcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdqcy9ob21lL2hvbWUuaHRtbCdcbiAgICB9KTtcbn0pO1xuXG5hcHAuY29udHJvbGxlcignQ2Fyb3VzZWxEZW1vQ3RybCcsIGZ1bmN0aW9uICgkc2NvcGUpIHtcbiAgJHNjb3BlLm15SW50ZXJ2YWwgPSA1MDAwO1xuICAkc2NvcGUubm9XcmFwU2xpZGVzID0gZmFsc2U7XG4gICRzY29wZS5hY3RpdmUgPSAwO1xuICB2YXIgc2xpZGVzID0gJHNjb3BlLnNsaWRlcyA9IFtdO1xuICB2YXIgY3VyckluZGV4ID0gMDtcblxuICAkc2NvcGUuYWRkU2xpZGUgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgbmV3V2lkdGggPSA2MDAgKyBzbGlkZXMubGVuZ3RoICsgMTtcbiAgICBzbGlkZXMucHVzaCh7XG4gICAgICAvLyBpbWFnZTogJy8vdW5zcGxhc2guaXQvJyArIG5ld1dpZHRoICsgJy8zMDAnLFxuICAgICAgaW1hZ2U6ICcvL3d3dy5jb2Rlcm1hdGNoLm1lL2Fzc2V0cy9Db2Rlci13LUJ1ZGR5LTVhODNmZDU3MDJjZjY3ZjVlOTM3MDRiNmM1MzE2MjAzLnN2ZycsXG4gICAgICB0ZXh0OiBbJ05pY2UgaW1hZ2UnLCdBd2Vzb21lIHBob3RvZ3JhcGgnLCdUaGF0IGlzIHNvIGNvb2wnLCdJIGxvdmUgdGhhdCddW3NsaWRlcy5sZW5ndGggJSA0XSxcbiAgICAgIGlkOiBjdXJySW5kZXgrK1xuICAgIH0pO1xuICB9O1xuXG4gICRzY29wZS5yYW5kb21pemUgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgaW5kZXhlcyA9IGdlbmVyYXRlSW5kZXhlc0FycmF5KCk7XG4gICAgYXNzaWduTmV3SW5kZXhlc1RvU2xpZGVzKGluZGV4ZXMpO1xuICB9O1xuXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgNDsgaSsrKSB7XG4gICAgJHNjb3BlLmFkZFNsaWRlKCk7XG4gIH1cblxuICAvLyBSYW5kb21pemUgbG9naWMgYmVsb3dcblxuICBmdW5jdGlvbiBhc3NpZ25OZXdJbmRleGVzVG9TbGlkZXMoaW5kZXhlcykge1xuICAgIGZvciAodmFyIGkgPSAwLCBsID0gc2xpZGVzLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgc2xpZGVzW2ldLmlkID0gaW5kZXhlcy5wb3AoKTtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBnZW5lcmF0ZUluZGV4ZXNBcnJheSgpIHtcbiAgICB2YXIgaW5kZXhlcyA9IFtdO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY3VyckluZGV4OyArK2kpIHtcbiAgICAgIGluZGV4ZXNbaV0gPSBpO1xuICAgIH1cbiAgICByZXR1cm4gc2h1ZmZsZShpbmRleGVzKTtcbiAgfVxuXG4gIC8vIGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9xdWVzdGlvbnMvOTYyODAyIzk2Mjg5MFxuICBmdW5jdGlvbiBzaHVmZmxlKGFycmF5KSB7XG4gICAgdmFyIHRtcCwgY3VycmVudCwgdG9wID0gYXJyYXkubGVuZ3RoO1xuXG4gICAgaWYgKHRvcCkge1xuICAgICAgd2hpbGUgKC0tdG9wKSB7XG4gICAgICAgIGN1cnJlbnQgPSBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiAodG9wICsgMSkpO1xuICAgICAgICB0bXAgPSBhcnJheVtjdXJyZW50XTtcbiAgICAgICAgYXJyYXlbY3VycmVudF0gPSBhcnJheVt0b3BdO1xuICAgICAgICBhcnJheVt0b3BdID0gdG1wO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBhcnJheTtcbiAgfVxufSk7IiwiYXBwLmNvbmZpZyhmdW5jdGlvbiAoJHN0YXRlUHJvdmlkZXIpIHtcblxuICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdsb2dpbicsIHtcbiAgICAgICAgdXJsOiAnL2xvZ2luJyxcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdqcy9sb2dpbi9sb2dpbi5odG1sJyxcbiAgICAgICAgY29udHJvbGxlcjogJ0xvZ2luQ3RybCdcbiAgICB9KTtcblxufSk7XG5cbmFwcC5jb250cm9sbGVyKCdMb2dpbkN0cmwnLCBmdW5jdGlvbiAoJHNjb3BlLCBBdXRoU2VydmljZSwgJHN0YXRlKSB7XG5cbiAgICAkc2NvcGUubG9naW4gPSB7fTtcbiAgICAkc2NvcGUuZXJyb3IgPSBudWxsO1xuXG4gICAgJHNjb3BlLnNlbmRMb2dpbiA9IGZ1bmN0aW9uIChsb2dpbkluZm8pIHtcblxuICAgICAgICAkc2NvcGUuZXJyb3IgPSBudWxsO1xuXG4gICAgICAgIEF1dGhTZXJ2aWNlLmxvZ2luKGxvZ2luSW5mbylcbiAgICAgICAgLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgJHN0YXRlLmdvKCdob21lJyk7XG4gICAgICAgIH0pXG4gICAgICAgIC5jYXRjaChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAkc2NvcGUuZXJyb3IgPSAnSW52YWxpZCBsb2dpbiBjcmVkZW50aWFscy4nO1xuICAgICAgICB9KTtcblxuICAgIH07XG5cbn0pO1xuIiwiYXBwLmNvbmZpZyhmdW5jdGlvbiAoJHN0YXRlUHJvdmlkZXIpIHtcblxuICAgIC8vIFJlZ2lzdGVyIG91ciAqYWJvdXQqIHN0YXRlLlxuICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdhYm91dCcsIHtcbiAgICAgICAgdXJsOiAnL2Fib3V0JyxcbiAgICAgICAgY29udHJvbGxlcjogJ0Fib3V0Q29udHJvbGxlcicsXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnanMvYWJvdXQvYWJvdXQuaHRtbCdcbiAgICB9KTtcblxufSk7XG5cbmFwcC5jb250cm9sbGVyKCdBYm91dENvbnRyb2xsZXInLCBmdW5jdGlvbiAoJHNjb3BlLCBGdWxsc3RhY2tQaWNzKSB7XG5cbiAgICAvLyBJbWFnZXMgb2YgYmVhdXRpZnVsIEZ1bGxzdGFjayBwZW9wbGUuXG4gICAgJHNjb3BlLmltYWdlcyA9IF8uc2h1ZmZsZShGdWxsc3RhY2tQaWNzKTtcblxufSk7XG4iLCJhcHAuY29uZmlnKGZ1bmN0aW9uICgkc3RhdGVQcm92aWRlcikge1xuXG4gICAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ21lbWJlcnNPbmx5Jywge1xuICAgICAgICB1cmw6ICcvbWVtYmVycy1hcmVhJyxcbiAgICAgICAgdGVtcGxhdGU6ICc8aW1nIG5nLXJlcGVhdD1cIml0ZW0gaW4gc3Rhc2hcIiB3aWR0aD1cIjMwMFwiIG5nLXNyYz1cInt7IGl0ZW0gfX1cIiAvPicsXG4gICAgICAgIGNvbnRyb2xsZXI6IGZ1bmN0aW9uICgkc2NvcGUsIFNlY3JldFN0YXNoKSB7XG4gICAgICAgICAgICBTZWNyZXRTdGFzaC5nZXRTdGFzaCgpLnRoZW4oZnVuY3Rpb24gKHN0YXNoKSB7XG4gICAgICAgICAgICAgICAgJHNjb3BlLnN0YXNoID0gc3Rhc2g7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcbiAgICAgICAgLy8gVGhlIGZvbGxvd2luZyBkYXRhLmF1dGhlbnRpY2F0ZSBpcyByZWFkIGJ5IGFuIGV2ZW50IGxpc3RlbmVyXG4gICAgICAgIC8vIHRoYXQgY29udHJvbHMgYWNjZXNzIHRvIHRoaXMgc3RhdGUuIFJlZmVyIHRvIGFwcC5qcy5cbiAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgYXV0aGVudGljYXRlOiB0cnVlXG4gICAgICAgIH1cbiAgICB9KTtcblxufSk7XG5cbmFwcC5mYWN0b3J5KCdTZWNyZXRTdGFzaCcsIGZ1bmN0aW9uICgkaHR0cCkge1xuXG4gICAgdmFyIGdldFN0YXNoID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gJGh0dHAuZ2V0KCcvYXBpL21lbWJlcnMvc2VjcmV0LXN0YXNoJykudGhlbihmdW5jdGlvbiAocmVzcG9uc2UpIHtcbiAgICAgICAgICAgIHJldHVybiByZXNwb25zZS5kYXRhO1xuICAgICAgICB9KTtcbiAgICB9O1xuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgZ2V0U3Rhc2g6IGdldFN0YXNoXG4gICAgfTtcblxufSk7XG4iLCJhcHAuY29uZmlnKGZ1bmN0aW9uICgkc3RhdGVQcm92aWRlcikge1xuICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdwcm9kdWN0Jywge1xuICAgICAgICB1cmw6ICcvcHJvZHVjdCcsXG4gICAgICAgIGNvbnRyb2xsZXI6ICdQcm9kdWN0Q29udHJvbGxlcicsXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnanMvcHJvZHVjdC9wcm9kdWN0Lmh0bWwnXG4gICAgfSk7XG59KTtcblxuXG5hcHAuY29uZmlnKGZ1bmN0aW9uICgkc3RhdGVQcm92aWRlcikge1xuICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdwcm9kdWN0LmRlc2NyaXB0aW9uJywge1xuICAgICAgICB1cmw6ICcvZGVzY3JpcHRpb24nLFxuICAgICAgICB0ZW1wbGF0ZVVybDogJ2pzL3Byb2R1Y3QvcHJvZHVjdC1kZXNjcmlwdGlvbi5odG1sJ1xuICAgIH0pO1xufSk7XG5cblxuYXBwLmNvbmZpZyhmdW5jdGlvbiAoJHN0YXRlUHJvdmlkZXIpIHtcbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgncHJvZHVjdC5yZXZpZXcnLCB7XG4gICAgICAgIHVybDogJy9yZXZpZXcnLFxuICAgICAgICB0ZW1wbGF0ZVVybDogJ2pzL3Byb2R1Y3QvcHJvZHVjdC1yZXZpZXcuaHRtbCdcbiAgICB9KTtcbn0pO1xuXG5cbmFwcC5jb250cm9sbGVyKCdQcm9kdWN0Q29udHJvbGxlcicsIGZ1bmN0aW9uICgkc2NvcGUsIFByb2R1Y3RGYWN0b3J5LCBDYXJ0RmFjdG9yeSwgJGxvZykge1xuIFxuICAkc2NvcGUucHJvZHVjdCA9IFByb2R1Y3RGYWN0b3J5LmdldEZyaWVuZCgxKTtcblxuXG4gICAgJHNjb3BlLmFkZFRvQ2FydCA9IGZ1bmN0aW9uKGZyaWVuZElkKXtcbiAgICBDYXJ0RmFjdG9yeS5hZGRGcmllbmRUb0NhcnQoZnJpZW5kSWQpXG4gICAgLnRoZW4oZnVuY3Rpb24oY2FydCl7XG4gICAgICAkc2NvcGUuaXRlbXMgPSBjYXJ0Lml0ZW1zO1xuICAgICAgJHNjb3BlLnRvdGFsID0gY2FydC50b3RhbDtcbiAgICAgIFxuICAgIH0pXG4gICAgLmNhdGNoKCRsb2cuZXJyb3IpO1xuICB9XG5cbn0pOyIsImFwcC5jb25maWcoZnVuY3Rpb24oJHN0YXRlUHJvdmlkZXIpIHtcblx0JHN0YXRlUHJvdmlkZXIuc3RhdGUoJ3NpZ251cCcsIHtcblx0XHR1cmw6ICcvc2lnbnVwJyxcblx0XHR0ZW1wbGF0ZVVybDogJ2pzL3NpZ251cC9zaWdudXAuaHRtbCcsXG5cdFx0Y29udHJvbGxlcjogJ1NpZ25VcEN0cmwnXG5cdH0pO1xufSk7XG5cbi8vIE5FRUQgVE8gVVNFIEZPUk0gVkFMSURBVElPTlMgRk9SIEVNQUlMLCBBRERSRVNTLCBFVENcbmFwcC5jb250cm9sbGVyKCdTaWduVXBDdHJsJywgZnVuY3Rpb24oJHNjb3BlLCAkc3RhdGUsICRodHRwLCBBdXRoU2VydmljZSkge1xuXHQvLyBHZXQgZnJvbSBuZy1tb2RlbCBpbiBzaWdudXAuaHRtbFxuXHQkc2NvcGUuc2lnblVwID0ge307XG5cdCRzY29wZS5jaGVja0luZm8gPSB7fTtcblx0JHNjb3BlLmVycm9yID0gbnVsbDtcblxuXHQkc2NvcGUuc2VuZFNpZ25VcCA9IGZ1bmN0aW9uKHNpZ25VcEluZm8pIHtcblx0XHQkc2NvcGUuZXJyb3IgPSBudWxsO1xuXG5cdFx0aWYgKCRzY29wZS5zaWduVXAucGFzc3dvcmQgIT09ICRzY29wZS5jaGVja0luZm8ucGFzc3dvcmRDb25maXJtKSB7XG5cdFx0XHQkc2NvcGUuZXJyb3IgPSAnUGFzc3dvcmRzIGRvIG5vdCBtYXRjaCwgcGxlYXNlIHJlLWVudGVyIHBhc3N3b3JkLic7XG5cdFx0fVxuXHRcdGVsc2Uge1xuXHRcdFx0JGh0dHAucG9zdCgnL3NpZ251cCcsIHNpZ25VcEluZm8pXG5cdFx0XHQudGhlbihmdW5jdGlvbigpIHtcblx0XHRcdFx0QXV0aFNlcnZpY2UubG9naW4oc2lnblVwSW5mbylcblx0XHRcdFx0LnRoZW4oZnVuY3Rpb24oKSB7XG5cdFx0XHRcdFx0JHN0YXRlLmdvKCdob21lJyk7XG5cdFx0XHRcdH0pO1xuXHRcdFx0fSlcblx0XHRcdC5jYXRjaChmdW5jdGlvbigpIHtcblx0XHRcdFx0JHNjb3BlLmVycm9yID0gJ0ludmFsaWQgc2lnbnVwIGNyZWRlbnRpYWxzLic7XG5cdFx0XHR9KVxuXHRcdH1cblx0fVxufSk7XG4iLCJhcHAuZmFjdG9yeSgnQ2FydEZhY3RvcnknLCBmdW5jdGlvbigkaHR0cCwgJGxvZyl7XG4gIGZ1bmN0aW9uIGdldENhcnRJdGVtcygpe1xuICAgIHZhciBjdXJyZW50SXRlbXMgPSBsb2NhbFN0b3JhZ2UuZ2V0SXRlbSgnY2FydEl0ZW1zJyk7XG4gICAgaWYgKGN1cnJlbnRJdGVtcykgcmV0dXJuIFtdLnNsaWNlLmNhbGwoSlNPTi5wYXJzZShjdXJyZW50SXRlbXMpKTtcbiAgICBlbHNlIHJldHVybiBbXTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGdldENhcnRUb3RhbCgpe1xuICAgIHZhciBjdXJyZW50VG90YWwgPSBsb2NhbFN0b3JhZ2UuZ2V0SXRlbSgnY2FydFRvdGFsJyk7XG4gICAgaWYgKGN1cnJlbnRUb3RhbCkgcmV0dXJuIEpTT04ucGFyc2UoY3VycmVudFRvdGFsKTtcbiAgICBlbHNlIHJldHVybiAwO1xuICB9XG5cbiAgdmFyIGNhY2hlZENhcnRJdGVtcyA9IGdldENhcnRJdGVtcygpO1xuICB2YXIgY2FjaGVkQ2FydFRvdGFsID0gZ2V0Q2FydFRvdGFsKCk7XG5cbiAgZnVuY3Rpb24gY2FsY3VsYXRlVG90YWwoaXRlbXNBcnJheSl7XG4gICAgcmV0dXJuIGl0ZW1zQXJyYXkucmVkdWNlKGZ1bmN0aW9uKGEsIGIpe1xuICAgICAgcmV0dXJuIGEgKyBiLnByaWNlO1xuICAgIH0sIDApO1xuICB9XG5cbiAgZnVuY3Rpb24gbWFrZUpTT04oYXJyYXkpe1xuICAvL2NvbnZlcnQgdGhlIGl0ZW1zIGFycmF5IGludG8gYSBqc29uIHN0cmluZyBvZiBhbiBhcnJheS1saWtlIG9iamVjdFxuICAgIHJldHVybiBKU09OLnN0cmluZ2lmeShPYmplY3QuYXNzaWduKHtsZW5ndGg6IGFycmF5Lmxlbmd0aH0sIGFycmF5KSk7XG4gIH1cblxuICBmdW5jdGlvbiBjbGVhckNhcnQoKXtcbiAgICBjYWNoZWRDYXJ0SXRlbXMgPSBbXTtcbiAgICBjYWNoZWRDYXJ0VG90YWwgPSAwO1xuICAgIGxvY2FsU3RvcmFnZS5yZW1vdmVJdGVtKCdjYXJ0SXRlbXMnKTtcbiAgICBsb2NhbFN0b3JhZ2UucmVtb3ZlSXRlbSgnY2FydFRvdGFsJyk7XG4gIH1cblxuICByZXR1cm4ge1xuICAgIGdldFVzZXJDYXJ0OiBmdW5jdGlvbigpe1xuICAgICAgcmV0dXJuICRodHRwLmdldCgnL2FwaS9jYXJ0JylcbiAgICAgIC50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgaWYgKHR5cGVvZiByZXNwb25zZS5kYXRhID09PSAnb2JqZWN0Jykge1xuICAgICAgICAgIGNhY2hlZENhcnRJdGVtcyA9IGNhY2hlZENhcnRJdGVtcy5jb25jYXQocmVzcG9uc2UuZGF0YSk7XG4gICAgICAgICAgLy91cGRhdGUgbG9jYWwgc3RvcmFnZSB0byByZWxlY3QgdGhlIGNhY2hlZCB2YWx1ZXNcbiAgICAgICAgICBjYWNoZWRDYXJ0VG90YWwgPSBjYWxjdWxhdGVUb3RhbChjYWNoZWRDYXJ0SXRlbXMpXG4gICAgICAgICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oJ2NhcnRJdGVtcycsIG1ha2VKU09OKGNhY2hlZENhcnRJdGVtcykpO1xuICAgICAgICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKCdjYXJ0VG90YWwnLCBjYWNoZWRDYXJ0VG90YWwpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB7aXRlbXM6IGNhY2hlZENhcnRJdGVtcywgdG90YWw6IGNhY2hlZENhcnRUb3RhbH07XG4gICAgICB9KVxuICAgICAgLmNhdGNoKCRsb2cuZXJyb3IpXG4gICAgfSxcbiAgICBhZGRGcmllbmRUb0NhcnQ6IGZ1bmN0aW9uKGZyaWVuZElkKXtcbiAgICAgIHJldHVybiAkaHR0cC5nZXQoJy9hcGkvZnJpZW5kcy8nICsgZnJpZW5kSWQpXG4gICAgICAudGhlbihmdW5jdGlvbihyZXNwb25zZSl7XG4gICAgICAgIHZhciBmcmllbmQgPSByZXNwb25zZS5kYXRhO1xuICAgICAgICBjYWNoZWRDYXJ0VG90YWwgKz0gZnJpZW5kLnByaWNlO1xuICAgICAgICBjYWNoZWRDYXJ0SXRlbXMucHVzaCh7ZnJpZW5kSWQ6IGZyaWVuZC5pZCwgbmFtZTogZnJpZW5kLm5hbWUsIHByaWNlOiBmcmllbmQucHJpY2UsIGhvdXJzOiBmcmllbmQubnVtSG91cnN9KTtcbiAgICAgICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oJ2NhcnRUb3RhbCcsIGNhY2hlZENhcnRUb3RhbCk7XG4gICAgICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKCdjYXJ0SXRlbXMnLCBtYWtlSlNPTihjYWNoZWRDYXJ0SXRlbXMpKTtcbiAgICAgICAgcmV0dXJuIHtpdGVtczogY2FjaGVkQ2FydEl0ZW1zLCB0b3RhbDogY2FjaGVkQ2FydFRvdGFsfTtcbiAgICAgIH0pXG4gICAgICAuY2F0Y2goJGxvZy5lcnJvcik7XG4gICAgfSxcbiAgICBzYXZlQ2FydDogZnVuY3Rpb24oKXtcbiAgICAgIHJldHVybiAkaHR0cC5wb3N0KCcvYXBpL2NhcnQnLCB7aXRlbXM6IGNhY2hlZENhcnRJdGVtc30pXG4gICAgICAudGhlbihmdW5jdGlvbigpe1xuICAgICAgICBjbGVhckNhcnQoKTtcbiAgICAgIH0pXG4gICAgICAuY2F0Y2goJGxvZy5lcnJvcik7XG4gICAgfSxcbiAgICBnZXRJdGVtczogZnVuY3Rpb24oKXtcbiAgICAgIHJldHVybiBjYWNoZWRDYXJ0SXRlbXM7XG4gICAgfSxcbiAgICBnZXRUb3RhbDogZnVuY3Rpb24oKXtcbiAgICAgIHJldHVybiBjYWNoZWRDYXJ0VG90YWw7XG4gICAgfSxcbiAgICBjbGVhckNhcnQ6IGZ1bmN0aW9uKCl7XG4gICAgICBjbGVhckNhcnQoKTtcbiAgICAgIHJldHVybiB7aXRlbXM6IGNhY2hlZENhcnRJdGVtcywgdG90YWw6IGNhY2hlZENhcnRUb3RhbH07XG4gICAgfSxcbiAgICBkZWxldGVJdGVtOiBmdW5jdGlvbihmcmllbmRJZCl7XG4gICAgICB2YXIgaW5kZXggPSBjYWNoZWRDYXJ0SXRlbXMuZmluZEluZGV4KGZ1bmN0aW9uKGl0ZW0pe1xuICAgICAgICByZXR1cm4gaXRlbS5mcmllbmRJZCA9PT0gZnJpZW5kSWQ7XG4gICAgICB9KTtcbiAgICAgIGNhY2hlZENhcnRJdGVtcy5zcGxpY2UoaW5kZXgsIDEpO1xuICAgICAgY2FjaGVkQ2FydFRvdGFsID0gY2FsY3VsYXRlVG90YWwoY2FjaGVkQ2FydEl0ZW1zKTtcbiAgICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKCdjYXJ0VG90YWwnLCBjYWNoZWRDYXJ0VG90YWwpO1xuICAgICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oJ2NhcnRJdGVtcycsIG1ha2VKU09OKGNhY2hlZENhcnRJdGVtcykpO1xuXG4gICAgICByZXR1cm4ge2l0ZW1zOiBjYWNoZWRDYXJ0SXRlbXMsIHRvdGFsOiBjYWNoZWRDYXJ0VG90YWx9O1xuICAgIH0sXG4gICAgcHVyY2hhc2U6IGZ1bmN0aW9uKCl7XG4gICAgICByZXR1cm4gJGh0dHAucG9zdCgnL2FwaS9jYXJ0L3B1cmNoYXNlJywge2l0ZW1zOiBjYWNoZWRDYXJ0SXRlbXN9KVxuICAgICAgLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICBjbGVhckNhcnQoKTtcbiAgICAgICAgcmV0dXJuIHJlc3BvbnNlLmRhdGE7XG4gICAgICB9KVxuICAgICAgLmNhdGNoKCRsb2cuZXJyb3IpO1xuICAgIH1cbiAgfVxufSk7XG4iLCJhcHAuZmFjdG9yeSgnQ2hlY2tvdXRGYWN0b3J5JywgZnVuY3Rpb24oJGh0dHAsICRsb2cpe1xuXHR2YXIgY2hlY2tvdXRGYWN0ID0ge307XG5cdHJldHVybiBjaGVja291dEZhY3Q7XG59KTtcbiIsImFwcC5mYWN0b3J5KCdGdWxsc3RhY2tQaWNzJywgZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiBbXG4gICAgICAgICdodHRwczovL3Bicy50d2ltZy5jb20vbWVkaWEvQjdnQlh1bENBQUFYUWNFLmpwZzpsYXJnZScsXG4gICAgICAgICdodHRwczovL2ZiY2RuLXNwaG90b3MtYy1hLmFrYW1haWhkLm5ldC9ocGhvdG9zLWFrLXhhcDEvdDMxLjAtOC8xMDg2MjQ1MV8xMDIwNTYyMjk5MDM1OTI0MV84MDI3MTY4ODQzMzEyODQxMTM3X28uanBnJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9CLUxLVXNoSWdBRXk5U0suanBnJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9CNzktWDdvQ01BQWt3N3kuanBnJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9CLVVqOUNPSUlBSUZBaDAuanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9CNnlJeUZpQ0VBQXFsMTIuanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9DRS1UNzVsV0FBQW1xcUouanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9DRXZaQWctVkFBQWs5MzIuanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9DRWdOTWVPWElBSWZEaEsuanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9DRVF5SUROV2dBQXU2MEIuanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9DQ0YzVDVRVzhBRTJsR0ouanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9DQWVWdzVTV29BQUFMc2ouanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9DQWFKSVA3VWtBQWxJR3MuanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9DQVFPdzlsV0VBQVk5RmwuanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9CLU9RYlZyQ01BQU53SU0uanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9COWJfZXJ3Q1lBQXdSY0oucG5nOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9CNVBUZHZuQ2NBRUFsNHguanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9CNHF3QzBpQ1lBQWxQR2guanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9CMmIzM3ZSSVVBQTlvMUQuanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9Cd3BJd3IxSVVBQXZPMl8uanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9Cc1NzZUFOQ1lBRU9oTHcuanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9DSjR2TGZ1VXdBQWRhNEwuanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9DSTd3empFVkVBQU9QcFMuanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9DSWRIdlQyVXNBQW5uSFYuanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9DR0NpUF9ZV1lBQW83NVYuanBnOmxhcmdlJyxcbiAgICAgICAgJ2h0dHBzOi8vcGJzLnR3aW1nLmNvbS9tZWRpYS9DSVM0SlBJV0lBSTM3cXUuanBnOmxhcmdlJ1xuICAgIF07XG59KTtcbiIsImFwcC5mYWN0b3J5KCdQcm9kdWN0RmFjdG9yeScsIGZ1bmN0aW9uKCRodHRwLCAkbG9nKXtcblxuICByZXR1cm4ge1xuICAgIGdldEZyaWVuZDogZnVuY3Rpb24oZnJpZW5kSWQpe1xuICAgICAgcmV0dXJuICRodHRwLmdldCgnL2FwaS9mcmllbmRzLycgKyBmcmllbmRJZClcbiAgICAgIC50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgdmFyIGZyaWVuZCA9IHJlc3BvbnNlLmRhdGE7XG4gICAgICAgIHJldHVybiBmcmllbmRcbiAgICAgIH0pXG4gICAgICAuY2F0Y2goJGxvZy5lcnJvcilcbiAgICB9IC8vIGVuZCBvZiBnZXRGcmllbmRcblxuICB9IC8vZW5kIG9mIHJldHVyblxuXG59KTtcbiIsImFwcC5mYWN0b3J5KCdSYW5kb21HcmVldGluZ3MnLCBmdW5jdGlvbiAoKSB7XG5cbiAgICB2YXIgZ2V0UmFuZG9tRnJvbUFycmF5ID0gZnVuY3Rpb24gKGFycikge1xuICAgICAgICByZXR1cm4gYXJyW01hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIGFyci5sZW5ndGgpXTtcbiAgICB9O1xuXG4gICAgdmFyIGdyZWV0aW5ncyA9IFtcbiAgICAgICAgJ0hlbGxvLCB3b3JsZCEnLFxuICAgICAgICAnQXQgbG9uZyBsYXN0LCBJIGxpdmUhJyxcbiAgICAgICAgJ0hlbGxvLCBzaW1wbGUgaHVtYW4uJyxcbiAgICAgICAgJ1doYXQgYSBiZWF1dGlmdWwgZGF5IScsXG4gICAgICAgICdJXFwnbSBsaWtlIGFueSBvdGhlciBwcm9qZWN0LCBleGNlcHQgdGhhdCBJIGFtIHlvdXJzLiA6KScsXG4gICAgICAgICdUaGlzIGVtcHR5IHN0cmluZyBpcyBmb3IgTGluZHNheSBMZXZpbmUuJyxcbiAgICAgICAgJ+OBk+OCk+OBq+OBoeOBr+OAgeODpuODvOOCtuODvOanmOOAgicsXG4gICAgICAgICdXZWxjb21lLiBUby4gV0VCU0lURS4nLFxuICAgICAgICAnOkQnLFxuICAgICAgICAnWWVzLCBJIHRoaW5rIHdlXFwndmUgbWV0IGJlZm9yZS4nLFxuICAgICAgICAnR2ltbWUgMyBtaW5zLi4uIEkganVzdCBncmFiYmVkIHRoaXMgcmVhbGx5IGRvcGUgZnJpdHRhdGEnLFxuICAgICAgICAnSWYgQ29vcGVyIGNvdWxkIG9mZmVyIG9ubHkgb25lIHBpZWNlIG9mIGFkdmljZSwgaXQgd291bGQgYmUgdG8gbmV2U1FVSVJSRUwhJyxcbiAgICBdO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgZ3JlZXRpbmdzOiBncmVldGluZ3MsXG4gICAgICAgIGdldFJhbmRvbUdyZWV0aW5nOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gZ2V0UmFuZG9tRnJvbUFycmF5KGdyZWV0aW5ncyk7XG4gICAgICAgIH1cbiAgICB9O1xuXG59KTtcbiIsImFwcC5kaXJlY3RpdmUoJ2Z1bGxzdGFja0xvZ28nLCBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgcmVzdHJpY3Q6ICdFJyxcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdqcy9jb21tb24vZGlyZWN0aXZlcy9mdWxsc3RhY2stbG9nby9mdWxsc3RhY2stbG9nby5odG1sJ1xuICAgIH07XG59KTtcbiIsImFwcC5kaXJlY3RpdmUoJ25hdmJhcicsIGZ1bmN0aW9uICgkcm9vdFNjb3BlLCBBdXRoU2VydmljZSwgQVVUSF9FVkVOVFMsICRzdGF0ZSwgQ2FydEZhY3RvcnksICRsb2cpIHtcblxuICAgIHJldHVybiB7XG4gICAgICAgIHJlc3RyaWN0OiAnRScsXG4gICAgICAgIHNjb3BlOiB7fSxcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdqcy9jb21tb24vZGlyZWN0aXZlcy9uYXZiYXIvbmF2YmFyLmh0bWwnLFxuICAgICAgICBsaW5rOiBmdW5jdGlvbiAoc2NvcGUpIHtcblxuICAgICAgICAgICAgc2NvcGUuaXRlbXMgPSBbXG4gICAgICAgICAgICAgICAgeyBsYWJlbDogJ0hvbWUnLCBzdGF0ZTogJ2hvbWUnIH0sXG4gICAgICAgICAgICAgICAgeyBsYWJlbDogJ0Fib3V0Jywgc3RhdGU6ICdhYm91dCcgfSxcbiAgICAgICAgICAgICAgICB7IGxhYmVsOiAnRG9jdW1lbnRhdGlvbicsIHN0YXRlOiAnZG9jcycgfSxcbiAgICAgICAgICAgICAgICB7IGxhYmVsOiAnQ2FydCBUZXN0aW5nIFN0YXRlIScsIHN0YXRlOiAnY2FydCcgfSxcbiAgICAgICAgICAgICAgICB7IGxhYmVsOiAnTWVtYmVycyBPbmx5Jywgc3RhdGU6ICdtZW1iZXJzT25seScsIGF1dGg6IHRydWUgfVxuICAgICAgICAgICAgXTtcblxuICAgICAgICAgICAgc2NvcGUudXNlciA9IG51bGw7XG5cbiAgICAgICAgICAgIHNjb3BlLmlzTG9nZ2VkSW4gPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIEF1dGhTZXJ2aWNlLmlzQXV0aGVudGljYXRlZCgpO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgc2NvcGUubG9nb3V0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIENhcnRGYWN0b3J5LnNhdmVDYXJ0KClcbiAgICAgICAgICAgICAgICAudGhlbihmdW5jdGlvbigpe1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gQXV0aFNlcnZpY2UubG9nb3V0KCk7XG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgJHN0YXRlLmdvKCdob21lJyk7XG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAuY2F0Y2goJGxvZy5lcnJvcik7XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICB2YXIgc2V0VXNlciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBBdXRoU2VydmljZS5nZXRMb2dnZWRJblVzZXIoKS50aGVuKGZ1bmN0aW9uICh1c2VyKSB7XG4gICAgICAgICAgICAgICAgICAgIHNjb3BlLnVzZXIgPSB1c2VyO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgdmFyIHJlbW92ZVVzZXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgc2NvcGUudXNlciA9IG51bGw7XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBzZXRVc2VyKCk7XG5cbiAgICAgICAgICAgICRyb290U2NvcGUuJG9uKEFVVEhfRVZFTlRTLmxvZ2luU3VjY2Vzcywgc2V0VXNlcik7XG4gICAgICAgICAgICAkcm9vdFNjb3BlLiRvbihBVVRIX0VWRU5UUy5sb2dvdXRTdWNjZXNzLCByZW1vdmVVc2VyKTtcbiAgICAgICAgICAgICRyb290U2NvcGUuJG9uKEFVVEhfRVZFTlRTLnNlc3Npb25UaW1lb3V0LCByZW1vdmVVc2VyKTtcblxuICAgICAgICB9XG5cbiAgICB9O1xuXG59KTtcblxuIiwiYXBwLmRpcmVjdGl2ZSgncmFuZG9HcmVldGluZycsIGZ1bmN0aW9uIChSYW5kb21HcmVldGluZ3MpIHtcblxuICAgIHJldHVybiB7XG4gICAgICAgIHJlc3RyaWN0OiAnRScsXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnanMvY29tbW9uL2RpcmVjdGl2ZXMvcmFuZG8tZ3JlZXRpbmcvcmFuZG8tZ3JlZXRpbmcuaHRtbCcsXG4gICAgICAgIGxpbms6IGZ1bmN0aW9uIChzY29wZSkge1xuICAgICAgICAgICAgc2NvcGUuZ3JlZXRpbmcgPSBSYW5kb21HcmVldGluZ3MuZ2V0UmFuZG9tR3JlZXRpbmcoKTtcbiAgICAgICAgfVxuICAgIH07XG5cbn0pO1xuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
