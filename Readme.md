
# slant-photo

  Minimal 360 photo viewer built with [three.js](https://github.com/mrdoob/three.js).

## Example

```js
var SlantPhoto = require('slant-photo');

var el = document.querySelector('.photo');

var photo = new SlantPhoto(el);
photo.src('/somephoto.jpg');
photo.width(window.innerWidth);
photo.height(window.innerHeight);
photo.render();
```

## License

  MIT
