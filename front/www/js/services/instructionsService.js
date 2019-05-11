//###########################################################################################
//SERVICE POUR L'INITIALISATION DE LA MAP
//###########################################################################################
angular.module('wipesoundApp').factory('InstructionsService', [ function() {

  var instructionsObj = {};

  instructionsObj.instructions = {
    newLocations : {
      text : 'To add a new location, tap and hold on the map',
      seen : false
    }
  };

  return instructionsObj;

}]);
