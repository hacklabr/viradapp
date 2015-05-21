angular.module('viradapp.controllers',[])
.controller('PalcoCtrl', function($scope, $stateParams, Virada, Lazy){
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
.controller('FilterCtrl', function($scope, $stateParams, Virada, Lazy, $ionicModal) {
    var config = {
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
        }
    }
    $scope.filters = {
        query: '',
        sorted: 'L',
        places: [],
        starting: new Date().getTime(),
        ending: new Date().getTime(),
        nearest: false
    }

    $scope.sorted = 'L';
    var spaces;
    $scope.ledata = [];

    var events;

    var start = new Date().getTime();
    // First run! After that, all sequence processing is on
    // the loadMore and filterDate methods
    if($scope.ledata.length == 0){
    Virada.spaces().then(function(data){
        spaces = data;
        $scope.ledata = spaces.take(config.loads);
        config.L.data = $scope.ledata;

        Virada.events().then(function(data){
            events = data;
            $scope.ledata = spaces.take(config.loads)
                .tap(function(space){
                    space.events = events.where({
                        spaceId: parseInt(space.id)
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
    });
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
                    var space = {
                        events : events.take(config.loads).toArray()
                    };
                    $scope.ledata = [];
                    $scope.ledata.push(space);

                    config.A.data = $scope.ledata;
                    config.A.page++;
                    config.A.loaded = config.A.page*config.loads;
                }
            break;
            case "L":
                $scope.filters.sorted = "L";
                $scope.ledata = config.L.data;
                console.log("recovering... per local");
            break;
            case "H":
                console.log("Filter Time");
            break;
        }
    };


    /**
     *   Util
     */

    $scope.LL = function(date){
        return moment(date).format('LL');
    };

    $scope.loadMore  = function(){
        var start = new Date().getTime();
        switch ($scope.filters.sorted) {
            case "A":
                config.A.page++;
                var d = events.drop(config.A.loaded)
                        .take(config.loads).toArray();

                config.A.loaded = config.A.page*config.loads;
                console.log($scope.ledata);
                $scope.ledata[0].events.push.apply($scope.ledata[0].events, d);
                config.A.data = $scope.ledata;
                $scope.$broadcast('scroll.infiniteScrollComplete');
                var end = new Date().getTime();
                console.log("Loaded events: "
                            + config.A.loaded + ", Tempo: "
                            + (end - start));

            break;
            case "L":
                config.L.page++;
                var d = spaces
                    .drop(config.L.loaded)
                    .take(config.loads)
                    .tap(function(space){
                        space.events = events.where({
                            spaceId: parseInt(space.id)
                        }).toArray();
                    }).toArray();
                    config.L.loaded = config.L.page*config.loads;
                    $scope.ledata.push.apply($scope.ledata, d);
                    config.L.data = $scope.ledata;
                    $scope.$broadcast('scroll.infiniteScrollComplete');
                var end = new Date().getTime();
                console.log("Loaded spaces: "
                            + config.L.loaded + ", Tempo: "
                            + (end - start));
            break;
        }
    };

    $scope.canLoad = function(){
        return typeof spaces != 'undefined'
        && typeof events != 'undefined';
    }

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

    // Execute action on hide modal
    $scope.$on('modal.hidden', function() {
        // TODO filter data here
    });

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
            return event.defaultImageThumb != "";
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
