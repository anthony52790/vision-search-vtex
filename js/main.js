'use strict';

var takeSnapshotUI = createClickFeedbackUI();

var video;
var capture;
var takePhotoButton;
var toggleFullScreenButton;
var switchCameraButton;
var amountOfCameras = 0;
var currentFacingMode = 'environment';
var disabled;
var download;
var closePhoto;
window.apiKey = '';
var key_vision = 'https://vision.googleapis.com/v1/images:annotate?key='+window.apiKey;
var key_translate = 'https://translation.googleapis.com/language/translate/v2?key='+window.apiKey;

document.addEventListener('DOMContentLoaded', function(event) {
  DetectRTC.load(function() {
    if (DetectRTC.isWebRTCSupported == false) {
      alert(
        'Por favor use Chrome, Firefox, iOS 11, Android 5 o superior, Safari 11 o superior',
      );
    } else {
      if (DetectRTC.hasWebcam == false) {
        alert('Por favor instale una webcam externo');
      } else {
        amountOfCameras = DetectRTC.videoInputDevices.length;
        initCameraUI();
        initCameraStream();
      }
    }

    console.log(
      'RTC Debug info: ' +
        '\n OS:                   ' +
        DetectRTC.osName +
        ' ' +
        DetectRTC.osVersion +
        '\n browser:              ' +
        DetectRTC.browser.fullVersion +
        ' ' +
        DetectRTC.browser.name +
        '\n is Mobile Device:     ' +
        DetectRTC.isMobileDevice +
        '\n has webcam:           ' +
        DetectRTC.hasWebcam +
        '\n has permission:       ' +
        DetectRTC.isWebsiteHasWebcamPermission +
        '\n getUserMedia Support: ' +
        DetectRTC.isGetUserMediaSupported +
        '\n isWebRTC Supported:   ' +
        DetectRTC.isWebRTCSupported +
        '\n WebAudio Supported:   ' +
        DetectRTC.isAudioContextSupported +
        '\n is Mobile Device:     ' +
        DetectRTC.isMobileDevice,
    );
  });
});

function initCameraUI() {
  video = document.getElementById('video');

  takePhotoButton = document.getElementById('takePhotoButton');
  toggleFullScreenButton = document.getElementById('toggleFullScreenButton');
  switchCameraButton = document.getElementById('switchCameraButton');
  download = document.getElementById('download');
  disabled = document.getElementById('gui_controls');
  closePhoto = document.getElementById('close-photo');

  takePhotoButton.addEventListener('click', function() {
    takeSnapshotUI();
    takeSnapshot();
  });
  closePhoto.addEventListener('click',function(){
    if(closePhoto.classList.contains('active')){
      closePhoto.classList.remove('active');
    }
    if (disabled.classList.contains('disabled')) {
      disabled.classList.remove('disabled');
    }
    if (download.classList.contains('active')) {
      download.classList.remove('active');
    }
    location.reload();
  })

  function fullScreenChange() {
    if (screenfull.isFullscreen) {
      toggleFullScreenButton.setAttribute('aria-pressed', true);
    } else {
      toggleFullScreenButton.setAttribute('aria-pressed', false);
    }
  }

  if (screenfull.isEnabled) {
    screenfull.on('change', fullScreenChange);

    toggleFullScreenButton.style.display = 'block';

    fullScreenChange();

    toggleFullScreenButton.addEventListener('click', function() {
      screenfull.toggle(document.getElementById('container')).then(function() {
        console.log(
          'Fullscreen mode: ' +
            (screenfull.isFullscreen ? 'enabled' : 'disabled'),
        );
      });
    });
  } else {
    console.log("iOS doesn't support fullscreen (yet)");
  }

  if (amountOfCameras > 1) {
    switchCameraButton.style.display = 'block';

    switchCameraButton.addEventListener('click', function() {
      if (currentFacingMode === 'environment') currentFacingMode = 'user';
      else currentFacingMode = 'environment';

      initCameraStream();
    });
  }

  window.addEventListener(
    'orientationchange',
    function() {
      // iOS doesn't have screen.orientation, so fallback to window.orientation.
      // screen.orientation will
      if (screen.orientation) angle = screen.orientation.angle;
      else angle = window.orientation;

      var guiControls = document.getElementById('gui_controls').classList;
      var vidContainer = document.getElementById('vid_container').classList;

      if (angle == 270 || angle == -90) {
        guiControls.add('left');
        vidContainer.add('left');
      } else {
        if (guiControls.contains('left')) guiControls.remove('left');
        if (vidContainer.contains('left')) vidContainer.remove('left');
      }
    },
    false,
  );
}

function initCameraStream() {
  if (window.stream) {
    window.stream.getTracks().forEach(function(track) {
      track.stop();
    });
  }

  var size = 1280;

  var constraints = {
    audio: false,
    video: {
      width: { ideal: size },
      height: { ideal: size },
      //width: { min: 1024, ideal: window.innerWidth, max: 1920 },
      //height: { min: 776, ideal: window.innerHeight, max: 1080 },
      facingMode: currentFacingMode,
    },
  };

  navigator.mediaDevices
    .getUserMedia(constraints)
    .then(handleSuccess)
    .catch(handleError);

  function handleSuccess(stream) {
    window.stream = stream;
    video.srcObject = stream;
    if (constraints.video.facingMode) {
      if (constraints.video.facingMode === 'environment') {
        switchCameraButton.setAttribute('aria-pressed', true);
      } else {
        switchCameraButton.setAttribute('aria-pressed', false);
      }
    }

    const track = window.stream.getVideoTracks()[0];
    const settings = track.getSettings();
    str = JSON.stringify(settings, null, 4);
    //return navigator.mediaDevices.enumerateDevices();
  }

  function handleError(error) {
    if (error === 'PermissionDeniedError') {
      alert('Permission denied. Please refresh and give permission.');
    }
  }
}

function takeSnapshot() {
  var canvas = document.createElement('canvas');
  var width = video.videoWidth;
  var height = video.videoHeight;
  var context;
  var img = new Image();

  canvas.width = width;
  canvas.height = height;

  context = canvas.getContext('2d');
  context.drawImage(video, 0, 0, width, height);

  capture = canvas.toDataURL('image/jpeg');//download
  download.classList.add('active');
  download.setAttribute('href',capture);

  img.src = capture;//capture

  var dataURL = capture.replace('data:image/jpeg;base64,', '');
  sendFileToCloudVision(dataURL);

  disabled.classList.add('disabled');
  closePhoto.classList.add('active');
  download.classList.add('active');
  video.pause();
  //const track = window.stream.getVideoTracks()[0]; //salir de la foto
  //track.stop();
}
function sendFileToCloudVision(dataURL){
  var request = {
    requests:[{
      image:{
        content : dataURL
      },
      features:[
        {
        type: "OBJECT_LOCALIZATION",
        maxResults: 10
        },
        {
          maxResults: 10,
          type: "LABEL_DETECTION"
        }
      ],
      imageContext: {
        cropHintsParams:{
          aspectRatios:[0.8,1,1.2]
        }
      }
    }]
  }

  $('.loading').addClass('active');

  $.ajax({
    url:key_vision,
    type:"POST",
    data:JSON.stringify(request),
    contentType:'application/json'
  }).done(function(response){
    convertToSpanish(response);
  }).fail(function (jqXHR, textStatus, errorThrown){
    console.log(jqXHR, textStatus, errorThrown)
  })
}

function convertToSpanish(res){

  var text = res.responses[0].localizedObjectAnnotations[0].name;

  var req ={
    q: text,
    source: "en",
    target: "es",
    format: "text"
  }
  $.ajax({
    url:key_translate,
    type:"POST",
    data:JSON.stringify(req),
    contentType :'application/json'
  }).done(function(data){
    console.log(data)
    sendToVtexSearch(data);
    $('.loading').removeClass('active');
  }).fail(function (jqXHR, textStatus, errorThrown){
    console.log(jqXHR, textStatus, errorThrown)
  })
}

function sendToVtexSearch(res){
  $('.content').addClass('active');
  var search = res.data.translations[0].translatedText;
  var a = $.trim(search.replace(/\'|\"/, ""));
  a.match(/^[a-n o-záéíóú \-]+$/i);
  $.ajax({
    url:'https://www.promart.pe/api/catalog_system/pub/products/search/?ft='+encodeURIComponent(a),
    type : 'GET',
  }).done(function(data){
    //$('.content').removeClass('active');
  })
}

function createClickFeedbackUI() {

  var overlay = document.getElementById('video_overlay');
  var sndClick = new Howl({ src: ['snd/click.mp3'] });
  var overlayVisibility = false;
  var timeOut = 80;

  function setFalseAgain() {
    overlayVisibility = false;
    overlay.style.display = 'none';
  }

  return function() {
    if (overlayVisibility == false) {
      sndClick.play();
      overlayVisibility = true;
      overlay.style.display = 'block';
      setTimeout(setFalseAgain, timeOut);
    }
  };
}
