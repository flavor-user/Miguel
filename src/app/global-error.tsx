"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="es">
      <body
        style={{
          background: "#0c0a09",
          color: "#e7e5e4",
          fontFamily: "system-ui",
          padding: 40,
        }}
      >
        <h1>Algo salió mal</h1>
        <p>Prueba recargar la página o reiniciar la app.</p>
        <button
          onClick={reset}
          style={{
            marginTop: 16,
            padding: "12px 24px",
            background: "#d97706",
            border: "none",
            borderRadius: 9999,
            cursor: "pointer",
          }}
        >
          Reintentar
        </button>
      </body>
    </html>
  );
}
