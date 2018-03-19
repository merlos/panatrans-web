/* exported EXPORTED_LIB */
var _CONFIG = {};

// Allow static API?
// panatrans-api can be dumped to files that can be consumed by panatrans-web
// steps to do that
// 1) install panatrans-api and load the dataset
// 2) run "bundle exec rake dataset:json_dump"
//    This will dump the jsons in ./tmp/v1
// 3) copy the v1 directory in app/v1
// set staticApi to true
_CONFIG.staticApi = true;

if (_CONFIG.staticApi) {
  _CONFIG.serverUrl = 'http://localhost:9000';
} else {
  _CONFIG.serverUrl = 'http://localhost:3000';
}
//_CONFIG.serverUrl = 'http://test-panatrans.herokuapp.com';
//var SERVER_URL = ;

// TILE LAYER SERVER && copyright attributions
_CONFIG.tilelayerUrl = 'http://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png';
_CONFIG.tilelayerAttribution = '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="http://cartodb.com/attributions">CartoDB</a>';


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
_CONFIG.delay = '';
//_CONFIG.delay = '&with_delay=true';
