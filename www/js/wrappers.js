angular.module("viradapp.wrappers", [])

.factory('Lazy', ['$window', function ($window){
    return $window.Lazy;
}])

.factory('MinhaVirada', function ($window, GlobalConfiguration, $cordovaOauth, $localStorage, $http, $rootScope, $ionicPlatform, $q){
    var uid = false;
    var accessToken = false;
    var eventId = false;
    var connected = false;
    var username = false;
    var name = false;
    var picture = false;
    var events = [];
    var modalDismissed = false;
    var data = false;
    var initialized = false;
    var inMyPage = false;
    var isBrowser = false;

    var _xhr_api = function (obj) {
        var method = obj.method || 'GET',
            params = obj.params || {},
            xhr = new XMLHttpRequest(),
            url;

        params['access_token'] = accessToken;

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

    var connect = function(callback) {
        $ionicPlatform.ready(function(){
            if (connected) {
                eval(callback);
                return;
            }

            $cordovaOauth
            .facebook(GlobalConfiguration.APP_ID, [
                "email",
                "user_website",
                "user_location",
                "user_relationships"
            ])
            .then(function(response){
                _connected(response, callback);
            }, function(error){
                if('Cannot authenticate via a web browser' === error){
                    _browser(callback);
                }
            });
        });
    };

    var _connected = function(response, callback){
        var authData = {};
        if(typeof response.authResponse !== 'undefined'){
            authData.access_token = response.authResponse.accessToken;
            authData.uid = response.authResponse.userID;
        } else {
            authData = response;
        }
        console.log(JSON.stringify(authData));

        initializeUserData(authData, callback ? callback : false);
        connected = true;
        accessToken = authData.access_token;
    }

    var _browser = function(callback) {
        window.fbAsyncInit = function() {
            FB.init({
                appId      : GlobalConfiguration.APP_ID,
                status     : false,
                xfbml      : true
            });

            // Ao carregar a pagina vemos se o usuario ja esta
            // conectado e com o app autorizado.
            // Se nao estiver, não fazemos nada.
            // Só vamos fazer alguma coisa se ele clicar
            FB.getLoginStatus(function(response) {
                if (response.status === 'connected') {
                    _connected(response, callback);
                } else{
                    $rootScope.$emit('initialized');
                    atualizaEstrelas();
                    $rootScope.$emit('fb_not_connected');
                }

                $rootScope.$emit('sdk_loaded');
            });

        };
        _init();
    };

    var _init = function(){
        (function(d, s, id){
            var js, fjs = d.getElementsByTagName(s)[0];
            if (d.getElementById(id)) {return;}
            js = d.createElement(s); js.id = id;
            js.src = "//connect.facebook.net/pt_BR/all.js";
            fjs.parentNode.insertBefore(js, fjs);
        }(document, 'script', 'facebook-jssdk'));
    };

    var init = function(at, uid){
        return initializeUserData({access_token: at, uid: uid});
    }

    var initializeUserData = function(response, callback) {

        connected = true;

        accessToken = response.access_token;
        return api({
            path: '/me',
            params: {fields: ['id', 'name', 'picture.height(200)']}
        })
        .then(function(response) {
            name = response.name;
            picture = response.picture.data.url;
            uid = response.id;

            $rootScope.$emit('fb_connected', {uid: uid, token: accessToken});
            $rootScope.$emit('initialized');
            save();
        })
        .catch(function(d){
            connected = false;
            return false;
        });
    };

    var prepareJSON = function() {
        var json = {
            uid: uid,
            picture: picture,
            events: events,
            name: name,
            modalDismissed: modalDismissed
        }
        return json;
    };

    var save = function() {
        var userJSON = prepareJSON();
        console.log(JSON.stringify(userJSON));
        $localStorage.user = userJSON;
        // TODO SAVE TO API! IMPORTANT! RETURN PROMISE!!!! =D

        //jQuery.post( GlobalConfiguration.templateURL + '/includes/minha-virada-ajax.php', {action: 'minhavirada_updateJSON', dados: userJSON }, function( data ) {
        // atualiza estrelas
        //  atualizaEstrelas();
        //  if (!modalDismissed)
        //jQuery('#modal-favorita-evento').modal('show');
        //});
    };

    atualizaEstrelas = function() {
        if(initialized) {
            //jQuery('.favorite').removeClass('favorite-wait');
        }

        if (!connected)
            return;
        //jQuery('.favorite').removeClass('active');
        for (var i = 0; i < events.length; i++) {
            //jQuery('.favorite-event-'+events[i]).addClass('active');
        }
    };

    // retorna falso se não tem, ou o índice se tem
    var has_event = function(eventId) {
        if (!connected)
            return false;

        for (var i = 0; i < events.length; i++) {

            if (events[i] == eventId)
                return i;
        }
        return false;
    };

    var click = function(eventId) {
        eventId = eventId;
        connect('doClick');
    };

    var doClick = function() {
        //console.log(events);
        //console.log(eventId);
        if (eventId) {
            var has_event = has_event(eventId);
            if (has_event !== false ) { // o indice pode ser 0

                //if (confirm('Tem certeza que quer remover esta atração da sua seleção?')) {

                events.splice(has_event, 1);

                // Se estiver editando a pagina minha virada, exclui o evento da página
                // if (inMyPage)
                //jQuery('#event-group-' + eventId).fadeOut(function() {
                //  jQuery(this).remove();
                //});
                //}

            } else {
                events.push(eventId);
            }
            save();
        }
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


    var logout = function(callback){
        $ionicPlatform.ready(function(){
            delete $localStorage.accessToken
            connected = false;
            FB.logout(function(){
                window.location.reload()
                console.log(response);
                return false;
            });
            console.log();
        });
    }

    var revoke = function (success, error) {
        return api({method: 'DELETE',
            path: '/me/permissions',
            success: function () {
                success();
            },
            error: error});
    }

    return {
        connect: connect,
        init: init,
        add: doClick,
        inMyPage: function(myPage){
            inMyPage = myPage;
        },
        atualizaEstrelas: atualizaEstrelas,
        logout: logout
    };
});

