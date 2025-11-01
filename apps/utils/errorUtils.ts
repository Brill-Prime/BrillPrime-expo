// Small utilities to normalize unknown errors and detect network issues
export function getErrorMessage(err: unknown): string {
    if (!err) return 'An unexpected error occurred';
    if (typeof err === 'string') return err;
    if (err instanceof Error) return err.message;
    try {
        const anyErr = err as any;
        if (typeof anyErr.message === 'string') return anyErr.message;
        if (typeof anyErr.error === 'string') return anyErr.error;
        if (typeof anyErr.toString === 'function') return anyErr.toString();
    } catch (e) {
        // fallthrough
    }
    return 'An unexpected error occurred';
}

export function isNetworkError(err: unknown): boolean {
    const msg = getErrorMessage(err).toLowerCase();
    return msg.includes('network') || msg.includes('fetch') || msg.includes('unable to connect') || msg.includes('timeout');
}

export default {
    getErrorMessage,
    isNetworkError,
};
