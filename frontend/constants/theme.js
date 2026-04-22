// ============================================================
// DESIGN TOKENS — shared across all screens
// ============================================================
export const C = {
  // Backgrounds
  bg:       '#080c10',
  surface:  '#0f1620',
  surface2: '#16202e',
  surface3: '#1d2d40',
  // Accent
  teal:     '#00d4b0',
  tealDim:  'rgba(0,212,176,0.12)',
  tealGlow: 'rgba(0,212,176,0.25)',
  // Safety
  safe:     '#10d97e',
  safeDim:  'rgba(16,217,126,0.12)',
  caution:  '#f5a623',
  cautionDim:'rgba(245,166,35,0.12)',
  danger:   '#ff3b5c',
  dangerDim:'rgba(255,59,92,0.12)',
  // Text
  textPrimary:   '#f0f6ff',
  textSecondary: '#4e6d85',
  textTertiary:  '#2e4558',
  // Borders
  border:  'rgba(255,255,255,0.06)',
  borderMd:'rgba(255,255,255,0.10)',
};

export function safetyColor(score) {
  if (score >= 75) return C.safe;
  if (score >= 50) return C.caution;
  return C.danger;
}
