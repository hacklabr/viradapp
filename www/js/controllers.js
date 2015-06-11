angular.module('viradapp.controllers', [])
.controller('PalcoCtrl', function($rootScope, $scope, $stateParams, Virada, Conn){
    $scope.$on('$ionicView.beforeEnter', function(){
        $rootScope.curr = 'palco';
    });

    $scope.$on('$ionicView.beforeLeave', function(){
        $rootScope.curr = false;
    });

    if($stateParams.palco){
        Virada.getPalco($stateParams.palco)
        .then(function(data){
            $rootScope.palco = data;
            $scope.space = data;
            $scope.spaceEvents = data.events;
        });
    } else {
        // none selected
    }
})

.controller('AtracaoCtrl', function($rootScope, $scope, $stateParams, Virada, MinhaVirada, Date){
    $scope.$on('$ionicView.beforeEnter', function(){
        $rootScope.curr = 'atracao';
    });

    $scope.$on('$ionicView.beforeLeave', function(){
        $rootScope.curr = false;
    });

    $scope.LL = Date.LL;
    if($stateParams.atracao){
        Virada.get($stateParams.atracao)
        .then(function(data){
            $rootScope.atracao = data;
            $scope.atracao = data;
            $scope.space = data.space;
        });
    } else {
    }
})
.controller('ButtonsCtrl', function($scope, $ionicSideMenuDelegate, $rootScope, Virada, MinhaVirada, $ionicGesture){
    ionic.Platform.ready(function(){
        $ionicGesture.on('swiperight', function(){

        }, angular.element(document.querySelector("#menu-view")), {});


        $scope.$watch(function(){
            return $ionicSideMenuDelegate.isOpenLeft();
        }, function(isOpen){
            var leftMenu = angular.element(document.querySelector("#left-menu"));
            if(isOpen){
                leftMenu.removeClass('hidden');
            } else {
                leftMenu.addClass('hidden');
            }
            $rootScope.$emit("sidemenu_toggle", isOpen);
        });
        $scope.toggleLeftSideMenu = function() {
            $ionicSideMenuDelegate.toggleLeft();
        }
    });
})
.controller('FilterCtrl', function($rootScope, $scope, $stateParams, $filter, Programacao, Virada, $ionicModal, $timeout, $ionicSideMenuDelegate, Date, Filter, ListState) {
    var config = {
        duration : Date.oneDay(),
        start: Date.start(),
        end: Date.end(),
        loads: 5,
        A: new ListState(),
        L: new ListState(),
        H: new ListState()
    };
    var spaces;
    var events;

    $scope.filters = new Filter(config.start, config.end);
    $scope.sorted = 'L';
    $rootScope.ledata = [];

    /**
     * Init data, once initialized we have the following structures:
     * spaces as a Lazy.js sequence
     * events as a Lazy.js sequence
     *
     */
    function init (){
        Virada.spaces().then(function(data){
            if(data.length() == 0) {
                $scope.sorted = 'A';
            }
            $rootScope.hasData = true;
            i = 0;
            data.async(2).tap(function(space){
                space.index = i;
                i++;
            }).toArray().then(function(a){
                $rootScope.lespaces = a;
                spaces = Lazy(a);

                Virada.events().then(function(data){
                    events = data;
                    if(data.length() == 0){ //Nothing to do!
                        $rootScope.hasData = false;
                        return;
                    }
                    sortBy($scope.sorted);
                });

                return Lazy(a);
            });

        });
    }

    // First run! After that, all sequence processing is on
    // the loadMore and filterDate methods
    if($rootScope.ledata.length === 0) {
        init();
    }

    function filtering(){
        var data = $filter('lefilter')(events, spaces, $scope.filters);
        config.A.filtered = data.sortBy(function(event){
            return event.name;
        });
        config.L.filtered = Lazy($filter('toSpaces')(data)).sortBy('index');
    }

    /**
     * Sorted by
     */
    $rootScope.change = function(item){
        sortBy(item.sorted);
    }

    function sortBy(sorted){
        switch (sorted){
            case "A":
                $scope.filters.sorted = "A";
                if(config.A.data.length > 0){
                    $rootScope.ledata = config.A.data;
                } else {
                    filtering();
                    $rootScope.ledata = [];
                }
            break;
            case "L":
                $scope.filters.sorted = "L";
                if(config.L.data.length > 0){
                    $rootScope.ledata = config.L.data;
                } else {
                    filtering();
                    $rootScope.ledata = [];
                }
            break;
            case "H":
                console.log("Filter Time");
            break;
        }
    };

    /**
     * Watch filters
     */

    var TIMEOUT_DELAY = 200;

    $scope.$watch('filters.query', function(newValue, oldValue){
        if(newValue !== oldValue){
            $timeout(watchHandler, TIMEOUT_DELAY);
        }
    }, true);

    function watchHandler(){
        filtering();

        config.L.page = 1;
        config.L.data = config.L.filtered.take(config.loads).toArray();
        config.L.loaded = config.L.page*config.loads;

        config.A.page = 1;
        config.A.data =  [{
            events: config.A.filtered.take(config.loads).toArray()
        }];
        config.A.loaded = config.L.page*config.loads;

        switch($scope.filters.sorted){
            case "L":
                $rootScope.ledata = config.L.data;
            break;
            case "A":
                $rootScope.ledata = config.A.data;

            break;
        }

    }

    $rootScope.loadMore  = function(){
        switch ($scope.filters.sorted) {
            case "A":
                if(typeof config.A.filtered == 'undefined') return false;
                config.A.page++;
                var d = config.A.filtered.drop(config.A.loaded)
                    .take(config.loads).toArray();

                if($rootScope.ledata.length == 0){
                    $rootScope.ledata[0] = {events : []}
                }

                config.A.loaded = config.A.page*config.loads;
                $rootScope.ledata[0].events.push
                    .apply($rootScope.ledata[0].events, d);

                config.A.data = $rootScope.ledata;
                console.log("Loaded events: "  + config.A.loaded);
            break;
            case "L":
                if(typeof config.L.filtered == 'undefined') return false;
                config.L.page++;
                d = config.L.filtered
                    .drop(config.L.loaded)
                    .take(config.loads)
                    .tap(function(space){
                        space.events = events.where({
                            spaceId : parseInt(space.id, 10)
                        }).toArray();
                    });

                d = d.toArray();

                config.L.loaded = config.L.page*config.loads;
                $rootScope.ledata.push.apply($rootScope.ledata, d);
                config.L.data = $rootScope.ledata;
                console.log("Loaded spaces: " + config.L.loaded);
            break;
        }
        setTimeout(function(){
            $rootScope.$broadcast('scroll.infiniteScrollComplete');
        }, 1000);
    };

    $rootScope.canLoad = function(){
        var allShown = false;
        switch($scope.filters.sorted){
            case "A":
                if(typeof config.A.filtered !== 'undefined'){
                    allShown = config.A.loaded >= config.A.filtered.size();
                } else {
                    return false;
                }
            break;
            case "L":
                if(typeof config.L.filtered !== 'undefined'){
                    allShown = config.L.loaded >= config.L.filtered.size();
                } else {
                    return false;
                }

            break;
        }

        $rootScope.$broadcast('scroll.infiniteScrollComplete');
        return typeof spaces !== 'undefined'
            && typeof events !== 'undefined'
            && !allShown;
    };

    $ionicModal.fromTemplateUrl('places.html', {
        scope: $scope,
        animation: 'slide-in-up'
    }).then(function(modal) {
        $scope.modal = modal;
    });

    $scope.resetSearch = function() {
        $scope.filters.places.query = '';
    };

    $scope.openModal = function() {
        $scope.modal.show();
    };

    $scope.closeModal = function() {
        $scope.modal.hide();
    };

    $scope.$on('$destroy', function() {
        $scope.modal.remove();
    });

    $scope.$on('modal.hidden', function() {
        // Show button if places are chosen
        watchHandler();
    });

    $scope.changed = function(id) {
        var space = $scope.lespaces[id];
        if(space.checked == true){
            $scope.filters.places.data.push($scope.lespaces[id].id);
        } else {
            var i = $scope.filters.places.data.indexOf(space.id);
            if(i >= 0) $scope.filters.places.data.splice(i, 1);
        }
    }

    $scope.$on('$stateChangeSuccess', function() {
        //$scope.loadMore();
    });
})
.controller('ProgramacaoCtrl', function($rootScope, $scope, MinhaVirada, $localStorage) {

    $scope.$on('$ionicView.beforeEnter', function(){
        $rootScope.programacao = true;
    });

    $scope.$on('$ionicView.beforeLeave', function(){
        $rootScope.programacao = false;
    });
})
.controller('SocialCtrl', function($scope, $rootScope, Virada, MinhaVirada) {
    ionic.Platform.ready(function () {
        var map;
        $scope.$on('$ionicView.beforeEnter', function(){
            angular.element(document.querySelector("#left-menu")).addClass('hidden');
            angular.element(document.querySelector("#right-menu")).addClass('hidden');
        });

        $scope.$on('$ionicView.beforeLeave', function(){
            angular.element(document.querySelector("#left-menu")).removeClass('hidden');
            angular.element(document.querySelector("#right-menu")).removeClass('hidden');
            // Save instance and destroy
            // map.remove();
        });

        $rootScope.$on('sidemenu_toggle', function(ev, isOpen){
            if(typeof map !== 'undefined' ){
                if(isOpen){
                    map.setClickable(false);
                } else {
                    map.setClickable(true);
                }
            }
        });

        var w = angular.element(document.querySelector("#map-wrapper"));
        $scope.frameHeight = w[0].clientHeight;
        var div = document.getElementById("map_canvas");

        if(typeof plugin !== 'undefined'){
            // Initialize the map view
            map = plugin.google.maps.Map.getMap(div);

            map.setClickable(true);

            // Wait until the map is ready status.
            map.addEventListener(plugin.google.maps.event.MAP_READY, onMapReady);
        }

        function onMapReady() {
        }

        function onBtnClicked() {
        }
    });
})
.controller('MinhaViradaCtrl', function($rootScope, $scope, $http, $location, $timeout, Virada, MinhaVirada, GlobalConfiguration, $localStorage, $ionicLoading, Date){
    $scope.$on('$ionicView.beforeEnter', function(){
        $rootScope.curr = 'minha_virada';
    });

    $scope.$on('$ionicView.beforeLeave', function(){
        $rootScope.curr = false;
    });

    $ionicLoading.show({
        noBackdrop: true,
        duration: 20000,
        template: '<ion-spinner icon="ripple"></ion-spinner>'
    });
    $rootScope.$on('initialized', function(ev, uid){
        $ionicLoading.hide();
        $scope.initialized = true;
    });


    $scope.initialized = false;
    $scope.hasEvents = false;
    $scope.events = [];
    $scope.connected = false;

    // Test if user has a token
    // if true try to get data
    //     if it fails, try to login again to get another token
    // if false, emit initialized and show the button
    if($localStorage.hasOwnProperty("accessToken") === false) {
        console.log("have access token?");
        $rootScope.$emit('initialized');
    } else {
        // Test if token is valid
        MinhaVirada.init($localStorage.accessToken, $localStorage.uid)
        .then(function(data){
            if(!data){
                $rootScope.$emit('initialized');
            }
        });
    }

    $scope.login = function(){
        MinhaVirada.connect();
    }

    $rootScope.$on('fb_app_connected', function(ev, userData) {
        $scope.connected = true;
        $scope.accessToken = $localStorage.accessToken;
        if(userData) populateUserInfo(userData);
    });

    $rootScope.$on('fb_not_connected', function(ev, uid) {
        $scope.message = "Não foi possível conectar";
        console.log("Não conectado");
    });

    $rootScope.$on('data_not_loaded', function(ev) {
        $scope.message = "Não foi possível carregar seus dados";
        console.log("Não foi possivel carregar os dados");
    });

    $rootScope.$on('user_data_saved', function(ev){
        $scope.message = "dados salvos!";
        updateUserInfo($localStorage.user);
    });

    function updateUserInfo(user){
        if(typeof $scope.events === 'undefined'){
            $scope.events = [];
        }
        if(typeof user.events === 'undefined'){
            user.events = [];
        }
        if(user.events.length !== $scope.events.length){
            // Events array has changed
            $scope.events = [];
            fillEvents(user);
        }
    }

    function fillEvents(data){
        Virada.events().then(function(events){
            if (data.events && data.events.length > 0) {
                $scope.hasEvents = true;
                Lazy(data.events).sortBy(function(id){
                    var event = events.findWhere({id : id});
                    return Date.timestamp(event.startsOn+event.startsAt);
                }).tap(function(id){
                    var event = events.findWhere({id : id});
                    if(typeof event !== 'undefined'){
                        $scope.events.push(event);
                    }
                }).each(Lazy.noop);

            };
        });
    }

    function populateUserInfo (data) {
        if ( typeof(data.picture) !== 'undefined' ) {
            $scope.user_picture = data.picture;
            $scope.user_name = data.name;
        }
        fillEvents(data);
    }
})
.controller('AppCtrl', function($scope, $rootScope, $localStorage, MinhaVirada, $ionicHistory, $cordovaSocialSharing, GlobalConfiguration){
    $scope.anon = true;
    if($localStorage.uid){
        $scope.anon = false;
        MinhaVirada.loadUserData($localStorage.uid).then(function(userData){
            // Here I have a user data is he/she has lots of stuff
            // Or a dummy userData, if the user has no data yet (first login)
            $localStorage.user = userData;
        });
    }

    $rootScope.$on('fb_connected', function(ev, data) {
        $rootScope.connected = true;

        if($localStorage.accessToken !== data.token){
            $localStorage.accessToken = data.token;

            // But still could be another user or another token, test it
            if($localStorage.uid !== data.uid){
                // Is another user, time to throw data out
                $localStorage.uid = data.uid;
                $scope.anon = false;
                delete $localStorage.user;
            }
        }
        MinhaVirada.loadUserData($localStorage.uid)
        .then(function(userData){
            $localStorage.user = userData;
            $rootScope.$emit('fb_app_connected', userData);
        });
    });

    $rootScope.minha_virada = function(eventId){
        if($localStorage.hasOwnProperty("accessToken") === false ||
           $localStorage.hasOwnProperty("uid") === false) {
            MinhaVirada.connect();
        } else {
            if(typeof $localStorage.user !== 'undefined'
               && !MinhaVirada.hasUser()){
                   MinhaVirada.init($localStorage.accessToken, $localStorage.uid)
                   .then(function(){
                       MinhaVirada.add(eventId);
                   });
            } else {
                MinhaVirada.add(eventId);
            }
        }
    }


    $scope.shareButtons = ['palco', 'atracao', 'minha_virada'];

    $scope.share = function(b){
        var subject = "Virada Cultural 2015!";
        var message = "";
        var link = GlobalConfiguration.SHARE_URL;
        switch (b){
            case 'palco':
                message = "Venha conferir as atrações do Palco "
                    + $rootScope.palco.name;
                link = link + "/programacao/local/##" + $rootScope.palco.id;
                break;
            case 'atracao':
                message = "Venha conferir a atração "
                    + $rootScope.atracao.name;
                link = link + "/programacao/atracao/##" + $rootScope.atracao.id;
                break;
            case 'minha_virada':
                message = "Venha conferir a Minha Virada ";
                link = link + "/minha-virada/##" + $localStorage.uid;
                break;
        }

        $cordovaSocialSharing.share(message, subject, null, link)
        .then(function(result) {
            // Success!
        }, function(err) {
            // An error occured. Show a message to the user
        });
    }

    $scope.showMe = function(b){
        return b === $rootScope.curr;
    }

});
