angular.module('viradapp.controllers', [])
.controller('PalcoCtrl', function($rootScope, $scope, $stateParams, Virada, Conn){
    $scope.$on('$ionicView.beforeEnter', function(){
        $rootScope.curr = 'palco';
    });

    $scope.$on('$ionicView.beforeLeave', function(){
        $rootScope.curr = false;
    });

    if($stateParams.palco){
        Virada.getPalcoEvents($stateParams.palco)
        .then(function(data){
            $rootScope.palco = data;
            $scope.space = data;
            $scope.spaceEvents = data.events;
        });
    } else {
        // none selected
    }
})

.controller('AtracaoCtrl', function($rootScope, $scope, $stateParams, Virada, MinhaVirada, Date, $ionicModal, $state){
    $scope.$on('$ionicView.beforeEnter', function(){
        $rootScope.curr = 'atracao';
    });

    $scope.$on('$ionicView.beforeLeave', function(){
        $rootScope.curr = false;
    });

    $scope.view = {
        hasMore : false
    }

    $scope.LL = Date.LL;
    if($stateParams.atracao){
        Virada.get($stateParams.atracao)
        .then(function(data){
            $rootScope.atracao = data;
            $scope.atracao = data;
            $scope.space = data.space;
            if(data.allFriends){
                $scope.view.delta = data.allFriends.length - data.friends.length;
                $scope.view.hasMore = true;
            }
        });
    } else {
        $state.go("virada.programacao()")
    }

    $ionicModal.fromTemplateUrl('friends-modal.html', {
        scope: $scope,
        animation: 'slide-in-up'
    }).then(function(modal) {
        $scope.modal = modal;
    });

    $scope.openModal = function() {
        $scope.modal.show();
    };

    $scope.closeModal = function() {
        $scope.modal.hide();
    };

    $scope.$on('$destroy', function() {
        $scope.modal.remove();
    });

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
        loads: ionic.Platform.isIOS() ? 1500 : 150,
        A: new ListState(),
        L: new ListState(),
        H: new ListState()
    };
    var spaces = Lazy([]);
    var events = Lazy([]);

    $scope.filters = new Filter(config.start, config.end);
    $scope.view = {
        sorted : 'L'
    };
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
                $scope.view.sorted = 'A';
            }
            $rootScope.hasData = true;
            function setPosition (space){
                var position = {};
                if(typeof plugin !== 'undefined'){
                    position = new plugin.google.maps
                    .LatLng(space.data.location.latitude,
                            space.data.location.longitude);
                } else {
                    position = {
                        "lat" : space.data.location.latitude,
                        "lng" : space.data.location.longitude
                    }
                }
                space.map = {
                    "position" : position,
                    "title" : space.name,
                    visible: false
                };
            }
            Virada.getPalcos().then(function(spaces_data){
                var i = 0;
                var count = 0;
                var d = data.async(2).tap(function(space){
                    var spaceData = spaces_data.findWhere({
                        id : parseInt(space.id)
                    });

                    space.index = i;
                    space.data = spaceData;
                    if(typeof space.data !== 'undefined')
                        setPosition(space);
                    else
                        count++;
                    i++;
                }).toArray().onComplete(function(a){
                    $rootScope.lespaces = a;
                    spaces = Lazy(a);

                    Virada.events().then(function(data){
                        events = data;
                        if(data.length() == 0){ //Nothing to do!
                            $rootScope.hasData = false;
                            return;
                        }
                        sortBy($scope.view.sorted);
                    });

                    return Lazy(a);
                });

            });
        });
    }

    // First run! After that, all sequence processing is on
    // the loadMore and filterDate methods
    ionic.Platform.ready(function(){
        if($rootScope.ledata.length === 0) {
            init();
        }
    });

    function filtering(){
        var data = $filter('lefilter')(events, spaces, $scope.filters);
        config.A.filtered = data.sortBy(function(event){
            return event.name;
        });
        config.H.filtered = data.sortBy(function(event){
            return event.timestamp;
        });
        config.L.filtered = Lazy($filter('toSpaces')(data, spaces));
    }

    /**
     * Sorted by
     */
    $rootScope.change = function(item){
        sortBy(item.view.sorted);
    }

    function sortBy(sorted){
        switch (sorted){
            case "A":
                $scope.filters.sorted = "A";
                // $rootScope.ledata = config.A.filtered.toArray();
                if(config.A.data.length > 0){
                    $rootScope.ledata = config.A.data;
                } else {
                    filtering();
                    $rootScope.ledata = [];
                }

            break;
            case "L":
                $scope.filters.sorted = "L";
                // $rootScope.ledata = config.L.filtered.toArray();
                if(config.L.data.length > 0){
                    $rootScope.ledata = config.L.data;
                } else {
                    filtering();
                    $rootScope.ledata = [];
                }
            break;
            case "H":
                $scope.filters.sorted = "H";
                // $rootScope.ledata = config.L.filtered.toArray();
                if(config.H.data.length > 0){
                    $rootScope.ledata = config.H.data;
                } else {
                    filtering();
                    $rootScope.ledata = [];
                }
            break;
        }
    };

    $rootScope.clearFilters = function(){
        $scope.filters = new Filter(config.start, config.end);
        $scope.view.sorted = $scope.filters.sorted;

        watchHandler();
    }


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

        config.H.page = 1;
        config.H.data = config.H.filtered.take(config.loads).toArray();
        config.H.loaded = config.H.page*config.loads;


        config.A.page = 1;
        config.A.data = config.A.filtered.take(config.loads).toArray();
        config.A.loaded = config.A.page*config.loads;

        switch($scope.filters.sorted){
            case "L":
                // $rootScope.ledata = config.L.filtered.toArray();
                $rootScope.ledata = config.L.data;
            break;
            case "A":
                // $rootScope.ledata = config.A.filtered.toArray();
                $rootScope.ledata = config.A.data;
            break;
            case "H":
                // $rootScope.ledata = config.A.filtered.toArray();
                $rootScope.ledata = config.H.data;
            break;
        }

    }

    $rootScope.loadMore  = function(){
        switch ($scope.filters.sorted) {
            case "A":
                if(typeof config.A.filtered == 'undefined') return false;
                config.A.page++;
                var d = config.A.filtered
                        .drop(config.A.loaded)
                        .take(config.loads).toArray();

                config.A.loaded = config.A.page*config.loads;
                $rootScope.ledata.push.apply($rootScope.ledata, d);
                config.A.data = $rootScope.ledata;
                console.log("Loaded events: "  + config.A.loaded);
            break;
            case "L":
                if(typeof config.L.filtered == 'undefined') return false;
                config.L.page++;
                d = config.L.filtered
                    .drop(config.L.loaded)
                    .take(config.loads).toArray();

                config.L.loaded = config.L.page*config.loads;
                $rootScope.ledata.push.apply($rootScope.ledata, d);
                config.L.data = $rootScope.ledata;
                console.log("Loaded spaces: " + config.L.loaded);
            break;
            case "H":
                if(typeof config.H.filtered == 'undefined') return false;
                config.H.page++;
                d = config.H.filtered
                    .drop(config.H.loaded)
                    .take(config.loads).toArray();

                config.H.loaded = config.H.page*config.loads;
                $rootScope.ledata.push.apply($rootScope.ledata, d);
                config.H.data = $rootScope.ledata;
                console.log("Loaded spaces: " + config.H.loaded);
            break;

        }
        setTimeout(function(){
            $rootScope.$broadcast('scroll.infiniteScrollComplete');
        }, 500);
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
            case "H":
                if(typeof config.H.filtered !== 'undefined'){
                    allShown = config.H.loaded >= config.H.filtered.size();
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
.controller('ProgramacaoCtrl', function($rootScope, $scope, Virada, MinhaVirada, $localStorage) {

    $scope.$on('$ionicView.beforeEnter', function(){
        $rootScope.programacao = true;
    });

    $scope.$on('$ionicView.beforeLeave', function(){
        // console.log(config);
        $rootScope.programacao = false;
    });

    $rootScope.$on('user_data_loaded', function(ev, user) {
        Virada.events().then(function(events){
            if (user.events && user.events.length > 0) {
                MinhaVirada.getFriendsOnEvents().then(function(friendsOnEvents){
                    if(!friendsOnEvents){
                        $rootScope.connected = false;
                        return false;
                    }
                    Lazy(user.events).tap(function(id){
                        var event = events.findWhere({id : id});
                        if(typeof event !== 'undefined'){
                            event.in_minha_virada = true;
                            if(typeof friendsOnEvents[id] !== 'undefined'){
                                var f = Lazy(friendsOnEvents[id]);
                                event.allFriends = f.toArray();
                                event.friends = f.take(5).toArray();
                            }

                        }
                    }).each(Lazy.noop);
                })
            };
        });
    });

})
.controller('SocialCtrl', function($scope, $rootScope, Virada, MinhaVirada, MapState, $state, $ionicPopup, $localStorage, $ionicModal, $timeout, GlobalConfiguration) {
    ionic.Platform.ready(function () {
        if($localStorage.hasOwnProperty('mapOptions') === true){
            $scope.view = $localStorage.mapOptions;
        } else {
            $scope.view = {
                sendPosition : false,
                options : {
                    friends: false ,
                    palcos: true ,
                    services: false
                }
            };
            $localStorage.mapOptions = $scope.view;
        }
        var map;
        $scope.$on('$ionicView.beforeEnter', function(){
            angular.element(document.querySelector("#left-menu")).addClass('hidden');
            angular.element(document.querySelector("#right-menu")).addClass('hidden');

            if(typeof map === 'undefined' && typeof plugin !== 'undefined')
                $timeout(init, 500);
        });

        $scope.$on('$ionicView.beforeLeave', function(){
            angular.element(document.querySelector("#left-menu")).removeClass('hidden');
            angular.element(document.querySelector("#right-menu")).removeClass('hidden');
        });


        $rootScope.$on('sidemenu_toggle', function(ev, isOpen){
            if(typeof map !== 'undefined' && typeof plugin !== 'undefined' ){
                if(isOpen){
                    map.setClickable(false);
                } else {
                    map.setClickable(true);
                }
            }
        });

        var spaces = [];
        var services = [];
        var servicesNames = [
            "wifi",
            "alimentacao",
            "postos",
            "banheiros",
            "ambulancia_uti",
            "ambulancia"
        ];
        if(typeof plugin !== 'undefined'){
            var center = new plugin.google.maps.LatLng(-23.5408, -46.6356);
            var mapState = new MapState(plugin.google.maps.MapTypeId.ROADMAP, center);
        }
        function getMyLocation (location){
            return MinhaVirada.updateLocation(location);
        }

        function init(){
            var w = angular.element(document.querySelector("#map-wrapper"));
            $scope.frameHeight = w[0].clientHeight;
            var div = document.getElementById("map_canvas");

            if(typeof plugin !== 'undefined'){
                // Initialize the map view
                map = plugin.google.maps.Map.getMap(div, mapState.options);

                map.setClickable(true);

                // Wait until the map is ready status.
                map.addEventListener(plugin.google.maps.event.MAP_READY,
                                     function(){$timeout(onMapReady, 500);});

                map.addEventListener(plugin.google.maps.event.CAMERA_CHANGE,
                                                          onCameraChange);
            }
            spaces = $rootScope.lespaces;

            function onMapReady() {
                if($scope.view.sendPosition){
                    map.getMyLocation(getMyLocation);
                }
                Lazy(spaces).async(2).tap(function(space){
                    if(typeof space.data !== 'undefined'){
                        map.addMarker(space.map, function(marker){
                            space.marker = marker;
                            marker.addEventListener(
                                plugin.google.maps.event.MARKER_CLICK,
                                function(){
                                    marker.hideInfoWindow();
                                    map.setClickable(false);
                                    $scope.showConfirm(space);
                                });
                        });
                    }
                }).toArray()
                .then(function(){
                    map.getVisibleRegion(function(latLngBounds) {
                        showPalcos(latLngBounds);
                    });
                });

                Lazy(servicesNames).each(function(name){
                    MinhaVirada.getService(name).then(function(data){
                        if(data){
                            $scope.$emit("service_loaded", { data: data, name: name });
                        }
                    });
                });

                $scope.$on('service_loaded', function(ev, data){
                    var name = data.name;
                    var features = data.data.features;

                    Lazy(features).async(2).tap(function(feature){
                        var iconName = GlobalConfiguration.SOCIAL_API_URL
                        + "/map/icons/" + name + ".png";
                        feature.map = {
                            'title' : feature.properties.name,
                            icon: iconName,
                            visible: false,
                            position: new plugin.google.maps.LatLng(
                                feature.geometry.coordinates[1].toFixed(5),
                                feature.geometry.coordinates[0].toFixed(5)),
                        }

                        map.addMarker(feature.map, function(marker){
                            feature.marker = marker;
                            marker.addEventListener(
                                plugin.google.maps.event.MARKER_CLICK,
                                function(marker){
                                    marker.showInfoWindow();
                                });
                        });
                    }).toArray()
                    .then(function(data){
                        services.push.apply(services, features);
                        map.getVisibleRegion(function(latLngBounds) {
                            showServices(latLngBounds);
                        });
                    });
                });

                if(MinhaVirada.hasUser()){
                    MinhaVirada.getFriends().then(function(data){
                        if(data){
                            Lazy(data).async(2).tap(function(friend){
                                if(friend.lat && friend.long){
                                    friend.map = {
                                        position: new plugin.google.maps.LatLng(
                                            friend.lat,
                                            friend.long),
                                        'title': friend.name,
                                    };
                                    map.addMarker(friend.map, function(marker){
                                        marker.setIcon({
                                            'url': friend.picture,
                                            'size': {
                                                width: 50,
                                                height: 50
                                            }
                                        });
                                        friend.marker = marker;
                                        marker.addEventListener(
                                            plugin.google.maps.event.MARKER_CLICK,
                                            function(marker){
                                                marker.showInfoWindow();
                                            });
                                    });
                                    friends.push(friend);
                                }
                            }).toArray()
                            .then(function(data){
                                map.getVisibleRegion(function(latLngBounds) {
                                    showFriends(latLngBounds);
                                });
                            });
                        }
                    });
                }
            }

            function onCameraChange(){
                map.getVisibleRegion(function(latLngBounds) {
                    showPalcos(latLngBounds);
                    showFriends(latLngBounds);
                    showServices(latLngBounds);
                });
            }

        }

        function showPalcos (latLngBounds){
            for(var i = 0; i < spaces.length; i++){
                space = spaces[i];

                if(typeof space.data !== 'undefined' && typeof space.marker !== 'undefined'){
                    var isContained = latLngBounds.contains(space.map.position);
                    if(isContained && $scope.view.options.palcos){
                        if(!space.marker.isVisible()){
                            space.marker.setVisible(true);
                        }
                    } else {
                        if(typeof space.marker !== 'undefined'){
                            space.marker.setVisible(false);
                        }
                    }
                }
            }
        }

        function showServices (latLngBounds){
            for(var i = 0; i < services.length; i++){
                var service = services[i];

                var isContained = latLngBounds.contains(service.map.position);
                if(isContained && $scope.view.options.services){
                    if(!service.marker.isVisible()){
                        service.marker.setVisible(true);
                    }
                } else {
                    if(typeof service.marker !== 'undefined'){
                        service.marker.setVisible(false);
                    }
                }
            }
        }


        function showFriends (latLngBounds){
            for(var i = 0; i < friends.length; i++){
                var friend = friends[i];

                var isContained = latLngBounds.contains(friend.map.position);
                if(isContained && $scope.view.options.friends){
                    if(!friend.marker.isVisible()){
                        friend.marker.setVisible(true);
                    }
                } else {
                    if(typeof friend.marker !== 'undefined'){
                        friend.marker.setVisible(false);
                    }
                }
            }
        }

        $scope.showConfirm = function(space) {
            var end = "";
            if(typeof space.endereco !== "undefined"){
                end = space.endereco;
            }
            var confirmPopup = $ionicPopup.confirm({
                title: space.name,
                template:
                    '<p>' + end.substring(0, 100)  + '</p>'
                    + '<p>' + space.events.length + ' eventos nesse local!</p>'
                    + '<p>Ver a programação completa?</p>',
                buttons: [
                    { text: 'Voltar' },
                    {
                        text: '<b>Ver palco</b>',
                        type: 'button-assertive',
                        onTap: function (){return true;}
                    }
                ]
            });
            confirmPopup.then(function(res) {
                if(res) {
                    $state.go('virada.palco-detail',
                              {palco : space.id});
                    map.setClickable(true);
                } else {
                    map.setClickable(true);
                }
            });
        };

        var friends = [];

        $ionicModal.fromTemplateUrl('map-config-modal.html', {
            scope: $scope,
            animation: 'slide-in-up'
        }).then(function(modal) {
            $scope.modal = modal;
        });

        $scope.openModal = function() {
            if(typeof map !== 'undefined'){
                map.setClickable(false);
            }
            $scope.modal.show();
        };

        $scope.closeModal = function() {
            if(typeof map !== 'undefined'){
                map.setClickable(true);
                map.getVisibleRegion(function(latLngBounds){
                    showPalcos(latLngBounds);
                    showFriends(latLngBounds);
                    showServices(latLngBounds);
                });
            }

            $scope.modal.hide();
        };

    });
})
.controller('MinhaViradaCtrl', function($rootScope, $scope, $http, $location, $timeout, Virada, MinhaVirada, GlobalConfiguration, $localStorage, $ionicLoading, Date){
    $scope.view = {
        hasMessage : false
    };

    $scope.logout = function(){
        MinhaVirada.logout();
    }

    $rootScope.$on('logged_out', function(ev){
        console.log($localStorage);
    });


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
    $scope.terms_accepted = false;

    $scope.accept_terms = function() {
        $scope.terms_accepted = true;
    }

    // Test if user has a token
    // if true try to get data
    //     if it fails, try to login again to get another token
    // if false, emit initialized and show the button
    if($localStorage.hasOwnProperty("accessToken") === false) {
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
        showMessage("Não foi possível conectar");
    });

    $rootScope.$on('data_not_loaded', function(ev) {
        showMessage("Não foi possivel carregar os dados");
    });

    var showMessage = function(message){
        $scope.message = message;
        $scope.view.hasMessage = true;
        $timeout(function(){
            $scope.view.hasMessage = false;
            $scope.message = "";
        }, 3000)
    }


    $rootScope.$on('user_data_saved', function(ev){
        updateUserInfo($localStorage.user);
    });

    function updateUserInfo(user){
        if(typeof user.events === 'undefined'){
            user.events = [];
        }
        if(user.events.length !== $scope.events.length){
            // Events array has changed
            // $scope.events = [];
            fillEvents(user);
        }
    }
    function fillEvents(user){
        Virada.events().then(function(events){
            if (user.events && user.events.length > 0) {
                $scope.hasEvents = true;
                MinhaVirada.getFriendsOnEvents().then(function(friendsOnEvents){
                    newevents = [];
                    Lazy(user.events).tap(function(id){
                        var event = events.findWhere({id : id});
                        if(typeof event !== 'undefined'){
                            event.in_minha_virada = true;
                            if(typeof friendsOnEvents[id] !== 'undefined'){
                                var f = Lazy(friendsOnEvents[id]);
                                event.allFriends = f.toArray();
                                event.friends = f.take(5).toArray();
                            }
                            newevents.push(event);
                        }
                    }).each(Lazy.noop);
                    $scope.events = Lazy(newevents).sortBy(function(event){
                        if(typeof event !== 'undefined'){
                            return event.timestamp;
                        } else {
                            return false;
                        }
                    }).toArray();

                })
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
            if(userData){
                $localStorage.user = userData;
                $rootScope.connected = $localStorage.hasOwnProperty("accessToken") === true;
            }
        });
    }

    $rootScope.$on('fb_connected', function(ev, data) {
        $rootScope.connected = true;
    });

    $rootScope.minha_virada = function(event){
        // Toogle event.in_minha_virada.
        eventId = event.id
        if($localStorage.hasOwnProperty("accessToken") === false ||
           $localStorage.hasOwnProperty("uid") === false) {
            MinhaVirada.connect();
        } else {
            if(!MinhaVirada.hasUser()){
                MinhaVirada
                .init($localStorage.accessToken, $localStorage.uid)
                .then(function(connected){
                    if(connected){
                        event.in_minha_virada =  MinhaVirada.toogle(eventId);
                    } else {
                        MinhaVirada.connect().then(function(data){
                            if(data){
                                event.in_minha_virada =
                                    MinhaVirada.toogle(eventId);
                            }
                        });
                    }
                });
            } else {
                event.in_minha_virada = MinhaVirada.toogle(eventId);
            }
        }
    }

    $rootScope.is_in_minha_virada = function(eventId){
        return MinhaVirada.hasEvent(eventId);
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
