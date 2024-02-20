import { cellSize } from "../utils";
import React from 'react';

interface CellProps {
    x: number;
    y: number;
    color: string;
    opacity?: number;
}


const Cell = ({ x, y, color, opacity = 1 }: CellProps) => {
    
    const style = {
        left: x,
        top: y,
        width: cellSize,
        height: cellSize,
        backgroundColor: color,
        opacity: opacity,
    };


    return (
    <div 
    className="cell" 
    style={style}
    >
    </div>
    );
};
 
const MemoizedCell = React.memo(Cell, (prevProps, nextProps) => {
    const shouldRerender = prevProps.x !== nextProps.x ||
     prevProps.y !== nextProps.y || 
     prevProps.color !== nextProps.color || 
     prevProps.opacity !== nextProps.opacity;

    if (shouldRerender) {
      console.log('Re-rendering due to change in props:', { prevProps, nextProps });
    }
    return !shouldRerender;
  }
    );

export default MemoizedCell;