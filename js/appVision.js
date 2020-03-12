'use strict';

var apiKey = 'AIzaSyBc8eS5GCp8PPvpfFjLiR9ZO7tGdIjaBwo';
var key_vision = 'https://vision.googleapis.com/v1/images:annotate?key='+apiKey;
var key_translate = 'https://translation.googleapis.com/language/translate/v2?key='+apiKey;

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
  video = document.getElementById('gcv_video');

  takePhotoButton = document.getElementById('gcv_takePhotoButton');
  toggleFullScreenButton = document.getElementById('gcv_toggleFullScreenButton');
  switchCameraButton = document.getElementById('gcv_switchCameraButton');
  download = document.getElementById('gcv_download');
  disabled = document.getElementById('gcv_gui_controls');
  closePhoto = document.getElementById('gcv_close-photo');

  takePhotoButton.addEventListener('click', function(e) {
    console.log(e.target)
    createClickFeedbackUI();
    takeSnapshot();
  });
  closePhoto.addEventListener('click',function(){
    if(closePhoto.classList.contains('active')){
      closePhoto.classList.remove('active');
    }
    if (disabled.classList.contains('disabled')) {
      disabled.classList.remove('disabled');
    }
    location.href = location.href;
  })

 // function fullScreenChange() {
 //   if (screenfull.isFullscreen) {
 //     toggleFullScreenButton.setAttribute('aria-pressed', true);
 //   } else {
 //     toggleFullScreenButton.setAttribute('aria-pressed', false);
 //   }
 // }

 // if (screenfull.isEnabled) {
 //   screenfull.on('change', fullScreenChange);

 //   toggleFullScreenButton.style.display = 'block';

 //   //fullScreenChange();

 //   toggleFullScreenButton.addEventListener('click', function() {
 //     screenfull.toggle(document.getElementById('container')).then(function() {
 //       console.log(
 //         'Fullscreen mode: ' +
 //           (screenfull.isFullscreen ? 'enabled' : 'disabled'),
 //       );
 //     });
 //   });
 // } else {
 //   console.log("iOS doesn't support fullscreen (yet)");
 // }

  if (amountOfCameras > 1) {
    switchCameraButton.style.display = 'block';

    switchCameraButton.addEventListener('click', function() {
      if (currentFacingMode === 'environment') currentFacingMode = 'user';
      else currentFacingMode = 'environment';

      initCameraStream();
    });
  }

  window.addEventListener('orientationchange',function() {
      // iOS doesn't have screen.orientation, so fallback to window.orientation.
      // screen.orientation will
      if (screen.orientation) angle = screen.orientation.angle;
      else angle = window.orientation;

      var guiControls = document.getElementById('gcv_gui_controls').classList;
      var vidContainer = document.getElementById('gcv_vid_container').classList;

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
  navigator.mediaDevices.getUserMedia(constraints).then(handleSuccess).catch(handleError);

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

function takeSnapshot() {
  var canvas = document.createElement('canvas');
  var width = video.videoWidth;
  var height = video.videoHeight;
  var context;
  //var img = new Image();

  canvas.width = width;
  canvas.height = height;

  context = canvas.getContext('2d');
  context.drawImage(video, 0, 0, width, height);

  capture = canvas.toDataURL('image/jpeg');
  //download.setAttribute('href',capture);//descargar
  //img.src = capture;//mostrar imagen
  var urlImage = capture.replace('data:image/jpeg;base64,', '');
  sendFileToCloudVision(urlImage);
  disabled.classList.add('disabled');
  video.pause();
  //const track = window.stream.getVideoTracks()[0]; //salir de la foto
  //track.stop();
}
function sendFileToCloudVision(urlImage){
  var request = {
    requests:[{
      image:{content : urlImage},
      features:[
        {type: "OBJECT_LOCALIZATION",maxResults: 10},
        {maxResults: 10,type: "LABEL_DETECTION"}
      ],
      imageContext: {
        cropHintsParams:{aspectRatios:[0.8,1,1.2]}
      }
    }]
  }

  ajaxVision(key_vision,JSON.stringify(request)).then(function(res){
    closePhoto.classList.add('active');
    convertToSpanish(JSON.parse(res));
  })
}
function convertToSpanish(res){
  $('.gcv_content').addClass('active');
  if(res.responses[0]['localizedObjectAnnotations'] === undefined){
    setTimeout(function(){
      document.getElementsByClassName("gcv_loading")[0].style.display = 'none';
    },1000)
    document.getElementById("gcv_error").innerHTML = "Conecte una camara en el dispositivo";
  }else{
    var text = res.responses[0].localizedObjectAnnotations[0].name;
    var req ={q: text,source: "en",target: "es",format: "text"}
    ajaxVision(key_translate,JSON.stringify(req)).then(function(res){
      sendToVtexSearch(JSON.parse(res));
    })    
  }
}
function sendToVtexSearch(res){
  var search = res.data.translations[0].translatedText;
  var a = search.trim();
  a.match(/^[a-n o-záéíóú \-]+$/i);
  document.getElementsByClassName("gcv_loading")[0].style.display = 'none';
  if(a === "Persona"){
    document.getElementById("gcv_error").innerHTML = "Error: solo se permiten productos";
  }else{
    var url='/api/catalog_system/pub/products/search/?ft='+encodeURIComponent(a)
    ajaxVtex(url).then(function(res){
      if(res.length > 0){
        console.log(data)
      }else{
        document.getElementById("gcv_alert").innerHTML = "No existe coincidencias";
      }
    }).catch(function(error){
        document.getElementById("gcv_error").innerHTML = error;
    })    
  }
}
//config ajax vision cloud
function ajaxVision(url,data){
  return new Promise((resolve,reject) => {
      const http = new XMLHttpRequest();
      http.onreadystatechange = function (){
          if(http.readyState == 4 && http.status == 200){
              resolve(http.response);
          }else if(http.status == 404){
              reject("Error de conexion con Google Cloud Vision");
          }
      }
      http.onerror = function(){
        reject(Error("Error de red"))
      }
      http.open("POST",url);
      http.setRequestHeader('Content-Type','application/json');
      http.send(data);
  })
}
function ajaxVtex(url){
  return new Promise((resolve,reject) => {
    const http = new XMLHttpRequest();
    http.onreadystatechange = function (){
        if(http.readyState == 4 && http.status == 200){
            resolve(http.response);
        }else if(http.status == 404){
            reject("Error de conexion con vtex");
        }
    }
    http.onerror = function(){
      reject(Error("Error de red"))
    }
    http.open("GET",url);
    http.setRequestHeader('Content-Type','application/json');
    http.send();
  })
}