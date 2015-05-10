var lazy = angular.module("lazy", [])
.factory('Lazy', ['$window', function ($window){
    return $window.Lazy;
}]);
