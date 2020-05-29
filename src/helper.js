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
}

if (typeof module !== "undefined") {
  module.exports = GrapheneHelper;
}
