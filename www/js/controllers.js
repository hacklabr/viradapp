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

.controller('AtracaoCtrl', function($scope, $stateParams, Virada, Lazy){
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
.controller('ProgramacaoCtrl', function($scope, $stateParams,      Virada, Lazy) {
    var spaces;
    $scope.spaces = [];

    var events;

    var loads = 5;
    var loaded;
    var page = 1;

    var start = new Date().getTime();
    Virada.spaces().then(function(data){
        spaces = data;
        $scope.spaces = spaces.take(loads);

        Virada.events().then(function(data){
            events = data;
            $scope.spaces = spaces.take(loads)
            .tap(function(space){
                space.events = events.where({
                    spaceId: parseInt(space.id)
                }).toArray();
            }).toArray();
            loaded = page*loads;
            var end = new Date().getTime();
            console.log("Loaded: " + loaded + ", Tempo: "
                        + (end - start));
        });

    });

    $scope.LL = function(date){
        return moment(date).format('LL');
    };

    $scope.loadMore  = function(){
        var start = new Date().getTime();
        page++;
        var d = spaces.drop(loaded).take(loads)
        .tap(function(space){
            space.events = events.where({
                spaceId: parseInt(space.id)
            }).toArray();
        }).toArray();
        loaded = page*loads;
        $scope.spaces.push.apply($scope.spaces, d);
        $scope.$broadcast('scroll.infiniteScrollComplete');
        var end = new Date().getTime();
        console.log("Loaded: " + loaded + ", Tempo: "
                    + (end - start));
    };

    $scope.canLoad = function(){
        return typeof spaces != 'undefined'
        && typeof events != 'undefined';
    }

})

.controller('MinhaViradaCtrl', function($scope, Virada, Lazy) {
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
