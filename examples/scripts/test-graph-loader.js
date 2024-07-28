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

      linegraph = engine.addLinegraph(divs[i], properties, data, this.axisFormatter, this.informationFormatter);
    }
  }

  engine.render();

  var prepareUpdateButton = document.getElementById("prepareUpdateButton");
  if (prepareUpdateButton) {
    prepareUpdateButton.addEventListener("click", prepareUpdate);
  }

  var prepareAddHorizontalButton = document.getElementById("prepareAddHorizontalButton");
  if (prepareAddHorizontalButton) {
    prepareAddHorizontalButton.addEventListener("click", prepareAddHorizontal);
  }

  var prepareAddVerticalButton = document.getElementById("prepareAddVerticalButton");
  if (prepareAddVerticalButton) {
    prepareAddVerticalButton.addEventListener("click", prepareAddVertical);
  }

  var updateButton = document.getElementById("updateButton");
  if (updateButton) {
    updateButton.addEventListener("click", updateData);
  }

  var addHorizontalButton = document.getElementById("addHorizontalButton");
  if (addHorizontalButton) {
    addHorizontalButton.addEventListener("click", addHorizontalData);
  }

  var addVerticalButton = document.getElementById("addVerticalButton");
  if (addVerticalButton) {
    addVerticalButton.addEventListener("click", addVerticalData);
  }
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

function informationFormatter(value, interval) {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  var date = new Date(value);
  var month = months[date.getUTCMonth()];
  var year = date.getUTCFullYear();
  return month + " " + year;
}

function prepareUpdate() {
  var data = '{"names": ["Svalbard"], "x":["Mon","Tue","Wed","Thu","Fri","Sat","Sun"],"y":[[1,2,2,3,3,2,4]]}';
  var properties = '{"flags":{"highlight_enabled":true,"scroll_enabled":true,"zoom_enabled":true},"y_axis":{"label_suffix":[[0,"°C"]], "max":30}}';
  linegraph.axisFormatter = null;
  linegraph.informationFormatter = null;
  linegraph.updateData(data, properties);
}

function prepareAddHorizontal() {
  var data = '{"names": ["Svalbard", "Faro"], "x":["Mon","Tue","Wed","Thu","Fri","Sat","Sun"],"y":[[1,2,2,3,3,2,4],[23,26,25,26,27,27,27]]}';
  var properties = '{"flags":{"highlight_enabled":true,"scroll_enabled":true,"zoom_enabled":true},"y_axis":{"label_suffix":[[0,"°C"]], "max":30}}';
  linegraph.axisFormatter = null;
  linegraph.informationFormatter = null;
  linegraph.updateData(data, properties);
}

function prepareAddVertical() {
  var data = '{"names": ["Svalbard", "Faro"], "x":["Mon","Tue","Wed","Thu","Fri","Sat","Sun","Mon","Tue","Wed","Thu","Fri","Sat","Sun"],"y":[[1,2,2,3,3,2,4,4,4,5,5,5,5,5],[23,26,25,26,27,27,27,27,27,26,24,24,24,23]]}';
  var properties = '{"flags":{"highlight_enabled":true,"scroll_enabled":true,"zoom_enabled":true},"y_axis":{"label_suffix":[[0,"°C"]], "max":30}}';
  linegraph.axisFormatter = null;
  linegraph.informationFormatter = null;
  linegraph.updateData(data, properties);
}

function updateData() {
  var data = '{"names": ["Faro"], "x":["Mon","Tue","Wed","Thu","Fri","Sat","Sun"],"y":[[23,26,25,26,27,27,27]]}';
  linegraph.axisFormatter = null;
  linegraph.informationFormatter = null;
  linegraph.updateData(data, null);
}

function addHorizontalData() {
  var data = '{"x":["Mon","Tue","Wed","Thu","Fri","Sat","Sun"],"y":[[4,4,5,5,5,5,5],[27,27,26,24,24,24,23]]}';
  linegraph.axisFormatter = null;
  linegraph.informationFormatter = null;
  linegraph.addHorizontalData(data, null);
}

function addVerticalData() {
  var data = '{"names": ["Fort William"], "y":[[13,14,20,18,13,13,14,15,15,14,14,14,14,15]]}';
  linegraph.axisFormatter = null;
  linegraph.informationFormatter = null;
  linegraph.addVerticalData(data, null);
}

window.addEventListener('load', loadGraphs, false);
