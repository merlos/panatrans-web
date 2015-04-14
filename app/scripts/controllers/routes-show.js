'use strict';

/**
 * @ngdoc function
 * @name panatransWebApp.controller:ApiCtrl
 * @description
 * # ApiCtrl
 * Controller of the panatransWebApp to display API docs
 */


angular.module('panatransWebApp')
  .controller('RoutesShowCtrl', ['$scope', '$http', '$modal', 'ngToast', '$routeParams', function ($scope, $http, $modal, ngToast, $routeParams) {
    $scope.route = {};
    console.log($routeParams);
    $scope.loading = true;  
    
    var markers = {};
    var markersFeatureGroup = null;
    var stops = {};
    
    if ($scope.map) { 
      return;
    }
    //Configure map
    $scope.map = L.map('route-map', {
      center: [8.9740946, -79.5508536],
      zoom: 16,
      zoomControl: false
    });
    
    L.tileLayer( _CONFIG.tilelayerUrl, {
      attribution: _CONFIG.tilelayerAttribution,
      maxZoom: 18
    }).addTo($scope.map);
    
    //TODO DRY this stuff
    var markerIcon = {
      default: L.AwesomeMarkers.icon({ // bus stop default
        icon: 'bus',
        prefix: 'fa',
        markerColor: 'blue'
      }), 
      red: L.AwesomeMarkers.icon({
        icon: 'bus',
        prefix: 'fa',
        markerColor: 'red'
      }),
    };
    
    
    var addStopMarkerToMap = function(stop) {
      var marker = L.marker([stop.lat, stop.lon], 
        {
          icon: markerIcon.default,
          draggable: false,
          title: stop.name
        }
      );
      marker.bindPopup(stop.name);
      marker.on('popupopen', stopMarkerPopupOpen); 
      marker.on('popupclose', stopMarkerPopupClose); 
      //set an id (https://github.com/Leaflet/Leaflet/issues/1031)
      marker._stopId = stop.id; 
      markers[stop.id] = marker; //add the marker to the list of markers
      //initialize layer group
      if (markersFeatureGroup === null) {
        markersFeatureGroup = L.featureGroup();
        markersFeatureGroup.addTo($scope.map);
      }
      markersFeatureGroup.addLayer(marker);
    };
    
    var stopMarkerPopupOpen = function(e) {
      var stopId = e.popup._source._stopId;
      if (stopId === null) { 
          console.log('stopMarkerClicked: Hey! Hey! stopId es null :-?');
          return;
      }
      markers[stopId].setIcon(markerIcon.red);
      
    };
    var stopMarkerPopupClose = function(e) {
      var stopId = e.popup._source._stopId;
      if (stopId === null) { 
          console.log('stopMarkerPopupClose: Hey! Hey! stopId es null :-?');
          return;
      }
      markers[stopId].setIcon(markerIcon.default);
    };
    
    $scope.highlightStop = function(stop) {
      markers[stop.id].openPopup();
      $scope.map.panTo(markers[stop.id].getLatLng());
    };
    
    
    $scope.lowlightStop = function(stop) {
      console.log('loglight stop'  + stop.name);
      markers[stop.id].closePopup(); 
    };
  
    
    
          
    $http.get(_CONFIG.serverUrl + '/v1/routes/' + $routeParams.routeId + '?' + _CONFIG.delay)
    .success(function(response) {
      //console.log('success getting route detail');
      $scope.route = response.data;
      $scope.loading = false;
      console.log($scope.route);
      /*jshint camelcase: false */
      angular.forEach($scope.route.trips, function(trip) {
        angular.forEach(trip.stop_sequences, function(stop_sequence) {
          var stop = stop_sequence.stop;
          //add markers to map if not in map
          if (stops[stop.id] === undefined) {
            addStopMarkerToMap(stop);
            stops[stop.id] = stop;
          }
        });
      });
      if (markersFeatureGroup) {
        $scope.map.fitBounds(markersFeatureGroup.getBounds(), {padding: [15,15]});
      }
    })
    .error(function(response){
      console.log('WTF! Something wrong with the route!');
      console.log(response);
    });
  }]);
  