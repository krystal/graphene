class GrapheneLinegraph {
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
        this.retrievePropertiesAndStyles();
        this.calculateParameters();

        this.axisFormatter = axisFormatter;
        this.informationFormatter = informationFormatter;

        this.addMouseEvents();
    }

    createLayers() {
        this.removeLayers();

        this.background = document.createElement('CANVAS');
        this.background.width = this.element.getBoundingClientRect().width;
        this.background.height = this.element.getAttribute('height');
        this.element.appendChild(this.background);

        this.foreground = document.createElement("CANVAS");
        this.foreground.width = this.element.getBoundingClientRect().width
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
        this.cancelMouseMove();
        this.cancelMouseDown();
        this.cancelShiftMouseDown();
        this.foreground.addEventListener('mousemove', this.handleMouseMove.bind(this), false);
        this.foreground.addEventListener('mouseleave', this.handleMouseLeave.bind(this), false);
        this.foreground.addEventListener('mousedown', this.handleMouseDown.bind(this), false);
        this.foreground.addEventListener('mouseup', this.handleMouseUp.bind(this), false);
        this.foreground.addEventListener('dblclick', this.handleDoubleClick.bind(this), false);
    }

    // TODO: do some refactoring
    // TODO: investigate "Save Image As..." in browsers, it currently, understandably, saves only the foreground layer

    draw() {
        this.drawn = true;
        this.retrievePropertiesAndStyles();
        this.calculateParameters();
        this.redraw();
    }

    getDataColour(i) {
        if (this.coloursData && this.coloursData.length > 0) {
            return this.coloursData[i % this.coloursData.length];
        }
        return this.defaultDataColour;
    }

    getDataColourStop(i) {
        if (this.coloursDataStop && this.coloursDataStop.length > 0) {
            return this.coloursDataStop[i % this.coloursDataStop.length];
        }
        return this.defaultDataColour;
    }

    redraw() {
        this.backgroundContext.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
        this.backgroundContext.fillStyle = this.grapheneHelper.hex2rgba(this.coloursBackground, this.alphasBackground);
        this.backgroundContext.fillRect(0, 0, this.canvasWidth, this.canvasHeight);

        if (!this.hideVerticalAxes) {
            this.drawHorizontalLines();
        }
        for (var i = 0; i < this.data.y.length; i++) {
            var dataColour = this.getDataColour(i);
            var dataColourStop = this.getDataColourStop(i);
            this.drawAreaUnderGraph(this.data.y[i], dataColour, dataColourStop, 1);
            this.drawGraph(this.data.y[i], dataColour, dataColourStop, 1);
            if (this.showDataPoints) {
                this.drawDataPoints(this.data.y[i], 1);
            }
        }
        if (this.data.u) {
            for (var i = 0; i < this.data.u.length; i++) {
                var dataColour = this.getDataColour(this.data.y.length + i);
                var dataColourStop = this.getDataColourStop(this.data.y.length + i);
                this.drawAreaUnderGraph(this.data.u[i], dataColour, dataColourStop, this.graphScaleU);
                this.drawGraph(this.data.u[i], dataColour, dataColourStop, this.graphScaleU);
                if (this.showDataPoints) {
                    this.drawDataPoints(this.data.y[i], this.graphScaleU);
                }
            }
        }
        if (!this.hideHorizontalAxis) {
            this.drawHorizontalAxisLabels();
        }
        if (!this.hideVerticalAxes) {
            this.drawVerticalAxesLabels();
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

    getLabelComponentsU(value) {
        if (!this.properties || !this.properties.u_axis || !this.properties.u_axis.label_suffix) {
            return { "value": value, "suffix": "" };
        }

        return this.getLabelComponents(value, this.properties.u_axis.label_suffix);
    }

    calculateAxisRangeX() {
        return this.axisMaxX - this.axisMinX;
    }

    calculateGraphScaleX() {
        return this.graphWidth / this.calculateAxisRangeX();
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

    getMaxValueU() {
        var maxU = 0;
        if (this.data.u) {
            for (var i = 0; i < this.data.u.length; i++) {
                for (var j = 0; j < this.data.u[i].length; j++) {
                    var u = this.data.u[i][j];
                    if (u > maxU) { maxU = u; }
                }
            }
        }
        return maxU != 0 ? maxU : 1;
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

    calculateAxisMaxU() {
        var base = 10;
        if (this.properties && this.properties.u_axis && this.properties.u_axis.base) {
            base = this.properties.u_axis.base;
        }

        return this.calculateAxisMax(base, this.getMaxValueU());
    }

    getStyle(name, defaultStyle) {
        var style = getComputedStyle(this.element).getPropertyValue(name);
        if (style) {
            return style;
        }

        if (defaultStyle != false) {
            console.log(name + " style was not present in CSS, reverting to default of " + defaultStyle);
        }
        return defaultStyle;
    }

    // TODO: review the default values so that a graph with no styles looks OKish
    retrievePropertiesAndStyles() {
        if (this.properties) {
            this.graphDrawingMethod = this.properties.graph_drawing_method ? this.properties.graph_drawing_method : 'splines'
            if (this.properties.flags) {
                this.highLightEnabled = this.properties.flags.highlight_enabled ? true : false;
                this.scrollEnabled = this.properties.flags.scroll_enabled ? true : false;
                this.zoomEnabled = this.properties.flags.zoom_enabled ? true : false;
                this.graphGradientColour = this.properties.flags.graph_gradient_colour ? true : false;
                this.graphGradientHorizontal = this.properties.flags.graph_gradient_horizontal ? true : false;
                this.hideHorizontalAxis = this.properties.flags.hide_horizontal_axis ? true : false;
                this.hideVerticalAxes = this.properties.flags.hide_vertical_axes ? true : false;
                this.showDataPoints = this.properties.flags.show_data_points ? true : false;
            }
        } else {
            this.graphDrawingMethod = 'splines';
            this.highLightEnabled = false;
            this.scrollEnabled = false;
            this.zoomEnabled = false;
            this.graphGradientColour = false;
            this.graphGradientHorizontal = false;
            this.hideHorizontalAxis = false;
            this.hideVerticalAxes = false;
        }

        var verticalData = this.data.y;
        if (this.data.u) {
            verticalData = verticalData.concat(this.data.u);
        }

        this.defaultDataColour = '#000000';

        this.alphasBackground = this.getStyle('--alphas-background', 1);
        this.alphasUnderGraph = this.getStyle('--alphas-under-graph', 0.1);
        this.coloursBackground = this.getStyle('--colours-background', '#FFFFFF');
        this.coloursDataAxis = this.getStyle('--colours-data-axis', '#E0DEFF');
        this.coloursData = new Array();
        this.coloursDataStop = new Array();
        // TODO: alter this to continue looking until it can't find a contiguous number, for datasets that are not present at the start
        for (var i = 0; i < verticalData.length; i++) {
            var colour = this.getStyle('--colours-data-' + i, false);
            if (colour && colour != false) { this.coloursData.push(colour); }

            if (this.graphGradientColour) {
                var stopColour = this.getStyle('--colours-data-stop-' + i, false);
                if (stopColour && stopColour != false) { this.coloursDataStop.push(stopColour); }
            }
        }
        this.widthsData = this.getStyle('--widths-data', 1);

        if (!this.hideHorizontalAxis || !this.hideVerticalAxes) {
            this.coloursAxesLabels = this.getStyle('--colours-axes-labels', '#555555');
            this.coloursHorizontalLines = this.getStyle('--colours-horizontal-lines', '#EEEEEE');
            this.fontsAxesLabelsSize = this.getStyle('--fonts-axes-labels-size', 0);
            this.fontsAxesLabelsFamily = this.getStyle('--fonts-axes-labels-family', 'Arial');
            this.fontsAxesLabelsWeight = this.getStyle('--fonts-axes-labels-weight', 'normal');
        }

        if (this.highLightEnabled) {
            this.alphasInformationPanel = this.getStyle('--alphas-information-panel', 0.75);
            this.coloursHighlightIndicator = this.getStyle('--colours-highlight-indicator', '#FFFFFF');
            this.coloursInformationHeading = this.getStyle('--colours-information-heading', '#FFFFFF');
            this.coloursInformationPanel = this.getStyle('--colours-information-panel', '#333333');
            this.coloursInformationSentences = this.getStyle('--colours-information-sentences', '#FFFFFF');
            this.fontsInformationHeadingFamily = this.getStyle('--fonts-information-heading-family', 'Arial');
            this.fontsInformationHeadingSize = this.getStyle('--fonts-information-heading-size', 13);
            this.fontsInformationHeadingWeight = this.getStyle('--fonts-information-heading-weight', 'normal');
            this.fontsInformationSentencesFamily = this.getStyle('--fonts-information-sentences-family', 'Arial');
            this.fontsInformationSentencesSize = this.getStyle('--fonts-information-sentences-size', 13);
            this.fontsInformationSentencesWeight = this.getStyle('--fonts-information-sentences-weight', 'normal');
            this.radiiDataHighlightIndicator = this.getStyle('--radii-data-highlight-indicator', 4);
            this.radiiHighlightIndicator = this.getStyle('--radii-highlight-indicator', 2);
            this.radiiInformationPanelBorder = this.getStyle('--radii-information-panel-border', 10);
            this.widthsDataHighlightIndicator = this.getStyle('--widths-data-highlight-indicator', 4);
            this.widthsHighlightIndicator = this.getStyle('--widths-highlight-indicator', 2);
        }

        if (this.zoomEnabled) {
            this.alphasSelectionBox = this.getStyle('--alphas-selection-box', 0.25);
            this.coloursSelectionBox = this.getStyle('--colours-selection-box', '#0000FF');
        }

        if (this.showDataPoints) {
            this.alphasDataPoint = this.getStyle('--alphas-data-point', 0.25);
            this.coloursDataPointInner = this.getStyle('--colours-data-point-inner', '#FF0000');
            this.coloursDataPointOuter = this.getStyle('--colours-data-point-outer', '#0000FF');
            this.radiiDataPoint = this.getStyle('--radii-data-point', 2);
            this.widthsDataPoint = this.getStyle('--widths-data-point', 4);
        }
    }

    updateData(data, properties) {
        var cachedAxisMinX = this.axisMinX;
        var cachedAxisMaxX = this.axisMaxX;
        var cachedGraphScaleX = this.graphScaleX;

        if (typeof data === "string") {
            this.data = JSON.parse(data);
        } else {
            this.data = data;
        }
        this.properties = properties ? JSON.parse(properties) : this.properties
        this.calculateParameters();

        if (this.userDefinedViewPort) {
            this.axisMinX = cachedAxisMinX;
            this.axisMaxX = cachedAxisMaxX;
            this.graphScaleX = cachedGraphScaleX;
        }

        this.clearForeground();
        this.redraw();
    }

    addHorizontalData(data, properties) {
        var cachedAxisMinX = this.axisMinX;
        var cachedAxisMaxX = this.axisMaxX;
        var cachedGraphScaleX = this.graphScaleX;

        var parsedData = data;
        if (typeof data === "string") {
            parsedData = JSON.parse(data);
        }
        this.data.x = this.data.x.concat(parsedData.x);
        for (var i = 0; i < this.data.y.length; i++) {
            this.data.y[i] = this.data.y[i].concat(parsedData.y[i]);
        }
        if (parsedData.u) {
            for (var i = 0; i < this.data.u.length; i++) {
                this.data.u[i] = this.data.u[i].concat(parsedData.u[i]);
            }
        }
        this.properties = properties ? JSON.parse(properties) : this.properties
        this.calculateParameters();

        if (this.userDefinedViewPort) {
            this.axisMinX = cachedAxisMinX;
            this.axisMaxX = cachedAxisMaxX;
            this.graphScaleX = cachedGraphScaleX;
        }

        this.clearForeground();
        this.redraw();
    }

    addVerticalData(data, properties) {
        var cachedAxisMinX = this.axisMinX;
        var cachedAxisMaxX = this.axisMaxX;
        var cachedGraphScaleX = this.graphScaleX;

        var parsedData = data;
        if (typeof data === "string") {
            parsedData = JSON.parse(data);
        }
        this.data.names = this.data.names.concat(parsedData.names);
        this.data.y = this.data.y.concat(parsedData.y);
        if (parsedData.u) {
            this.data.u = this.data.u.concat(parsedData.u);
        }
        this.properties = properties ? JSON.parse(properties) : this.properties
        this.calculateParameters();

        if (this.userDefinedViewPort) {
            this.axisMinX = cachedAxisMinX;
            this.axisMaxX = cachedAxisMaxX;
            this.graphScaleX = cachedGraphScaleX;
        }

        this.clearForeground();
        this.redraw();
    }

    // TODO: test this with data sets covering different ranges
    calculateParameters() {
        this.axisMinX = 0;
        this.axisMaxX = this.data.x.length - 1;
        if (this.properties && this.properties.x_axis) {
            if (this.properties.x_axis.min) { this.axisMinX = this.properties.x_axis.min; };
            if (this.properties.x_axis.max) { this.axisMaxX = this.properties.x_axis.max; };
        }
        this.axisMinY = 0;
        this.axisMaxY = this.calculateAxisMaxY();
        if (this.properties && this.properties.y_axis) {
            if (this.properties.y_axis.min) { this.axisMinY = this.properties.y_axis.min; };
            if (this.properties.y_axis.max) { this.axisMaxY = this.properties.y_axis.max; };
        }
        this.axisRangeY = this.axisMaxY - this.axisMinY;

        if (this.data.u) {
            var axisMaxU = this.calculateAxisMaxU();
            this.graphScaleU = axisMaxU != 0 ? this.axisMaxY / axisMaxU : 1;
        }

        var greatestRadius = 0;
        if (this.highLightEnabled) {
            var dataHighlightIndicatorRadius = (parseFloat(this.radiiDataHighlightIndicator) / 2) + parseFloat(this.widthsDataHighlightIndicator);
            var highlightIndicatorRadius = (parseFloat(this.radiiHighlightIndicator) / 2) + parseFloat(this.widthsHighlightIndicator);
            greatestRadius = Math.max(dataHighlightIndicatorRadius, highlightIndicatorRadius);
        }
        if (this.showDataPoints) {
            var dataPointRadius = parseFloat(this.radiiDataPoint) + (parseFloat(this.widthsDataPoint) / 2);
            greatestRadius = Math.max(dataPointRadius, greatestRadius);
        }
        var greatestExtent = Math.max(parseFloat(this.widthsData) / 2, greatestRadius);

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
                this.graphStartY = Math.max(labelHeightApproximation, this.graphStartY);
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

                    if (this.data.u) {
                        var labelComponentsU = this.getLabelComponentsU(i / this.graphScaleU);
                        var labelWidthU = this.backgroundContext.measureText(this.grapheneHelper.applyAffix(labelComponentsU.value, this.getLabelPrefixU(), labelComponentsU.suffix)).width;
                        if (labelWidthU > maxLabelWidthU) {
                            maxLabelWidthU = labelWidthU;
                        }
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
            this.backgroundContext.lineTo(this.calculateAxisRangeX(), i * this.labelIntervalY);
        }

        this.backgroundContext.restore();
        this.backgroundContext.stroke();
    }

    createGraphStroke(colour, colourStop, alpha) {
        var graphStroke = null;
        if (this.graphGradientHorizontal) {
            graphStroke = this.backgroundContext.createLinearGradient(this.graphStartX, 0, this.graphEndX, 0);
            graphStroke.addColorStop(0, this.grapheneHelper.hex2rgba(colour, alpha));
            if (this.graphGradientColour) {
                graphStroke.addColorStop(1, this.grapheneHelper.hex2rgba(colourStop, alpha));
            } else {
                graphStroke.addColorStop(1, this.grapheneHelper.hex2rgba(colour, 0));
            }
        } else {
            graphStroke = colour;
        }
        return graphStroke;
    }

    createGraphFill(colour, colourStop, alpha) {
        var graphFill = null;
        if (this.graphGradientHorizontal) {
            graphFill = this.backgroundContext.createLinearGradient(this.graphStartX, 0, this.graphEndX, 0);
        } else {
            graphFill = this.backgroundContext.createLinearGradient(0, this.graphStartY, 0, this.graphEndY);
        }
        graphFill.addColorStop(0, this.grapheneHelper.hex2rgba(colour, alpha));
        if (this.graphGradientColour) {
            graphFill.addColorStop(1, this.grapheneHelper.hex2rgba(colourStop, alpha));
        } else {
            graphFill.addColorStop(1, this.grapheneHelper.hex2rgba(colour, 0));
        }
        return graphFill;
    }

    drawAreaUnderGraph(dataset, colour, colourStop, scale) {
        this.backgroundContext.fillStyle = this.createGraphFill(colour, colourStop, this.alphasUnderGraph);
        this.transformDrawingArea();

        this.backgroundContext.beginPath();

        this.backgroundContext.moveTo(0, this.axisMinY);

        var axisRangeX = this.calculateAxisRangeX();
        if (axisRangeX > 0) { this.backgroundContext.lineTo(0, dataset[this.axisMinX] * scale); }
        var points = new Array();
        for (var i = 0; i <= axisRangeX; i++) {
            points.push(i);
            points.push(dataset[this.axisMinX + i] * scale);
        }
        this.grapheneHelper.drawLines(this.graphDrawingMethod, this.backgroundContext, points);
        this.backgroundContext.lineTo(axisRangeX, this.axisMinY);

        this.backgroundContext.restore();
        this.backgroundContext.fill();
    }

    drawGraph(dataset, colour, colourStop, scale) {
        this.backgroundContext.strokeStyle = this.createGraphStroke(colour, colourStop, 1);
        this.backgroundContext.lineWidth = this.widthsData;
        this.transformDrawingArea();

        this.backgroundContext.beginPath();

        var axisRangeX = this.calculateAxisRangeX();
        if (axisRangeX > 0) { this.backgroundContext.moveTo(0, dataset[this.axisMinX] * scale); }
        var points = new Array();
        for (var i = 0; i <= axisRangeX; i++) {
            points.push(i);
            points.push(dataset[this.axisMinX + i] * scale);
        }
        this.grapheneHelper.drawLines(this.graphDrawingMethod, this.backgroundContext, points);

        this.backgroundContext.restore();
        this.backgroundContext.stroke();
    }

    drawDataPoints(dataset, scale) {
        this.backgroundContext.strokeStyle = this.grapheneHelper.hex2rgba(this.coloursDataPointOuter, this.alphasDataPoint);
        this.backgroundContext.lineWidth = this.widthsDataPoint;
        this.backgroundContext.fillStyle = this.coloursDataPointInner;

        var axisRangeX = this.calculateAxisRangeX();
        var points = new Array();
        for (var i = 0; i <= axisRangeX; i++) {
            points.push(i);
            points.push(dataset[this.axisMinX + i] * scale);
        }

        for (var i = 0; i < points.length; i += 2) {
            var xValue = this.graphStartX + (points[i] * this.graphScaleX)
            var yValue = this.graphStartY + (-(points[i + 1] - this.axisMaxY) * this.graphScaleY);

            this.backgroundContext.beginPath();
            this.backgroundContext.arc(xValue, yValue, this.radiiDataPoint, 0, 2 * Math.PI);
            this.backgroundContext.closePath();
            this.backgroundContext.stroke();
            this.backgroundContext.fill();
        }
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
        var availableWidthPerLabel = this.graphWidth / ((this.calculateAxisRangeX() + 1) / xAxisLabelInterval);
        var maxLabelWidthX = this.caclulateMaxLabelWidthX();
        while ((availableWidthPerLabel / maxLabelWidthX) < 3) {
            xAxisLabelInterval++;
            availableWidthPerLabel = this.graphWidth / ((this.calculateAxisRangeX() + 1) / xAxisLabelInterval);
        }

        this.backgroundContext.font = this.fontsAxesLabelsWeight + " " + this.fontsAxesLabelsSize + "px " + this.fontsAxesLabelsFamily;
        this.backgroundContext.fillStyle = this.coloursAxesLabels;
        this.backgroundContext.textAlign = "center";
        this.backgroundContext.textBaseline = "middle";

        for (var i = 0; i <= this.calculateAxisRangeX(); i += xAxisLabelInterval) {
            var xValue = this.data.x[this.axisMinX + i];
            var xText = this.axisFormatter ? this.axisFormatter(xValue, this.calculateAxisInterval(xAxisLabelInterval)) : xValue;
            this.backgroundContext.fillText(xText, this.graphStartX + (i * this.graphScaleX), this.graphEndY + (this.bottomMargin / 2));
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

            if (this.data.u) {
                var labelComponentsU = this.getLabelComponentsU(i / this.graphScaleU);
                this.backgroundContext.fillText(this.grapheneHelper.applyAffix(labelComponentsU.value, this.getLabelPrefixU(), labelComponentsU.suffix), this.graphEndX + (this.rightMargin / 2), this.graphEndY - ((i - this.axisMinY) * this.graphScaleY));
            }
        }
    }

    // TODO: change to a grabbing cursor when moving with the mouse down
    // TODO: change to a no entry style cursor when trying to move a graph that is already showing the full extent of its range
    scroll(differenceIndex) {
        var newAxisMinX = this.mouseDownAxisMinX - differenceIndex;
        var newAxisMaxX = this.mouseDownAxisMaxX - differenceIndex;

        if (newAxisMinX >= 0 && newAxisMaxX < this.data.x.length) {
            this.userDefinedViewPort = true;
            this.axisMinX = this.mouseDownAxisMinX - differenceIndex;
            this.axisMaxX = this.mouseDownAxisMaxX - differenceIndex;
            this.redraw();
            this.highlight(this.mouseMoveIndex);
            this.mouseDownDifferenceIndex = differenceIndex;
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

        for (var i = 0; i < dataHighlights.length; i++) {
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
        var verticalData = this.data.y;
        if (this.data.u) {
            verticalData = verticalData.concat(this.data.u);
        }

        this.foregroundContext.textAlign = "left";
        this.foregroundContext.font = this.fontsInformationHeadingWeight + " " + this.fontsInformationHeadingSize + "px " + this.fontsInformationHeadingFamily;

        var headingValue = this.data.x[this.axisMinX + index];
        var headingText = this.informationFormatter ? this.informationFormatter(headingValue) : headingValue;
        var sentences = new Array();
        var sentenceHeightApproximation = this.foregroundContext.measureText("M").width;
        var maxSentenceWidth = this.foregroundContext.measureText(headingText).width + (2 * sentenceHeightApproximation);
        this.foregroundContext.font = this.fontsInformationSentencesWeight + " " + this.fontsInformationSentencesSize + "px " + this.fontsInformationSentencesFamily;
        for (var i = 0; i < this.data.y.length; i++) {
            var labelComponents = this.getLabelComponentsY(this.data.y[i][this.axisMinX + index]);
            var formattedData = this.grapheneHelper.applyAffix(labelComponents.value, this.getLabelPrefixY(), labelComponents.suffix);
            var sentence = this.data.names[i] + ": " + formattedData;
            // space + circle + space + sentence + space (space and cricle are as wide as a sentence is tall)
            var sentenceWidth = this.foregroundContext.measureText(sentence).width + (4 * sentenceHeightApproximation);
            if (sentenceWidth > maxSentenceWidth) {
                maxSentenceWidth = sentenceWidth;
            }
            sentences.push(sentence);
        }

        if (this.data.u) {
            for (var i = 0; i < this.data.u.length; i++) {
                var labelComponents = this.getLabelComponentsU(this.data.u[i][this.axisMinX + index]);
                var formattedData = this.grapheneHelper.applyAffix(labelComponents.value, this.getLabelPrefixU(), labelComponents.suffix);
                var sentence = this.data.names[this.data.y.length + i] + ": " + formattedData;
                // space + circle + space + sentence + space (space and cricle are as wide as a sentence is tall)
                var sentenceWidth = this.foregroundContext.measureText(sentence).width + (4 * sentenceHeightApproximation);
                if (sentenceWidth > maxSentenceWidth) {
                    maxSentenceWidth = sentenceWidth;
                }
                sentences.push(sentence);
            }
        }

        var requiredWidth = maxSentenceWidth;
        // space + sentence + space + sentence + space + ... + sentence + space
        var requiredHeight = (((verticalData.length + 1) * 2) + 1) * sentenceHeightApproximation;
        var panelX = this.graphStartX + (index * this.graphScaleX) + (2 * sentenceHeightApproximation);
        var panelY = this.graphStartY + (this.graphHeight / 2) - (requiredHeight / 2);

        if ((panelX + requiredWidth) > (this.graphStartX + this.graphWidth)) {
            panelX = this.graphStartX + (index * this.graphScaleX) - (2 * sentenceHeightApproximation) - requiredWidth;
            if (panelX < this.graphStartX) {
                console.log("Information panel may be clipped horizontally!");
            }
        }

        if (requiredHeight > this.graphHeight) {
            console.log("Information panel may be clipped vertically!");
        }

        this.foregroundContext.fillStyle = this.grapheneHelper.hex2rgba(this.coloursInformationPanel, this.alphasInformationPanel);
        this.grapheneHelper.fillRoundedRect(this.foregroundContext, panelX, panelY, requiredWidth, requiredHeight, parseFloat(this.radiiInformationPanelBorder));

        var circleOffsetY = panelY + (3 * sentenceHeightApproximation);
        var sentenceOffsetY = panelY + (2 * sentenceHeightApproximation);

        this.foregroundContext.font = this.fontsInformationHeadingWeight + " " + this.fontsInformationHeadingSize + "px " + this.fontsInformationHeadingFamily;
        this.foregroundContext.fillStyle = this.coloursInformationHeading;
        this.foregroundContext.fillText(headingText, panelX + sentenceHeightApproximation, sentenceOffsetY);
        sentenceOffsetY += 2 * sentenceHeightApproximation;

        this.foregroundContext.font = this.fontsInformationSentencesWeight + " " + this.fontsInformationSentencesSize + "px " + this.fontsInformationSentencesFamily;
        for (var i = 0; i < sentences.length; i++) {
            this.foregroundContext.fillStyle = this.getDataColour(i);
            this.foregroundContext.fillRect(panelX + sentenceHeightApproximation, circleOffsetY, sentenceHeightApproximation, sentenceHeightApproximation);
            this.foregroundContext.fillStyle = this.coloursInformationSentences;
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

        var verticalValueMax = Infinity;
        for (var i = 0; i < this.data.y.length; i++) {
            var y = this.data.y[i][this.axisMinX + index];
            var yValue = this.graphStartY + (-(y - this.axisMaxY) * this.graphScaleY);
            dataHighlights.push({ x: this.graphStartX + (index * this.graphScaleX), y: yValue });
            if (yValue < verticalValueMax) {
                verticalValueMax = yValue;
            }
        }

        if (this.data.u) {
            for (var i = 0; i < this.data.u.length; i++) {
                var u = this.data.u[i][this.axisMinX + index];
                var uValue = this.graphStartY + (-((u * this.graphScaleU) - this.axisMaxY) * this.graphScaleY);
                dataHighlights.push({ x: this.graphStartX + (index * this.graphScaleX), y: uValue });
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
        var graphX = (offsetX - this.graphStartX) / this.graphScaleX;
        return Math.min(Math.max(Math.round(graphX), 0), this.calculateAxisRangeX());
    }

    drawSelectionBox() {
        this.clearForeground();

        var boxX = this.graphStartX + (this.shiftMouseDownStartIndex * this.graphScaleX);
        var boxWidth = (this.shiftMouseDownEndIndex - this.shiftMouseDownStartIndex) * this.graphScaleX;

        this.foregroundContext.fillStyle = this.grapheneHelper.hex2rgba(this.coloursSelectionBox, this.alphasSelectionBox);
        this.foregroundContext.fillRect(boxX, this.graphStartY, boxWidth, this.graphHeight);
    }

    handleMouseMove(event) {
        if (!this.drawn) { return; }

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
        if (!this.drawn) { return; }

        this.clearForeground();
        this.cancelMouseMove();
        this.cancelMouseDown();
        this.cancelShiftMouseDown();
    }

    handleMouseDown(event) {
        if (!this.drawn) { return; }

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
        if (!this.drawn) { return; }

        if (this.isShiftMouseDown) {
            if (this.zoomEnabled) {
                if (this.shiftMouseDownStartIndex != this.shiftMouseDownEndIndex) {
                    this.userDefinedViewPort = true;
                    var offsetAxisX = this.axisMinX;
                    if (this.shiftMouseDownStartIndex > this.shiftMouseDownEndIndex) {
                        this.axisMinX = offsetAxisX + this.shiftMouseDownEndIndex;
                        this.axisMaxX = offsetAxisX + this.shiftMouseDownStartIndex;
                    } else {
                        this.axisMinX = offsetAxisX + this.shiftMouseDownStartIndex;
                        this.axisMaxX = offsetAxisX + this.shiftMouseDownEndIndex;
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
        if (!this.drawn) { return; }

        // reset
        this.userDefinedViewPort = false;
        this.calculateParameters();
        this.clearForeground();
        this.redraw();
    }
}

if (typeof module !== "undefined") {
    module.exports = GrapheneLinegraph;
}
