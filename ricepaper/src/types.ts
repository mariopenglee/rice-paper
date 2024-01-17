// types.ts
interface Token {
    id: string;
    name: string;
    position: { x: number; y: number };
    size: { width: number; height: number };
    color: string;
  }
  
  interface GridCell {
    color: string;
    occupied: boolean;
  }
  