import { useState } from "react";

interface CellProps {
    x: number;
    y: number;
    size: number;
    color: string;
}


const Cell = ({ x, y, size, color }: CellProps) => {
    
    const style = {
        left: x,
        top: y,
        width: size,
        height: size,
        backgroundColor: color,
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
