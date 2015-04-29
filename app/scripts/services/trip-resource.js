'use strict';
/*
Object.hasItems = function(obj) {
    var key;
    for (key in obj) {
      if (obj.hasOwnProperty(key)) {
        return true;
      }
    }
    return false;
};

function Trip($q, $http, railsResourceFactory) {

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
  
  
  // is this stop, the first one on the trip?
  resource.isFirstStop(stop) {
    
  };

  // is this stop the last one on the trip?
  resource.isLastStop(stop) {
    
  };

  //is this trip circular?
  resource.isCircular() {
  };
};

angular.module('panatransWebApp').service('Route',['$q', '$http', 'railsResourceFactory', Trip]);

*/