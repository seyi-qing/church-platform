export type DesignerElement = {
  id: string;
  type: "text" | "image" | "button" | "box";
  x: number;
  y: number;
  width: number;
  height: number;
  props: Record<string, any>;
};

export function newElement(type: DesignerElement["type"]): DesignerElement {
  return {
    id: `el_${Date.now()}`,
    type,
    x: 40,
    y: 40,
    width: type === "text" ? 240 : 160,
    height: type === "text" ? 40 : 100,
    props: type === "text" ? { text: "Text" } : type === "button" ? { label: "Button", href: "/" } : {},
  };
}
