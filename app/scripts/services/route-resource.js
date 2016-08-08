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
  console.log('Init Route');
  resource.routes = {};

  resource.all = function() {
    var deferred = $q.defer();
    console.log('routes.length:' + resource.routes.length);
    if (Object.hasItems(resource.routes)) {
      deferred.resolve(resource.routes);
    } else {
      console.log('Route:all: requesting routes to server');
      resource.query({with_trips: false}).then(
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

  resource.find = function(routeId, forceRequest) {
    forceRequest = typeof forceRequest !== 'undefined' ? forceRequest : false;
    var deferred = $q.defer();
    //only download if the route is not already local cache
    if (resource.routes[routeId].trips && !forceRequest) {
       deferred.resolve(resource.routes[routeId]);
    } else {
      console.log('Routes:find: requesting route detail to server');
      resource.get(routeId).then(
        function(response) {
          resource.routes[routeId] = response.data;
          deferred.resolve(response.data);
        },
        function(error){
          deferred.reject(error);
        }
      );
    }
    return deferred.promise;
  };


  return resource;
} //Route class


angular.module('panatransWebApp').service('Route',['$q', '$http', 'railsResourceFactory', Route]);
