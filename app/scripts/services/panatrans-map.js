'use strict';

/**
* Leaflet map with some initializations and extensions useful for panatrans
*
* Requires angular, leaflet, leaflet awesome markers and bouncemaker plugins
*/

angular.module('panatransWebApp').factory('PanatransMap',['$compile', '$q', '$http', function($compile, $q, $http) {
  return function(mapId, tileLayerUrl, tileLayerAttribution) {

    function StopMarker(lat, lng, options) {
      var marker = L.marker(lat,lng, options);
    
      marker._stop = {};
      //sets an angular template it links the stop information
      marker.setPopupTemplate = function($scope, template) {
        template = typeof template !== 'undefined' ? template : '<p>{{stop.name}}</p>';
        var linkFn = $compile(angular.element(template));
        var scope = $scope.$new();
        //add var to scope
        scope.stop = this._stop;
        scope.stopMarker = this;
        var element = linkFn(scope);
        //console.log(element);
        marker.bindPopup(element[0]);      
      }
  
      return marker
    };
        
    var map = L.map(mapId, {
      center: [8.9740946, -79.5508536],
      zoom: 16,
      zoomControl: false
    });
      
    map.$scope = null;
      
    //array of stops hightlighted
    map.highlightedStops = [];
  
    map.stopMarkers = {};
    // Types of markers (requires AwesomeMarkers)
    map.iconset = {
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
  
    map.selectedMarkerIcon = map.iconset.red;
    map.highlightedMarkerIcon = map.iconset.orange;
    map.defaultMarkerIcon = map.iconset.default;
    map.minZoomWithMarkers = 15;
  
    ///////// MAP EVENTS
  
    map.mapHasMarkers = true;
  
    map.onZoomEnd = function() {
      console.log('onZoomEnd');
      console.log('zoomLevel: ' + this.getZoom());
      if (this.getZoom() < map.minZoomWithMarkers) {
        //display only important markers -- TODO
        this.hideAllMarkers();
        map.mapHasMarkers = false;
      } else { // add markers in bounds if there not already added
        if (this.mapHasMarkers) {
          return;
        } 
        map.showMarkersInsideBounds();
        this.mapHasMarkers = true;
      }   
    };
  
    map.onMoveEnd = function() {
      console.log('onMoveEnd');
      if (this.getZoom() >= 15) { 
        this.hideMarkersOutsideBounds();
        this.showMarkersInsideBounds();
      }
    }; 
  
  
    map.stopMarkerPopupOpen = function(e) {
      console.log('Panatrans stopMarker Popup Open');
      var stop = e.popup._source._stop;
      map.stopMarkers[stop.id].setIcon(map.selectedMarkerIcon);
      map.panToStop(stop);
    };
  
    map.stopMarkerPopupClose = function(e) {
      console.log('Panatrans stopMarker Popup Close');
      var stop = e.popup._source._stop;
      if (map.stopMarkers[stop.id] === undefined ) {
        return;
      }
      var marker = map.stopMarkers[stop.id];
      if (map.isStopHighlighted(stop)) {
        marker.setIcon(map.highlightedIcon);
      } else { 
        marker.setIcon(map.defaultMarkerIcon);
      }
    };
  

  
    //  config a stop marker, but does not add it as map layer
    //  stop = stop object
    //  template optional (angular html template to set as popup)
    map.createStopMarker = function(stop, template) { 
      var marker = StopMarker([stop.lat, stop.lon], {
        icon: map.defaultMarkerIcon,
        draggable: false
      });
      //identify the marker: (https://github.com/Leaflet/Leaflet/issues/1031)
        marker._stop = stop; 
        marker.setPopupTemplate(map.$scope, template)
    
        //marker.on('popupopen', this.stopMarkerPopupOpen); 
        //marker.on('popupclose', this.stopMarkerPopupClose);
        this.stopMarkers[stop.id] = marker; //add the marker to the list of markers
        return marker;
      };
  
  
      // centers map in stop lat and lon.
      map.panToStop = function(stop) {
        map.panTo(map.stopMarkers[stop.id].getLatLng());
      };
  
      map.openStopPopup = function(stop) {
        console.log('requesting open popup of :' +  stop.name);
        map.stopMarkers[stop.id].openPopup();
      };
      
  
      //removes marker from map and list of markers
      map.removeStopMarker = function(stop) {
        map.removeLayer(stopMarkers[stop]);
        delete this.stopMarkers[stop.id]
      }
   
   
      //removes all stop markers.
      map.removeAllStopMarkers = function() {
        angular.forEach(stopMarkers, function(stopMarker) {
          this.removeStopMarker(StopMarker.stop);
        });
      };
   
   
      //hides all markers on map (they are not displayed but still exist) 
      map.hideAllMarkers = function() {
        angular.forEach(this.stopMarkers, function(marker) {
          map.removeLayer(marker);
        });
      };
  
      //hides markers that are outdide map bounds    
      map.hideMarkersOutsideBounds = function() { 
        console.log('hideMarkerOutsideBounds, started');
        var bounds = this.getBounds().pad(0.2);
        angular.forEach(this.stopMarkers, function(marker) {
          if (! bounds.contains(marker.getLatLng())) {
            //delete markers[key];
            map.removeLayer(marker);
          }
        });
        console.log('hideMarkersOutsideBounds, finished');
      };
  
  
      //shows markers that are within the map bounds
      map.showMarkersInsideBounds = function() {
        console.log('showMarkerInsideBounds, started');
        var bounds = this.getBounds().pad(0.2);
        angular.forEach(this.stopMarkers, function(marker) {
          if (bounds.contains(marker.getLatLng())) {
            map.addLayer(marker);
          }
        });
        console.log('showMarkerInsideBounds, started');
      };
  
  
      // is Stop hightlighted?
      map.isStopHighlighted = function(stop) {
        var i;
        for (i = 0; i < map.highlightedStops.length; i++) {
          if (map.highlightedStops[i] === stop) {
            return true;
          }
        }
        return false;
      };
  
      ////////////////////////////////////////// PDF Layers
      map.pdfLayers = {};
  
      map.isRoutePdfAvailable = function(route) {
        var deferred = $q.defer();
        if (map.pdfLayers[route.id] !== undefined) {
          deferred.resolve();
        } else { 
          var tilesBaseUrl ='https://dl.dropboxusercontent.com/u/22698/metrobus/';
          $http.get(tilesBaseUrl + route.id + '/kml/tilemapresource.xml')
          .success(function(response) {
            //response is an xml that has the boundaries of the map. We extract that info
            var boundsArr = response.match(/(minx|miny|maxx|maxy)=\"([\-\.\d]+)\"/g);
            //console.log(boundsArr);
            //["minx="9.123"","miny="number""...
            angular.forEach(boundsArr, function(x,k) {
              boundsArr[k] = x.match(/([\-\.\d]+)/g)[0];
            }); 
            var bounds = [[boundsArr[1],boundsArr[0]],[boundsArr[3],boundsArr[2]]]; 
            //$scope.map.fitBounds([[boundsArr[1],boundsArr[0]],[boundsArr[3],boundsArr[2]]]);
            console.log(boundsArr);
            console.log('cool! The pdf is geolocated route_id:' + route.id);
            var options = {
              minZoom: 10,
              maxZoom: 20,
              maxNativeZoom: 14, 
              opacity: 0.8,
              tms: true
            };
            var tilesUrl = tilesBaseUrl + route.id + '/kml/{z}/{x}/{y}.png';
            console.log('tilesUrl: ' + tilesUrl);
            map.pdfLayers[route.id] = L.tileLayer(tilesUrl, options);
            map.pdfLayers[route.id]._bounds = bounds; 
            map.pdfLayers[route.id]._show = false;
            deferred.resolve();
          })
          .error(function(data, status) {
            deferred.reject(data, status);
          });
        }
        return deferred.promise;
      };
      
      map.showRoutePdf = function(route){
        console.log('showRoutePdf:' + route.id);
        if (map.pdfLayers[route.id]._show === false) { 
          map.pdfLayers[route.id].addTo(map); 
          //map.fitBounds(map.pdfLayers[route.id]._bounds);
          map.pdfLayers[route.id]._show = true;
        }
      };
      
      map.hideRoutePdf = function(route) {
        console.log('hideRoutePdf:' + route.id);
        if (map.pdfLayers[route.id]._show === true) { 
          map.removeLayer(map.pdfLayers[route.id]); 
          map.pdfLayers[route.id]._show = false;
        }
      };
      
      //returns the current status of the pdf 
      map.toggleRoutePdf = function(route) {
        console.log('toggleRoutePdf:' + route.id);
        map.pdfLayers[route.id]._show === false ? map.showRoutePdf(route) : map.hideRoutePdf(route); 
        return  map.pdfLayers[route.id]._show
      };

  
      //tile layer
      map.tileLayer = L.tileLayer( tileLayerUrl, {
        attribution: tileLayerAttribution,
        maxZoom: 20
      });
  
      ///////////////////////////////// User location
  
      map.userLocationMarker = null;
      map.userLocationCircle = null;
      map.followUser = false;
  
      map.locateUser = function() {
        map.locate({watch: true, setView: false, enableHighAccuracy: true});
      };
    
      map.onLocationFound = function(e) {
        if (e.accuracy === null) {
          return;
        }
        var radius = e.accuracy / 2;
        if (userLocationMarker === null) {  // add to map
          map.userLocationMarker = L.marker(e.latlng, {icon: map.iconset.userLocation});
          map.userLocationMarker.addTo(map);
          userLocationCircle = L.circle(e.latlng, radius);
          userLocationCircle.addTo(map);
          userLocationMarker.bindPopup('Estás aquí');
          map.panTo(e.latlng);
        }
        //update
        userLocationMarker.setLatLng(e.latlng);
        userLocationCircle.setLatLng(e.latlng);
        userLocationCircle.setRadius(radius);

        if (map.followUser) {
          map.panTo(e.latlng);
        }
      };

      map.onLocationError = function(e) {
        console.log(e.message);
      };
  
      /////////////////////// final config
  
      map.on('locationfound', map.onLocationFound);
      map.on('locationerror', map.onLocationError);
      map.tileLayer.addTo(map);
      map.on('zoomend', map.onZoomEnd);
      map.on('moveend', map.onMoveEnd);
  
      return map;
    };
  }]);