import Helper from "./helper.js";

export default class Piegraph {
  constructor(element, properties, data) {
    this.helper = new Helper();
    this.drawn = false;
    this.element = element;
    this.createLayers();

    this.properties = properties;
    this.data = data;
    this.retrieveSettings();
    this.calculateParameters();

    this.addMouseEvents();
  }

  /*
   * TODO: when available graph width > height centre the graph horizontally
   * TODO: add a flag in properties for turning the key on (have it off by default)
   * TODO: support the key being placed to the left as well as to the right of the graph
   * TODO: investigate what happens when available height is greater than available width (does the graph centre vertically?)
   * TODO: support the key being placed at the top or bottom of the graph (landscape layout rather than portrait)
   * TODO: parameterise more things in properties
   * TODO: warn about key clipping - will that ever happen? we currently sacrifice graph space over key space...
   * TODO: stop drawing graph labels when there isn"t enough space in the segment (still a tricky thing to account for)
   * TODO: add something to the foreground layer on hovering over a segment (the segment could appear shaded in and an information box could appear on top of it)
   * ^if we keep counting the inner ring of doughnut (and margins between the segments) as valid segment space, then this shouldn"t be too bad
   * ^^because all we"d nee to check is if we"re in the big circle then what the degree is on the circle
   * ^^^the information panel should contain the name, percentage and raw value
   */

  createLayers() {
    this.removeLayers();

    this.background = document.createElement("CANVAS");
    this.background.width = this.element.getBoundingClientRect().width;
    this.background.height = this.element.getAttribute("height");
    this.element.appendChild(this.background);

    this.foreground = document.createElement("CANVAS");
    this.foreground.width = this.element.getBoundingClientRect().width;
    this.foreground.height = this.element.getAttribute("height");
    this.foreground.style.position = "absolute";
    this.foreground.style.left = 0;
    this.foreground.style.top = 0;
    this.foreground.style.zIndex = 0;
    this.element.appendChild(this.foreground);

    this.canvasWidth = this.background.width;
    this.canvasHeight = this.background.height;

    this.backgroundContext = Helper.getContext(this.background);
    this.foregroundContext = Helper.getContext(this.foreground);
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
    this.backgroundContext.fillStyle = Helper.hex2rgba(this.coloursBackground, this.alphasBackground);
    this.backgroundContext.fillRect(0, 0, this.canvasWidth, this.canvasHeight);

    this.drawGraph();
    this.drawGraphLabels();
    this.drawKey();
  }

  getSegmentsLabelFormatIsPercentage() {
    if (this.properties && this.properties.segments && this.properties.segments.label && this.properties.segments.label.format) {
      return this.properties.segments.label.format == "percentage";
    }
    return false;
  }

  getSegmentsLabelDecimalPlaces() {
    if (this.properties && this.properties.segments && this.properties.segments.label && this.properties.segments.label.decimal_places) {
      return this.properties.segments.label.decimal_places;
    }
    return 0;
  }

  getSegmentsLabelPrefix() {
    if (this.properties && this.properties.segments && this.properties.segments.label) {
      if (this.properties.segments.label.format && this.properties.segments.label.format == "percentage") {
        return "";
      } else if (this.properties.segments.label.prefix) {
        return this.properties.segments.label.prefix;
      }
    }
    return "";
  }

  getSegmentsLabelSuffix() {
    if (this.properties && this.properties.segments && this.properties.segments.label) {
      if (this.properties.segments.label.format && this.properties.segments.label.format == "percentage") {
        return "%";
      } else if (this.properties.segments.label.suffix) {
        return this.properties.segments.label.suffix;
      }
    }
    return "";
  }

  getStyle(name, defaultStyle, logToConsole = true) {
    const style = getComputedStyle(this.element).getPropertyValue(name);
    if (style) {
        return style;
    }

    if (logToConsole) {
        console.log(name + " style was not present in CSS, reverting to default of " + defaultStyle);
    }
    return defaultStyle;
  }

  retrieveSettings() {
    this.defaultDataColour = "#000000";

    this.alphasBackground = this.getStyle("--alphas-background", 1);
    this.coloursBackground = this.getStyle("--colours-background", "#FFFFFF");
    this.coloursSegmentLabels = this.getStyle("--colours-segment-labels", "#FFFFFF");
    this.coloursKeyLabels = this.getStyle("--colours-key-labels", "#555555");

    this.coloursData = [];
    for (let i = 0; i < this.data.values.length; i += 1) {
      const colour = this.getStyle("--colours-data-" + i, false);
      if (colour && colour != false) {
        this.coloursData.push(colour);
      }
    }

    this.degreesSegmentBorder = this.getStyle("--degrees-segment-border", 0, false);

    this.fontsSegmentLabelsFamily = this.getStyle("--fonts-segment-labels-family", "Arial");
    this.fontsSegmentLabelsSize = this.getStyle("--fonts-segment-labels-size", 24);
    this.fontsSegmentLabelsWeight = this.getStyle("--fonts-segment-labels-weight", "normal");
    this.fontsKeyLabelsFamily = this.getStyle("--fonts-key-labels-family", "Arial");
    this.fontsKeyLabelsSize = this.getStyle("--fonts-key-labels-size", 18);
    this.fontsKeyLabelsWeight = this.getStyle("--fonts-key-labels-weight", "normal");

    this.radiiSegmentCentreMultiplier = this.getStyle("--radii-segment-centre-multiplier", 0, false);
  }

  calculateParameters() {
    this.backgroundContext.font = this.fontsKeyLabelsWeight + " " + this.fontsKeyLabelsSize + "px " + this.fontsKeyLabelsFamily;

    let maxLabelWidth = 0;
    for (let i = 0; i < this.data.names.length; i += 1) {
      const labelWidth = this.backgroundContext.measureText(this.data.names[i]).width;
      if (labelWidth > maxLabelWidth) {
          maxLabelWidth = labelWidth;
      }
    }

    const labelHeightApproximation = this.backgroundContext.measureText("M").width;
    this.keyWidth = 2 * labelHeightApproximation + maxLabelWidth;

    const horizontalMargin = labelHeightApproximation;
    // A margin at either end then 3 margins between the graph and the key
    const availableGraphWidth = this.canvasWidth - this.keyWidth - (5 * horizontalMargin);
    const availableGraphHeight = this.canvasHeight - (2 * horizontalMargin);
    this.graphWidth = Math.min(availableGraphWidth, availableGraphHeight);
    this.graphHeight = this.graphWidth;
    this.graphStartX = horizontalMargin;
    this.graphStartY = (this.canvasHeight - this.graphHeight) / 2;
    this.graphCentreX = this.graphStartX + (this.graphWidth / 2);
    this.graphCentreY = this.graphStartY + (this.graphHeight / 2);

    // Number of segments plus double the number of gaps between segments
    const contentHeightAppoximation = labelHeightApproximation * (this.data.names.length + ((this.data.names.length - 1) * 2));

    this.keyHeight = contentHeightAppoximation;
    this.keyStartX = this.graphWidth + (4 * horizontalMargin);
    this.keyStartY = (this.canvasHeight - this.keyHeight) / 2;
  }

  drawGraph() {
    // Start at up rather than right
    const angleOffset = -0.5 * Math.PI;
    let cumulativeAngle = 0;
    const borderWidthRadians = this.degreesSegmentBorder * (Math.PI / 180);
    const graphRadius = this.graphWidth / 2;

    this.backgroundContext.strokeStyle = this.coloursBackground;
    this.backgroundContext.lineWidth = 1 / Number.MAX_SAFE_INTEGER;

    const total = this.data.values.reduce((a, b) => a + b, 0);
    for (let i = 0; i < this.data.values.length; i += 1) {
      const segmentAngle = this.data.values[i] / total * 2 * Math.PI;

      this.backgroundContext.fillStyle = this.getDataColour(i);
      this.backgroundContext.save();

      this.backgroundContext.beginPath();

      this.backgroundContext.translate(this.graphCentreX, this.graphCentreY);
      this.backgroundContext.rotate(angleOffset);
      this.backgroundContext.rotate(cumulativeAngle);
      this.backgroundContext.rotate(borderWidthRadians / 2);
      this.backgroundContext.moveTo(graphRadius * this.radiiSegmentCentreMultiplier, 0);
      this.backgroundContext.lineTo(graphRadius, 0);
      this.backgroundContext.arc(0, 0, graphRadius, 0, segmentAngle - borderWidthRadians);
      this.backgroundContext.rotate(segmentAngle - borderWidthRadians);
      this.backgroundContext.lineTo(graphRadius, 0);
      this.backgroundContext.arc(0, 0, graphRadius * this.radiiSegmentCentreMultiplier, 0, -(segmentAngle - borderWidthRadians), true);

      this.backgroundContext.closePath();

      this.backgroundContext.restore();
      this.backgroundContext.stroke();
      this.backgroundContext.fill();

      cumulativeAngle += segmentAngle;
    }
  }

  drawGraphLabels() {
    // Start at up rather than right
    const angleOffset = -0.5 * Math.PI;
    let cumulativeAngle = 0;
    const graphRadius = this.graphWidth / 2;
    const distanceFromCentre = (parseFloat(this.radiiSegmentCentreMultiplier) + parseFloat((1 - this.radiiSegmentCentreMultiplier) / 2)) * graphRadius;

    this.backgroundContext.font = this.fontsSegmentLabelsWeight + " " + this.fontsSegmentLabelsSize + "px " + this.fontsSegmentLabelsFamily;
    this.backgroundContext.fillStyle = this.coloursSegmentLabels;
    this.backgroundContext.textAlign = "center";
    this.backgroundContext.textBaseline = "middle";
    this.backgroundContext.save();

    this.backgroundContext.translate(this.graphCentreX, this.graphCentreY);

    const total = this.data.values.reduce((a, b) => a + b, 0);
    for (let i = 0; i < this.data.values.length; i += 1) {
      const segmentValue = this.data.values[i];
      const segmentRatio = segmentValue / total;
      const segmentAngle = (segmentRatio) * 2 * Math.PI;
      const segmentPercentage = segmentRatio * 100;

      const value = this.getSegmentsLabelFormatIsPercentage()
      ? segmentPercentage
      : segmentValue;
      const labelValue = +value.toFixed(this.getSegmentsLabelDecimalPlaces());
      const labelText = Helper.applyAffix(labelValue, this.getSegmentsLabelPrefix(), this.getSegmentsLabelSuffix());

      const segmentCentreAngle = angleOffset + cumulativeAngle + (segmentAngle / 2);
      const labelX = distanceFromCentre * Math.cos(segmentCentreAngle);
      const labelY = distanceFromCentre * Math.sin(segmentCentreAngle);
      this.backgroundContext.fillText(labelText, labelX, labelY);

      cumulativeAngle += segmentAngle;
    }

    this.backgroundContext.restore();
  }

  drawKey() {
    this.backgroundContext.font = this.fontsKeyLabelsWeight + " " + this.fontsKeyLabelsSize + "px " + this.fontsKeyLabelsFamily;
    this.backgroundContext.textAlign = "left";
    this.backgroundContext.textBaseline = "middle";

    const labelHeightApproximation = this.backgroundContext.measureText("M").width;

    let yOffset = this.keyStartY;
    for (let i = 0; i < this.data.names.length; i += 1) {
      this.backgroundContext.fillStyle = this.getDataColour(i);
      this.backgroundContext.fillRect(this.keyStartX, yOffset, labelHeightApproximation, labelHeightApproximation);
      this.backgroundContext.fillStyle = this.coloursKeyLabels;
      this.backgroundContext.fillText(this.data.names[i], this.keyStartX + (2 * labelHeightApproximation), yOffset + (labelHeightApproximation / 2));

      // Offset by this line plus two gaps
      yOffset += 3 * labelHeightApproximation;
    }
  }
}
