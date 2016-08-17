'use strict';

/**
* Leaflet map with some initializations and extensions useful for panatrans
*
* Requires angular, leaflet, leaflet awesome markers and bouncemaker plugins
*/

angular.module('panatransWebApp').factory('PanatransMap',['$compile', '$q', '$http', function($compile, $q, $http) {

  var maps = {};

  return function(mapId, tileLayerUrl, tileLayerAttribution) {


    // Stop Marker Class
    // Standard Leaflet marker with a few more methods
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
      };
      marker.isStation = function() {
        var regex = /estaci[oó]n|albrook/ig;
        return regex.test(marker._stop.name);
      };

      return marker;
    }

    function TripPolyline(trip, options) {

      var polyline = L.polyline([],options);

      polyline.arrowMarkers = [];
      polyline.trip = trip;

      polyline.setArrows = function(map){
        //remove current arrows
        angular.forEach(this.arrowMarkers, function(marker) {
          map.removeLayer(marker);
        });
        //clear the array
        this.arrowMarkers = [];
        //add new arrows
        var points = this.getLatLngs();
        var step = points.length/10;
        for (var p = 0; p +1  < points.length; p = p+ Math.round(step)) {
          var diffLat = points[p+1]['lat'] - points[p]['lat'];
          var diffLng = points[p+1]['lng'] - points[p]['lng'];
          var center = [points[p]['lat'] + diffLat/2,points[p]['lng'] + diffLng/2];
          var angle = 360 - (Math.atan2(diffLat, diffLng)*57.295779513082);
          var arrowMarker = new L.marker(center,{
            icon: new L.divIcon({
              className : 'arrowIcon',
              iconSize: new L.Point(30,30),
              iconAnchor: new L.Point(15,15),
              html : '<div style="opacity:0.5; color: ' + map.tripLineColor + ';font-size: 20px; -webkit-transform: rotate(' + angle + 'deg)"><i class="fa fa-angle-right"></i></div>'
            })
          });
          //save reference to layer
          this.arrowMarkers.push(arrowMarker);
          arrowMarker.addTo(map);
        }
      }; //set arrows

      polyline.removeArrows = function(map) {
        angular.forEach(this.arrowMarkers, function(arrow) {
          map.removeLayer(arrow);
        });
      };

      //sets Trip line lats and lons
      //gtfsPoints is an array of shapes.txt.
      polyline.setTripLine = function(gtfsPoints) {
        console.log('setTripLine with these points:');
        console.log(gtfsPoints);
        var latlngs = [];
        angular.forEach(gtfsPoints, function(pt) {
          //console.log(pt);
          latlngs.push(L.latLng(pt.ptLat,pt.ptLon));
        });
        this.setLatLngs(latlngs);
      }; // setTripLine

      //add the trip line
      polyline.setTripLine(trip.shape.points);
      return polyline;
    }


    // MAP REQUIRED INITIALIZATION

    //if the map was already initialized return it. See at the end of the function
    if (maps[mapId] !== undefined) {
      if ($('#' + mapId).hasClass('leaflet-container')) {
        console.log('PanatransMap: map already initialized');
        $('#map-container').html('<div class="map" id="map"');
      } else {
        console.log('PanatransMap: map exists but empty. Recreate it');
        maps[mapId].remove();
      }
    }
    // if not initialize the map again
    console.log('Init PanatransMap');

    var map = L.map(mapId, {
      center: [8.9740946, -79.5508536],
      zoom: 16,
      zoomControl: false
    });

    var BusIcon = L.Icon.extend({
      options: {
        shadowUrl: 'images/bus-shadow.svg',
        iconSize:     [23, 49],
        shadowSize:   [37, 23],
        iconAnchor:   [13, 47],
        shadowAnchor: [1, 23],
        popupAnchor:  [-0, -46]
      }
    });
    // Types of markers (requires AwesomeMarkers)
    map.iconset = {
      default: new BusIcon({iconUrl: 'images/bus-default.svg'}),
      selected: new BusIcon({iconUrl: 'images/bus-selected.svg'}),
      highlighted: new BusIcon({iconUrl: 'images/bus-highlighted.svg'}),
      edit: new BusIcon({iconUrl: 'images/bus-edit.svg'}),
      user: new L.icon({iconUrl: 'images/user.svg',iconSize: [14,39], iconAnchor: [7,39], popupAnchor: [0,-36]}),
      //kept old icons, there are parts not updated
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

    //////////////////////////////////////////// MAP VARIABLES

    map.$scope = null;

    // list of marker objecs. The key is the stop id
    // ex: map.stopMarkers[key] = <marker for stop.id = key
    map.stopMarkers = {};

    //list of the ids of the markers shown (key is the stop id)
    //ex: map.stopIdsShow[1] = true
    // dont modify. Handled by showMarkerForStop(), hideMarkerForStop()
    map.showStopIds = {};

    map.highlightedStopIds = {};

    //object with keys of ids of markers that are not removed on zoom out
    //ex: map.markersAlwaysShown[1] <-- stopMarker with _stop.id == 1 is always shown
    map.alwaysShownStopIds = {};

    //list of ids of station
    //ex: map.stationIds[key] = true
    map.stationIds = {};

    map.tripLines = {};
    map.tripLineColor = 'red';

    //Configuration of markers depending on its status
    map.selectedMarkerIcon = map.iconset.selected;
    map.highlightedMarkerIcon = map.iconset.highlighted;
    map.defaultMarkerIcon = map.iconset.default;

    // If the map is farther than this => the map does not show markers
    map.minZoomWithMarkers = 15;

    // Does the map have any marker not in exceptions visible?
    map.mapHasMarkers = true;

    // List of PDF Tile Layers.
    map.pdfLayers = {};


    //User location vars
    map.userLocationMarker = null;  // there is a marker and a circle with the radius
    map.userLocationCircle = null;

    //shall the map follow the user
    map.followUser = false;

    //a var to track if the requested pan to stop was programatically requested (ex: following user location)
    map.autoPan = true;


    ////////////////////////////////////////////////// MAP EVENT HANDLERS


    map.onZoomStart = function() {
      console.log('onZoomStart');
      map.autoPan = true; // TODO rename to something like isUserAction
    };


    map.onZoomEnd = function() {
      console.log('onZoomEnd');
      console.log('zoomLevel: ' + this.getZoom());
      if (this.getZoom() < map.minZoomWithMarkers) {
        //display only important markers -- TODO
        this.hideAllMarkersButExceptions();
        this.showZoomMessage();
        map.mapHasMarkers = false;
      } else { // add markers in bounds if there not already added
        this.hideZoomMessage();
        if (this.mapHasMarkers) {
          return;
        }
        map.showMarkersInsideBounds();
        this.mapHasMarkers = true;
      }
    };


    map.onMoveEnd = function() {
      if (! map.autoPan) {
        map.$scope.$apply(function() {
          map.followUser=false;
        });
      }
      console.log('pantrans-map:: onMoveEnd; followUser:' + map.followUser + ' autoPan:' + map.autoPan);
      map.autoPan = false;
      if (this.getZoom() >= map.minZoomWithMarkers) {
        this.hideMarkersOutsideBounds();
        this.showMarkersInsideBounds();
      }

    };


    map.stopMarkerPopupOpen = function(e) {
      var stop = e.popup._source._stop;
      console.log('panatrans-map: stopMarkerPopupOpen: OPEN ' + stop.name);
      map.stopMarkers[stop.id].setIcon(map.selectedMarkerIcon);
      //map.panToStop(stop);
    };


    map.stopMarkerPopupClose = function(e) {
      var stop = e.popup._source._stop;
      console.log('panatrans-map: stopMarkerPopupClose: CLOSE ' + stop.name);
      if (map.highlightedStopIds[stop.id]) {
        map.stopMarkers[stop.id].setIcon(map.highlightedMarkerIcon);
      } else {
        map.stopMarkers[stop.id].setIcon(map.defaultMarkerIcon);
      }
    };

    // If the map is too far away, it hides all markers, avoids performance issues
    map.showZoomMessage = function() {
      console.log('showing zoom message');
      if (! $('#map-message').length) {
        $('body').append('<div id="map-message" class="map-message">Haz zoom para ver las paradas</div>').fadeIn();
      }
      $('#map-message').fadeIn();
    };


    map.hideZoomMessage = function() {
      console.log('hiding zoom message');
      if ($('#map-message').length) {
        $('#map-message').fadeOut();
      }
    };


    /////////////////////////////////////////////////////////// MAP METHODS


    //  config a stop marker, but does not add it as map layer
    //  stop = stop object
    //  template optional (angular html template to set as
    map.createStopMarker = function(stop, template) {
      var marker = new StopMarker([stop.lat, stop.lon], {
        icon: map.defaultMarkerIcon,
        draggable: false
      });
      //to identify the marker: (https://github.com/Leaflet/Leaflet/issues/1031)
        marker._stop = stop;
        marker.setPopupTemplate(map.$scope, template);

        marker.on('popupopen', this.stopMarkerPopupOpen);
        marker.on('popupclose', this.stopMarkerPopupClose);
        this.stopMarkers[stop.id] = marker; //add the marker to the list of markers
        return marker;
      };


      // centers map in stop lat and lon.
      map.panToStop = function(stop) {
        map.autoPan = false;
        map.panTo(map.stopMarkers[stop.id].getLatLng(), {animate:true});
        setTimeout(function () {
          if(map.getZoom() <= map.minZoomWithMarkers){
            map.setZoom(map.minZoomWithMarkers);
          }
        }, 400);
        // if stop is not displayed because we zoom is to small, then ZOOM IN
      };

      map.openStopPopup = function(stop) {
        console.log('requesting open popup of :' +  stop.name);
        map.stopMarkers[stop.id].openPopup();
      };


      //adds an EXISTING marker linked to a stop to the map
      map.showMarkerForStop = function(stop) {
        //if the map has the layer => first hide it
        if (!map.hasLayer(map.stopMarkers[stop.id])) {
        //  map.hideMarkerForStop(stop);
        map.stopMarkers[stop.id].addTo(map);
        }

        map.showStopIds[stop.id] = true;
      };

      //Hides from the map the layer (marker) linked ot this stop
      map.hideMarkerForStop = function(stop) {
        map.removeLayer(map.stopMarkers[stop.id]);
        if (map.showStopIds[stop.id] !== undefined) {
          delete map.showStopIds[stop.id];
        }
      };

      //exceptions are awaysShownIds and stationIds
      map.hideMarkerForStopIfIsNotAnException = function(stop) {
        if (map.stationIds[stop.id] === undefined) { //is not a station
          if (map.highlightedStopIds[stop.id] === undefined) { //is not a regular exception
            map.hideMarkerForStop(stop);
          }
        }
      };


      //removes marker from map and list of markers
      map.removeMarkerForStop = function(stop) {
        map.hideMarkerForStop(stop);
        delete this.stopMarkers[stop.id];
      };


      //removes all stop markers.
      map.removeAllStopMarkers = function() {
        angular.forEach(map.stopMarkers, function(stopMarker) {
          this.removeMarkerForStop(stopMarker._stop);
        });
      };

      //hides all markers except thos
      map.hideAllMarkersButExceptions = function() {
        angular.forEach(map.showStopIds, function(value, stopId) {
          map.hideMarkerForStopIfIsNotAnException(map.stopMarkers[stopId]._stop);
        });
      };


      //hides all markers on map (they are not displayed but still exist)
      map.hideAllMarkers = function() {
        angular.forEach(map.stopMarkers, function(marker) {
            map.hideMarkerForStop(marker._stop);
        });
      };

      //hides markers that are outdide map bounds
      map.hideMarkersOutsideBounds = function() {
        console.log('panatrans-map:: hideMarkerOutsideBounds, started');
        console.log('panatrans-map:: hide marker outside bounds exceptions');
        console.log(map.stationIds);
        console.log(map.highlightedStopIds);
        var bounds = this.getBounds().pad(0.2);
        angular.forEach(this.stopMarkers, function(marker) {
          if (! bounds.contains(marker.getLatLng())) {
              //console.log('panatrans-map::hideMarkersOutsideBounds hidingStop: ' + marker._stop.name);
              map.hideMarkerForStopIfIsNotAnException(marker._stop);
          }
        });
        console.log('panatrans-map:: hideMarkersOutsideBounds, finished');
      };


      //shows markers that are within the map bounds
      map.showMarkersInsideBounds = function() {
        //console.log('showMarkerInsideBounds, started');
        var bounds = this.getBounds().pad(0.2);
        angular.forEach(this.stopMarkers, function(marker) {
          if (bounds.contains(marker.getLatLng())) {
            map.showMarkerForStop(marker._stop);
          }
        });
        //console.log('showMarkerInsideBounds, started');
      };

      map.addTripLine = function(trip) {
        var tripLine = new TripPolyline(trip, {color: map.tripLineColor, className: 'panatrans-map-trip'});
        tripLine.addTo(map);
        map.tripLines[trip.id] = tripLine;
      }
      map.zoomToTrip = function(trip) {
        console.log('panatrans-map::zoomToTrip ' + trip.id );
        map.fitBounds(map.tripLines[trip.id].getBounds(), {padding: [15,15]});
      }

      map.removeTripLine = function(trip) {
        if (map.tripLines[trip.id] != null) {
          map.removeLayer(map.tripLines[trip.id]);
        }
      }

      map.highlightTripStops = function(trip) {
        angular.forEach(trip.stopSequences, function(stopSequence) {
          var stop = stopSequence.stop
          map.highlightedStopIds[stop.id] = true;
          map.stopMarkers[stop.id].setIcon(map.highlightedMarkerIcon);
          map.showMarkerForStop(stop);
        });
      }

      map.lowlightTripStops = function(trip) {
        angular.forEach(trip.stopSequences, function(stopSequence) {
          var stopId = stopSequence.stop.id
          delete map.highlightedStopIds[stopId];
          if (map.stopMarkers[stopId]) {
            map.stopMarkers[stopId].setIcon(map.defaultMarkerIcon);
          }
        });
      }

      ////////////////////////////////////////// PDF Layers



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
        map.hideRoutePdfByRouteId(route.id);
      };


      map.hideRoutePdfByRouteId = function(routeId) {
        console.log('hideRoutePdf:' + routeId);
        if (map.pdfLayers[routeId]._show === true) {
          map.removeLayer(map.pdfLayers[routeId]);
          map.pdfLayers[routeId]._show = false;
        }
      };


      //returns the current status of the pdf
      map.toggleRoutePdf = function(route) {
        console.log('toggleRoutePdf:' + route.id);
        if (map.pdfLayers[route.id]._show === false) {
          map.showRoutePdf(route);
        } else {
          map.hideRoutePdf(route);
        }
        return  map.pdfLayers[route.id]._show;
      };


      // hides all pdf routes
      map.hideAllRoutePdf = function() {
        angular.forEach(map.pdfLayers, function(routePdf,key){
          map.hideRoutePdfByRouteId(key);
        });
      };


      ///////////////////////////////// User location

      // start requesting the user location
      map.requestUserLocation = function() {
        map.locate({watch: true, setView: false, enableHighAccuracy: true});
      };

      //activate / desactivates follow User. If activates follow user centers map in user location
      map.toggleFollowUser = function() {
        map.followUser = map.followUser ? false : true;
        console.log('new followUser:' + map.followUser);
        if (map.followUser) {
          map.panToUser();
        }
        return map.followUser;
      };

      //centers map in user location
      map.panToUser = function() {
        var userLatLng = map.lastUserLatLng();
        console.log('panToUser requested: ' + userLatLng);
        if (userLatLng) {
          map.autoPan = true;
          map.panTo(userLatLng);
        }
      };

      //returns last known user LatLng
      map.lastUserLatLng= function() {
        if (map.userLocationMarker !== null) {
          return map.userLocationMarker.getLatLng();
        }
        return null;
      };

      // event handler, updates user location pin & circle radius
      // centers map in user location if followUser is active
      map.onLocationFound = function(e) {
        console.log('new User location. followUser: ' + map.followUser);
        if (e.accuracy === null) {
          return;
        }
        var radius = e.accuracy / 2;
        if (map.userLocationMarker === null) {  // add to map
          map.userLocationMarker = L.marker(e.latlng, {icon: map.iconset.user});
          map.userLocationMarker.addTo(map);
          map.userLocationCircle = L.circle(e.latlng, radius);
          map.userLocationCircle.addTo(map);
          map.userLocationMarker.bindPopup('Estás aquí');
        }
        //update
        map.userLocationMarker.setLatLng(e.latlng);
        map.userLocationCircle.setLatLng(e.latlng);
        map.userLocationCircle.setRadius(radius);

        if (map.followUser) {
          map.panToUser();
        }
      };

      //event handler that handles what to do when location is found
      map.onLocationError = function(e) {
        console.log(e.message);
      };

      /////////////////////// final config
      //tile layer
      map.tileLayer = L.tileLayer( tileLayerUrl, {
        attribution: tileLayerAttribution,
        maxZoom: 20
      });

      map.on('locationfound', map.onLocationFound);
      map.on('locationerror', map.onLocationError);
      map.tileLayer.addTo(map);
      map.requestUserLocation();
      map.on('zoomstart', map.onZoomStart);
      map.on('zoomend', map.onZoomEnd);
      map.on('moveend', map.onMoveEnd);
      maps[mapId] = map;
      return map;
    };
  }]
);
