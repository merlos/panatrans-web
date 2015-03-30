'use strict';

/**
 * @ngdoc function
 * @name panatransWebApp.controller:ApiCtrl
 * @description
 * # ApiCtrl
 * Controller of the panatransWebApp to display API docs
 */


angular.module('panatransWebApp')
  .controller('RoutesCtrl', ['$scope', '$http', function ($scope, $http) {
    
    $scope.routes = {};
    $scope.loading = true
    $http.get(_CONFIG.serverUrl + '/v1/routes/?with_trips=true')
    .success(function(response) {
      $scope.loading=false
      $scope.routesArray = response.data; //TODO repeated coded this should be in a service
      $.each(response.data, function(index, route) {
        $scope.routes[route.id] = route;
      });
    });
    
    $scope.ignoreAccentsComparator = function(actual, expected) {  
      var removeAccents = function (value) {
        return value
          .replace(/á/g, 'a')            
          .replace(/é/g, 'e')
          .replace(/í/g, 'i')
          .replace(/ó/g, 'o')
          .replace(/ú/g, 'u')
          .replace(/\-/g, '')
        .replace(/\s/g, '');
      };
      
      //console.log("actual: " + actual);
      if (typeof actual != "string") return false;
      if (!expected) {
        return true;    
      } 
      
      actual = removeAccents(actual.toLowerCase());
      expected = removeAccents(expected.toLowerCase());
      //console.log(actual + ' <-> ' + expected);
      return actual.indexOf(expected) > -1;
    };
    
  }]);
