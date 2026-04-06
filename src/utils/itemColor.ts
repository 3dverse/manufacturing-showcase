const ITEM_COLORS = [
    "#e57373", // red
    "#64b5f6", // blue
    "#81c784", // green
    "#ffb74d", // orange
    "#ba68c8", // purple
    "#4db6ac", // teal
    "#fff176", // yellow
    "#f06292", // pink
];

export function itemColor(itemId: string): string {
    let hash = 0;
    for (let i = 0; i < itemId.length; i++) hash = (hash * 31 + itemId.charCodeAt(i)) >>> 0;
    return ITEM_COLORS[hash % ITEM_COLORS.length];
}
