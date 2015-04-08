'use strict';

/**
 * @ngdoc function
 * @name panatransWebApp.controller:ApiCtrl
 * @description
 * # ApiCtrl
 * Controller of the panatransWebApp to display API docs
 */


angular.module('panatransWebApp')
  .controller('RoutesCtrl', ['$scope', '$http', '$modal', 'ngToast', function ($scope, $http, $modal, ngToast) {
    
    $scope.routes = {};
    $scope.stopsArr = [];
    $scope.stops = {};
    $scope.loading = true;
    
    //TODO repeated coded in main.js 
    //this should be in a service
    console.log('requesting routes...');
    $http.get(_CONFIG.serverUrl + '/v1/routes/?with_trips=true')
    .success(function(response) {
      $scope.loading=false;
      $scope.routesArray = response.data; 
      $.each(response.data, function(index, route) {
        $scope.routes[route.id] = route;
      });
    })
    .error(function(data, status) {
      //TODO create some kind of general error handling.
      // 
      console.log('error obteniendo rutas');
      if (status === 0) {
        ngToast.create({className: 'danger', contents: '¡Ups! El servidor parece caído. Prueba en un rato Si sigue así contáctanos en @panatrans'});
      }
      if (status !== 422) {
        ngToast.create({className: 'danger', contents: 'Error accediendo al servidor. Prueba en un rato. Si el problema persiste contacta por twitter: @panatrans'});
        console.log(data);
      } else {
      } 
    });
    $http.get(_CONFIG.serverUrl + '/v1/stops/?' + _CONFIG.delay)
    .success(function(response) {
      console.log('Success getting stops!!!');
      //console.log(response.data);
      $scope.stopsArr = response.data;
      $.each(response.data,function(index, stop) {
        $scope.stops[stop.id] = stop;
      });
    }); //end $http
    
    
    
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
    
    $scope.openEditRouteModal = function(routeId){
      var modalConfig = {
        templateUrl: 'views/modals/edit-route.html',
        size: 'lg',
        controller: 'EditRouteModalInstanceCtrl',
        backdrop: true,
        routeId: routeId,
        resolve: { //variables passed to modal scope
          route: function() {
            return $scope.routes[routeId] || null;
          },
          stopsArr: function() {
            return $scope.stopsArr;
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
          delete $scope.routes[routeId]; //remove from local list 
        }
      });
    };
  }]);
