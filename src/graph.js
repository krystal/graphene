class Graph {
  constructor(backgroundId, foregroundId, properties, data) {
      var background = document.getElementById(backgroundId);
      this.foreground = document.getElementById(foregroundId);
      this.canvasWidth = background.width;
      this.canvasHeight = background.height;
      this.backgroundContext = this.getContext(background);
      this.foregroundContext = this.getContext(this.foreground);

      this.properties = properties;
      this.data = data;
      this.draw();
  }

  getContext(canvas) {
      var devicePixelRatio = window.devicePixelRatio;
      canvas.width = this.canvasWidth * devicePixelRatio;
      canvas.height = this.canvasHeight * devicePixelRatio;
      canvas.style.width = this.canvasWidth + "px";
      canvas.style.height = this.canvasHeight + "px";
      var context = canvas.getContext('2d');
      context.scale(devicePixelRatio, devicePixelRatio);
      return context;
  }
}
