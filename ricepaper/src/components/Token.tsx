// Token.tsx

import React from 'react';
import { Token as TokenType } from '../types';
import { motion } from 'framer-motion';

interface TokenProps {
  token: TokenType;
  style: React.CSSProperties;
  onClick: () => void;
}

const Token: React.FC<TokenProps> = ({ token, style, onClick }) => {

  return (
    <motion.div 
    className={`token token-${token.id}`}
    style={{ ...style, 
      background: token.color,
     }} 
    onClick={onClick}
    layoutId={`token-${token.id}`}

    ></motion.div>
  );
};

export default Token;