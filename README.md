# Graphene

Graphene is a JavaScript powered HTML5 Canvas based graphing library.

## Usage

In its simplest form, a graphene graph only requires three components, all of which are strings:

- type
- element id of the background layer
- data

There are two additional, optional components, both of which are strings:

- element id of the foreground layer
- properties

```
var graphComponentsArray = [{"type": "linegraph", "backgroundId": "foo-background", "foregroundId": "foo-foreground", "properties": "...", 'data': "..."}];

var grapheneEngine = new GrapheneEngine(graphComponentsArray);
```

### Type

Currently available graph types:

- linegraph

### Background layer

This is the HTML canvas element that the graph is drawn on.

### Data

The data string contains the raw data, in JSON format:

```
{
    "names": ["Dataset A","Dataset B","Dataset C"],
    "x":[["Q1", "2020 Q1"], ["Q2", "2020 Q2"], ["Q3", "2020 Q3"], ["Q4", "2020 Q4"]],
    "y":[[33, 66, 95, 50], [66, 80, 50, 33], [80, 50, 16, 66]]
}
```

### Foreground layer

This is the HTML canvas element that facilitates user interaction with the graph.

### Properties

The properties string controls advanced features of the graph, in JSON format:

```
{
    "flags": {
        "highlight_enabled": true,
        "scroll_enabled": true,
        "zoom_enabled": true
    },
    "y_axis": {
        "label_suffix": [[0, "%"]]
    }
}
```

## Styling

Colours, fonts, sizes, etc. can all be defined via CSS variables, graphene will look for styles that have been applied to the background layer element:

```
.graph_light_mode {
  --colours-background: #FFFFFF;
  ...
  --fonts-axes-labels-family: "Arial";
  ...
  --widths-data: 1;
}
```

## Example HTML

```
<div>
    <canvas class="graph_light_mode" width="960" height="320"></canvas>
    <canvas width="960" height="320"></canvas>
</div>
```

Putting this all together, produces the following graph:

![test.png](examples/images/test.png)
