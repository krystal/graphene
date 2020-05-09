function loadGraphs() {
    var graphComponentsArray = new Array();
    var divs = document.getElementsByTagName("div");
    for (var i = 0; i < divs.length; i++) {
        if (divs[i].dataset.type) {
            var id = divs[i].getAttribute("id");
            var type = divs[i].dataset.type;
            var datasetProperties = divs[i].dataset.properties;
            var properties = (datasetProperties && datasetProperties != "") ? JSON.parse(datasetProperties) : null
            var data = JSON.parse(divs[i].dataset.data);
            var backgroundId = id + "-background";
            var foregroundId = id + "-foreground";

            graphComponentsArray.push({"type": type, "backgroundId": backgroundId, "foregroundId": foregroundId, "properties": properties, "data": data});
        }
    }

    initialise(graphComponentsArray);
}

window.addEventListener('load', loadGraphs, false);
