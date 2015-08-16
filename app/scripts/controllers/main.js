'use strict';

/**
* @ngdoc function
* @name panatransWebApp.controller:MainCtrl
* @description
* # MainCtrl
* Controller of the panatransWebApp. This controller handles the mapa stuff
*/


angular.module('panatransWebApp')
.controller('MainCtrl', [ '$scope', '$compile', '$http', '$modal', '$routeParams', 'ngToast','Route', 'Stop', 'PanatransMap', function ($scope, $compile, $http, $modal, $routeParams, ngToast, Route, Stop, PanatransMap) {
  
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
  
  $scope.showStopDetail = false; 
  $scope.loadingStopDetail = false;
  $scope.loadingRouteDetail = false;
  
  $scope.stopDetail = {};
  
  $scope.pdfLayersShown = 0; 
  var newStop = {};
  var newStopMarker = null;
  var stopDetailPanelHighlightedStop = null;
  var highlightedStop = stop;
  
  // CONTROLLER METHODS
  
  var isHighlightedStop = function(stop) {
    if ((highlightedStop !== null) && (stop.id === highlightedStop.id)) {
       return true;
    }
    return false;
  }
  
  var setDetailPanelStop= function(stop) {
    $scope.showStopDetail = true;  
    $scope.loadingStopDetail = true;
    
    $scope.stopDetail=stop;
    $scope.map.panToStop($scope.stopDetail);
    Stop.find($scope.stopDetail.id).then( 
      function(data) { 
        console.log('Loaded stop: ' + data.name);
        $scope.stopDetail = data;
        $scope.loadingStopDetail = false;
      },
      function(error) {
        $scope.loadingStopDetail = false;
        console.log('error getting stop details');
        console.log(error);
      }
    );
  }
  
  var stopMarkerPopupOpen = function(e) {
    console.log('main::stopMarkerPopupOpen');
    var stop = e.popup._source._stop;
    if (isHighlightedStop(stop)) {
       return;
    }
    setDetailPanelStop(stop);
  }; // on(popupopen)
  
  
  var stopMarkerPopupClose = function(e) {
    var stop = e.popup._source._stop;
    console.log('stopMarkerPopupClosed: ' + stop.name);
    if (isHighlightedStop(stop)) {
      highlightedStop = null;
    }
  };
  
  
  //Initialization process
   
  $scope.map = PanatransMap('map', _CONFIG.tilelayerUrl, _CONFIG.tilelayerAttribution)  
  $scope.map.$scope = $scope;
  $scope.map.requestUserLocation();
  
  //load all stops
  Stop.all().then(
    function(data) {
      console.log('Stop.all.success');
      $scope.stops = data;
      angular.forEach($scope.stops, function(stop) {
        var marker = $scope.map.createStopMarker(stop);
        marker.on('popupopen', stopMarkerPopupOpen); 
        marker.on('popupclose',stopMarkerPopupClose);
      });
      //$scope.map.alwaysShowStations(true);
      $scope.map.showMarkersInsideBounds();
      
      // PROCESS STOP ARGUMENTS
      //console.log('routeParams');
      //console.log($routeParams);
      if ($routeParams.stopId !== undefined ) {
        $scope.map.panToStop($scope.stops[$routeParams.stopId]);
      } else {
        $scope.map.followUser = true;
      }
    }, function(error) {
      ngToast.create({
        timeout: 8000,
        className: 'danger', 
        content: '<strong>Error obteniendo información de paradas.</strong><br> Prueba en un rato. Si nada cambia tuitéanos: @panatrans'}
      );
    }
  );
  
  //load all routes
  Route.all().then(
    function(data) {
      $scope.loading = false;
      $scope.routes = data;
    }, 
    function(error) {
      $scope.loading = false;
      console.log('Error loading Routes.all()');
      ngToast.create({
        timeout: 8000,
        className: 'danger', 
        content: '<strong>Error obteniendo información de rutas</strong>.<br> Prueba en un rato. Si nada cambia tuitéanos: @panatrans'
        }
      ); 
      console.log(error);
    }
  );
  
 
  $scope.closeStopDetail = function() {
    $scope.showStopDetail = false;
  };
    
  $scope.isLastStopInTrip = Stop.isLastStopInTrip;
  $scope.isFirstStopInTrip = Stop.isFirstStopInTrip;
  
  $scope.highlightStop = function(stop) {
    highlightedStop = stop;
    $scope.map.panToStop(stop);
  };
  
  
  $scope.lowlightStop = function(stop) {
      console.log('loglight stop'  + stop.name);
  };
  
 
  $scope.goToStop = function(stop) { 
    console.log('setting stop detail to: ' + stop.name);
    highlightedStop = null;
    setDetailPanelStop(stop);
    $scope.map.panToStop(stop);
  };
  
  // searches for stop_sequences on the route and sets the orange icon
  //route: has trips and trips have stop_sequences
  $scope.highlightRoute = function(route) {

  };
    
  
  // searches for stop_sequences on the route and sets the grey icon
  //route: has trips and trips have stop_sequences
  $scope.lowlightRoute = function(route) {
  };
 
    
  // Display/hide edit route stops on mouse over
  $scope.hoverIn = function(){
    this.hoverEdit = true;
  };
  $scope.hoverOut = function(){
    this.hoverEdit = false;
  };
    
    
  $scope.toggleTripDetails = function(route) {
    
    console.log('toggle Trip details for ' + route.name);
    if ((this.showTripDetails === false) || (this.showTripDetails === undefined)){ 
      this.showTripDetails = true; 
      $scope.loadingRouteDetail = true;
      Route.find(route.id).then(
        function(data) {
          console.log(data);
          angular.forEach($scope.stopDetail.routes, function(route, key){
            if (route.id == data.id) {
              $scope.stopDetail.routes[key] = data;
            }
          });
          $scope.loadingRouteDetail = false;
        },
        function(error) {
          console.log('error loading trip details')
          console.log(error);
        } 
      );
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
          setStopMarkerEditMode($scope.map.stopMarkers[stopId]); // TODO do not use directly this
        }
        if (reason === 'stopDeleted') {
          console.log('deletedStop, eliminating marker and stop');
          $scope.map.removeLayer($scope.map.stopMarkers[stopId]);
          ngToast.create('Se ha borrado la parada ' + $scope.stops[stopId].name);
          delete $scope.map.stopMarkers[stopId];
          delete $scope.stops[stopId];
          //TODO add feedback to user
        }
      });
    };
    
  //hides all pdf layers currently active on the map
  $scope.hideAllPdfLayers = function() {
    $scope.map.hideAllRoutePdf();
    $scope.pdfLayersShown = 0;
    ngToast.create({ className: 'info', content: 'Se ha dejado de mostrar los PDF en el mapa'});
  };
  
  
  $scope.togglePdfLayer = function(route) {
    $scope.map.isRoutePdfAvailable(route).then(
      function() {
        if ($scope.map.toggleRoutePdf(route)) { 
           $scope.pdfLayersShown++;
          ngToast.create('En unos segundos se mostrará el PDF de la ruta en el mapa...'); 
        } else {
          $scope.pdfLayersShown--;
          ngToast.create({ className: 'info', content: 'Se ha dejado de mostrar el PDF en el mapa'});
        }
      }, 
      function(data, status) {
        console.log('Geolocated pdf does not exists');
        console.log(data);
        console.log(status);
        ngToast.create({className: 'danger', content: 'No hay asociado con esta ruta un PDF Geolocalizado'});
      } 
      );
    };
    
    var setStopMarkerEditMode = function(stopMarker) {
      console.log('setStopMarkerEditMode');
      //center and zoom map to stop
      stopMarker.setIcon($scope.map.iconset.redSpin);
      stopMarker.dragging.disable();
      stopMarker.dragging.enable();
      stopMarker.off('popupopen', stopMarkerPopupOpen);
      stopMarker.off('popupclose', stopMarkerPopupClose);
      $scope.map.setView(stopMarker.getLatLng(), 18);
      var stop = $scope.stops[stopMarker._stop.id];    
      var html = '<div><h4>' + stop.name + '</h4><p><strong>Arrástrame</strong> hasta mi localización.<br>Después dale a: </p><button ng-click="saveStopLocation(stop)"class="btn btn-primary">Actualizar</button> o a <a href="" ng-click="cancelStopMarkerEditMode(stopMarker)">cancelar</a></div>';
      var linkFn = $compile(angular.element(html));
      var scope = $scope.$new();
       //add var to scope
      scope.stop = stop;
      scope.stopMarker = stopMarker;
      var element = linkFn(scope);
      //console.log(element);
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
      stopMarker.setIcon($scope.map.iconset.default);
      console.log('setting popup content = ' + $scope.stops[stopMarker._stop.id].name);
      stopMarker.bindPopup($scope.stops[stopMarker._stop.id].name);
      //suscribe again to eventlistener
      stopMarker.on('popupopen', stopMarkerPopupOpen);
      stopMarker.on('popupclose', stopMarkerPopupClose); 
      stopMarker.openPopup();
    };
    
    
    $scope.saveStopLocation = function(stop) {
      console.log('saveStopLocation called');
      stop.update();
      $scope.cancelStopMarkerEditMode($scope.map.stopMarkers[stop.id]);
      
      /*$http.put(_CONFIG.serverUrl + '/v1/stops/' + stop.id, {stop: {lat: stop.lat, lon: stop.lon}})
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
      */
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
        }
      };
      var modalInstance = $modal.open(modalConfig)
      modalInstance.result.then(
        function(){ //close
          console.log('getting updated version of the modal');
          Stop.find($scope.stopDetail.id, true).then(
            function(stop) {
              $scope.stopDetail = stop;
            },
            function(error) {
              console.log('error updating stop');
            }
          );
        }, 
        function(){ //dismiss 
          console.log('EditRouteModal dismissed');
        }
      );  
    };
    
     
    //
    // NEW STOP - BUTTON IS HIDDEN RIGHT NOW *** 
    //  
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
        ///add marker to markers
        newStopMarker._stop = response.data; 
        newStopMarker.closePopup();
        
        newStopMarker.setIcon($scope.map.iconset.default);
        newStopMarker.bindPopup(response.data.name);
        newStopMarker.on('popupopen', stopMarkerPopupOpen);
        newStopMarker.on('popupclose', stopMarkerPopupClose); 
        //update popup
        $scope.map.stopMarkers[response.data.id] = newStopMarker;
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
      $scope.map.removeLayer(newStopMarker);
      //clear marker and stop for next round  
      newStop = {};
      newStopMarker = null;
    };
    
    
    //TODO move this to a Trip Resource
    $scope.isCircularTrip = function(trip) {
      return Stop.isCircularTrip(trip);
    }
    
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
        
        if (newStop.lat == null) { 
          newStop.lat = mapCenter.lat;
        }
        if (newStop.lon == null) { 
          newStop.lon = mapCenter.lng;
        }
        newStopMarker = L.marker([newStop.lat,newStop.lon], 
            { 
              icon: $scope.map.iconset.redSpin,
              draggable: true,
              bounceOnAdd: false, 
              bounceOnAddOptions: {duration: 500, height: 100}, 
              bounceOnAddCallback: function() {console.log('bouncing done');}
            }).addTo($scope.map); //http://stackoverflow.com/questions/17662551/how-to-use-angular-directives-ng-click-and-ng-class-inside-leaflet-marker-popup    
        var html = '<div><h4>' + newStop.name +'</h4><p><strong>Arrástrame</strong> hasta mi localización.<br>Después dale a: </p><button ng-click="saveNewStop()"class="btn btn-primary">Guardar</button> o <a ng-click="cancelSaveNewStop()">cancelar</a></div>';
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

      //Follow User button
      $scope.toggleFollowUser = function() {
        $scope.map.panToUser();
        //$scope.map.toggleFollowUser();
      }
  
  }]
); // main controller







  
  

  
  
