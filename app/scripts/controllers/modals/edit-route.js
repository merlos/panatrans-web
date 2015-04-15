//
// Edit Routes of a Stop Modal Controller
//
angular.module('panatransWebApp')
.controller('EditRouteModalInstanceCtrl', function ($scope, $http, ngToast, $modalInstance, route, stopsArr) {
    
$scope.sortedStopSequences = {};
$scope.unknownStopSequences = {};
$scope.isNewRoute = false;
// updates the route model by getting a fresh version from the server        
$scope.loading = true;
$scope.route = route;
var serverRoute = angular.copy(route); //last version of the route that came from server. Useful to check if there is any difference between server version and model version (scope.route)

$scope.showNewStopSequence = {}; 
$scope.newStopSequence = {};
$scope.dragControlListeners = {};

var updateRoute = function() { 
  $http.get(_CONFIG.serverUrl + '/v1/routes/' + $scope.route.id + '?' + _CONFIG.delay)
  .success(function(response) {
    //console.log('success getting route detail');
    $scope.route = response.data;
    serverRoute = angular.copy(response.data);
    $scope.loading = false;
    //console.log($scope.route);
    //for each trip create an array with all sorted sequences (stop_sequence.sequence != null)
    $.each($scope.route.trips, function(index, trip){
      $scope.sortedStopSequences[trip.id] = []; 
      $scope.unknownStopSequences[trip.id] = []; 
      /*jshint camelcase: false */
      $.each(trip.stop_sequences, function(index, stopSequence){
        if (stopSequence.sequence !== null) {
          $scope.sortedStopSequences[trip.id].push(stopSequence);
          //console.log($scope.sortedStopSequences[trip.id]);
        } else {
          $scope.unknownStopSequences[trip.id].push(stopSequence);
        }
      });
    });
  })
  .error(function(response){
    console.log('WTF! Something wrong with the route!');
    console.log(response);
  });
};
  
// load stopsArr
//TODO DRY this, it should be a service
if (stopsArr == null) {
  console.log('requesting stops to server...');
 //get stops
  $http.get(_CONFIG.serverUrl + '/v1/stops/' + $scope.route.id + '?' + _CONFIG.delay)
  .success(function(response) {
    $scope.stopsArr = response.data;
  });
} else {
  $scope.stopsArr = stopsArr; //all the stops
}
    

//////////// MAIN ////////////////////////

//if  new route
if (route == null) {
  route = {trips: []};
  $scope.route = route;
  $scope.isNewRoute = true;
  $scope.loading = false;
} 
    
$.each(route.trips, function(index, trip){    
  // initialize newStopSequence for each trip
  // note: we are not creating a stop, we are creating a stop sequence, the link 
  // between a trip and a stop 
  $scope.newStopSequence[trip.id] = {
    stop: null,
    trip: trip,
    sequence: null
  }; 
      
  //create dragControlListeners for ng-sortable
  //  - We have a set of trips 
  //  - On each trip we have sorted and unsorted sequences
      
  $scope.dragControlListeners[trip.id] = {};
  $.each(['sorted', 'unknown'] , function(index, sortStatus) {
    console.log(sortStatus + ' -------'  + trip.id);
        
    $scope.dragControlListeners[trip.id][sortStatus] = {
      accept: function (sourceItemHandleScope, destSortableScope, destItemScope) {
        //override to determine drag is allowed or not. default is true.
        /*console.log('sourceItem: ');
        console.log(sourceItemHandleScope);
        console.log('destSortable');
        console.log(destSortableScope);*/
        //return sourceItemHandleScope.itemScope.sortableScope.$id === destSortableScope.$id; 
        return true;         
      },
      /*
      dragStart: function (event) {
      console.log('drag start');
      console.log(event);
      },
      dragEnd: function (event) {
      console.log('drag end');
      console.log(event);
      },
      */
      itemMoved: function (event) {
        //Do what you want
        console.log('source sort' + sortStatus); //source status
        console.log('source trip.id' + trip.id); //source trip
        console.log('itemMoved');
        console.log(event);
        console.log('nueva posición: ' + (event.dest.index));
        console.log('dest trip:' + event.dest.sortableScope.$parent.trip.id);
        console.log('src seq:' + event.source.itemScope.modelValue.sequence);
        console.log('dest sortStatus' + event.dest.sortableScope.options.containment.indexOf('unknown'));
            
            
        var destTrip = event.dest.sortableScope.$parent.trip; //destination Trip
        var stopSequence = event.source.itemScope.modelValue;
            
        var putData;
        //change trip?
        if (destTrip.id === trip.id) { //same trip
          if (stopSequence.sequence === null) { //moved to a sorted position
            stopSequence.sequence = event.dest.index;
            putData = {
              'stop_sequence': {
                'sequence': event.dest.index
              }
            };
          } else { //was moved to a unknown position
            stopSequence.sequence = null;
            putData = { 
              'stop_sequence': {
                'unknown_sequence' : true
              }
            };
          }
        } else { // != trip => we move it to the other trip but in unknown position
          if (event.dest.sortableScope.options.containment.indexOf('unknown') === 0) { 
            stopSequence.sequence = null;
            putData = {
              'stop_sequence': {
                'unknown_sequence' : true,
                'trip_id' : destTrip.id
              }
            };
          } else {
            stopSequence.trip = destTrip;
            stopSequence.sequence = event.dest.index;
            putData = {
              'stop_sequence': {
                'sequence': event.dest.index,
                'trip_id' : destTrip.id
              }
            }; 
          }
        }
        //put data
        console.log('putData');
        //console.log(putData.stop_sequence);
        console.log(stopSequence);
        $http.put(_CONFIG.serverUrl + '/v1/stop_sequences/' + stopSequence.id, putData)
        //download route with the updated data
        .success( function() {
          //console.log('updated stop sequence!');
          updateRoute();
        });
            
      },
      orderChanged: function(event) {
        console.log('orderChanged ');
        console.log('nueva posición: ' + (event.dest.index));
        console.log(event);
        //if we changed the order on the list of uordered items do nothing on the server
        if (event.dest.sortableScope.options.containment.indexOf('unknown') === 0) { 
          return;
        }
        var newSequence = event.dest.index;
        var stopSequence = event.source.itemScope.modelValue;
        console.log('nueva posición: ' + (event.dest.index));
        //Update Sequence
        var putData = {'stop_sequence': {sequence: newSequence} };
        $http.put(_CONFIG.serverUrl + '/v1/stop_sequences/' + stopSequence.id, putData)
        //download route with the updated data
        .success( function() {
          console.log('updated stop sequence!');
          updateRoute();
        });
      },
      //containment is used
      containment: sortStatus + '_' + trip.id
    };
  }); //sorted
});
//console.log($scope.newStopSequence);
console.log($scope.dragControlListeners);
  
//the route has trips and one of them has stops defined => we already downloaded the route
// note: route has no trips => will always update the route.
if ((route.trips.length > 0) && route.trips[0].stops) {
  $scope.loading = false;
  
} else {
  if (! $scope.isNewRoute) { 
    updateRoute(); //downloads route to sync it with server version.
  }
}
   
$scope.addNewRoute = function() {
  console.log('add new Route');
  $http.post(_CONFIG.serverUrl + '/v1/routes/', {route: {name: $scope.route.name}})
  .success(function(response) {
    //TODO display some kind of feedback
    ngToast.create('Ruta creada. Ahora sigue completando la información');
    console.log('route successfully created');
    $scope.route = response.data;
    $scope.serverRoute = angular.copy(route);
    $scope.isNewRoute = false;
  })
  .error(function(data, status){
    var errors = data.errors.name.join(', ') || '';
    ngToast.create({className: 'danger', contents: 'Error: ' + errors});
    console.log(data);
    console.log(status);
    console.log('Error creating route');
  });
};  

$scope.deleteRoute = function() {
  console.log('delete route');
  $http.delete(_CONFIG.serverUrl + '/v1/routes/' + $scope.route.id)
  .success(function(response) {
    //TODO display some kind of feedback
    ngToast.create('Ruta eliminada');
    $modalInstance.dismiss('routeDeleted');
    
  })
  .error(function(data, status){ // TODO test
    var errors = data.errors.name.join(', ') || '';
    ngToast.create({className: 'danger', contents: 'Error: ' + errors});
    console.log(data);
    console.log(status);
    console.log('Error deleting route');
  });
  
} 
    
$scope.updateRouteName = function(){
    
  if ($scope.isNewRoute) {
    return; //if is new route let the user press add route button
  }
  console.log('updateRouteName');
  if ($scope.route.name === serverRoute.name) { 
    return; //only update if model changed
  }
  $http.put(_CONFIG.serverUrl + '/v1/routes/' + $scope.route.id, {route: {name: $scope.route.name}})
  .success(function() {
    //TODO display some kind of feedback
    ngToast.create('Se ha actualizado el nombre de la ruta');
    console.log('route name successfully updated');
  })
  .error(function(data, status){  
    var errors = data.errors.name.join(', ') || '';
    ngToast.create({className: 'danger', contents: 'Error: ' + errors});
    console.log(data);
    console.log(status);
    console.log('Error updating route name');
  });
};   
$scope.updateRouteUrl = function(){
  console.log('updateRouteUrl');
  if ($scope.route.url === serverRoute.url) { 
    return; // only update if model changed
  }
  $http.put(_CONFIG.serverUrl + '/v1/routes/' + $scope.route.id, {route: {url: $scope.route.url}})
  .success(function() {
    //TODO display some kind of feedback
    ngToast.create('Se ha actualizado la dirección web');
    console.log('route name successfully updated');
  })
  .error(function(){
    ngToast.create({className: 'danger', contents:'Error: ' + errors});
    console.log(data);
    console.log(status);
    console.log('error updating route');
  });
  
};    
     
    
$scope.deleteStopSequence = function (stopSequence) {
  $http.delete(_CONFIG.serverUrl + '/v1/stop_sequences/' + stopSequence.id)
  .success( function(response) {
    ngToast.create('Se eliminado la parada del trayecto');
    console.log('removed stop sequence success!');
    updateRoute();
  });
};

// tripType: one of these values: one, circular, two
// routeName: name of the route. Shall have the format A -  B - C
// output:
//  one:  returns ["C"] if not an exception
//  circular: returns ["circular"]
//  two: returns ["C", "A"]. 

var getTripHeadsignFromRouteName = function(routeTripType, routeName) {
// exceptions of stop names
  var exceptions = /transfer|tranfer|corredor|circular/i;
  
  var nameArr = routeName.split("-");
  var a = false;
  var c = false;
  angular.forEach(nameArr, function(value, key) { 
    var tripName = nameArr[key].trim();
    if (! tripName.match(exceptions)) { 
      a ? (c = tripName) : (a = tripName);
    }
  });
  // routeName = 'stop a - stop b - stop c - transfer' 
  //  =>  a = 'stop a'; 
  //      c = 'stop c'
  switch(routeTripType) {
    case 'one': 
      return [c];
      break;
    case 'circular':
      return ['circular'];
      break;  
    case 'two':
      return [c, a];
      break;
    default: 
      return undefined
  }
};

$scope.routeHasTrips = function() {
  return ($scope.route.trips !== undefined) && ($scope.route.trips.length !== 0)
};

//creates the trips for the current route
$scope.addTripsToRoute = function() {
  //depending on the type of 
  console.log('addTripsToRoute. tripsType:' + $scope.route.tripsType);
  console.log(getTripHeadsignFromRouteName($scope.route.tripsType, $scope.route.name));
  var headsign = getTripHeadsignFromRouteName($scope.route.tripsType, $scope.route.name);
  //headlines is an array with two strings 
  //create one or two trips;
  if (headsign === undefined) {
    ngToast({className: 'danger', contents: 'Error. Revisa que el nombre de la ruta tenga el formato adecuado.'});
    return;
  }
  var responses = 0; 
  angular.forEach(headsign, function(value, key) {
    console.log(value);
    console.log(key);
    var trip = {headsign: value, direction: key, route_id: $scope.route.id};
    $http.post(_CONFIG.serverUrl + '/v1/trips/', {trip: trip})
    .success(function(response) {
      console.log("added trips to route");
      ngToast.create('Se ha añadido el trayecto ' + response.data.headsign);
      if (++responses === headsign.length) {
        updateRoute();
      };
      
    })
    .error(function(data, status) {
      console.log("error updating trip");
      console.log(data.errors);
      console.log(status);
      if (status != 422) {
        ngToast('Humm! Error raro. Si el error persiste, probablemente tengas que contactar con los administradores');
      }
      //var errors = data.errors.join(', ') || '';
      var errors = ""; //TODO
      ngToast.create('Hubo problema a al añadir el trayecto: ' + errors);
      if (++response === headsign.length) {
        updateRoute();
      }
    }); 
  });
};    
    
$scope.deleteTrips = function() {
  console.log("deleteTrips. number to delete = " + $scope.route.trips.length)
  var tripsDeleted = 0;
  angular.forEach($scope.route.trips, function(trip) {
    $http.delete(_CONFIG.serverUrl + '/v1/trips/' + trip.id)
      .success(function(response) {
        if (++tripsDeleted === $scope.route.trips.length) {
          updateRoute();
        };
    })
    .error(function(data, status) {
      console.log("error updating trip");
      console.log(data.errors);
      console.log(status);
      if (status != 422) {
        ngToast('Humm! Error raro. Si el error persiste, probablemente tengas que contactar con los administradores');
      }
      //var errors = data.errors.join(', ') || '';
      var errors = ""; //TODO --
      ngToast.create('Hubo problema al borrar los trayectos: ' + errors);
      if (++response === $scope.route.trips.length) {
        updateRoute();
      }
    }); 
  });
}    

// returns true if trips have stops (stop_sequences)
$scope.tripsHaveStops = function() {
  var haveStops = false;
  angular.forEach($scope.route.trips, function(trip) {
    if ((trip.stop_sequences !== undefined) && (trip.stop_sequences.length > 0)) {
      haveStops = true;
    }
  });
  return haveStops;
};
    
    
// Add stop to a trip 
// Position: -1 unk, 0 => beginning, > 1 000 000 => end
$scope.addStopToTrip = function (tripId) {
  var unknownSequence = false;
  console.log('stopSequence:' + $scope.newStopSequence[tripId].sequence); 
  if ($scope.newStopSequence[tripId].sequence === -1) {
    unknownSequence = true;
  }
  var postData =  {
    'stop_sequence': {
      'sequence': $scope.newStopSequence[tripId].sequence, 
      'unknown_sequence': unknownSequence,
      'stop_id': $scope.newStopSequence[tripId].stop.id,
      'trip_id': tripId
    }
  };
      
  console.log('addStopToTrip postData:');
  console.log(postData);
      
  $http.post(_CONFIG.serverUrl + '/v1/stop_sequences/', postData)
  .success(function(response) {
    updateRoute();
    ngToast.create('Se ha añadido la parada al trayecto.');
    $scope.showNewStopSequence[tripId] = true;
    $scope.newStopSequence[tripId].stop = null; 
  });
};
        
$scope.close = function () {
  $modalInstance.close();
};
}
);  