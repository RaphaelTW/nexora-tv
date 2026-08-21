import React, { useRef, useState } from 'react';
import { Animated, Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';

type FocusCardProps = Omit<PressableProps, 'children' | 'style'> & {
  children: React.ReactNode | ((state: { focused: boolean }) => React.ReactNode);
  style?: StyleProp<ViewStyle>;
};

export function FocusCard({ children, style, onFocus, onBlur, ...props }: FocusCardProps) {
  const [focused, setFocused] = useState(false);
  const scale = useRef(new Animated.Value(1)).current;

  const animate = (toValue: number) => Animated.spring(scale, {
    toValue,
    useNativeDriver: true,
    friction: 8,
    tension: 90
  }).start();

  return (
    <Pressable
      {...props}
      focusable
      onFocus={(event) => {
        setFocused(true);
        animate(1.035);
        onFocus?.(event);
      }}
      onBlur={(event) => {
        setFocused(false);
        animate(1);
        onBlur?.(event);
      }}
    >
      <Animated.View style={[style, { transform: [{ scale }] }]}>
        {typeof children === 'function' ? children({ focused }) : children}
      </Animated.View>
    </Pressable>
  );
}
