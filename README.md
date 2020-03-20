# Graphene

Graphene is a JavaScript powered HTML5 Canvas based graphing library.

# Usage

Graphene's engine searches for graphs by parsing all the `<div>` elements on a HTML page. A graphene graph requires a `<div>` with `type`, `properties` and `data` data attributes along with nested background and foreground canvases:

```
<div id="foo" data-type="linegraph" data-properties="<insert JSON>" data-data="<insert JSON>" style="position: relative;">
  <canvas id="foo-background" width="960" height="320"></canvas>
  <canvas id="foo-foreground" width="960" height="320" style="position: absolute; left: 0; top: 0; z-index: 0;"></canvas>
</div>
```

The id of the canvases should be the `<div>` id suffixed with `-background` or `-foreground` respectively. The graphs are drawn on the background canvas and the user interacts with them via the foreground canvas.

### Available graph types

- linegraph

### Properties

The `properties` JSON defines how a graph should be presented, here's an example:

```
{
    "colours": {
        "alphas": {
            "under_graph": 0.25
        },
        "axes_labels": "#000000",
        "background": "#FFFFFF",
        "data": [
            "#FF0000",
            "#00FF00",
            "#0000FF"
        ],
        "highlight_indicator": "#CCCCCC",
        "horizontal_lines": "#EEEEEE"
    },
    "fonts": {
        "axes_labels": {
            "family": "Arial",
            "size": 13
        }
    },
    "widths": {
        "data": 1
    },
    "flags": {
        "highlight_enabled": false
    },
    "x_axis": {
        "range": 3
    },
    "y_axis": {
        "min": 0,
        "max": 100,
        "label_interval": 10
    }
}
```

### Data

The `data` JSON contains the raw data, here's an example:

```
{
    "x": ["Q1", "Q2", "Q3", "Q4"],
    "y": [[33, 66, 80, 50], [66, 80, 50, 33], [80, 50, 33, 66]]
}
```
