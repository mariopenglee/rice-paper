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

export default Dot;
