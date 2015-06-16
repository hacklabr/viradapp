angular.module("viradapp.minha_virada", [])
.factory('MinhaVirada', function ($window, GlobalConfiguration, $cordovaOauth, $localStorage, $http, $rootScope, $ionicPlatform, $q, User){

    var user = new User();
    var config = {
        connected: false,
    };

    var _xhr_api = function (obj) {
        var method = obj.method || 'GET',
            params = obj.params || {},
            xhr = new XMLHttpRequest(),
            url;

        params['access_token'] = user.accessToken;

        url = 'https://graph.facebook.com' + obj.path + '?'
        + toQueryString(params);
        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    if (obj.success) {
                        obj.success(JSON.parse(xhr.responseText));
                    }
                } else {
                    var error = xhr.responseText ?
                        JSON.parse(xhr.responseText).error :
                        {message: 'An error has occurred'};
                    if (obj.error) obj.error(error);
                }
            }
        };

        xhr.open(method, url, true);
        xhr.send(null);
    };

    var api = function(obj){
        var deferred = $q.defer();
        obj.success = function(result) {
            deferred.resolve(result);
        };
        obj.error = function(error) {
            deferred.reject(error);
        };
        _xhr_api(obj);
        return deferred.promise;
    }

    var connect = function() {
        $ionicPlatform.ready(function(){
            if (config.connected) {
                return;
            }

            return $cordovaOauth
            .facebook(GlobalConfiguration.APP_ID, [
                "email",
                "user_website",
                "user_location",
                "user_relationships"
            ])
            .then(function(response){
                return _connected(response);
            }, function(error){
                if('Cannot authenticate via a web browser' === error){
                    return _browser();
                }
            });
        });
    };

    var _connected = function(response){
        var authData = {};
        if(typeof response.authResponse !== 'undefined'){
            authData.access_token = response.authResponse.accessToken;
            authData.uid = response.authResponse.userID;
        } else {
            authData = response;
        }

        config.connected = true;
        user.accessToken = authData.access_token;

        return initializeUserData(authData);
    }

    var _browser = function() {
        window.fbAsyncInit = function() {
            FB.init({
                appId      : GlobalConfiguration.APP_ID,
                status     : false,
                xfbml      : true,
                version    : 'v2.3',
            });

            // Ao carregar a pagina vemos se o usuario ja esta
            // conectado e com o app autorizado.
            // Se nao estiver, não fazemos nada.
            // Só vamos fazer alguma coisa se ele clicar
            FB.getLoginStatus(function(response) {
                if (response.status === 'connected') {
                    return _connected(response);
                } else{
                    FB.login(function(response) {
                        if (response.status === 'connected') {
                            // Logged into your app and Facebook.
                            return _connected(response)
                        } else {
                            $rootScope.$emit('initialized');
                            $rootScope.$emit('fb_not_connected');
                        }
                    });
                }
            });

        };
        _init();
    };

    var _init = function(){
        (function(d, s, id){
            var js, fjs = d.getElementsByTagName(s)[0];
            if (d.getElementById(id)) {return;}
            js = d.createElement(s); js.id = id;
            js.src = "//connect.facebook.net/pt_BR/sdk.js";
            fjs.parentNode.insertBefore(js, fjs);
        }(document, 'script', 'facebook-jssdk'));
    };

    // Try to get user data

    var init = function(at, uid){
        return initializeUserData({access_token: at, uid: uid});
    }

    var initializeUserData = function(response) {
        user.accessToken = response.access_token;
        return api({
            path: '/me',
            params: {fields: ['id', 'name', 'picture.height(200)']}
        })
        .then(function(response) {
            user.name = response.name;
            user.picture = response.picture.data.url;
            user.uid = response.id;
            config.connected = true;

            $rootScope.$emit('initialized');
            if($localStorage.accessToken !== user.accessToken){
                $localStorage.accessToken = user.accessToken;

                // But still could be another user or another token, test it
                if($localStorage.uid !== user.uid){
                    $localStorage.uid = user.uid;
                }
            }

            loadUserData(user.uid).then(function(userData){
                $rootScope.$emit('fb_connected',
                             {
                                 uid: user.uid,
                                 token: user.accessToken

                             });

                $localStorage.user = userData;
                user.events = userData.events;
                $rootScope.$emit('fb_app_connected', userData);
            });
            return true;
        })
        .catch(function(d){
            config.connected = false;
            return false;
        });
    };

    function loadUserData (uid) {
        if(typeof uid !== 'undefined' && !user.uid){
            user.uid = uid;
        };

        return $http
        .get(GlobalConfiguration.SOCIAL_API_URL
             + '/minhavirada/?uid='
             + uid)
        .then(function(data){
            // Se não existe usuário ou não está logado,
            // Não tem uid, no caso
            if(data.data.length == 0){
                user_data = prepareJSON();
            } else {
                d = data.data;
                user.uid = d.uid;
                user.name = d.name;
                user.picture = d.picture;
                user.events = d.events;
            }
            $rootScope.$emit('user_data_loaded');
            return user;
        })
        .catch(function(data){
            $rootScope.$emit('data_not_loaded');
            return false;
        });
    };

    function reloadUserData (uid) {
        return $http
        .get(GlobalConfiguration.SOCIAL_API_URL
             + '/minhavirada/?uid='
             + uid)
        .then(function(data){
            if(typeof data.data.events !== 'undefined'){
                user.events = data.data.events;
            } else {
                user.events = [];
            }
            $localStorage.user = user;
            $rootScope.$emit('user_data_loaded');
        })
    };

    function prepareJSON () {
        var json = {
            uid: user.uid,
            picture: user.picture,
            events: user.events,
            name: user.name,
            modalDismissed: true
        }
        return json;
    };

    var save = function(userJSON) {
        console.log("--- Saving data ---");
        console.log(userJSON.events);
        console.log("--- End ---");
        var url = GlobalConfiguration.SOCIAL_API_URL + '/minhavirada/'
        var options = {
            headers : {
                'Content-Type': 'application/json; charset=UTF-8;'
            }
        };
        $http
        .post(url, userJSON, options)
        .success(function(data, status, headers, config){
            $rootScope.$emit('user_data_saved')
            return data;
        })
        .error(function(data, status, headers, config){
            $rootScope.$emit('user_data_fail');
            return false;
        });
    };

    var click = function(eventId) {
        if(!config.connected){
            return;
        }
        if(typeof user.events === 'undefined'){
            user.events = [];
        }
        return doClick(eventId);
    };

    var doClick = function(eventId) {
        is_in_minha_virada = false;
        if (eventId) {
            var has_event = hasEvent(eventId);

            if (has_event >= 0 ) { // o indice pode ser 0
                user.events.splice(has_event, 1);
                is_in_minha_virada = false;
            } else {
                user.events.push(eventId);
                is_in_minha_virada = true;
            }
            save(prepareJSON());
            return is_in_minha_virada;
        }
    };

    // retorna falso se não tem, ou o índice se tem
    var hasEvent = function(eventId) {
        return Lazy(user.events).indexOf(eventId);
    };



    var toQueryString  = function (obj) {
        var parts = [];
        for (var i in obj) {
            if (obj.hasOwnProperty(i)) {
                parts.push(encodeURIComponent(i) + "=" + encodeURIComponent(obj[i]));
            }
        }
        return parts.join("&");
    };

    var serialize = function(obj, prefix) {
        var str = [];
        for(var p in obj) {
            if (obj.hasOwnProperty(p)) {
                var k = prefix ? prefix + "[" + p + "]" : p, v = obj[p];
                str.push(typeof v == "object" ?
                         serialize(v, k) :
                         encodeURIComponent(k) + "=" + encodeURIComponent(v));
            }
        }
        return str.join("&");
    }

    var revoke = function (success, error) {
        return api({method: 'DELETE',
            path: '/me/permissions',
            success: function () {
                success();
            },
            error: error});
    }

    var userValid = function(){
        return user.accessToken;
    }

    var setUser = function (u){
        user = u;
    }

    // FIXME MinhaVirada should not touch events
    var fillEvents = function (events){
        if (user.events && user.events.length > 0) {
            Lazy(user.events).tap(function(id){
                var event = events.findWhere({id : id});
                if(typeof event !== 'undefined'){
                    event.in_minha_virada = true;
                }
            }).each(Lazy.noop);
        };
    }

    return {
        connect: connect,
        init: init,
        // TODO remove add, use toogle instead
        add: click,
        toogle: click,
        revoke: revoke,
        loadUserData: loadUserData,
        hasUser: userValid,
        setUser: setUser,
        hasEvent: hasEvent,
        fillEvents: fillEvents
    };
})
