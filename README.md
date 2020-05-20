# Graphene

Graphene is a JavaScript powered HTML5 Canvas based graphing library.

## Installation

Install `graphene` via [NPM](https://www.npmjs.com):

`npm install graphene`

## Usage

Import the graphene library:

`import Graphene from 'graphene'`

Create a new instance of the graphene engine:

`var grapheneEngine = new Graphene();`

Then add graphs to it:

`var linegraph = grapheneEngine.addLinegraph(element, properties, data);`

Where `element` is the HTML element that the graph is to be positioned in and `properties` and `data` are JSON strings. Refer to the [properties](https://github.com/krystal/graphene/wiki/Properties) and [data](https://github.com/krystal/graphene/wiki/Data) documentation for more information.

### Example properties

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

### Example data

```
{
    "names": ["Dataset A","Dataset B","Dataset C"],
    "x":[["Q1", "2020 Q1"], ["Q2", "2020 Q2"], ["Q3", "2020 Q3"], ["Q4", "2020 Q4"]],
    "y":[[33, 66, 95, 50], [66, 80, 50, 33], [80, 50, 16, 66]]
}
```

## Styles

Colours, fonts, sizes, etc. can all be defined via CSS variables, graphene will look for styles that have been applied to the supplied HTML element. Refer to the [styles](https://github.com/krystal/graphene/wiki/Styles) documentation for more information.

### Example styles

```
.graph_light_mode {
  --colours-background: #FFFFFF;
  ...
  --fonts-axes-labels-family: "Arial";
  ...
  --widths-data: 1;
}
```

## HTML

Simply add a HTML element to your page, graphene will inherit the dimensions of this element.

### Example HTML

```
<div class="graph_light_mode" width="960" height="320"></div>
```

When everything is in place, it is time to draw:

`grapheneEngine.render()`

Putting together all this example code produces the following graph:

![test.png](examples/images/test.png)
