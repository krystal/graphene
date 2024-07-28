import Linegraph from './linegraph.js';
import Piegraph from './piegraph.js';
import Bargraph from './bargraph.js';

export default class Engine {
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

    var linegraph = new Linegraph(element, properties, data, axisFormatter, informationFormatter);

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

    var piegraph = new Piegraph(element, properties, data);

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

    var bargraph = new Bargraph(element, properties, data, axisFormatter, informationFormatter);

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
