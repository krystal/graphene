class GrapheneEngine {
    constructor() {
        this.graphDictionary = new Object();
    
        window.addEventListener('resize', this.rerender(), false);
    }

    addLinegraph(element, properties, data) {
        var linegraph = null;

        if (typeof module !== "undefined") {
            const GrapheneLinegraph = require('./linegraph.js');
            linegraph = new GrapheneLinegraph(element, properties, data);
        } else {
            linegraph = new GrapheneLinegraph(element, properties, data);
        }
        this.graphDictionary[element.id] = linegraph;

        return linegraph;
    }

    render() {
        for (var elementId in this.graphDictionary) {
            var graph = this.graphDictionary[elementId];
            if (!this.graphDictionary.drawn) {
                graph.draw();
            }
        }
    }
    
    rerender() {
        for (var elementId in this.graphDictionary) {
            var graph = this.graphDictionary[elementId];
            if (this.graphDictionary.drawn) {
                graph.draw();
            }
        }
    }

    getGraph(element) {
        return this.graphDictionary[element.id];
    }
}

if (typeof module !== "undefined") {
    module.exports = GrapheneEngine;
}
