'use strict';

/**
 * @ngdoc function
 * @name panatransWebApp.controller:ApiCtrl
 * @description
 * # ApiCtrl
 * Controller of the panatransWebApp to display API docs
 */


angular.module('panatransWebApp')
  .controller('RoutesCtrl', ['$scope', '$http', '$modal', 'ngToast', 'Route', function ($scope, $http, $modal, ngToast, Route) {
    
    $scope.routes = {};
    $scope.loading = true;
    
    Route.all().then(function(data) {
      $scope.loading = false;
      $scope.routes = data;
    }, function(error) {
      $scope.loading = false;
      console.log(error);
      ngToast.create({className: 'danger', contents: 'Error accediendo al servidor. Prueba en un rato. Si el problema persiste contacta por twitter a @panatrans'});
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
      if (typeof actual !== 'string') {
        return false;
      }
      if (!expected) {
        return true;    
      } 
      
      actual = removeAccents(actual.toLowerCase());
      expected = removeAccents(expected.toLowerCase());
      //console.log(actual + ' <-> ' + expected);
      return actual.indexOf(expected) > -1;
    };
    
    
    $scope.openEditRouteModal = function(route){
      var modalConfig = {
        templateUrl: 'views/modals/edit-route.html',
        size: 'lg',
        controller: 'EditRouteModalInstanceCtrl',
        backdrop: true,
        resolve: { //variables passed to modal scope
          route: function() {
            if (route === null) { 
              return route;
            } else {  
              return $scope.routes[route.id] || null;
            }
          }
        }
      };
      var modalInstance = $modal.open(modalConfig);  
      modalInstance.result.then(
        function () { //close
        }, 
        function (reason) { //dismiss
          console.log('modal instance dismissed reason : ' + reason);
          if (reason === 'routeDeleted') {
            console.log('routeDeleted: ' + routeId);
          }
        }
      );
    };
  }
]);
