import React from 'react';

const Dot = ({ x, y, size, cellSize }) => {

    const dotStyle = {
        position: 'absolute',
        left: `${x}px`,
        top: `${y}px`,
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: '50%',
        backgroundColor: 'gray',
        
    };


    return (

    <div 
    style={dotStyle}
    onClick={() => console.log('Dot clicked:', x, y)}

     />
     );
};

export default Dot;
