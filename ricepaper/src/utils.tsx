export const cellSize = 30;

export const roundToNearestDot = (x: number, y: number, gridRef: any) => {
    const { DotX, DotY } = getDotFromCursorPosition(x, y, gridRef);
    return { x: DotX * cellSize - cellSize / 2, y: DotY * cellSize - cellSize / 2 };
}

export const getDotFromCursorPosition = (x: number, y: number, gridRef: any) => {
    const { x: adjustedX, y: adjustedY } = accountForScroll(x, y, gridRef);
    const DotX = Math.round(adjustedX / cellSize);
    const DotY = Math.round(adjustedY / cellSize);
    return { DotX, DotY };
}


export const getCellFromCursorPosition = (x: number, y: number, gridRef: any) => {
    const {x: adjustedX, y: adjustedY} = accountForScroll(x, y, gridRef);
    const gridX = Math.floor(adjustedX / cellSize);
    const gridY = Math.floor(adjustedY / cellSize);
    return { gridX, gridY };
};


export const accountForScroll = (x: number, y: number, gridRef: any) => {
    return {
        x: gridRef.current ? x + gridRef.current.scrollLeft : x,
        y: gridRef.current ? y + gridRef.current.scrollTop : y,
    };
}


