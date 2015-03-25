'use strict';

/**
* @ngdoc function
* @name panatransWebApp.controller:MainCtrl
* @description
* # MainCtrl
* Controller of the panatransWebApp. This controller handles the mapa stuff
*/

angular.module('panatransWebApp')
.controller('MainCtrl', [ '$scope', '$compile', '$http', '$modal', function ($scope, $compile, $http, $modal) {
  
  // it seems that the controller is loaded twice. Doing that makes initialize twice the map, which makes a mess
  if ($scope.map) { 
    return;
  }
  
  $scope.routes = {};
  $scope.stops = {};
  $scope.stopsArr = {};
  $scope.showStopDetail = false; 
  $scope.loadingStopDetail = false;
  $scope.stopDetail = {};
  
  var newStop = {};
  var newStopMarker = null;
  var stopDetailPanelHighlightedStop = null;
  var markers = {};
  var markerIcon = {
    default: L.AwesomeMarkers.icon({
      icon: 'bus',
      prefix: 'fa',
      markerColor: 'blue'
    }), 
    orange: L.AwesomeMarkers.icon({
      icon: 'bus',
      prefix: 'fa',
      markerColor: 'orange'
    }),
    orangeSpin: L.AwesomeMarkers.icon({
      icon: 'bus',
      prefix: 'fa',
      markerColor: 'orange',
      spin: true
    }),       
    pink: L.AwesomeMarkers.icon({
      icon: 'bus',
      prefix: 'fa',
      markerColor: 'pink'
    }), 
    red: L.AwesomeMarkers.icon({
      icon: 'bus',
      prefix: 'fa',
      markerColor: 'red'
    }),
    redSpin: L.AwesomeMarkers.icon({
      icon: 'bus',
      prefix: 'fa',
      markerColor: 'red',
      spin: true
    })
  };
   
  //Configure map
  $scope.map = L.map('map', {
    center: [8.9740946, -79.5508536],
    zoom: 13,
    zoomControl: false
  });
    //merlos.li3k1pmo (w/colors)
    //merlos.k99amj6l (b/w)
  L.tileLayer('http://{s}.tiles.mapbox.com/v3/merlos.li3k1pmo/{z}/{x}/{y}.png', {
    attribution: '&copy;<a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>,© <a href="http://mapbox.com">Mapbox</a>',
    maxZoom: 18
  }).addTo($scope.map);
  $http.get(SERVER_URL + '/v1/routes?with_trips=true')
  .success(function(response) {
    $scope.routesArray = response.data;
    $.each(response.data, function(index, route) {
      $scope.routes[route.id] = route;
    });
  });
  
  //get stops
  $http.get(SERVER_URL + '/v1/stops/')
  .success(function(response) {
    console.log('Success getting stops!!!');
    //console.log(response.data);
    $scope.stopsArr = response.data;
    $.each(response.data,function(index, stop) {
      $scope.stops[stop.id] = stop;
      var marker = L.marker([stop.lat, stop.lon], 
        {
          icon: markerIcon.default,
          draggable: false,
          title: stop.name
        }
      );
      marker.addTo($scope.map).bindPopup( stop.name);
      //set an id (https://github.com/Leaflet/Leaflet/issues/1031)
        marker._stopId = stop.id; 
        markers[stop.id] = marker; //add the marker to the list of markers
      });
    }); //end $http
    
    
    var stopMarkerPopupOpen = function(e) {
      //there are two scenarios to open a popup:
      // - when making hover to one of the stops listed on the stop-detail panel => only open popu (default action)
      // - when user clicked over a stop in the map => display the stop detail in the stop-detail panel 
      console.log('stopMarkerPopupOpen');
      console.log (stopDetailPanelHighlightedStop);
      if (stopDetailPanelHighlightedStop === null) {
        //it was a click
        stopMarkerClicked(e);
      }
    };
    
    //When a stop in the map is clicked
    var stopMarkerClicked = function(e) {    
      //display lateral div & loading
      console.log('popupOpen - stopMarkerClicked'); 
      $scope.showStopDetail = true;  
      console.log(e);
      var stopId = e.popup._source._stopId;
      if (stopId == null) { return;}
      if ($scope.stops[stopId].routes) { //if we already downloaded the stop detail then routes is defined
        $scope.$apply(function() { //http://stackoverflow.com/questions/20954401/angularjs-not-updating-template-variable-when-scope-changes
          $scope.stopDetail = $scope.stops[stopId]; 
          updateMarkersForSelectedStop(stopId);
        });        
      } else { //get the stop data
        markers[stopId].setIcon(markerIcon.orangeSpin);
        $scope.loadingStopDetail = true;
        $http.get(SERVER_URL + '/v1/stops/' + stopId + '?with_stop_sequences=true' + DELAY)
        .success(function(response) {
          $scope.loadingStopDetail = false;
          console.log('Success getting stop info');
          console.log(response.data);
          $scope.stopDetail= response.data; 
          $scope.stops[$scope.stopDetail.id] = response.data;
          updateMarkersForSelectedStop(stopId);
        });
      } //else
    }; // on(popupopen)
    
    
    var stopMarkerPopupClosed = function(e) {
      console.log('stopMarkerClosed');
      //clear markers color
      if (stopDetailPanelHighlightedStop === null) {
        $.each(markers, function(index, marker) {
          marker.setIcon(markerIcon.default);
        }); 
      }  
    };
    
    $scope.map.on('popupopen', stopMarkerPopupOpen); 
    $scope.map.on('popupclose', stopMarkerPopupClosed);
    
    
    $scope.closeStopDetail = function() {
      $scope.showStopDetail = false;
    };
    
    $scope.isFirstStopInTrip = function(stop, trip) {
      /*jshint camelcase: false */
      var isFirst = false;
      $.each(trip.stop_sequences, function(index, stopSequence){
        if ((stopSequence.sequence === 0) && (stopSequence.stop_id === stop.id)) {
          isFirst = true;
        }
      });
      return isFirst;
    };
  
    $scope.isLastStopInTrip = function(stop, trip) {
      /*jshint camelcase: false */
      var largestSequence = -1;
      var stopIdWithLargestSequence = -1;
      $.each(trip.stop_sequences, function(index, stopSequence){
        if (stopSequence.sequence > largestSequence) {
          largestSequence = stopSequence.sequence;
          stopIdWithLargestSequence = stopSequence.stop_id;
        }
      });
      if (stopIdWithLargestSequence === stop.id) {
        return true;
      }
      return false;
    };
    
    
    $scope.highlightStop = function(stop) {
      console.log('highlight stop'  + stop.name);
      stopDetailPanelHighlightedStop = stop;
      markers[stop.id].openPopup();
    };
    
    
    $scope.lowlightStop = function(stop) {
      console.log('loglight stop'  + stop.name);
      markers[$scope.stopDetail.id].openPopup(); 
      stopDetailPanelHighlightedStop = null;
    };
  
    
    var setIconForStopSequencesOnRoute = function(route, icon) {
      /*jshint camelcase: false */
      $.each(route.trips, function(index, trip) {
        $.each(trip.stop_sequences, function(index, stopSequence) { 
          markers[stopSequence.stop_id].setIcon(icon);
        }); //stopSequence
      }); // trip
    };
    
    
    var updateMarkersForSelectedStop = function(stopId) {
        //search for all stops that are linked with this stop through trips that include this stop
      $.each($scope.stopDetail.routes, function(index, route) {
        setIconForStopSequencesOnRoute(route, markerIcon.orange);
      }); //route
      
      markers[stopId].setIcon(markerIcon.red); 
    };
    
      
    // searches for stop_sequences on the route and sets the orange icon
    //route: has trips and trips have stop_sequences
    $scope.highlightRoute = function(route) {
      console.log('highlight route '  + route.name);
      setIconForStopSequencesOnRoute(route, markerIcon.red); 
    };
    
  
    // searches for stop_sequences on the route and sets the grey icon
    //route: has trips and trips have stop_sequences
    $scope.lowlightRoute = function(route) {
      setIconForStopSequencesOnRoute(route, markerIcon.orange); 
      markers[$scope.stopDetail.id].setIcon(markerIcon.red);   
    };
 
    
    // Display/hide edit route stops on mouse over
    $scope.hoverIn = function(){
      this.hoverEdit = true;
    };
    $scope.hoverOut = function(){
      this.hoverEdit = false;
    };
    
    
    $scope.toggleTripDetails = function(){
      console.log('toggle');
      if ((this.showTripDetails === false) || (this.showTripDetails === undefined)){ 
        this.showTripDetails = true; 
      } else {
        this.showTripDetails = false;
      }
      console.log('showTripDetails: ' + this.showTripDetails);
    };
    
    
    $scope.openEditStopRoutesModal = function(stopId){
      var modalInstance = $modal.open({
        templateUrl: 'views/modals/edit-stop-routes.html',
        size: 'lg',
        controller: 'EditStopRoutesModalInstanceCtrl',
        backdrop: true,
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
    
    
    $scope.openEditRouteStopsModal = function(routeId){
      var modalConfig = {
        templateUrl: 'views/modals/edit-route-stops.html',
        size: 'lg',
        controller: 'EditRouteStopModalInstanceCtrl',
        backdrop: true,
        routeId: routeId,
        resolve: { //variables passed to modal scope
          route: function() {
            return $scope.routes[routeId];
          },
          stopsArr: function() {
            return $scope.stopsArr;
          }
        }
      };
      $modal.open(modalConfig);  
    };
    
    
    $scope.openNewRouteModal = function(){
      var modalConfig = {
        templateUrl: 'views/modals/new-route.html',
        //size: 'lg',
        controller: 'NewRouteModalInstanceCtrl',
        backdrop: 'static',
        resolve: { //variables passed to modal scope  
        }
      };
      $modal.open(modalConfig);  
    };
    
    $scope.saveNewStop = function() {
      console.log('saveSaveNewStop');
      console.log(newStop);
      //make the create request
      $http.post(SERVER_URL + '/v1/stops/', {stop: newStop})
      .success(function(response) {
        console.log("stop saved successfully");
        console.log(response.data);
        $scope.stops[response.data.id] = response.data;
        $scope.stopDetail = response.data
        //add marker to markers
        newStopMarker._stopId = response.data.id; 
        newStopMarker.closePopup();
        newStopMarker.setIcon(markerIcon.default);
        newStopMarker.bindPopup(response.data.name);
        
        //update popup
        markers[response.data.id] = newStopMarker;
        //clear marker and stop for next round
        newStop = {};
        newStopMarker = null;
        //display some feedback to the user
        console.log('Se ha añadido la parada con éxito');
        
      })
      .error(function(data, status, headers, config) {
        alert(data);
      });
        
      
    };
    
    
    $scope.cancelSaveNewStop = function() {
      console.log('cancelSaveStop');
    };
    
    
    $scope.openNewStopModal = function(){
      var modalConfig = {
        templateUrl: 'views/modals/new-stop.html',
        //size: 'lg',
        controller: 'NewStopModalInstanceCtrl',
        backdrop: 'static',
        resolve: { //variables passed to modal scope  
        }
      };
      var modalInstance = $modal.open(modalConfig);  
      
      modalInstance.result.then(function (stopModal) {
        newStop = stopModal;
          //add newStopMarker
        var mapCenter = $scope.map.getCenter();
        newStop.lat = mapCenter.lat;
        newStop.lon = mapCenter.lng;
         
        newStopMarker = L.marker(mapCenter, 
            { 
              icon: markerIcon.redSpin,
              draggable: true,
              bounceOnAdd: true, 
              bounceOnAddOptions: {duration: 500, height: 100}, 
              bounceOnAddCallback: function() {console.log("done");}
            }).addTo($scope.map);
            
        var html = '<div><h4>' + newStop.name + '</h4><p><strong>Arrástrame</strong> hasta mi localización.<br>Después dale a: </p><button ng-click="saveNewStop()"class="btn btn-primary">Guardar</button> o <a ng-click="cancelSaveNewStop()">cancelar</a></div>';
        var linkFn = $compile(angular.element(html));
        var scope = $scope.$new();
        var element = linkFn(scope);
        console.log(element);
            
        newStopMarker.bindPopup(element[0]).openPopup();    
        newStopMarker.on('dragend', function(e){
          console.log('dragend called!!');
          
          var marker = e.target;
          marker.openPopup();
          var position = marker.getLatLng();
          newStop.lat = position.lat;
          newStop.lon = position.lng;
          console.log($scope.newStop);
        });  
        }, function () {});
      };
    
    
    
  }]
); // main controller







  
  

  
  
