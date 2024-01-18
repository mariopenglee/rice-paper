// Token.tsx

import React from 'react';
import { Token as TokenType } from '../types';
import { motion } from 'framer-motion';
import { useDrag } from 'react-dnd';

interface TokenProps {
  token: TokenType;
  style: React.CSSProperties;
  onClick: () => void;
}

const Token: React.FC<TokenProps> = ({ token, style, onClick }) => {
  const [{ isDragging }, drag] = useDrag({
    type: 'token',
    item: { token },
    collect: monitor => ({
      isDragging: !!monitor.isDragging(),
    }),
  });

  return (
    <motion.div 
    className={`token ${isDragging ? 'dragging' : ''}`}
    style={{ ...style, 
      background: token.color,
      opacity: isDragging ? 0.5 : 1,
     }} 
    onClick={onClick}
    ref={drag}
    layoutId={`token-${token.id}`}

    ></motion.div>
  );
};

export default Token;