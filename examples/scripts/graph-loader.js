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

            // used to test JSON objects work in addition to JSON strings
            if (false) {
                properties = properties ? JSON.parse(properties) : null;
                data = data ? JSON.parse(data) : null;
            }

            linegraph = grapheneEngine.addLinegraph(divs[i], properties, data);
        }
    }

    grapheneEngine.render();

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

function prepareUpdate() {
    var data = '{"names": ["Svalbard"], "x":[["Mon","Monday 18th"],["Tue","Tuesday 19th"],["Wed","Wednesday 20th"],["Thu","Thursday 21st"],["Fri","Friday 22nd"],["Sat","Saturday 23rd"],["Sun","Sunday 24th"]],"y":[[1,2,2,3,3,2,4]]}';
    var properties = '{"flags":{"highlight_enabled":true,"scroll_enabled":true,"zoom_enabled":true},"y_axis":{"label_suffix":[[0,"°C"]], "max":30}}';
    linegraph.updateData(data, properties);
}

function prepareAddHorizontal() {
    var data = '{"names": ["Svalbard", "Faro"], "x":[["Mon","Monday 18th"],["Tue","Tuesday 19th"],["Wed","Wednesday 20th"],["Thu","Thursday 21st"],["Fri","Friday 22nd"],["Sat","Saturday 23rd"],["Sun","Sunday 24th"]],"y":[[1,2,2,3,3,2,4],[23,26,25,26,27,27,27]]}';
    var properties = '{"flags":{"highlight_enabled":true,"scroll_enabled":true,"zoom_enabled":true},"y_axis":{"label_suffix":[[0,"°C"]], "max":30}}';
    linegraph.updateData(data, properties);
}

function prepareAddVertical() {
    var data = '{"names": ["Svalbard", "Faro"], "x":[["Mon","Monday 18th"],["Tue","Tuesday 19th"],["Wed","Wednesday 20th"],["Thu","Thursday 21st"],["Fri","Friday 22nd"],["Sat","Saturday 23rd"],["Sun","Sunday 24th"],["Mon","Monday 25th"],["Tue","Tuesday 26th"],["Wed","Wednesday 27th"],["Thu","Thursday 28th"],["Fri","Friday 29th"],["Sat","Saturday 30th"],["Sun","Sunday 31st"]],"y":[[1,2,2,3,3,2,4,4,4,5,5,5,5,5],[23,26,25,26,27,27,27,27,27,26,24,24,24,23]]}';
    var properties = '{"flags":{"highlight_enabled":true,"scroll_enabled":true,"zoom_enabled":true},"y_axis":{"label_suffix":[[0,"°C"]], "max":30}}';
    linegraph.updateData(data, properties);
}

function updateData() {
    var data = '{"names": ["Faro"], "x":[["Mon","Monday 18th"],["Tue","Tuesday 19th"],["Wed","Wednesday 20th"],["Thu","Thursday 21st"],["Fri","Friday 22nd"],["Sat","Saturday 23rd"],["Sun","Sunday 24th"]],"y":[[23,26,25,26,27,27,27]]}';
    linegraph.updateData(data, null);
}

function addHorizontalData() {
    var data = '{"x":[["Mon","Monday 25th"],["Tue","Tuesday 26th"],["Wed","Wednesday 27th"],["Thu","Thursday 28th"],["Fri","Friday 29th"],["Sat","Saturday 30th"],["Sun","Sunday 31st"]],"y":[[4,4,5,5,5,5,5],[27,27,26,24,24,24,23]]}';
    linegraph.addHorizontalData(data, null);
}

function addVerticalData() {
    var data = '{"names": ["Fort William"], "y":[[13,14,20,18,13,13,14,15,15,14,14,14,14,15]]}';
    linegraph.addVerticalData(data, null);
}

window.addEventListener('load', loadGraphs, false);
