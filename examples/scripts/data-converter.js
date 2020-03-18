function convert(data) {
  var convertedData = {"x": [], "y": []};

  for (var i = 0; i < data.length; i++) {
    var yValues = [];
    for (var j = 0; j < data[i].length; j++) {
      if (i == 0) {
        convertedData.x.push(data[i][j][0]);
      }
      yValues.push(data[i][j][1]);
    }
    convertedData.y.push(yValues);
  }

  return convertedData;
}
