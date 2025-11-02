// Small utilities to normalize unknown errors and detect network issues
export function getErrorMessage(err: unknown): string {
    if (!err) return 'An unexpected error occurred';
    if (typeof err === 'string') return err;
    if (err instanceof Error) return err.message;
    try {
        const anyErr = err as any;
        if (typeof anyErr.message === 'string') return anyErr.message;
        if (typeof anyErr.error === 'string') return anyErr.error;
        if (anyErr.response?.data?.message) return anyErr.response.data.message;
        if (typeof anyErr.toString === 'function') return anyErr.toString();
    } catch (e) {
        console.error('Error extracting error message:', e);
    }
    return 'An unexpected error occurred';
}

export function isNetworkError(err: unknown): boolean {
    if (!err) return false;
    
    // Check for common network error patterns
    const anyErr = err as any;
    if (anyErr.code === 'ECONNREFUSED' || anyErr.code === 'ENOTFOUND') return true;
    if (anyErr.name === 'NetworkError' || anyErr.name === 'TypeError') return true;
    if (!anyErr.response && anyErr.request) return true; // Axios network error
    
    const msg = getErrorMessage(err).toLowerCase();
    return msg.includes('network') || 
           msg.includes('fetch') || 
           msg.includes('unable to connect') || 
           msg.includes('timeout') ||
           msg.includes('connection');
}

export function isAuthError(err: unknown): boolean {
    const anyErr = err as any;
    if (anyErr.response?.status === 401 || anyErr.response?.status === 403) return true;
    
    const msg = getErrorMessage(err).toLowerCase();
    return msg.includes('unauthorized') || 
           msg.includes('authentication') || 
           msg.includes('token');
}

export default {
    getErrorMessage,
    isNetworkError,
};
