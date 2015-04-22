'use strict';

/**
 * @ngdoc function
 * @name panatransWebApp.controller:ApiCtrl
 * @description
 * # ApiCtrl
 * Controller of the panatransWebApp to display API docs
 */


angular.module('panatransWebApp')
  .controller('StopsCtrl', ['$scope', '$http', '$modal', 'ngToast', 'Stop', function ($scope, $http, $modal, ngToast, Stop) {
    
    $scope.stops = {};
    $scope.loading = true;
    
    Stop.all().then(function(data) {
      $scope.loading = false;
      $scope.stops = data;
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
    
    
    $scope.openEditStopModal = function(stop){
      ngToast.create('Obteniendo detalles de la parada...');
      Stop.find(stop.id).then(
        function(result){
          $scope.stops[stop.id] = result;    
          var modalConfig = {
            templateUrl: 'views/modals/edit-stop.html',
            size: 'lg',
            controller: 'EditStopModalInstanceCtrl',
            backdrop: true,
            resolve: { //variables passed to modal scope
              stop: function(){ return $scope.stops[stop.id]}
            }
          };
          var modalInstance = $modal.open(modalConfig);  
          modalInstance.result.then(
            function () { //close
            }, 
            function (reason) { //dismiss
              console.log('modal instance dismissed reason : ' + reason);
              if (reason === 'stopDeleted') {
                console.log('stopDeleted: ' + stop.id);
              }
            }
          );
        },
        function(error){
          console.log('error getting stop details');
          ngToast.create({className: 'danger',
           content: 'No se pudieron obtener los detalles de la parada. Si el problema persiste contacte por twitter con @panatrans'
          });
        });
    };
  }
]);
