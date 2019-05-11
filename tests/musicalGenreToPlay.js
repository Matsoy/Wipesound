var genrePrefTmp = [];
var genreToPlay = "";
// si tous les genres sont à 0
var testWithZero = false;
// si 2 genres sont top
var testWithAnEquality = false;
// si 1 genre est seul en tête
var testNormal = false;

// ###########################################
// test testWithZero  ########################
// ###########################################

console.log('#######################');
console.log('test testWithZero');
console.log('#######################');
var tabGenres = {
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
  "rap" : 0
};

for(var a in tabGenres){
  genrePrefTmp.push([a,tabGenres[a]]);
}
genrePrefTmp.sort(
  function(a,b){
    return a[1] - b[1];
  }
);
genrePrefTmp.reverse();
//on récupère le top 3 des genres
genreToPlay = genrePrefTmp[0][0];
console.log("genre à jouer = "+genreToPlay);
console.log();
if (genreToPlay === 'rap') {
  testWithZero = true;
}

// ###########################################
// test testWithAnEquality  ##################
// ###########################################

console.log('#######################');
console.log('test testWithAnEquality');
console.log('#######################');

var tabGenres = {
  "rock" : 0,
  "00s" : 0,
  "pop" : 2,
  "house" : 0,
  "jazz" : 0,
  "country" : 1,
  "club" : 0,
  "dance" : 0,
  "soul" : 0,
  "hip hop" : 0,
  "blues" : 2,
  "folk" : 0,
  "punk" : 0,
  "metal" : 2,
  "classical" : 0,
  "rap" : 0
};


for(var a in tabGenres){
  genrePrefTmp.push([a,tabGenres[a]]);
}
genrePrefTmp.sort(
  function(a,b){
    return a[1] - b[1];
  }
);
genrePrefTmp.reverse();
//on récupère le top 3 des genres
genreToPlay = genrePrefTmp[0][0];
console.log("genre à jouer = "+genreToPlay);
console.log();
if (genreToPlay === 'pop') {
  testWithAnEquality = true;
}

// ###########################################
// test testNormal  ##########################
// ###########################################

console.log('#######################');
console.log('test testNormal');
console.log('#######################');

var tabGenres = {
  "rock" : 2,
  "00s" : 0,
  "pop" : 0,
  "house" : 3,
  "jazz" : 0,
  "country" : 1,
  "club" : 0,
  "dance" : 0,
  "soul" : 0,
  "hip hop" : 0,
  "blues" : 2,
  "folk" : 0,
  "punk" : 0,
  "metal" : 12,
  "classical" : 0,
  "rap" : 0
};


for(var a in tabGenres){
  genrePrefTmp.push([a,tabGenres[a]]);
}
genrePrefTmp.sort(
  function(a,b){
    return a[1] - b[1];
  }
);
genrePrefTmp.reverse();
//on récupère le top 3 des genres
genreToPlay = genrePrefTmp[0][0];
console.log("genre à jouer = "+genreToPlay);
console.log();
if (genreToPlay === 'metal') {
  testNormal = true;
}

// ###########################################
// resultat des tests  #######################
// ###########################################

console.log('#######################');
console.log('conclusion des test');
console.log('#######################');

if (testNormal && testWithAnEquality && testWithZero) {
  console.log("===> SUCCES");
}
else {
  console.log("===> ERREUR");
}
