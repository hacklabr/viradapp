var viradapp = angular.module("viradapp", ['lazy', 'ionic', 'viradapp.controllers', 'viradapp.services']);
viradapp.run(function($ionicPlatform) {
    $ionicPlatform.ready(function() {
        // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
        // for form inputs)
        if (window.cordova && window.cordova.plugins && window.cordova.plugins.Keyboard) {
            cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
        }
        if (window.StatusBar) {
            // org.apache.cordova.statusbar required
            StatusBar.styleLightContent();
        }
    });
})

viradapp.config(function($stateProvider, $urlRouterProvider) {
    $stateProvider

    // setup an abstract state for the tabs directive
    .state('tab', {
        url: "/tab",
        abstract: true,
        templateUrl: "templates/tabs.html"
    })

    // Each tab has its own nav history stack:

    .state('tab.programacao', {
        url: '/programacao',
        views: {
            'tab-programacao': {
                templateUrl: 'templates/tab-programacao.html',
                controller: 'ProgramacaoCtrl'
            }
        }
    })

    .state('tab.atracao-detail', {
        url: '/programacao/:atracao',
        views: {
            'tab-programacao': {
                templateUrl: 'templates/atracao-detail.html',
                controller: 'ProgramacaoCtrl'
            }
        }
    })

    .state('tab.minha-virada', {
        url: '/minha-virada',
        views: {
            'tab-minha-virada': {
                templateUrl: 'templates/tab-minha-virada.html',
                controller: 'MinhaViradaCtrl'
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

    // if none of the above states are matched, use this as the fallback
    $urlRouterProvider.otherwise('/tab/programacao');
});

