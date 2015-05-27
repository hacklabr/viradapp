angular.module('viradapp.controllers', [])
.controller('PalcoCtrl', function($scope, $stateParams, Virada, CONN){
    console.log(CONN);
    if($stateParams.palco){
        var start = new Date().getTime();
        Virada.getPalco($stateParams.palco)
        .then(function(data){
            $scope.space = data;
            $scope.spaceEvents = data.events;
            var end = new Date().getTime();
            console.log("Tempo: " + (end - start));
        });
    } else {
        //
    }
})

.controller('AtracaoCtrl', function($scope, $stateParams, Virada){
    if($stateParams.atracao){
        var start = new Date().getTime();
        Virada.get($stateParams.atracao)
        .then(function(data){
            $scope.atracao = data;
            $scope.space = data.space;
            var end = new Date().getTime();
            console.log("Tempo: " + (end - start));
        });
    } else {
    }
})

.controller('FilterCtrl', function($scope, $stateParams, Virada,$ionicModal, $timeout) {
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

    $scope.ledata = [];

    var start = new Date().getTime();


    /**
     * Init data, once initialized we have the following structures:
     * spaces as a Lazy.js sequence
     * events as a Lazy.js sequence
     * $scope.ledata first data
     *
     */
    function init (){
        Virada.spaces().then(function(data){
            i = 0;
            data.async().tap(function(space){
                space.index = i;
                i++;
            }).toArray().then(function(a){
                $scope.lespaces = a;
                config.filtered = Lazy(a);
                spaces = Lazy(a);
                Virada.events().then(function(data){
                    events = data;
                    $scope.ledata = config.filtered.take(config.loads)
                    .tap(function(space){
                        space.events = events.where({
                            spaceId : parseInt(space.id, 10)
                        }).toArray();

                        Virada.getPalco(space.id).then(function(palco){
                            space.palco = palco;
                        });
                    }).toArray();

                config.L.data = $scope.ledata;
                config.L.page++;
                config.L.loaded = config.L.page*config.loads;

                var end = new Date().getTime();
                console.log("Loaded: " + config.L.loaded + ", Tempo: "
                    + (end - start));
                });

                return Lazy(a);
            });

        });
    }

    // First run! After that, all sequence processing is on
    // the loadMore and filterDate methods
    if($scope.ledata.length === 0) {
        init();
    }

    function viewByEvents(){
        var space = {
            events : config.filtered.take(5).take(config.loads).toArray()
        };
        $scope.ledata = [];
        $scope.ledata.push(space);

        config.A.data = $scope.ledata;
        config.A.page++;
        config.A.loaded = config.A.page*config.loads;
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
                hasSpace = space.name.indexOf($scope.filters.query) >= 0;
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
        switch ($scope.filters.sorted) {
            case "A":
                data = events.filter(lefilter).sortBy(thename);
                config.filtered = data;
            break;
            case "L":
                data = events.filter(lefilter).each(toSpaces);
                config.filtered = Lazy(currSpaces).sortBy('index');
            break;
        }
    }

    /**
     * Sorted by
     */
    $scope.change = function(item){
        switch (item.sorted){
            case "A":
                $scope.filters.sorted = "A";
                if(config.A.data.length > 0){
                   $scope.ledata = config.A.data;
                   console.log("recovering... per event");
                } else {
                    console.log("Change filter");
                    filtering();
                    viewByEvents();
                }
            break;
            case "L":
                $scope.filters.sorted = "L";
                if(config.L.data.length > 0){
                    $scope.ledata = config.L.data;
                    console.log("recovering... per local");
                } else {
                    filtering();
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

    var TIMEOUT_DELAY = 1000;

    $scope.$watch('filters', function(newValue, oldValue){
        if(JSON.stringify(newValue) !== JSON.stringify(oldValue)){
            $timeout(function(){
                filtering();
                switch($scope.filters.sorted){
                    case "L":
                        $scope.ledata = config.filtered
                            .take(config.loads).toArray();
                    break;
                    case "A":
                        $scope.ledata = [{
                            events: config.filtered.take(config.loads).toArray()
                        }];
                    break;
                }
            }, TIMEOUT_DELAY);
        }
    }, true);


    /**
     *   Util
     */

    $scope.LL = function(date){
        return moment(date).format('LL');
    };

    $scope.loadMore  = function(){
        if(typeof config.filtered == 'undefined') return false;
        console.log("Loading more...");
        start = new Date().getTime();
        switch ($scope.filters.sorted) {
            case "A":
                config.A.page++;
                var d = config.filtered.drop(config.A.loaded)
                    .take(config.loads).toArray();

                config.A.loaded = config.A.page*config.loads;
                $scope.ledata[0].events.push
                    .apply($scope.ledata[0].events, d);
                config.A.data = $scope.ledata;
                var end = new Date().getTime();
                console.log("Loaded events: "
                            + config.A.loaded + ", Tempo: "
                            + (end - start));
            break;
            case "L":
                config.L.page++;
                d = config.filtered
                    .drop(config.L.loaded)
                    .take(config.loads)
                    .tap(function(space){
                        space.events = events.where({
                            spaceId : parseInt(space.id, 10)
                        }).toArray();
                    });

                d = d.toArray();

                config.L.loaded = config.L.page*config.loads;
                $scope.ledata.push.apply($scope.ledata, d);
                config.L.data = $scope.ledata;
                end = new Date().getTime();
                console.log("Loaded spaces: "
                            + config.L.loaded + ", Tempo: "
                            + (end - start));
            break;
        }

        $scope.$broadcast('scroll.infiniteScrollComplete');
    };

    $scope.canLoad = function(){
        var allShown = false;
        if(typeof config.filtered === 'undefined') return false;
        switch($scope.filters.sorted){
            case "A":
                if(typeof config.filtered !== 'undefined'){
                    allShown = config.A.loaded >= config.filtered.size();
                }
            break;
            case "L":
                if(typeof config.filtered !== 'undefined'){
                    allShown = config.L.loaded >= config.filtered.size();
                }
            break;
        }

        return typeof spaces !== 'undefined'
            && typeof events !== 'undefined'
            && !allShown;
    };

    $ionicModal.fromTemplateUrl('modal.html', {
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

    $scope.$on('modal.hidden', function() {
        // Show button if places are chosen
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

    $scope.clearSearch = function() {
        $scope.filters.places.query = '';
        console.log($scope.filters.places.query);
    }

})
.filter('searchPlaces', function(){
  return function (items, query) {
    if(typeof items === 'undefined') return;
    var filtered = [];
    var letterMatch = new RegExp(query, 'i');
    for (var i = 0; i < items.length; i++) {
      var item = items[i];
      if (query) {
        if (letterMatch.test(item.name.substring(0, query.length))) {
          filtered.push(item);
        }
      } else {
        filtered.push(item);
      }
    }
    return filtered;
  };
})
.controller('ProgramacaoCtrl', function($scope, $stateParams, Virada, $ionicModal) {
})
.controller('AtracoesCtrl', function($scope, $stateParams, Virada, $ionicModal) {

})
.controller('MinhaViradaCtrl', function($scope, Virada) {
    var events;
    $scope.events = [];
    Virada.events().then(function(data){
        events = data;
        $scope.events = events.filter(function(event){
            return event.defaultImageThumb !== "";
        }).take(20).sortBy(function(event){
            return event.startsOn;
        }).toArray();
    });
})

.controller('SocialCtrl', function($scope) {
    $scope.settings = {
        enableFriends: true
    };
});
