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
  
    
    //TODO DRY This is the same function as in main.js 
    var pdfLayers = {};
    $scope.togglePdfLayer = function(route) {
      console.log('togglePDFLayer');
      //var tilesBaseUrl ='https://www.googledrive.com/host/0B8O0WQ010v0Pfl92WjctUXNpTTZYLUUzMUdReXJrOFJLdDRYWVBobmFNTnBpdEljOE9oNms'
      var tilesBaseUrl ='https://dl.dropboxusercontent.com/u/22698/metrobus/';
      $http.get(tilesBaseUrl + route.id + '/kml/tilemapresource.xml')
      .success(function(response) {
        console.log(response)
        var boundsArr = response.match(/(minx|miny|maxx|maxy)=\"([\-\.\d]+)\"/g);
        console.log(boundsArr);
        //["minx="9.123"","miny="number""...
        angular.forEach(boundsArr, function(x,k) {
          boundsArr[k] = x.match(/([\-\.\d]+)/g)[0];
        });  
        $scope.map.fitBounds([[boundsArr[1],boundsArr[0]],[boundsArr[3],boundsArr[2]]]);
        console.log(boundsArr);
        console.log('cool! The pdf is geolocated route_id:' + route.id);
        if (pdfLayers[route.id] === undefined) { 
            var options = {
                minZoom: 11,
                maxZoom: 18,
                maxNativeZoom: 14, 
                opacity: 0.8,
                tms: true
          };
          var tilesUrl = tilesBaseUrl + route.id + '/kml/{z}/{x}/{y}.png';
          console.log('tilesUrl: ' + tilesUrl);
          pdfLayers[route.id] = L.tileLayer(tilesUrl, options);
          pdfLayers[route.id].addTo($scope.map);
      
          ngToast.create('En unos segundos se mostrará el PDF de la ruta en el mapa...');
        } else { //layer exists => remove from map
            $scope.map.removeLayer(pdfLayers[route.id]);
            delete pdfLayers[route.id];
            ngToast.create({ className: 'info', content: 'Se ha dejado de mostrar el PDF en el mapa'});
        }
      })
      .error(function(data, status) {
        console.log('Geolocated pdf does not exists');
        console.log(data);
        console.log(status);
        ngToast.create({className: 'danger', content: 'No hay asociado con esta ruta un PDF Geolocalizado'});
      });
    };
    
    
    var updateRoute = function() {    
      $scope.loading = true;
      //clear markers
      angular.forEach(markers, function(marker){
        $scope.map.removeLayer(marker);
        delete markers[marker.id]; 
      });       
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
  };
  
  updateRoute();
    
    $scope.openEditRouteModal = function(routeId){
      var modalConfig = {
        templateUrl: 'views/modals/edit-route.html',
        size: 'lg',
        controller: 'EditRouteModalInstanceCtrl',
        backdrop: true,
        routeId: routeId,
        resolve: { //variables passed to modal scope
          route: function() {
            return $scope.route;
          },
          stopsArr: function() {
            return null;
          }
        }
      };
      var modalInstance = $modal.open(modalConfig);  
      modalInstance.result.then(function () {
        console.log('modal instance closed');  
        updateRoute();
        }, function () {});
    };
    
  }]);
  