export default function NoAccess() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-indigo-50 via-blue-50 to-sky-100 p-6">
      <div className="relative w-full max-w-lg">
        {/* Decorative background */}
        <div className="absolute -inset-4 -z-10 rounded-3xl bg-gradient-to-br from-indigo-200/60 to-sky-200/60 blur-2xl" />

        <div className="bg-white/90 backdrop-blur-xl border border-indigo-100 shadow-xl rounded-3xl px-8 py-10 text-center">
          {/* Icon */}
          <div className="mx-auto mb-6 w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white shadow-lg">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 11V7m0 8h.01M4.318 6.318a4.5 4.5 0 016.364 0L12 7.636l1.318-1.318a4.5 4.5 0 116.364 6.364L12 21l-7.682-7.682a4.5 4.5 0 010-6.364z" />
            </svg>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">Không có quyền truy cập</h1>
          <p className="text-gray-600 leading-relaxed mb-6">
            Tài khoản của bạn hiện chưa được cấp quyền vào trang quản trị.<br />
            Vui lòng liên hệ <span className="font-medium text-gray-800">Root</span> để được hỗ trợ.
          </p>

          <div className="flex items-center justify-center gap-3">
            <a
              href="/login"
              className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-medium shadow hover:bg-indigo-700 transition-colors"
            >
              Về trang đăng nhập
            </a>
            <a
              href="mailto:root@fafi.app"
              className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl border border-indigo-200 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition-colors"
            >
              Liên hệ hỗ trợ
            </a>
          </div>

          <div className="mt-6 text-xs text-gray-500">Mã lỗi: ACCESS_DENIED</div>
        </div>
      </div>
    </div>
  );
}
