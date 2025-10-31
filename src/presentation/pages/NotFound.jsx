export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-fuchsia-50 via-indigo-50 to-sky-100 p-6">
      <div className="relative w-full max-w-3xl text-center">
        <div className="absolute -inset-6 -z-10 bg-gradient-to-tr from-fuchsia-200/50 via-indigo-200/50 to-sky-200/50 blur-3xl rounded-[3rem]" />

        <div className="bg-white/90 backdrop-blur-xl border border-indigo-100 shadow-xl rounded-[2rem] px-10 py-14">
          <div className="mx-auto mb-6 inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-fuchsia-500 to-indigo-600 text-white shadow-lg">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-10 h-10">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>

          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 mb-2">404 — Không tìm thấy trang</h1>
          <p className="text-gray-600 mb-8">
            Có thể liên kết đã bị thay đổi hoặc trang này không còn tồn tại. Hãy kiểm tra lại URL
            hoặc quay về trang chính.
          </p>

          <div className="flex items-center justify-center gap-3">
            <a href="/" className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-medium shadow hover:bg-indigo-700 transition-colors">
              Về trang chủ
            </a>
            <a href="/login" className="px-5 py-2.5 rounded-xl border border-indigo-200 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition-colors">
              Đăng nhập
            </a>
          </div>

          <div className="mt-6 text-xs text-gray-500">Mã lỗi: NOT_FOUND</div>
        </div>
      </div>
    </div>
  );
}


