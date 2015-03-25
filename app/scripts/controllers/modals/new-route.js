angular.module('panatransWebApp')
.controller('NewRouteModalInstanceCtrl', function ($scope, $modalInstance) {
  //routes
 
  
  //process routes. We'll take all the starts and ends and
  $scope.ok = function () {
    $modalInstance.close($scope.selected.item);
  };

  $scope.cancel = function () {
    $modalInstance.dismiss('cancel');
  };
});