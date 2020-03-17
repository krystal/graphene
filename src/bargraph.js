class Bargraph extends Graph {
  constructor(backgroundId, foregroundId, tooltipId, dataSource) {
      super(backgroundId, foregroundId, tooltipId, dataSource);
  }

  draw() {
      this.calculateParameters();

      this.backgroundContext.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
      this.backgroundContext.fillStyle = this.data.colours.background;
      this.backgroundContext.fillRect(0, 0, this.canvasWidth, this.canvasHeight);

      this.drawHorizontalLines();
      this.drawGraph();
      if (this.data.graph_settings.display_net_line) {
          this.drawNetLine();
      }
      this.drawAxisLabels();
  }

  calculateParameters() {
      this.backgroundContext.font = this.data.axes_labels.font_size + "px " + this.data.axes_labels.font_family;

      var maxLabelWidth = 0;
      for (var i = this.data.y_axis.min + this.data.y_axis.label_interval; i < this.data.y_axis.max; i += this.data.y_axis.label_interval) {
          var labelWidth = this.backgroundContext.measureText(Helper.applyPrefix(i, this.data.y_axis.label_prefix)).width;
          if (labelWidth > maxLabelWidth) {
              maxLabelWidth = labelWidth;
          }
      }

      this.graphMarginX = maxLabelWidth * 1.5;
      var labelHeightApproximation = this.backgroundContext.measureText("M").width;
      this.graphMarginY = labelHeightApproximation * 3;
      this.graphStartX = this.graphMarginX;
      this.graphStartY = this.graphMarginY;
      var graphEndX = this.canvasWidth - this.graphMarginX;
      this.graphEndY = this.canvasHeight - this.graphMarginY;
      this.graphWidth = graphEndX - this.graphStartX;
      var graphHeight = this.graphEndY - this.graphStartY;
      this.graphScaleX = this.graphWidth / this.data.x_axis.intervals;
      var yAxisRange = this.data.y_axis.max - this.data.y_axis.min;
      this.graphScaleY = graphHeight / yAxisRange;
  }

  drawHorizontalLines() {
      this.backgroundContext.strokeStyle = this.data.colours.horizontal_lines;
      this.backgroundContext.lineWidth = 1;
      this.backgroundContext.save();
      this.backgroundContext.transform(this.graphScaleX, 0, 0, this.graphScaleY, this.graphStartX, this.graphStartY);

      var yAxisRange = this.data.y_axis.max - this.data.y_axis.min;
      var yAxisTotalIntervals = (yAxisRange / this.data.y_axis.label_interval) + 1;
      // skip drawing the first and last lines
      for (var i = 1; i < yAxisTotalIntervals - 1; i++) {
          this.backgroundContext.moveTo(0, i * this.data.y_axis.label_interval);
          this.backgroundContext.lineTo(this.data.x_axis.intervals, i * this.data.y_axis.label_interval);
      }

      this.backgroundContext.restore();
      this.backgroundContext.stroke();
  }

  drawGraph() {
      this.backgroundContext.save();
      this.backgroundContext.transform(this.graphScaleX, 0, 0, this.graphScaleY, this.graphStartX, this.graphStartY);
      this.backgroundContext.transform(1, 0, 0, -1, 0, 0);
      this.backgroundContext.transform(1, 0, 0, 1, 0, -this.data.y_axis.max);

      for (var i = 0; i < this.data.datasets.x.length; i++) {
          var positiveOffset = 0;
          var negativeOffset = 0;

          for (var j = 0; j < this.data.datasets.y.length; j++) {
              var value = this.data.datasets.y[j][i];

              this.backgroundContext.fillStyle = this.data.colours.graph[j];
              if (value > 0) {
                  this.backgroundContext.fillRect(0.1 + i, positiveOffset, 0.8, value);
                  positiveOffset += value;
              } else if (value < 0) {
                  this.backgroundContext.fillRect(0.1 + i, negativeOffset + value, 0.8, -value);
                  negativeOffset += value;
              }
          }
      }

      this.backgroundContext.restore();
  }

  drawNetLine() {
      this.backgroundContext.strokeStyle = this.data.colours.net_line;
      this.backgroundContext.lineWidth = this.data.graph_settings.net_line_width;
      this.backgroundContext.save();
      this.backgroundContext.transform(this.graphScaleX, 0, 0, this.graphScaleY, this.graphStartX, this.graphStartY);
      this.backgroundContext.transform(1, 0, 0, -1, 0, 0);
      this.backgroundContext.transform(1, 0, 0, 1, 0, -this.data.y_axis.max);

      this.backgroundContext.beginPath();

      for (var i = 0; i < this.data.datasets.x.length; i++) {
          var netTotal = 0;
          for (var j = 0; j < this.data.datasets.y.length; j++) {
              netTotal += this.data.datasets.y[j][i];
          }

          if (i == 0) {
              this.backgroundContext.moveTo(i + 0.5, netTotal);
          } else {
              this.backgroundContext.lineTo(i + 0.5, netTotal)
          }
      }

      this.backgroundContext.restore();
      this.backgroundContext.stroke();
  }

  drawAxisLabels() {
      var maxLabelWidth = 0;
      for (var i = 0; i < this.data.datasets.x.length; i++) {
          var labelWidth = this.backgroundContext.measureText(this.data.datasets.x[i]).width;
          if (labelWidth > maxLabelWidth) {
              maxLabelWidth = labelWidth;
          }
      }

      var xAxisLabelInterval = 1;
      var availableWidthPerLabel = this.graphWidth / (this.data.datasets.x.length / xAxisLabelInterval);
      while ((availableWidthPerLabel / maxLabelWidth) < 1.5) {
          xAxisLabelInterval++;
          availableWidthPerLabel = this.graphWidth / (this.data.datasets.x.length / xAxisLabelInterval);
      }

      this.backgroundContext.font = this.data.axes_labels.font_size + "px " + this.data.axes_labels.font_family;
      this.backgroundContext.fillStyle = this.data.colours.axes_labels;
      this.backgroundContext.textAlign = "center";
      this.backgroundContext.textBaseline = "middle";

      for (var i = 0; i < this.data.datasets.x.length; i += xAxisLabelInterval) {
          this.backgroundContext.fillText(this.data.datasets.x[i], this.graphStartX + ((i + 0.5) * this.graphScaleX), this.graphEndY + (this.graphMarginY / 2));
      }

      // skip drawing the first and last y-axis labels
      for (var i = this.data.y_axis.min + this.data.y_axis.label_interval; i < this.data.y_axis.max; i += this.data.y_axis.label_interval) {
          this.backgroundContext.fillText(Helper.applyPrefix(i, this.data.y_axis.label_prefix), (this.graphMarginX / 2), this.graphEndY - ((i - this.data.y_axis.min) * this.graphScaleY));
      }
  }
}
