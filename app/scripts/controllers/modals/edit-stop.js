//
// Edit the Routes of a Stop 
// Modal Controller
//
angular.module('panatransWebApp')
.controller('EditStopModalInstanceCtrl', function ($scope, $http, $modalInstance, routes, stop) {
  $scope.stop = stop;
  $scope.routes = routes;
  console.log(routes);
  
  $scope.tripNotAlready = function(obj) {
    var ret = true;
    $.each($scope.stop.routes, function(index, route) {
      $.each(route.trips, function(index, trip) {
        //console.log('obj: ' + obj.id + ' trip: ' + trip.id + "r:" + (trip.id == obj.id));
        if (trip.id === obj.id) {
          ret = false;
        }
      }); //route.trips
    }); //stop.routes
    return ret;
  };
  
  $scope.searchFilter = function (obj) {
    var re = new RegExp($scope.searchText, 'i');
    //console.log('searchFilter: ' + obj.name + ' result: ' + (!$scope.searchText || re.test(obj.name)));
    return !$scope.searchText || re.test(obj.name);
  };
  
  $scope.addTrip = function (tripId) {
    //update ui
    console.log('addTrip: ' + tripId);
    //update server stop_sequence for this trip and stop
    $http.post(SERVER_URL + '/v1/stop_sequences/', 
    {'stop_sequence': {
      'unknown_sequence': true, 
      'stop_id': $scope.stop.id, 
      'trip_id': tripId
    }})
    .success(function(response) {
      console.log('added trip to stop');
      console.log(response);
      var newTrip = response.data.trip;
        
      //Update local models
        
      var routeFound = false; // we don't know if the stop has already this route
      //Two possibilities:
      // 1. route is already in the stop.routes (only add the trip to that route)
      // 2. not in list, we need to add the route with the trip to stop.routes
      
      $.each($scope.stop.routes, function(index, route) {
        if(route.id === newTrip.route.id) {
          routeFound = true;
          $scope.stop.routes[index].trips.push(newTrip);
        } 
      }); 
      if (!routeFound) { //we need to add the route and the trip to the stop
        var routeWithTrip = newTrip.route;
        routeWithTrip.trips = [newTrip];
        $scope.stop.routes.push(routeWithTrip);
      }
        
    })
    .error(function(response) {
      console.log('error adding trip to stop');
      console.log(response);
    });
    //update local model
  };
  
  $scope.updateStopName = function() {
    console.log("updateStop");
    console.log($scope.stop);
    $http.put(SERVER_URL + '/v1/stops/' + $scope.stop.id, {stop: { name: $scope.stop.name}})
    .success(function(response){
      console.log("Stop successfully updated");
      //TODO feedback
    })
    .error(function(response) {
      console.log('error adding trip to stop');
      console.log(response);
    });

  };
  
  $scope.deleteStop = function() {
    if ($scope.stop.routes.length > 0) {
      console.log('ERROR: the stop has trips cannot be deleted');
      alert('No se puede borrar. Tienes que quitar todas las rutas que pasan por la parada antes de eliminarla.')
      return;
    }
    $http.delete(SERVER_URL + '/v1/stops/'+ $scope.stop.id)
    .success( function() {
      console.log('parada borrada del servidor con éxito');
      $modalInstance.dismiss('stopDeleted');
      
    })
    .error(function(data, status) {
      console.log('Error borrando la parada');
      console.log(data);
    });
  };
  
  $scope.changeStopLocation = function() {
    console.log("changeStopLocation Requested");
    //dismiss and set as reason: changeStopLocation so main controler with map handles it
    $modalInstance.dismiss('changeStopLocation');
  }
  
  $scope.deleteTrip = function(tripId) {
    $http.delete(SERVER_URL + '/v1/stop_sequences/trip/' + tripId + '/stop/' + $scope.stop.id)
    .success(function(response) {
      console.log(response);
      console.log('awesome! Trip and stop unlinked');
      $.each($scope.stop.routes, function(indexRoute, route){
        $.each(route.trips, function(indexTrip, trip){
          if (trip.id === tripId) { //remove trip
            $scope.stop.routes[indexRoute].trips.splice(indexTrip,1);
            //delete route from stop if there are no more trisp
            if ($scope.stop.routes[indexRoute].trips.length === 0) {
              $scope.stop.routes.splice(indexRoute, 1);
            }
          }
        }); //each trips
      }); //each routes
    })
    .error(function(response) {
      console.log('error removing trip from stop');
      console.log(response);
    });
  };
  $scope.close = function () {
    $modalInstance.close();
  };
}
);  
  
  
  
  
  
  