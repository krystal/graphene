class GrapheneEngine {
    constructor(graphComponentsArray) {
        this.graphs = new Array();
    
        window.addEventListener('resize', this.drawGraphs(), false);
    }

    addLinegraph(element, properties, data) {
        var linegraph = null;

        if (typeof module !== "undefined") {
            const GrapheneLinegraph = require('./linegraph.js');
            linegraph = new GrapheneLinegraph(element, properties, data);
        } else {
            linegraph = new GrapheneLinegraph(element, properties, data);
        }
        linegraph.draw();
        this.graphs.push(linegraph);

        return linegraph;
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
