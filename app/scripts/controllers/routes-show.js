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

    var routeMarkers = {};
    var routeMarkersFeatureGroup = null;
    var pdfMarkers = {};
    var stops = {};
    var routeStops = {};
    var newStop = {};
    var newStopMarker = {};

    if ($scope.map) {
      return;
    }

    // TODO do this more DRY.
    // this is repeated from map
    var iconset = {
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
    $scope.map = L.map('route-map', {
      center: [8.9740946, -79.5508536],
      zoom: 16,
      zoomControl: false
    });

    L.tileLayer( _CONFIG.tilelayerUrl, {
      attribution: _CONFIG.tilelayerAttribution,
      maxZoom: 18
    }).addTo($scope.map);


    var addStopMarkerToMap = function(stop) {
      var marker = L.marker([stop.lat, stop.lon], {
          icon: iconset.orange,
          draggable: false,
          title: stop.name
        }
      );
      marker.bindPopup(stop.name);
      marker.on('popupopen', stopMarkerPopupOpen);
      marker.on('popupclose', stopMarkerPopupClose);
      //set an id (https://github.com/Leaflet/Leaflet/issues/1031)
      marker._stopId = stop.id;
      routeMarkers[stop.id] = marker; //add the marker to the list of routeMarkers
      //initialize layer group
      if (routeMarkersFeatureGroup === null) {
        routeMarkersFeatureGroup = L.featureGroup();
        routeMarkersFeatureGroup.addTo($scope.map);
      }
      routeMarkersFeatureGroup.addLayer(marker);
    };


    var stopMarkerPopupOpen = function(e) {
      var stopId = e.popup._source._stopId;
      if (routeMarkers[stopId] !== undefined) {
          routeMarkers[stopId].setIcon(iconset.red);
      }
    };


    var stopMarkerPopupClose = function(e) {
      var stopId = e.popup._source._stopId;
      if (stopId === null) {
          console.log('stopMarkerPopupClose: Hey! Hey! It seems that you forgot to set stopId...');
          return;
      }
      if (routeMarkers[stopId] !== undefined && routeMarkers[stopId] != null) {
        routeMarkers[stopId].setIcon(iconset.orange);
      }
    };


    $scope.highlightStop = function(stop) {
      routeMarkers[stop.id].openPopup();
      $scope.map.panTo(routeMarkers[stop.id].getLatLng());
    };


    $scope.lowlightStop = function(stop) {
      console.log('loglight stop'  + stop.name);
      //routeMarkers[stop.id].closePopup();
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


    var updateRoute = function(fitToMap) {
      fitToMap = typeof fitToMap !== 'undefined' ? fitToMap : true ;
      $scope.loading = true;
      //clear routeMarkers
      angular.forEach(routeMarkers, function(marker){
        $scope.map.removeLayer(marker);
        delete routeMarkers[marker._stopId];
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
            //console.log('stop in trip: ' + stop.name);
            //add routeMarkers to map if not in map
            //console.log(routeMarkers[stop.id]);
            if (routeMarkers[stop.id] === undefined) {
              //console.log('adding to map ' + stop.name);
              addStopMarkerToMap(stop);
              routeStops[stop.id] = stop;
            }
          });
          var latlngs = [];
          angular.forEach(trip.shape.points, function(pt) {
            //console.log(pt);
            latlngs.push(L.latLng(pt.pt_lat,pt.pt_lon));
          });
          var polyline = L.polyline(latlngs, {color: 'red'}).addTo($scope.map);
          
        });
        if (routeMarkersFeatureGroup && fitToMap) {
          $scope.map.fitBounds(routeMarkersFeatureGroup.getBounds(), {padding: [15,15]});
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
      updateRoute(false);
      routeMarkers[stop.id] = pdfMarkers[stop.id];
      pdfMarkers[stop.id].closePopup();
      ngToast.create('Se ha añadido la parada al trayecto.');
      angular.forEach(routeStops, function(stop){
        //console.log('eliminando route marker', stop.name);
        $scope.map.removeLayer(pdfMarkers[stop.id]);
        addPdfStopMarker(stop, iconset.orange);
      })
    });
  };


  $scope.pdfStopsInMap = false;



  var addPdfStopMarker = function(stop,icon) {
    icon = typeof icon !== 'undefined' ? icon : iconset.default;
    //add the marker
    var marker = L.marker([stop.lat, stop.lon],
      {
        icon: icon,
        draggable: false,
      }
    );
    var template =  '<div><p><strong>{{stop.name}}</strong></p><ul ng-repeat="trip in route.trips"><li><a href="" ng-click="addStopToTrip(stop, trip)">Añadir en dirección {{trip.headsign}}</a></li></ul></div>';
    var linkFn = $compile(angular.element(template));
    var scope = $scope.$new();
    //add var to scope
    scope.stop = stop;
    scope.route = $scope.route;
    scope.marker = marker;
    var element = linkFn(scope);
    marker.bindPopup(element[0]);
    marker.on('popupopen', stopMarkerPopupOpen);
    marker.on('popupclose', stopMarkerPopupClose);
    //set an id (https://github.com/Leaflet/Leaflet/issues/1031)
    marker._stopId = stop.id;
    pdfMarkers[stop.id] = marker; //add the marker to the list of routeMarkers
    $scope.pdfStopsInMap = true
    marker.addTo($scope.map);
  };

  $scope.togglePdfStops = function(route) {
    console.log('togglePdfStops');
    if($scope.pdfStopsInMap) {
      ngToast.create({className:'info', content:'Ocultando paradas dentro de PDF...'});
      angular.forEach(pdfMarkers, function(marker, key) {
        $scope.map.removeLayer(marker);
      });
      angular.forEach(routeStops, function(stop) {
          addStopMarkerToMap(stop);
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
        if (routeMarkers[stop.id] === undefined) {
          addPdfStopMarker(stop, iconset.default);
        } else {
          //remove current marker from map and add the new marker
          $scope.map.removeLayer(routeMarkers[stop.id]);
          addPdfStopMarker(stop, iconset.orange);
        }
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
        stops[response.data.id] = response.data;
        $scope.map.removeLayer(newStopMarker);
        newStop = {};
        newStopMarker = null;
        addPdfStopMarker(response.data);
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
              icon: iconset.redSpin,
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
