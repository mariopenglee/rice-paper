
import React, {memo} from "react";
import { motion } from "framer-motion";
import { useDrop } from "react-dnd";

interface DotProps {
    rowIndex: number;
    colIndex: number;
    handleDotClick: (rowIndex: number, colIndex: number, color: string) => void;
    selectedColor: string;
    moveToken: (index: number, rowIndex: number, colIndex: number) => void;
    tool: string;
}

const Dot = memo(({rowIndex, colIndex, handleDotClick, selectedColor, moveToken, tool}: DotProps) => {
    const [{ isOver }, drop] = useDrop(() => ({
        accept: 'token',
        drop: (item: any) => {
            console.log('item', item);
            console.log('item.token.id', item.token.id);
            moveToken(item.token.id, rowIndex, colIndex);
        },
        collect: monitor => ({
            isOver: !!monitor.isOver(),
        }),


    }));

    return (
        <motion.div
        className={`dot ${isOver ? 'dragging' : ''}`}
        ref={drop}
        onClick={() => handleDotClick(rowIndex, colIndex, selectedColor)}
        style={{
            position: 'absolute',
            top: `${tool === 'paintbrush' ? '-1px' : '-15px'}`,
            left: `${tool === 'paintbrush' ? '-1px' : '-15px'}`,
            width: `${tool === 'paintbrush' ? 'fit-content' : '30px'}`,
            height: `${tool === 'paintbrush' ? 'fit-content' : '30px'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            
        }}
        whileHover={{ 
            scale: 1.5 }}
        
    >
         <motion.div
            className="dot"
            style={{
                width: `${2}px`,
                height: `${2}px`,
                backgroundColor: '#000',
                borderRadius: '50%',
            }}
            
        />
        </motion.div>
    );
    })


export default Dot;