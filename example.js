
/**
 * Module dependencies.
 */

var ev = require('component/event');
var PhotoViewer = require('/');

/**
 * DOM elements.
 */

var el = document.querySelector('.example');
var zoomIn = document.querySelector('.zoom-in');
var zoomOut = document.querySelector('.zoom-out');

/**
 * Init.
 */

var photo = new PhotoViewer(el);
photo.render();

/**
 * Zoom in.
 */

ev.bind(zoomIn, 'click', function(){
  var fov = photo.fov();
  fov /= 0.5;
  photo.fov(fov);
});

/**
 * Zoom out.
 */

ev.bind(zoomOut, 'click', function(){
  var fov = photo.fov();
  fov *= 0.5;
  photo.fov(fov);
});
