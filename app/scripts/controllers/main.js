'use strict';

/**
 * @ngdoc function
 * @name panatransWebApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the panatransWebApp. This controller handles the mapa stuff
 */

var SERVER_URL = 'http://localhost:3000';

function onLocationFound(e) {
    var radius = e.accuracy / 2;
    L.marker(e.latlng).addTo(map)
        .bindPopup('You are within ' + radius + ' meters from this point').openPopup();
    L.circle(e.latlng, radius).addTo(map);
}

angular.module('panatransWebApp')
  .controller('MainCtrl', function ($scope, $http) {
    $scope.awesome = {
      'hola': 'Carola'
    };
    $http.get(SERVER_URL + '/v1/stops/')
        .success(function(response) {
          console.log("Success getting stops!!!")
          console.log(response.data);
          $.each(response.data,function(index, stop) {
              var marker = L.marker([stop.lat, stop.lon], 
                {
                  draggable: true,
                  title: stop.name
                }
              ).addTo(map).bindPopup(stop.name);
          })
          
          
          
    });
        
    var map = L.map('map').setView([8.9740946, -79.5508536], 13);
    L.tileLayer('http://{s}.tiles.mapbox.com/v3/merlos.k99amj6l/{z}/{x}/{y}.png', {
        attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
        maxZoom: 18
    }).addTo(map);
    //map.locate({setView: true, maxZoom: 16});
    //map.on('locationfound', onLocationFound);
  });
