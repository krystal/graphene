class GrapheneGraph {
  constructor(backgroundId, foregroundId, properties, data) {
      this.background = document.getElementById(backgroundId);
      this.foreground = document.getElementById(foregroundId);
      this.canvasWidth = this.background.width;
      this.canvasHeight = this.background.height;
      this.backgroundContext = this.getContext(this.background);
      if (this.foreground) {
        this.foregroundContext = this.getContext(this.foreground);
      }
      
      this.properties = properties ? JSON.parse(properties) : null;
      this.data = JSON.parse(data);
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
