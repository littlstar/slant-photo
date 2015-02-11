
var assert = require('component/assert');
var SlantPhoto = require('/');

describe('SlantPhoto(el)', function(){
  var fixture;

  beforeEach(function(){
    fixture = document.createElement('div');
    document.body.appendChild(fixture);

    photo = new SlantPhoto(fixture);
  });

  afterEach(function(){
    document.body.removeChild(fixture);
  });

  it('should add the renderer element', function(){
    assert(photo.el.querySelector('canvas'));
  });

  describe('#velocity([velocity])', function(){
    describe('when given a value', function(){
      it('should update the scroll velocity', function(){
        photo.velocity(37);
        assert(37 == photo.velocity());
      });
    });

    describe('without a value', function(){
      it('should return the current velocity', function(){
        assert(SlantPhoto.DEFAULT_VELOCITY == photo.velocity());
      });
    });
  });

  describe('#fov([fov])', function(){
    // TODO: remove shitty mocks
    beforeEach(function(){
      photo.camera = {
        setLens: function(){}
      };
    });

    describe('when given a value', function(){
      it('should update the fov', function(){
        photo.fov(37);
        assert(37 == photo.fov());
      });

      it('should set the camera lens', function(done){
        photo.camera.setLens = function(fov){
          assert(37 == fov);
          done();
        };
        photo.fov(37);
      });

      describe('when the value is above the max', function(){
        it('should use fallback to the max', function(){
          photo.fov(SlantPhoto.MAX_FOV + 37);
          assert(SlantPhoto.MAX_FOV == photo.fov());
        });
      });

      describe('when the value is below the min', function(){
        it('should use fallback to the min', function(){
          photo.fov(SlantPhoto.MIN_FOV - 37);
          assert(SlantPhoto.MIN_FOV == photo.fov());
        });
      });
    });

    describe('without a value', function(){
      it('should return the current fov', function(){
        assert(SlantPhoto.DEFAULT_FOV == photo.fov());
      });
    });
  });

  describe('#width([width])', function(){
    describe('when given a value', function(){
      it('should update the width', function(){
        photo.width(37);
        assert(37 == photo.width());
      });
    });

    describe('without a value', function(){
      beforeEach(function(){
        photo.width(1234);
      });

      it('should return the current width', function(){
        assert(1234 == photo.width());
      });
    });
  });

  describe('#height([height])', function(){
    describe('when given a value', function(){
      it('should update the height', function(){
        photo.height(37);
        assert(37 == photo.height());
      });
    });

    describe('without a value', function(){
      beforeEach(function(){
        photo.height(1234);
      });

      it('should return the current height', function(){
        assert(1234 == photo.height());
      });
    });
  });

  describe('when element receives a mousedown', function(){
    it('should capture the x/y coordinates', function(done){
      var e = mouseevent('mousedown', 50, 60);

      photo.on('mousedown', function(state){
        assert(50 == state.x);
        assert(60 == state.y);
        done();
      });

      fixture.dispatchEvent(e);
    });

    it('should set state.mousedown = true', function(done){
      var e = mouseevent('mousedown', 50, 60);

      photo.on('mousedown', function(state){
        assert(state.mousedown);
        done();
      });

      fixture.dispatchEvent(e);
    });
  });

  describe('when the element receives a mousemove', function(){
    var STARTING_X = 100;
    var STARTING_Y = 200;

    beforeEach(function(done){
      var e = mouseevent('mousedown', STARTING_X, STARTING_Y);
      photo.on('mousedown', function(){ done(); });
      fixture.dispatchEvent(e);
    });

    it('should capture the x/y coordinates', function(done){
      var X = 300;
      var Y = 400;
      var e = mouseevent('mousemove', X, Y);
      photo.on('mousemove', function(state){
        assert(X == state.x);
        assert(Y == state.y);
        done();
      });
      fixture.dispatchEvent(e);
    });

    it('should update lon/lat', function(done){
      var X = 300;
      var Y = 400;
      var e = mouseevent('mousemove', X, Y);
      photo.on('mousemove', function(state){
        assert((STARTING_Y - Y) == state.lat);
        assert((X - STARTING_X) == state.lon);
        done();
      });
      fixture.dispatchEvent(e);
    });

    describe('without a mousedown first', function(){
      it('should noop', function(done){
        // h4x
        photo.state.mousedown = false;
        photo.on('mousemove', function(){
          throw new Error('fail');
        });
        var e = mouseevent('mousemove');
        fixture.dispatchEvent(e);
        setTimeout(done, 100);
      });
    });
  });

  describe('when the element receives a mouseup', function(){
    it('should set state.mousedown = false', function(done){
      var e = mouseevent('mouseup');
      photo.on('mouseup', function(state){
        assert(!state.mousedown);
        done();
      });
      fixture.dispatchEvent(e);
    });
  });
});

/**
 * Create a mouse event of `type` with `x/y`.
 */

function mouseevent(type, x, y){
  var e = document.createEvent('MouseEvents');
  e.initMouseEvent(
      type // eventName
    , true // bubbles
    , true // cancelable
    , window // view
    , 0 // detail
    , 0 // screenX
    , 0 // screenY
    , x || 0 // clientX
    , y || 0 // clientY
    , false // ctrl
    , false // alt
    , false // shift
    , false // meta
    , 0 // button
    , null // relatedTarget
  );
  return e;
}
