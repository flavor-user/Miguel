"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="py-20 text-center">
      <h1 className="text-neutral-900">Algo salió mal</h1>
      <p className="mt-4 text-neutral-900">{error.message}</p>
      <button
        onClick={reset}
        className="mt-8 border border-neutral-900 px-6 py-3  text-neutral-900 transition hover:bg-neutral-900 hover:text-white"
      >
        Reintentar
      </button>
    </div>
  );
}
