export const cellSize = 10;
export const gridWidth = 200;
export const gridHeight = 200;

export const roundToNearestDot = (x: number, y: number, gridRef: any, zoomLevel: number) => {
    const { DotX, DotY } = getDotFromCursorPosition(x, y, gridRef, zoomLevel);
    return { x: DotX * cellSize - cellSize / 2, y: DotY * cellSize - cellSize / 2 };
}

export const getDotFromCursorPosition = (x: number, y: number, gridRef: any, zoomLevel: number) => {
    const { x: adjustedX, y: adjustedY } = accountForScroll(x, y, gridRef, zoomLevel);
    const DotX = Math.round(adjustedX / (cellSize * zoomLevel));
    const DotY = Math.round(adjustedY / (cellSize * zoomLevel));
    return { DotX, DotY };
}

export const getCellFromCursorPosition = (x: number, y: number, gridRef: any, zoomLevel: number) => {
    const { x: adjustedX, y: adjustedY } = accountForScroll(x, y, gridRef, zoomLevel);
    const gridX = Math.floor(adjustedX / (cellSize * zoomLevel));
    const gridY = Math.floor(adjustedY / (cellSize * zoomLevel));
    return { gridX, gridY };
};

export const accountForScroll = (x: number, y: number, gridRef: any, zoomLevel: number) => {
    return {
        x: gridRef.current ? x + gridRef.current.scrollLeft * zoomLevel : x,
        y: gridRef.current ? y + gridRef.current.scrollTop * zoomLevel : y,
    };
}
