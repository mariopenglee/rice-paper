// Token.tsx

import React from 'react';
import { Token as TokenType } from '../types';

interface TokenProps {
  token: TokenType;
  zoom: number;
}

const Token: React.FC<TokenProps> = ({ token, zoom }) => {
    console.log(token);
    console.log(token.position);
    console.log(token.position.x);
    console.log(token.color);
    console.log(zoom)
  const style = {
    background: token.color,
    position: 'absolute',
    top: `${token.position.y - 1120 * zoom}px`,
    left: `${token.position.x - 1090 * zoom}px`,
    width: `${token.size.width * zoom}px`,
    height: `${token.size.height * zoom}px`,
    zIndex: 1,
    borderRadius: '50%',
    border: '1px solid black',
    boxSizing: 'border-box',

  };

    return (
        <div className="token" style={style}></div>
    );
};

export default Token;