module.exports = (graphComponentsArray) => {
  const GrapheneEngine = require('./src/engine');
  new GrapheneEngine(graphComponentsArray);
}
