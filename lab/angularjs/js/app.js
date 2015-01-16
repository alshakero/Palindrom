var app = angular.module('MyApp', ['ngPartial', 'animateMeModule', 'xBtnModule', 'uiHandsontable']);

/**
 * AppController
 */
function AppController($scope) {
  $scope.mainFile = window.location.pathname;

  var puppet = new Puppet({
      remoteUrl: window.location.href, 
      callback: function (obj) {
        for (var i in obj) {
          if (obj.hasOwnProperty(i)) {
            $scope[i] = obj[i];
          }
          $scope.$apply();
        }
      }
  });
  puppet.onRemoteChange = function (patches) {
    jsonpatch.apply($scope, patches);
    $scope.$apply();
  };
}