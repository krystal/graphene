function convertArray(data) {
  var convertedData = {"names": [], "x": [], "y": []};

  for (var i = 0; i < data.length; i++) {
    convertedData.names.push("CPU " + i);
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

function convertObject(data) {
  var convertedData = {"names": [], "x": [], "y": []};

  var firstIteration = true;
  for (const key in data) {
    convertedData.names.push(key);
    var yValues = [];
    for (var j = 0; j < data[key].length; j++) {
      if (firstIteration) {
        convertedData.x.push(data[key][j][0]);
      }
      yValues.push(data[key][j][1]);
    }
    convertedData.y.push(yValues);
    firstIteration = false;
  }

  return convertedData;
}
