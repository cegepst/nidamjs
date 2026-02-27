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

/**
 * Finds the nearest unoccupied grid cell using a spiral/radial search.
 */
export const findNearestAvailableSpot = (icons, targetCoords, maxCols, maxRows) => {
    const { col: startCol, row: startRow } = parseCoords(targetCoords);

    const maxDist = Math.max(maxCols, maxRows);

    for (let dist = 0; dist <= maxDist; dist++) {
        for (let dCol = -dist; dCol <= dist; dCol++) {
            for (let dRow = -dist; dRow <= dist; dRow++) {
                // Only check the "perimeter" of the current distance square
                if (Math.max(Math.abs(dCol), Math.abs(dRow)) !== dist) continue;

                const col = startCol + dCol;
                const row = startRow + dRow;

                if (col >= 1 && col <= maxCols && row >= 1 && row <= maxRows) {
                    const candidate = `${col}:${row}`;
                    if (!isPositionOccupied(icons, null, candidate)) {
                        return candidate;
                    }
                }
            }
        }
    }
    return targetCoords;
};
