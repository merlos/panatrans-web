//this modal shows the

angular.module('panatransWebApp')
.controller('NewStopModalInstanceCtrl', function ($scope, $modalInstance) {

  //stop to create
  $scope.stop = {};
  
  $scope.ok = function () {
    $modalInstance.close($scope.stop);
  };

  //TODO validate if lat and long are valid values 
  
  $scope.cancel = function () {
    $modalInstance.dismiss('cancel');
  };
});