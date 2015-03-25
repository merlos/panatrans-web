//this modal shows the

angular.module('panatransWebApp')
.controller('NewStopModalInstanceCtrl', function ($scope, $modalInstance) {

  //stop to create
  $scope.stop = {};
  
  $scope.ok = function () {
    $modalInstance.close($scope.stop);
  };

  $scope.cancel = function () {
    $modalInstance.dismiss('cancel');
  };
});