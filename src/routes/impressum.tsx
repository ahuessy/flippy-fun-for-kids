import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/impressum")({
  head: () => ({
    meta: [
      { title: "Impressum – Flippy Ball" },
      { name: "description", content: "Impressum und Anbieterkennzeichnung von Flippy Ball." },
    ],
  }),
  component: Impressum,
});

function Impressum() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#6441a5,#2a0845)] text-white p-6">
      <div className="max-w-2xl mx-auto bg-white/10 rounded-2xl p-8 border-2 border-yellow-300">
        <h1 className="text-4xl font-black text-yellow-300 mb-6">Impressum</h1>

        <h2 className="text-xl font-bold text-yellow-200 mt-4 mb-2">Betreiber und Verantwortlicher</h2>
        <p>André Hüssy<br />Schiffländi 17<br />5722 Gränichen<br />Schweiz</p>

        <h2 className="text-xl font-bold text-yellow-200 mt-6 mb-2">Kontakt</h2>
        <p>E-Mail: <a className="underline" href="mailto:huessy.allrounder@gmail.com">huessy.allrounder@gmail.com</a></p>

        <h2 className="text-xl font-bold text-yellow-200 mt-6 mb-2">Haftungsausschluss</h2>
        <p className="text-sm text-white/80">
          Der Autor übernimmt keinerlei Gewähr hinsichtlich der inhaltlichen Richtigkeit, Genauigkeit,
          Aktualität, Zuverlässigkeit und Vollständigkeit der Informationen. Haftungsansprüche gegen den
          Autor wegen Schäden materieller oder immaterieller Art, welche aus dem Zugriff oder der Nutzung
          bzw. Nichtnutzung der Website entstehen, werden ausgeschlossen.
        </p>

        <div className="mt-8 flex gap-4">
          <Link to="/" className="underline text-yellow-200">← Zurück zum Spiel</Link>
          <Link to="/datenschutz" className="underline text-yellow-200">Datenschutzerklärung</Link>
        </div>
      </div>
    </div>
  );
}
