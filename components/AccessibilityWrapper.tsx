
import React from 'react';
import { View, ViewProps, AccessibilityProps } from 'react-native';

interface AccessibilityWrapperProps extends ViewProps {
  accessible?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  accessibilityRole?: AccessibilityProps['accessibilityRole'];
  children: React.ReactNode;
}

export const AccessibilityWrapper: React.FC<AccessibilityWrapperProps> = ({
  accessible = true,
  accessibilityLabel,
  accessibilityHint,
  accessibilityRole,
  children,
  ...props
}) => {
  return (
    <View
      accessible={accessible}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityRole={accessibilityRole}
      {...props}
    >
      {children}
    </View>
  );
};
