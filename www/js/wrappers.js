angular.module("viradapp.wrappers", [])

.factory('Lazy', ['$window', function ($window){
    return $window.Lazy;
}])
.factory('moment', function($window){
    return $window.moment;
})
.factory('Filter', function($window){
    return function(starting, ending){
        this.query = '';
        this.sorted = 'L';
        this.places = {
            data: [],
            query: ''
        };
        this.starting = starting.format('x');
        this.ending = ending.format('x');
        this.nearest = false;
    };
})
.factory('ListState', function($window){
    return function(){
        this.loaded = 0;
        this.page = 0;
        this.data = [];
    }
})
.factory('Date', function(moment){
    return {
        LL :  function(date){
            return moment(date).format('LL');
        },
        start: function(){
            return moment("201405170000", "YYYYMMDDhhmm");
        },
        end: function(){
            return moment("201405182359", "YYYYMMDDhhmm");
        },
        oneDay: function(){
            return moment.duration(1, 'days');
        }
    }
});
