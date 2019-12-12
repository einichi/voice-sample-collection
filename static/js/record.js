// This example uses MediaRecorder to record from a live audio stream,
// and uses the resulting blob as a source for an audio element.
//
// The relevant functions in use are:
//
// navigator.mediaDevices.getUserMedia -> to get audio stream from microphone
// MediaRecorder (constructor) -> create MediaRecorder instance for a stream
// MediaRecorder.ondataavailable -> event to listen to when the recording is ready
// MediaRecorder.start -> start recording
// MediaRecorder.stop -> stop recording (this will generate a blob of data)
// URL.createObjectURL -> to create a URL from a blob, which we can use as audio src

var recordButton, stopButton, recorder, form, XHR, form, FD, sampleFile, respJSON;

window.addEventListener("load", function() {
  setupAudio();
  form = document.getElementById("sample-form")
  form.addEventListener("submit", function (event) {
    event.preventDefault();
    sendData();
  });
});

function sendData() {
  var submitButton = document.getElementById("submitButton");
  submitButton.disabled = true;
  submitButton.value = "Submitting...";
  XHR = new XMLHttpRequest();
  FD = new FormData(form);
  XHR.addEventListener("load", function(event) {
    respJSON = JSON.parse(event.target.responseText);
    submitButton.value = "Done!"
    document.getElementById("result").innerText = "Thank you for contributing! Your submission ID is: " + respJSON.id;
  });
  XHR.addEventListener("error", function(event) {
    submitButton.value = "Submit details and voice sample";
    submitButton.disabled = false;
    document.getElementById("result").innerText = "Submission failed.";
  });
  FD.append("sampleFile", new Blob([sampleFile], {type: 'audio/webm'}));
  XHR.open("POST", "/submit");
  XHR.send(FD);
}


function setupAudio() {
  recordButton = document.getElementById('record');
  stopButton = document.getElementById('stop');

  // get audio stream from user's mic
  navigator.mediaDevices.getUserMedia({
    audio: true
  })
  .then(function (stream) {
    recordButton.disabled = false;
    recordButton.addEventListener('click', startRecording);
    stopButton.addEventListener('click', stopRecording);
    recorder = new MediaRecorder(stream);
    
    // listen to dataavailable, which gets triggered whenever we have
    // an audio blob available
    recorder.addEventListener('dataavailable', onRecordingReady);
  });
}

function startRecording() {
  recordButton.disabled = true;
  stopButton.disabled = false;

  recorder.start();
}

function stopRecording() {
  recordButton.disabled = false;
  stopButton.disabled = true;

  // Stopping the recorder will eventually trigger the `dataavailable` event and we can complete the recording process
  recorder.stop();
}

function onRecordingReady(e) {
  var player = document.getElementById('audio');
  // e.data contains a blob representing the recording
  sampleFile = e.data;
  player.src = URL.createObjectURL(e.data);
  player.play();
}
