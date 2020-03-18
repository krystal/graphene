function convert(data) {
  var convertedData = {"x": [], "y": []};

  for (var i = 0; i < data.length; i++) {
    var yValues = [];
    for (var j = 0; j < data[i].length; j++) {
      if (i == 0) {
        var utcMilliseconds = data[i][j][0];
        var date = new Date(utcMilliseconds);
        convertedData.x.push(format(date));
      }
      yValues.push(data[i][j][1]);
    }
    convertedData.y.push(yValues);
  }

  return convertedData;
}

function format(date) {
  var hours = date.getUTCHours();
  var minutes = date.getUTCMinutes();

  return hours.toString().padStart(2, "0") + ":" + minutes.toString().padStart(2, "0");
}
