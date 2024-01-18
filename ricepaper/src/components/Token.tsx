// Token.tsx

import React from 'react';
import { Token as TokenType } from '../types';


interface TokenProps {
  token: TokenType;
  style: React.CSSProperties;
  onClick: () => void;
}

const Token: React.FC<TokenProps> = ({ token, style, onClick }) => {
  return (
    <div className="token" style={{ ...style, background: token.color }} onClick={onClick}></div>
  );
};

export default Token;