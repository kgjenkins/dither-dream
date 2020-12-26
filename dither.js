'use strict';

document.addEventListener('DOMContentLoaded', initialize);

var video;

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
  
  navigator.getUserMedia(
    { video:true, audio:false },
    function(s) {
      video = document.getElementById('video');
      video.src = window.URL.createObjectURL(s);
      webcamStream=s
    },
    function(err){
      console.log('err');
    }
  );

};

function reset() {
  // TODO reset to default values
}

function runloop(timestamp) {
  var elapsed;
  do {
    elapsed = performance.now() - timestamp;
  } while (elapsed < 500);
  window.requestAnimationFrame(runloop);
}

var img = new Image();
var screenctx = document.getElementById('screen').getContext('2d');

function load_img(url) {
  img.src = url;
  img.crossOrigin = "Anonymous";
  img.onload = function() {
    dither();
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

