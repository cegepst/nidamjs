/**
 * Parses "col:row" string into numeric values
 */
export function parseCoords(value) {
  if (!value) return null;
  const [col, row] = value.split(":").map(v => parseInt(v.trim(), 10));
  return (Number.isFinite(col) && Number.isFinite(row)) ? { col, row } : null;
}

/**
 * Calculates the grid column and row based on mouse coordinates and container dimensions
 */
export function calculateGridPosition(clientX, clientY, containerRect, gridConfig) {
  const { cols, rows } = gridConfig;
  const cellW = containerRect.width / cols;
  const cellH = containerRect.height / rows;

  const x = clientX - containerRect.left;
  const y = clientY - containerRect.top;

  let col = Math.floor(x / cellW) + 1;
  let row = Math.floor(y / cellH) + 1;

  // Clamp within grid boundaries
  col = Math.max(1, Math.min(col, cols));
  row = Math.max(1, Math.min(row, rows));

  return { col, row, posString: `${col}:${row}` };
}

/**
 * Checks if a specific position is already taken by another icon
 */
export function isPositionOccupied(icons, targetIcon, newPosString) {
  return Array.from(icons).some(icon => 
    icon !== targetIcon && icon.getAttribute("nd-icon") === newPosString
  );
}
