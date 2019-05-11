//###########################################################################################
//SERVICE CONTENANT LA LISTE DES MARKERS
//###########################################################################################
angular.module('wipesoundApp').factory('LocationsService', [ function() {

  var locationsObj = {};

  // liste des markers
  locationsObj.savedLocations = [];

  return locationsObj;
}]);
