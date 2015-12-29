'use strict';

angular.module('app.services', [])
.service('MetaService', function() {

    var statusCode = undefined;

    var ogType = '';
    var ogUrl = '';
    var ogImage = '';
    var ogTitle = 'They';
    var ogDescription = ''

    var title = '';
    var metaDescription = '';
    var metaKeywords = '';
    return {
       setStatusCode: function (s) {
            statusCode = s;
       },
       setOg: function(newOgUrl, newOgTitle, newOgDescription, newOgType, newOgImage) {
           ogUrl = newOgUrl || 'https://tempostorm.com';
           ogTitle = newOgTitle || 'TempoStorm';
           ogDescription = newOgDescription || 'TempoStorm Official Website.';
           ogType = newOgType || 'website';
           ogImage = newOgImage || '';
       },
       set: function(newTitle, newMetaDescription, newKeywords) {
           metaKeywords = newKeywords;
           metaDescription = newMetaDescription;
           title = newTitle;
       },
       ogMetaType: function() { return ogType; },
       ogMetaUrl: function() { return ogUrl; },
       ogMetaImage: function() {
           if(!ogImage || ogImage == '') {
               return tpl + 'img/100x100tsoglogo.png'
           }
           return ogImage.toLowerCase();
       },
       ogMetaTitle: function(){ return ogTitle; },
       ogMetaDescription: function() { return ogDescription.replace(/<\/?[^>]+(>|$)/g, ""); },
       metaTitle: function(){ return (title + ' - TempoStorm'); },
       metaDescription: function() { return metaDescription; },
       metaKeywords: function() { return metaKeywords; },
       getStatusCode: function() { return statusCode; }
    }
})
.factory('AuthenticationService', function() {
    var loggedIn = false,
        admin = false,
        provider = false;

    return {
        isLogged: function () {
            return loggedIn;
        },
        setLogged: function (value) {
            loggedIn = value;
        },
        isAdmin: function () {
            return admin;
        },
        setAdmin: function (value) {
            admin = value;
        },
        isProvider: function () {
            return provider;
        },
        setProvider: function (value) {
            provider = value;
        }
    }
})
.factory('LoginService', ['$state', '$cookies', 'User', 'EventService', 'LoopBackAuth', function ($state, $cookies, User, EventService, LoopBackAuth) {
    return {
        login: function (email, password, remember, cb) {
            var options = { rememberMe: remember }
            var where = { email: email, password: password }
            var callback = function (err, data) {
                return (cb != undefined) ? cb(err, data) : null;
            }
            
            User.login(options, where)
            .$promise
            .then(function (data) {
              console.log(data);
                var user = data.user;
                
                EventService.emit("EVENT_LOGIN", user);
                return callback(null, data);
            })
            .catch(function (err) {
                return callback(err);
            });
        },
        logout: function (cb) {
            var callback = function (err) {
                return (cb != undefined) ? cb(err) : null;
            }
            
            User.logout()
            .$promise
            .then(function () {
                EventService.emit("EVENT_LOGOUT");
                
                var state = $state.current;
                var access = state.access;
                if (access !== undefined && (access.auth || access.admin)) {
                    $state.go('app.login');
                }
                
            })
            .catch(function(err) {
                console.log("error logging out:", err);
            })
            .finally(function () {
                LoopBackAuth.clearUser();
                LoopBackAuth.clearStorage();
                
                return callback();
            });
            
            
        },
        thirdPartyLogin: function (provider) {
            var redirectObj = {
                name: $state.current.name,
                params: $state.params
            }
            $cookies.put("redirectStateString", JSON.stringify(redirectObj));
            window.location.replace("/login/"+provider);
        }
    }
}])
.factory('SubscriptionService', ['$http', function ($http) {
    var isSubscribed = false,
        tsPlan = false,
        expiry = false;

    return {
        isSubscribed: function () {
            var now = new Date().getTime();

            if (isSubscribed) { return true; }
            if (expiry) {
                return (expiry > now);
            } else {
                return false;
            }
        },
        getSubscription: function () {
            return {
                isSubscribed: isSubscribed,
                tsPlan: tsPlan,
                expiry: expiry
            };
        },
        setSubscribed: function (value) {
            isSubscribed = value;
        },
        setTsPlan: function (value) {
            tsPlan = value;
        },
        setExpiry: function (value) {
            expiry = (value) ? new Date(value).getTime(): value;
        }
    };
}])
.factory('UserService', ['$http', '$compile', function($http, $compile) {
    return {
        login: function (email, password) {
            return $http.post('/login', { email: email, password: password });
        },

        signup: function (email, username, password, cpassword) {
            return $http.post('/signup', {
                email: email,
                username: username,
                password: password,
                cpassword: cpassword
            });
        },

        forgotPassword: function (email) {
            return $http.post('/forgot-password', { email: email });
        },

        resetPassword: function (email, code, password, cpassword) {
            return $http.post('/forgot-password/reset', { email: email, code: code, password: password, cpassword: cpassword });
        },

        verifyEmail: function (email, code) {
            return $http.post('/verify', { email: email, code: code });
        },

        verify: function () {
            return $http.post('/api/verify', {});
        },

        twitch: function () {
            return $http.post('/auth/twitch', {});
        },

        logout: function () {
        }
    }
}])
.factory('LoginModalService', ['$rootScope', '$compile', function ($rootScope, $compile) {
    var box = undefined;
    return {
        showModal: function (state, callback) {
            $rootScope.LoginModalService.callback = callback;
            $rootScope.LoginModalService.state = state;

            box = bootbox.dialog({
                title: function() {
                    switch(state) {
                        case 'login':  return "User Login" ; break;
                        case 'signup': return "User Signup"; break;
                        case 'forgot': return "Forgot Password"; break;
                        case 'verify': return "Verify Email"; break;
                        default:       return "User Login"; break;
                    }
                },
                className: 'login-modal',
                message: $compile('<login-modal callback="LoginModalService.callback()"></login-modal>')($rootScope)
            });
            box.modal('show');
        },
        hideModal: function () {
            if (box) {
                box.modal('hide');
            }
        }
    }
}])
.factory('ArticleService', ['$http', '$q', function ($http, $q) {
    return {
        getArticles: function (articleType, filter, offset, num, search) {
            var d = $q.defer(),
                articleType = articleType || 'all',
                filter = filter || 'all',
                offset = offset || 0,
                num = num || 20,
                search = search || '';

            $http.post('/articles', { articleType: articleType, filter: filter, offset: offset, num: num, search: search }).success(function (data) {
                d.resolve(data);
            });
            return d.promise;
        },
        getArticle: function (slug) {
            var d = $q.defer();
            $http.post('/article', { slug: slug }).success(function (data) {
                d.resolve(data);
            });
            return d.promise;
        },
        addComment: function (article, comment) {
            return $http.post('/api/article/comment/add', { articleID: article._id, comment: comment });
        }
    };
}])
.factory('AdminSnapshotService', ['$http', '$q', function($http, $q) {
    return {
        getSnapshots: function (page, perpage, search) {
            var page = page || 1,
                perpage = perpage || 10,
                search = search || '';

            var d = $q.defer();
            $http.post('/api/admin/snapshots', { page: page, perpage: perpage, search: search }).success(function (data) {
                d.resolve(data);
            });
            return d.promise;
        },
        getSnapshot: function (_id) {
            var d = $q.defer();
            $http.post('/api/admin/snapshot', { _id: _id }).success(function (data) {
                d.resolve(data);
            })
            return d.promise;
        },
        getLatest: function () {
            var d = $q.defer();
            $http.post('/api/admin/snapshot/latest', {}).success(function (data) {
                d.resolve(data);
            })
            return d.promise;
        },
        addSnapshot: function (snapshot) {
            return $http.post('/api/admin/snapshot/add', snapshot);
        },
        editSnapshot: function (snapshot) {
            return $http.post('/api/admin/snapshot/edit', snapshot);
        },
        deleteSnapshot: function (_id) {
            var d = $q.defer();
                $http.post('/api/admin/snapshot/delete', { _id: _id }).success(function (data) {
                    d.resolve(data);
                });
            return d.promise;
        }
    }
}])
.factory ('SnapshotService', ['$http', '$q', '$localStorage', function ($http, $q, $localStorage) {
    return {
        getSnapshots: function (page, perpage, search) {
            var d = $q.defer(),
                page = page || 1,
                perpage = perpage || 10,
                search = search || '';

            $http.post('/snapshots', { page: page, perpage: perpage, search: search }).success(function (data) {
                d.resolve(data);
            });

            return d.promise;
        },
        getSnapshot: function (slug) {
            var d = $q.defer();
            $http.post('/snapshot', {slug: slug}).success(function (data) {
                d.resolve(data);
            });

            return d.promise;
        },
        getLatest: function () {
            var d = $q.defer();
            $http.post('/snapshot/latest', {}).success(function (data) {
                d.resolve(data);
            });

            return d.promise;
        },
        addComment: function (snapshot, comment) {
            return $http.post('/api/snapshot/comment/add', { snapshotID: snapshot._id, comment: comment });
        },
        vote: function (snapshot) {
            return $http.post('/api/snapshot/vote', { snapshot: snapshot });
        },
        setStorage: function (isOpen) {
            return $localStorage['metaCom-'] = isOpen;
        },
        getStorage: function () {
            return $localStorage['metaCom-'];
        }
    }
}])
.factory('AdminTeamService', ['$http', '$q', function ($http, $q) {
    return {
        getMembers: function () {
            var d = $q.defer();
            $http.post('/api/admin/teams').success(function (data) {
                d.resolve(data);
            });
            return d.promise;
        },
        getMember: function (id) {
            var d = $q.defer();
            $http.post('/api/admin/team', { _id: id }).success(function (data) {
                d.resolve(data);
            });
            return d.promise;
        },
        addMember: function (member) {
            var d = $q.defer();
            $http.post('/api/admin/team/add', { member: member }).success(function (data) {
                d.resolve(data);
            });
            return d.promise;
        },
        editMember: function (member) {
            var d = $q.defer();
            $http.post('/api/admin/team/edit', { member: member }).success(function (data) {
                d.resolve(data);
            });
            return d.promise;
        },
        deleteMember: function (member) {
            var d = $q.defer();
            $http.post('/api/admin/team/remove', { member: member }).success(function (data) {
                d.resolve(data);
            });
            return d.promise;
        },
        updateOrder: function (arr) {
            $http.post('/api/admin/team/order', { members: arr })
        }
    }
}])
.factory('ProfileService', ['$http', '$q', function ($http, $q) {
    return {
//        loadActivities: function (length) {
//            var d = $q.defer();
//            $http.post('/profile/' + username + '/activity/load', { length: length }).success(function (data) {
//                d.resolve(data);
//            });
//            return d.promise;
//        },
        getUserProfile: function (username) {
            var d = $q.defer();
            $http.post('/api/profile/' + username, {}).success(function (data) {
                d.resolve(data);
            });
            return d.promise;
        },
        getProfile: function (username) {
            var d = $q.defer();
            $http.post('/profile/' + username, {}).success(function (data) {
                d.resolve(data);
            });
            return d.promise;
        },
        getActivity: function (username, length, page, perpage) {
            var d = $q.defer(),
                page = page || 1,
                perpage = perpage || 20;
            $http.post('/profile/' + username + '/activity', { length: length, page: page, perpage: perpage }).success(function (data) {
                d.resolve(data);
            });
            return d.promise;
        },
        getArticles: function (username, page, perpage) {
            var d = $q.defer(),
                page = page || 1,
                perpage = perpage || 20;
            $http.post('/profile/' + username + '/articles', { page: page, perpage: perpage }).success(function (data) {
                d.resolve(data);
            });
            return d.promise;
        },
        getDecks: function (username, page, perpage) {
            var d = $q.defer(),
                page = page || 1,
                perpage = perpage || 20;
            $http.post('/profile/' + username + '/decks', { page: page, perpage: perpage }).success(function (data) {
                d.resolve(data);
            });
            return d.promise;
        },
        getDecksLoggedIn: function (username, page, perpage) {
            var d = $q.defer(),
                page = page || 1,
                perpage = perpage || 20;
            $http.post('/api/profile/' + username + '/decks', { page: page, perpage: perpage }).success(function (data) {
                d.resolve(data);
            });
            return d.promise;
        },
        getGuides: function (username, page, perpage) {
            var d = $q.defer(),
                page = page || 1,
                perpage = perpage || 20;
            $http.post('/profile/' + username + '/guides', { page: page, perpage: perpage }).success(function (data) {
                d.resolve(data);
            });
            return d.promise;
        },
        getGuidesLoggedIn: function (username, page, perpage) {
            var d = $q.defer(),
                page = page || 1,
                perpage = perpage || 20;
            $http.post('/api/profile/' + username + '/guides', { page: page, perpage: perpage }).success(function (data) {
                d.resolve(data);
            });
            return d.promise;
        },
        updateProfile: function (user) {
            return $http.post('/api/profile/edit', user);
        },
        changeEmail: function (code) {
            var d = $q.defer(),
                code = code || false;
            $http.post('/api/profile/changeEmail', { code: code }).success(function (data) {
                d.resolve(data);
            });
            return d.promise;
        },
        updateEmail: function (code) {
            var d = $q.defer(),
                code = code || false;
            $http.post('/api/profile/updateEmail', { code: code }).success(function (data) {
                d.resolve(data);
            });
            return d.promise;
        }
    };
}])
.factory('AuthInterceptor', ['$q', '$cookies', 'LoopBackAuth', function ($q, $cookies, LoopBackAuth) {
  return {
        responseError: function(rejection) {
          if(rejection.status == 401) {
              console.log(" triggered reponse error interceptor")
              // Clearing the loopback values from the client browser for safe
              LoopBackAuth.clearUser();
              LoopBackAuth.clearStorage();
          }
          return $q.reject(rejection);
      }
    }

    function getAuthCookie(key) {
      var value = $cookies.get(key);
      if(typeof value == "undefined")
          return undefined;

      var valueElements = value.split(":");
      var cleanCookie = valueElements[1];
      valueElements = cleanCookie.split(".");
      valueElements.splice(-1, 1);
      cleanCookie = valueElements.join(".");
      return cleanCookie;
    }
}])
.factory('AdminCardService', ['$http', '$q', function ($http, $q) {
    return {
        getCards: function () {
            var d = $q.defer();
            $http.post('/api/admin/cards', {}).success(function (data) {
                d.resolve(data);
            });
            return d.promise;
        },
        getDeckableCards: function () {
            var d = $q.defer();
            $http.post('/api/admin/cards/deckable', {}).success(function (data) {
                d.resolve(data);
            });
            return d.promise;
        },
        getCard: function (_id) {
            var d = $q.defer();
            $http.post('/api/admin/card', { _id: _id }).success(function (data) {
                d.resolve(data);
            });
            return d.promise;
        },
        addCard: function (card) {
            return $http.post('/api/admin/card/add', card);
        },
        deleteCard: function (_id) {
            var d = $q.defer();
            $http.post('/api/admin/card/delete', { _id: _id }).success(function (data) {
                d.resolve(data);
            });
            return d.promise;
        },
        editCard: function (card) {
            return $http.post('/api/admin/card/edit', card);
        }
    };
}])
.factory('AlertService', function () {
    var success = {};
    var error = {};
    var alert = false;
    var persist = false;
    
    return {
        getPersist: function () {
          return persist;
        },
        setPersist: function (value) {
          persist = value;
        },
        getSuccess: function () {
          return success;
        },
        setSuccess: function (value) {
          this.reset();
          (value.persist !== undefined) ? this.setPersist(value.persist) : null;
          success = value;
		  alert = value.show
        },
        getError: function () {
          return error;
        },
        setError: function (value) {
			this.reset();
			error = value;
			alert = value.show;
			(value.persist !== undefined) ? this.setPersist(value.persist) : null;

			// array of errors
			console.log('errorList:', value.errorList);
			console.log('lbErr:', value.lbErr);
			var errorList = [];
			value.errorList ? errorList = value.errorList : errorList = [];
			if (value.lbErr
				&& value.lbErr.data
				&& value.lbErr.data.error
				&& value.lbErr.data.error.details
				&& value.lbErr.data.error.details.messages) {
				var errMsgs = value.lbErr.data.error.details.messages;
				angular.forEach(errMsgs, function(errArr) {
					angular.forEach(errArr, function(errMsg) {
						errorList.push(errMsg);
					});
				});
			// attach lb errors to error object
			} else if (value.lbErr
						 && value.lbErr.data
						 && value.lbErr.data.error
						 && value.lbErr.data.error.message) {
				errorList.push(value.lbErr.data.error.message);
			}
			error.errorList = errorList;
			console.log('error.errorList:', error.errorList);
        },
        reset: function () {
          success = {};
          error = {};
          alert = false;
        },
        hasAlert: function () {
          return alert;
        },
		setShow: function(showVal) {
			alert = showVal;
		},
		getShow: function() {
			return alert;
		}
    }
})
.factory('AdminArticleService', ['$http', '$q', function ($http, $q) {
    return {
        articleTypes: function () {
            return [
                
            ];
        },
        getAllArticles: function () {
            var d = $q.defer();
            $http.post('/api/admin/articles/all', {}).success(function (data) {
                d.resolve(data);
            });
            return d.promise;
        },
        getArticles: function (page, perpage, search) {
            var page = page || 1,
                perpage = perpage || 50,
                search = search || '',
                d = $q.defer();
            $http.post('/api/admin/articles', { page: page, perpage: perpage, search: search }).success(function (data) {
                d.resolve(data);
            });
            return d.promise;
        },
        getArticle: function (_id) {
            var d = $q.defer();
            $http.post('/api/admin/article', { _id: _id }).success(function (data) {
                d.resolve(data);
            });
            return d.promise;
        },
        addArticle: function (article) {
            return $http.post('/api/admin/article/add', article);
        },
        editArticle: function (article) {
            return $http.post('/api/admin/article/edit', article);
        },
        deleteArticle: function (_id) {
            var d = $q.defer();
            $http.post('/api/admin/article/delete', { _id: _id }).success(function (data) {
                d.resolve(data);
            });
            return d.promise;
        },
        getNames: function(article) {
            return $http.post('/api/admin/article/names', article);
        }
    }
}])
.factory('AdminDeckService', ['$http', '$q', function ($http, $q) {
    return {
        getAllDecks: function () {
            var d = $q.defer();
            $http.post('/api/admin/decks/all', {}).success(function (data) {
                d.resolve(data);
            });
            return d.promise;
        },
        getDecks: function (page, perpage, search) {
            var d = $q.defer(),
                page = page || 1,
                perpage = perpage || 50,
                search = search || '';

            $http.post('/api/admin/decks', { page: page, perpage: perpage, search: search }).success(function (data) {
                d.resolve(data);
            });
            return d.promise;
        },
        getDeck: function (_id) {
            var d = $q.defer();
            $http.post('/api/admin/deck', { _id: _id }).success(function (data) {
                d.resolve(data);
            });
            return d.promise;
        },
        addDeck: function (deck) {
            return $http.post('/api/admin/deck/add', deck);
        },
        editDeck: function (deck) {
            return $http.post('/api/admin/deck/edit', deck);
        },
        deleteDeck: function (_id) {
            var d = $q.defer();
            $http.post('/api/admin/deck/delete', { _id: _id }).success(function (data) {
                d.resolve(data);
            });
            return d.promise;
        }
    }
}])
.factory('AdminHeroService', ['$http', '$q', function ($http, $q) {
    return {
        getHeroes: function (page, perpage, search) {
            var d = $q.defer(),
                page = page || 1,
                perpage = perpage || 50,
                search = search || '';

            $http.post('/api/admin/heroes', { page: page, perpage: perpage, search: search }).success(function (data) {
                d.resolve(data);
            });
            return d.promise;
        },
        getAllHeroes: function () {
            var d = $q.defer();
            $http.post('/api/admin/heroes/all', {}).success(function (data) {
                d.resolve(data);
            });
            return d.promise;
        },
        getHero: function (_id) {
            var d = $q.defer();
            $http.post('/api/admin/hero', { _id: _id }).success(function (data) {
                d.resolve(data);
            });
            return d.promise;
        },
        addHero: function (hero) {
            return $http.post('/api/admin/hero/add', hero);
        },
        editHero: function (hero) {
            return $http.post('/api/admin/hero/edit', hero);
        },
        deleteHero: function (_id) {
            var d = $q.defer();
            $http.post('/api/admin/hero/delete', { _id: _id }).success(function (data) {
                d.resolve(data);
            });
            return d.promise;
        }
    }
}])
.factory('AdminMapService', ['$http', '$q', function ($http, $q) {
    return {
        getMaps: function (page, perpage, search) {
            var d = $q.defer(),
                page = page || 1,
                perpage = perpage || 50,
                search = search || '';

            $http.post('/api/admin/maps', { page: page, perpage: perpage, search: search }).success(function (data) {
                d.resolve(data);
            });
            return d.promise;
        },
        getAllMaps: function () {
            var d = $q.defer();
            $http.post('/api/admin/maps/all', {}).success(function (data) {
                d.resolve(data);
            });
            return d.promise;
        },
        getMap: function (_id) {
            var d = $q.defer();
            $http.post('/api/admin/map', { _id: _id }).success(function (data) {
                d.resolve(data);
            });
            return d.promise;
        },
        addMap: function (map) {
            return $http.post('/api/admin/map/add', map);
        },
        editMap: function (map) {
            return $http.post('/api/admin/map/edit', map);
        },
        deleteMap: function (_id) {
            var d = $q.defer();
            $http.post('/api/admin/map/delete', { _id: _id }).success(function (data) {
                d.resolve(data);
            });
            return d.promise;
        }
    }
}])
.factory('AdminHOTSGuideService', ['$http', '$q', function ($http, $q) {
    return {
        getAllGuides: function () {
            var d = $q.defer();
            $http.post('/api/admin/guides/all', {}).success(function (data) {
                d.resolve(data);
            });
            return d.promise;
        },
        getGuides: function (page, perpage, search) {
            var d = $q.defer(),
                page = page || 1,
                perpage = perpage || 50,
                search = search || '';

            $http.post('/api/admin/guides', { page: page, perpage: perpage, search: search }).success(function (data) {
                d.resolve(data);
            });
            return d.promise;
        },
        getGuide: function (_id) {
            var d = $q.defer();
            $http.post('/api/admin/guide', { _id: _id }).success(function (data) {
                d.resolve(data);
            });
            return d.promise;
        },
        addGuide: function (guide) {
            return $http.post('/api/admin/guide/add', guide);
        },
        editGuide: function (guide) {
            return $http.post('/api/admin/guide/edit', guide);
        },
        deleteGuide: function (_id) {
            var d = $q.defer();
            $http.post('/api/admin/guide/delete', { _id: _id }).success(function (data) {
                d.resolve(data);
            });
            return d.promise;
        }
    }
}])
.factory('AdminUserService', ['$http', '$q', function ($http, $q) {
    return {
        getProviders: function () {
            var d = $q.defer();
            $http.post('/api/admin/users/providers', {}).success(function (data) {
                d.resolve(data);
            });
            return d.promise;
        },
        getUsers: function (page, perpage, search) {
            var page = page || 1,
                perpage = perpage || 50,
                search = search || '';
            var d = $q.defer();
            $http.post('/api/admin/users', { page: page, perpage: perpage, search: search }).success(function (data) {
                d.resolve(data);
            });
            return d.promise;
        },
        getUser: function (_id) {
            var d = $q.defer();
            $http.post('/api/admin/user', { _id: _id }).success(function (data) {
                d.resolve(data);
            });
            return d.promise;
        },
        addUser: function (user) {
            return $http.post('/api/admin/user/add', user);
        },
        editUser: function (user) {
            return $http.post('/api/admin/user/edit', user);
        },
        deleteUser: function (_id) {
            var d = $q.defer();
            $http.post('/api/admin/user/delete', { _id: _id }).success(function (data) {
                d.resolve(data);
            });
            return d.promise;
        }
    };
}])
.factory('PollService', ['$http', '$q', '$localStorage', function ($http, $q, $localStorage) {
    return {
        getPolls: function (view) {
            var d = $q.defer();
            $http.post('/polls', { view: view }).success(function (data) {
                d.resolve(data);
            });
            return d.promise;
        },
        postVote: function(poll, votes) {
            return $http.post('/polls/vote', { poll: poll, votes: votes});
        },
        setStorage: function (poll, votes) {
            return $localStorage['tspoll-' + poll] = votes;
        },
        getStorage: function (poll) {
            return $localStorage['tspoll-' + poll];
        }
    };
}])
.factory('AdminPollService', ['$http', '$q', function ($http, $q) {
    return {
        getPolls: function (page, perpage, search) {
            var page = page || 1,
                perpage = perpage || 50,
                search = search || '';
            var d = $q.defer();
            $http.post('/api/admin/polls', { page: page, perpage: perpage, search: search }).success(function (data) {
                d.resolve(data);
            });
            return d.promise;
        },
        getPoll: function (_id) {
            var d = $q.defer();
            $http.post('/api/admin/poll', { _id: _id }).success(function (data) {
                d.resolve(data);
            });
            return d.promise;
        },
        addPoll: function (poll) {
            return $http.post('/api/admin/poll/add', poll);
        },
        editPoll: function (poll) {
            return $http.post('/api/admin/poll/edit', poll);
        },
        deletePoll: function (_id) {
            var d = $q.defer();
            $http.post('/api/admin/poll/delete', { _id: _id }).success(function (data) {
                d.resolve(data);
            });
            return d.promise;
        }
    };
}])
.factory('AdminBannerService', ['$http', '$q', function($http, $q){
    return {
        getBanners: function (page, perpage, search) {
            var d = $q.defer(),
                page = page,
                perpage = perpage,
                search = search;

            $http.post('/api/admin/banners', {}).success(function (data) {
                d.resolve(data);
            });
            return d.promise;
        },
        getBanner: function (_id) {
            var d = $q.defer();
            $http.post('/api/admin/banner', { _id: _id }).success(function (data) {
                d.resolve(data);
            });
            return d.promise;
        },
        addBanner: function (banner) {
            return $http.post('api/admin/banner/add', banner);
        },
        editBanner: function (banner) {
            return $http.post('api/admin/banner/edit', banner);
        },
        deleteBanner: function (_id) {
            var d = $q.defer();
            $http.post('/api/admin/banner/delete', { _id: _id }).success(function (data) {
                d.resolve(data);
            });
            return d.promise;
        },
        updateOrder: function (banners) {
         var d = $q.defer();
            $http.post('/api/admin/banners/order', {banners: banners});
        }
    }
}])
.factory('AdminForumService', ['$http', '$q', function ($http, $q) {
    return {
        getCategories: function () {
            var d = $q.defer();
            $http.post('/api/admin/forum/categories', {}).success(function (data) {
                d.resolve(data);
            });
            return d.promise;
        },
        getCategory: function (_id) {
            var d = $q.defer();
            $http.post('/api/admin/forum/category', { _id: _id }).success(function (data) {
                d.resolve(data);
            });
            return d.promise;
        },
        addCategory: function (category) {
            return $http.post('/api/admin/forum/category/add', category);
        },
        editCategory: function (category) {
            return $http.post('/api/admin/forum/category/edit', category);
        },
        deleteCategory: function (_id) {
            var d = $q.defer();
            $http.post('/api/admin/forum/category/delete', { _id: _id }).success(function (data) {
                d.resolve(data);
            });
            return d.promise;
        },
        getThreads: function () {
            var d = $q.defer();
            $http.post('/api/admin/forum/threads', {}).success(function (data) {
                d.resolve(data);
            });
            return d.promise;
        },
        getThread: function (_id) {
            var d = $q.defer();
            $http.post('/api/admin/forum/thread', { _id: _id }).success(function (data) {
                d.resolve(data);
            });
            return d.promise;
        },
        addThread: function (thread) {
            return $http.post('/api/admin/forum/thread/add', thread);
        },
        editThread: function (thread) {
            return $http.post('/api/admin/forum/thread/edit', thread);
        },
        deleteThread: function (_id, category) {
            var d = $q.defer();
            $http.post('/api/admin/forum/thread/delete', { _id: _id, category: category }).success(function (data) {
                d.resolve(data);
            });
            return d.promise;
        }
    };
}])
.factory('AdminVodService', ['$http', '$q', function ($http, $q) {
    return {
        getVods: function () {
            var d = $q.defer();
            $http.post('/api/admin/vods').success(function (data) {
                d.resolve(data);
            });
            return d.promise;
        },
        getVod: function (_id) {
            var d = $q.defer();
            $http.post('/api/admin/vod', { _id: _id }).success(function (data) {
                d.resolve(data);
            });
            return d.promise;
        },
        vodAdd: function (vod) {
            var d = $q.defer();
            $http.post('/api/admin/vod/add', { vod: vod }).success(function (data) {
                d.resolve(data);
            });
            return d.promise;
        },
        vodEdit: function (vod) {
            var d = $q.defer();
            $http.post('/api/admin/vod/edit', { vod: vod }).success(function (data) {
                d.resolve(data);
            });
            return d.promise;
        },
        vodRemove: function (_id) {
            var d = $q.defer();
            $http.post('/api/admin/vod/delete', { _id: _id }).success(function (data) {
                d.resolve(data);
            });
            return d.promise;
        }
    }
}])
.service('Pagination', function () {

    var pagination = {};

    pagination.new = function (perpage, total) {

        perpage = perpage || 50;

        var paginate = {
            page: 1,
            perpage: perpage,
            total: total
        };

        paginate.results = function () {
            return paginate.total;
        };
        
        paginate.pages = function () {
            return Math.ceil(paginate.results() / paginate.perpage);
        };

        paginate.pagesArray = function () {
            var arr = [],
                pages = paginate.pages();
            for (var i = 1; i <= pages; i++) {
                arr.push(i);
            }
            return arr;
        };

        paginate.pageStart = function () {
            return ((paginate.page * paginate.perpage) - paginate.perpage);
        };

        paginate.showStart = function () {
            return (paginate.results()) ? paginate.pageStart() + 1 : 0;
        };

        paginate.showEnd = function () {
            var end = paginate.page * paginate.perpage;
            return (end > paginate.results()) ? paginate.results() : end;
        };

        paginate.isPage = function (page) {
            return (paginate.page === page);
        };

        paginate.getPage = function () {
            return paginate.page;
        };
        
        paginate.setPage = function (page) {
            paginate.page = page;
        };

        return paginate;
    }

    return pagination;
})
.factory('AjaxPagination', [function () {
    var pagination = {};
    
    pagination.update = function (serviceName, searchFilter, countFilter, callback) {
        async.series([
            function (seriesCallback) {
                serviceName.count(countFilter)
                .$promise
                .then(function (count) {
//                    console.log('count:', count);
                    seriesCallback(null, count);
                })
                .catch(function (err) {
//                    console.log('err:', err);
                    seriesCallback(err);
                });
            },
            function (seriesCallback) {
                serviceName.find(searchFilter)
                .$promise
                .then(function (data) {
//                    console.log('data:', data);
                    seriesCallback(null, data);
                })
                .catch(function (err) {
//                    console.log('err:', err);
                    seriesCallback(err);
                });
            }
        ], function(err, results) {
            if (err) {
//                console.log('series err:', err);
                if (callback) {
                    callback(err);
                }
            } else {
//                console.log('results:', results);
                if (callback) {
                    callback(null, results[1], results[0]);
                }
            }
        });
    };

    pagination.new = function (perpage, total, callback) {
        var paginate = {
            page: 1,
            perpage: perpage || 10,
            total: total || 0,
            loading: false,
            callback: function (newTotal) {
                this.loading = false;
                this.total = newTotal;
            }
        };

        paginate.isLoading = function () {
            return paginate.loading;
        };

        paginate.getPage = function () {
            return paginate.page;
        };

        paginate.getPerpage = function () {
            return paginate.perpage;
        };

        paginate.getTotal = function () {
            return paginate.total;
        };

        paginate.setPage = function (page) {
            if (paginate.isLoading()) { return false; }
            paginate.page = page;
            paginate.loading = true;

            return callback(paginate.page, paginate.perpage).then(function (newTotal) {
                return paginate.callback(newTotal);
            });
        };

        paginate.pagesArray = function () {
            var pages = [],
                start = 1,
                end = paginate.totalPages();

            if (this.totalPages() > 5) {
                if (paginate.getPage() < 3) {
                    start = 1;
                    end = start + 4;
                } else if (paginate.getPage() > paginate.totalPages() - 2) {
                    end = paginate.totalPages();
                    start = end - 4;
                } else {
                    start = paginate.getPage() - 2;
                    end = paginate.getPage() + 2;
                }

            }

            for (var i = start; i <= end; i++) {
                pages.push(i);
            }

            return pages;
        };

        paginate.isPage = function (page) {
            return (page === paginate.getPage());
        };

        paginate.totalPages = function (page) {
            return (paginate.getTotal() > 0) ? Math.ceil(paginate.getTotal() / paginate.getPerpage()) : 0;
        };

        paginate.from = function () {
            return (paginate.getPage() * paginate.getPerpage()) - paginate.getPerpage() + 1;
        };

        paginate.to = function () {
            return ((paginate.getPage() * paginate.getPerpage()) > paginate.getTotal()) ? paginate.getTotal() : paginate.getPage() * paginate.getPerpage();
        };

        return paginate;
    };

    return pagination;
}])
.factory('Util', ['$http', function ($http) {
    return {
        toSelect: function (arr) {
            arr = arr || [];
            var out = [];
            for (var i = 0; i < arr.length; i++) {
                out.push({ name: arr[i], value: arr[i] });
            }
            return out;
        },
        slugify: function (str) {
            return (str) ? str.toLowerCase().replace(/-+/g, '').replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') : '';
        },
        numberWithCommas : function (x) {
            x = x || 0;
            return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        },
        getObjectID: function () {
            return $http.post('/api/admin/id', {});
        },
        cleanObj: function (obj, properties) {
          var out = {};
          
          _.each(properties, function (pVal) {
            out[pVal] = obj[pVal];
          });
          
          return out;
        }
    };
}])
.factory('Base64', function () {
    var digitsStr =
    //   0       8       16      24      32      40      48      56     63
    //   v       v       v       v       v       v       v       v      v
        "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz+-";
    var digits = digitsStr.split('');
    var digitsMap = {};
    for (var i = 0; i < digits.length; i++) {
        digitsMap[digits[i]] = i;
    }
    return {
        fromInt: function(int32) {
            var result = '';
            while (true) {
                result = digits[int32 & 0x3f] + result;
                int32 >>>= 6;
                if (int32 === 0)
                    break;
            }
            return result;
        },
        toInt: function(digitsStr) {
            var result = 0;
            var digits = digitsStr.split('');
            for (var i = 0; i < digits.length; i++) {
                result = (result << 6) + digitsMap[digits[i]];
            }
            return result;
        }
    };
})
.factory('Hearthstone', function () {
    var hs = {};

    hs.types = ['Minion', 'Spell', 'Weapon'];
    hs.rarities = ['Basic', 'Common', 'Rare', 'Epic', 'Legendary'];
    hs.races = ['', 'Beast', 'Demon', 'Dragon', 'Murloc', 'Pirate', 'Totem', 'Mech'];
    hs.classes = ['Neutral', 'Druid', 'Hunter', 'Mage', 'Paladin', 'Priest', 'Rogue', 'Shaman', 'Warlock', 'Warrior'];
    hs.heroNames = {
        Mage: ['Jaina','Medivh'],
        Shaman: ['Thrall'],
        Warrior: ['Garrosh','Magni'],
        Rogue: ['Valeera'],
        Paladin: ['Uther'],
        Priest: ['Anduin'],
        Warlock: ['Guldan'],
        Hunter: ['Rexxar', 'Alleria'],
        Druid: ['Malfurion']
    };
    hs.mechanics = ['Battlecry', 'Charge', 'Choose One', 'Combo', 'Deathrattle', 'Discover', 'Divine Shield', 'Enrage', 'Freeze', 'Inspire', 'Jousting', 'Overload', 'Secret', 'Silence', 'Spell Damage', 'Stealth', 'Summon', 'Taunt', 'Windfury'];    
    hs.deckTypes = ['None', 'Aggro', 'Control', 'Midrange', 'Combo', 'Theory Craft'];
    hs.expansions = ['Basic', 'Naxxramas', 'Goblins Vs. Gnomes', 'Blackrock Mountain', 'The Grand Tournament', 'League of Explorers'];

    return hs;
})
.factory('HOTS', function () {
    var hots = {};

    hots.roles = ["Warrior", "Assassin", "Support", "Specialist"];
    hots.types = ["Melee", "Ranged"];
    hots.universes = ["Warcraft", "Starcraft", "Diablo", "Blizzard"];
    hots.abilityTypes = ["Combat Trait", "Ability", "Heroic Ability", "Heroic Skill", "Mount"];
    hots.manaTypes = ['Mana', 'Brew', 'Energy', 'Fury'];
    hots.tiers = [1,4,7,10,13,16,20];
    hots.heroRows = [9, 8, 9, 8, 7];
    hots.mapRows = [3,4,3];

    hots.genStats = function () {
        var stats = [],
            obj;

        for (var i = 0; i < 30; i++) {
            obj = {
                level: i + 1,
                health: '',
                healthRegen: '',
                mana: '',
                manaRegen: '',
                attackSpeed: '',
                range: '',
                damage: ''
            };
            stats.push(obj);
        }

        return stats;
    };

    return hots;
})
.factory('OVERWATCH', function () {
    var ow = {};

    ow.roles = ["Defense", "Offense", "Support", "Tank"];
    
    return ow;
})
.factory('DeckBuilder', ['$sce', '$http', '$q', '$timeout', 'CardWithoutCoin', 'CardWithCoin', 'User', 'Hearthstone', function ($sce, $http, $q, $timeout, CardWithoutCoin, CardWithCoin, User, Hearthstone) {

    var deckBuilder = {};

    deckBuilder.new = function (playerClass, data) {
        data = data || {};

        var d = new Date();
        d.setMonth(d.getMonth() + 1);

        var db = {
            id: data.id || null,
            name: data.name || '',
            dust: data.dust || 0,
            youtubeId: data.youtubeId || '',
            description: data.description || '',
            chapters: data.chapters || [],
            deckType: data.deckType || 'None',
            gameModeType: data.gameModeType || 'constructed',
            basic: data.basic || false,
            matchups: data.matchups || [],
            cards: data.cards || [],
            heroName: data.heroName || '',
            playerClass: playerClass,
            createdDate: data.createdDate || new Date().toISOString(),
            premium: data.premium || {
                isPremium: false,
                expiryDate: d
            },
            slug: data.slug || '',
            isFeatured: data.isFeatured || false,
            isPublic: data.isPublic || true,
            voteScore: data.voteScore || 1,
            mulligans: data.mulligans || [
                {
                    className: 'Druid',
                    mulligansWithoutCoin: [],
                    mulligansWithCoin: [],
                    instructionsWithCoin: '',
                    instructionsWithoutCoin: ''
                },
                {
                    className: 'Hunter',
                    mulligansWithoutCoin: [],
                    mulligansWithCoin: [],
                    instructionsWithCoin: '',
                    instructionsWithoutCoin: ''
                },
                {
                    className: 'Mage',
                    mulligansWithoutCoin: [],
                    mulligansWithCoin: [],
                    instructionsWithCoin: '',
                    instructionsWithoutCoin: ''
                },
                {
                    className: 'Paladin',
                    mulligansWithoutCoin: [],
                    mulligansWithCoin: [],
                    instructionsWithCoin: '',
                    instructionsWithoutCoin: ''
                },
                {
                    className: 'Priest',
                    mulligansWithoutCoin: [],
                    mulligansWithCoin: [],
                    instructionsWithCoin: '',
                    instructionsWithoutCoin: ''
                },
                {
                    className: 'Rogue',
                    mulligansWithoutCoin: [],
                    mulligansWithCoin: [],
                    instructionsWithCoin: '',
                    instructionsWithoutCoin: ''
                },
                {
                    className: 'Shaman',
                    mulligansWithoutCoin: [],
                    mulligansWithCoin: [],
                    instructionsWithCoin: '',
                    instructionsWithoutCoin: ''
                },
                {
                    className: 'Warlock',
                    mulligansWithoutCoin: [],
                    mulligansWithCoin: [],
                    instructionsWithCoin: '',
                    instructionsWithoutCoin: ''
                },
                {
                    className: 'Warrior',
                    mulligansWithoutCoin: [],
                    mulligansWithCoin: [],
                    instructionsWithCoin: '',
                    instructionsWithoutCoin: ''
                },
            ]
        };

        db.validVideo = function () {
            //var r = /^(?:https?:\/\/)?(?:www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))((\w|-){11})(?:\S+)?$/;
            //return (db.video.length) ? db.video.match(r) : true;
            return true;
        };

        db.isStrong = function (strong) {
            return strong.isStrong;
        };

        db.isWeak = function (weak) {
            return weak.isWeak;
        };

        db.toggleStrong = function (strong) {
            strong.isStrong = !strong.isStrong;
        };

        db.toggleWeak = function (weak) {
            weak.isWeak = !weak.isWeak;
        };

        db.getStrong = function (klass) {
            var strong = db.against.strong;
            for (var i = 0; i < strong.length; i++) {
                if (strong[i].klass === klass) {
                    return strong[i];
                }
            }
            return false;
        };

        db.getWeak = function (klass) {
            var weak = db.against.weak;
            for (var i = 0; i < weak.length; i++) {
                if (weak[i].klass === klass) {
                    return weak[i];
                }
            }
            return false;
        };

        db.inMulligan = function (mulligan, withCoin, card) {
            var c = (withCoin) ? mulligan.withCoin.cards : mulligan.withoutCoin.cards;
            // check if card already exists
            for (var i = 0; i < c.length; i++) {
                if (c[i].id === card.id) {
                    return true;
                }
            }
            return false;
        };

        db.toggleMulligan = function (mulligan, withCoin, card) {
            console.log('mulligan: ', mulligan);
            console.log('card: ', card);
            console.log('with coin: ', withCoin);
            
            var cardMulligans = (withCoin) ? mulligan.mulligansWithCoin : mulligan.mulligansWithoutCoin,
                exists = false,
                index = -1;
            
            // check if card already exists
            for(var i = 0; i < cardMulligans.length; i++) {
                if (cardMulligans[i].id === card.id) {
                    exists = true;
                    index = i;
                    break;
                }
            }

            if (exists) {
                cardMulligans.splice(index, 1);
                console.log('spliced coinMulligan: ', cardMulligans);
            } else {
                // card doesn't exist in deck.mulligans
                if (cardMulligans.length < 6) {
                    card.cardId = card.id;
                    cardMulligans.push(card);
//                    console.log('added to mulligan: ', cardMulligans);
                }
            }
        };
            
        db.calcImgPosition = function(card) {
            var pos = 0;
            var pxRatio = 28;
            if (card.cardQuantity > 1) {
                pos += 1;
            }
            if (card.card.rarity === 'Legendary') {
                pos += 1;
            }
            return pxRatio * pos;
        };
        
        db.toggleGameMode = function(gameMode) {
            var cardQtyMoreThan2 = false;
            if (gameMode === 'constructed' || gameMode === 'brawl') {
                for(var i = 0; i < db.cards.length; i++) {
                    if (db.cards[i].cardQuantity > 2) {
                        cardQtyMoreThan2 = true;
                        break;
                    }
                }
                if (cardQtyMoreThan2) {
                    // Alert user that all cards with more than 2 will be reduced to 2
                    var box = bootbox.dialog({
                        title: 'Are you sure you want to change this deck from <strong>' + db.gameModeType + '</strong> to <strong>' + gameMode + '</strong>?',
                        message: 'All cards with more than 2 will be reduced to 2.',
                        buttons: {
                            delete: {
                                label: 'Continue',
                                className: 'btn-danger',
                                callback: function () {
                                    $timeout(function() {
                                        for(var i = 0; i < db.cards.length; i++) {
                                            if (db.cards[i].cardQuantity > 2) {
                                                db.cards[i].cardQuantity = 2;
                                            }
                                        }
                                        db.gameModeType = gameMode;
                                    });
                                }
                            },
                            cancel: {
                                label: 'Cancel',
                                className: 'btn-default pull-left',
                                callback: function () {
                                    box.modal('hide');
                                }
                            }
                        },
                        closeButton: false
                    });
                    box.modal('show');
                } else {
                    db.gameModeType = gameMode;
                }
            } else {
                db.gameModeType = gameMode;
            }
        };

        db.getMulligan = function (klass) {
            var mulligans = db.mulligans;
            for (var i = 0; i < mulligans.length; i++) {
                if (mulligans[i].className === klass) {
                    console.log('mulligan: ', mulligans[i]);
                    return mulligans[i];
                }
            }
            return false;
        };

        db.getContent = function () {
            return $sce.trustAsHtml(db.content);
        };

        db.isAddable = function (card) {
            if (db.gameModeType === 'arena') { return true; }
            if (card.playerClass !== db.playerClass && card.playerClass !== 'Neutral') { return false; }
            var exists = false,
                index = -1,
                isLegendary = (card.rarity === 'Legendary') ? true : false;

            // check if card already exists
            for (var i = 0; i < db.cards.length; i++) {
                if (db.cards[i].card.id === card.id) {
                    exists = true;
                    index = i;
                    break;
                }
            }

            if (exists) {
                return (!isLegendary && db.cards[index].cardQuantity === 1);
            } else {
                return true;
            }
        };

        // add card
        db.addCard = function (card) {
            
            var exists = false,
                index = -1,
                isLegendary = (card.rarity === 'Legendary') ? true : false,
                totalCards = db.getSize();
            
            console.log('adding card: ', card);

            // check if card already exists
            for (var i = 0; i < db.cards.length; i++) {
                if (db.cards[i].cardId === card.id) {
                    exists = true;
                    index = i;
                    break;
                }
            }

            // add card
            if (exists) {
                 // check gameModeType
                if(db.gameModeType === 'arena') {
                    db.cards[index].cardQuantity += 1;
                    return true;
                } else {
                    // mode is constructed or brawl mode
                    if (!isLegendary && db.cards[index].cardQuantity === 1) {
                        db.cards[index].cardQuantity += 1;
                        return true;
                    }
                    // increase qty by one
                    if (!isLegendary && (db.cards[index].cardQuantity === 1 || db.arena)) {
                        db.cards[index].cardQuantity = db.cards[index].cardQuantity + 1;
                        return true;
                    }
                }
            } else {
                var newCard = {
                    deckId: db.id,
                    cardId: card.id,
                    cardQuantity: 1,
                    card: card
                };
                // add new card
                db.cards.push(newCard);
                // sort deck
                db.sortDeck();
            }
        };

        db.sortDeck = function () {
            var weights = {
                'Weapon' : 0,
                'Spell': 1,
                'Minion': 2
            };

            function dynamicSort(property) {
                return function (a, b) {
                    if (property == 'cardType') {
                        if (weights[a[property]] < weights[b[property]]) return -1;
                        if (weights[a[property]] > weights[b[property]]) return 1;
                    } else {
                        if (a[property] < b[property]) return -1;
                        if (a[property] > b[property]) return 1;
                    }
                    return 0;
                }
            }

            function dynamicSortMultiple() {
                var props = arguments;
                return function (a, b) {
                    var i = 0,
                        result = 0;

                    while(result === 0 && i < props.length) {
                        result = dynamicSort(props[i])(a.card, b.card);
                        i++;
                    }
                    return result;
                }
            }

            db.cards.sort(dynamicSortMultiple('cost', 'cardType', 'name'));
        };

        db.removeCardFromDeck = function (card) {
            console.log('card rem: ', card);
            var cardRemovedFromDeck = false,
                index = -1,
                cardMulliganExists = false,
                cancel = false;
            
			console.log('db.cards:', db.cards);
            for (var i = 0; i < db.cards.length; i++) {
                if (card.id === db.cards[i].card.id) {
					console.log('card.id:', card.id);
					console.log('db.cards[i].card.id:', db.cards[i].card.id);
                    if (db.cards[i].cardQuantity > 1) {
                        db.cards[i].cardQuantity = db.cards[i].cardQuantity - 1;
                        return;
                    } else {
						index = i;
						cardRemovedFromDeck = true;
						break;
                    }
                }
            }
            
            if(cardRemovedFromDeck) {
                console.log('card was removed');
                // search all card with coin mulligans
				console.log('db.mulligans:', db.mulligans);
                for(var i = 0; i < db.mulligans.length; i++) {
					if (db.mulligans[i].mulligansWithCoin.length > 0) {
						for(var j = 0; j < db.mulligans[i].mulligansWithCoin.length; j++) {
							if (db.mulligans[i].mulligansWithCoin[j].id === card.id) {
								cardMulliganExists = true;
								break;
							}
						}
					}
                    
                    if (db.mulligans[i].mulligansWithoutCoin.length > 0) {
						for(var j = 0; j < db.mulligans[i].mulligansWithoutCoin.length; j++) {
							if (db.mulligans[i].mulligansWithoutCoin[j].id === card.id) {
								cardMulliganExists = true;
								break;
							}
						}
					}
                }
            }
            
            if (cardMulliganExists) {
                    var box = bootbox.dialog({
                        title: 'Are you sure you want to remove <strong>' + card.name + '</strong>?',
                        message: 'Current mulligans for ' + card.name + ' will be lost as well.',
                        buttons: {
                            delete: {
                                label: 'Continue',
                                className: 'btn-danger',
                                callback: function () {
                                    $timeout(function() {
                                        db.cards.splice(index, 1);
                                    });
                                    for(var i = 0; i < db.mulligans.length; i++) {
                                        for(var j = 0; j < db.mulligans[i].mulligansWithCoin.length; j++) {
                                            if (db.mulligans[i].mulligansWithCoin[j].id === card.id) {
                                                db.mulligans[i].mulligansWithCoin.splice(j, 1);
                                            }
                                        }
                                        for(var j = 0; j < db.mulligans[i].mulligansWithoutCoin.length; j++) {
                                            if (db.mulligans[i].mulligansWithoutCoin[j].id === card.id) {
                                                db.mulligans[i].mulligansWithoutCoin.splice(j, 1);
                                            }
                                        }
                                    }
                                }
                            },
                            cancel: {
                                label: 'Cancel',
                                className: 'btn-default pull-left',
                                callback: function () {
                                    box.modal('hide');
                                }
                            }
                        },
                        closeButton: false
                    });
                    box.modal('show');
                } else {
					if (index !== -1) {
						db.cards.splice(index, 1);
					}
				}
        };

        db.removeCard = function (card) {
            if (card.cardQuantity > 1) {
                card.cardQuantity = card.cardQuantity - 1;
            } else {
                var index = db.cards.indexOf(card);
                db.cards.splice(index, 1);
            }
        };

        db.manaCurve = function (mana) {
            var big = 0,
                cnt;
            // figure out largest mana count
            for (var i = 0; i <= 7; i++) {
                cnt = db.manaCount(i);
                if (cnt > big) big = cnt;
            }

            if (big === 0) return 0;

            return Math.ceil(db.manaCount(mana) / big * 100);
        };

        db.manaCount = function (mana) {
            var cnt = 0;
            for (var i = 0; i < db.cards.length; i++) {
                if (db.cards[i].card.cost === mana || (mana === 7 && db.cards[i].cost >= 7)) {
                    cnt += db.cards[i].cardQuantity;
                }
            }
            return cnt;
        };
        
//        db.manaCount = function (mana) {
//            var cnt = 0;
//            for (var i = 0; i < db.cards.length; i++) {
//                if (db.cards[i].card.cost === mana || (mana === 7 && db.cards[i].cost >= 7)) {
//                    cnt += db.cards[i].cardQuantity;
//                }
//            }
//            return cnt;
//        };
        
        db.getSize = function() {
            var size = 0;
            for(var i = 0; i < db.cards.length; i++) {
                size += db.cards[i].cardQuantity;
            }
            return size;
        };

//        db.getSize = function () {
//            var size = 0;
//            for (var i = 0; i <= 7; i++) {
//                size += db.manaCount(i);
//            }
//            return size;
//        };

        db.getDust = function () {
            var dust = 0;
            for (var i = 0; i < db.cards.length; i++) {
                dust += db.cards[i].cardQuantity * db.cards[i].card.dust;
            }
            return dust;
        };

        db.validDeck = function () {
            // attch dust value to deck
            db.dust = db.getDust();
            // 30 cards in deck
            if (db.getSize() !== 30) {
                 return false;
            } else if (db.getSize() === 30) {
                return true;
            }
        };

        db.moveChapterUp = function (chapter) {
            var oldIndex = db.chapters.indexOf(chapter),
                newIndex = oldIndex - 1;

            if (newIndex < 0) { return false; }

            db.chapters.splice(oldIndex, 1);
            db.chapters.splice(newIndex, 0, chapter);
        };

        db.moveChapterDown = function (chapter) {
            var oldIndex = db.chapters.indexOf(chapter),
                newIndex = oldIndex + 1;

            if (newIndex < 0) { return false; }

            db.chapters.splice(oldIndex, 1);
            db.chapters.splice(newIndex, 0, chapter);
        };

        db.addChapter = function () {
            db.chapters.push({
                title: '',
                content: ''
            });
        }

        db.removeChapter = function (index) {
            db.chapters.splice(index,1);
        }

        db.newMatch = function (klass) {
            console.log('vhat class?: ', klass);
            var m = {
                deckName: '',
                className: '',
                forChance: 0,
                match: 0
            };

            m.className = klass;
            db.matchups.push(m);
        }

        db.removeMatch = function (index) {
            db.matchups.splice(index,1);
        }

        return db;
    };

    deckBuilder.loadCards = function (page, perpage, search, mechanics, mana, playerClass) {
        var d = $q.defer();
        $http.post('/deckbuilder', { page: page, perpage: perpage, search: search, mechanics: mechanics, mana: mana, playerClass: playerClass }).success(function (data) {
            d.resolve(data);
        });
        return d.promise;
    }

    deckBuilder.saveDeck = function (deck) {
        return $http.post('/api/deck/add', {
            name: deck.name,
            deckType: deck.deckType,
            description: deck.description,
            chapters: deck.chapters,
            matches: deck.matches,
            type: deck.type,
            basic: deck.basic,
            cards: deck.cards,
            heroName: deck.heroName,
            playerClass: deck.playerClass,
            mulligans: deck.mulligans,
            video: deck.video,
            premium: deck.premium,
            featured: deck.featured,
            public: deck.public
        });
    };

    deckBuilder.updateDeck = function (deck) {
        return $http.post('/api/deck/update', {
            id: deck.id,
            name: deck.name,
            deckType: deck.deckType,
            description: deck.description,
            chapters: deck.chapters,
            matches: deck.matches,
            type: deck.type,
            basic: deck.basic,
            cards: deck.cards,
            heroName: deck.heroName,
            playerClass: deck.playerClass,
            mulligans: deck.mulligans,
            video: deck.video,
            premium: deck.premium,
            featured: deck.featured,
            public: deck.public
        });
    };

    return deckBuilder;
}])
.factory('GuideBuilder', ['$sce', '$http', '$q', 'User', 'HeroTalent', function ($sce, $http, $q, User, HeroTalent) {

    var guideBuilder = {};

    guideBuilder.new = function (guideType, data) {
        data = data || {};

        var d = new Date();
        d.setMonth(d.getMonth() + 1);

        var gb = {
            name: data.name || '',
            slug: data.slug || '',
            guideType: guideType,
            description: data.description || '',
            content: data.content || [],
            heroes: data.heroes || [],
            createdDate: new Date().toISOString(),
            maps: data.maps || [],
            synergy: data.synergy || [],
            against: data.against || {
                strong: [],
                weak: []
            },
            youtubeId: data.youtubeId || '',
            premium: data.premium || {
                isPremium: false,
                expiryDate: d
            },
            isFeatured: data.featured || false,
            isPublic: (data.isPublic) ? data.isPublic.toString() : 'true',
            votes: data.votes || [],
            voteScore: data.votesCount || 0,
            viewCount: data.viewcount || 0,
            authorId: data.authorId || User.getCurrentId(),
            talentTiers: data.talentTiers || {}
        };

        // constrain maps to 1 if map guide
        if (guideType === 'map' && gb.maps.length > 1) {
            gb.maps = [gb.maps[0]];
        }

        gb.validVideo = function () {
            //var r = /^(?:https?:\/\/)?(?:www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))((\w|-){11})(?:\S+)?$/;
            //return (gb.video.length) ? gb.video.match(r) : true;
            return true;
        };

        gb.getContent = function (content) {
            return $sce.trustAsHtml(content);
        };

        gb.moveContentUp = function (content) {
            var oldIndex = gb.content.indexOf(content),
                newIndex = oldIndex - 1;

            if (newIndex < 0) { return false; }

            gb.content.splice(oldIndex, 1);
            gb.content.splice(newIndex, 0, content);
        };

        gb.moveContentDown = function (content) {
            var oldIndex = gb.content.indexOf(content),
                newIndex = oldIndex + 1;

            if (newIndex > (gb.content.length - 1)) { return false; }

            gb.content.splice(oldIndex, 1);
            gb.content.splice(newIndex, 0, content);
        };

//        gb.toggleHero = function (hero) {
//            if (gb.hasHero(hero)) {
//                for (var i = 0; i < gb.heroes.length; i++) {
//                    if (gb.heroes[i].hero._id === hero._id) {
//                        gb.heroes.splice(i, 1);
//                        return true;
//                    }
//                }
//            } else {
//                if (gb.heroes.length === 5) { return false; }
//                var obj = {};
//                obj.hero = hero;
//                obj.talents = {
//                    tier1: null,
//                    tier4: null,
//                    tier7: null,
//                    tier10: null,
//                    tier13: null,
//                    tier16: null,
//                    tier20: null
//                };
//                gb.heroes.push(obj);
//            }
//        };

        gb.toggleHero = function (hero) {
          if (gb.hasHero(hero)) {
            for (var i = 0; i < gb.heroes.length; i++) {
              if (gb.heroes[i].hero.id === hero.id) {
                gb.heroes.splice(i, 1);
                return true;
              }
            }
          } else {
            if (gb.heroes.length === 5) { return false; }

            var obj = {};
            obj.hero = hero;
//            obj.hero.talents = tals;
            obj.talents = {
              tier1: null,
              tier4: null,
              tier7: null,
              tier10: null,
              tier13: null,
              tier16: null,
              tier20: null
            };
            gb.heroes.push(obj);
            
            if (_.isEmpty(hero.talents)) {
              HeroTalent.find({
                filter: {
                  where: {
                    heroId: hero.id
                  },
                  include: ['talent']
                }
              })
              .$promise
              .then(function (data) {
                var heroes = gb.heroes;
                var index = heroes.indexOf(obj);

                hero.talents = data;
                heroes[index].hero.talents = data;
              });
            }
          }
        };

//        gb.hasHero = function (hero) {
//            if (!hero) { return false; }
//            for (var i = 0; i < gb.heroes.length; i++) {
//                if (gb.heroes[i].hero._id === hero._id) {
//                    return true;
//                }
//            }
//            return false;
//        };

        gb.hasHero = function (hero) {
            if (!hero) { return false; }
            for (var i = 0; i < gb.heroes.length; i++) {
                if (gb.heroes[i].hero.id === hero.id) {
                    return true;
                }
            }
            return false;
        };

        gb.hasAnyHero = function () {
            return gb.heroes.length;
        };

        gb.tiers = function () {
            return [1, 4, 7, 10, 13, 16, 20];
        };

        gb.talentsByTier = function (hero, tier) {
          var temp = _.filter(hero.talents, function (val) { return val.tier == tier });
          var talents = _.map(temp, function (val) { return val.talent; });

          return talents;
        };

//        gb.toggleTalent = function (hero, talent) {
//            if (gb.hasTalent(hero, talent)) {
//                hero.talents['tier'+talent.tier] = null;
//            } else {
//                hero.talents['tier'+talent.tier] = talent._id;
//            }
//        };

        gb.toggleTalent = function (hero, talent) {
          var talentId = talent.id;
          var tal = _.find(hero.hero.talents, function (val) { return val.talentId == talentId });

          if (gb.hasTalent(hero, talent)) {
            hero.talents['tier'+tal.tier] = null;
          } else {
            hero.talents['tier'+tal.tier] = talentId;
          }
        };

//        gb.hasAnyTalent = function (hero, talent) {
//            return (hero.talents['tier'+talent.tier] !== null);
//        };

        gb.hasAnyTalent = function (hero, talent) {
          var talentId = talent.id;
          var tal = _.find(hero.hero.talents, function (val) { return val.talentId == talentId });
          
          return (hero.talents['tier'+tal.tier] !== null);
        };

        gb.allTalentsDone = function () {
            for (var i = 0; i < gb.heroes.length; i++) {
                if ( gb.heroes[i].talents.tier1 === null ||
                    gb.heroes[i].talents.tier4 === null ||
                    gb.heroes[i].talents.tier7 === null ||
                    gb.heroes[i].talents.tier10 === null ||
                    gb.heroes[i].talents.tier13 === null ||
                    gb.heroes[i].talents.tier16 === null ||
                    gb.heroes[i].talents.tier20 === null ) {
                    return false;
                }
            }
            return true;
        };

//        gb.hasTalent = function (hero, talent) {
//            return (hero.talents['tier'+talent.tier] == talent._id);
//        };

        gb.hasTalent = function (hero, talent) {
          var talentId = talent.id;
          var tal = _.find(hero.hero.talents, function (val) { return val.talentId == talentId });

          return (hero.talents['tier'+tal.tier] == talent.id);
        };

        gb.toggleSynergy = function (hero) {
          if (gb.hasSynergy(hero)) {
            for (var i = 0; i < gb.synergy.length; i++) {
              if (gb.synergy[i] === hero.id) {
                gb.synergy.splice(i, 1);
                return true;
              }
            }
          } else {
            gb.synergy.push(hero.id);
          }
        };

        gb.hasSynergy = function (hero) {
            for (var i = 0; i < gb.synergy.length; i++) {
                if (gb.synergy[i] === hero.id) {
                    return true;
                }
            }
            return false;
        };

        gb.toggleStrong = function (hero) {
            if (gb.hasStrong(hero)) {
                for (var i = 0; i < gb.against.strong.length; i++) {
                    if (gb.against.strong[i] === hero.id) {
                        gb.against.strong.splice(i, 1);
                        return true;
                    }
                }
            } else {
                gb.against.strong.push(hero.id);
            }
        };

        gb.hasStrong = function (hero) {
            for (var i = 0; i < gb.against.strong.length; i++) {
                if (gb.against.strong[i] === hero.id) {
                    return true;
                }
            }
            return false;
        };

        gb.toggleWeak = function (hero) {
            if (gb.hasWeak(hero)) {
                for (var i = 0; i < gb.against.weak.length; i++) {
                    if (gb.against.weak[i] === hero.id) {
                        gb.against.weak.splice(i, 1);
                        return true;
                    }
                }
            } else {
                gb.against.weak.push(hero.id);
            }
        };

        gb.hasWeak = function (hero) {
            for (var i = 0; i < gb.against.weak.length; i++) {
                if (gb.against.weak[i] === hero.id) {
                    return true;
                }
            }
            return false;
        };

        gb.hasAnyChapter = function () {
            return gb.content.length;
        };

        gb.hasAnyMap = function () {
            return gb.maps.length;
        };

        gb.setMap = function (map) {
            gb.maps = [map.id];
        };

        gb.toggleMap = function (map) {
            if (gb.hasMap(map)) {
                for (var i = 0; i < gb.maps.length; i++) {
                    if (gb.maps[i] === map.id) {
                        gb.maps.splice(i, 1);
                        return true;
                    }
                }
            } else {
                gb.maps.push(map.id);
            }
        };

        gb.hasMap = function (map) {
            for (var i = 0; i < gb.maps.length; i++) {
                if (gb.maps[i] === map.id) {
                    return true;
                }
            }
            return false;
        };

        gb.addContent = function () {
            gb.content.push({
                title: 'NEW CHAPTER',
                body: ''
            });
        };

        gb.deleteContent = function (content) {
            var index = gb.content.indexOf(content);
            if (index !== -1) {
                gb.content.splice(index, 1);
            }
        };

        return gb;
    }

    return guideBuilder;
}])
.factory('DeckService', ['$http', '$q', function ($http, $q) {
    return {
        getDecksCommunity: function (klass, page, perpage, search) {
            klass = klass || false;
            page = page || 1;
            perpage = perpage || 24;
            search = search || false;

            var d = $q.defer();
            $http.post('/decks/community', { klass: klass, page: page, perpage: perpage, search: search }).success(function (data) {
                d.resolve(data);
            });
            return d.promise;
        },
        getDecksFeatured: function (klass, page, perpage, search) {
            klass = klass || false;
            page = page || 1;
            perpage = perpage || 24;
            search = search || false;

            var d = $q.defer();
            $http.post('/decks/featured', { klass: klass, page: page, perpage: perpage, search: search }).success(function (data) {
                d.resolve(data);
            });
            return d.promise;
        },
        getDecks: function (klass, page, perpage, search, age, order) {
            klass = klass || 'all';
            page = page || 1;
            perpage = perpage || 24;
            search = search || '';
            age = age || 'all';
            order = order || 'high';

            var d = $q.defer();
            $http.post('/decks', { klass: klass, page: page, perpage: perpage, search: search, age: age, order: order }).success(function (data) {
                d.resolve(data);
            });
            return d.promise;
        },
        getDeck: function (slug) {
            var d = $q.defer();
            $http.post('/deck', { slug: slug }).success(function (data) {
                d.resolve(data);
            });
            return d.promise;
        },
        deckEdit: function (slug) {
            var d = $q.defer();
            $http.post('/api/deck', { slug: slug }).success(function (data) {
                d.resolve(data);
            });
            return d.promise;
        },
        deckDelete: function (_id) {
            return $http.post('/api/deck/delete', { _id: _id });
        },
        addComment: function (deck, comment) {
            return $http.post('/api/deck/comment/add', { deckID: deck._id, comment: comment });
        }
    };
}])
.factory('HOTSGuideService', ['$http', '$q', function ($http, $q) {
    return {
        getGuidesCommunity: function (filters, offset, perpage, search, daysLimit) {
            filters = filters || false;
            offset = offset || 0;
            perpage = perpage || 10;
            search = search || false;
            daysLimit = daysLimit || false;

            var d = $q.defer();
            $http.post('/hots/guides/community', { filters: filters, offset: offset, perpage: perpage, search: search, daysLimit: daysLimit }).success(function (data) {
                d.resolve(data);
            });
            return d.promise;
        },
        getGuidesFeatured: function (filters, offset, perpage, search) {
            filters = filters || false;
            offset = offset || 0;
            perpage = perpage || 10;
            search = search || false;

            var d = $q.defer();
            $http.post('/hots/guides/featured', { filters: filters, offset: offset, perpage: perpage, search: search }).success(function (data) {
                d.resolve(data);
            });
            return d.promise;
        },
        getGuides: function (guideType, filters, page, perpage, search) {
            guideType = guideType || 'all';
            filters = filters || false;
            page = page || 1;
            perpage = perpage || 24;
            search = search || '';

            var d = $q.defer();
            $http.post('/hots/guides', { guideType: guideType, filters: filters, page: page, perpage: perpage, search: search }).success(function (data) {
                d.resolve(data);
            });
            return d.promise;
        },
        getGuide: function (slug) {
            var d = $q.defer();
            $http.post('/hots/guide', { slug: slug }).success(function (data) {
                d.resolve(data);
            });
            return d.promise;
        },
        getMaps: function () {
            var d = $q.defer();
            $http.post('/hots/maps', {}).success(function (data) {
                d.resolve(data);
            });
            return d.promise;
        },
        guideEdit: function (slug) {
            var d = $q.defer();
            $http.post('/api/hots/guide', { slug: slug }).success(function (data) {
                d.resolve(data);
            });
            return d.promise;
        },
        addGuide: function (guide) {
            return $http.post('/api/hots/guide/add', guide);
        },
        editGuide: function (guide) {
            return $http.post('/api/hots/guide/update', guide);
        },
        guideDelete: function (_id) {
            return $http.post('/api/hots/guide/delete', { _id: _id });
        },
        addComment: function (guide, comment) {
            return $http.post('/api/hots/guide/comment/add', { guideID: guide._id, comment: comment });
        }
    };
}])
.factory('HOTSGuideQueryService', ['Hero', 'Map', 'Guide', 'Article', function (Hero, Map, Guide, Article) {
    return {
        getArticles: function (filters, isFeatured, limit, finalCallback) {
          async.waterfall([
            function(seriesCallback) {
              var where = {};

              if ((!_.isEmpty(filters.roles) || !_.isEmpty(filters.universes)) && _.isEmpty(filters.heroes)) {
                where.and = [];
                if (!_.isEmpty(filters.roles)) {
                  where.and.push({ role: { inq: filters.roles }})
                }

                if (!_.isEmpty(filters.universes)) {
                  where.and.push({ universe: { inq: filters.universes }})
                }
              } else if (!_.isEmpty(filters.heroes)) {
                var heroNames = _.map(filters.heroes, function (hero) { return hero.name });
                where.name = { inq: heroNames };
              }

              Hero.find({
                filter: {
                  where: where,
                  fields: ["name"]
                }
              }, function (heroes) {
                return seriesCallback(undefined, heroes);
              }, function (err) {
                console.log(err);
                return finalCallback(err);
              });
            },
            function(heroes, seriesCallback) {
              heroes = _.map(heroes, function(hero) { return hero.name; })

              Article.find({
                filter: {
                  where: {
                    classTags: { inq: heroes }
                  },
                  fields: {
                    title: true,
                    description: true,
                    photoNames: true,
                    themeName: true,
                    slug: true,
                    articleType: true,
                    premium: true
                  }
                }
              }, function (articles) {
                return finalCallback(undefined, articles);
              }, function (err) {
                console.log(err);
                return finalCallback(err);
              })
            }
          ])
        },
        getGuides: function (filters, isFeatured, limit, finalCallback) {
            var order = "voteScore DESC",
                heroWhere = {}, 
                guideWhere = {
                    guideType: "hero"
                },
                heroGuideWhere = {};
            
            if (filters.search == "" && (!_.isEmpty(filters.universes) || !_.isEmpty(filters.roles))) {
                heroWhere.and = [];

                if (!_.isEmpty(filters.universes)) {
                    heroWhere.and.push({ universe: { inq: filters.universes } });
                }

                if (!_.isEmpty(filters.roles)) {
                    heroWhere.and.push({ role: { inq: filters.roles } });
                }
            } else if (filters.search != "") {
                heroGuideWhere.or = [
                    { name: { regexp: filters.search } },
                    { description: { regexp: filters.search } }
                ]
            }
            
            if (isFeatured !== null) {
                guideWhere.isFeatured = isFeatured;
                order = "createdDate DESC";
            }
            
            
            async.waterfall([
                function(seriesCallback) {
                    var selectedUniverses = filters.universes,
                        selectedRoles = filters.roles

                    Hero.find({
                        filter: {
                            fields: ["id"],
                            where: heroWhere,
                            include: [
                                {
                                    relation: "guides",
                                    scope: {
                                        fields: ["id"],
                                        where: heroGuideWhere
                                    }
                                }
                            ]
                        }
                    }, function (heroes) {
                        return seriesCallback(undefined, heroes);
                    }, function (err) {
                        return seriesCallback(err);
                    })
                }, function (heroes, seriesCallback) {
                    var selectedGuideIds = [];
                    _.each(heroes, function(hero) {
                        selectedGuideIds.push(_.map(hero.guides, function (guide) { return guide.id }));
                    })
                    selectedGuideIds = _.flatten(selectedGuideIds);
                    return seriesCallback(undefined, selectedGuideIds);
                }, function (selectedGuideIds, seriesCallback) {
                    guideWhere.id = { inq: selectedGuideIds };
                    
                    Guide.find({
                      filter: {
                        limit: limit,
                        order: order,
                        where: guideWhere,
                        fields: [
                          "name", 
                          "authorId", 
                          "slug", 
                          "voteScore", 
                          "guideType", 
                          "premium", 
                          "id", 
                          "talentTiers",
                          "createdDate"
                        ],
                        include: [
                          {
                            relation: "author",
                            scope: {
                              fields: ['username']
                            }
                          },
                          {
                            relation: 'guideHeroes',
                            scope: {
                              include: [
                                {
                                  relation: 'talents'
                                },
                                {
                                  relation: 'hero',
                                  scope: {
                                    include: (isFeatured !== null) ? false : ['talents'],
                                    fields: ['name', 'className']
                                  }
                                }
                              ]
                            }
                          },
                          {
                            relation: 'guideTalents',
                            scope: {
                              include: {
                                relation: 'talent',
                                scope: {
                                  fields: {
                                    name: true,
                                    className: true
                                  }
                                }
                              },
                            }
                          },
                        ]
                      }
                    }).$promise.then(function (guides) {
                        return finalCallback(undefined, guides);
                    }).catch(function (err) {
                        return finalCallback(err);
                    });
                }
            ])
        },
        getHeroGuides: function (filters, isFeatured, limit, finalCallback) {
            var selectedHeroes = filters.heroes,
                order = "voteScore DESC";

            if (_.isEmpty(selectedHeroes)) {
                return;
            }
            
            var where = {
                guideType: "hero"
            }
            
            if (isFeatured !== null) {
                where.isFeatured = isFeatured
                order = "createdDate DESC";
            }

            async.waterfall([
                function (seriesCallback) {
                    var selectedHeroIds = _.map(selectedHeroes, function (hero) { return hero.id; })

                    Hero.find({
                        filter: {
                            fields: ["id"],
                            where: {
                                id: { inq: selectedHeroIds }
                            },
                            include: [
                                {
                                    relation: "guides",
                                    scope: {
                                        fields: ["id"],
                                        where: where
                                    }
                                }
                            ]
                        }
                    }, function (heroes) {
                        return seriesCallback(undefined, heroes);
                    }, function (err) {
                        return finalCallback(err);
                    })
                }, function (heroes, seriesCallback) {
                    var selectedGuideIds = [];

                    _.each(heroes, function (hero) {
                        _.each(filters.heroes, function (selectedHero) {
                            if (hero.id == selectedHero.id) {
                                var filteredGuides = _.map(hero.guides, function (guide) { return guide.id; })
                            }
                            selectedGuideIds.push(filteredGuides);
                        })

                    })
                    return seriesCallback(undefined, selectedGuideIds);
                }, function (guideIds, seriesCallback) {
                    guideIds = _.flatten(guideIds);

                    Guide.find({
                        filter: {
                            limit: limit,
                            order: order,
                            where: {
                                id: { inq: guideIds }
                            },
                            fields: [
                                "name", 
                                "authorId", 
                                "slug", 
                                "voteScore", 
                                "guideType", 
                                "premium", 
                                "id", 
                                "talentTiers",
                                "createdDate"
                            ],
                            include: [
                            {
                              relation: "author",
                              scope: {
                                fields: ['username']
                              }
                            },
                            {
                              relation: 'guideHeroes',
                              scope: {
                                include: [
                                  {
                                    relation: 'talents'
                                  },
                                  {
                                    relation: 'hero',
                                    scope: {
                                      include: (isFeatured !== null) ? false : ['talents'],
                                      fields: ['name', 'className']
                                    }
                                  }
                                ]
                              }
                            },
                            {
                              relation: 'guideTalents',
                              scope: {
                                include: {
                                  relation: 'talent',
                                  scope: {
                                    fields: {
                                      name: true,
                                      className: true
                                    }
                                  }
                                },
                              }
                            },
                          ]
                        }
                    }).$promise.then(function (guides) {
                        return finalCallback(undefined, guides);
                    }).catch(function (err) {
                        return finalCallback(err);
                    })
                }
            ])
        },
        getMapGuides: function (filters, isFeatured, limit, finalCallback) {
            var selectedMap = filters.map;

            if (_.isEmpty(selectedMap)) {
                return;
            }

            var where = {
                guideType: "map"
            }
            
            if (isFeatured !== null) {
                where.isFeatured = isFeatured
            }
            
            async.waterfall(
                [
                    function (seriesCallback) {
                        Map.findOne({
                            filter: {
                                fields: ["id"],
                                where: {
                                    id: filters.map.id
                                },
                                include: [
                                    {
                                        relation: "guides",
                                        scope: {
                                            fields: ["id"],
                                            where: where
                                        }
                                    }
                                ]
                            }
                        }, function (maps) {
                            return seriesCallback(undefined, maps);
                        }, function (err) {
                            return finalCallback(err);
                        })
                    },
                    function (map, seriesCallback) {
                        var guides = map.guides;
                        var guideIds = _.map(guides, function(guide) { return guide.id })

                        Guide.find({
                            filter: {
                                limit: limit,
                                order: "createdDate DESC",
                                where: {
                                    id: { inq: guideIds }
                                },
                                fields: [
                                    "id",
                                    "name",
                                    "createdDate",
                                    "voteScore",
                                    "slug",
                                    "guideType",
                                    "authorId",
                                    "public",
                                    "premium"
                                ],
                                include: [
                                    {
                                      relation: "author",
                                      scope: {
                                        fields: ['username']
                                      }
                                    },
                                    {
                                        relation: "maps"
                                    }
                                ]
                            }
                        }).$promise.then(function (guides) {
                            return finalCallback(undefined, guides);
                        }).catch(function (err) {
                            return finalCallback(err)
                        })
                    }
                ]
            )
        },
        getHeroMapGuides: function (filters, isFeatured, limit, finalCallback) {
            var selectedHeroes = filters.heroes;

            if (_.isEmpty(selectedHeroes)) {
                return;
            }
            
            var where = {}
            
            if (isFeatured !== null) {
                where.isFeatured = isFeatured
            }

            async.waterfall([
                //get selected heroes
                function (seriesCallback) {
                    var selectedHeroIds = _.map(selectedHeroes, function (hero) { return hero.id; });

                    Hero.find({
                        filter: {
                            fields: ["id"],
                            where: { id : { inq: selectedHeroIds } },
                            include: [
                                {
                                    relation: "guides",
                                    scope: {
                                        where: where,
                                        fields: ["id"],
                                        include: [
                                            {
                                                relation: "maps",
                                                scope: {
                                                    fields: ["className"]
                                                }
                                            },
                                            {
                                                relation: "guideHeroes",
                                                scope: {
                                                    fields: ["id"]
                                                }
                                            }
                                        ]
                                    }
                                }
                            ]
                        }
                    }, function (heroes) {
                        return seriesCallback(undefined, heroes);
                    }, function (err) {
                        return seriesCallback(err);
                    })
                },
                //filter heroes
                function (heroes, seriesCallback) {
                    //filter out guides by map className
                    try {
                        var selectedGuides = [];
                        _.each(heroes, function (hero) { 
                           var filteredGuides = _.filter(hero.guides, function (guide) {
                                return _.find(guide.maps, function (map) {
                                    return (map.className === filters.map.className)
                                })
                            });
                            selectedGuides.push(filteredGuides);
                        });

                        selectedGuides = _.flatten(selectedGuides);
                        var selectedGuideIds = _.map(selectedGuides, function(guide) { return guide.id })

                        return seriesCallback(undefined, selectedGuideIds);
                    } catch (err) {
                        return seriesCallback(err);
                    }
                },
                //populate heroes, talents
                function (selectedGuideIds, seriesCallback) {
                    Guide.find({
                        filter: {
                            limit: limit,
                            order: "createdDate DESC",
                            where: {
                                id: { inq: selectedGuideIds }
                            },
                            fields: [
                                "name", 
                                "authorId", 
                                "slug", 
                                "voteScore", 
                                "guideType", 
                                "premium", 
                                "id", 
                                "talentTiers",
                                "createdDate"
                            ],
                            include: [
                            {
                              relation: "author",
                              scope: {
                                fields: ['username']
                              }
                            },
                            {
                              relation: 'guideHeroes',
                              scope: {
                                include: [
                                  {
                                    relation: 'talents'
                                  },
                                  {
                                    relation: 'hero',
                                    scope: {
                                      include: (isFeatured !== null) ? false : ['talents'],
                                      fields: ['name', 'className']
                                    }
                                  }
                                ]
                              }
                            },
                            {
                              relation: 'guideTalents',
                              scope: {
                                include: {
                                  relation: 'talent',
                                  scope: {
                                    fields: {
                                      name: true,
                                      className: true
                                    }
                                  }
                                },
                              }
                            },
                          ]
                        }
                    }).$promise.then(function (guides) {
                        return seriesCallback(undefined, guides);
                    }).catch(function (err) {
                        return seriesCallback(err);
                    })
                }
            ],
            function (err, guides) {
                if (err) {
                    console.log("Error:", err);
                };
                return finalCallback(err, guides);
            })
        }
    }
}])
.factory('HeroService', ['$http', '$q', function ($http, $q) {
    return {
        getHeroesList: function () {
            var d = $q.defer();
            $http.post('/hots/heroes/list', {}).success(function (data) {
                d.resolve(data);
            });
            return d.promise;
        },
        getHeroes: function () {
            var d = $q.defer();
            $http.post('/hots/heroes', {}).success(function (data) {
                d.resolve(data);
            });
            return d.promise;
        },
        getHero: function (_id) {
            var d = $q.defer();
            $http.post('/hots/hero', { _id: _id }).success(function (data) {
                d.resolve(data);
            });
            return d.promise;
        },
        getHeroByClass: function (hero) {
            var d = $q.defer();
            $http.post('/hots/hero/class', { hero: hero }).success(function (data) {
                d.resolve(data);
            });
            return d.promise;
        }
    };
}])
.factory('VoteService', ['$http', '$q', function ($http, $q) {
    return {
        voteArticle: function (article) {
            var d = $q.defer();
            $http.post('/api/article/vote', { _id: article._id }).success(function (data) {
                d.resolve(data);
            });
            return d.promise;
        },
        voteSnapshot: function (direction, snapshot) {
            var d = $q.defer();
            $http.post('/api/snapshot/vote', { _id: snapshot._id, direction: direction }).success(function (data) {
                d.resolve(data);
            });
            return d.promise;
        },
        voteDeck: function (direction, deck) {
            var d = $q.defer();
            $http.post('/api/deck/vote', { _id: deck._id, direction: direction }).success(function (data) {
                d.resolve(data);
            });
            return d.promise;
        },
        voteGuide: function (direction, guide) {
            var d = $q.defer();
            $http.post('/api/hots/guide/vote', { _id: guide._id, direction: direction }).success(function (data) {
                d.resolve(data);
            });
            return d.promise;
        },
        voteComment: function (direction, comment) {
            var d = $q.defer();
            $http.post('/api/comment/vote', { _id: comment._id, direction: direction }).success(function (data) {
                d.resolve(data);
            });
            return d.promise;
        }
    };
}])
.factory('ForumService', ['$http', '$q', function ($http, $q) {
    return {
        getCategories: function () {
            var d = $q.defer();
            $http.post('/forum', {}).success(function (data) {
                d.resolve(data);
            });
            return d.promise;
        },
        getThread: function (thread) {
            var d = $q.defer();
            $http.post('/forum/thread', { thread: thread }).success(function (data) {
                d.resolve(data);
            });
            return d.promise;
        },
        getPost: function (thread, post) {
            var d = $q.defer();
            $http.post('/forum/post', { thread: thread, post: post }).success(function (data) {
                d.resolve(data);
            });
            return d.promise;
        },
        addPost: function (thread, post) {
            return $http.post('/api/forum/post/add', { thread: thread, post: post });
        },
        addComment: function (post, comment) {
            return $http.post('/api/forum/post/comment/add', { post: post, comment: comment });
        }
    };
}])
.factory('ImgurService', ['$http', '$q', function ($http, $q) {
    return {
        upload: function (file) {
            var d = $q.defer(),
                data = new FormData();

            data.append("file", file);

            $http.post('/upload', data).success(function (data) {
                d.resolve(data);
            });
            return d.promise;
        }
    };
}])
.factory('BannerService', ['$http', '$q', function ($http, $q) {
    return {
        getBanners: function (bannerType) {
            var d = $q.defer(),
                bannerType = bannerType || 'ts';

            $http.post('/banners', { bannerType: bannerType }).success(function (data) {
                d.resolve(data);
            });
            return d.promise;
        }
    };
}])
.factory('TwitchService', ['$http', '$q', function($http, $q) {
    return {
        getStreams: function () {
            var d = $q.defer();
            $http.post('/twitchFeed', { limit: 50 }).success(function (data) {
                d.resolve(data);
            });
            return d.promise;
        }
    };
}])
.factory('TwitterService', ['$http', '$q', function($http, $q) {
    return {
        getFeed: function () {
            var d = $q.defer();
            $http.post('/twitterFeed', { limit: 6 }).success(function (data) {
                d.resolve(data);
            });
            return d.promise;
        }
    };
}])
.factory('ContactService', ['$http', '$q', function ($http, $q) {
    return {
        sendContact: function (contact) {
            return $http.post('/api/contact/send', { contact: contact });
        }
    };
}])
.factory('TeamService', ['$http', '$q', function ($http, $q) {
    return {

        getMembers: function (gm) {
            var d = $q.defer();
            $http.post('/team', {gm: gm}).success(function (data) {
                d.resolve(data);
            });
            return d.promise;
        }
    };
}])
.factory('VodService', ['$http', '$q', function ($http, $q) {
    return {
        getLatestVod: function () {
            var d = $q.defer();
            $http.post('/vod').success(function (data) {
                d.resolve(data);
            });
            return d.promise;
        }
    }
}])
.factory('EventService', [function () {

     var EVENT_LOGIN = "EVENT_LOGIN";
     var EVENT_LOGOUT = "EVENT_LOGOUT";

     var listeners = {};
     function registerListener(eventName, listener) {
         if(typeof eventName !== "string")
            throw new Error("event name must be a string");
         if(typeof listener !== "function")
             throw new Error("listener must be a function");

         if(!Array.isArray(listeners[eventName])) {
             listeners[eventName] = [];
         }

         listeners[eventName].push(listener);
     }

     function unregisterListener(eventName, listener) {
        if(typeof eventName !== "string")
            throw new Error("event name must be a string");
        if(typeof listener !== "function")
            throw new Error("listener must be a function");

        if(!Array.isArray(listeners[eventName])) {
            var index = listeners[eventName].indexOf(listener);
            if(index !== -1) {
                listeners[eventName].splice(index, 1);
            }
        }
     }

     function emit(eventName, data) {
        var _listeners = listeners[eventName];
        if(Array.isArray(_listeners)) {
            for(var key in _listeners) {
                _listeners[key](data);
            }
        }
     }

     return {
        EVENT_LOGIN: EVENT_LOGIN,
        EVENT_LOGOUT : EVENT_LOGOUT,
        registerListener : registerListener,
        unregisterListener : unregisterListener,
        emit : emit
     }
}])
.factory('CrudMan', [
  function () {
    var arrs = {};
    var crud = {
      exists  : [],
      toDelete: [],
      toWrite: [] //toWrite holds both items to create and items to update and we can check against what's in exists to determine whether or not we need to create or update
    }
    
    function getArrs () {
      return arrs;
    }
    
    function find (item, arrName, crud) {
      return _.find(arrs[arrName][crud], function (val) { return val == item });
    }
    
    function createArr (arrName) {
      arrs[arrName] = angular.copy(crud);
    }
    
    function setExists (inArr, arrName) {
      if (!arrs[arrName]) {
        this.createArr(arrName);
      }
      
      _.each(inArr, function (val) { arrs[arrName].exists.push(val); });
    }
    
    function removeFromArr (item, arrName, crud) {
      var arr = arrs[arrName];
      var idx = arr[crud].indexOf(item);
      
      arr[crud].splice(idx, 1);
    }
    
    function addToArr (item, arrName, crud) {
      var arr = arrs[arrName];
      
      if (find(item, arrName, crud)) {
        var idx = arr[crud].indexOf(item);
        
        arr['toDelete'].splice(idx, 1);
      }
      
      arr['toWrite'].push(item);
    }
    
    function toggleItem (item, arrName) {
      var e = 'exists';
      var d = 'toDelete';
      var c = 'toWrite';

      if (find(item, arrName, e)) {
        console.log('is in exists');
        arrs[arrName][d].push(item);
      } else if (find(item, arrName, c)) {
        console.log('is in create');
        removeFromArr(item, arrName, c);
      } else {
        console.log('added to create');
        addToArr(item, arrName, c);
      }
      
      console.log('CrudMan toggle triggered', arrs);
    }
    
    return {
      setExists: setExists,
      toggleItem: toggleItem,
      createArr: createArr,
      getArrs: getArrs
    }
  }
])
.factory('markitupSettings', [
  function() {
    var factory, markset;
    markset = [
      //here goes your usual markItUp layout
    ];
    factory = {};
    factory.create = function(callback) {
      return {
        afterInsert: callback,
        previewParserPath: '',
        markupSet: markset
      };
    };
    return factory;
  }
]);
;
