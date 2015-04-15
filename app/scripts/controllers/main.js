'use strict';

/**
* @ngdoc function
* @name panatransWebApp.controller:MainCtrl
* @description
* # MainCtrl
* Controller of the panatransWebApp. This controller handles the mapa stuff
*/

/** ng toast config **/
angular.module('panatransWebApp')
  .config(['ngToastProvider', function(ngToast) {
    ngToast.configure({
      verticalPosition: 'top',
      horizontalPosition: 'center',
      maxNumber: 3
    });
  }]);

angular.module('panatransWebApp')
.controller('MainCtrl', [ '$scope', '$compile', '$http', '$modal',  'ngToast', function ($scope, $compile, $http, $modal, ngToast) {
  
  // it seems that the controller is loaded twice. Doing that makes initialize twice the map, which makes a mess
  if ($scope.map) { 
    return;
  }
  
  //
  var _isMobile = (function() {
          var check = false;
          (function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4)))check = true;})(navigator.userAgent||navigator.vendor||window.opera);
          return check;
  })();
  
  //ngToast.create("isMobile: " + _isMobile);
  
  $scope.routes = {}; // routes by route.id
  $scope.stops = {}; // stops by stop.id, ex: stops[<id>] == (stop object)
  $scope.stopsArr = {};
  $scope.showStopDetail = false; 
  $scope.loadingStopDetail = false;
  $scope.stopDetail = {};
  
  var userLocationMarker = null;
  var userLocationCircle = null;
  
  var newStop = {};
  var newStopMarker = null;
  var stopDetailPanelHighlightedStop = null;
  var markers = {}; // stop markers by stop.id
  var pdfLayers = {}; // pdf layers by route.id
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
    zoom: 16,
    zoomControl: false
  });
  
  L.tileLayer( _CONFIG.tilelayerUrl, {
    attribution: _CONFIG.tilelayerAttribution,
    maxZoom: 18
  }).addTo($scope.map);
  $scope.map.setZoom(16);
  $http.get(_CONFIG.serverUrl + '/v1/routes?with_trips=true' + _CONFIG.delay)
  .success(function(response) {
    $scope.routesArray = response.data;
    $.each(response.data, function(index, route) {
      $scope.routes[route.id] = route;
    });
  });
  
  var addStopToMap = function(stop) {
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
  };
  
  //get stops
  $http.get(_CONFIG.serverUrl + '/v1/stops/?' + _CONFIG.delay)
  .success(function(response) {
    console.log('Success getting stops. number of stops: ' + response.data.length);
    //console.log(response.data);
    $scope.stopsArr = response.data;
    $.each(response.data,function(index, stop) {
      $scope.stops[stop.id] = stop;
      addStopToMap(stop);
    }); // end each  
  }); //end $http.success
    
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
    
    var removeMarkersNotInBounds = function() { 
      var bounds = $scope.map.getBounds().pad(0.2);
      angular.forEach(markers, function(value) {
        if (! bounds.contains(value.getLatLng())) {
          //delete markers[key];
          $scope.map.removeLayer(value);
        }
      });
    };
    
    var addMarkersInBounds = function() {
      var bounds = $scope.map.getBounds().pad(0.2);
      console.log('bounds:');
      console.log(bounds);
      angular.forEach($scope.stops, function(value, key) {
        if (bounds.contains(markers[key].getLatLng())) {
            $scope.map.addLayer(markers[key]);
            console.log('adding marker key:' + key);
        }
      });
    };
    
    var mapHasMarkers = true;
    var onZoomEnd = function() {
      console.log('onZoomEnd');
      console.log('zoomLevel: ' + $scope.map.getZoom());
      if ($scope.map.getZoom() < 15) {
        //display only important markers
        //remove all markers
        console.log('deleting all markers from map');
        angular.forEach(markers, function(value) {
          $scope.map.removeLayer(value);
        });
        mapHasMarkers = false;
      } else { // add markers in bounds if not
        if (mapHasMarkers) {
          return;
        } 
        addMarkersInBounds();
        mapHasMarkers = true;
      }   
    };
    
    var onMoveEnd = function() {
      console.log('onMoveEnd');
      if ($scope.map.getZoom() >= 15) { 
        removeMarkersNotInBounds();
        addMarkersInBounds();
      }
    };

    $scope.map.on('locationfound', onLocationFound);
    $scope.map.on('locationerror', onLocationError);
    $scope.map.locate({watch: true, setView: false, enableHighAccuracy: true});
    $scope.map.on('zoomend', onZoomEnd);
    $scope.map.on('moveend', onMoveEnd);
    
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
      $scope.map.panTo(markers[stopId].getLatLng());
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
      $scope.map.panTo(markers[stop.id].getLatLng());
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
          ngToast.create('Se ha borrado la parada ' + $scope.stops[stopId].name);
          delete markers[stopId];
          delete $scope.stops[stopId];
          //TODO add feedback to user
        }
      });
    };
    
    $scope.togglePdfLayer = function(route) {
      //var tilesBaseUrl ='https://www.googledrive.com/host/0B8O0WQ010v0Pfl92WjctUXNpTTZYLUUzMUdReXJrOFJLdDRYWVBobmFNTnBpdEljOE9oNms'
      var tilesBaseUrl ='https://dl.dropboxusercontent.com/u/22698/metrobus/';
      $http.get(tilesBaseUrl + route.id + '/kml/tilemapresource.xml')
      .success(function() {
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
            ngToast.create({ className: 'info', contents: 'Se ha dejado de mostrar el PDF en el mapa'});
        }
      })
      .error(function(data, status){
        console.log(data);
        console.log(status);
        console.log('Geolocated pdf does not exists');
        ngToast.create({className: 'danger', contents: 'No hay asociado con esta ruta un PDF Geolocalizado'});
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
      $scope.map.setView(stopMarker.getLatLng(), 18);
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







  
  

  
  
