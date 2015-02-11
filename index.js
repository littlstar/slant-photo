
/**
 * Module dependencies.
 */

var debug = require('debug')('slant-photo');
var raf = require('raf');
var Events = require('events');
var dataset = require('dataset');
var three = require('three.js');
var extend = require('extend.js');
var computed = require('computed-style');
var Emitter = require('emitter');

//
// TODO:
//
//  - easing on drag/swipe
//  - better mousewheel handling
//

/**
 * Expose `SlantPhoto`.
 */

exports = module.exports = SlantPhoto;

/**
 * Constants.
 */

var MIN_FOV = exports.MIN_FOV = 3;
var MAX_FOV = exports.MAX_FOV = 100;
var DEFAULT_FOV = exports.DEFAULT_FOV = 70;
var DEFAULT_VELOCITY = exports.DEFAULT_VELOCITY = 0.09;

/**
 * Create a SlantPhoto for `el`.
 *
 * @param {HTMLElement} el
 * @api public
 */

function SlantPhoto(el){
  if (!(this instanceof SlantPhoto)) {
    return new SlantPhoto(el);
  }
  this._src = null;
  this.state = {
    x: 0,
    y: 0,
    lon: 0,
    lat: 0,
    mousedown: false,
    fov: DEFAULT_FOV,
    velocity: DEFAULT_VELOCITY,
  };
  this._size = { width: 0, height: 0 };
  this.el = el;
  this.src(el.src || dataset(el).get('src'));

  this.scene = new three.Scene;
  this.vector = new three.Vector3(0, 0, 0);
  this.renderer = new three.WebGLRenderer;
  this.el.appendChild(this.renderer.domElement);

  this.events = new Events(this.el, this);
  this.events.bind('mousedown');
  this.events.bind('touchstart', 'onmousedown');
  this.events.bind('mousemove');
  this.events.bind('touchmove', 'onmousemove');
  this.events.bind('mouseup');
  this.events.bind('touchend', 'onmouseup');
  this.events.bind('mousewheel');

  this._loop = this.loop.bind(this);
}

/**
 * Mixin `Emitter`.
 */

Emitter(SlantPhoto.prototype);

/**
 * Get/set the `size`.
 *
 * @param {Object} [size]
 * @return {Object|SlantPhoto}
 * @api private
 */

SlantPhoto.prototype.size = function(size){
  if (size) {
    this.height(size.height);
    this.width(size.width);
    return this;
  }

  var styles = computed(this.el);
  if (!this.width()) this.width(parseFloat(styles.width));
  if (!this.height()) this.height(parseFloat(styles.height));
  return this._size;
};

/**
 * Get/set scroll `velocity`.
 *
 * @param {Number} [velocity]
 * @return {Number|SlantPhoto}
 * @api public
 */

SlantPhoto.prototype.velocity = function(velocity){
  if (!velocity) return this.state.velocity;
  this.state.velocity = velocity;
  debug('velocity: %d', velocity);
  return this;
};

/**
 * Get/set `fov`.
 *
 * @param {Number} [fov]
 * @return {Number|SlantPhoto}
 * @api public
 */

SlantPhoto.prototype.fov = function(fov){
  if ('undefined' == typeof fov) return this.state.fov;

  if (fov < MIN_FOV) {
    fov = MIN_FOV;
  } else if (fov > MAX_FOV) {
    fov = MAX_FOV;
  }

  this.state.fov = fov;
  this.camera.setLens(this.fov());
  debug('fov: %d', fov);
  return this;
};

/**
 * Get/set `width`.
 *
 * @param {Number} [width]
 * @return {Number|SlantPhoto}
 * @api public
 */

SlantPhoto.prototype.width = function(width){
  if (!width) return this._size.width;
  this._size.width = width;
  debug('width: %d', width);
  return this;
};


/**
 * Get/set `height`.
 *
 * @param {Number} [height]
 * @return {Number|SlantPhoto}
 * @api public
 */

SlantPhoto.prototype.height = function(height){
  if (!height) return this._size.height;
  this._size.height = height;
  debug('height: %d', height);
  return this;
};

/**
 * Get/set `src`.
 *
 * @param {String} [src]
 * @return {String|SlantPhoto}
 * @api public
 */

SlantPhoto.prototype.src = function(src){
  if (!src) return this._src;
  this._src = src;
  debug('src: %s', src);
  return this;
};

/**
 * Render the photo viewer.
 *
 * @return {SlantPhoto}
 * @api public
 */

SlantPhoto.prototype.render = function(){
  var size = this.size();
  this.camera = new three.PerspectiveCamera(
      this.fov()
    , size.width / size.height
    , 1
    , 1100
  );

  var material = new three.MeshBasicMaterial({
    map: three.ImageUtils.loadTexture(this.src()),
  });
  var geo = new three.SphereGeometry(500, 80, 50);
  var mesh = new three.Mesh(geo, material);
  mesh.scale.x = -1;
  this.scene.add(mesh);

  this.renderer.setSize(size.width, size.height);

  this.loop();
  return this;
};

/**
 * Resize the photo viewer.  If not given `size`, will use
 * `SlantPhoto#width()` and `SlantPhoto#height()` instead.
 *
 * @param {Object} [size]
 * @return {SlantPhoto}
 * @api public
 */

SlantPhoto.prototype.resize = function(size){
  if (size) {
    this.size(size);
  } else {
    size = this.size();
  }

  debug('resized aspect: %d', this.camera.aspect = size.width / size.height);
  this.camera.updateProjectionMatrix();
  this.renderer.setSize(size.width, size.height);
  return this;
};

/**
 * Handle mousedowns/touchstarts.
 *
 * @param {Event} e
 * @api private
 */

SlantPhoto.prototype.onmousedown = function(e){
  e.preventDefault();
  this.state.mousedown = true;
  this.state.x = e.pageX;
  this.state.y = e.pageY;
  this.emit(e.type, this.state);
  debug('onmousedown() => %j', this.state);
};

/**
 * Handle mousemoves/touchmoves.
 *
 * @param {Event} e
 * @api private
 */

SlantPhoto.prototype.onmousemove = function(e){
  if (!this.state.mousedown) return;
  var x = e.pageX - this.state.x;
  var y = e.pageY - this.state.y;
  this.state.x = e.pageX;
  this.state.y = e.pageY;
  this.state.lon += x;
  this.state.lat -= y;
  this.emit(e.type, this.state);
};

/**
 * Handle mouseups/touchends.
 *
 * @param {Event} e
 * @api private
 */

SlantPhoto.prototype.onmouseup = function(e){
  e.preventDefault();
  this.state.mousedown = false;
  debug('onmouseup() => %j', this.state);
  this.emit(e.type, this.state);
};

/**
 * Handle mousewheel events.
 *
 * @param {Event} e
 * @api private
 */

SlantPhoto.prototype.onmousewheel = function(e){
  var fov = this.fov();
  var velocity = this.velocity();

  e.preventDefault();

  // TODO: standalone mousewheel normalization component
  if (e.wheelDeltaY) {
    fov -= e.wheelDeltaY * velocity;
  } else if (e.wheelDelta) {
    fov -= e.wheelDelta * velocity;
  } else if (e.detail) {
    fov += e.detail * 1;
  }
  this.fov(fov);
  this.emit(e.type, this.state);
};

/**
 * Drawing loop.
 *
 * @api private
 */

SlantPhoto.prototype.loop = function(){
  raf(this._loop);
  this.draw();
};

/**
 * Draw the current frame.
 *
 * @api private
 */

SlantPhoto.prototype.draw = function(){
  this.lat = Math.max(-85, Math.min(85, this.state.lat));

  var phi = (90 - this.state.lat) * Math.PI / 180;
  var theta = this.state.lon * Math.PI / 180;
  var x = 500 * Math.sin(phi) * Math.cos(theta);
  var y = 500 * Math.cos(phi);
  var z = 500 * Math.sin(phi) * Math.sin(theta);

  this.vector.x = x;
  this.vector.y = y;
  this.vector.z = z;
  this.camera.lookAt(this.vector);
  this.renderer.render(this.scene, this.camera);
};
