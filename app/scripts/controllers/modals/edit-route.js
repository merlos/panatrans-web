//
// Edit Routes of a Stop Modal Controller
//
angular.module('panatransWebApp')
.controller('EditRouteModalInstanceCtrl', function ($scope, $http, $modalInstance, route, stopsArr) {
    
$scope.sortedStopSequences = {};
$scope.unknownStopSequences = {};
// updates the route model by getting a fresh version from the server


var updateRoute = function() { 
  $http.get(SERVER_URL + '/v1/routes/' + $scope.route.id + '?' + DELAY)
  .success(function(response) {
    //console.log('success getting route detail');
    $scope.route = response.data;
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
    
        
$scope.loading = true;
$scope.route = route;
$scope.stopsArr = stopsArr; //all the stops
$scope.newStopSequence = {};
$scope.dragControlListeners = {};
    
    
$.each(route.trips, function(index, trip){
      
  // initialize newStopSequence for each trip
  // note: we are not creating a stop, we are creating a stop sequence, the link 
  // between a trip and a stop 
  $scope.newStopSequence[trip.id] = {
    stop: null,
    trip: trip,
    sequence: UNKNOWN_STOP_SEQUENCE
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
        $http.put(SERVER_URL + '/v1/stop_sequences/' + stopSequence.id, putData)
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
        $http.put(SERVER_URL + '/v1/stop_sequences/' + stopSequence.id, putData)
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
              
if (route.trips[0].stops) {
  $scope.loading = false;
} else {
  updateRoute();
}
    
    

$scope.updateRouteName = function(){
  console.log('updateRouteName');
  $http.put(SERVER_URL + '/v1/routes/' + $scope.route.id, {route: {name: $scope.route.name}})
  .success(function() {
    //TODO display some kind of feedback
    console.log('route successfully updated');
  })
  .error(function(){
    console.log('error updating rooute');
  });
  
};    
    
    
$scope.deleteStopSequence = function (stopSequence) {
  $http.delete(SERVER_URL + '/v1/stop_sequences/' + stopSequence.id)
  .success( function(response) {
    console.log('removed stop sequence success!');
    updateRoute();
  });
};
    
    
// Add stop to a trip 
// Position: -1 unk, 0 => beginning, > 1 000 000 => end
$scope.addStopToTrip = function (tripId) {
  var unknownSequence = false;
  console.log('stopSequence:' + $scope.newStopSequence[tripId].sequence);
      
  if ($scope.newStopSequence[tripId].sequence === UNKNOWN_STOP_SEQUENCE) {
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
      
  $http.post(SERVER_URL + '/v1/stop_sequences/', postData)
  .success(function(response) {
    updateRoute();
  });
};
        
$scope.close = function () {
  $modalInstance.close();
};
}
);  