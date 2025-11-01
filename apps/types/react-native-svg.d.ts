declare module 'react-native-svg' {
    import React from 'react';
    import { ViewStyle } from 'react-native';

    export interface SvgProps {
        width?: number | string;
        height?: number | string;
        viewBox?: string;
        fill?: string;
        stroke?: string;
        strokeWidth?: number;
        children?: React.ReactNode;
    }

    export interface PathProps {
        d: string;
        fill?: string;
        stroke?: string;
        strokeWidth?: number;
        strokeLinecap?: 'butt' | 'round' | 'square';
        strokeLinejoin?: 'miter' | 'round' | 'bevel';
    }

    export interface MaskProps {
        id: string;
        maskContentUnits?: string;
        x?: string;
        y?: string;
        width?: string;
        height?: string;
        children?: React.ReactNode;
    }

    export interface RectProps {
        x?: number | string;
        y?: number | string;
        width?: number | string;
        height?: number | string;
        fill?: string;
        stroke?: string;
        strokeWidth?: number | string;
        strokeOpacity?: number | string;
        rx?: number | string;
    }

    export interface GProps {
        mask?: string;
        children?: React.ReactNode;
    }

    export interface DefsProps {
        children?: React.ReactNode;
    }

    export interface LinearGradientProps {
        id: string;
        x1?: number | string;
        y1?: number | string;
        x2?: number | string;
        y2?: number | string;
        children?: React.ReactNode;
    }

    export interface StopProps {
        offset?: number | string;
        stopColor?: string;
        stopOpacity?: number | string;
    }

    export interface LineProps {
        x1?: number | string;
        y1?: number | string;
        x2?: number | string;
        y2?: number | string;
        stroke?: string;
        strokeWidth?: number | string;
    }

    export const Svg: React.ComponentType<SvgProps>;
    export const Path: React.ComponentType<PathProps>;
    export const Mask: React.ComponentType<MaskProps>;
    export const Rect: React.ComponentType<RectProps>;
    export const G: React.ComponentType<GProps>;
    export const Defs: React.ComponentType<DefsProps>;
    export const LinearGradient: React.ComponentType<LinearGradientProps>;
    export const Stop: React.ComponentType<StopProps>;
    export const Line: React.ComponentType<LineProps>;
}
