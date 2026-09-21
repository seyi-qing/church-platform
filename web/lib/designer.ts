export type DesignerBreakpoint = "desktop" | "tablet" | "mobile";

export type DesignerElement = {
  id: string;
  type: "text" | "image" | "button" | "box";
  x: number;
  y: number;
  width: number;
  height: number;
  props: Record<string, any>;
  /** Optional overrides per breakpoint */
  responsive?: Partial<
    Record<
      DesignerBreakpoint,
      Partial<Pick<DesignerElement, "x" | "y" | "width" | "height">>
    >
  >;
};

export const BREAKPOINT_WIDTH: Record<DesignerBreakpoint, number> = {
  desktop: 960,
  tablet: 768,
  mobile: 390,
};

export function newElement(type: DesignerElement["type"]): DesignerElement {
  return {
    id: `el_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    type,
    x: 40,
    y: 40,
    width: type === "text" ? 240 : 160,
    height: type === "text" ? 40 : 100,
    props:
      type === "text"
        ? { text: "Text" }
        : type === "button"
          ? { label: "Button", href: "/" }
          : type === "box"
            ? { color: "#e2e8f0" }
            : {},
  };
}

export function resolvedLayout(
  el: DesignerElement,
  bp: DesignerBreakpoint
): Pick<DesignerElement, "x" | "y" | "width" | "height"> {
  const o = el.responsive?.[bp];
  return {
    x: o?.x ?? el.x,
    y: o?.y ?? el.y,
    width: o?.width ?? el.width,
    height: o?.height ?? el.height,
  };
}
