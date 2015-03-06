'use strict';

/**
 * @ngdoc function
 * @name panatransWebApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the panatransWebApp. This controller handles the mapa stuff
 */

var UNKNOWN_SEQUENCE = -1; //unkown sequence of a stop in a trip.

var SERVER_URL = 'http://localhost:3000';

angular.module('panatransWebApp')
  .controller('MainCtrl', [ '$scope', '$http', '$modal', function ($scope, $http, $modal) {
    $scope.routes = {};
    $scope.stops = {};
    $scope.showStopDetail = false;  
    $scope.stopDetail = {};
    
    $scope.tileLayer = 'http://{s}.tiles.mapbox.com/v3/merlos.k99amj6l/{z}/{x}/{y}.png';
  
    if (! $scope.map) { 
    //Configure map
      $scope.map = L.map('map', {
        center: [8.9740946, -79.5508536],
        zoom: 13,
        zoomControl: false
      });
    }
    
    L.tileLayer('http://{s}.tiles.mapbox.com/v3/merlos.k99amj6l/{z}/{x}/{y}.png', {
        attribution: '&copy;<a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>,© <a href="http://mapbox.com">Mapbox</a>',
        maxZoom: 18
    }).addTo($scope.map);
    $http.get(SERVER_URL + '/v1/routes/with_trips')
      .success(function(response) {
        $scope.routesArray = response.data;
        $.each(response.data, function(index, route) {
          $scope.routes[route.id] = route;
        });
    });
    $http.get(SERVER_URL + '/v1/stops/')
        .success(function(response) {
          console.log('Success getting stops!!!');
          console.log(response.data);
          $.each(response.data,function(index, stop) {
              var marker = L.marker([stop.lat, stop.lon], 
                {
                  draggable: true,
                  title: stop.name
                }
              );
              marker.addTo($scope.map).bindPopup( stop.name);
              //set an id (https://github.com/Leaflet/Leaflet/issues/1031)
              marker._stopId = stop.id; 
          });
    }); //end $http
    
    //When a stop in the map is clicked
    $scope.stopIconClicked = function(e) {
      //display lateral div & loading
      console.log('stopIconClicked');
      $scope.showStopDetail = true;  
      console.log(e);
      var stopId = e.popup._source._stopId;
      if ($scope.stops[stopId]) { //check if already got the stop
        $scope.$apply(function() { //http://stackoverflow.com/questions/20954401/angularjs-not-updating-template-variable-when-scope-changes
              $scope.stopDetail = $scope.stops[stopId]; 
        });        
      } else { //get the stop data
        $http.get(SERVER_URL + '/v1/stops/' + stopId)
          .success(function(response) {
            $scope.loadingStop = false;
            
            console.log('Success getting stop info');
            console.log(response.data);
            $scope.stopDetail= response.data; 
            $scope.stops[$scope.stopDetail.id] = response.data;
          }); //success
      }
    }; // on(popupopen)
    
    //listen for popup event on each stop marker
    $scope.map.on('popupopen', $scope.stopIconClicked);
    
    
    $scope.openEditStopRoutesModal= function(stopId){
      var modalInstance = $modal.open({
            templateUrl: 'EditStopRoutesModal.html',
        size: 'lg',
            controller: 'EditStopRoutesModalInstanceCtrl',
            backdrop: 'static',
            stopId: stopId,
            resolve: { //variables passed to modal scope
              routes: function() {
                return $scope.routesArray;
              },
               stop: function () {
                 return $scope.stopDetail;
               }
            }
        });
        modalInstance.result.then(function () {
        }, function () {
        });
    };
    
    $scope.openEditRouteStopsModal= function(routeId){
      var modalConfig = {
            templateUrl: 'EditRouteStopsModal.html',
            size: 'lg',
            controller: 'EditRouteStopModalInstanceCtrl',
            backdrop: 'static',
            routeId: routeId,
            resolve: { //variables passed to modal scope
              route: function() {
                return $scope.routes[routeId];
              },
            }
        };
      $modal.open(modalConfig);  
    };
  }]); // main controller















//
// Edit Routes of a Stop Modal Controller
//
angular.module('panatransWebApp').controller('EditStopRoutesModalInstanceCtrl', function ($scope, $http, $modalInstance, routes, stop) {
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
          'sequence': UNKNOWN_SEQUENCE, 
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
  $scope.deleteTrip = function(tripId) {
  $http.delete(SERVER_URL + '/v1/stop_sequences/trip/' + tripId + '/stop/' + $scope.stop.id)
    .success(function(response) {
      console.log(response);
      console.log('awesome! Trip and stop unlinked');
      $.each($scope.stop.routes, function(indexRoute, route){
        $.each(route.trips, function(indexTrip, trip){
        if (trip.id === tripId) { //remove trip
          $scope.stop.routes[indexRoute].trips.splice(indexTrip,1);
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
  });  
  
  
  
  
  
  
  
  
  
  
  //
  // Edit Routes of a Stop Modal Controller
  //
  angular.module('panatransWebApp').controller('EditRouteStopModalInstanceCtrl', function ($scope, $http, $modalInstance, route) {
    $scope.loading = true;
      $scope.route = route;
      //do we have the list of stops?
    if (route.trips[0].stops) {
      $scope.loading = false;
    } else {
      $http.get(SERVER_URL + '/v1/routes/' + route.id)
      .success(function(response) {
        console.log('success getting route detail');
        $scope.route = response.data;
        $scope.loading = false;
        console.log($scope.route);
        
      })
      .error(function(response){
        console.log('WTF! Something wrong with the route!');
        console.log(response);
      });
    }
    
    
    $scope.close = function () {
        $modalInstance.close();
    };
    });  
  
  
