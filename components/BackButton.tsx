
import React from "react";
import { TouchableOpacity, StyleSheet, ViewStyle } from "react-native";
import { useRouter } from "expo-router";
import { SvgXml } from "react-native-svg";

// SVG content from the back_arrow.svg file
const backArrowSvg = `
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<mask id="mask0_1_1229" style="mask-type:alpha" maskUnits="userSpaceOnUse" x="0" y="0" width="24" height="24">
<rect width="24" height="24" fill="#D9D9D9"/>
</mask>
<g mask="url(#mask0_1_1229)">
<path d="M7.825 13L13.425 18.6L12 20L4 12L12 4L13.425 5.4L7.825 11H20V13H7.825Z" fill="#1C1B1F"/>
</g>
</svg>
`;

interface BackButtonProps {
  onPress?: () => void;
  style?: ViewStyle;
  size?: number;
  color?: string;
}

export default function BackButton({ 
  onPress, 
  style, 
  size = 24, 
  color = "#1C1B1F" 
}: BackButtonProps) {
  const router = useRouter();

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.back();
    }
  };

  // Replace the fill color in the SVG
  const customSvg = backArrowSvg.replace('fill="#1C1B1F"', `fill="${color}"`);

  return (
    <TouchableOpacity style={[styles.button, style]} onPress={handlePress}>
      <SvgXml xml={customSvg} width={size} height={size} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
});
