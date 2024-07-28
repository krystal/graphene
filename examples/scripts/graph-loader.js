import Engine from "../../src/engine.js";

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

var engine = null;
var linegraph = null;

function loadGraphs() {
  engine = new Engine();

  var divs = document.getElementsByTagName("div");
  for (var i = 0; i < divs.length; i++) {
    if (divs[i].dataset.type) {
      var datasetProperties = divs[i].dataset.properties;
      var properties = (datasetProperties && datasetProperties != "") ? datasetProperties : null
      var data = divs[i].dataset.data;

      // used to test JSON objects work in addition to JSON strings
      if (false) {
        properties = properties ? JSON.parse(properties) : null;
        data = data ? JSON.parse(data) : null;
      }

      linegraph = engine.addLinegraph(divs[i], properties, data, axisFormatter, informationFormatter);
    }
  }

  engine.render();
}

function axisFormatter(value, interval) {
  var date = new Date(value);
  var hours = date.getUTCHours();
  var minutes = date.getUTCMinutes();
  var day = date.getUTCDate();
  var month = months[date.getUTCMonth()];
  var year = date.getUTCFullYear();

  if (interval < 86400000) { // 24 hours
    return hours.toString().padStart(2, "0") + ":" + minutes.toString().padStart(2, "0");
  } else if (interval < 2678400000) { // 31 days
    return day + " " + month;
  } else if (interval < 31536000000) { // 365 days
    return month + " " + year;
  } else {
    return year;
  }
}

function informationFormatter(value) {
  var date = new Date(value);
  var hours = date.getUTCHours();
  var minutes = date.getUTCMinutes();
  var day = date.getUTCDate();
  var month = months[date.getUTCMonth()];
  var year = date.getUTCFullYear();

  return hours.toString().padStart(2, "0") + ":" + minutes.toString().padStart(2, "0") + " " + day + " " + month + " " + year;
}

window.addEventListener('load', loadGraphs, false);
