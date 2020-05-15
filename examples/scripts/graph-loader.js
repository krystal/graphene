var grapheneEngine = null;

function loadGraphs() {
    grapheneEngine = new GrapheneEngine();

    var divs = document.getElementsByTagName("div");
    for (var i = 0; i < divs.length; i++) {
        if (divs[i].dataset.type) {
            var datasetProperties = divs[i].dataset.properties;
            var properties = (datasetProperties && datasetProperties != "") ? datasetProperties : null
            var data = divs[i].dataset.data;

            grapheneEngine.addLinegraph(divs[i], properties, data);
        }
    }

    grapheneEngine.render();
}

window.addEventListener('load', loadGraphs, false);
