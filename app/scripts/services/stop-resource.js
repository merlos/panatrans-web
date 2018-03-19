'use strict';

Object.hasItems = function(obj) {
    var key;
    for (key in obj) {
      if (obj.hasOwnProperty(key)) {
        return true;
      }
    }
    return false;
};


function Stop($q, $http,  railsSerializer, railsResourceFactory) {

  var config = {
    url: _CONFIG.serverUrl + '/v1/stops',
    name: 'stop' ,
    serializer: railsSerializer(function () {
      this.resource('data', 'Stop'); // when getting stop info is in data
      this.exclude('routes'); //when (put)updating, do not send routes
      this.resource('routes', 'Route');
    })
  };

  var resourceForOne = railsResourceFactory(config);
  if (_CONFIG.staticApi) {
    config.url = config.url + '.json'; //if we are using a static api we need to add .json to fetch all
  }
  var resource = railsResourceFactory(config);

  resource.stops = {};

  resource.all = function() {
    var deferred = $q.defer();
    if (Object.hasItems(resource.stops)) {
      deferred.resolve(resource.stops);
    } else {
      console.log('Stops:all: requesting stops to server');
      resource.query().then(
        function (results) {
          angular.forEach(results.data, function(stop) {
            resource.stops[stop.id] = stop;
          });
          //console.log(resource.routes);
          deferred.resolve(resource.stops);
        },
        function (error) {
           console.log('Stops:all.error');
           deferred.reject(error);
        });
    } //else
    return deferred.promise;
  };


  resource.find = function(stopId, forceRequest) {
    forceRequest = typeof forceRequest !== 'undefined' ? forceRequest : false;
    var deferred = $q.defer();
    //only download if the stop is not already local cache
    if (resource.stops[stopId].routes && !forceRequest) {
       deferred.resolve(resource.stops[stopId]);
    } else {
      console.log('Stops:find: requesting stop detail');
      resourceForOne.get(stopId, {with_stop_sequences: false}).then(
        function(response) {
          resource.stops[stopId] = response.data;
          deferred.resolve(response.data);
        },
        function(error){
          deferred.reject(error);
        }
      );
    }
    return deferred.promise;
  };


  //returns the array of stops that (id,name,lat,lon)
  resource.getRouteStops = function(route) {
    var stops = [];
    angular.forEach(route.trips, function(trip) {
      angular.forEach(trip.stopSequences, function(sequence) {
        stops.push(stopMarkers[sequence.stopId].stop);
      });
    });
    return stops;
  };


  //returns an array with all the stops of the trip
  resource.getStopsForTrip = function(trip) {
    var stops = [];
    angular.forEach(trip.stopSequences,function(sequence) {
      stops.push(stopMarkers[sequence.stopId].stop);
    });
    return stops;
  };

  //returns the list of stops as an array instead of a object[stop.id] object
  resource.stopsAsArray = function(){
    var stops = [];
    angular.forEach(this.stops, function(stop){
      stops.push(stop);
    });
    return stops;
  }

  //TODO: MOVE THIS FUNCTION TO A TRIP RESOURCE

  resource.isCircularTrip = function(trip) {

    // TODO this is repeated in isfirsstop and is last stop
    if(trip._firstStopId === undefined) {
      angular.forEach(trip.stopSequences, function(stopSequence){
        if (stopSequence.sequence === 0) {
          trip._firstStopId = stopSequence.stop.id;
        }
      });
    }
    if(trip._lastStopId === undefined) {
      var largestSequence = -1;
      var stopIdWithLargestSequence = -1;
      angular.forEach(trip.stopSequences, function(stopSequence){
        if (stopSequence.sequence > largestSequence) {
          largestSequence = stopSequence.sequence;
          stopIdWithLargestSequence = stopSequence.stop.id;
        }
      });
    }
    return trip._firstStopId === trip._lastStopId;
  };

  //TODO: MOVE THIS function TO A TRIP RESOURCE
  resource.isFirstStopInTrip = function(stop, trip) {
    if(trip._firstStopId === undefined) {
      angular.forEach(trip.stopSequences, function(stopSequence){
        if (stopSequence.sequence === 1) {
          trip._firstStopId = stopSequence.stop.id;
        }
      });
    }
    return trip._firstStopId === stop.id;
  };

  //TODO: MOVE THIS function TO A TRIP RESOURCE
  resource.isLastStopInTrip = function(stop, trip) {
    if(trip._lastStopId === undefined) {
      var largestSequence = -1;
      var stopIdWithLargestSequence = -1;
      angular.forEach(trip.stopSequences, function(stopSequence){
        if (stopSequence.sequence > largestSequence) {
          largestSequence = stopSequence.sequence;
          stopIdWithLargestSequence = stopSequence.stop.id;
        }
      });
      trip._lastStopId = stopIdWithLargestSequence
    }
    return trip._lastStopId === stop.id;
  };

  return resource;
} //Route class


angular.module('panatransWebApp').service('Stop',['$q', '$http', 'railsSerializer', 'railsResourceFactory', Stop]);
