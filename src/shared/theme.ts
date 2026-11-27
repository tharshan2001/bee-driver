/* Apple-inspired minimalist tokens for eBee Go */

export const colors = {
  /* Surfaces */
  background: '#FFFFFF',
  surface: '#F5F5F7',
  elevated: '#FFFFFF',

  /* Brand */
  primary: '#FFC107',
  primaryDeep: '#D4A000',
  primaryText: '#8A6100', // the brand yellow, dark enough for text on white
  primaryTint: '#FFF3CD',

  /* Status */
  success: '#2F6F4E',
  successTint: '#E1ECE3',
  warning: '#C97F1E',
  warningTint: '#F2E5CC',
  danger: '#B23A2E',
  dangerTint: '#F3E2DE',

  /* Text */
  textPrimary: '#1D1D1F',
  textSecondary: '#5F5F66',
  textTertiary: '#6E6E73',
  textOnPrimary: '#1D1D1F', // white on the yellow is unreadable outdoors

  /* Separator (hairline, rarely used) */
  separator: '#E5E5EA',

  /* Tab bar */
  tabActive: '#FFC107',
  tabInactive: '#6E6E73',
  tabBarBg: '#FFFFFF',

  /* Misc */
  overlay: 'rgba(0,0,0,0.35)',
  shadow: '#000000',

  /* Legacy aliases (keep for backward compat, will remove after screens update) */
  kraft: '#FFFFFF',
  paper: '#F5F5F7',
  border: '#E5E5EA',
  textMuted: '#6E6E73',
};
