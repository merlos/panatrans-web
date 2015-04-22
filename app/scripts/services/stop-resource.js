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
  var resource = railsResourceFactory(config);
  
  resource.stops = {};     
   
  resource.beforeRequest(function (data) { 
    console.log('beforeRequest');
    console.log(data);
  });
  
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
      resource.get(stopId, {with_stop_sequences: true}).then(
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
    
  resource.isFirstStopInTrip = function(stop, trip) {
    var isFirst = false;
    angular.forEach(trip.stopSequences, function(stopSequence){
      if ((stopSequence.sequence === 0) && (stopSequence.stopId === stop.id)) {
        isFirst = true;
      }
    });
    return isFirst;
  };
  
  resource.isLastStopInTrip = function(stop, trip) {
      var largestSequence = -1;
      var stopIdWithLargestSequence = -1;
      angular.forEach(trip.stopSequences, function(stopSequence){
        if (stopSequence.sequence > largestSequence) {
          largestSequence = stopSequence.sequence;
          stopIdWithLargestSequence = stopSequence.stopId;
        }
      });
      if (stopIdWithLargestSequence === stop.id) {
        return true;
      }
      return false;
    };
    
      
    
  return resource;
} //Route class


angular.module('panatransWebApp').service('Stop',['$q', '$http', 'railsSerializer', 'railsResourceFactory', Stop]);