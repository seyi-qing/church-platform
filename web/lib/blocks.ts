export type BlockType = "hero" | "text" | "image" | "sermons" | "events" | "give_cta" | "columns";

export type Block = {
  id: string;
  type: BlockType;
  data: Record<string, any>;
};

export function newBlock(type: BlockType): Block {
  const id = `b_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const defaults: Record<BlockType, Record<string, any>> = {
    hero: { title: "Welcome", subtitle: "Join us this Sunday", cta: "Watch Live", ctaHref: "/live" },
    text: { html: "<p>Write your content here.</p>" },
    image: { src: "", alt: "" },
    sermons: { limit: 3 },
    events: { limit: 3 },
    give_cta: { title: "Give", body: "Support the mission", href: "/give" },
    columns: { left: "", right: "" },
  };
  return { id, type, data: defaults[type] };
}

export function parseBlocks(content: string | null): Block[] {
  if (!content) return [];
  try {
    const parsed = JSON.parse(content);
    if (Array.isArray(parsed)) return parsed;
  } catch {
    return [{ id: "legacy", type: "text", data: { html: content } }];
  }
  return [];
}

export function serializeBlocks(blocks: Block[]): string {
  return JSON.stringify(blocks);
}
