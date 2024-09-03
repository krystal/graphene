import Helper from "./helper.js";

export default class Bargraph {
  constructor(element, properties, data, axisFormatter, informationFormatter) {
    this.drawn = false;
    this.userDefinedViewPort = false;
    this.element = element;
    this.createLayers();

    this.properties = properties;
    this.data = data;
    this.retrieveSettings();
    this.calculateParameters();

    this.axisFormatter = axisFormatter;
    this.informationFormatter = informationFormatter;

    this.addMouseEvents();
  }

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
    this.cancelMouseMove();
    this.foreground.addEventListener("mousemove", this.handleMouseMove.bind(this), false);
    this.foreground.addEventListener("mouseleave", this.handleMouseLeave.bind(this), false);
  }

  /*
   * TODO: do some refactoring
   * TODO: investigate "Save Image As..." in browsers, it currently, understandably, saves only the foreground layer
   */

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

  getBestFitColour(i) {
    if (this.coloursBestFit && this.coloursBestFit.length > 0) {
      return this.coloursBestFit[i % this.coloursBestFit.length];
    }
    return this.defaultBestFitColour;
  }

  redraw() {
    this.backgroundContext.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
    this.backgroundContext.fillStyle = Helper.hex2rgba(this.coloursBackground, this.alphasBackground);
    this.backgroundContext.fillRect(0, 0, this.canvasWidth, this.canvasHeight);

    if (!this.hideVerticalAxes) {
      this.drawHorizontalLines();
    }
    for (let i = 0; i < this.data.y.length; i += 1) {
      this.drawBarGraph(i);
    }
    if (this.data.u) {
      for (let i = 0; i < this.data.u.length; i += 1) {
        this.drawLineGraph(i, this.graphScaleU);
      }
    }
    if (!this.hideHorizontalAxis) {
      this.drawHorizontalAxisLabels();
    }
    if (!this.hideVerticalAxes) {
      this.drawVerticalAxesLabels();
    }
    if (this.drawLinesOfBestFit) {
      for (let i = 0; i < this.data.y.length; i += 1) {
        this.drawLineOfBestFit(i);
      }
    }
    if (this.properties && this.properties.x_axis && this.properties.x_axis.markers) {
      this.drawMarkers();
    }
  }

  getLabelPrefixY() {
    if (this.properties && this.properties.y_axis && this.properties.y_axis.label_prefix) {
      return this.properties.y_axis.label_prefix;
    }
    return "";
  }

  getLabelPrefixU() {
    if (this.properties && this.properties.u_axis && this.properties.u_axis.label_prefix) {
      return this.properties.u_axis.label_prefix;
    }
    return "";
  }

  getDecimalPlacesU() {
    if (this.properties && this.properties.u_axis && this.properties.u_axis.decimal_places) {
      return this.properties.u_axis.decimal_places;
    }
    return 0;
  }

  static getLabelComponents(value, labelSuffixArray) {
    if (labelSuffixArray.length == 1) {
      return {
        "suffix": labelSuffixArray[0][1],
        value
      };
    }

    let lastLimit = 1;
    let lastButOneLimit = 1;
    let lastSuffix = "";
    for (let i = 0; i < labelSuffixArray.length; i += 1) {
      const limit = labelSuffixArray[i][0];
      const suffix = labelSuffixArray[i][1];
      if (value < limit) {
        return {
          suffix,
          "value": value / lastLimit
        };
      }
      lastButOneLimit = lastLimit;
      lastLimit = limit;
      lastSuffix = suffix;
    }

    return {
      "suffix": lastSuffix,
      "value": value / (lastLimit / lastButOneLimit)
    };
  }

  getLabelComponentsY(value) {
    if (!this.properties || !this.properties.y_axis || !this.properties.y_axis.label_suffix) {
      return {
        "suffix": "",
        value
      };
    }

    return Bargraph.getLabelComponents(value, this.properties.y_axis.label_suffix);
  }

  getLabelComponentsU(value) {
    if (!this.properties || !this.properties.u_axis || !this.properties.u_axis.label_suffix) {
      return {
        "suffix": "",
        value
      };
    }

    return Bargraph.getLabelComponents(value, this.properties.u_axis.label_suffix);
  }

  calculateAxisRangeX() {
    return this.axisMaxX - this.axisMinX;
  }

  calculateGraphScaleX() {
    return this.graphWidth / (this.calculateAxisRangeX() + 1);
  }

  getMaxValueY() {
    let maxY = 0;
    for (let i = 0; i < this.data.y.length; i += 1) {
      for (let j = 0; j < this.data.y[i].length; j += 1) {
        const y = this.data.y[i][j];
        if (y > maxY) {
          maxY = y;
        }
      }
    }
    return maxY == 0
    ? 1
    : maxY;
  }

  getMaxValueU() {
    let maxU = 0;
    if (this.data.u) {
      for (let i = 0; i < this.data.u.length; i += 1) {
        for (let j = 0; j < this.data.u[i].length; j += 1) {
          const u = this.data.u[i][j];
          if (u > maxU) {
            maxU = u;
          }
        }
      }
    }
    return maxU == 0
    ? 1
    : maxU;
  }

  calculateAxisMax(base, max) {
    const floorPowerOfBase = Helper.calculateFloorPowerOfBase(base, max);
    const floorPowerOfBaseOverBase = floorPowerOfBase / base;

    let candidateMax = floorPowerOfBase;
    while (max > candidateMax) {
      candidateMax += floorPowerOfBase;
    }

    // In an effort to keep the graph aesthetically pleasing, limit potential blank space at the top to 20%
    if (max / candidateMax < 0.8) {
      candidateMax = floorPowerOfBase;
      while (max > candidateMax) {
        candidateMax += floorPowerOfBaseOverBase;
      }
    }

    return candidateMax;
  }

  calculateAxisMaxY() {
    let base = 10;
    if (this.properties && this.properties.y_axis && this.properties.y_axis.base) {
      base = this.properties.y_axis.base;
    }

    return this.calculateAxisMax(base, this.getMaxValueY());
  }

  calculateAxisMaxU() {
    let base = 10;
    if (this.properties && this.properties.u_axis && this.properties.u_axis.base) {
      base = this.properties.u_axis.base;
    }

    return this.calculateAxisMax(base, this.getMaxValueU());
  }

  // TODO: check if any existing callers need to set this optional parameter
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

  // TODO: review the default values so that a graph with no styles looks OKish
  retrieveSettings() {
    if (this.properties) {
      if (this.properties.flags) {
        this.highLightEnabled = this.properties.flags.highlight_enabled
        ? this.properties.flags.highlight_enabled
        : false;
        this.hideHorizontalAxis = this.properties.flags.hide_horizontal_axis
        ? this.properties.flags.hide_horizontal_axis
        : false;
        this.hideVerticalAxes = this.properties.flags.hide_vertical_axes
        ? this.properties.flags.hide_vertical_axes
        : false;
        this.drawLinesOfBestFit = this.properties.flags.draw_lines_of_best_fit
        ? this.properties.flags.draw_lines_of_best_fit
        : false;
      }
    } else {
      this.highLightEnabled = false;
      this.hideHorizontalAxis = false;
      this.hideVerticalAxes = false;
      this.drawLinesOfBestFit = false;
    }

    this.dataNames = this.data.names;

    let verticalData = this.data.y;
    if (this.data.u) {
      verticalData = verticalData.concat(this.data.u);
    }

    this.defaultDataColour = "#999999";
    this.defaultBestFitColour = "#000000";

    this.alphasBackground = this.getStyle("--alphas-background", 1);
    this.coloursBackground = this.getStyle("--colours-background", "#FFFFFF");
    this.coloursDataAxis = this.getStyle("--colours-data-axis", "#E0DEFF");
    this.coloursData = [];
    // TODO: alter this to continue looking until it can"t find a contiguous number, for datasets that are not present at the start
    for (let i = 0; i < verticalData.length; i += 1) {
      const colour = this.getStyle("--colours-data-" + i, false);
      if (colour && colour != false) {
        this.coloursData.push(colour);
      }
    }

    if (this.drawLinesOfBestFit) {
      this.coloursBestFit = [];
      // TODO: alter this to continue looking until it can"t find a contiguous number, for datasets that are not present at the start
      for (let i = 0; i < this.data.y.length; i += 1) {
        const colour = this.getStyle("--colours-best-fit-" + i, false);
        if (colour && colour != false) {
          this.coloursBestFit.push(colour);
        }
      }
      this.widthsBestFit = this.getStyle("--widths-best-fit", 4);
    }
    this.widthsData = this.getStyle("--widths-data", 1);

    if (!this.hideHorizontalAxis || !this.hideVerticalAxes) {
      this.coloursAxesLabels = this.getStyle("--colours-axes-labels", "#555555");
      this.coloursHorizontalLines = this.getStyle("--colours-horizontal-lines", "#EEEEEE");
    }
    this.fontsAxesLabelsSize = this.getStyle("--fonts-axes-labels-size", 0);
    this.fontsAxesLabelsFamily = this.getStyle("--fonts-axes-labels-family", "Arial");
    this.fontsAxesLabelsWeight = this.getStyle("--fonts-axes-labels-weight", "normal");

    if (this.properties && this.properties.x_axis && this.properties.x_axis.markers) {
      this.coloursMarker = this.getStyle("--colours-marker", "#000000");
      this.widthsMarker = this.getStyle("--widths-marker", 2);
    }

    if (this.highLightEnabled) {
      this.alphasInformationPanel = this.getStyle("--alphas-information-panel", 0.75);
      this.coloursHighlightIndicator = this.getStyle("--colours-highlight-indicator", "#FFFFFF");
      this.coloursInformationHeading = this.getStyle("--colours-information-heading", "#FFFFFF");
      this.coloursInformationPanel = this.getStyle("--colours-information-panel", "#333333");
      this.coloursInformationSentences = this.getStyle("--colours-information-sentences", "#FFFFFF");
      this.fontsInformationHeadingFamily = this.getStyle("--fonts-information-heading-family", "Arial");
      this.fontsInformationHeadingSize = this.getStyle("--fonts-information-heading-size", 13);
      this.fontsInformationHeadingWeight = this.getStyle("--fonts-information-heading-weight", "normal");
      this.fontsInformationSentencesFamily = this.getStyle("--fonts-information-sentences-family", "Arial");
      this.fontsInformationSentencesSize = this.getStyle("--fonts-information-sentences-size", 13);
      this.fontsInformationSentencesWeight = this.getStyle("--fonts-information-sentences-weight", "normal");
      this.radiiDataHighlightIndicator = this.getStyle("--radii-data-highlight-indicator", 4);
      this.radiiHighlightIndicator = this.getStyle("--radii-highlight-indicator", 2);
      this.radiiInformationPanelBorder = this.getStyle("--radii-information-panel-border", 10);
      this.widthsDataHighlightIndicator = this.getStyle("--widths-data-highlight-indicator", 4);
      this.widthsHighlightIndicator = this.getStyle("--widths-highlight-indicator", 2);
    }
  }

  calculateLabelHeightMultiplier() {
    if (this.properties && this.properties.x_axis && this.properties.x_axis.markers) {
      const counts = Array(this.calculateAxisRangeX() + 1).fill(0);

      for (let i = 0; i < this.properties.x_axis.markers.length; i += 1) {
        const marker = this.properties.x_axis.markers[i];
        counts[marker[0]] += 1;
      }

      return 1 + Math.max(...counts) * 2;
    }

    return 1;
  }

  // TODO: test this with data sets covering different ranges
  calculateParameters() {
    this.axisMinX = 0;
    this.axisMaxX = this.data.x.length - 1;
    if (this.properties && this.properties.x_axis) {
      if (this.properties.x_axis.min) {
        this.axisMinX = this.properties.x_axis.min;
      }
      if (this.properties.x_axis.max) {
        this.axisMaxX = this.properties.x_axis.max;
      }
    }
    this.axisMinY = 0;
    this.axisMaxY = this.calculateAxisMaxY();
    if (this.properties && this.properties.y_axis) {
      if (this.properties.y_axis.min) {
        this.axisMinY = this.properties.y_axis.min;
      }
      if (this.properties.y_axis.max) {
        this.axisMaxY = this.properties.y_axis.max;
      }
    }
    this.axisRangeY = this.axisMaxY - this.axisMinY;

    if (this.data.u) {
      const axisMaxU = this.calculateAxisMaxU();
      this.graphScaleU = axisMaxU == 0
      ? 1
      : this.axisMaxY / axisMaxU;
    }

    let greatestRadius = 0;
    if (this.highLightEnabled) {
      const dataHighlightIndicatorRadius = parseFloat(this.radiiDataHighlightIndicator) / 2 + parseFloat(this.widthsDataHighlightIndicator);
      const highlightIndicatorRadius = parseFloat(this.radiiHighlightIndicator) / 2 + parseFloat(this.widthsHighlightIndicator);
      greatestRadius = Math.max(dataHighlightIndicatorRadius, highlightIndicatorRadius);
    }
    const greatestExtent = Math.max(parseFloat(this.widthsData) / 2, greatestRadius);

    this.bottomMargin = greatestExtent;
    this.graphStartY = greatestExtent;
    let maxLabelWidthX = 0;
    let maxLabelWidthY = 0;
    let maxLabelWidthU = 0;
    if (this.hideHorizontalAxis && this.hideVerticalAxes) {
      this.graphEndY = this.canvasHeight - this.bottomMargin;
      this.graphHeight = this.graphEndY - this.graphStartY;
    } else {
      this.backgroundContext.font = this.fontsAxesLabelsWeight + " " + this.fontsAxesLabelsSize + "px " + this.fontsAxesLabelsFamily;
      const labelHeightApproximation = this.backgroundContext.measureText("M").width;

      if (!this.hideHorizontalAxis) {
        this.bottomMargin = Math.max(labelHeightApproximation * 3, greatestExtent);
      }
      if (!this.hideVerticalAxes) {
        this.bottomMargin = Math.max(labelHeightApproximation, this.bottomMargin);
        this.graphStartY = Math.max(labelHeightApproximation * this.calculateLabelHeightMultiplier(), this.graphStartY);
      }

      this.graphEndY = this.canvasHeight - this.bottomMargin;
      this.graphHeight = this.graphEndY - this.graphStartY;

      if (!this.hideHorizontalAxis) {
        maxLabelWidthX = this.caclulateMaxLabelWidthX();
      }
      if (!this.hideVerticalAxes) {
        const maxLabelsY = Math.round(this.graphHeight / (labelHeightApproximation * 4));
        const factors = Helper.calculateFactors(this.axisMaxY);

        let factorIndex = 0;
        let workingInterval = factors[factorIndex];
        let proposedLabelsY = this.axisRangeY / workingInterval;

        while (proposedLabelsY > maxLabelsY) {
          factorIndex += 1;
          workingInterval = factors[factorIndex];
          proposedLabelsY = this.axisRangeY / workingInterval;
        }

        this.labelIntervalY = workingInterval;

        for (let i = this.axisMinY; i <= this.axisMaxY; i += this.labelIntervalY) {
          const labelComponentsY = this.getLabelComponentsY(i);
          const labelWidthY = this.backgroundContext.measureText(Helper.applyAffix(labelComponentsY.value, this.getLabelPrefixY(), labelComponentsY.suffix)).width;
          if (labelWidthY > maxLabelWidthY) {
            maxLabelWidthY = labelWidthY;
          }

          if (this.data.u) {
            const labelComponentsU = this.getLabelComponentsU(i / this.graphScaleU);
            const labelWidthU = this.backgroundContext.measureText(Helper.applyAffix(labelComponentsU.value, this.getLabelPrefixU(), labelComponentsU.suffix)).width;
            if (labelWidthU > maxLabelWidthU) {
              maxLabelWidthU = labelWidthU;
            }
          }
        }
      }
    }

    const minMargin = Math.max(maxLabelWidthX / 1.5, greatestExtent);
    this.leftMargin = Math.max(maxLabelWidthY + 2 * this.fontsAxesLabelsSize, minMargin);
    this.rightMargin = Math.max(maxLabelWidthU + 2 * this.fontsAxesLabelsSize, minMargin);
    this.graphStartX = this.leftMargin;
    this.graphEndX = this.canvasWidth - this.rightMargin;
    this.graphWidth = this.graphEndX - this.graphStartX;
    this.graphScaleX = this.calculateGraphScaleX();
    this.graphScaleY = this.graphHeight / this.axisRangeY;
  }

  transformDrawingArea() {
    this.backgroundContext.save();
    this.backgroundContext.transform(this.graphScaleX, 0, 0, this.graphScaleY, this.graphStartX, this.graphStartY);
    this.backgroundContext.transform(1, 0, 0, -1, 0, 0);
    this.backgroundContext.transform(1, 0, 0, 1, 0, -this.axisMaxY);
  }

  drawHorizontalLines() {
    this.backgroundContext.strokeStyle = this.coloursHorizontalLines;
    this.backgroundContext.lineWidth = 1;
    this.transformDrawingArea();

    this.backgroundContext.beginPath();

    const yAxisTotalIntervals = this.axisRangeY / this.labelIntervalY + 1;
    for (let i = 0; i < yAxisTotalIntervals; i += 1) {
      this.backgroundContext.moveTo(0, i * this.labelIntervalY);
      this.backgroundContext.lineTo(this.calculateAxisRangeX() + 1, i * this.labelIntervalY);
    }

    this.backgroundContext.restore();
    this.backgroundContext.stroke();
  }

  drawBarGraph(index) {
    const hasProjectedIndex = this.properties && this.properties.x_axis && this.properties.x_axis.projected_index;
    const projectedIndex = hasProjectedIndex
    ? this.properties.x_axis.projected_index
    : this.axisMaxX;
    const dataset = this.data.y[index];
    const datasetWidth = 1 / (this.data.y.length + 1);
    this.backgroundContext.fillStyle = this.getDataColour(index);
    this.transformDrawingArea();

    this.backgroundContext.beginPath();

    for (let i = 0; i <= projectedIndex; i += 1) {
      this.backgroundContext.fillRect(i + datasetWidth / 2 + index * datasetWidth, this.graphStartY, datasetWidth, dataset[this.axisMinX + i]);
    }

    this.backgroundContext.restore();
    this.backgroundContext.fill();

    this.backgroundContext.fillStyle = Helper.hex2rgba(this.getDataColour(index), 0.5);
    this.transformDrawingArea();

    this.backgroundContext.beginPath();

    for (let i = projectedIndex + 1; i <= this.axisMaxX; i += 1) {
      this.backgroundContext.fillRect(i + datasetWidth / 2 + index * datasetWidth, this.graphStartY, datasetWidth, dataset[this.axisMinX + i]);
    }

    this.backgroundContext.restore();
    this.backgroundContext.fill();
  }

  drawLineGraph(index, scale) {
    const dataset = this.data.u[index];
    const hasOffsetIndex = this.properties && this.properties.u_axis && this.properties.u_axis.offset_index;
    const offsetIndex = hasOffsetIndex
    ? this.properties.u_axis.offset_index
    : 0;
    this.backgroundContext.strokeStyle = this.getDataColour(this.data.y.length + index);
    this.backgroundContext.lineWidth = this.widthsData;
    this.transformDrawingArea();

    this.backgroundContext.beginPath();

    const axisRangeX = this.calculateAxisRangeX();
    if (axisRangeX > 0) {
      this.backgroundContext.moveTo(offsetIndex + 0.5, dataset[this.axisMinX] * scale);
    }
    const points = [];
    for (let i = 0; i <= axisRangeX; i += 1) {
      points.push(offsetIndex + i + 0.5);
      points.push(dataset[this.axisMinX + i] * scale);
    }
    Helper.drawLines("lines", this.backgroundContext, points, this.axisMaxY);

    this.backgroundContext.restore();
    this.backgroundContext.stroke();
  }

  caclulateMaxLabelWidthX() {
    let maxLabelWidthX = 0;
    for (let i = this.axisMinX; i <= this.axisMaxX; i += 1) {
      const labelValue = this.data.x[i];
      const labelText = this.axisFormatter
      ? this.axisFormatter(labelValue, 0)
      : labelValue;
      const labelWidth = this.backgroundContext.measureText(labelText).width;
      if (labelWidth > maxLabelWidthX) {
        maxLabelWidthX = labelWidth;
      }
    }
    return maxLabelWidthX;
  }

  calculateAxisInterval(axisLabelInterval) {
    const firstValue = this.data.x[this.axisMinX];
    const secondValue = this.data.x[this.axisMinX + axisLabelInterval];
    return secondValue - firstValue;
  }

  drawHorizontalAxisLabels() {
    let xAxisLabelInterval = 1;
    let availableWidthPerLabel = this.graphWidth / ((this.calculateAxisRangeX() + 1 + 1) / xAxisLabelInterval);
    const maxLabelWidthX = this.caclulateMaxLabelWidthX();
    while (availableWidthPerLabel / maxLabelWidthX < 3) {
      xAxisLabelInterval += 1;
      availableWidthPerLabel = this.graphWidth / ((this.calculateAxisRangeX() + 1 + 1) / xAxisLabelInterval);
    }

    this.backgroundContext.font = this.fontsAxesLabelsWeight + " " + this.fontsAxesLabelsSize + "px " + this.fontsAxesLabelsFamily;
    this.backgroundContext.fillStyle = this.coloursAxesLabels;
    this.backgroundContext.textAlign = "center";
    this.backgroundContext.textBaseline = "middle";

    for (let i = 0; i <= this.calculateAxisRangeX(); i += xAxisLabelInterval) {
      let xValue = this.data.x[this.axisMinX + i];
      let xText = xValue;
      if (this.axisFormatter) {
        xValue = isNaN(xValue)
        ? 0
        : xValue;
        xText = this.axisFormatter(xValue, this.calculateAxisInterval(xAxisLabelInterval));
      }
      this.backgroundContext.fillText(xText, this.graphStartX + (i + 0.5) * this.graphScaleX, this.graphEndY + this.bottomMargin / 2);
    }
  }

  drawMarkers() {
    const counts = Array(this.calculateAxisRangeX() + 1).fill(0);

    for (let i = 0; i < this.properties.x_axis.markers.length; i += 1) {
      const marker = this.properties.x_axis.markers[i];
      const line = counts[marker[0]];

      const axisPosition = {
        "x": this.graphStartX + (marker[0] + 0.5) * this.graphScaleX,
        "y": this.graphEndY
      };

      this.backgroundContext.strokeStyle = this.coloursMarker;
      this.backgroundContext.lineWidth = this.widthsMarker;
      this.backgroundContext.beginPath();
      this.backgroundContext.moveTo(axisPosition.x, axisPosition.y);
      this.backgroundContext.lineTo(axisPosition.x, this.graphStartY);
      this.backgroundContext.stroke();

      this.backgroundContext.font = this.fontsAxesLabelsWeight + " " + this.fontsAxesLabelsSize + "px " + this.fontsAxesLabelsFamily;
      this.backgroundContext.fillStyle = this.coloursAxesLabels;
      this.backgroundContext.textAlign = "center";
      this.backgroundContext.textBaseline = "middle";

      const labelHeightApproximation = this.backgroundContext.measureText("M").width;
      this.backgroundContext.fillText(marker[1], this.graphStartX + (marker[0] + 0.5) * this.graphScaleX, labelHeightApproximation * (1.5 + line * 2));

      counts[marker[0]] += 1;
    }
  }

  drawVerticalAxesLabels() {
    this.backgroundContext.font = this.fontsAxesLabelsWeight + " " + this.fontsAxesLabelsSize + "px " + this.fontsAxesLabelsFamily;
    this.backgroundContext.fillStyle = this.coloursAxesLabels;
    this.backgroundContext.textAlign = "center";
    this.backgroundContext.textBaseline = "middle";

    const labelValueIndexMap = new Map();
    const indexLabelMap = new Map();

    if (this.data.u) {
      for (let i = this.axisMinY; i <= this.axisMaxY; i += this.labelIntervalY) {
        let valueU = i / this.graphScaleU;
        valueU = isNaN(valueU)
        ? 0
        : valueU;
        const labelValueU = Number(valueU.toFixed(this.getDecimalPlacesU()));

        if (!labelValueIndexMap.has(labelValueU)) {
          labelValueIndexMap.set(labelValueU, []);
        }
        labelValueIndexMap.get(labelValueU).push({
          "index": i,
          "value": Math.abs(labelValueU - valueU)
        });
      }

      for (const key of labelValueIndexMap.keys()) {
        const array = labelValueIndexMap.get(key);

        array.sort((a, b) => a.value - b.value);

        indexLabelMap.set(array[0].index, key);
      }
    }

    for (let i = this.axisMinY; i <= this.axisMaxY; i += this.labelIntervalY) {
      const labelComponentsY = this.getLabelComponentsY(i);
      this.backgroundContext.fillText(Helper.applyAffix(labelComponentsY.value, this.getLabelPrefixY(), labelComponentsY.suffix), this.leftMargin / 2, this.graphEndY - (i - this.axisMinY) * this.graphScaleY);

      if (this.data.u) {
        if (indexLabelMap.has(i)) {
          const labelComponentsU = this.getLabelComponentsU(indexLabelMap.get(i));
          this.backgroundContext.fillText(Helper.applyAffix(labelComponentsU.value, this.getLabelPrefixU(), labelComponentsU.suffix), this.graphEndX + this.rightMargin / 2, this.graphEndY - (i - this.axisMinY) * this.graphScaleY);
        }
      }
    }
  }

  drawHighlight(axisHighlight, yValueMax, dataHighlights) {
    this.foregroundContext.strokeStyle = this.coloursHighlightIndicator;
    this.foregroundContext.lineWidth = this.widthsHighlightIndicator;
    this.foregroundContext.beginPath();
    this.foregroundContext.moveTo(axisHighlight.x, axisHighlight.y);
    this.foregroundContext.lineTo(axisHighlight.x, yValueMax);
    this.foregroundContext.stroke();

    this.foregroundContext.strokeStyle = this.coloursDataAxis;
    this.foregroundContext.lineWidth = this.widthsHighlightIndicator;
    this.foregroundContext.fillStyle = this.coloursHighlightIndicator;

    this.foregroundContext.beginPath();
    this.foregroundContext.arc(axisHighlight.x, axisHighlight.y, this.radiiHighlightIndicator, 0, 2 * Math.PI);
    this.foregroundContext.closePath();
    this.foregroundContext.stroke();
    this.foregroundContext.fill();

    for (let i = 0; i < dataHighlights.length; i += 1) {
      this.foregroundContext.strokeStyle = this.getDataColour(i);
      this.foregroundContext.lineWidth = this.widthsDataHighlightIndicator;
      this.foregroundContext.fillStyle = this.coloursHighlightIndicator;

      this.foregroundContext.beginPath();
      this.foregroundContext.arc(dataHighlights[i].x, dataHighlights[i].y, this.radiiDataHighlightIndicator, 0, 2 * Math.PI);
      this.foregroundContext.closePath();
      this.foregroundContext.stroke();
      this.foregroundContext.fill();
    }
  }

  // TODO: consider moving the calculation code in highlight(index) and reserve this method for actual drawing
  drawInformationPanel(index) {
    let verticalData = this.data.y;
    if (this.data.u) {
      verticalData = verticalData.concat(this.data.u);
    }

    this.foregroundContext.textAlign = "left";
    this.foregroundContext.font = this.fontsInformationHeadingWeight + " " + this.fontsInformationHeadingSize + "px " + this.fontsInformationHeadingFamily;

    let headingValue = this.data.x[this.axisMinX + index];
    let headingText = headingValue;
    if (this.informationFormatter) {
      headingValue = isNaN(headingValue)
      ? 0
      : headingValue;
      headingText = this.informationFormatter(headingValue);
    }
    const sentences = [];
    const sentenceHeightApproximation = this.foregroundContext.measureText("M").width;
    let maxSentenceWidth = this.foregroundContext.measureText(headingText).width + 2 * sentenceHeightApproximation;
    this.foregroundContext.font = this.fontsInformationSentencesWeight + " " + this.fontsInformationSentencesSize + "px " + this.fontsInformationSentencesFamily;
    for (let i = 0; i < this.data.y.length; i += 1) {
      let yValue = this.data.y[i][this.axisMinX + index];
      yValue = isNaN(yValue)
      ? 0
      : yValue;
      const labelComponents = this.getLabelComponentsY(yValue);
      const formattedData = Helper.applyAffix(labelComponents.value, this.getLabelPrefixY(), labelComponents.suffix);
      const sentence = this.dataNames[i] + ": " + formattedData;
      // Space + Circle + Space + Sentence + Space (space and cricle are as wide as a sentence is tall)
      const sentenceWidth = this.foregroundContext.measureText(sentence).width + 4 * sentenceHeightApproximation;
      if (sentenceWidth > maxSentenceWidth) {
        maxSentenceWidth = sentenceWidth;
      }
      sentences.push(sentence);
    }

    if (this.data.u) {
      const hasOffsetIndex = this.properties && this.properties.u_axis && this.properties.u_axis.offset_index;
      const offsetIndex = hasOffsetIndex
      ? this.properties.u_axis.offset_index
      : 0;
      for (let i = 0; i < this.data.u.length; i += 1) {
        let uValue = this.data.u[i][this.axisMinX + index - offsetIndex];
        uValue = isNaN(uValue)
        ? 0
        : uValue;
        const labelComponents = this.getLabelComponentsU(uValue);
        const formattedData = Helper.applyAffix(labelComponents.value, this.getLabelPrefixU(), labelComponents.suffix);
        const sentence = this.dataNames[this.data.y.length + i] + ": " + formattedData;
        // Space + Circle + Space + Sentence + Space (space and cricle are as wide as a sentence is tall)
        const sentenceWidth = this.foregroundContext.measureText(sentence).width + 4 * sentenceHeightApproximation;
        if (sentenceWidth > maxSentenceWidth) {
          maxSentenceWidth = sentenceWidth;
        }
        sentences.push(sentence);
      }
    }

    const requiredWidth = maxSentenceWidth;
    // Space + Sentence + Space + Sentence + Space + ... + Sentence + Space
    const requiredHeight = ((verticalData.length + 1) * 2 + 1) * sentenceHeightApproximation;
    let panelX = this.graphStartX + (index + 0.5) * this.graphScaleX + 2 * sentenceHeightApproximation;
    const panelY = this.graphStartY + this.graphHeight / 2 - requiredHeight / 2;

    if (panelX + requiredWidth > this.graphStartX + this.graphWidth) {
      panelX = this.graphStartX + (index + 0.5) * this.graphScaleX - 2 * sentenceHeightApproximation - requiredWidth;
      if (panelX < this.graphStartX) {
        console.log("Information panel may be clipped horizontally!");
      }
    }

    if (requiredHeight > this.graphHeight) {
      console.log("Information panel may be clipped vertically!");
    }

    this.foregroundContext.fillStyle = Helper.hex2rgba(this.coloursInformationPanel, this.alphasInformationPanel);
    Helper.fillRoundedRect(this.foregroundContext, panelX, panelY, requiredWidth, requiredHeight, parseFloat(this.radiiInformationPanelBorder));

    let circleOffsetY = panelY + 3 * sentenceHeightApproximation;
    let sentenceOffsetY = panelY + 2 * sentenceHeightApproximation;

    this.foregroundContext.font = this.fontsInformationHeadingWeight + " " + this.fontsInformationHeadingSize + "px " + this.fontsInformationHeadingFamily;
    this.foregroundContext.fillStyle = this.coloursInformationHeading;
    this.foregroundContext.fillText(headingText, panelX + sentenceHeightApproximation, sentenceOffsetY);
    sentenceOffsetY += 2 * sentenceHeightApproximation;

    this.foregroundContext.font = this.fontsInformationSentencesWeight + " " + this.fontsInformationSentencesSize + "px " + this.fontsInformationSentencesFamily;
    for (let i = 0; i < sentences.length; i += 1) {
      this.foregroundContext.fillStyle = this.getDataColour(i);
      this.foregroundContext.fillRect(panelX + sentenceHeightApproximation, circleOffsetY, sentenceHeightApproximation, sentenceHeightApproximation);
      this.foregroundContext.fillStyle = this.coloursInformationSentences;
      this.foregroundContext.fillText(sentences[i], panelX + 3 * sentenceHeightApproximation, sentenceOffsetY);
      circleOffsetY += 2 * sentenceHeightApproximation;
      sentenceOffsetY += 2 * sentenceHeightApproximation;
    }
  }

  highlight(index) {
    this.clearForeground();
    if (index == -1) {
      return;
    }

    const axisHighlight = {
      "x": this.graphStartX + (0.5 + index) * this.graphScaleX,
      "y": this.graphEndY
    };
    const dataHighlights = [];

    let verticalValueMax = Infinity;
    for (let i = 0; i < this.data.y.length; i += 1) {
      const y = this.data.y[i][this.axisMinX + index];
      const yValue = this.graphStartY + -(y - this.axisMaxY) * this.graphScaleY;
      dataHighlights.push({
        "x": this.graphStartX + (0.5 + index) * this.graphScaleX,
        "y": yValue
      });
      if (yValue < verticalValueMax) {
        verticalValueMax = yValue;
      }
    }

    if (this.data.u) {
      const hasOffsetIndex = this.properties && this.properties.u_axis && this.properties.u_axis.offset_index;
      const offsetIndex = hasOffsetIndex
      ? this.properties.u_axis.offset_index
      : 0;
      for (let i = 0; i < this.data.u.length; i += 1) {
        const u = this.data.u[i][this.axisMinX + index - offsetIndex];
        const uValue = this.graphStartY + -(u * this.graphScaleU - this.axisMaxY) * this.graphScaleY;
        dataHighlights.push({
          "x": this.graphStartX + (0.5 + index) * this.graphScaleX,
          "y": uValue
        });
        if (uValue < verticalValueMax) {
          verticalValueMax = uValue;
        }
      }
    }

    this.drawHighlight(axisHighlight, verticalValueMax, dataHighlights);
    this.drawInformationPanel(index);
    this.mouseMoveIndex = index;
  }

  clearForeground() {
    this.foregroundContext.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
  }

  calculateIndex(offsetX) {
    const graphX = (offsetX - this.graphStartX) / this.graphScaleX;
    return Math.min(Math.max(Math.floor(graphX), 0), this.calculateAxisRangeX());
  }

  handleMouseMove(event) {
    if (!this.drawn) {
      return;
    }

    const index = this.calculateIndex(event.offsetX);
    if (this.highLightEnabled) {
      if (index != this.mouseMoveIndex) {
        this.highlight(index);
      }
    }
  }

  cancelMouseMove() {
    this.mouseMoveIndex = -1;
  }

  handleMouseLeave(event) {
    if (!this.drawn) {
      return;
    }

    this.clearForeground();
    this.cancelMouseMove();
  }

  // TODO: refactor this method
  drawLineOfBestFit(index) {
    const hasProjectedIndex = this.properties && this.properties.x_axis && this.properties.x_axis.projected_index;
    const projectedIndex = hasProjectedIndex
    ? this.properties.x_axis.projected_index
    : this.axisMaxX;
    const dataset = this.data.y[index];
    const datasetWidth = 1 / (this.data.y.length + 1);

    const parameters = Helper.calculateLineOfBestFit(Array.from(Array(this.data.x.length).keys()), dataset);

    this.backgroundContext.strokeStyle = this.getBestFitColour(index);
    this.backgroundContext.lineWidth = this.widthsBestFit;
    this.transformDrawingArea();

    this.backgroundContext.beginPath();

    this.backgroundContext.moveTo(datasetWidth + datasetWidth * index, Helper.getPointOnLine(this.axisMinX, parameters.slope, parameters.intercept));
    this.backgroundContext.lineTo(datasetWidth + projectedIndex + datasetWidth * index, Helper.getPointOnLine(projectedIndex, parameters.slope, parameters.intercept));

    this.backgroundContext.restore();
    this.backgroundContext.stroke();

    this.backgroundContext.setLineDash([
      5,
      5
    ]);
    this.transformDrawingArea();

    this.backgroundContext.moveTo(datasetWidth + projectedIndex + datasetWidth * index, Helper.getPointOnLine(projectedIndex, parameters.slope, parameters.intercept));
    this.backgroundContext.lineTo(datasetWidth + this.axisMaxX + datasetWidth * index, Helper.getPointOnLine(this.axisMaxX, parameters.slope, parameters.intercept));

    this.backgroundContext.restore();
    this.backgroundContext.stroke();
    this.backgroundContext.setLineDash([]);
  }
}
