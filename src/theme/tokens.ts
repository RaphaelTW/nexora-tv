export const colors = {
  black: '#000000',
  panel: '#070707',
  panelElevated: '#0D0D0D',
  text: '#F7F7F7',
  muted: '#969696',
  subtle: '#1A1A1A',
  purple: '#7C3AED',
  violet: '#A855F7',
  green: '#00E676',
  lime: '#7CFF6B',
  red: '#FF4D67',
  amber: '#FFC857',
  cyan: '#00E5FF'
} as const;

export const gradients = {
  brand: [colors.purple, colors.violet, colors.green] as const,
  rgb: ['#FF2D55', '#8B5CF6', '#00E5FF', '#00E676', '#FF2D55'] as const
};

export const radius = {
  sm: 10,
  md: 16,
  lg: 24,
  xl: 34,
  pill: 999
};

export const spacing = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48
};
