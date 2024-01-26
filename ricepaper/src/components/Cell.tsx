
const Cell = ({ x, y, size, color, displayBorders, onMouseEnter }) => {
    
    const style = {
        left: x,
        top: y,
        width: size,
        height: size,
        backgroundColor: color,
    };

    return (
    <div 
    className="cell" 
    style={style}
    onMouseEnter={onMouseEnter}
    >
    </div>
    );
};

export default Cell;
