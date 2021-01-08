class GrapheneBargraph {
  constructor(element, properties, data, axisFormatter, informationFormatter) {
      if (typeof module !== "undefined") {
          const GrapheneHelper = require('./helper');
          this.grapheneHelper = new GrapheneHelper();
      } else {
          this.grapheneHelper = new GrapheneHelper();
      }
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
  }

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

  // TODO: do some refactoring
  // TODO: investigate "Save Image As..." in browsers, it currently, understandably, saves only the foreground layer

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
      this.backgroundContext.fillStyle = this.grapheneHelper.hex2rgba(this.coloursBackground, this.alphasBackground);
      this.backgroundContext.fillRect(0, 0, this.canvasWidth, this.canvasHeight);

      if (!this.hideVerticalAxes) {
          this.drawHorizontalLines();
      }
      for (var i = 0; i < this.data.y.length; i++) {
          this.drawGraph(i);
      }
      if (!this.hideHorizontalAxis) {
          this.drawHorizontalAxisLabels();
      }
      if (!this.hideVerticalAxes) {
          this.drawVerticalAxesLabels();
      }
      if (this.drawLinesOfBestFit) {
          for (var i = 0; i < this.data.y.length; i++) {
            this.drawLineOfBestFit(i);
          }
      }
      if (this.properties.x_axis.markers) {
        this.drawMarkers();
      }
  }

  getLabelPrefixY() {
      if (this.properties && this.properties.y_axis && this.properties.y_axis.label_prefix) {
          return this.properties.y_axis.label_prefix;
      }
      return "";
  }

  getLabelComponents(value, labelSuffixArray) {
      if (labelSuffixArray.length == 1) {
          return { "value": value, "suffix": labelSuffixArray[0][1] };
      }

      var lastLimit = 1;
      var lastButOneLimit = 1;
      var lastSuffix = "";
      for (var i = 0; i < labelSuffixArray.length; i++) {
          var limit = labelSuffixArray[i][0];
          var suffix = labelSuffixArray[i][1];
          if (value < limit) {
              return { "value": value / (lastLimit), "suffix": suffix };
          }
          lastButOneLimit = lastLimit;
          lastLimit = limit;
          lastSuffix = suffix;
      }

      return { "value": value / (lastLimit / lastButOneLimit), "suffix": lastSuffix };
  }

  getLabelComponentsY(value) {
      if (!this.properties || !this.properties.y_axis || !this.properties.y_axis.label_suffix) {
          return { "value": value, "suffix": "" };
      }

      return this.getLabelComponents(value, this.properties.y_axis.label_suffix);
  }

  calculateAxisRangeX() {
      return this.axisMaxX - this.axisMinX;
  }

  calculateGraphScaleX() {
      return this.graphWidth / (this.calculateAxisRangeX() + 1);
  }

  getMaxValueY() {
      var maxY = 0;
      for (var i = 0; i < this.data.y.length; i++) {
          for (var j = 0; j < this.data.y[i].length; j++) {
              var y = this.data.y[i][j];
              if (y > maxY) { maxY = y; }
          }
      }
      return maxY != 0 ? maxY : 1;
  }

  calculateAxisMax(base, max) {
      var floorPowerOfBase = this.grapheneHelper.calculateFloorPowerOfBase(base, max);
      var floorPowerOfBaseOverBase = floorPowerOfBase / base;

      var candidateMax = floorPowerOfBase;
      while (max > candidateMax) {
          candidateMax += floorPowerOfBase;
      }

      // in an effort to keep the graph aesthetically pleasing, limit potential blank space at the top to 20%
      if (max / candidateMax < 0.8) {
          candidateMax = floorPowerOfBase;
          while (max > candidateMax) {
              candidateMax += floorPowerOfBaseOverBase;
          }
      }

      return candidateMax;
  }

  calculateAxisMaxY() {
      var base = 10;
      if (this.properties && this.properties.y_axis && this.properties.y_axis.base) {
          base = this.properties.y_axis.base;
      }

      return this.calculateAxisMax(base, this.getMaxValueY());
  }

  // TODO: check if any existing callers need to set this optional parameter
  getStyle(name, defaultStyle, logToConsole = true) {
      var style = getComputedStyle(this.element).getPropertyValue(name);
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
              this.hideHorizontalAxis = this.properties.flags.hide_horizontal_axis ? true : false;
              this.hideVerticalAxes = this.properties.flags.hide_vertical_axes ? true : false;
              this.drawLinesOfBestFit = this.properties.flags.draw_lines_of_best_fit ? true : false;
          }
      } else {
          this.hideHorizontalAxis = false;
          this.hideVerticalAxes = false;
          this.drawLinesOfBestFit = false;
      }

      this.dataNames = this.data.names;

      var verticalData = this.data.y;

      this.defaultDataColour = '#999999';
      this.defaultBestFitColour = '#000000';

      this.alphasBackground = this.getStyle('--alphas-background', 1);
      this.coloursBackground = this.getStyle('--colours-background', '#FFFFFF');
      this.coloursDataAxis = this.getStyle('--colours-data-axis', '#E0DEFF');
      this.coloursData = new Array();
      // TODO: alter this to continue looking until it can't find a contiguous number, for datasets that are not present at the start
      for (var i = 0; i < verticalData.length; i++) {
          var colour = this.getStyle('--colours-data-' + i, false);
          if (colour && colour != false) { this.coloursData.push(colour); }
      }

      if (this.drawLinesOfBestFit) {
        this.coloursBestFit = new Array();
        // TODO: alter this to continue looking until it can't find a contiguous number, for datasets that are not present at the start
        for (var i = 0; i < verticalData.length; i++) {
            var colour = this.getStyle('--colours-best-fit-' + i, false);
            if (colour && colour != false) { this.coloursBestFit.push(colour); }
        }
        this.widthsBestFit = this.getStyle('--widths-best-fit', 4);
      }

      if (!this.hideHorizontalAxis || !this.hideVerticalAxes) {
          this.coloursAxesLabels = this.getStyle('--colours-axes-labels', '#555555');
          this.coloursHorizontalLines = this.getStyle('--colours-horizontal-lines', '#EEEEEE');
          this.fontsAxesLabelsSize = this.getStyle('--fonts-axes-labels-size', 0);
          this.fontsAxesLabelsFamily = this.getStyle('--fonts-axes-labels-family', 'Arial');
          this.fontsAxesLabelsWeight = this.getStyle('--fonts-axes-labels-weight', 'normal');
      }

      if (this.properties.x_axis.markers) {
          this.coloursMarker = this.getStyle('--colours-marker', '#000000');
          this.widthsMarker = this.getStyle('--widths-marker', 2);
      }
  }

  // TODO: test this with data sets covering different ranges
  calculateParameters() {
      this.axisMinX = 0;
      this.axisMaxX = this.data.x.length - 1;
      if (this.properties && this.properties.x_axis) {
          if (this.properties.x_axis.min) { this.axisMinX = this.properties.x_axis.min; }
          if (this.properties.x_axis.max) { this.axisMaxX = this.properties.x_axis.max; }
      }
      this.axisMinY = 0;
      this.axisMaxY = this.calculateAxisMaxY();
      if (this.properties && this.properties.y_axis) {
          if (this.properties.y_axis.min) { this.axisMinY = this.properties.y_axis.min; }
          if (this.properties.y_axis.max) { this.axisMaxY = this.properties.y_axis.max; }
      }
      this.axisRangeY = this.axisMaxY - this.axisMinY;

      var greatestRadius = 0;
      var greatestExtent = Math.max(parseFloat(1) / 2, greatestRadius);

      this.bottomMargin = greatestExtent;
      this.graphStartY = greatestExtent;
      var maxLabelWidthX = 0;
      var maxLabelWidthY = 0;
      var maxLabelWidthU = 0;
      if (this.hideHorizontalAxis && this.hideVerticalAxes) {
          this.graphEndY = this.canvasHeight - this.bottomMargin;
          this.graphHeight = this.graphEndY - this.graphStartY;
      } else {
          this.backgroundContext.font = this.fontsAxesLabelsWeight + " " + this.fontsAxesLabelsSize + "px " + this.fontsAxesLabelsFamily;
          var labelHeightApproximation = this.backgroundContext.measureText("M").width;

          if (!this.hideHorizontalAxis) {
              this.bottomMargin = Math.max(labelHeightApproximation * 3, greatestExtent);
          }
          if (!this.hideVerticalAxes) {
              this.bottomMargin = Math.max(labelHeightApproximation, this.bottomMargin);
              var labelHeightMultiplier = this.properties.x_axis.markers ? 3 : 1;
              this.graphStartY = Math.max(labelHeightApproximation * labelHeightMultiplier, this.graphStartY);
          }

          this.graphEndY = this.canvasHeight - this.bottomMargin;
          this.graphHeight = this.graphEndY - this.graphStartY;

          if (!this.hideHorizontalAxis) {
              maxLabelWidthX = this.caclulateMaxLabelWidthX();
          }
          if (!this.hideVerticalAxes) {
              var maxLabelsY = Math.round(this.graphHeight / (labelHeightApproximation * 4));
              var factors = this.grapheneHelper.calculateFactors(this.axisMaxY);

              var factorIndex = 0;
              var workingInterval = factors[factorIndex];
              var proposedLabelsY = this.axisRangeY / workingInterval;

              while (proposedLabelsY > maxLabelsY) {
                  factorIndex++;
                  workingInterval = factors[factorIndex];
                  proposedLabelsY = this.axisRangeY / workingInterval;
              }

              this.labelIntervalY = workingInterval;

              for (var i = this.axisMinY; i <= this.axisMaxY; i += this.labelIntervalY) {
                  var labelComponentsY = this.getLabelComponentsY(i);
                  var labelWidthY = this.backgroundContext.measureText(this.grapheneHelper.applyAffix(labelComponentsY.value, this.getLabelPrefixY(), labelComponentsY.suffix)).width;
                  if (labelWidthY > maxLabelWidthY) {
                      maxLabelWidthY = labelWidthY;
                  }
              }
          }
      }

      var minMargin = Math.max(maxLabelWidthX / 1.5, greatestExtent);
      this.leftMargin = Math.max(maxLabelWidthY + (2 * this.fontsAxesLabelsSize), minMargin);
      this.rightMargin = Math.max(maxLabelWidthU + (2 * this.fontsAxesLabelsSize), minMargin);
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

      var yAxisTotalIntervals = (this.axisRangeY / this.labelIntervalY) + 1;
      for (var i = 0; i < yAxisTotalIntervals; i++) {
          this.backgroundContext.moveTo(0, i * this.labelIntervalY);
          this.backgroundContext.lineTo(this.calculateAxisRangeX() + 1, i * this.labelIntervalY);
      }

      this.backgroundContext.restore();
      this.backgroundContext.stroke();
  }

  drawGraph(index) {
      var dataset = this.data.y[index];
      var datasetWidth = 1 / (this.data.y.length + 1);
      this.backgroundContext.fillStyle = this.getDataColour(index);
      this.transformDrawingArea();

      this.backgroundContext.beginPath();

      var axisRangeX = this.calculateAxisRangeX();
      if (axisRangeX > 0) { this.backgroundContext.moveTo(0.5, dataset[this.axisMinX]); }
      for (var i = 0; i <= axisRangeX; i++) {
          this.backgroundContext.fillRect((i + (datasetWidth / 2)) + (index * datasetWidth), this.graphStartY, datasetWidth, dataset[this.axisMinX + i]);
      }

      this.backgroundContext.restore();
      this.backgroundContext.fill();
  }

  caclulateMaxLabelWidthX() {
      var maxLabelWidthX = 0;
      for (var i = this.axisMinX; i <= this.axisMaxX; i++) {
          var labelValue = this.data.x[i];
          var labelText = this.axisFormatter ? this.axisFormatter(labelValue, 0) : labelValue;
          var labelWidth = this.backgroundContext.measureText(labelText).width;
          if (labelWidth > maxLabelWidthX) {
              maxLabelWidthX = labelWidth;
          }
      }
      return maxLabelWidthX;
  }

  calculateAxisInterval(axisLabelInterval) {
      var firstValue = this.data.x[this.axisMinX];
      var secondValue = this.data.x[this.axisMinX + axisLabelInterval];
      return secondValue - firstValue;
  }

  drawHorizontalAxisLabels() {
      var xAxisLabelInterval = 1;
      var availableWidthPerLabel = this.graphWidth / ((this.calculateAxisRangeX() + 1 + 1) / xAxisLabelInterval);
      var maxLabelWidthX = this.caclulateMaxLabelWidthX();
      while ((availableWidthPerLabel / maxLabelWidthX) < 3) {
          xAxisLabelInterval++;
          availableWidthPerLabel = this.graphWidth / ((this.calculateAxisRangeX() + 1 + 1) / xAxisLabelInterval);
      }

      this.backgroundContext.font = this.fontsAxesLabelsWeight + " " + this.fontsAxesLabelsSize + "px " + this.fontsAxesLabelsFamily;
      this.backgroundContext.fillStyle = this.coloursAxesLabels;
      this.backgroundContext.textAlign = "center";
      this.backgroundContext.textBaseline = "middle";

      for (var i = 0; i <= this.calculateAxisRangeX(); i += xAxisLabelInterval) {
          var xValue = this.data.x[this.axisMinX + i];
          var xText = xValue;
          if (this.axisFormatter) {
              xValue = isNaN(xValue) ? 0 : xValue;
              xText = this.axisFormatter(xValue, this.calculateAxisInterval(xAxisLabelInterval));
          }
          this.backgroundContext.fillText(xText, this.graphStartX + ((i + 0.5) * this.graphScaleX), this.graphEndY + (this.bottomMargin / 2));
      }
  }

  drawMarkers() {
      for (var i = 0; i < this.properties.x_axis.markers.length; i++) {
          var marker = this.properties.x_axis.markers[i];

          var axisPosition = { x: this.graphStartX + ((marker[0] + 0.5) * this.graphScaleX), y: this.graphEndY };

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

          this.backgroundContext.fillText(marker[1], this.graphStartX + ((marker[0] + 0.5) * this.graphScaleX), this.graphStartY / 2);
      }
  }

  drawVerticalAxesLabels() {
      this.backgroundContext.font = this.fontsAxesLabelsWeight + " " + this.fontsAxesLabelsSize + "px " + this.fontsAxesLabelsFamily;
      this.backgroundContext.fillStyle = this.coloursAxesLabels;
      this.backgroundContext.textAlign = "center";
      this.backgroundContext.textBaseline = "middle";

      for (var i = this.axisMinY; i <= this.axisMaxY; i += this.labelIntervalY) {
          var labelComponentsY = this.getLabelComponentsY(i);
          this.backgroundContext.fillText(this.grapheneHelper.applyAffix(labelComponentsY.value, this.getLabelPrefixY(), labelComponentsY.suffix), (this.leftMargin / 2), this.graphEndY - ((i - this.axisMinY) * this.graphScaleY));
      }
  }

  // TODO: refactor this method
  drawLineOfBestFit(index) {
    var projectedIndex = this.properties.x_axis.projected_index ? this.properties.x_axis.projected_index : this.axisMaxX;
    var dataset = this.data.y[index];

    var parameters = this.grapheneHelper.calculateLineOfBestFit(Array.from(Array(this.data.x.length).keys()), dataset);

    this.backgroundContext.strokeStyle = this.getBestFitColour(index);
    this.backgroundContext.lineWidth = this.widthsBestFit;
    this.transformDrawingArea();

    this.backgroundContext.beginPath();

    this.backgroundContext.moveTo(0, this.grapheneHelper.getPointOnLine(this.axisMinX, parameters.slope, parameters.intercept));
    this.backgroundContext.lineTo(projectedIndex + 1, this.grapheneHelper.getPointOnLine(projectedIndex, parameters.slope, parameters.intercept));

    this.backgroundContext.restore();
    this.backgroundContext.stroke();

    this.backgroundContext.setLineDash([5, 5]);
    this.transformDrawingArea();

    this.backgroundContext.moveTo(projectedIndex + 1, this.grapheneHelper.getPointOnLine(projectedIndex, parameters.slope, parameters.intercept));
    this.backgroundContext.lineTo(this.calculateAxisRangeX() + 1, this.grapheneHelper.getPointOnLine(this.axisMaxX, parameters.slope, parameters.intercept));

    this.backgroundContext.restore();
    this.backgroundContext.stroke();
    this.backgroundContext.setLineDash([]);
  }
}

if (typeof module !== "undefined") {
  module.exports = GrapheneBargraph;
}
