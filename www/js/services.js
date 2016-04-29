angular.module('viradapp.services', [])

.factory('Virada', function($http, GlobalConfiguration, $cordovaFile, $ionicPlatform, MinhaVirada, $q, $cacheFactory) {
    var conf = {
        spaces_data : {
            file: "spaces.json"
        },
        spaces: {
            file: "spaces-order.json"
        },
        events: {
            file: "events.json"
        }
    };
    var spaces = [];
    var spaces_data = [];
    var events = [];

    function getSpaces(){
        // spaces = $http.get(conf.spaces.url);

        var $httpCache = $cacheFactory.get('$http');
        var deferred = $q.defer();

        spaces = $httpCache.get(conf.spaces.url);
        if(!spaces){
            // console.log("not using cache");
            $http.get(conf.spaces.url, {cache : true})
            .then(function(res){
                // return Lazy(res.data);
                // console.log(res);
                deferred.resolve(Lazy(res.data));
            });
        } else {
            deferred.resolve(spaces);
        }
        // console.log(deferred.promise);
        spaces = deferred.promise;
    }

    function getSpacesData(){
        spaces_data = $http.get(conf.spaces_data.url, {cache : true})
        .then(function(res){
            return Lazy(res.data);
        });
    }

    function getEvents(){
        events = $http.get(conf.events.url, {cache :  true})
        .then(function(res){
            return Lazy(res.data);
        });
    }

    conf.spaces.url = GlobalConfiguration.BASE_URL + "/" + conf.spaces.file;
    getSpaces();

    conf.events.url = GlobalConfiguration.BASE_URL + "/" + conf.events.file;
    getEvents();

    conf.spaces_data.url = GlobalConfiguration.BASE_URL + "/" + conf.spaces_data.file;
    getSpacesData();

    var data_source = {spaces : spaces, events: events, spaces_data: spaces_data};

    return {
        events: function() {
            return data_source.events;
        },
        spaces: function() {
            return data_source.spaces;
        },

        get: function(event_id) {
            return data_source.events.then(function(events){
                return data_source.spaces_data.then(function(data){
                    data = Lazy(data);
                    var event = events.findWhere({
                        id : parseInt(event_id)
                    });
                    event.space = data.findWhere({
                        id : parseInt(event.spaceId)
                    });
                    return event;
                });
            });
        },
        getPalcos: function(){
            return data_source.spaces_data;
        },
        getPalcoEvents: function(palco_id) {
            return data_source.spaces_data.then(function(spaces){
                var space = spaces.findWhere({
                    id : parseInt(palco_id)
                });
                return data_source.events.then(function(events){
                    var time = Date.now();
                    space.events = events.where({
                        spaceId : parseInt(palco_id)
                    }).filter(function(ev){
                        // TODO Show only events in the future
                        // Here is just the basic idea!
                        stOn = new Date(ev.startsOn).getTime();
                        // FIXME Its to be greater than
                        // return stOn >= time;
                        return true;
                    }).toArray();
                    return space;
                });
            });
        }
    };
});
