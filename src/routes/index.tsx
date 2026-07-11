import { createFileRoute } from "@tanstack/react-router";
import FlippyBall from "@/components/FlippyBall";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Flippy Ball – Buntes Flipperspiel für Kinder" },
      {
        name: "description",
        content:
          "Flippy Ball: Ein farbenfrohes Retro-Flipperspiel für Kinder mit großen Flipper-Hebeln, lustigen Symbolen und fröhlichen Sounds.",
      },
      { property: "og:title", content: "Flippy Ball – Buntes Flipperspiel für Kinder" },
      {
        property: "og:description",
        content: "Flippy Ball: Ein farbenfrohes Retro-Flipperspiel für Kinder mit großen Flipper-Hebeln, lustigen Symbolen und fröhlichen Sounds.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return <FlippyBall />;
}
