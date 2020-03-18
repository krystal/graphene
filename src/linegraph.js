class Linegraph extends Graph {
  constructor(backgroundId, foregroundId, tooltipId, properties, data) {
      super(backgroundId, foregroundId, tooltipId, properties, data);

      this.lastHighlight = -1;
      this.currentHighlight = -1;
      this.targetHighlight = -1;
      // TODO: give this a more descriptive name, we may have other requests in the future
      this.requestId = undefined;
      // TODO: move this to a point after the JSON has been loaded (and possibly calculateParameters has been called at least once)
      this.foreground.addEventListener('mousemove', this.handleMouseMove.bind(this), false);
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

      var maxLabelWidth = 0;
      for (var i = this.properties.y_axis.min + this.properties.y_axis.label_interval; i < this.properties.y_axis.max; i += this.properties.y_axis.label_interval) {
          var labelWidth = this.backgroundContext.measureText(Helper.applyAffix(i, this.properties.y_axis.label_prefix, this.properties.y_axis.label_suffix)).width;
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

  drawAxisLabels() {
      var maxLabelWidth = 0;
      for (var i = 0; i < this.data.x.length; i++) {
          var labelWidth = this.backgroundContext.measureText(this.data.x[i]).width;
          if (labelWidth > maxLabelWidth) {
              maxLabelWidth = labelWidth;
          }
      }

      var xAxisLabelInterval = 1;
      var availableWidthPerLabel = this.graphWidth / (this.data.x.length / xAxisLabelInterval);
      while ((availableWidthPerLabel / maxLabelWidth) < 1.5) {
          xAxisLabelInterval++;
          availableWidthPerLabel = this.graphWidth / (this.data.x.length / xAxisLabelInterval);
      }

      this.backgroundContext.font = this.properties.axes_labels.font_size + "px " + this.properties.axes_labels.font_family;
      this.backgroundContext.fillStyle = this.properties.colours.axes_labels;
      this.backgroundContext.textAlign = "center";
      this.backgroundContext.textBaseline = "middle";

      for (var i = 0; i < this.data.x.length; i += xAxisLabelInterval) {
          this.backgroundContext.fillText(this.data.x[i], this.graphStartX + (i * this.graphScaleX), this.graphEndY + (this.graphMarginY / 2));
      }

      // skip drawing the first and last y-axis labels
      for (var i = this.properties.y_axis.min + this.properties.y_axis.label_interval; i < this.properties.y_axis.max; i += this.properties.y_axis.label_interval) {
          this.backgroundContext.fillText(Helper.applyAffix(i, this.properties.y_axis.label_prefix, this.properties.y_axis.label_suffix), (this.graphMarginX / 2), this.graphEndY - ((i - this.properties.y_axis.min) * this.graphScaleY));
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

  animateHighlight(startIndex, endIndex, duration) {
      var start = null;

      var step = function animateHighlightStep(timestamp) {
          if (start === null) {
              start = timestamp;
          }

          var delta = timestamp - start;
          var progress = Math.min(delta / duration, 1);

          if (endIndex > startIndex) {
              this.highlight(startIndex + ((endIndex - startIndex) * progress));
          } else {
              this.highlight(startIndex - ((startIndex - endIndex) * progress));
          }

          if (progress < 1) {
              this.requestId = window.requestAnimationFrame(step);
          } else {
              this.lastHighlight = endIndex;
          }
      }.bind(this);

      this.requestId = window.requestAnimationFrame(step);
  }

  clearHighlight() {
      this.foregroundContext.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
  }

  // TODO: cancel overlay and tooltip on mouse leave
  handleMouseMove(event) {
      var graphX = (event.offsetX - this.graphStartX) / this.graphScaleX;
      var newHighlight = Math.min(Math.max(Math.round(graphX), 0), this.properties.x_axis.range);
      if (this.lastHighlight == -1) {
          this.targetHighlight = newHighlight;
          this.highlight(this.targetHighlight);
          this.lastHighlight = this.targetHighlight;
      } else if (newHighlight != this.lastHighlight) {
          if (this.lastHighlight == this.targetHighlight) {
              this.targetHighlight = newHighlight;
              this.animateHighlight(this.lastHighlight, this.targetHighlight, this.properties.animation.highlight_transistion_duration);
          } else {
              if (this.targetHighlight > this.lastHighlight) {
                  if (newHighlight > this.targetHighlight) {
                      console.log("animation restarted, left to right");
                      // further
                      window.cancelAnimationFrame(this.requestId);
                      this.lastHighlight = this.currentHighlight;
                      this.targetHighlight = newHighlight;
                      this.animateHighlight(this.lastHighlight, this.targetHighlight, this.properties.animation.highlight_transistion_duration);
                  } else {
                      // closer
                  }
              } else {
                  if (newHighlight < this.targetHighlight) {
                      console.log("animation restarted, right to left");
                      // further
                      window.cancelAnimationFrame(this.requestId);
                      this.lastHighlight = this.currentHighlight;
                      this.targetHighlight = newHighlight;
                      this.animateHighlight(this.lastHighlight, this.targetHighlight, this.properties.animation.highlight_transistion_duration);
                  } else {
                      // closer
                  }
              }
          }
      }
  }
}
