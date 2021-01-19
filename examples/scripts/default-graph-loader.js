var grapheneEngine = null;
var linegraph = null;

function loadGraphs() {
    grapheneEngine = new GrapheneEngine();

    var divs = document.getElementsByTagName("div");
    for (var i = 0; i < divs.length; i++) {
        if (divs[i].dataset.type) {
            var datasetProperties = divs[i].dataset.properties;
            var properties = (datasetProperties && datasetProperties != "") ? datasetProperties : null
            var data = divs[i].dataset.data;

            linegraph = grapheneEngine.addLinegraph(divs[i], properties, data, null, null);
        }
    }

    grapheneEngine.render();
}

window.addEventListener('load', loadGraphs, false);
