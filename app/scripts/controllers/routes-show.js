'use strict';

/**
 * @ngdoc function
 * @name panatransWebApp.controller:ApiCtrl
 * @description
 * # ApiCtrl
 * Controller of the panatransWebApp to display API docs
 */


angular.module('panatransWebApp')
  .controller('RoutesShowCtrl', ['$scope', '$http', '$modal', '$compile', '$routeParams', 'ngToast', 'Stop', function ($scope, $http, $modal, $compile,  $routeParams, ngToast, Stop) {
    $scope.route = {};
    console.log($routeParams);
    $scope.loading = true;  
    
    var markers = {};
    var markersFeatureGroup = null;
    var pdfMarkers = {};
    var stops = {};
    var routeStops = {};
    var newStop = {};
    
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
      redSpin: L.AwesomeMarkers.icon({
        icon: 'bus',
        prefix: 'fa',
        markerColor: 'red',
        spin: true
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
          console.log('stopMarkerPopupClose: Hey! Hey! It seems that you forgot to set stopId...');
          return;
      }
      if (markers[stopId] !== undefined) { 
        markers[stopId].setIcon(markerIcon.default);
      }
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
    $scope.pdfLayers = pdfLayers;
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
        var pdfBounds = L.latLngBounds([[boundsArr[1],boundsArr[0]],[boundsArr[3],boundsArr[2]]]);
        $scope.map.fitBounds(pdfBounds);
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
          pdfLayers[route.id].pdfBounds = pdfBounds; //save bounds in layer.
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
            if (routeStops[stop.id] === undefined) {
              addStopMarkerToMap(stop);
              routeStops[stop.id] = stop;
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
  
  //load all stops
  Stop.all().then(
    function(data) {
      stops = data;
    }, function(error) {
      ngToast.create({
        timeout: 8000,
        className: 'danger', 
        content: '<strong>Error obteniendo información de paradas.</strong><br> Prueba en un rato. Si nada cambia tuitéanos: @panatrans'}
      );
    }
  );
  updateRoute();
    
  
  $scope.addStopToTrip = function(stop, trip) {
    console.log('add stop to trip');
    console.log(stop);
    console.log(trip);
    var postData =  {
      'stop_sequence': {
        'sequence': null, 
        'unknown_sequence': false,
        'stop_id': stop.id,
        'trip_id': trip.id
      }
    };
    console.log('addStopToTrip postData:');
    console.log(postData);

    $http.post(_CONFIG.serverUrl + '/v1/stop_sequences/', postData)
    .success(function(response) {
      updateRoute();
      pdfMarkers[stop.id].closePopup();
      ngToast.create('Se ha añadido la parada al trayecto.');  
    });
  }; 
    
  $scope.pdfStopsInMap = false;
  $scope.togglePdfStops = function(route) {
    console.log('togglePdfStops');
    if($scope.pdfStopsInMap) {
      ngToast.create({className:'info', content:'Ocultando paradas dentro de PDF...'});
      angular.forEach(pdfMarkers, function(marker) {
        $scope.map.removeLayer(marker);
      });
      $scope.pdfStopsInMap = false;
      return;
    } 
    //stops not in map
    ngToast.create({className:'info', content:'Mostrando paradas dentro de PDF...'});
    angular.forEach(stops, function(stop) {
      var stopLatLng = L.latLng(parseFloat(stop.lat), parseFloat(stop.lon));
      if (pdfLayers[route.id].pdfBounds.contains(stopLatLng)) {
        //add the marker
        var marker = L.marker([stop.lat, stop.lon], 
          {
            icon: markerIcon.default,
            draggable: false,
          }
        );
        
        var template =  '<div><p><strong>{{stop.name}}</strong><br>Añadir parada al final del trayecto:</p><ul ng-repeat="trip in route.trips"><li><a href="" ng-click="addStopToTrip(stop, trip)">Con dirección {{trip.headsign}}</a></li></ul></div>';
        var linkFn = $compile(angular.element(template));
        var scope = $scope.$new();
        //add var to scope
        scope.stop = stop;
        scope.route = $scope.route;
        scope.stopMarker = this;
        var element = linkFn(scope);
        //console.log(element);
        marker.bindPopup(element[0]);      
        marker.on('popupopen', stopMarkerPopupOpen); 
        marker.on('popupclose', stopMarkerPopupClose); 
        //set an id (https://github.com/Leaflet/Leaflet/issues/1031)
        marker._stopId = stop.id; 
        pdfMarkers[stop.id] = marker; //add the marker to the list of markers
        $scope.pdfStopsInMap = true
        marker.addTo($scope.map);
      }
    })
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
    
    
    ////////////////////////// NEW STOP
    
    // New Stop
    
       
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
        newStopMarker.setIcon(iconset.default);
        newStopMarker.bindPopup(response.data.name);
        newStopMarker.on('popupopen', stopMarkerPopupOpen);
        newStopMarker.on('popupclose', stopMarkerPopupClose); 
        //update popup
        markers[response.data.id] = newStopMarker;
        newStopMarker.openPopup();
        //clear marker and stop for next round
        newStop = {};
        newStopMarker = null;
        //display some feedback to the user
        ngToast.create('Excelente, ¡parada añadida!');
        console.log('Se ha añadido la parada con éxito');
        
        
      })
      .error(function(data) {
        console.log(data);
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
              icon: $scope.map.iconset.redSpin,
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
    
    
    
    
  }]);
  