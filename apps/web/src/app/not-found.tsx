import Link from "next/link";

export default function NotFound(): JSX.Element {
  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-100 mb-4">Not Found</h2>
        <p className="text-gray-400 mb-6">Could not find the requested resource</p>
        <Link
          href="/"
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 inline-block"
        >
          Go Home
        </Link>
      </div>
    </div>
  );
}
