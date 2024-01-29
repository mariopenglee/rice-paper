
const Cell = ({ x, y, size, color, opacity, zIndex }) => {
    
    const style = {
        left: x,
        top: y,
        width: size,
        height: size,
        backgroundColor: color,
        opacity: opacity,
        zIndex: zIndex,
    };

    return (
    <div 
    className="cell" 
    style={style}
    >
    </div>
    );
};

export default Cell;