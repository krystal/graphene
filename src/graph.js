class GrapheneGraph {
  constructor(backgroundId, foregroundId, properties, data) {
      this.background = document.getElementById(backgroundId);
      this.foreground = document.getElementById(foregroundId);
      this.canvasWidth = this.background.width;
      this.canvasHeight = this.background.height;
      this.backgroundContext = GrapheneHelper.getContext(this.background);
      if (this.foreground) {
        this.foregroundContext = GrapheneHelper.getContext(this.foreground);
      }
      
      this.properties = properties ? JSON.parse(properties) : null;
      this.data = JSON.parse(data);
      this.draw();
  }
}
