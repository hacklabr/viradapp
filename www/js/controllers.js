angular.module('viradapp.controllers',[])

.controller('ProgramacaoCtrl', function($scope, $stateParams,      Virada, Lazy) {
    var spaces;
    $scope.spaces = [];

    var events;

    if($stateParams.atracao){
        $scope.atracao = Virada.get($stateParams.atracao);
    } else {
        Virada.spaces().then(function(data){
            spaces = Lazy(data);
            $scope.spaces = spaces.toArray();
            Virada.events().then(function(events){
                $scope.events = events;
                $scope.spaces.forEach(function(space){
                    space.events = Lazy(events).where({
                        spaceId: parseInt(space.id)
                    }).chunk(4).toArray();
                });
            })
        });
    }

    $scope.init = function (e){
        console.log(e.innerHTML);
        console.log(this);
    }

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
