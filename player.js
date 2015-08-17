//$$ = document.querySelectorAll.bind(document);
//$ = document.querySelector.bind(document);

"use strict";

// Global Variables for Audio
var audioContext = null;
var javascriptNode = null;
var analyserNode = null;
var sourceNode;
var frequencyArray;
var audio;
var urlvar = null;
var ctx;
var canvasWidth;
var canvasHeight;
var gradient;
var played;
var filterNodes;
var normal = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
var pop = [2, 6, 5, 1, -3, -2, 1.5, 2, 2.5, 3];
var rock = [4, 3, 2, 1, -1, -2, 0, 2, 3, 4];
var jazz = [3.5, 2.5, 1, 2, -2, -2, -0.5, 1, 2.5, 3.5];
var classical = [5, 4, 3, 2, -1.5, -1.5, 0, 2, 3, 4];
var presets = [];

function createContext() {
    audio = new Audio();
    audio.crossorigin = "anonymous";
    audio.controls = true;

    audioContext = new AudioContext();
    sourceNode = audioContext.createMediaElementSource(audio);
}

/**
 * creates 10 input elements
 */
function createInputs(className, container) {
    var inputs = [], node, i;

    document.write('<script src="binarybuffer.js"><\/script>');
    document.write('<script src="ID3v2.js"><\/script>');

    for (i = 0; i < 10; i = i + 1) {
        node = document.createElement('input');
        node.className = className;
        node.setAttribute('min', -12);
        node.setAttribute('max', 12);
        node.setAttribute('step', 0.1);
        node.setAttribute('value', 0);
        node.setAttribute('type', 'range');
        node.setAttribute('id', className + i);
        container.appendChild(node);
        inputs.push(node);
    }

    return inputs;
}

/**
 * bind almost all events here
 */
function initEvents(inputs) {

    [].forEach.call(inputs, function (item, i) {
        item.addEventListener('change', function (e) {
            filterNodes[i].gain.value = e.target.value;
        }, false);
    });

    document.getElementById('presetList').addEventListener('change', function (e) {
        var i;
        for (i = 0; i < 10; i = i + 1) {
            if (inputs[i]) {
                inputs[i].value = presets[e.target.selectedIndex][i];
            }
            filterNodes[i].gain.value = presets[e.target.selectedIndex][i];
        }
    });

    var file = document.getElementById('file');
    file.value = "";
    file.addEventListener('change', function (e) {
        if (!e.target.files.length) {
            return;
        }

        var audiofile = e.target.files[0];
        if (audiofile.type.match(/audio.*/)) {
            getAudioFile(audiofile);
        } else {
            alert("Unsupported file format");
        }

    }, false);

    file.addEventListener('click', function (e) {
        stopPlay();
    }, false);

    document.getElementById('play').addEventListener('click', function (e) {
        e.preventDefault();
        playSound();
    });

    document.getElementById('stop').addEventListener('click', function (e) {
        e.preventDefault();
        stopPlay();
    });

    audio.addEventListener('ended', function () {
        audio.currentTime = 0;
        stopPlay();
    });

    var dropZone =  document.getElementById('dropzone');

    dropZone.addEventListener('dragover', function(e) {
        e.stopPropagation();
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
    });

    dropZone.addEventListener('drop', function(e) {
        e.stopPropagation();
        e.preventDefault();
        var dropfile = e.dataTransfer.files[0]; // Array of all files
        if (dropfile.type.match(/audio.*/)) {
            getAudioFile(dropfile);
        } else {
            alert("Unsupported file format");
        }
    });
}

function getAudioFile(audiofile) {
    if (audiofile.type === 'audio/mp3' || audiofile.type === 'audio/mpeg') {
        var tag = new ID3v2();

        tag.readFromFile(audiofile, function (tag) {
            var str = tag.get('TIT2') + " by " + tag.get('TPE1') + " from " + tag.get('TALB');
            document.getElementById('currentSong').innerHTML = str;
        });

    }
    else {
        document.getElementById('lblMarquee').innerHTML = "Unsupported file type " + audiofile.type;
    }
    urlvar = URL.createObjectURL(audiofile);
    stopPlay();
    document.getElementById('play').className = "button-play";
}

/**
 * @param frequency {number}
 */
function createFrequencyFilter(frequency) {
    var filter = audioContext.createBiquadFilter();

    filter.type = 'peaking';
    filter.frequency.value = frequency;
    filter.gain.value = 0;
    filter.Q.value = 1;

    return filter;
}

/**
 * create filter for each frequency and for audio analyzer
 */
function createFilters() {
    var frequencies = [60, 170, 310, 600, 1000, 3000, 6000, 12000, 14000, 16000];
    //  var frequencies = [32, 64, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];

    // setup a analyzer
    analyserNode = audioContext.createAnalyser();
    analyserNode.smoothingTimeConstant = 0.3;
    analyserNode.fftSize = 1024;
    // Create the array for the data values
    frequencyArray = new Uint8Array(analyserNode.frequencyBinCount);

    // setup a javascript node
    javascriptNode = audioContext.createScriptProcessor(1024, 1, 1);

    // when the javascript node is called
    // we use information from the analyzer node
    // to draw the volume
    javascriptNode.onaudioprocess = function (e) {
        // get the average for the first channel
        analyserNode.getByteFrequencyData(frequencyArray);

        drawFrequencyDomain();
    };

    // create filterNodes
    filterNodes = frequencies.map(function (frequency) {
        return createFrequencyFilter(frequency);
    });

    // create chain
    filterNodes.reduce(function (prev, curr) {
        prev.connect(curr);
        return curr;
    });
}

function drawFrequencyDomain() {
    var i, y;
    clearCanvas();
    ctx.fillStyle = '#FFFFFF';
    for (i = 0; i < frequencyArray.length; i = i + 1) {
        y = canvasHeight - Math.round(frequencyArray[i]);
        ctx.fillRect(i, 0, 1, y);
    }
}

function clearCanvas() {
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
}

// load the specified sound
function playSound() {
    if (urlvar !== null && !played) {
        audio.src = urlvar;
        sourceNode.connect(filterNodes[0]);
        filterNodes[9].connect(analyserNode);
        analyserNode.connect(javascriptNode);
        javascriptNode.connect(audioContext.destination);
        filterNodes[9].connect(audioContext.destination);
        audio.play();
        document.getElementById('play').className = "button-play-hide";
        document.getElementById('stop').className = "button-stop";
        played = true;
    }
}

function stopPlay() {
    if (played) {
        filterNodes[9].disconnect(analyserNode);
        analyserNode.disconnect(javascriptNode);
        javascriptNode.disconnect(audioContext.destination);
        //      sourceNode.stop();
        audio.pause();
        document.getElementById('play').className = "button-play";
        document.getElementById('stop').className = "button-stop-hide";
        played = false;
    }
}

// log if an error occurs
function onError(e) {
    console.log(e);
}


/**
 * main function
 */
var canvas = document.querySelector('.visualizer');
ctx = canvas.getContext("2d");
canvasWidth = canvas.width;
canvasHeight = canvas.height;
gradient = ctx.createLinearGradient(0, 0, 0, 300);
gradient.addColorStop(1, '#000000');
gradient.addColorStop(0.75, '#ff0000');
gradient.addColorStop(0.25, '#ffff00');
gradient.addColorStop(0, '#ffffff');

var preset = document.getElementById('presetList');
preset.selectedIndex = 0;
presets[0] = normal;
presets[1] = pop;
presets[2] = rock;
presets[3] = jazz;
presets[4] = classical;

var container = document.querySelector(".eq-wrap");
var inputs = createInputs('slider', container);

createContext();
createFilters();
initEvents(inputs);
