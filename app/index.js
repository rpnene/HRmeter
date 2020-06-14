let document = require("document");
import { HeartRateSensor } from "heart-rate";
import { vibration } from "haptics";
import { display } from "display";
import exercise from "exercise";


//Define your Max Heart Frequence 
var personal = {CA:{min:0,max:98}, LE:{min:99, max:135}, MO:{min:130,max:160}, FO:{min:156, max:177}, RE:{min:0,max:150}};
// and Define your Trainning (time (in minutes) OR distance (time is defalut), intensity(CA:walk LE:light, MO: Moderate , FO: Heavy, RE: Rest)) 
var activity = new Array({time: 5, intensity: "CA"}, { time:35, intensity: "LE"},{ time: 5, intensity: "CA"});


// Fetch UI elements we will need to change
let hrLabel = document.getElementById("hrm");
let typeLabel = document.getElementById("type");
let paceLabel = document.getElementById("pace");
let totaltimeLabel = document.getElementById("totaltime");
let partialtimeLabel = document.getElementById("partialtime");
let distanceLabel = document.getElementById("distance");
let cmdtopLabel = document.getElementById("cmdtop");
let cmdbottonLabel = document.getElementById("cmdbotton");


let lastActivity = activity.length - 1;
let actualActivity = 0;
let lastTime = 0;
let lastDistance = 0;

// Initialize the UI with some values
function initValues () {
  
  actualActivity = 0;
  lastTime = 0;
  lastDistance = 0;
  
  hrLabel.text = "--";
  typeLabel.text = "??";
  totaltimeLabel.text = "...";
  partialtimeLabel.text = "...";
  paceLabel.text = "...";
  distanceLabel.text = "...";
  cmdtopLabel.text = "Finish";
  cmdbottonLabel.text = "Start";
}


// This function takes a number of milliseconds and returns a string
function convertPaceToString(paceMs) {
  let aux = (paceMs / 60);
  return aux;
}


function convertMsToString(millisecondsAgo) {
  let aux = Math.round(millisecondsAgo / 1000);
  let second  = Math.floor(aux % 60);
  let minute  = Math.floor(aux / 60);
  return minute + ":" + ("00" + second).slice(-2);
}

// This function updates the label on the display that shows when data was last updated.
function updateDisplay() {
  if (exercise.state ==="started") {
    hrLabel.text = exercise.stats.heartRate["current"];
    typeLabel.text = activity[actualActivity]["intensity"];
    totaltimeLabel.text =  convertMsToString(exercise.stats.activeTime) ;
    partialtimeLabel.text =  convertMsToString((exercise.stats.activeTime-lastTime));
    paceLabel.text = convertPaceToString(exercise.stats.pace["current"]);
    distanceLabel.text = exercise.stats.distance;
  }
}

function verifyHR () {
  if (exercise.state ==="started") {
    if (exercise.stats.heartRate["current"] < personal[ activity[actualActivity]["intensity"] ]["min"]) {
      vibration.start("ring");
    }  else if (exercise.stats.heartRate["current"] < personal[ activity[actualActivity]["intensity"] ]["max"]) {
      vibration.stop();
    }  else if (exercise.stats.heartRate["current"] >= personal[ activity[actualActivity]["intensity"] ]["max"]) {
      vibration.start("nudge-max");
    }
  }
}

function verifyActivity () {
  let newActivity = false;
  
  if (exercise.state ==="started") {
    let auxTime = exercise.stats.activeTime;
    let auxDistance = exercise.stats.distance;
    if ("distance" in activity[actualActivity]) { 
      if  ( (auxDistance - lastDistance) >= activity[actualActivity]["distance"] ) {
        newActivity = true;
      }
    }
    if ("time" in activity[actualActivity]) { 
      if  ( (auxTime - lastTime) >= (activity[actualActivity]["time"] * 60 * 1000)) {
        newActivity = true;
      }
    }
    if (newActivity) {
      lastDistance = auxDistance;
      lastTime = auxTime;
      if (actualActivity < lastActivity) {
        vibration.start("confirmation");
        exercise.splitLap();
        actualActivity =  actualActivity + 1;
      } else {
        vibration.start("confirmation-max");
        cmdbottonLabel.text = "Start";
        exercise.stop();
        initValues();
        typeLabel.text = "OK";
      }
    }
  }
}


cmdbottonLabel.onclick = function(e) {
  if (cmdbottonLabel.text === "Start") {
    cmdbottonLabel.text = "Pause";
    exercise.start("run", { gps: false });
  } else if (cmdbottonLabel.text === "Pause") {
    cmdbottonLabel.text = "Resume";
    exercise.pause();
  } else if (cmdbottonLabel.text === "Resume") {
    cmdbottonLabel.text = "Pause";
    exercise.resume();
  }
}

cmdtopLabel.onclick = function(e) {
  if (cmdtopLabel.text === "Finish") {
    cmdbottonLabel.text = "Start";
    exercise.stop();
    initValues ();
  }
}


document.onkeypress = function(e) {
  if (e.key==="down") {
    if (cmdbottonLabel.text === "Start") {
      cmdbottonLabel.text = "Pause";
      exercise.start("run", { gps: false });
    } else if (cmdbottonLabel.text === "Pause") {
      cmdbottonLabel.text = "Resume";
      exercise.pause();
    } else if (cmdbottonLabel.text === "Resume") {
      cmdbottonLabel.text = "Pause";
      exercise.resume();
    }
  }   
  if (e.key==="up") {
    if (cmdtopLabel.text === "Finish") {
      cmdbottonLabel.text = "Start";
      exercise.stop();
      initValues ();
    }
  }
}

initValues ();
setInterval(updateDisplay, 1000);
setInterval(verifyHR, 5000);
setInterval(verifyActivity, 1000);

