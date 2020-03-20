class Linegraph extends Graph {
    constructor(backgroundId, foregroundId, properties, data) {
        super(backgroundId, foregroundId, properties, data);

        this.currentHighlight = -1;
        if (this.properties.flags && this.properties.flags.highlight_enabled) {
            // TODO: move this to a point after the JSON has been loaded (and possibly calculateParameters has been called at least once)
            this.foreground.addEventListener('mousemove', this.handleMouseMove.bind(this), false);
            this.foreground.addEventListener('mouseleave', this.handleMouseLeave.bind(this), false);
        }
    }

    // TODO: add property parsing (log unsupported ones in the console and fill in missing ones with defaults)
    // TODO: add the concept of a viewport to facilitate scrolling of data in the x-axis

    draw() {
        this.calculateParameters();

        this.backgroundContext.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
        this.backgroundContext.fillStyle = this.properties.colours.background;
        this.backgroundContext.fillRect(0, 0, this.canvasWidth, this.canvasHeight);

        this.drawHorizontalLines();
        for (var i = 0; i < this.data.y.length; i++) {
            this.drawAreaUnderGraph(this.data.y[i], this.properties.colours.data[i]);
            this.drawGraph(this.data.y[i], this.properties.colours.data[i]);
        }
        this.drawAxisLabels();
    }

    // TODO: since this returns a pair via an array it warrants a better name
    // it also needn't return a pair, it can return an object
    parseLabel(value) {
        if (!this.properties.y_axis.label_suffix) {
            return [value, ""];
        }

        if (this.properties.y_axis.label_suffix.length == 1) {
            return [value, this.properties.y_axis.label_suffix[0][1]];
        }

        var previousLimit = 1;
        // TODO: find a better name for this as well
        var previousPreviousLimit = 1;
        var previousSuffix = "";
        for (var i = 0; i < this.properties.y_axis.label_suffix.length; i++) {
            var limit = this.properties.y_axis.label_suffix[i][0];
            var suffix = this.properties.y_axis.label_suffix[i][1];
            if (value < limit) {
                return [value / (previousLimit), suffix];
            }
            previousPreviousLimit = previousLimit;
            previousLimit = limit;
            previousSuffix = suffix;
        }

        return [value / (previousLimit / previousPreviousLimit), previousSuffix];
    }

    calculateParameters() {
        this.backgroundContext.font = this.properties.fonts.axes_labels.size + "px " + this.properties.fonts.axes_labels.family;

        var maxLabelWidthX = this.caclulateMaxLabelWidthX();
        var maxLabelWidthY = 0;
        for (var i = this.properties.y_axis.min; i <= this.properties.y_axis.max; i += this.properties.y_axis.label_interval) {
            var labelData = this.parseLabel(i);
            var labelWidth = this.backgroundContext.measureText(Helper.applyAffix(labelData[0], this.properties.y_axis.label_prefix, labelData[1])).width;
            if (labelWidth > maxLabelWidthY) {
                maxLabelWidthY = labelWidth;
            }
        }
        var labelHeightApproximation = this.backgroundContext.measureText("M").width;

        this.leftMargin = maxLabelWidthY * 2;
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
        // skip drawing the last line (on the x-axis)
        for (var i = 0; i < yAxisTotalIntervals - 1; i++) {
            this.backgroundContext.moveTo(0, i * this.properties.y_axis.label_interval);
            this.backgroundContext.lineTo(this.properties.x_axis.range, i * this.properties.y_axis.label_interval);
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

        for (var i = 0; i < dataset.length; i++) {
            this.backgroundContext.lineTo(i, dataset[i]);
        }

        this.backgroundContext.lineTo(this.properties.x_axis.range, this.properties.y_axis.min);

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
        var xAxisLabelStart = 0;
        var xAxisLabelInterval = 1;
        var availableWidthPerLabel = this.graphWidth / (this.data.x.length / xAxisLabelInterval);
        var maxLabelWidthX = this.caclulateMaxLabelWidthX();
        while ((availableWidthPerLabel / maxLabelWidthX) < 1.5) {
            xAxisLabelInterval++;
            availableWidthPerLabel = this.graphWidth / (this.data.x.length / xAxisLabelInterval);
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

        for (var i = xAxisLabelStart; i < this.data.x.length; i += xAxisLabelInterval) {
            this.backgroundContext.fillText(this.data.x[i], this.graphStartX + (i * this.graphScaleX), this.graphEndY + (this.bottomMargin / 2));
        }

        for (var i = this.properties.y_axis.min; i <= this.properties.y_axis.max; i += this.properties.y_axis.label_interval) {
            var labelData = this.parseLabel(i);
            this.backgroundContext.fillText(Helper.applyAffix(labelData[0], this.properties.y_axis.label_prefix, labelData[1]), (this.leftMargin / 2), this.graphEndY - ((i - this.properties.y_axis.min) * this.graphScaleY));
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

        this.currentHighlight = index;
    }

    clearHighlight() {
        this.foregroundContext.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
    }

    handleMouseMove(event) {
        var graphX = (event.offsetX - this.graphStartX) / this.graphScaleX;
        var newHighlight = Math.min(Math.max(Math.round(graphX), 0), this.properties.x_axis.range);

        if (newHighlight != this.currentHighlight) {
            this.highlight(newHighlight);
        }
    }

    handleMouseLeave(event) {
        this.currentHighlight = -1;
        this.clearHighlight();
    }
}
