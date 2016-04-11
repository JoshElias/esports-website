angular.module('tsAdSense', [])
.run(
    ['$rootScope', 'User',
        function ($rootScope, User) {
            $rootScope.$on("$stateChangeStart", function(event, toState, toParams, fromState, fromParams) {
                var s = document.getElementById('adCode');
                var e = $('.ad-script-tag');

                if (!_.isNull(s)) {
                    s.parentNode.removeChild(s);
                    window.googleAdsAlreadyLoaded = false;
                }


                for (var i = 0; i < e.length; i++) {
                    $(e[i]).remove();
                }

                //Object.keys($window).filter(function(k) { return k.indexOf('google') >= 0 }).forEach(
                //    function(key) {
                //      delete($window[key]);
                //    }
                //);
            });

            $rootScope.$on("$stateChangeSuccess", function(event, toState, toParams, fromState, fromParams) {

                //User.isInRoles({
                //    uid: LoopBackAuth.currentUserId,
                //    roleNames: ['$admin', '$redbullAdmin']
                //})
                //.$promise
                //.then(function (data) {
                //    if (data.isInRoles.$admin !== true && data.isInRoles.$redbullAdmin !== true) {
                //        event.preventDefault();
                //        $state.transitionTo('app.home');
                //    }
                //});

            });
        }
    ]
)
.value('moduleTpl', (tpl !== './') ? tpl + 'views/ads/client/views/' : 'dist/views/ads/client/views/')
.controller('tsAdCtrl', ['$scope', '$state', '$window', 'User', 'EventService', '$timeout', 'UserRoleService', 'LoopBackAuth',
    function ($scope, $state, $window, User, EventService, $timeout, UserRoleService, LoopBackAuth) {
        var url = 'https://pagead2.googlesyndication.com/pagead/show_ads.js';
        //var url = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js';
        //var window.googleAdsAlreadyLoaded = !!document.getElementById("adCode");
        var e = $(".ad");
        var r = UserRoleService.getRoles();
        var role = (!_.isUndefined(r)) ? r.$premium : undefined;
        //var role = true;
        var canShowAds = !!window.canshowads;

        if (!_.isNull(LoopBackAuth.currentUserData))
            $scope.user = LoopBackAuth.currentUserData.username;

        function loginPremiumCheck (user) {
            User.isInRoles({
                uid: user.id,
                roleNames: ['$premium']
            })
            .$promise
            .then(function (data) {
                var usrRoles = data.isInRoles;
                UserRoleService.setRoles(usrRoles);

                if(usrRoles.$premium) {
                    role = usrRoles.$premium;


                    return checkPremium();
                }
            })
        }

        function checkPremium () {
            if (User.isAuthenticated()) {
                var s = document.getElementById('adCode');
                var eLength = e.length;

                if (!role) {
                    $scope.showAds = true;
                    return doLoadAds();
                }

                if (window.googleAdsAlreadyLoaded && s !== null && s !== undefined) {
                    s.parentNode.removeChild(s);
                    window.googleAdsAlreadyLoaded = false;
                }

                for (var i = 0; i < eLength; i++) {
                    $(e[i]).remove();
                }

                $scope.showAds = false;
            } else {
                role = false;
                $scope.showAds = true;
                return doLoadAds();
            }
        }

        function doLoadAds () {
            $scope.adClient = $scope.adClient || "pub-5622157629772216";
            //$scope.adClient = $scope.adClient || "ca-pub-6273013980199815";
            $scope.adSlot = $scope.adSlot || "1810633479";
            //$scope.adSlot = $scope.adSlot || "7575226683";
            $scope.theme = $state.theme || 'default';
            $scope.region = $state.current.name;
            $scope.w = (!_.isUndefined($scope.w)) ? $scope.w : '728';
            $scope.h = (!_.isUndefined($scope.h)) ? $scope.h : '90';


            $timeout(function () {
                for (var i = 0; i < e.length; i++) {
                    $(e[i]).removeClass('hidden');
                }
            });
        }

        EventService.registerListener(EventService.EVENT_LOGIN, loginPremiumCheck);
        EventService.registerListener(EventService.EVENT_LOGOUT, checkPremium);
        checkPremium();
    }
])
.directive('ad', ['moduleTpl', '$timeout', '$window', function (moduleTpl, $timeout, $window) {
    return {
        restrict: 'E',
        replace: true,
        templateUrl: moduleTpl + 'directives/a.html',
        controller: ['$scope', function ($scope) {
            var adIter = 0;
            var adIterMax = 10;
            var canShowAds = !!window.canShowAds;

            if(!$window.adsbygoogle) {
                $window.adsbygoogle = [];
            }

            $scope.getCanShowAds = function () {
                return canShowAds;
            }

            //function pushAd () {
            //    $timeout(function () {
            //        if (adIter < adIterMax) {
            //
            //            $timeout(function () {
            //                try {
            //                    $window.adsbygoogle.push({});
            //                } catch (e) {
            //                    console.log();
            //                    adIter++;
            //                    return pushAd();
            //                }
            //            }, 500);
            //        } else {
            //            var parent = $scope.el[0].parentNode;
            //
            //            while (!!parent['parentNode']) {
            //                parent = parent['parentNode'];
            //            }
            //
            //            $(parent).remove();
            //        }
            //    }, 5000);
            //}
            //
            //pushAd();
        }],
        link: function (scope, el, attrs) {
            scope.el = el;
            scope.attrs = attrs

            var s = document.createElement('script');

            s.type = 'text/javascript';
            s.className = "ad-script-tag";
            s.text = "<!-- google_ad_client = \"ca-pub-5622157629772216\";" +
                " /* tempostorm */ google_ad_slot = \"5924728078\";" +
                // "google_adtest = on;" +
                " google_ad_width = " + scope.w + ";" +
                " google_ad_height = " + scope.h + ";" +
                " //-->";
            //s.async = true;
            document.body.appendChild(s);


            if (!!window.googleAdsAlreadyLoaded) {
                var tag = document.getElementById('adCode');
                tag.parentNode.removeChild(tag);
            }

            var w =  document.write;
            document.write = function (content) {
                el[0].innerHTML = content;

                document.write = w;
            }

            var x = document.createElement('script');
            x.type = 'text/javascript';
            x.id = "adCode";
            x.src = "//pagead2.googlesyndication.com/pagead/show_ads.js";
            //s.async = true;
            document.body.appendChild(x);

            window.googleAdsAlreadyLoaded = true;
            
            // $timeout(function () {
            //     if (attrs.adSlot === "7575226683") {
            //         $(el[0]).attr('data-ad-format', 'auto')
            //     }
            // })
        }
    }
}])
.directive('tsAd', ['moduleTpl', function (moduleTpl) {
    return {
        restrict: 'E',
        replace: true,
        scope : {
            adClient : '@',
            adSlot : '@',
            inlineStyle : '@',
            region: '@',
            structure: '@',
            theme: '@',
            h: '@', //height
            w: '@'  //width
        },
        templateUrl: function (scope, attrs) {
            //TODO: MAKE WORK WITH DIFFERENT NETWORKS OK
            var network = attrs.network || "adx";
            var tmp = attrs.structure || attrs.theme;
            
            return moduleTpl + network + '/a.' + tmp + '.html';
        },
        controller: 'tsAdCtrl'
    }
}])
;