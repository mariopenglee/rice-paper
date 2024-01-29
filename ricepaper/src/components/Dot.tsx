import React from 'react';

const Dot = ({ x, y, size }) => {

    const style = {
        position: 'absolute',
        left: `${x}px`,
        top: `${y}px`,
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: '50%',
        backgroundColor: 'gray'
    };

    return <div 
    style={style}

     />;
};

export default Dot;