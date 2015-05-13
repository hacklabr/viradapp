angular.module('viradapp.controllers',[])

.controller('ProgramacaoCtrl', function($scope, $stateParams,      Virada, Lazy) {
    var spaces;
    $scope.spaces = [];

    var events;

    var loads = 5;
    var loaded;
    var page = 1;

    if($stateParams.atracao){
        Virada.get($stateParams.atracao)
        .then(function(data){
            $scope.atracao = data;
            $scope.space = data.space;
        });
    } else {
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
                console.log("loaded: " + loaded);
            });
        });

    }

    $scope.LL = function(date){
        return moment(date).format('LL');
    };

    $scope.loadMore  = function(){
        setTimeout(function(){
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
            console.log("loaded: " + loaded);
        }, 1000);
    };

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
