var graphs = new Array();

// TODO: make this in to a class so it can be instantiated
// TODO: rename all classes, add graphene in so we don't get conflicts (also do this with the css variables)

function initialise(graphComponentsArray) {
    for (let graphComponents of graphComponentsArray) {
        switch (graphComponents.type) {
            case "linegraph":
                var linegraph = new Linegraph(graphComponents.backgroundId, graphComponents.foregroundId, graphComponents.properties, graphComponents.data);
                graphs.push(linegraph);
                break
            default:
            // do nothing
        }
    }
}

function drawGraphs() {
    for (let graph of graphs) {
        graph.draw();
    }
}

window.addEventListener('resize', drawGraphs, false);
