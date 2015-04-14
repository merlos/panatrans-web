'use strict';


//hack. Make navbar toggle when clicked
$('.navbar .navbar-link').click(function() {
    var navbarToggle = $('.navbar-toggle');
    if (navbarToggle.is(':visible')) {
        navbarToggle.trigger('click');
    }
});


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
    'angular-toArrayFilter',
    'ngToast',
    'slugifier'
  ])
  .config(function ($routeProvider) {
    $routeProvider
      .when('/', {
        templateUrl: 'views/main.html',
        controller: 'MainCtrl'
      })
      .when('/rutas', {
        templateUrl: 'views/routes.html',
        controller: 'RoutesCtrl'
      })
      .when('/metrobus/:routeId/:slug.html', {
        templateUrl: 'views/routes-show.html',
        controller: 'RoutesShowCtrl'
      })
      .when('/colabora', {
        templateUrl: 'views/contribute.html',
        controller: 'ContributeCtrl'
      })
      
      .when('/acercade', {
        templateUrl: 'views/about.html',
        controller: 'AboutCtrl'
      })
      
      .when('/licencias', {
        templateUrl: 'views/licenses.html',
        controller: 'LicensesCtrl'
      })
      .otherwise({
        redirectTo: '/'
      });
  });
