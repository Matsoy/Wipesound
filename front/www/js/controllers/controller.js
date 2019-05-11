//###########################################################################################
//LES CTRL
//###########################################################################################
var wipesoundController = angular.module('wipesoundController', ['wipesoundProvider', 'spotify']);



//###########################################################################################
//Ctrl de la sidebar
//###########################################################################################
wipesoundController.controller('MenuCtrl', function ($scope, $rootScope, $http, $state, $ionicPopup, Spotify){
  // clic sur "Déconnexion" dans la sidebar
  $scope.deconnexion = function (){
    // si le mobile est dans un magasin
    if ($rootScope.idMag) {
      _envoi={};
      _envoi.tabGenres = $scope.genresPreferes;
      _envoi.magasinId = $rootScope.idMag;
      _envoi.userid = Spotify.getCurrentUserId();

      // alors on l'annonce au serveur
      $http({
        method: 'POST',
        url: 'http://<server_url>:<server_port>/sortmag',
        headers: {
          'Content-Type': 'application/json'
        },
        data: _envoi
      }).then(function successCallback(response) {
        console.log(response);

        // on réinitialise ces scopes
        $rootScope.idMag = false;
        $rootScope.getPosition = false;
        $rootScope.isinstore = false;
        $rootScope.connected = false;

        // Pop up de type "alert"
        var alertPopup = $ionicPopup.alert({
          title: 'Vous allez être déconnecté !'
        });

        alertPopup.then(function(res) {
          $state.go('lancement');
        });

      }, function errorCallback(response) {
        console.log(response);
      });

    }

    // sinon on redirige juste le mobile vers l'interface de connexion
    else{
      // on réinitialise ces scopes
      $rootScope.idMag = false;
      $rootScope.getPosition = false;
      $rootScope.isinstore = false;

      // Pop up de type "alert"
      var alertPopup = $ionicPopup.alert({
        title: 'Vous allez être déconnecté !'
      });

      alertPopup.then(function(res) {
        $state.go('lancement');
      });
    }
  };

});


//###########################################################################################
//Ctrl de la page d'accueil (Home)
//###########################################################################################
wipesoundController.controller('HomeCtrl', function ($scope, Spotify, $rootScope, $http, $state, $interval, $cordovaGeolocation, $ionicPlatform, LocationsService){

  var r;
  var idmagcourant;
  var magcourantLat;
  var magcourantLon;
  var magcourantName;

  // variables pour les appels asynchrones
  var _idMag;
  var _nomMag;
  var _latMag;
  var _longMag;
  var _distMag;
  var _idUser;
  var _maLat;
  var _maLong;
  var _envoi;
  var _distTmp;


  $ionicPlatform.ready(function() {
    // au démarrage de l'application
    if(!$rootScope.getPosition){
      $rootScope.getPosition = true;
      // on est identifié dans aucun magasin
      $rootScope.isinstore = false;
      // donc idMag = false
      $rootScope.idMag = false;

      // paramètre de géolocalisation -> calculer dans 10 sec et pas d'aide à la géolocalisation (triangularisation)
      var posOptions = {timeout: 10000, enableHighAccuracy: false};

      $cordovaGeolocation.getCurrentPosition(posOptions).then(function (position) {
        $scope.coords = {};
        // sauvegarde de la lat et long
        $scope.coords.latitude = position.coords.latitude;
        $scope.coords.longitude = position.coords.longitude;

        // requête GET pour récupérer la liste des magasins autour du mobile
        $http({
          method: 'GET',
          url: 'http://<server_url>:<server_port>/magasins/'+position.coords.latitude+'/'+position.coords.longitude+"/1"
        }).then(function successCallback(response) {
          $rootScope.placesList = response.data;
          $rootScope.markers = [];

          for (var i = 0; i<$rootScope.placesList.length; i++){
            // on rajoute chaque magasin dans la liste des markers
            LocationsService.savedLocations.push(
              {
                name : $rootScope.placesList[i].username,
                lat : $rootScope.placesList[i].lat,
                lng : $rootScope.placesList[i].lon
              }
            );
          }

          //sauvegarde en mémoire de la liste des magasins aux alentours (env. 700 km)
          localStorage.setItem('places', JSON.stringify(response.data));

          // puis calcul automatique de la géolocalisation toutes les 10 sec pour chercher les lieux compatibles à proximité
          $interval(function findStoreAround(){
            launchVerifPositionMobile();
          }, 10000);
        }, function errorCallback(response) {
          console.log(response);
        });

        // on récupère les informations de l'utilisateur pour les afficher notamment dans la vue "Mon profil" et pour la sidebar
        Spotify.getCurrentUser().then(function (data) {
          $rootScope.votre_profil = Spotify.setVotre_profil(data);

          // si l'utilisateur n'a pas de photo de profil
          if (!$rootScope.votre_profil.images[0]) {
            // on lui assigne une photo de profil par défaut
            $rootScope.votre_profil.images[0] = "./img/empty_profile.png";
          }

        });
      }, function(err) {
        console.log(err);
      });

    }
  });



  // Vérifie la position du mobile par rapport aux magasins
  function launchVerifPositionMobile(){
    // pas de triangularisation
    var posOptions2 = {enableHighAccuracy: false};

    $cordovaGeolocation.getCurrentPosition(posOptions2).then(function (position) {
      // récupération de la lat et long
      $scope.coords.latitude = position.coords.latitude;
      $scope.coords.longitude = position.coords.longitude;

      // si 1er lancement de l'app ou si lors du dernier appel le mobile n'était pas dans un magasin
      if(!$rootScope.isinstore){
        ifIsInStoreFalse(position.coords.latitude, position.coords.longitude, function(){
          // parcours des magasins aux alentours pour tester la correspondance des coordonnées
          browsePlacesList(0);
        });
      }

      // sinon si lors du dernier appel le mobile était dans un magasin
      else{
        ifIsInStoreTrue(position.coords.latitude, position.coords.longitude, function(){
          // si le mobile est sorti du lieu compatible
          ifSortMag(function(){
            // on communique alors avec le serveur pour signaler le retrait du magasin du lieu
            postSortMag();
          });
        });
      }
    });
  }



  // si booléen isinstore FALSE
  function ifIsInStoreFalse(lat, long, callback){
    _maLat=lat;
    _maLong=long;
    callback();
  }



  // si booléen isinstore TRUE
  function ifIsInStoreTrue(lat, long, callback){
    _maLat=lat;
    _maLong=long;

    // calcul de la distance avec le lieu pour vérifier si le mobile est toujours dedans
    getDistance(_latMag, _maLat, _longMag, _maLong, function(){
      // si la distance du mobile par rapport au centre du mag est > 50 mètres i.e. le mobile est sorti du magasin
      if(_distTmp>50){
        $scope.distMag = "---";
        callback();
      }
      // si la distance du mobile par rapport au centre du mag est <= 50 mètres i.e. le mobile est toujours dans le magasin
      else{
        // arrondi de la distance à un chiffre après la virgule
        $scope.distMag = Number((_distTmp).toFixed(1));
        // on indique au serveur que le mobile est toujours dans le lieu
        postTjrsDansMag();
      }
    });
  }



  // parcours de la liste des magasins dans le coin (appel récursif)
  var browsePlacesList = function (n, callback) {
    if (n < $rootScope.placesList.length) {
      var latmag=$rootScope.placesList[n].lat;
      var longmag=$rootScope.placesList[n].lon;
      _idMag = $rootScope.placesList[n].id;
      _nomMag = $rootScope.placesList[n].username;
      var dist;

      // calcul de la distance par rapport au lieu
      getDistance(latmag, _maLat, longmag, _maLong, function(){
        var distance = _distTmp;
        // si distance < 50 mètres i.e. mobile dans le magasin
        if (distance<=50) {
          _latMag = latmag;
          _longMag = longmag;
          _distMag = distance;
          // récupération de la distance pour l'afficher dans l'interface 'Home'
          $scope.distMag = Number((_distMag).toFixed(1));

          // on informe alors que le mobile vient de rentrer dans ce magasin
          ifEntreMag(function(){
            postEntreMag();
          });

        }
        // sinon i.e. mobile pas dans ce magasin
        else{
          // on rappelle la fonction pour tester avec le prochain magasin
          browsePlacesList(n+1);
        }
      });
    }

    // si aucun magasin dans les alentours
    else if($rootScope.placesList.length === 0){
      $scope.nomMag = "aucun magasin";
    }
  };



  // si le mobile rentre dans un magasin
  function ifEntreMag(callback){
    // récupération du nom du magasin pour l'afficher dans l'interface 'Home'
    $scope.nomMag = _nomMag;

    // création de l'objet à envoyer au serveur pour communiquer l'entrée dans ce magasin
    _envoi={};
    _envoi.tabGenres = $scope.genresPreferes;
    _envoi.magasinId = _idMag;
    _envoi.idUser = Spotify.getCurrentUserId();

    $rootScope.idMag = _idMag;
    callback();
  }



  // si le mobile sort d'un magasin
  function ifSortMag(callback){
    $scope.nomMag = "-- aucun magasin --";

    // création de l'objet à envoyer au serveur pour communiquer la sortie de ce magasin
    _envoi={};
    _envoi.tabGenres = $scope.genresPreferes;
    _envoi.magasinId = _idMag;
    _envoi.idUser = _idUser;

    callback();
  }



  // POST au serveur si entrée dans un magasin
  function postEntreMag(){
    // si le mobile est connecté sur l'application (et non pas sur l'interface de connexion suite au clic sur le bouton "Déconnexion")
    if ($rootScope.connected) {
      // on indique pour les prochains appels que le mobile est actuellement géolocalisé dans un magasin
      $rootScope.isinstore=true;

      $http({
        method: 'POST',
        url: 'http://<server_url>:<server_port>/entremag',
        headers: {
          'Content-Type': 'application/json'
        },
        data: _envoi
      }).then(function successCallback(response) {
        console.log(response);
      }, function errorCallback(response) {
        console.log(response);
      });

    }
  }



  // POST au serveur si sortie d'un magasin
  function postSortMag(){
    // si le mobile est connecté sur l'application (et non pas sur l'interface de connexion suite au clic sur le bouton "Déconnexion")
    if ($rootScope.connected){
      // on indique pour les prochains appels que le mobile n'est actuellement plus géolocalisé dans un magasin
      $rootScope.isinstore=false;

      $http({
        method: 'POST',
        url: 'http://<server_url>:<server_port>/sortmag',
        headers: {
          'Content-Type': 'application/json'
        },
        data: _envoi
      }).then(function successCallback(response) {
        console.log(response);
      }, function errorCallback(response) {
        console.log(response);
      });

    }
  }



  // POST au serveur pour indiquer que le mobile est toujours dans le même magasin
  function postTjrsDansMag(){
    $http({
      method: 'POST',
      url: 'http://<server_url>:<server_port>/tjrsdansmag/'+Spotify.getCurrentUserId()
    }).then(function successCallback(response) {
      console.log(response);
    }, function errorCallback(response) {
      console.log(response);
    });
  }



  // calcul de la distance en mètres (float)
  function getDistance(lat1, lat2, lon1, lon2, callback){

    // lancement d'une exception si les coordonnées des 2 points ne sont pas exprimable en float
    if(parseFloat(lat1) != lat1 || parseFloat(lon1) != lon1 || parseFloat(lat2) != lat2 || parseFloat(lon1) != lon1)
    throw("Erreur. Mauvais paramètres. Type attendu : float.");

    // lancement d'une exception si pas: 0 <= lat <= 90
    if(lat1 < 0 || lat1 > 90 || lat2 < 0 || lat2 > 90)
    throw("Erreur. Mauvais paramètres. Les paramètres lat1 et lat2 doivent être 0<= ? <=90. Ici, lat1 = "+lat1+" et lat2 = "+lat2);

    // lancement d'une exception si pas: -180 <= lon <= 180
    if(lon1 < -180 || lon1 > 180 || lon2 < -180 || lon2 > 180)
    throw("Erreur. Mauvais paramètres. Les paramètres lon1 et lon2 doivent être -180<= ? <=180. Ici, lon1 = "+lon1+" et lon2 = "+lon2);

    var a = Math.PI / 180;
    var lalat1 = lat1 * a;
    var lalat2 = lat2 * a;
    var lalon1 = lon1 * a;
    var lalon2 = lon2 * a;

    var t1 = Math.sin(lalat1) * Math.sin(lalat2);
    var t2 = Math.cos(lalat1) * Math.cos(lalat2);
    var t3 = Math.cos(lalon1 - lalon2);
    var t4 = t2 * t3;
    var t5 = t1 + t4;

    // conversion de la distance en radians
    var rad_dist = Math.atan(-t5/Math.sqrt(-t5 * t5 +1)) + 2 * Math.atan(1);

    // la distance en mètres (float)
    var dist = (rad_dist * 3437.74677 * 1.1508) * 1.6093470878864446 * 1000;

    _distTmp = dist;
    callback();
  }

});



//###########################################################################################
//Ctrl de la connexion à Spotify qui amène à l'interface 'Home'
//###########################################################################################
wipesoundController.controller('LoginCtrl', function ($scope, Spotify, $rootScope, $state, $window, $http, $ionicLoading, $timeout, $ionicPopup){

  //les genres par défaut = les genres les plus représentés dans dans Spotify (d'après l'API d'Echo Nest)
  $rootScope.genresParDefaut = {
    "rock" : 0,
    "00s" : 0,
    "pop" : 0,
    "house" : 0,
    "jazz" : 0,
    "country" : 0,
    "club" : 0,
    "dance" : 0,
    "soul" : 0,
    "hip hop" : 0,
    "blues" : 0,
    "folk" : 0,
    "punk" : 0,
    "metal" : 0,
    "classical" : 0,
    "rap" : 0,
  };

  // les 3 genres préférés de l'utilisateur (genre + nb d'occurences)
  $rootScope.genresPreferes = [
    {
      genre: '',
      nb: 0
    },
    {
      genre: '',
      nb: 0
    },
    {
      genre: '',
      nb: 0
    },
  ];



  // afficher un dégradé (pour la transition entre la connexion Spotify et l'interface 'Home')
  $scope.show = function() {
    $ionicLoading.show({
      template: '<ion-spinner icon="android"></ion-spinner><br/>Chargement...'
    });
  };


  // masquer le dégradé de chargement ci-dessus
  $scope.hide = function(){
    $ionicLoading.hide();
  };


  // connexion Spotify
  // @mail le mail saisi par l'utilisateur correspondant au mail du compte Spotify
  $scope.login = function(mail){
    // si pas de mail saisi
    if (!mail) {
      // Pop up de type "alert"
      $ionicPopup.alert({
        title: 'Saisissez votre email Spotify !'
      });
    }

    else{
      // ouverture de l'interface de connexion Spotify via le serveur
      // intégration dans l'application grâce au plugin Cordova 'InAppBrowser'
      var ref = window.open('http://<server_url>:<server_port>/loginspotifymobilestart', 'location=yes');

      // événement suite à la fermeture de cette fenêtre de connexion via le serveur
      ref.addEventListener('exit', function() {
        // affichage du dégradé de chargement
        $scope.show();
        // requête GET pour récupérer le token Spotify
        $http({
          method: 'GET',
          url: 'http://<server_url>:<server_port>/mobiletoken/'+mail
        }).then(function successCallback(response) {
          // sauvegarde du token récupéré dans l'objet Spotify
          Spotify.setAuthToken(response.data);

          Spotify.getCurrentUser().then(function (data) {
            // sauvegarde de l'id Spotify dans l'objet Spotify
            Spotify.setCurrentUserId(data.id);
            // récupération des playlists pour pouvoir les afficher dans l'interface "Mes playlists"
            $scope.displayUserPlaylists();
          });

          // l'utilisateur est maintenant connecté
          $rootScope.connected = true;
        }, function errorCallback(response) {
          console.log(response);
        });
      });
    }
  };


  // récupération des inforamtions des playlists pour pouvoir les afficher dans l'interface "Mes playlists"
  $scope.displayUserPlaylists = function () {
    // récupération des playlists
    Spotify.getUserPlaylists().then(function (data) {
      $rootScope.userPlaylists = data.items;

      // parcours des playlists
      $rootScope.userPlaylists.forEach(function(playlist) {

        // parcours des tracks (titres) de chaque playlist
        Spotify.getPlaylistTracks(playlist.id, playlist.owner.id).then(function (data) {
          // récupération de l'artiste de chaque titre

          data.items.forEach(function(element,index, array){
            var p = "http://developer.echonest.com/api/v4/artist/profile?api_key=<echonest_api_key>&id=spotify-WW:artist:"+element.track.artists[0].id+"&bucket=genre&format=json";

            // appel à l'API Echo Nest pour obtenir le genre musical de chaque titre à travers son artiste
            $.get(p, function(data){
              for (var genre in $rootScope.genresParDefaut) {
                // si le genre retourné par Echo Nest correspond à un genre présent dans le json de genres genresParDefaut
                if(data.response.artist.genres[0].name.indexOf(genre) != -1){
                  //on incrémente la valeur associée au genre dans le json genresParDefaut
                  $rootScope.genresParDefaut[genre]++;
                }
              }
            });
          });
        });
      });
    });

    // récupération du top 3 des genres musicaux de l'utilisateur
    findTop();
  };


  // calcul du top 3 des genres musicaux de l'utilisateur
  function findTop(){
    $timeout(displayGenrePref, 1500);
  }


  // calcul du top 3 des genres musicaux de l'utilisateur
  function displayGenrePref(){
    var genrePrefTmp = [];
    // parcours de=u json de genres genresParDefaut
    for(var a in $rootScope.genresParDefaut){
      // copie par valeur (et non par adresse ) de genresParDefaut dans genrePrefTmp
      genrePrefTmp.push([a,$rootScope.genresParDefaut[a]]);
    }

    // tri du json par les valeurs
    genrePrefTmp.sort(
      function(a,b){
        return a[1] - b[1];
      }
    );

    // inversion du json clé<=>valeur pour connaître le nb d'occurences (valeur) associé à chaque genre (clé)
    genrePrefTmp.reverse();

    //on récupère le top 3 des genres
    $rootScope.genresPreferes[0].genre = genrePrefTmp[0][0];
    $rootScope.genresPreferes[0].nb = genrePrefTmp[0][1];
    $rootScope.genresPreferes[1].genre = genrePrefTmp[1][0];
    $rootScope.genresPreferes[1].nb = genrePrefTmp[1][1];
    $rootScope.genresPreferes[2].genre = genrePrefTmp[2][0];
    $rootScope.genresPreferes[2].nb = genrePrefTmp[2][1];

    // on masque le dégradé de chargement une fois les appels à Echo Nest finis et le top 3 récupéré
    $scope.hide();
    // redirection page d'accueil
    $state.go('menu.home');
  }

});



//###########################################################################################
//Ctrl de 'Mon profil'
//###########################################################################################
wipesoundController.controller('Mon_profilCtrl', function ($scope, Spotify, $rootScope, $state){

  // options du diagramme à bâtons
  $scope.graphOptions = {
    chart: {
      type: 'discreteBarChart',
      height: 450,
      margin : {
        top: 30,
        right: 20,
        bottom: 60,
        left: 30
      },
      x: function(d){ return d.label; },
      y: function(d){ return d.value; },
      showValues: true,
      valueFormat: function(d){
        return d3.format(',f')(d);
      },
      transitionDuration: 500,
      xAxis: {
        "rotateLabels": 30
      },
      yAxis: {
        tickFormat: function(d){ return d3.format(',f')(d); },
        axisLabelDistance: 30
      }
    }
  };

  // données du diagramme
  $scope.graphDatas = [{
    values: [
      { "label" : "Rock" , "value" : (parseInt($rootScope.genresParDefaut.rock, 10)) },
      { "label" : "00s" , "value" : (parseInt($rootScope.genresParDefaut["00s"], 10))},
      { "label" : "Pop" , "value" : (parseInt($rootScope.genresParDefaut.pop, 10))},
      { "label" : "House" , "value" : (parseInt($rootScope.genresParDefaut.house, 10))},
      { "label" : "Jazz" , "value" : (parseInt($rootScope.genresParDefaut.jazz, 10))},
      { "label" : "Country" , "value" : (parseInt($rootScope.genresParDefaut.country, 10))},
      { "label" : "Club" , "value" : (parseInt($rootScope.genresParDefaut.club, 10))},
      { "label" : "Dance" , "value" : (parseInt($rootScope.genresParDefaut.dance, 10))},
      { "label" : "Soul" , "value" : (parseInt($rootScope.genresParDefaut.soul, 10))},
      { "label" : "Hip hop" , "value" : (parseInt($rootScope.genresParDefaut["hip hop"], 10))},
      { "label" : "Blues" , "value" : (parseInt($rootScope.genresParDefaut.blues, 10))},
      { "label" : "Folk" , "value" : (parseInt($rootScope.genresParDefaut.folk, 10))},
      { "label" : "Punk" , "value" : (parseInt($rootScope.genresParDefaut.punk, 10))},
      { "label" : "Metal" , "value" : (parseInt($rootScope.genresParDefaut.metal, 10))},
      { "label" : "Classical" , "value" : (parseInt($rootScope.genresParDefaut.classical, 10))},
      { "label" : "Rap" , "value" : (parseInt($rootScope.genresParDefaut.rap, 10))}
    ]
  }];

});



//###########################################################################################
//Ctrl de la map 'Wipesound dans le coin'
//###########################################################################################
wipesoundController.controller('Wipesound_dans_le_coinCtrl', function ($scope, $rootScope,  $cordovaGeolocation, $stateParams, $ionicPopup, LocationsService, InstructionsService){

  // lors du chargement de la map
  $scope.$on("$stateChangeSuccess", function() {
    // récupération des markers (magasins)
    $scope.locations = LocationsService.savedLocations;
    $scope.newLocation;

    // lors de la première ouverture de la map
    if(!InstructionsService.instructions.newLocations.seen) {
      InstructionsService.instructions.newLocations.seen = true;

      // paramètres de la map
      $scope.map = {
        defaults: {
          tileLayer: 'http://{s}.tile.osm.org/{z}/{x}/{y}.png',
          maxZoom: 18,
          zoomControlPosition: 'bottomleft'
        },
        markers : {},
        events: {
          map: {
            enable: ['context'],
            logic: 'emit'
          }
        }
      };

      // affichage des markers
      setMarkers();

      // centrage de la map sur la position courante du mobile
      $scope.locate();
    }

    // centrage de la map sur la position courante du mobile
    $scope.locate();
  });

  // objet Location
  var Location = function() {
    if ( !(this instanceof Location) ) return new Location();
    this.lat  = "";
    this.lng  = "";
    this.name = "";
  };

  // affichage des markers (i.e. les magasins dans les alentours)
  var setMarkers = function() {
    // parcours des markers
    for (var i = 0; i < LocationsService.savedLocations.length; i++) {
      $scope.map.markers[i] = {
        lat:LocationsService.savedLocations[i].lat,
        lng:LocationsService.savedLocations[i].lng,
        // message au clic sur le marker sur la map
        message: LocationsService.savedLocations[i].name,
        // on ne fait le focus que sur le mobile
        focus: false,
        // marker non déplacable sur la map
        draggable: false
      };
    }
  };

  // centrage de la map sur la position courante du mobile
  $scope.locate = function(){
    $cordovaGeolocation.getCurrentPosition().then(function (position) {
      $scope.map.center  = {
        lat : position.coords.latitude,
        lng : position.coords.longitude,
        zoom : 100
      };

      $scope.map.center.lat  = position.coords.latitude;
      $scope.map.center.lng = position.coords.longitude;
      $scope.map.center.zoom = 100;

      // marker du mobile sur la map
      $scope.map.markers.now = {
        lat:position.coords.latitude,
        lng:position.coords.longitude,
        message: "Vous êtes ici",
        focus: true,
        draggable: false
      };

    }, function(err) {
      console.log("Location error!");
      console.log(err);
    });

  };

});
