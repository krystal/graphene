class GrapheneEngine {
    constructor(graphComponentsArray) {
        this.graphDictionary = new Object();
    
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
        this.graphDictionary[element] = linegraph;

        return linegraph;
    }
    
    drawGraphs() {
        for (var element in this.graphDictionary) {
            this.graphDictionary[element].draw;
        }
    }

    getGraph(element) {
        return this.graphDictionary[element];
    }
}

if (typeof module !== "undefined") {
    module.exports = GrapheneEngine;
}
