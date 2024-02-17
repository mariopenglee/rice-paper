import { useState } from "react";

interface CellProps {
    x: number;
    y: number;
    size: number;
    color: string;
    opacity?: number;
}


const Cell = ({ x, y, size, color, opacity = 1 }: CellProps) => {
    
    const style = {
        left: x,
        top: y,
        width: size,
        height: size,
        backgroundColor: color,
        opacity: opacity,
    };

    useState(() => {
        console.log('Cell rendered');
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
