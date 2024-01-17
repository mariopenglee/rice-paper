// types.ts
interface Token {
    id: string;
    name: string;
    position: { x: number; y: number };
    size: { width: number; height: number };
  }
  
  interface GridCell {
    color: string;
    occupied: boolean;
  }
  