export const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min

export const pick = (arr) => arr[Math.floor(Math.random() * arr.length)]

export const shuffle = (arr) =>
  arr
    .map((v) => [Math.random(), v])
    .sort((a, b) => a[0] - b[0])
    .map(([, v]) => v)

export const range = (n, start = 0) => Array.from({ length: n }, (_, i) => i + start)

/** Lays out `n` stars in neat centred rows inside a balloon (coords in a 120-wide box). */
export function starPositions(n, { cx = 60, cy = 74, perRow = 3, gapX = 23, gapY = 21 } = {}) {
  const rows = []
  let left = n
  while (left > 0) {
    const c = Math.min(perRow, left)
    rows.push(c)
    left -= c
  }
  const pos = []
  const top = cy - ((rows.length - 1) * gapY) / 2
  rows.forEach((count, r) => {
    for (let i = 0; i < count; i++) {
      pos.push({
        x: cx + (i - (count - 1) / 2) * gapX,
        y: top + r * gapY,
      })
    }
  })
  return pos
}

/** Non-overlapping-ish points for fireflies: a jittered grid. */
export function scatterGrid(n, { cols = 4, rows = 3, x0 = 10, x1 = 90, y0 = 14, y1 = 64 } = {}) {
  const cells = []
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      cells.push({
        x: x0 + ((x1 - x0) * (c + 0.5)) / cols + (Math.random() * 2 - 1) * 6,
        y: y0 + ((y1 - y0) * (r + 0.5)) / rows + (Math.random() * 2 - 1) * 5,
      })
    }
  }
  return shuffle(cells).slice(0, n)
}
