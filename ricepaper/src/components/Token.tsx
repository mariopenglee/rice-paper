// Token.tsx

import React from 'react';
import { Token as TokenType } from '../types';

interface TokenProps {
  token: TokenType;
  // Add other props like onDragEnd, onResize, etc.
}

const Token: React.FC<TokenProps> = ({ token }) => {
    return (
        <div
        className="Token"
        style={{
            backgroundColor: token.color,
            width: token.width,
            height: token.height,
            left: token.x,
            top: token.y,
        }}
        />
    );
    
};

export default Token;
