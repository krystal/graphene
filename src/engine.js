class GrapheneEngine {
    constructor(graphComponentsArray) {
        this.graphs = new Array();

        for (let graphComponents of graphComponentsArray) {
            switch (graphComponents.type) {
                case "linegraph":
                    var linegraph = null;
                    if (typeof module !== "undefined") {
                        const GrapheneLinegraph = require('./linegraph.js');
                        linegraph = new GrapheneLinegraph(graphComponents.background, graphComponents.foreground, graphComponents.properties, graphComponents.data);
                    } else {
                        linegraph = new GrapheneLinegraph(graphComponents.background, graphComponents.foreground, graphComponents.properties, graphComponents.data);
                    }
                    this.graphs.push(linegraph);
                    break
                default:
                // do nothing
            }
        }
    
        window.addEventListener('resize', this.drawGraphs(), false);
    }
    
    drawGraphs() {
        for (let graph of this.graphs) {
            graph.draw();
        }
    }
}

if (typeof module !== "undefined") {
    module.exports = GrapheneEngine;
}
