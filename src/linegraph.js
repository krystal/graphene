class Linegraph extends Graph {
    constructor(backgroundId, foregroundId, properties, data) {
        super(backgroundId, foregroundId, properties, data);

        this.cancelMouseMove();
        if (this.properties.flags && this.properties.flags.highlight_enabled) {
            this.foreground.addEventListener('mousemove', this.handleMouseMove.bind(this), false);
            this.foreground.addEventListener('mouseleave', this.handleMouseLeave.bind(this), false);
        }

        this.cancelMouseDown();
        this.foreground.addEventListener('mousedown', this.handleMouseDown.bind(this), false);
        this.foreground.addEventListener('mouseup', this.handleMouseUp.bind(this), false);
    }

    // TODO: add select and zoom
    // TODO: add property parsing (log unsupported ones in the console and fill in missing ones with defaults)

    draw() {
        this.calculateParameters();
        this.redraw();
    }

    redraw() {
        this.backgroundContext.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
        this.backgroundContext.fillStyle = this.properties.colours.background;
        this.backgroundContext.fillRect(0, 0, this.canvasWidth, this.canvasHeight);

        this.drawHorizontalLines();
        for (var i = 0; i < this.data.y.length; i++) {
            this.drawAreaUnderGraph(this.data.y[i], this.properties.colours.data[i]);
            this.drawGraph(this.data.y[i], this.properties.colours.data[i]);
        }
        if (this.properties.fonts.axes_labels.size > 0) {
            this.drawAxisLabels();
        }
    }

    parseLabel(value) {
        if (!this.properties.y_axis.label_suffix) {
            return {"value": value, "suffix": ""};
        }

        if (this.properties.y_axis.label_suffix.length == 1) {
            return {"value": value, "suffix": this.properties.y_axis.label_suffix[0][1]};
        }

        var lastLimit = 1;
        var lastButOneLimit = 1;
        var lastSuffix = "";
        for (var i = 0; i < this.properties.y_axis.label_suffix.length; i++) {
            var limit = this.properties.y_axis.label_suffix[i][0];
            var suffix = this.properties.y_axis.label_suffix[i][1];
            if (value < limit) {
                return {"value": value / (lastLimit), "suffix": suffix};
            }
            lastButOneLimit = lastLimit;
            lastLimit = limit;
            lastSuffix = suffix;
        }

        return {"value": value / (lastLimit / lastButOneLimit), "suffix": lastSuffix};
    }

    calculateAxisRangeX() {
        return this.axisMaxX - this.axisMinX;
    }

    calculateParameters() {
        var maxLabelWidthX = 0;
        var maxLabelWidthY = 0;
        var labelHeightApproximation = 0;
        if (this.properties.fonts.axes_labels.size > 0) {
            this.backgroundContext.font = this.properties.fonts.axes_labels.size + "px " + this.properties.fonts.axes_labels.family;

            maxLabelWidthX = this.caclulateMaxLabelWidthX();
            for (var i = this.properties.y_axis.min; i <= this.properties.y_axis.max; i += this.properties.y_axis.label_interval) {
                var labelData = this.parseLabel(i);
                var labelWidth = this.backgroundContext.measureText(Helper.applyAffix(labelData.value, this.properties.y_axis.label_prefix, labelData.suffix)).width;
                if (labelWidth > maxLabelWidthY) {
                    maxLabelWidthY = labelWidth;
                }
            }
            labelHeightApproximation = this.backgroundContext.measureText("M").width;
        }

        this.leftMargin = maxLabelWidthY * 2;
        var rightMargin = maxLabelWidthX / 2;
        var topMargin = labelHeightApproximation;
        this.bottomMargin = labelHeightApproximation * 3;
        this.graphStartX = this.leftMargin;
        this.graphStartY = topMargin;
        var graphEndX = this.canvasWidth - rightMargin;
        this.graphEndY = this.canvasHeight - this.bottomMargin;
        this.graphWidth = graphEndX - this.graphStartX;
        var graphHeight = this.graphEndY - this.graphStartY;
        this.axisMinX = this.properties.x_axis.min;
        this.axisMaxX = this.properties.x_axis.max;
        this.graphScaleX = this.graphWidth / this.calculateAxisRangeX();
        this.axisRangeY = this.properties.y_axis.max - this.properties.y_axis.min;
        this.graphScaleY = graphHeight / this.axisRangeY;
    }

    drawHorizontalLines() {
        this.backgroundContext.strokeStyle = this.properties.colours.horizontal_lines;
        this.backgroundContext.lineWidth = 1;
        this.backgroundContext.save();
        this.backgroundContext.transform(this.graphScaleX, 0, 0, this.graphScaleY, this.graphStartX, this.graphStartY);

        var yAxisTotalIntervals = (this.axisRangeY / this.properties.y_axis.label_interval) + 1;
        // skip drawing the last line (on the x-axis)
        for (var i = 0; i < yAxisTotalIntervals - 1; i++) {
            this.backgroundContext.moveTo(0, i * this.properties.y_axis.label_interval);
            this.backgroundContext.lineTo(this.calculateAxisRangeX(), i * this.properties.y_axis.label_interval);
        }

        this.backgroundContext.restore();
        this.backgroundContext.stroke();
    }

    drawAreaUnderGraph(dataset, colour) {
        this.backgroundContext.fillStyle = Helper.hex2rgba(colour, this.properties.colours.alphas.under_graph);
        this.backgroundContext.save();

        this.backgroundContext.transform(this.graphScaleX, 0, 0, this.graphScaleY, this.graphStartX, this.graphStartY);
        this.backgroundContext.transform(1, 0, 0, -1, 0, 0);
        this.backgroundContext.transform(1, 0, 0, 1, 0, -this.properties.y_axis.max);

        this.backgroundContext.beginPath();

        this.backgroundContext.moveTo(0, this.properties.y_axis.min);

        for (var i = 0; i <= this.calculateAxisRangeX(); i++) {
            var yValue = dataset[this.axisMinX + i];
            this.backgroundContext.lineTo(i, yValue);
        }

        this.backgroundContext.lineTo(this.calculateAxisRangeX(), this.properties.y_axis.min);

        this.backgroundContext.restore();
        this.backgroundContext.fill();
    }

    drawGraph(dataset, colour) {
        this.backgroundContext.strokeStyle = colour;
        this.backgroundContext.lineWidth = this.properties.widths.data;
        this.backgroundContext.save();

        this.backgroundContext.transform(this.graphScaleX, 0, 0, this.graphScaleY, this.graphStartX, this.graphStartY);
        this.backgroundContext.transform(1, 0, 0, -1, 0, 0);
        this.backgroundContext.transform(1, 0, 0, 1, 0, -this.properties.y_axis.max);

        this.backgroundContext.beginPath();

        for (var i = 0; i <= this.calculateAxisRangeX(); i++) {
            var yValue = dataset[this.axisMinX + i];
            if (i == 0) {
                this.backgroundContext.moveTo(i, yValue);
            } else {
                this.backgroundContext.lineTo(i, yValue)
            }
        }

        this.backgroundContext.restore();
        this.backgroundContext.stroke();
    }

    caclulateMaxLabelWidthX() {
        var maxLabelWidthX = 0;
        for (var i = this.axisMinX; i <= this.axisMaxX; i++) {
            var labelWidth = this.backgroundContext.measureText(this.data.x[i]).width;
            if (labelWidth > maxLabelWidthX) {
                maxLabelWidthX = labelWidth;
            }
        }
        return maxLabelWidthX;
    }

    drawAxisLabels() {
        var xAxisLabelStart = 0;
        var xAxisLabelInterval = 1;
        var availableWidthPerLabel = this.graphWidth / ((this.calculateAxisRangeX() + 1) / xAxisLabelInterval);
        var maxLabelWidthX = this.caclulateMaxLabelWidthX();
        while ((availableWidthPerLabel / maxLabelWidthX) < 1.5) {
            xAxisLabelInterval++;
            availableWidthPerLabel = this.graphWidth / ((this.calculateAxisRangeX() + 1) / xAxisLabelInterval);
        }

        if (this.properties.x_axis.label_start) {
            xAxisLabelStart = this.properties.x_axis.label_start;
        }
        if (this.properties.x_axis.label_interval) {
            xAxisLabelInterval = Math.max(xAxisLabelInterval, this.properties.x_axis.label_interval);
        }

        this.backgroundContext.font = this.properties.fonts.axes_labels.size + "px " + this.properties.fonts.axes_labels.family;
        this.backgroundContext.fillStyle = this.properties.colours.axes_labels;
        this.backgroundContext.textAlign = "center";
        this.backgroundContext.textBaseline = "middle";

        for (var i = xAxisLabelStart; i <= this.calculateAxisRangeX(); i += xAxisLabelInterval) {
            var xValue = this.data.x[this.axisMinX + i];
            this.backgroundContext.fillText(xValue, this.graphStartX + (i * this.graphScaleX), this.graphEndY + (this.bottomMargin / 2));
        }

        for (var i = this.properties.y_axis.min; i <= this.properties.y_axis.max; i += this.properties.y_axis.label_interval) {
            var labelData = this.parseLabel(i);
            this.backgroundContext.fillText(Helper.applyAffix(labelData.value, this.properties.y_axis.label_prefix, labelData.suffix), (this.leftMargin / 2), this.graphEndY - ((i - this.properties.y_axis.min) * this.graphScaleY));
        }
    }

    highlight(index) {
        this.clearHighlight();
        if (index == -1) { return false; }

        var axisHighlight = { x: this.graphStartX + (index * this.graphScaleX), y: this.graphEndY };
        var dataHighlights = new Array();

        var yValueMax = Infinity;
        for (var i = 0; i < this.data.y.length; i++) {
            var y0 = this.data.y[i][Math.floor(this.axisMinX + index)];
            var y1 = this.data.y[i][Math.ceil(this.axisMinX + index)];
            var interpolatedY = Helper.lerp(y0, y1, index - Math.floor(index));

            var yValue = this.graphStartY + (-(interpolatedY - this.properties.y_axis.max) * this.graphScaleY);
            dataHighlights.push({ x: this.graphStartX + (index * this.graphScaleX), y: yValue });
            if (yValue < yValueMax) {
                yValueMax = yValue;
            }
        }

        // TODO: move this into its own method drawHighlight()?
        this.foregroundContext.strokeStyle = this.properties.colours.background;
        this.foregroundContext.lineWidth = this.properties.widths.highlight_indicator;
        this.foregroundContext.beginPath();
        this.foregroundContext.moveTo(axisHighlight.x, axisHighlight.y);
        this.foregroundContext.lineTo(axisHighlight.x, yValueMax);
        this.foregroundContext.stroke();

        this.foregroundContext.strokeStyle = this.properties.colours.highlight_indicator;
        this.foregroundContext.lineWidth = this.properties.widths.highlight_indicator;
        this.foregroundContext.fillStyle = this.properties.colours.background;

        this.foregroundContext.beginPath();
        this.foregroundContext.arc(axisHighlight.x, axisHighlight.y, this.properties.radii.highlight_indicator, 0, 2 * Math.PI);
        this.foregroundContext.closePath();
        this.foregroundContext.stroke();
        this.foregroundContext.fill();

        for (var i = 0; i < dataHighlights.length; i++) {
            this.foregroundContext.strokeStyle = this.properties.colours.data[i];
            this.foregroundContext.lineWidth = this.properties.widths.data_highlight_indicator;
            this.foregroundContext.fillStyle = this.properties.colours.background;

            this.foregroundContext.beginPath();
            this.foregroundContext.arc(dataHighlights[i].x, dataHighlights[i].y, this.properties.radii.data_highlight_indicator, 0, 2 * Math.PI);
            this.foregroundContext.closePath();
            this.foregroundContext.stroke();
            this.foregroundContext.fill();
        }

        this.mouseMoveIndex = index;
    }

    clearHighlight() {
        this.foregroundContext.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
    }

    calculateHighlight(offsetX) {
        var graphX = (offsetX - this.graphStartX) / this.graphScaleX;
        return Math.min(Math.max(Math.round(graphX), 0), this.calculateAxisRangeX());
    }

    // TODO: add a check that difference highlight is not the same as the last difference highlight to prevent unnecessary redraws
    // TODO: stop the graph from scrolling when the data limit is reached at either end
    // TODO: change to a grabbing cursor when moving with the mouse down
    // TODO: change to a no entry style cursor when trying to move a graph that is already showing the full extent of its range
    handleMouseMove(event) {
        var newHighlight = this.calculateHighlight(event.offsetX);
        if (this.isMouseDown) {
            var differenceHighlight = newHighlight - this.mouseDownHighlight;
            this.axisMinX = this.mouseDownAxisMinX - differenceHighlight;
            this.axisMaxX = this.mouseDownAxisMaxX - differenceHighlight;
            this.redraw();
            this.highlight(this.mouseMoveIndex);
        } else {
            if (newHighlight != this.mouseMoveIndex) {
                this.highlight(newHighlight);
            }
        }
    }

    cancelMouseMove() {
        this.mouseMoveIndex = -1;
    }

    cancelMouseDown() {
        this.isMouseDown = false;
        this.mouseDownAxisMinX = -1;
        this.mouseDownAxisMaxX = -1;
        this.mouseDownHighlight = -1;
    }
    
    handleMouseLeave(event) {
        this.cancelMouseMove();
        this.clearHighlight();
        this.cancelMouseDown();
    }

    handleMouseDown(event) {
        this.isMouseDown = true;
        this.mouseDownAxisMinX = this.axisMinX;
        this.mouseDownAxisMaxX = this.axisMaxX;
        this.mouseDownHighlight = this.calculateHighlight(event.offsetX);
    }

    handleMouseUp(event) {
        this.cancelMouseDown();
    }
}
