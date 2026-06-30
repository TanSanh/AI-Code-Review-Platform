export const SUPPORTED_LANGUAGES = [
  { id: 'typescript', name: 'TypeScript', extension: '.ts' },
  { id: 'javascript', name: 'JavaScript', extension: '.js' },
  { id: 'python', name: 'Python', extension: '.py' },
  { id: 'java', name: 'Java', extension: '.java' },
  { id: 'go', name: 'Go', extension: '.go' },
  { id: 'rust', name: 'Rust', extension: '.rs' },
  { id: 'php', name: 'PHP', extension: '.php' },
  { id: 'ruby', name: 'Ruby', extension: '.rb' },
] as const;

export type LanguageId = (typeof SUPPORTED_LANGUAGES)[number]['id'];

export const SEVERITY_CONFIG = {
  ERROR: { label: 'Error', color: '#ef4444', icon: '❌' },
  WARNING: { label: 'Warning', color: '#f59e0b', icon: '⚠️' },
  INFO: { label: 'Info', color: '#3b82f6', icon: 'ℹ️' },
  SUGGESTION: { label: 'Suggestion', color: '#8b5cf6', icon: '💡' },
} as const;

export const CATEGORY_CONFIG = {
  BUG: { label: 'Bug', color: '#ef4444', icon: '🐛' },
  SECURITY: { label: 'Security', color: '#dc2626', icon: '🔒' },
  PERFORMANCE: { label: 'Performance', color: '#f59e0b', icon: '⚡' },
  MAINTAINABILITY: { label: 'Maintainability', color: '#3b82f6', icon: '🔧' },
  STYLE: { label: 'Style', color: '#8b5cf6', icon: '🎨' },
} as const;
