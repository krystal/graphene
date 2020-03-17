class Piegraph extends Graph {
  constructor(backgroundId, foregroundId, tooltipId, dataSource) {
      super(backgroundId, foregroundId, tooltipId, dataSource);
  }

  draw() {
      this.calculateParameters();

      this.backgroundContext.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
      this.backgroundContext.fillStyle = this.data.colours.background;
      this.backgroundContext.fillRect(0, 0, this.canvasWidth, this.canvasHeight);

      this.drawGraph();
      this.drawGraphLabels();
      this.drawKey();
  }

  calculateParameters() {
      this.backgroundContext.font = this.data.key_labels.font_size + "px " + this.data.key_labels.font_family;

      var maxLabelWidth = 0;
      for (var i = 0; i < this.data.segments.length; i++) {
          var segment = this.data.segments[i];

          var labelWidth = this.backgroundContext.measureText(segment.title).width;
          if (labelWidth > maxLabelWidth) {
              maxLabelWidth = labelWidth;
          }
      }

      var labelHeightApproximation = this.backgroundContext.measureText("M").width;
      this.keyWidth = (2 * labelHeightApproximation) + maxLabelWidth;

      var horizontalMargin = this.canvasWidth * 0.05;
      // a margin at either end then 1.5 margins between the graph and the key
      this.graphWidth = this.canvasWidth - this.keyWidth - (3.5 * horizontalMargin);
      this.graphHeight = this.graphWidth;
      this.graphStartX = horizontalMargin;
      this.graphStartY = (this.canvasHeight - this.graphHeight) / 2;
      this.graphCentreX = this.graphStartX + (this.graphWidth / 2);
      this.graphCentreY = this.graphStartY + (this.graphHeight / 2);

      // TODO: handle situations where this is greater than canvas height (reducing the vertical spacing between the labels should the first port of call)
      // number of segments plus double the number of gaps between segments
      var contentHeightAppoximation = labelHeightApproximation * (this.data.segments.length + ((this.data.segments.length - 1) * 2))

      this.keyHeight = contentHeightAppoximation;
      this.keyStartX = this.graphWidth + (2.5 * horizontalMargin);
      this.keyStartY = (this.canvasHeight - this.keyHeight) / 2;
  }

  // TODO: check what tiny segments look like in practice
  drawGraph() {
      // start at up rather than right
      var angleOffset = -0.5 * Math.PI;
      var cumulativeAngle = 0;

      this.backgroundContext.strokeStyle = this.data.colours.background;
      this.backgroundContext.lineWidth = this.data.segment_settings.border_width;

      for (var i = 0; i < this.data.segments.length; i++) {
          var segment = this.data.segments[i];
          var segmentAngle = (segment.percentage / 100) * 2 * Math.PI;

          this.backgroundContext.fillStyle = segment.colour;
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

  // TODO: check that a label will fit in the available space
  drawGraphLabels() {
      // start at up rather than right
      var angleOffset = -0.5 * Math.PI;
      var cumulativeAngle = 0;

      this.backgroundContext.font = this.data.segment_labels.font_size + "px " + this.data.segment_labels.font_family;
      this.backgroundContext.fillStyle = this.data.colours.segment_labels;
      this.backgroundContext.textAlign = "center";
      this.backgroundContext.textBaseline = "middle";
      this.backgroundContext.save();

      this.backgroundContext.translate(this.graphCentreX, this.graphCentreY);

      for (var i = 0; i < this.data.segments.length; i++) {
          var segment = this.data.segments[i];
          var segmentAngle = (segment.percentage / 100) * 2 * Math.PI;

          var segmentCentreAngle = angleOffset + cumulativeAngle + (segmentAngle / 2);
          var labelX = (this.graphWidth / 3) * Math.cos(segmentCentreAngle);
          var labelY = (this.graphWidth / 3) * Math.sin(segmentCentreAngle);
          this.backgroundContext.fillText(segment.percentage + "%", labelX, labelY);

          cumulativeAngle += segmentAngle;
      }

      this.backgroundContext.restore();
  }

  // TODO: add a flag to the JSON that can turn key drawing off
  drawKey() {
      this.backgroundContext.font = this.data.key_labels.font_size + "px " + this.data.key_labels.font_family;
      this.backgroundContext.textAlign = "left";
      this.backgroundContext.textBaseline = "middle";

      var labelHeightApproximation = this.backgroundContext.measureText("M").width;

      var yOffset = this.keyStartY;
      for (var i = 0; i < this.data.segments.length; i++) {
          var segment = this.data.segments[i];

          this.backgroundContext.fillStyle = segment.colour;
          this.backgroundContext.fillRect(this.keyStartX, yOffset, labelHeightApproximation, labelHeightApproximation);
          this.backgroundContext.fillStyle = this.data.colours.key_labels;
          this.backgroundContext.fillText(segment.title, this.keyStartX + (2 * labelHeightApproximation), yOffset + (labelHeightApproximation / 2));

          // offset by this line plus two gaps
          yOffset += 3 * labelHeightApproximation;
      }
  }
}
