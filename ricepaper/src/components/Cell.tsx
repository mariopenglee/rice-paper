import { useState } from "react";

interface CellProps {
    x: number;
    y: number;
    size: number;
    color: string;
    opacity: number;
    zIndex: number;
    pointerEvents: string;
}


const Cell = ({ x, y, size, color, opacity, zIndex, pointerEvents }: CellProps) => {
    
    const style = {
        left: x,
        top: y,
        width: size,
        height: size,
        backgroundColor: color,
        opacity: opacity,
        zIndex: zIndex,
        pointerEvents: pointerEvents,
    };

    useState(() => {
    }
    );

    return (
    <div 
    className="cell" 
    style={style}
    >
    </div>
    );
};
export default Cell;
