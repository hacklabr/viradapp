angular.module('viradapp.controllers',[])

.controller('ProgramacaoCtrl', function($scope, $stateParams,      Virada, Lazy) {
    var spaces;
    $scope.spaces = [];

    var events;

    var loads = 5;
    var loaded;
    var page = 1;

    if($stateParams.atracao){
        $scope.atracao = Virada.get($stateParams.atracao);
    } else {
        Virada.spaces().then(function(data){
            spaces = Lazy(data);
            $scope.spaces = spaces.take(loads);

            Virada.events().then(function(data){
                events = Lazy(data);
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
        events = Lazy(data);
        $scope.events = Lazy(events).filter(function(event){
            return event.defaultImageThumb != "";
        }).toArray();
    });
})

.controller('SocialCtrl', function($scope) {
    $scope.settings = {
        enableFriends: true
    };
});
