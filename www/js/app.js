var viradapp = angular.module("viradapp", ['lazy', 'ionic', 'viradapp.controllers', 'viradapp.services']);
viradapp.run(function($ionicPlatform) {
    $ionicPlatform.ready(function() {
        // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
        // for form inputs)
        if (window.cordova && window.cordova.plugins &&
            window.cordova.plugins.Keyboard) {
            cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
        }
        if (window.StatusBar) {
            // org.apache.cordova.statusbar required
            StatusBar.styleLightContent();
        }
    });
})

viradapp.config(function($stateProvider, $urlRouterProvider, $ionicConfigProvider) {
    $ionicConfigProvider.scrolling.jsScrolling(false);
    $stateProvider

    .state('tab', {
        abstract: true,
        templateUrl: "templates/menu.html"
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

