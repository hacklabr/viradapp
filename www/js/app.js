var viradapp = angular.module("viradapp", ['ionic', 'viradapp.controllers', 'viradapp.services', 'ngCordova']);

viradapp.value('CONN', "DEFAULT");
viradapp.value('BASE_URL', "http://localhost:8100/api");
viradapp.run(function($ionicPlatform, CONN) {
    $ionicPlatform.ready(function() {
        if (window.cordova && window.cordova.plugins &&
            window.cordova.plugins.Keyboard) {
            cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
        }
        if (window.StatusBar) {
            StatusBar.styleLightContent();
        }
        // Connection Change Handler
        // This function just change the global connection type
        var connChangeHandler = function(conn){
            if(window.Connection) {
                if(Connection.NONE == conn.type){
                    viradapp.value('CONN', Connection.NONE);
                } else if(Connection.ETHERNET == conn.type
                    || Connection.WIFI == conn.type
                        || Connection.CELL_4G){
                            CONN = "FAST";
                        } else {
                            CONN = "SLOW";
                        }
            } else {
                CONN = "UNKNOWN";
            }
        }
        document.addEventListener("online", connChangeHandler, false);
        document.addEventListener("offline", connChangeHandler, false);
    });
})

viradapp.config(function($stateProvider, $urlRouterProvider, $ionicConfigProvider) {
    //$ionicConfigProvider.scrolling.jsScrolling(false);

    $stateProvider
    .state('tab', {
        abstract: true,
        templateUrl: "templates/menu.html",
        controller: 'FilterCtrl'
    })

    .state('tab.programacao', {
        url: '^/virada/programacao',
        views: {
            'tab-programacao': {
                templateUrl: 'templates/tab-programacao.html',
                controller: 'ProgramacaoCtrl'
            }
        }
    })

    .state('virada', {
        url: "/virada",
        abstract: true,
        templateUrl: "templates/menu-virada.html"
    })

    .state('virada.minha-virada', {
        url: '/minha-virada',
        views: {
            'menu-virada': {
                templateUrl: 'templates/tab-minha-virada.html',
                controller: 'MinhaViradaCtrl'
            }
        }
    })
    .state('virada.atracao-detail', {
        url: '/atracao/:atracao',
        views: {
            'menu-virada': {
                templateUrl: 'templates/atracao-detail.html',
                controller: 'AtracaoCtrl'
            }
        }
    })

    .state('virada.palco-detail', {
        url: '/palco/:palco',
        views: {
            'menu-virada': {
                templateUrl: 'templates/palco-detail.html',
                controller: 'PalcoCtrl'
            }
        }
    })

    .state('tab.social', {
        url: '/social',
        views: {
            'tab-social': {
                templateUrl: 'templates/tab-social.html',
                controller: 'SocialCtrl'
            }
        }
    });

    $urlRouterProvider.otherwise('/virada/programacao');
});

