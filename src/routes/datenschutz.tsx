import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/datenschutz")({
  head: () => ({
    meta: [
      { title: "Datenschutzerklärung – Flippy Ball" },
      { name: "description", content: "Datenschutzerklärung nach Schweizer Recht (DSG) für Flippy Ball." },
    ],
  }),
  component: Datenschutz,
});

function Datenschutz() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#6441a5,#2a0845)] text-white p-6">
      <div className="max-w-2xl mx-auto bg-white/10 rounded-2xl p-8 border-2 border-yellow-300 space-y-4">
        <h1 className="text-4xl font-black text-yellow-300">Datenschutzerklärung</h1>
        <p className="text-sm text-white/80">
          Diese Datenschutzerklärung erläutert, wie der Betreiber (im Impressum genannt) mit personenbezogenen
          Daten umgeht. Rechtsgrundlage ist das Schweizerische Bundesgesetz über den Datenschutz (revDSG).
        </p>

        <h2 className="text-xl font-bold text-yellow-200">1. Verantwortliche Stelle</h2>
        <p>André Hüssy, Schiffländi 17, 5722 Gränichen, Schweiz.<br />
          E-Mail: <a className="underline" href="mailto:huessy.allrounder@gmail.com">huessy.allrounder@gmail.com</a></p>

        <h2 className="text-xl font-bold text-yellow-200">2. Erhebung personenbezogener Daten</h2>
        <p>
          Das Spiel „Flippy Ball" wird direkt im Browser ausgeführt. Es werden bewusst
          <strong> keine personenbezogenen Daten</strong> vom Betreiber erhoben, gespeichert oder verarbeitet.
          Es gibt keine Anmeldung, keine Cookies zu Werbezwecken und kein Tracking.
        </p>

        <h2 className="text-xl font-bold text-yellow-200">3. Server-Logs</h2>
        <p>
          Beim Aufruf der Website können durch den Hosting-Anbieter automatisch technische Zugriffsdaten
          (z. B. IP-Adresse, Datum, Uhrzeit, aufgerufene Seite) in Server-Logfiles gespeichert werden. Diese
          Daten werden nur zur Sicherstellung des Betriebs und zur Fehleranalyse genutzt und nicht mit anderen
          Datenquellen zusammengeführt.
        </p>

        <h2 className="text-xl font-bold text-yellow-200">4. Rechte der betroffenen Personen</h2>
        <p>
          Sie haben jederzeit das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Bearbeitung
          sowie Datenübertragbarkeit hinsichtlich Ihrer Daten. Wenden Sie sich dazu bitte an die oben genannte
          Kontaktadresse.
        </p>

        <h2 className="text-xl font-bold text-yellow-200">5. Kinder</h2>
        <p>
          Das Angebot richtet sich an Kinder und deren Familien. Es werden keine Registrierungen verlangt und
          keine personenbezogenen Daten zu Kindern gespeichert.
        </p>

        <h2 className="text-xl font-bold text-yellow-200">6. Änderungen</h2>
        <p className="text-sm text-white/80">
          Der Betreiber behält sich vor, diese Datenschutzerklärung jederzeit anzupassen, um sie an geänderte
          rechtliche oder tatsächliche Gegebenheiten anzupassen.
        </p>

        <div className="mt-8 flex gap-4">
          <Link to="/" className="underline text-yellow-200">← Zurück zum Spiel</Link>
          <Link to="/impressum" className="underline text-yellow-200">Impressum</Link>
        </div>
      </div>
    </div>
  );
}
