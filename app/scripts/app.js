'use strict';

/**
 * @ngdoc overview
 * @name panatransWebApp
 * @description
 * # panatransWebApp
 *
 * Main module of the application.
 */
angular
  .module('panatransWebApp', [
    'ngAnimate',
    'ngCookies',
    'ngMessages',
    'ngResource',
    'ngRoute',
    'ngTouch',
    'ui.bootstrap',
    'ui.sortable',
    'angular-toArrayFilter'
  ])
  .config(function ($routeProvider) {
    $routeProvider
      .when('/', {
        templateUrl: 'views/main.html',
        controller: 'MainCtrl'
      })
      .when('/routes', {
        templateUrl: 'views/routes.html',
        controller: 'RoutesCtrl'
      })
      .when('/about', {
        templateUrl: 'views/about.html',
        controller: 'AboutCtrl'
      })
      
      .when('/licenses', {
        templateUrl: 'views/licenses.html',
        controller: 'LicensesCtrl'
      })
      .otherwise({
        redirectTo: '/'
      });
  });
