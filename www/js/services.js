angular.module('viradapp.services', [])

.factory('Virada', function($http, BASE_URL, $cordovaFile) {
    console.log($cordovaFile);
    var conf = {
        assets : "/assets/",
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
    // FIXME Change json get
    var md5 = $http.get("assets/new/objects-md5.json").then(function(newMD5){
        return $http.get("assets/objects-md5.json").then(function(oldMD5){
            console.log(oldMD5.data[conf.spaces.file]);

            conf.spaces.url = newMD5.data[conf.spaces.file] === oldMD5.data[conf.spaces.file] ?
                conf.assets + conf.spaces.file :
                BASE_URL + "/" + conf.spaces.file + "?v=" + newMD5.data[conf.spaces.file];
            spaces = $http.get(conf.spaces.url)
                .then(function(res){
                    return Lazy(res.data);
                });

            conf.events.url = newMD5.data[conf.events.file] === oldMD5.data[conf.events.file] ?
                conf.assets + conf.events.file :
                BASE_URL + "/" + conf.events.file + "?v=" + newMD5.data[conf.events.file];

            events = $http.get(conf.events.url)
                .then(function(res){
                    return Lazy(res.data);
                });

            conf.spaces_data.url = newMD5.data[conf.spaces_data.file] ===
                oldMD5.data[conf.spaces_data.file] ?
                conf.assets + conf.spaces_data.file :
                BASE_URL + "/" + conf.spaces_data.file + "?v=" + newMD5.data[conf.spaces_data.file];
            console.log(conf);
            spaces_data = $http.get(conf.spaces_data.url)
                .then(function(res){
                    return Lazy(res.data);
                });

            return {spaces : spaces, events: events, spaces_data: spaces_data};
        });
    });


    return {
        events: function() {
            return md5.then(function(data){
                return data.events;
            });
        },
        spaces: function() {
            return md5.then(function(data){
                return data.spaces;
            });
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
