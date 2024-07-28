import Engine from "../../src/engine.js";

var engine = null;
var bargraph = null;

function loadGraphs() {
    engine = new Engine();

    var divs = document.getElementsByTagName("div");
    for (var i = 0; i < divs.length; i++) {
        if (divs[i].dataset.type) {
            var datasetProperties = divs[i].dataset.properties;
            var properties = (datasetProperties && datasetProperties != "") ? datasetProperties : null
            var data = divs[i].dataset.data;

            bargraph = engine.addBargraph(divs[i], properties, data, null, null);
        }
    }

    engine.render();
}

window.addEventListener('load', loadGraphs, false);
