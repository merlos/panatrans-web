///
// GLOBAL VARIABLES

var SERVER_URL = 'http://localhost:3000';
//var SERVER_URL = 'http://test-panatrans.herokuapp.com';

// TILE LAYER SERVER && copyright attributions
var TILELAYER_URL = 'http://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png';
var TILELAYER_ATTRIBUTION = '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="http://cartodb.com/attributions">CartoDB</a>';


// CartoDB basemaps
//http://cartodb.com/basemaps
//
//Mapbox
//
//
//merlos.li3k1pmo (w/colors)
//merlos.k99amj6l (b/w)
//var TILELAYER_URL = 'http://{s}.tiles.mapbox.com/v3/merlos.li3k1pmo/{z}/{x}/{y}.png'
//var TILELATER_ATTRIBUTION = '&copy;<a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>,© <a href="http://mapbox.com">Mapbox</a>'

// To test delays
// the API supports the option in any call &with_dealay=true. 
// DELAY string is added to some requests.
//  Useful to test how the UI works when server is slow
var DELAY = '';
//var DELAY = '&with_delay=true'; 


//CONSTANT
var UNKNOWN_STOP_SEQUENCE = -1;
//var LAST_STOP_SEQUENCE = null;
//var FIRST_STOP_SEQUENCE = 0;
