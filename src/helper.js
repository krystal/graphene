class GrapheneHelper {
  static applyAffix(value, prefix = "", suffix = "") {
    var negative = value < 0;
    var absoluteValue = Math.abs(value);

    return (negative ? "-" : "") + prefix + absoluteValue.toLocaleString() + suffix;
  }

  // TODO: add a function for calculating max width

  //https://stackoverflow.com/questions/21646738/convert-hex-to-rgba
  static hex2rgba(hex, alpha) {
    const [r, g, b] = hex.match(/\w\w/g).map(x => parseInt(x, 16));
    return `rgba(${r},${g},${b},${alpha})`;
  };

  static calculateFloorPowerOfTen(number) {
    return Math.pow(10, Math.floor(Math.log10(number)));
  }

  // TODO: find a solution for numbers < 1
  static calculateFactors(number) {
    var factors = new Array();
    var limit = Math.round(number / 2);

    for (var i = 1; i <= limit; i++) {
      if (number % i == 0) {
        factors.push(i);
      }
    }

    return factors;
  }

  static getContext(canvas) {
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
