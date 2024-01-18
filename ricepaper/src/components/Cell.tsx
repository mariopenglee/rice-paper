
import React, {memo, useMemo, useCallback} from "react";
import { motion } from "framer-motion";
import Dot from "./Dot";


interface CellProps {
    rowIndex: number;
    columnIndex: number;
    cell: any;
    style: React.CSSProperties;
    displayBorders: boolean;
    handleDotClick: (rowIndex: number, colIndex: number, color: string) => void;
    selectedColor: string;
    moveToken: (index: number, rowIndex: number, colIndex: number) => void;
    tool: string;
    paintCell: (rowIndex: number, colIndex: number, color: string) => void;
}

const Cell = memo(({rowIndex, columnIndex, cell, style, displayBorders, handleDotClick, selectedColor, moveToken, tool, paintCell}: CellProps) => {
    const [mycolor, setColor] = React.useState(cell.color);
    
    const handleClick = useCallback(() => {
        if (tool === 'paintbrush') {
            console.log(cell + " " + rowIndex + " " + columnIndex);
            setColor(selectedColor);
        }
    }, [tool, selectedColor]);

    const handleMouseEnter = useCallback(() => {
        if (tool === 'paintbrush') {
            console.log(cell + " " + rowIndex + " " + columnIndex);
            setColor(selectedColor);
        }
    }, [tool, selectedColor]);


    return (
       
        <motion.div
        className="grid-cell"
        onClick={() => handleClick()}
        onMouseEnter={() => handleMouseEnter()}

        animate={{
            backgroundColor: mycolor,
        }}

        style={{
            ...style,
            backgroundColor: cell.color,
            border: displayBorders ? '0.5px solid #ccc' : 'none'
        }}

        whileHover={
                tool === 'paintbrush' ? {
                    backgroundColor: "#fff",
                } : {}
        }

    >
        <Dot
            rowIndex={rowIndex}
            colIndex={columnIndex}
            handleDotClick={handleDotClick}
            selectedColor={selectedColor}
            moveToken={moveToken}
            tool={tool}
        />
    </motion.div>
    )
})



export default Cell;