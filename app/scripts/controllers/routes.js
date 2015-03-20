'use strict';

/**
 * @ngdoc function
 * @name panatransWebApp.controller:ApiCtrl
 * @description
 * # ApiCtrl
 * Controller of the panatransWebApp to display API docs
 */
var SERVER_URL = 'http://localhost:3000';


angular.module('panatransWebApp')
  .controller('RoutesCtrl', ['$scope', '$http', function ($scope, $http) {
    $scope.routes = {};
    
    $http.get(SERVER_URL + '/v1/routes/with_trips')
    .success(function(response) {
      $scope.routesArray = response.data;
      $.each(response.data, function(index, route) {
        $scope.routes[route.id] = route;
      });
    });
    
  }]);
