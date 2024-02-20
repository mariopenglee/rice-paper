
import React from 'react';

interface DotProps {
    x: number;
    y: number;
    size: number;

}
const Dot = ({ x, y, size }: DotProps) => {

    return (

    <div 
    style={
        {
            position: 'absolute',
        left: `${x}px`,
        top: `${y}px`,
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: '50%',
        backgroundColor: 'gray',
        zIndex: 100,
        pointerEvents: 'none',
        }
    }

     />
     );
};

const MemoizedDot = React.memo(Dot, (prevProps, nextProps) => {
    const shouldRerender = prevProps.x !== nextProps.x || prevProps.y !== nextProps.y || prevProps.size !== nextProps.size;

    if (shouldRerender) {
      console.log('Re-rendering due to change in props:', { prevProps, nextProps });
    }
    return !shouldRerender;
  });
  export default MemoizedDot;