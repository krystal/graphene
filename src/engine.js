var graphs = new Array();

function loadGraphs() {
    var divs = document.getElementsByTagName("div");
    for (var i = 0; i < divs.length; i++) {
        if (divs[i].dataset.type) {
            var id = divs[i].getAttribute("id");
            var type = divs[i].dataset.type;
            var properties = JSON.parse(divs[i].dataset.properties);
            var data = JSON.parse(divs[i].dataset.data);
            var backgroundId = id + "-background";
            var foregroundId = id + "-foreground";

            switch (type) {
                case "linegraph":
                    graphs.push(new Linegraph(backgroundId, foregroundId, properties, data));
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
