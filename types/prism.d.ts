declare module 'prismjs/components/prism-core' {
  export function highlight(code: string, grammar: unknown): string;
  export const languages: Record<string, unknown> & { sql?: unknown };
}

declare module 'prismjs/components/prism-sql' {
  // Side-effect import for SQL language
}

declare module 'react-simple-code-editor' {
  import { ComponentType } from 'react';
  
  interface EditorProps {
    value: string;
    onValueChange: (value: string) => void;
    highlight: (code: string) => string;
    padding?: number;
    style?: React.CSSProperties;
    className?: string;
    disabled?: boolean;
    onKeyDown?: (e: React.KeyboardEvent) => void;
    onBlur?: () => void;
  }
  
  const Editor: ComponentType<EditorProps>;
  export default Editor;
}
