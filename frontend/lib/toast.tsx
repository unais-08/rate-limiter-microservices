import toast, { Toaster } from 'react-hot-toast';

type ToastType = "success" | "error" | "warning" | "info";

// Unified toast function that works everywhere
export const showToast = (message: string, type: ToastType = "info") => {
  const options = {
    duration: 4000,
    position: 'top-right' as const,
    style: {
      background: '#fff',
      color: '#333',
      padding: '16px',
      borderRadius: '8px',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    },
  };

  switch (type) {
    case 'success':
      toast.success(message, {
        ...options,
        icon: '✅',
        style: {
          ...options.style,
          border: '1px solid #10b981',
        },
      });
      break;
    case 'error':
      toast.error(message, {
        ...options,
        icon: '❌',
        style: {
          ...options.style,
          border: '1px solid #ef4444',
        },
      });
      break;
    case 'warning':
      toast(message, {
        ...options,
        icon: '⚠️',
        style: {
          ...options.style,
          border: '1px solid #f59e0b',
        },
      });
      break;
    case 'info':
    default:
      toast(message, {
        ...options,
        icon: 'ℹ️',
        style: {
          ...options.style,
          border: '1px solid #3b82f6',
        },
      });
      break;
  }
};

// Export Toaster component for app-wide usage
export { Toaster };
