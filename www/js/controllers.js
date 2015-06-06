angular.module('viradapp.controllers', [])
.controller('PalcoCtrl', function($scope, $stateParams, Virada, Conn){
    if($stateParams.palco){
        Virada.getPalco($stateParams.palco)
        .then(function(data){
            $scope.space = data;
            $scope.spaceEvents = data.events;
        });
    } else {
        // none selected
    }
})

.controller('AtracaoCtrl', function($scope, $stateParams, Virada, MinhaVirada, Date){
    $scope.LL = Date.LL;
    if($stateParams.atracao){
        Virada.get($stateParams.atracao)
        .then(function(data){
            $scope.atracao = data;
            $scope.space = data.space;
        });
    } else {
    }
})

.controller('FilterCtrl', function($rootScope, $scope, $stateParams, Virada, $ionicModal, $timeout, $ionicScrollDelegate) {

    var config = {
        duration :  moment.duration(1, 'days'),
        start: moment("201405170000", "YYYYMMDDhhmm"),
        end: moment("201405182359", "YYYYMMDDhhmm"),
        loads: 5,
        A: {
            loaded : 0,
            page : 0,
            data : []
        },
        L: {
            loaded : 0,
            page : 0,
            data : []
        },
        H: {
            loaded : 0,
            page : 0,
            data : []
        },
    };
    $scope.filters = {
        query: '',
        sorted: 'L',
        places: {
            data: [],
            query: ''
        },
        starting: config.start.format('x'),
        ending: config.end.format('x'),
        nearest: false
    };

    $scope.sorted = 'L';
    var spaces;
    var events;

    $rootScope.ledata = [];

    /**
     * Init data, once initialized we have the following structures:
     * spaces as a Lazy.js sequence
     * events as a Lazy.js sequence
     * $rootScope.ledata first data
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
        var lefilter = function (event){
            var hasSpace = false;
            var space = spaces.findWhere({
                id: event.spaceId.toString()
            });
            if(typeof space !== 'undefined'){
                if($scope.filters.places.data.length > 0){
                    // If the places array is not empty,
                    // test if the event belongs to one of the places
                    if(!Lazy($scope.filters.places.data).contains(space.id)){
                        return false;
                    }
                }

                var lm = new RegExp(($scope.filters.query), 'ig');
                hasSpace = lm.test(space.name.substring($scope.filters.query));

                event.spaceData = space;
            }
            var date = moment(event.startsOn + " " + event.startsAt,
                          "YYYY-MM-DD hh:mm").format('x');

            return (date <= $scope.filters.ending
                    && date >= $scope.filters.starting)
                    && (event.name.indexOf($scope.filters.query) >= 0
                        || hasSpace);
        };

        var currSpaces = [];
        var toSpaces = function(event){
            if(typeof event.spaceData !== 'undefined'){
                var curr = Lazy(currSpaces)
                    .findWhere({id : event.spaceData.id});
                if(typeof curr !== 'undefined'){
                    delete event.spaceData;
                    curr.events.push(event);
                } else {
                    curr = event.spaceData;
                    curr.events = [];
                    curr.events.push(event);
                    currSpaces.push(curr);
                }

            }
            return true;
        };

        var thename = function(event){
            return event.name;
        }

        var data;
        data = events.filter(lefilter);
        config.A.filtered = data.sortBy(thename);

        data.each(toSpaces);
        config.L.filtered = Lazy(currSpaces).sortBy('index');
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

    var TIMEOUT_DELAY = 2000;

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
.filter('searchPlaces', function(){
  return function (items, query) {
    if(typeof items === 'undefined') return;
    var filtered = [];
    var letterMatch = new RegExp((query), 'ig');
    for (var i = 0; i < items.length; i++) {
      var item = items[i];
      if (query) {
        if (letterMatch.test(item.name.substring(query.length))) {
          filtered.push(item);
        }
      } else {
        filtered.push(item);
      }
    }
    return filtered;
  };
})
.controller('ProgramacaoCtrl', function($rootScope, $scope, Virada, $ionicModal) {
    $scope.$on('$ionicView.beforeEnter', function(){
        $rootScope.programacao = true;
    });

    $scope.$on('$ionicView.beforeLeave', function(){
        $rootScope.programacao = false;
    });
})
.controller('SocialCtrl', function($scope) {
    $scope.settings = {
        enableFriends: true
    };
})
.controller('MinhaViradaCtrl', function($rootScope, $scope, $http, $location, $timeout, Virada, MinhaVirada, GlobalConfiguration, $localStorage, $ionicLoading){
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
    $scope.user_picture = '';

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
                MinhaVirada.connect();
            }
        });
    }


    $scope.login = function(){
        MinhaVirada.connect();
    }


    $rootScope.$on('fb_connected', function(ev, data) {
        $scope.connected = true;
        $scope.home = false;

        $localStorage.accessToken = data.token;
        $localStorage.uid = data.uid;
        console.log($localStorage);

        $scope.accessToken = $localStorage.accessToken;

        if ($location.$$hash) {
            if ($location.$$hash == data.uid) {
                $scope.itsme = true;
                MinhaVirada.inMyPage(true);
            }
            return;
        }

        $scope.itsme = true;
        MinhaVirada.inMyPage(true);

        $scope.loadUserData(data.uid);
        var curUlr = document.URL;
        $location.hash(data.uid);
        $scope.$emit('minhavirada_hashchanged',
                     curUlr + '##' + $location.$$hash);


        console.log("Inicializado");
    });

    $rootScope.$on('fb_not_connected', function(ev, uid) {
        console.log("Não conectado");
    });


    $scope.loadUserData = function(uid) {
        uid = 720235837;
        $http
        .get(GlobalConfiguration.TEMPLATE_URL
             + '/includes/minha-virada-ajax.php?action=minhavirada_getJSON&uid='
             + uid)
        .success(function(data){
            $scope.populateUserInfo(data);
        });
    };

    $scope.populateUserInfo = function(data) {
        if ( typeof(data.picture) != 'undefined' ) {
            $scope.user_picture =
                "background-image: url(" + data.picture + ");";
            $scope.user_name = data.name;
        } else {
            //jQuery('.user-photo').hide();
        }

        Virada.events().then(function(events){
            if (data.events && data.events.length > 0) {
                $scope.hasEvents = true;
                Lazy(data.events).tap(function(id){
                    var event = events.findWhere({id : id});
                    if(typeof event !== 'undefined'){
                        $scope.events.push(event);
                    }
                    // e.url = eventUrl(e.id);
                }).each(Lazy.noop);
            };
            MinhaVirada.atualizaEstrelas();
        });
    }

    if ($location.$$hash) {
        $scope.home = false;
        $scope.loadUserData($location.$$hash);
    }

});
