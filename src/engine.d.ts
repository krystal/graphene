declare module "krystal-graphene" {
  type Marker = [number, string];
  type LabelSuffix = [number, string];
  type AxisFormatter = (value: string | number, interval: number) => string;
  type InformationFormatter = (value: string | number) => string;

  /* Data */

  export type Data = {
    x: string[] | number[];
    y?: number[][];
    u?: number[][];
    names:
      | {
          x?: string[];
          y?: string[];
          u?: string[];
        }
      | string[];
  };

  /* Shared Properties */

  type Flags = {
    highlight_enabled?: boolean;
    hide_horizontal_axis?: boolean;
    hide_vertical_axes?: boolean;
  };

  type XAxis = {
    min?: number;
    max?: number;
    markers?: Marker[];
  };

  type YAxis = {
    base?: number;
    min?: number;
    max?: number;
    label_prefix?: string;
    label_suffix?: LabelSuffix[];
  };

  type UAxis = {
    base?: number;
    label_prefix?: string;
    label_suffix?: LabelSuffix[];
    decimal_places?: number;
  };

  /* Linegraph Properties */

  export type LinegraphProperties = {
    flags?: Flags & {
      graph_gradient_colour?: boolean;
      graph_gradient_horizontal?: boolean;
      scroll_enabled?: boolean;
      show_data_points?: boolean;
      zoom_enabled?: boolean;
    };

    x_axis?: XAxis;
    y_axis?: YAxis;
    u_axis?: UAxis;

    graph_drawing_method?: "lines" | "curves" | "splines";
  };

  /* Bargraph Properties */

  export type BargraphProperties = {
    flags?: Flags & {
      draw_lines_of_best_fit?: boolean;
    };

    x_axis?: XAxis & {
      projected_index?: number;
    };

    y_axis?: YAxis;

    u_axis?: UAxis & {
      offset_index?: number;
    };
  };

  class GrapheneLinegraph {}
  class GrapheneBargraph {}

  class GrapheneEngine {
    constructor();

    addLinegraph(
      element: HTMLElement,
      properties: LinegraphProperties | string,
      data: Data | string,
      axisFormatter: AxisFormatter | null,
      informationFormatter: InformationFormatter | null
    ): GrapheneLinegraph;

    addBargraph(
      element: HTMLElement,
      properties: BargraphProperties | string,
      data: Data | string,
      axisFormatter: AxisFormatter | null,
      informationFormatter: InformationFormatter | null
    ): GrapheneBargraph;

    render(): void;

    getGraph(element: HTMLElement): GrapheneLinegraph | GrapheneBargraph;

    removeGraph(element: HTMLElement): void;
  }

  export default GrapheneEngine;
}
