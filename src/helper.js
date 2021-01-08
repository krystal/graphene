class GrapheneHelper {
  applyAffix(value, prefix = "", suffix = "") {
    var negative = value < 0;
    var absoluteValue = Math.abs(value);

    return (negative ? "-" : "") + prefix + absoluteValue.toLocaleString() + suffix;
  }

  // TODO: add a function for calculating max width

  //https://stackoverflow.com/questions/21646738/convert-hex-to-rgba
  hex2rgba(hex, alpha) {
    const [r, g, b] = hex.match(/\w\w/g).map(x => parseInt(x, 16));
    return `rgba(${r},${g},${b},${alpha})`;
  };

  getBaseLog(x, y) {
    return Math.log(y) / Math.log(x);
  }

  calculateFloorPowerOfBase(base, number) {
    return Math.pow(base, Math.floor(this.getBaseLog(base, number)));
  }

  // TODO: find a solution for numbers < 1
  calculateFactors(number) {
    var lowerDivisors = new Array();
    for (var i = 1; i * i <= number; i++) {
      if (number % i == 0) {
        lowerDivisors.push(i);
      }
    }

    var startIndex = lowerDivisors.length - 1;
    if (lowerDivisors[startIndex] * lowerDivisors[startIndex] == number) {
      startIndex -= 1;
    }

    var upperDivisors = new Array();
    for (var i = startIndex; i >= 0; i--) {
      upperDivisors.push(number / lowerDivisors[i]);
    }

    return lowerDivisors.concat(upperDivisors);
  }

  getContext(canvas) {
    var canvasWidth = canvas.width;
    var canvasHeight = canvas.height;
    var devicePixelRatio = window.devicePixelRatio;
    canvas.width = canvasWidth * devicePixelRatio;
    canvas.height = canvasHeight * devicePixelRatio;
    canvas.style.width = canvasWidth + "px";
    canvas.style.height = canvasHeight + "px";
    var context = canvas.getContext('2d');
    context.scale(devicePixelRatio, devicePixelRatio);
    return context;
  }

  fillRoundedRect(context, x, y, w, h, borderRadius) {
    context.beginPath();
    context.moveTo(x + borderRadius, y);
    context.lineTo(x + w - borderRadius, y);
    context.quadraticCurveTo(x + w, y, x + w, y + borderRadius);
    context.lineTo(x + w, y + h - borderRadius);
    context.quadraticCurveTo(x + w, y + h, x + w - borderRadius, y + h);
    context.lineTo(x + borderRadius, y + h);
    context.quadraticCurveTo(x, y + h, x, y + h - borderRadius);
    context.lineTo(x, y + borderRadius);
    context.quadraticCurveTo(x, y, x + borderRadius, y);
    context.closePath();
    context.fill();
  }

  drawLines(type, context, points) {
    if (type == 'lines') {
      for (var i = 0; i < points.length; i += 2) {
        context.lineTo(points[i], points[i + 1]);
      }
    } else if (type == 'curves') {
      for (var i = 0; i < points.length; i += 2) {
        var x0 = points[i];
        var x1 = points[i + 2];
        var y0 = points[i + 1];
        var y1 = points[i + 3];
        var midPointX = (x0 + x1) / 2;
        var midPointY = (y0 + y1) / 2;
        var controlPointX1 = (midPointX + x0) / 2;
        var controlPointX2 = (midPointX + x1) / 2;

        context.quadraticCurveTo(controlPointX1, y0, midPointX, midPointY);
        context.quadraticCurveTo(controlPointX2, y1, x1, y1);
      }
    } else if (type == 'splines') {
      this.drawSpline(context, points, 0.33);
    }
  }

  //http://scaledinnovation.com/analytics/splines/aboutSplines.html
  getControlPoints(x0, y0, x1, y1, x2, y2, t) {
    //  x0,y0,x1,y1 are the coordinates of the end (knot) pts of this segment
    //  x2,y2 is the next knot -- not connected here but needed to calculate p2
    //  p1 is the control point calculated here, from x1 back toward x0.
    //  p2 is the next control point, calculated here and returned to become the
    //  next segment's p1.
    //  t is the 'tension' which controls how far the control points spread.

    //  Scaling factors: distances from this knot to the previous and following knots.
    var d01 = Math.sqrt(Math.pow(x1 - x0, 2) + Math.pow(y1 - y0, 2));
    var d12 = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));

    var fa = t * d01 / (d01 + d12);
    var fb = t - fa;

    var p1x = x1 + fa * (x0 - x2);
    var p1y = y1 + fa * (y0 - y2);

    var p2x = x1 - fb * (x0 - x2);
    var p2y = y1 - fb * (y0 - y2);

    return [p1x, p1y, p2x, p2y]
  }

  //http://scaledinnovation.com/analytics/splines/aboutSplines.html
  drawSpline(ctx, pts, t) {
    var cp = [];   // array of control points, as x0,y0,x1,y1,...
    var n = pts.length;

    // Draw an open curve, not connected at the ends
    for (var i = 0; i < n - 4; i += 2) {
      cp = cp.concat(this.getControlPoints(pts[i], pts[i + 1], pts[i + 2], pts[i + 3], pts[i + 4], pts[i + 5], t));
    }

    //  For open curves the first and last arcs are simple quadratics.
    ctx.quadraticCurveTo(cp[0], cp[1], pts[2], pts[3]);

    for (var i = 2; i < pts.length - 5; i += 2) {
      ctx.bezierCurveTo(cp[2 * i - 2], cp[2 * i - 1], cp[2 * i], cp[2 * i + 1], pts[i + 2], pts[i + 3]);
    }

    //  For open curves the first and last arcs are simple quadratics.
    ctx.quadraticCurveTo(cp[2 * n - 10], cp[2 * n - 9], pts[n - 2], pts[n - 1]);
  }

  calculateAverage(numbers) {
    var sum = 0;
    for (var i = 0; i < numbers.length; i++) {
      sum += numbers[i];
    }
    return sum / numbers.length;
  }

  // TODO: rename this to something more fitting
  calculateChange(numbersX, numbersY, meanX, meanY) {
    var sum = 0;
    for (var i = 0; i < numbersX.length; i++) {
      sum += (numbersX[i] - meanX) * (numbersY[i] - meanY);
    }
    return sum;
  }

  calculateLineOfBestFit(valuesX, valuesY) {
    var meanX = this.calculateAverage(valuesX);
    var meanY = this.calculateAverage(valuesY);

    var changeXY = this.calculateChange(valuesX, valuesY, meanX, meanY);
    var changeXX = this.calculateChange(valuesX, valuesX, meanX, meanX);

    var slope = changeXY / changeXX;
    var intercept = meanY - (slope * meanX)

    return {"slope": slope, "intercept": intercept};
  }

  // TODO: rename this to something more fitting
  getPointOnLine(x, slope, intercept) {
    return (slope * x) + intercept;
  }
}

if (typeof module !== "undefined") {
  module.exports = GrapheneHelper;
}
