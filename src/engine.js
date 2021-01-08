class GrapheneEngine {
    constructor() {
        this.graphDictionary = new Object();

        window.addEventListener('resize', this.rerender.bind(this));
    }

    addLinegraph(element, properties, data, axisFormatter, informationFormatter) {
        if (typeof properties === "string") {
            properties = JSON.parse(properties);
        }
        if (typeof data === "string") {
            data = JSON.parse(data);
        }

        var linegraph = null;

        if (typeof module !== "undefined") {
            const GrapheneLinegraph = require('./linegraph.js');
            linegraph = new GrapheneLinegraph(element, properties, data, axisFormatter, informationFormatter);
        } else {
            linegraph = new GrapheneLinegraph(element, properties, data, axisFormatter, informationFormatter);
        }
        this.graphDictionary[element.id] = linegraph;

        return linegraph;
    }

    addPiegraph(element, properties, data) {
        if (typeof properties === "string") {
            properties = JSON.parse(properties);
        }
        if (typeof data === "string") {
            data = JSON.parse(data);
        }

        var piegraph = null;

        if (typeof module !== "undefined") {
            const GraphenePiegraph = require('./piegraph.js');
            piegraph = new GraphenePiegraph(element, properties, data);
        } else {
            piegraph = new GraphenePiegraph(element, properties, data);
        }
        this.graphDictionary[element.id] = piegraph;

        return piegraph;
    }

    addBargraph(element, properties, data, axisFormatter, informationFormatter) {
        if (typeof properties === "string") {
            properties = JSON.parse(properties);
        }
        if (typeof data === "string") {
            data = JSON.parse(data);
        }

        var bargraph = null;

        if (typeof module !== "undefined") {
            const GrapheneBargraph = require('./bargraph.js');
            bargraph = new GrapheneBargraph(element, properties, data, axisFormatter, informationFormatter);
        } else {
            bargraph = new GrapheneBargraph(element, properties, data, axisFormatter, informationFormatter);
        }
        this.graphDictionary[element.id] = bargraph;

        return bargraph;
    }

    render() {
        for (var elementId in this.graphDictionary) {
            var graph = this.graphDictionary[elementId];
            if (!graph.drawn) {
                graph.draw();
            }
        }
    }

    rerender() {
        for (var elementId in this.graphDictionary) {
            var graph = this.graphDictionary[elementId];
            graph.createLayers();
            graph.addMouseEvents();
            if (graph.drawn) {
                graph.draw();
            }
        }
    }

    getGraph(element) {
        return this.graphDictionary[element.id];
    }

    removeGraph(element) {
        var graph = this.getGraph(element);
        graph.removeLayers();
        delete this.graphDictionary[element.id];
    }
}

if (typeof module !== "undefined") {
    module.exports = GrapheneEngine;
}
