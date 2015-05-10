angular.module('viradapp.controllers', [])

.controller('ProgramacaoCtrl', function($scope, $stateParams, Virada, Lazy) {
   if($stateParams.atracao){
       $scope.atracao = Virada.get($stateParams.atracao);
   } else {
       Virada.spaces().then(function(data){
           $scope.spaces = data;
           Virada.events().then(function(events){
                $scope.events = events;
                $scope.spaces.forEach(function(space){
                    space.events = Lazy(events).where({
                        spaceId: parseInt(space.id)
                    }).toArray();
                    console.log(space.events);
                });
           })
       });
   }

})

.controller('MinhaViradaCtrl', function($scope, Virada, _) {
    Virada.events().then(function(data){
        console.log(data);
        $scope.events = _.filter(data, function(event){
            return event.defaultImageThumb != "";
        });
    });
})

.controller('SocialCtrl', function($scope) {
  $scope.settings = {
    enableFriends: true
  };
});
