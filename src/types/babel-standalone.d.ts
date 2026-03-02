declare module '@babel/standalone' {
  export interface TransformOptions {
    presets?: string[];
    plugins?: string[];
    filename?: string;
    sourceType?: 'script' | 'module';
    ast?: boolean;
    code?: boolean;
    minified?: boolean;
    compact?: boolean | 'auto';
    comments?: boolean;
    retainLines?: boolean;
  }

  export interface TransformResult {
    code: string | null;
    ast: any | null;
    map: any | null;
  }

  export function transform(
    code: string,
    options?: TransformOptions
  ): TransformResult;
}




