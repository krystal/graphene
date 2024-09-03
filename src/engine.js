import Bargraph from "./bargraph.js";
import Linegraph from "./linegraph.js";
import Piegraph from "./piegraph.js";

/*
 * TODO; remove data sets as an option for data, type and properties
 * ^then the parsing in here (and linting warnings) can go
 */

export default class Engine {
  constructor() {
    this.graphDictionary = {};

    window.addEventListener("resize", this.rerender.bind(this));
  }

  addLinegraph(element, properties, data, axisFormatter, informationFormatter) {
    if (typeof properties === "string") {
      properties = JSON.parse(properties);
    }
    if (typeof data === "string") {
      data = JSON.parse(data);
    }

    const linegraph = new Linegraph(element, properties, data, axisFormatter, informationFormatter);

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

    const piegraph = new Piegraph(element, properties, data);

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

    const bargraph = new Bargraph(element, properties, data, axisFormatter, informationFormatter);

    this.graphDictionary[element.id] = bargraph;

    return bargraph;
  }

  render() {
    for (const elementId in this.graphDictionary) {
      if (Object.hasOwn(this.graphDictionary, elementId)) {
        const graph = this.graphDictionary[elementId];
        if (!graph.drawn) {
          graph.draw();
        }
      }
    }
  }

  rerender() {
    for (const elementId in this.graphDictionary) {
      if (Object.hasOwn(this.graphDictionary, elementId)) {
        const graph = this.graphDictionary[elementId];
        graph.createLayers();
        graph.addMouseEvents();
        if (graph.drawn) {
          graph.draw();
        }
      }
    }
  }

  getGraph(element) {
    return this.graphDictionary[element.id];
  }

  removeGraph(element) {
    const graph = this.getGraph(element);
    graph.removeLayers();
    Reflect.deleteProperty(this.graphDictionary, element.id);
  }
}
