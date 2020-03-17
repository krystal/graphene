var graphs = new Array();

function loadGraphs() {
    var divs = document.getElementsByTagName("div");
    for (var i = 0; i < divs.length; i++) {
        if (divs[i].dataset.type) {
            var id = divs[i].getAttribute("id");
            var type = divs[i].dataset.type;
            var properties = divs[i].dataset.properties;
            var data = divs[i].dataset.data;
            var backgroundId = id + "-background";
            var foregroundId = id + "-foreground";
            var tooltipId = id + "-tooltip";

            switch (type) {
                case "linegraph":
                    graphs.push(new Linegraph(backgroundId, foregroundId, tooltipId, properties, data));
                    break;
                case "bargraph":
                    graphs.push(new Bargraph(backgroundId, foregroundId, tooltipId, properties, data));
                    break;
                case "piegraph":
                    graphs.push(new Piegraph(backgroundId, foregroundId, tooltipId, properties, data));
                    break;
                default:
                // do nothing
            }
        }
    }
}

function drawGraphs() {
    for (var i = 0; i < graphs.length; i++) {
        //graphs[i].draw();
    }
}

window.addEventListener('load', loadGraphs, false);
window.addEventListener('resize', drawGraphs, false);
