class Linegraph extends Graph {
    constructor(backgroundId, foregroundId, properties, data) {
        super(backgroundId, foregroundId, properties, data);

        this.cancelMouseMove();
        this.cancelMouseDown();
        this.cancelShiftMouseDown();
        this.foreground.addEventListener('mousemove', this.handleMouseMove.bind(this), false);
        this.foreground.addEventListener('mouseleave', this.handleMouseLeave.bind(this), false);
        this.foreground.addEventListener('mousedown', this.handleMouseDown.bind(this), false);
        this.foreground.addEventListener('mouseup', this.handleMouseUp.bind(this), false);
        this.foreground.addEventListener('dblclick', this.handleDoubleClick.bind(this), false);
    }

    // TODO: investigate "Save Image As..." in browsers, it currently, understandably, saves only the foreground layer
    // TODO: if there are no labels for a selection then the the highlight indicator can get clipped in half
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

    calculateGraphScaleX() {
        return this.graphWidth / this.calculateAxisRangeX();
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
        this.graphHeight = this.graphEndY - this.graphStartY;
        this.axisMinX = this.properties.x_axis.min;
        this.axisMaxX = this.properties.x_axis.max;
        this.graphScaleX = this.calculateGraphScaleX();
        this.axisRangeY = this.properties.y_axis.max - this.properties.y_axis.min;
        this.graphScaleY = this.graphHeight / this.axisRangeY;

        if (this.properties.flags) {
            this.highLightEnabled = this.properties.flags.highlight_enabled;
            this.scrollEnabled = this.properties.flags.scroll_enabled;
            this.zoomEnabled = this.properties.flags.zoom_enabled;
        }
    }

    drawHorizontalLines() {
        this.backgroundContext.strokeStyle = this.properties.colours.horizontal_lines;
        this.backgroundContext.lineWidth = 1;
        this.backgroundContext.save();
        this.backgroundContext.transform(this.graphScaleX, 0, 0, this.graphScaleY, this.graphStartX, this.graphStartY);

        this.backgroundContext.beginPath();

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

    // TODO: change to a grabbing cursor when moving with the mouse down
    // TODO: change to a no entry style cursor when trying to move a graph that is already showing the full extent of its range
    scroll(differenceIndex) {
        var newAxisMinX = this.mouseDownAxisMinX - differenceIndex;
        var newAxisMaxX = this.mouseDownAxisMaxX - differenceIndex;

        if (newAxisMinX >= 0 && newAxisMaxX < this.data.x.length) {
            this.axisMinX = this.mouseDownAxisMinX - differenceIndex;
            this.axisMaxX = this.mouseDownAxisMaxX - differenceIndex;
            this.redraw();
            this.highlight(this.mouseMoveIndex);
            this.mouseDownDifferenceIndex = differenceIndex;
        }
    }

    drawHighlight(axisHighlight, yValueMax, dataHighlights) {
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
    }

    // TODO: try rounding the corners of the panel
    // TODO: try highlighting the heading (the x sentence)
    // TODO: consider moving the calculation code in highlight(index) and reserve this method for actual drawing
    drawInformationPanel(index) {
        this.foregroundContext.font = this.properties.fonts.information_sentences.size + "px " + this.properties.fonts.information_sentences.family;
        this.foregroundContext.textAlign = "left";

        var sentences = new Array();
        var maxSentenceWidth = 0;
        for (var i = 0; i < this.data.y.length; i++) {
            var labelData = this.parseLabel(this.data.y[i][this.axisMinX + index]);
            var formattedData = Helper.applyAffix(labelData.value, this.properties.y_axis.label_prefix, labelData.suffix);
            var sentence = this.properties.names.data[i] + ": " + formattedData;
            var sentenceWidth = this.foregroundContext.measureText(sentence).width;
            if (sentenceWidth > maxSentenceWidth) {
                maxSentenceWidth = sentenceWidth;
            }
            sentences.push(sentence);
        }
        var sentenceHeightApproximation = this.foregroundContext.measureText("M").width;

        // space + circle + space + sentence + space
        // space and cricle are as wide as a sentence is tall
        var requiredWidth = maxSentenceWidth + (4 * sentenceHeightApproximation);
        // space + sentence + space + sentence + space + ... + sentence + space
        var requiredHeight = (((this.data.y.length + 1) * 2) + 1) * sentenceHeightApproximation;
        var panelX = this.graphStartX + (index * this.graphScaleX) + (2 * sentenceHeightApproximation);
        var panelY = this.graphStartY + (this.graphHeight / 2) - (requiredHeight / 2);

        if ((panelX + requiredWidth) > this.graphWidth) {
            panelX = this.graphStartX + (index * this.graphScaleX) - (2 * sentenceHeightApproximation) - requiredWidth;
            if (panelX < 0) {
                console.log("Information panel may be clipped horizontally!");
            }
        }

        if (requiredHeight > this.graphHeight) {
            console.log("Information panel may be clipped vertically!");
        }

        this.foregroundContext.fillStyle = Helper.hex2rgba(this.properties.colours.information_panel, this.properties.colours.alphas.information_panel);
        this.foregroundContext.fillRect(panelX, panelY, requiredWidth, requiredHeight);

        // TODO: draw the x sentence
        var circleOffsetY = panelY + (3 * sentenceHeightApproximation);
        var sentenceOffsetY = panelY + (4 * sentenceHeightApproximation);
        for (var i = 0; i < sentences.length; i++) {
            // TODO: change this to a circle
            this.foregroundContext.fillStyle = this.properties.colours.data[i];
            this.foregroundContext.fillRect(panelX + sentenceHeightApproximation, circleOffsetY, sentenceHeightApproximation, sentenceHeightApproximation);
            this.foregroundContext.fillStyle = this.properties.colours.information_sentences;
            this.foregroundContext.fillText(sentences[i], panelX + (3 * sentenceHeightApproximation), sentenceOffsetY);

            circleOffsetY += 2 * sentenceHeightApproximation;
            sentenceOffsetY += 2 * sentenceHeightApproximation;
        }
    }

    highlight(index) {
        this.clearForeground();
        if (index == -1) { return false; }

        var axisHighlight = { x: this.graphStartX + (index * this.graphScaleX), y: this.graphEndY };
        var dataHighlights = new Array();

        var yValueMax = Infinity;
        for (var i = 0; i < this.data.y.length; i++) {
            // TODO: check this, I think it's a relic from when index wasn't a whole number
            var y0 = this.data.y[i][Math.floor(this.axisMinX + index)];
            var y1 = this.data.y[i][Math.ceil(this.axisMinX + index)];
            var interpolatedY = Helper.lerp(y0, y1, index - Math.floor(index));

            var yValue = this.graphStartY + (-(interpolatedY - this.properties.y_axis.max) * this.graphScaleY);
            dataHighlights.push({ x: this.graphStartX + (index * this.graphScaleX), y: yValue });
            if (yValue < yValueMax) {
                yValueMax = yValue;
            }
        }

        this.drawHighlight(axisHighlight, yValueMax, dataHighlights);
        this.drawInformationPanel(index);
        this.mouseMoveIndex = index;
    }

    clearForeground() {
        this.foregroundContext.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
    }

    calculateIndex(offsetX) {
        var graphX = (offsetX - this.graphStartX) / this.graphScaleX;
        return Math.min(Math.max(Math.round(graphX), 0), this.calculateAxisRangeX());
    }

    drawSelectionBox() {
        this.clearForeground();

        var boxX = this.graphStartX + (this.shiftMouseDownStartIndex * this.graphScaleX);
        var boxWidth = (this.shiftMouseDownEndIndex - this.shiftMouseDownStartIndex) * this.graphScaleX;
        
        this.foregroundContext.fillStyle = Helper.hex2rgba(this.properties.colours.selection_box, this.properties.colours.alphas.selection_box);
        this.foregroundContext.fillRect(boxX, this.graphStartY, boxWidth, this.graphHeight);
    }

    handleMouseMove(event) {
        var index = this.calculateIndex(event.offsetX);
        if (this.isMouseDown) {
            if (this.scrollEnabled) {
                var differenceIndex = index - this.mouseDownIndex;
                if (differenceIndex != this.mouseDownDifferenceIndex) {
                    this.scroll(differenceIndex);
                }
            }
        } else if (this.isShiftMouseDown) {
            if (this.zoomEnabled) {
                this.shiftMouseDownEndIndex = index;
                this.drawSelectionBox();
            }
        } else {
            if (this.highLightEnabled) {
                if (index != this.mouseMoveIndex) {
                    this.highlight(index);
                }
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
        this.mouseDownIndex = -1;
        this.mouseDownDifferenceIndex = -1;
    }

    cancelShiftMouseDown() {
        this.isShiftMouseDown = false;
        this.shiftMouseDownStartIndex = -1;
        this.shiftMouseDownEndIndex = -1;
    }
    
    handleMouseLeave(event) {
        this.clearForeground();
        this.cancelMouseMove();
        this.cancelMouseDown();
        this.cancelShiftMouseDown();
    }

    handleMouseDown(event) {
        if (event.shiftKey) {
            if (this.zoomEnabled) {
                this.isShiftMouseDown = true;
                this.shiftMouseDownStartIndex = this.calculateIndex(event.offsetX);
            }
        } else {
            if (this.scrollEnabled) {
                this.isMouseDown = true;
                this.mouseDownAxisMinX = this.axisMinX;
                this.mouseDownAxisMaxX = this.axisMaxX;
                this.mouseDownIndex = this.calculateIndex(event.offsetX);
            }
        }
    }

    handleMouseUp(event) {
        if (this.isShiftMouseDown) {
            if (this.zoomEnabled) {
                if (this.shiftMouseDownStartIndex != this.shiftMouseDownEndIndex) {
                    if (this.shiftMouseDownStartIndex > this.shiftMouseDownEndIndex) {
                        this.axisMinX = this.shiftMouseDownEndIndex;
                        this.axisMaxX = this.shiftMouseDownStartIndex;
                    } else {
                        this.axisMinX = this.shiftMouseDownStartIndex;
                        this.axisMaxX = this.shiftMouseDownEndIndex;
                    }
                    this.graphScaleX = this.calculateGraphScaleX();
                    this.redraw();
                    this.clearForeground();
                }
                this.cancelShiftMouseDown();
            }
        } else {
            if (this.scrollEnabled) {
                this.cancelMouseDown();
            }
        }
    }

    handleDoubleClick(event) {
        // reset
        this.draw();
    }
}
