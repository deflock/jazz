export type IdentifierScope = 'global' | 'local';

export type EvaluationScope = 'preprocess' | 'css' | 'modular-css';

export const topLevelExtension = '.mcss';

export const extensions = [
  `.global${topLevelExtension}`,
  `.module${topLevelExtension}`,
  topLevelExtension,
];

export function inferIdenifierScope(filename: string): IdentifierScope {
  return filename.endsWith(`.global${topLevelExtension}`) ? 'global' : 'local';
}

export function inferEvaluationScope(filename: string): EvaluationScope {
  if (filename.endsWith('.module.css')) return 'modular-css';
  if (filename.endsWith('.css')) return 'css';

  return 'preprocess';
}