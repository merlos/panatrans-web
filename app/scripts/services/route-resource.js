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

function Route($q, $http, railsResourceFactory) {
  var resource = railsResourceFactory({
    url: _CONFIG.serverUrl + '/v1/routes',
    name: 'route'
  });
  
  resource.routes = {}; 
    
  resource.all = function() {
    var deferred = $q.defer();
    console.log('routes.length:' + resource.routes.length);
    if (Object.hasItems(resource.routes)) {
      deferred.resolve(resource.routes);
    } else { 
      console.log('Route:all: requesting routes to server');
      resource.query({with_trips: true}).then(
        function (results) {
          angular.forEach(results.data, function(route) {
            resource.routes[route.id] = route;
          });
          //console.log(resource.routes);
          deferred.resolve(resource.routes);
        }, 
        function (error) {
           console.log('Route:all.error');
           deferred.reject(error);
        });
    } //else 
    return deferred.promise;
  };
    
  return resource;
} //Route class


angular.module('panatransWebApp').service('Route',['$q', '$http', 'railsResourceFactory', Route]);