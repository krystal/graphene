class Helper {
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
}
