var viradapp = angular.module("viradapp", ['ionic', 'viradapp.wrappers', 'viradapp.controllers', 'viradapp.services', 'viradapp.config', 'ngStorage', 'ngCordova']);
viradapp.run(function($ionicPlatform, GlobalConfiguration) {
    $ionicPlatform.ready(function() {
        if (window.cordova && window.cordova.plugins &&
            window.cordova.plugins.Keyboard) {
            cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
        }
        if (window.StatusBar) {
            StatusBar.styleLightContent();
            StatusBar.overlaysWebView(false);
            StatusBar.styleBlackTranslucent();
            StatusBar.backgroundColorByName('black');
        }
    });
})

viradapp.config(function($stateProvider, $urlRouterProvider, $ionicConfigProvider, $cordovaFacebookProvider) {
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

    .state('virada.about', {
        url: '^/virada/sobre',
        views: {
            'menu-virada': {
                templateUrl: 'templates/about.html',
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

