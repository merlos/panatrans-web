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
  
  var userLocationMarker = null;
  var userLocationCircle = null;
  
  var newStop = {};
  var newStopMarker = null;
  var stopDetailPanelHighlightedStop = null;
  var markers = {};
  var markerIcon = {
    default: L.AwesomeMarkers.icon({ // bus stop default
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
    }),
    userLocation: L.AwesomeMarkers.icon({
      icon: 'user',
      prefix: 'fa',
      markerColor: 'green',
      spin: false
    })
  };
   
  //Configure map
  $scope.map = L.map('map', {
    center: [8.9740946, -79.5508536],
    zoom: 13,
    zoomControl: false
  });

  L.tileLayer( _CONFIG.tilelayerUrl, {
    attribution: _CONFIG.tilelayerAttribution,
    maxZoom: 18
  }).addTo($scope.map);
  $http.get(_CONFIG.serverUrl + '/v1/routes?with_trips=true' + _CONFIG.delay)
  .success(function(response) {
    $scope.routesArray = response.data;
    $.each(response.data, function(index, route) {
      $scope.routes[route.id] = route;
    });
  });
  
  //get stops
  $http.get(_CONFIG.serverUrl + '/v1/stops/?' + _CONFIG.delay)
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
      marker.on('popupopen', stopMarkerPopupOpen); 
      marker.on('popupclose', stopMarkerPopupClose); 
      //set an id (https://github.com/Leaflet/Leaflet/issues/1031)
        marker._stopId = stop.id; 
        markers[stop.id] = marker; //add the marker to the list of markers
      });
    }); //end $http
    
    var onLocationFound = function(e) {
      if (e.accuracy === null) {
        return;
      }
      var radius = e.accuracy / 2;
      if (userLocationMarker === null) {  // add to map
    	  userLocationMarker = L.marker(e.latlng, {icon: markerIcon.userLocation});
        userLocationMarker.addTo($scope.map);
        $scope.map.panTo(e.latlng);
    	  userLocationCircle = L.circle(e.latlng, radius);
        userLocationCircle.addTo($scope.map);
      }
      //update
      userLocationMarker.setLatLng(e.latlng);
      userLocationMarker.bindPopup('Estás cerca de este punto en un radio de unos ' + radius + ' metros.');
      userLocationCircle.setLatLng(e.latlng);
      userLocationCircle.setRadius(radius);
      if ($scope.trackingUser) {
        $scope.map.panTo(e.latlng);
      }
    };

    var onLocationError = function(e) {
    			console.log(e.message);
    };

    $scope.map.on('locationfound', onLocationFound);
    $scope.map.on('locationerror', onLocationError);
    $scope.map.locate({watch: true, setView: false, maxZoom: 15, enableHighAccuracy: true});
    
    
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
      if (stopId === null) { 
          console.log('stopMarkerClicked: Hey! Hey! stopId es null :-?');
          return;
      }
      console.log('stopId Clicked: ' + stopId);
      if ($scope.stops[stopId].routes) { //if we already downloaded the stop detail then routes is defined
        $scope.$apply(function() { //http://stackoverflow.com/questions/20954401/angularjs-not-updating-template-variable-when-scope-changes
          $scope.stopDetail = $scope.stops[stopId]; 
          updateMarkersForSelectedStop(stopId);
        });        
      } else { //get the stop data
        markers[stopId].setIcon(markerIcon.orangeSpin);
        $scope.loadingStopDetail = true;
        $http.get(_CONFIG.serverUrl + '/v1/stops/' + stopId + '?with_stop_sequences=true' + _CONFIG.delay)
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
    
    
    var stopMarkerPopupClose = function() {
      console.log('stopMarkerClosed');
      //clear markers color
      if (stopDetailPanelHighlightedStop === null) {
        $.each(markers, function(index, marker) {
          marker.setIcon(markerIcon.default);
        }); 
      }  
    };
    
    //$scope.map.on('popupopen', stopMarkerPopupOpen); 
    //$scope.map.on('popupclose', stopMarkerPopupClose);
    
    
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
    
    
    $scope.openEditStopModal = function(stopId){
      var modalInstance = $modal.open({
        templateUrl: 'views/modals/edit-stop.html',
        size: 'lg',
        controller: 'EditStopModalInstanceCtrl',
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
      }, function (reason) {
        console.log('modal instance dismissed reason : ' + reason);
        if (reason === 'changeStopLocation') {
          console.log('changeStopLocation: ' + stopId);
          setStopMarkerEditMode(markers[stopId]);
        }
        if (reason === 'stopDeleted') {
          console.log('deletedStop, eliminating marker and stop');
          $scope.map.removeLayer(markers[stopId]);
          delete markers[stopId];
          delete $scope.stops[stopId];
          //TODO add feedback to user
        }
      });
    };
    
    
    var setStopMarkerEditMode = function(stopMarker) {
      console.log('setStopMarkerEditMode');
      //center and zoom map to stop
      stopMarker.setIcon(markerIcon.redSpin);
      stopMarker.dragging.disable();
      stopMarker.dragging.enable();
      stopMarker.off('popupopen', stopMarkerPopupOpen);
      stopMarker.off('popupclose', stopMarkerPopupClose);
      $scope.map.setView(stopMarker.getLatLng(), 15);
      var stop = $scope.stops[stopMarker._stopId];    
      var html = '<div><h4>' + stop.name + '</h4><p><strong>Arrástrame</strong> hasta mi localización.<br>Después dale a: </p><button ng-click="saveStopLocation(stop)"class="btn btn-primary">Actualizar</button> o a <a href="" ng-click="cancelStopMarkerEditMode(stopMarker)">cancelar</a></div>';
      var linkFn = $compile(angular.element(html));
      var scope = $scope.$new();
       //add var to scope
      scope.stop = stop;
      scope.stopMarker = stopMarker;
      var element = linkFn(scope);
      console.log(element);
      stopMarker.bindPopup(element[0]).openPopup();    
      stopMarker.on('dragend', function(e){
        console.log('dragend called!!'); 
        var marker = e.target;
        marker.openPopup();
        var position = marker.getLatLng();
        stop.lat = position.lat;
        stop.lon = position.lng;
        console.log($scope.newStop);
      });  
    };
    
    
    $scope.cancelStopMarkerEditMode = function(stopMarker) {
      console.log('cancelStopMarkerEditMode');
      stopMarker.closePopup();
      stopMarker.dragging.disable();
      stopMarker.setIcon(markerIcon.red);
      console.log('setting popup content = ' + $scope.stops[stopMarker._stopId].name);
      stopMarker.bindPopup($scope.stops[stopMarker._stopId].name);
      //suscribe again to eventlistener
      stopMarker.on('popupopen', stopMarkerPopupOpen);
      stopMarker.on('popupclose', stopMarkerPopupClose); 
      stopMarker.openPopup();
    };
    
    
    $scope.saveStopLocation = function(stop) {
      console.log('saveStopLocation called');
      $http.put(_CONFIG.serverUrl + '/v1/stops/' + stop.id, {stop: {lat: stop.lat, lon: stop.lon}})
      .success(function(){
        console.log('new stop location successfully saved');
        //TODO show feedback to user
        //marker to normal
        $scope.cancelStopMarkerEditMode(markers[stop.id]);
      })
      .error(function(data) {
        console.log('error updating stop Location');
        console.log(data);
      });
    };
    
  
    $scope.openEditRouteModal = function(routeId){
      var modalConfig = {
        templateUrl: 'views/modals/edit-route.html',
        size: 'lg',
        controller: 'EditRouteModalInstanceCtrl',
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
      $http.post(_CONFIG.serverUrl + '/v1/stops/', {stop: newStop})
      .success(function(response) {
        console.log('stop saved successfully');
        console.log(response.data);
        $scope.stops[response.data.id] = response.data;
        $scope.stopDetail = response.data;
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
      .error(function(data) {
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
              bounceOnAddCallback: function() {console.log('bouncing done');}
            }).addTo($scope.map); //http://stackoverflow.com/questions/17662551/how-to-use-angular-directives-ng-click-and-ng-class-inside-leaflet-marker-popup    
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







  
  

  
  
