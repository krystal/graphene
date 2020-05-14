var grapheneEngine = null;

function loadGraphs() {
    var graphComponentsArray = new Array();
    var divs = document.getElementsByTagName("div");
    for (var i = 0; i < divs.length; i++) {
        if (divs[i].dataset.type) {
            var id = divs[i].getAttribute("id");
            var type = divs[i].dataset.type;
            var datasetProperties = divs[i].dataset.properties;
            var properties = (datasetProperties && datasetProperties != "") ? datasetProperties : null
            var data = divs[i].dataset.data;
            var background = document.getElementById(id + "-background");
            var foreground = document.getElementById(id + "-foreground");

            graphComponentsArray.push({"type": type, "background": background, "foreground": foreground, "properties": properties, "data": data});
        }
    }

    grapheneEngine = new GrapheneEngine(graphComponentsArray);
}

window.addEventListener('load', loadGraphs, false);
