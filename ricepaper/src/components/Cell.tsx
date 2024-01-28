
const Cell = ({ x, y, size, color, opacity }) => {
    
    const style = {
        left: x,
        top: y,
        width: size,
        height: size,
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

export default Cell;
