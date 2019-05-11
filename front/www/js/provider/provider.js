var wipesoundProvider = angular.module('wipesoundProvider', ['wipesoundController', 'spotify']);

wipesoundProvider.config(function (SpotifyProvider) {
  console.log("entre dans le provider");
  SpotifyProvider.setClientId('<spotify_client_id>');
  // SpotifyProvider.setRedirectUri('http://localhost:8000/android/www/callback.html');
  // SpotifyProvider.setRedirectUri('hellocordova://callback');
  SpotifyProvider.setRedirectUri('http://<server_url>:<server_port>/callback');
  /*DEFINITION DES SCOPES
  Wipesound pourra:

  user-read-private -> Accéder à vos informations publiques
  user-read-email -> Obtenir votre adresse e-mail
  user-read-birthdate -> Recevoir votre date de naissance
  playlist-read-collaborative -> Accéder à vos playlists collaboratives
  playlist-read-private -> Accéder à vos playlists privées
  playlist-modify-private -> Gérer vos playlists privées
  user-library-modify -> Gérer vos titres et albums sauvegardés
  user-follow-modify -> Gérer la liste des personnes que vous suivez
  playlist-modify-public -> Gérer vos playlists publiques
  user-library-read -> Accéder à vos titres et albums sauvegardés
  user-follow-read -> Accéder à la liste de vos abonnés et des personnes que vous suivez
  */

  SpotifyProvider.setScope('user-read-private user-read-email user-read-birthdate playlist-read-collaborative playlist-read-private playlist-modify-private user-library-modify user-follow-modify playlist-modify-public user-library-read user-follow-read');
});
