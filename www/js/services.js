angular.module('viradapp.services', [])

.factory('Virada', function($http, Lazy) {
    var spaces = $http.get("assets/spaces-order.json")
    .then(function(res){
        return Lazy(res.data);
    });

    var spaces_data = $http.get("assets/spaces.json")
    .then(function(res){
        return Lazy(res.data);
    });

    var events = $http.get("assets/events.json")
    .success(function(data){
    })
    .error(function(data, status, headers,config){
        console.log(status);
    })
    .then(function(res){
        return Lazy(res.data);
    });

    return {
        events: function() {
            return events;
        },
        spaces: function() {
            return spaces;
        },

        get: function(event_id) {
            return events.then(function(events){
                return spaces_data.then(function(data){
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
        getPalco: function(palco_id) {
            return spaces_data.then(function(spaces){
                var space = spaces.findWhere({
                    id : parseInt(palco_id)
                });
                return events.then(function(events){
                    var time = Date.now();

                    space.events = events.where({
                        spaceId : parseInt(palco_id)
                    }).filter(function(ev){
                        // TODO Show only events in the future
                        // Here is just the basic idea!
                        stOn = new Date(ev.startsOn).getTime();
                        // FIXME Its to be greater than
                        return stOn < time;
                    }).toArray();
                    return space;
                });
            });
        }
    };
});
