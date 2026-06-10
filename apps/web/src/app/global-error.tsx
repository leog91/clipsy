"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}): JSX.Element {
  return (
    <html>
      <body>
        <div className="min-h-screen flex items-center justify-center p-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-100 mb-4">Something went wrong!</h2>
            <p className="text-gray-400 mb-6">{error.message || "An unexpected error occurred"}</p>
            <button
              onClick={() => reset()}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
