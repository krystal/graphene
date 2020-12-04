class GraphenePiegraph {
  constructor(element, properties, data) {
    if (typeof module !== "undefined") {
      const GrapheneHelper = require('./helper');
      this.grapheneHelper = new GrapheneHelper();
    } else {
      this.grapheneHelper = new GrapheneHelper();
    }
    this.drawn = false;
    this.element = element;
    this.createLayers();

    this.properties = properties;
    this.data = data;
    this.retrieveSettings();
    this.calculateParameters();

    this.addMouseEvents();
  }

  // TODO: investigate pies getting larger than smaller when resizing (it may be a quirk of the way that the space for the key is allocated)
  // TODO: review the implementation of the horizontal margin
  // TODO: when available graph width > height centre the graph horizontally
  // TODO: add property parsing
  // TODO: add a flag in properties for displaying the percentage rather than the value
  // TODO: add a property for decimal places in percentages
  // TODO: allow the key to be placed at the top, left, right or bottom of the graph
  // TODO: parameterise more things in properties
  // TODO: warn about key clipping
  // TODO: stop drawing graph labels when there isn't enough space

  createLayers() {
    this.removeLayers();

    this.background = document.createElement('CANVAS');
    this.background.width = this.element.getBoundingClientRect().width;
    this.background.height = this.element.getAttribute('height');
    this.element.appendChild(this.background);

    this.foreground = document.createElement("CANVAS");
    this.foreground.width = this.element.getBoundingClientRect().width;
    this.foreground.height = this.element.getAttribute('height');
    this.foreground.style.position = 'absolute';
    this.foreground.style.left = 0;
    this.foreground.style.top = 0;
    this.foreground.style.zIndex = 0;
    this.element.appendChild(this.foreground);

    this.canvasWidth = this.background.width;
    this.canvasHeight = this.background.height;

    this.backgroundContext = this.grapheneHelper.getContext(this.background);
    this.foregroundContext = this.grapheneHelper.getContext(this.foreground);
  }

  removeLayers() {
    if (this.background) {
      this.element.removeChild(this.background);
    }
    if (this.foreground) {
      this.element.removeChild(this.foreground);
    }
  }

  addMouseEvents() {
  }

  draw() {
    this.drawn = true;
    this.retrieveSettings();
    this.calculateParameters();
    this.redraw();
  }

  getDataColour(i) {
    if (this.coloursData && this.coloursData.length > 0) {
        return this.coloursData[i % this.coloursData.length];
    }
    return this.defaultDataColour;
}

  redraw() {
    this.backgroundContext.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
    this.backgroundContext.fillStyle = this.grapheneHelper.hex2rgba(this.coloursBackground, this.alphasBackground);
    this.backgroundContext.fillRect(0, 0, this.canvasWidth, this.canvasHeight);

    this.drawGraph();
    this.drawGraphLabels();
    this.drawKey();
  }

  getStyle(name, defaultStyle) {
    var style = getComputedStyle(this.element).getPropertyValue(name);
    if (style) {
        return style;
    }

    if (defaultStyle != false) {
        console.log(name + " style was not present in CSS, reverting to default of " + defaultStyle);
    }
    return defaultStyle;
}

  retrieveSettings() {
    this.defaultDataColour = '#000000';

    this.alphasBackground = this.getStyle('--alphas-background', 1);
    this.coloursBackground = this.getStyle('--colours-background', '#FFFFFF');
    this.coloursSegmentLabels = this.getStyle('--colours-segment-labels', '#FFFFFF');
    this.coloursKeyLabels = this.getStyle('--colours-key-labels', '#555555');

    this.coloursData = new Array();
    for (var i = 0; i < this.data.values.length; i++) {
      var colour = this.getStyle('--colours-data-' + i, false);
      if (colour && colour != false) { this.coloursData.push(colour); }
    }

    this.fontsSegmentLabelsFamily = this.getStyle('--fonts-segment-labels-family', 'Arial');
    this.fontsSegmentLabelsSize = this.getStyle('--fonts-segment-labels-size', 24);
    this.fontsSegmentLabelsWeight = this.getStyle('--fonts-segment-labels-weight', 'normal');
    this.fontsKeyLabelsFamily = this.getStyle('--fonts-key-labels-family', 'Arial');
    this.fontsKeyLabelsSize = this.getStyle('--fonts-key-labels-size', 18);
    this.fontsKeyLabelsWeight = this.getStyle('--fonts-key-labels-weight', 'normal');

    this.widthsBorder = this.getStyle('--widths-border', 12);
  }

  calculateParameters() {
    this.backgroundContext.font = this.fontsKeyLabelsWeight + " " + this.fontsKeyLabelsSize + "px " + this.fontsKeyLabelsFamily;

    var maxLabelWidth = 0;
    for (var i = 0; i < this.data.names.length; i++) {
      var labelWidth = this.backgroundContext.measureText(this.data.names[i]).width;
      if (labelWidth > maxLabelWidth) {
          maxLabelWidth = labelWidth;
      }
    }

    var labelHeightApproximation = this.backgroundContext.measureText("M").width;
    this.keyWidth = (2 * labelHeightApproximation) + maxLabelWidth;

    var horizontalMargin = this.canvasWidth * 0.05;
    // a margin at either end then 1.5 margins between the graph and the key
    var availableGraphWidth = this.canvasWidth - this.keyWidth - (3.5 * horizontalMargin);
    var availableGraphHeight = this.canvasHeight - (2 * horizontalMargin);
    this.graphWidth = Math.min(availableGraphWidth, availableGraphHeight);
    this.graphHeight = this.graphWidth;
    this.graphStartX = horizontalMargin;
    this.graphStartY = (this.canvasHeight - this.graphHeight) / 2;
    this.graphCentreX = this.graphStartX + (this.graphWidth / 2);
    this.graphCentreY = this.graphStartY + (this.graphHeight / 2);

    // number of segments plus double the number of gaps between segments
    var contentHeightAppoximation = labelHeightApproximation * (this.data.names.length + ((this.data.names.length - 1) * 2));

    this.keyHeight = contentHeightAppoximation;
    this.keyStartX = this.graphWidth + (2.5 * horizontalMargin);
    this.keyStartY = (this.canvasHeight - this.keyHeight) / 2;
  }

  drawGraph() {
    // start at up rather than right
    var angleOffset = -0.5 * Math.PI;
    var cumulativeAngle = 0;

    this.backgroundContext.strokeStyle = this.coloursBackground;
    this.backgroundContext.lineWidth = this.widthsBorder;

    var total = this.data.values.reduce((a, b) => a + b, 0);
    for (var i = 0; i < this.data.values.length; i++) {
      var segmentAngle = (this.data.values[i] / total) * 2 * Math.PI;

      this.backgroundContext.fillStyle = this.getDataColour(i);
      this.backgroundContext.save();

      this.backgroundContext.beginPath();

      this.backgroundContext.translate(this.graphCentreX, this.graphCentreY);
      this.backgroundContext.rotate(angleOffset);
      this.backgroundContext.rotate(cumulativeAngle);
      this.backgroundContext.moveTo(this.graphWidth / 2 / 3, 0);
      this.backgroundContext.lineTo(this.graphWidth / 2, 0);
      this.backgroundContext.arc(0, 0, this.graphWidth / 2, 0, segmentAngle);
      this.backgroundContext.rotate(segmentAngle);
      this.backgroundContext.lineTo(this.graphWidth / 2, 0);
      this.backgroundContext.arc(0, 0, this.graphWidth / 2 / 3, 0, -segmentAngle, true);

      this.backgroundContext.closePath();

      this.backgroundContext.restore();
      this.backgroundContext.stroke();
      this.backgroundContext.fill();

      cumulativeAngle += segmentAngle;
    }
  }

  drawGraphLabels() {
    // start at up rather than right
    var angleOffset = -0.5 * Math.PI;
    var cumulativeAngle = 0;

    this.backgroundContext.font = this.fontsSegmentLabelsWeight + " " + this.fontsSegmentLabelsSize + "px " + this.fontsSegmentLabelsFamily;
    this.backgroundContext.fillStyle = this.coloursSegmentLabels;
    this.backgroundContext.textAlign = "center";
    this.backgroundContext.textBaseline = "middle";
    this.backgroundContext.save();

    this.backgroundContext.translate(this.graphCentreX, this.graphCentreY);

    var total = this.data.values.reduce((a, b) => a + b, 0);
    for (var i = 0; i < this.data.values.length; i++) {
      var segmentRatio = this.data.values[i] / total;
      var segmentAngle = (segmentRatio) * 2 * Math.PI;
      var segmentPercentage = segmentAngle * 100;

      var segmentCentreAngle = angleOffset + cumulativeAngle + (segmentAngle / 2);
      var labelX = (this.graphWidth / 3) * Math.cos(segmentCentreAngle);
      var labelY = (this.graphWidth / 3) * Math.sin(segmentCentreAngle);
      this.backgroundContext.fillText(segmentPercentage, labelX, labelY);

      cumulativeAngle += segmentAngle;
    }

    this.backgroundContext.restore();
  }

  drawKey() {
    this.backgroundContext.font = this.fontsKeyLabelsWeight + " " + this.fontsKeyLabelsSize + "px " + this.fontsKeyLabelsFamily;
    this.backgroundContext.textAlign = "left";
    this.backgroundContext.textBaseline = "middle";

    var labelHeightApproximation = this.backgroundContext.measureText("M").width;

    var yOffset = this.keyStartY;
    for (var i = 0; i < this.data.names.length; i++) {
      this.backgroundContext.fillStyle = this.getDataColour(i);
      this.backgroundContext.fillRect(this.keyStartX, yOffset, labelHeightApproximation, labelHeightApproximation);
      this.backgroundContext.fillStyle = this.coloursKeyLabels;
      this.backgroundContext.fillText(this.data.names[i], this.keyStartX + (2 * labelHeightApproximation), yOffset + (labelHeightApproximation / 2));

      // offset by this line plus two gaps
      yOffset += 3 * labelHeightApproximation;
    }
  }
}

if (typeof module !== "undefined") {
  module.exports = GraphenePiegraph;
}
