'use strict';

document.addEventListener('DOMContentLoaded', initialize);

function initialize() {
  // handle slider updates
  document.getElementById('a').addEventListener('input', function() {
    document.getElementById('a-label').innerHTML = this.value;
    weights[0] = this.value;
    dither();
  });
  document.getElementById('b').addEventListener('input', function() {
    document.getElementById('b-label').innerHTML = this.value;
    weights[1] = this.value;
    dither();
  });
  document.getElementById('c').addEventListener('input', function() {
    document.getElementById('c-label').innerHTML = this.value;
    weights[2] = this.value;
    dither();
  });
  document.getElementById('d').addEventListener('input', function() {
    document.getElementById('d-label').innerHTML = this.value;
    weights[3] = this.value;
    dither();
  });
  document.getElementById('contrast').addEventListener('input', function() {
    document.getElementById('contrast-label').innerHTML = this.value;
    dither();
  });

  // handle url change
  document.getElementById('url').addEventListener('input', function() {
    load_img(this.value);
  });

  load_img(document.getElementById('url').value);
  return;

};

function randomize() {
  // randomize all the values, but set contrast to 0
  var params = 'a b c d'.split(' ');
  for (var i=0; i<params.length; i++) {
    var p = params[i];
    var input = document.getElementById(p);
    // randomize only within the middle half of the range
    var v = randInt(input.min/2, input.max/2);
    input.value = v;
    document.getElementById(p + '-label').innerHTML = v;
    weights[i] = v;
  }
  var c = randInt(-50,100)/100;
  document.getElementById('contrast').value = c;
  document.getElementById('contrast-label').innerHTML = c;
  dither();
}

function randInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function reset() {
  //reset to default values
  document.getElementById('a').value = 7;
  document.getElementById('a-label').innerHTML = 7;
  document.getElementById('b').value = 3;
  document.getElementById('b-label').innerHTML = 3;
  document.getElementById('c').value = 5;
  document.getElementById('c-label').innerHTML = 5;
  document.getElementById('d').value = 1;
  document.getElementById('d-label').innerHTML = 1;
  document.getElementById('contrast').value = 0;
  document.getElementById('contrast-label').innerHTML = 0;
  weights = [7, 3, 5, 1];
  dither();
}

function toggleOriginal() {
  if (! screenctx.showing_original) {
    // store current dither
    screenctx.toggle = screenctx.getImageData(0, 0, 512, 512);

    // display original image
    var scale = 512/img.width;
    screenctx.drawImage(img, 0, 0, Math.floor(img.width*scale), Math.floor(img.height*scale));
    screenctx.showing_original = true;
  }
  else {
    screenctx.putImageData(screenctx.toggle, 0, 0);
    screenctx.showing_original = false;
  }
}

function dragOver(e) {
  e.preventDefault();
}

function dropFile(e) {
  e.preventDefault();
  if (e.dataTransfer.files) {
    // assume it is only file
    var file = e.dataTransfer.files[0];
    img = new Image();
    img.file = file;
    var reader = new FileReader();
    reader.onload=(function(f) {
      return function(e) {
        f.onload=function() {
          var scale = 512/f.width;
          screenctx.drawImage(f, 0, 0, Math.floor(img.width*scale), Math.floor(img.height*scale));
          dither();
        }
        f.src = e.target.result;
      };
    })(img);
    reader.readAsDataURL(file);
  }
}


var img = new Image();
var screenctx = document.getElementById('screen').getContext('2d');

function load_img(url) {
  img.src = url;
  img.crossOrigin = "Anonymous";
  img.onload = function() {
    dither();
  }
  img.onerror = function(e) {
    //
  }

}

function dither() {
  screenctx.fillStyle = '#888888ff';
  screenctx.fillRect(0,0,512,512);
  // scale image so it fills width
  var scale = 512/img.width;
  screenctx.drawImage(img, 0, 0, Math.floor(img.width*scale), Math.floor(img.height*scale));

  var imagedata = screenctx.getImageData(0, 0, 512, 512);
  var data = imagedata.data;
  data = grayscale(data);
  data = floyd_steinberg(data, 512, 512);
  screenctx.putImageData(imagedata, 0, 0);
  screenctx.showing_original = false;
}

function grayscale(data) {
  var contrast = document.getElementById('contrast').value;
  for (var i=0; i<data.length; i+=4) {
    var r = data[i];
    var g = data[i+1];
    var b = data[i+2];
    var a = data[i+3];
    // calculate greyscale following Rec 601 luma
    var v = (0.3*r + 0.58*g + 0.11*b) * a/255;
    //stretch to increase contrast
    v = v + (v-128)*contrast;
    data[i] = v;
    data[i+1] = v;
    data[i+2] = v;
    data[i+3] = 255;
  }
  return data;
}

var weights = [7, 3, 5, 1];

function floyd_steinberg(data, width, height) {
  for (var i=0; i<data.length; i+=4) {
    var y = Math.floor(i/4/width);
    var x = (i/4) % width;

    var v = data[i];
    var b = v < 128 ? 0 : 255; // bitonal value
    var err = v - b;

    data[i] = b ? 255 : 0;
    data[i+1] = b ? 255 : 0;
    data[i+2] = b ? 255 : 0;
    data[i+3] = b ? 255 : 0;

    // default Floyd-Steinberg values:
    //     . . .
    //     . @ 7
    //     3 5 1
    if (x + 1 < width) {
      data[i+4] += err * weights[0]/16;
    }
    if (y+1 == height) {
      continue;
    }
    if (x > 0) {
      data[i+width*4-4] += err * weights[1]/16;
    }
    data[i+width*4] += err * weights[2]/16;
    if (x + 1 < width) {
      data[i+width*4+4] += err * weights[3]/16;
    }
  }
  return data;
}

