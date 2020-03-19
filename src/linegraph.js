class Linegraph extends Graph {
  constructor(backgroundId, foregroundId, properties, data) {
      super(backgroundId, foregroundId, properties, data);

      this.currentHighlight = -1;
      if (this.properties.highlight.enabled) {
          // TODO: move this to a point after the JSON has been loaded (and possibly calculateParameters has been called at least once)
          this.foreground.addEventListener('mousemove', this.handleMouseMove.bind(this), false);
      }
  }

  // TODO: add the concept of a viewport to facilitate scrolling of data in the x-axis

  draw() {
      this.calculateParameters();

      this.backgroundContext.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
      this.backgroundContext.fillStyle = this.properties.colours.background;
      this.backgroundContext.fillRect(0, 0, this.canvasWidth, this.canvasHeight);

      this.drawHorizontalLines();
      for (var i = 0; i < this.data.y.length; i++) {
          this.drawAreaUnderGraph(this.data.y[i], this.properties.colours.graph[i]);
          this.drawGraph(this.data.y[i], this.properties.colours.graph[i]);
      }
      this.drawAxisLabels();
  }

  calculateParameters() {
      this.backgroundContext.font = this.properties.axes_labels.font_size + "px " + this.properties.axes_labels.font_family;

      var maxLabelWidthX = this.caclulateMaxLabelWidthX();
      var maxLabelWidthY = 0;
      for (var i = this.properties.y_axis.min + this.properties.y_axis.label_interval; i < this.properties.y_axis.max; i += this.properties.y_axis.label_interval) {
          var labelWidth = this.backgroundContext.measureText(Helper.applyAffix(i, this.properties.y_axis.label_prefix, this.properties.y_axis.label_suffix)).width;
          if (labelWidth > maxLabelWidthY) {
              maxLabelWidthY = labelWidth;
          }
      }
      var labelHeightApproximation = this.backgroundContext.measureText("M").width;

      this.leftMargin = maxLabelWidthY * 1.5;
      var rightMargin = maxLabelWidthX / 2;
      var topMargin = labelHeightApproximation / 2;
      this.bottomMargin = labelHeightApproximation * 3;
      this.graphStartX = this.leftMargin;
      this.graphStartY = topMargin;
      var graphEndX = this.canvasWidth - rightMargin;
      this.graphEndY = this.canvasHeight - this.bottomMargin;
      this.graphWidth = graphEndX - this.graphStartX;
      var graphHeight = this.graphEndY - this.graphStartY;
      this.graphScaleX = this.graphWidth / this.properties.x_axis.range;
      var yAxisRange = this.properties.y_axis.max - this.properties.y_axis.min;
      this.graphScaleY = graphHeight / yAxisRange;
  }

  drawHorizontalLines() {
      this.backgroundContext.strokeStyle = this.properties.colours.horizontal_lines;
      this.backgroundContext.lineWidth = 1;
      this.backgroundContext.save();
      this.backgroundContext.transform(this.graphScaleX, 0, 0, this.graphScaleY, this.graphStartX, this.graphStartY);

      var yAxisRange = this.properties.y_axis.max - this.properties.y_axis.min;
      var yAxisTotalIntervals = (yAxisRange / this.properties.y_axis.label_interval) + 1;
      // skip drawing the first and last lines
      for (var i = 1; i < yAxisTotalIntervals - 1; i++) {
          this.backgroundContext.moveTo(0, i * this.properties.y_axis.label_interval);
          this.backgroundContext.lineTo(this.properties.x_axis.range, i * this.properties.y_axis.label_interval);
      }

      this.backgroundContext.restore();
      this.backgroundContext.stroke();
  }

  drawAreaUnderGraph(dataset, colour) {
      this.backgroundContext.fillStyle = Helper.hex2rgba(colour, this.properties.alphas.under_graph);
      this.backgroundContext.save();

      this.backgroundContext.transform(this.graphScaleX, 0, 0, this.graphScaleY, this.graphStartX, this.graphStartY);
      this.backgroundContext.transform(1, 0, 0, -1, 0, 0);
      this.backgroundContext.transform(1, 0, 0, 1, 0, -this.properties.y_axis.max);

      this.backgroundContext.beginPath();

      this.backgroundContext.moveTo(0, this.properties.y_axis.min);

      for (var i = 0; i < dataset.length; i++) {
          this.backgroundContext.lineTo(i, dataset[i]);
      }

      this.backgroundContext.lineTo(this.properties.x_axis.range, this.properties.y_axis.min);

      this.backgroundContext.restore();
      this.backgroundContext.fill();
  }

  drawGraph(dataset, colour) {
      this.backgroundContext.strokeStyle = colour;
      this.backgroundContext.lineWidth = this.properties.graph_settings.line_width;
      this.backgroundContext.save();

      this.backgroundContext.transform(this.graphScaleX, 0, 0, this.graphScaleY, this.graphStartX, this.graphStartY);
      this.backgroundContext.transform(1, 0, 0, -1, 0, 0);
      this.backgroundContext.transform(1, 0, 0, 1, 0, -this.properties.y_axis.max);

      this.backgroundContext.beginPath();

      for (var i = 0; i < dataset.length; i++) {
          if (i == 0) {
              this.backgroundContext.moveTo(i, dataset[i]);
          } else {
              this.backgroundContext.lineTo(i, dataset[i])
          }
      }

      this.backgroundContext.restore();
      this.backgroundContext.stroke();
  }

  caclulateMaxLabelWidthX() {
    var maxLabelWidthX = 0;
    for (var i = 0; i < this.data.x.length; i++) {
        var labelWidth = this.backgroundContext.measureText(this.data.x[i]).width;
        if (labelWidth > maxLabelWidthX) {
            maxLabelWidthX = labelWidth;
        }
    }
    return maxLabelWidthX;
  }

  drawAxisLabels() {
      var xAxisLabelInterval = 1;
      var availableWidthPerLabel = this.graphWidth / (this.data.x.length / xAxisLabelInterval);
      var maxLabelWidthX = this.caclulateMaxLabelWidthX();
      while ((availableWidthPerLabel / maxLabelWidthX) < 1.5) {
          xAxisLabelInterval++;
          availableWidthPerLabel = this.graphWidth / (this.data.x.length / xAxisLabelInterval);
      }

      this.backgroundContext.font = this.properties.axes_labels.font_size + "px " + this.properties.axes_labels.font_family;
      this.backgroundContext.fillStyle = this.properties.colours.axes_labels;
      this.backgroundContext.textAlign = "center";
      this.backgroundContext.textBaseline = "middle";

      for (var i = 0; i < this.data.x.length; i += xAxisLabelInterval) {
          this.backgroundContext.fillText(this.data.x[i], this.graphStartX + (i * this.graphScaleX), this.graphEndY + (this.bottomMargin / 2));
      }

      // skip drawing the first and last y-axis labels
      for (var i = this.properties.y_axis.min + this.properties.y_axis.label_interval; i < this.properties.y_axis.max; i += this.properties.y_axis.label_interval) {
          this.backgroundContext.fillText(Helper.applyAffix(i, this.properties.y_axis.label_prefix, this.properties.y_axis.label_suffix), (this.leftMargin / 2), this.graphEndY - ((i - this.properties.y_axis.min) * this.graphScaleY));
      }
  }

  highlight(index) {
      this.clearHighlight();
      if (index == -1) { return false; }

      var axisHighlight = { x: this.graphStartX + (index * this.graphScaleX), y: this.graphEndY };
      var dataHighlights = new Array();

      var yValueMax = Infinity;
      for (var i = 0; i < this.data.y.length; i++) {
          var y0 = this.data.y[i][Math.floor(index)];
          var y1 = this.data.y[i][Math.ceil(index)];
          var interpolatedY = Helper.lerp(y0, y1, index - Math.floor(index));

          var yValue = this.graphStartY + (-(interpolatedY - this.properties.y_axis.max) * this.graphScaleY);
          dataHighlights.push({ x: this.graphStartX + (index * this.graphScaleX), y: yValue });
          if (yValue < yValueMax) {
              yValueMax = yValue;
          }
      }

      this.foregroundContext.strokeStyle = this.properties.colours.background;
      // TODO: add something in the JSON for line width
      this.foregroundContext.lineWidth = 2;
      this.foregroundContext.beginPath();
      this.foregroundContext.moveTo(axisHighlight.x, axisHighlight.y);
      this.foregroundContext.lineTo(axisHighlight.x, yValueMax);
      this.foregroundContext.stroke();

      this.foregroundContext.strokeStyle = this.properties.colours.highlight_indicator;
      this.foregroundContext.lineWidth = 2;
      this.foregroundContext.fillStyle = this.properties.colours.background;

      this.foregroundContext.beginPath();
      // TODO: add something in the JSON for line width and circle radius
      this.foregroundContext.arc(axisHighlight.x, axisHighlight.y, 4, 0, 2 * Math.PI);
      this.foregroundContext.closePath();
      this.foregroundContext.stroke();
      this.foregroundContext.fill();

      for (var i = 0; i < dataHighlights.length; i++) {
          this.foregroundContext.strokeStyle = this.properties.colours.graph[i];
          this.foregroundContext.lineWidth = 4;
          this.foregroundContext.fillStyle = this.properties.colours.background;

          this.foregroundContext.beginPath();
          // TODO: add something in the JSON for line width and circle radius
          this.foregroundContext.arc(dataHighlights[i].x, dataHighlights[i].y, 10, 0, 2 * Math.PI);
          this.foregroundContext.closePath();
          this.foregroundContext.stroke();
          this.foregroundContext.fill();
      }

      this.currentHighlight = index;
  }

  clearHighlight() {
      this.foregroundContext.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
  }

  // TODO: cancel highlight on mouse leave
  handleMouseMove(event) {
      var graphX = (event.offsetX - this.graphStartX) / this.graphScaleX;
      var newHighlight = Math.min(Math.max(Math.round(graphX), 0), this.properties.x_axis.range);

      if (newHighlight != this.currentHighlight) {
          this.highlight(newHighlight);
      }
  }
}
