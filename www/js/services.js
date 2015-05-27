angular.module('viradapp.services', [])

.factory('Virada', function($http, BASE_URL, $cordovaFile, $ionicPlatform) {
    console.log($cordovaFile);
    var conf = {
        assets : "/assets/old/",
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
    // FIXME Change md5 file get data
    var data_source = $http.get("assets/new/objects-md5.json").then(function(newMD5, status, header, config){
        return $http.get("assets/objects-md5.json").then(function(oldMD5){
            conf.spaces.url = newMD5.data[conf.spaces.file] === oldMD5.data[conf.spaces.file] ?
                conf.assets + conf.spaces.file :
                BASE_URL + "/" + conf.spaces.file + "?v=" + newMD5.data[conf.spaces.file];
            getSpaces();

            conf.events.url = newMD5.data[conf.events.file] === oldMD5.data[conf.events.file] ?
                conf.assets + conf.events.file :
                BASE_URL + "/" + conf.events.file + "?v=" + newMD5.data[conf.events.file];
            getEvents();

            conf.spaces_data.url = newMD5.data[conf.spaces_data.file] ===
                oldMD5.data[conf.spaces_data.file] ?
                conf.assets + conf.spaces_data.file :
                BASE_URL + "/" + conf.spaces_data.file + "?v=" + newMD5.data[conf.spaces_data.file];
            getSpacesData();

            return {spaces : spaces, events: events, spaces_data: spaces_data};
        }).catch(function(){
            conf.spaces.url = BASE_URL + "/" + conf.spaces.file + "?v="
                + newMD5.data[conf.spaces.file];
            getSpaces();

            conf.events.url = BASE_URL + "/" + conf.events.file + "?v="
                + newMD5.data[conf.events.file];
            getEvents();

            conf.spaces_data.url = BASE_URL + "/" + conf.spaces_data.file
                + "?v=" + newMD5.data[conf.spaces_data.file];
            getSpacesData();

            return {spaces : spaces, events: events, spaces_data: spaces_data};
        });
    }).catch(function(data, status, header, config){
        // FIXME change md5 file get data
        return $http.get("assets/objects-md5.json").then(function(oldMD5){
            conf.spaces.url = conf.assets + conf.spaces.file;
            getSpaces();
            conf.events.url = conf.assets + conf.events.file;
            getEvents();
            conf.spaces_data.url = conf.assets + conf.spaces_data.file;
            getSpacesData();

            return {spaces : spaces, events: events, spaces_data: spaces_data};
        }).catch(function(){
            console.log("No new file, no old file, first run?");
            return {spaces: Lazy(spaces), events: Lazy(events), spaces_data: Lazy(spaces_data)};
        });
    });

    function getSpaces(){
        spaces = $http.get(conf.spaces.url)
        .then(function(res){
            return Lazy(res.data);
        });
    }

    function getSpacesData(){
        spaces_data = $http.get(conf.spaces_data.url)
        .then(function(res){
            return Lazy(res.data);
        });
    }

    function getEvents(){
        events = $http.get(conf.events.url)
        .then(function(res){
            return Lazy(res.data);
        });
    }

    return {
        events: function() {
            return data_source.then(function(data){
                return data.events;
            });
        },
        spaces: function() {
            return data_source.then(function(data){
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
                        // return stOn >= time;
                        return true;
                    }).toArray();
                    return space;
                });
            });
        }
    };
});
