//###########################################################################################
//LE ROUTAGE DE L'APP
//###########################################################################################
wipesoundApp = angular.module('wipesoundApp', ['ionic', 'ngCordova', 'wipesoundController', 'nvd3', 'leaflet-directive', 'igTruncate']);

wipesoundApp.run(function($ionicPlatform) {
  $ionicPlatform.ready(function() {
    // Masquer la barre d'accessoires par défaut (la supprimer pour l'afficher au-dessus du clavier pour les entrées de formulaire )
    if (window.cordova && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
      cordova.plugins.Keyboard.disableScroll(true);
    }
    if (window.StatusBar) {
      StatusBar.styleDefault();
    }
  });
});

wipesoundApp.config(function($stateProvider, $urlRouterProvider) {
  $stateProvider

  // page au lancement de l'application, connexion Spotify
  .state('lancement', {
    url: '/',
    templateUrl: 'templates/login.html',
    controller: 'LoginCtrl'
  })



  // la sidebar déroulante de gauche
  .state('menu', {
    url: '/menu',
    abstract: true,
    templateUrl: 'templates/menu.html',
    controller: "MenuCtrl"
  })



  // la page d'accueil
  .state('menu.home', {
    url: '/home',
    views: {
      'menuContent': {
        templateUrl: 'templates/home.html',
        controller: "HomeCtrl"
      }
    }
  })



  // la page contenant les informations sur le profil de l'utilisateur
  .state('menu.mon_profil', {
    url: '/mon_profil',
    views: {
      'menuContent': {
        templateUrl: 'templates/mon_profil.html',
        controller: 'Mon_profilCtrl'
      }
    }
  })



  // les playlists de l'utilisateur
  .state('menu.mes_playlists', {
    url: '/mes_playlists',
    views: {
      'menuContent': {
        templateUrl: 'templates/mes_playlists.html'
      }
    }
  })



  // la map focus sur la géolocalisation du mobile montrant les lieux compatibles dans les alentours
  .state('menu.wipesound_dans_le_coin', {
    url: '/wipesound_dans_le_coin',
    views: {
      'menuContent': {
        templateUrl: 'templates/wipesound_dans_le_coin.html',
        controller: 'Wipesound_dans_le_coinCtrl'
      }
    }
  });



  // redirection vers la page de connection ('lancement') sur une URL non reconnue est lancée
  $urlRouterProvider.otherwise('/');

});
