import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

let openDialog = null;

export const ConfirmDialog = () => {
  const [state, setState] = React.useState({
    isOpen: false,
    title: 'Xác nhận',
    message: '',
    onConfirm: null,
    onCancel: null
  });

  React.useEffect(() => {
    openDialog = setState;
    return () => {
      openDialog = null;
    };
  }, []);

  const handleConfirm = () => {
    if (state.onConfirm) {
      state.onConfirm();
    }
    setState({ ...state, isOpen: false });
  };

  const handleCancel = () => {
    if (state.onCancel) {
      state.onCancel();
    }
    setState({ ...state, isOpen: false });
  };

  if (!state.isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 transform transition-all animate-in fade-in">
        <div className="p-6">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {state.title}
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                {state.message}
              </p>
              <div className="flex justify-end gap-2">
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Hủy
                </button>
                <button
                  onClick={handleConfirm}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Xác nhận
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const confirm = (message, options = {}) => {
  return new Promise((resolve) => {
    const title = options.title || 'Xác nhận';
    openDialog({
      isOpen: true,
      title,
      message,
      onConfirm: () => resolve(true),
      onCancel: () => resolve(false)
    });
  });
};

