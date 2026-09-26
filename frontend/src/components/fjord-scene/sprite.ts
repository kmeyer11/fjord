/**
 * Draw ASCII-art pixel sprites. Each row is a string; each character maps to
 * a color in `colors`, and any character not in the map ('.' or ' ') is
 * transparent. Edit sprites right in the layer files.
 */
export function drawSprite(
  ctx: CanvasRenderingContext2D,
  rows: string[],
  colors: Record<string, string>,
  x: number,
  y: number,
  scale = 1,
  flip = false,
) {
  const width = rows[0].length
  rows.forEach((row, ry) => {
    for (let rx = 0; rx < row.length; rx++) {
      const c = colors[row[rx]]
      if (!c) continue
      ctx.fillStyle = c
      const px = flip ? width - 1 - rx : rx
      ctx.fillRect(Math.round(x) + px * scale, Math.round(y) + ry * scale, scale, scale)
    }
  })
}
