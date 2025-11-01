declare module 'expo-router' {
    export interface Router {
        push: (href: string) => void;
        replace: (href: string) => void;
        back: () => void;
        canGoBack: () => boolean;
    }

    export function useRouter(): Router;
    export function useSegments(): string[];
    export function useLocalSearchParams<T = Record<string, string>>(): T;
    export function useGlobalSearchParams<T = Record<string, string>>(): T;
    export function usePathname(): string;
    export function useSearchParams<T = Record<string, string>>(): T;

    export interface LinkProps {
        href: string;
        replace?: boolean;
        push?: boolean;
        children?: React.ReactNode;
        asChild?: boolean;
    }

    export const Link: React.ComponentType<LinkProps>;

    export interface StackProps {
        screenOptions?: Record<string, any>;
        children?: React.ReactNode;
    }

    export const Stack: React.ComponentType<StackProps>;

    export interface TabsProps {
        screenOptions?: Record<string, any>;
        children?: React.ReactNode;
    }

    export const Tabs: React.ComponentType<TabsProps>;

    export interface SlotProps {
        children?: React.ReactNode;
    }

    export const Slot: React.ComponentType<SlotProps>;
}
