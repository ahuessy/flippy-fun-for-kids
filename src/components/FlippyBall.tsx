import { useEffect, useRef, useState, useCallback } from "react";
import Matter from "matter-js";

// Spielfeldgröße (virtuell) — wird per CSS skaliert
const W = 480;
const H = 720;

type Screen = "menu" | "play" | "gameover";

interface BumperDef {
  x: number;
  y: number;
  r: number;
  color: string;
  glow: string;
  emoji: string;
  points: number;
}

const BUMPERS: BumperDef[] = [
  { x: 110, y: 180, r: 34, color: "#ff3b6b", glow: "#ffb3c6", emoji: "⭐", points: 100 },
  { x: 240, y: 130, r: 38, color: "#ffd23f", glow: "#fff2a8", emoji: "😀", points: 150 },
  { x: 370, y: 200, r: 34, color: "#4ecdc4", glow: "#b8f3ee", emoji: "🚀", points: 100 },
  { x: 80, y: 320, r: 30, color: "#ff8c42", glow: "#ffd1a8", emoji: "🐶", points: 75 },
  { x: 240, y: 280, r: 42, color: "#a06cd5", glow: "#d9c3f0", emoji: "❤️", points: 200 },
  { x: 400, y: 320, r: 30, color: "#3ec300", glow: "#c3f0a8", emoji: "🦄", points: 75 },
  { x: 240, y: 430, r: 34, color: "#00b4ff", glow: "#b0e6ff", emoji: "🐠", points: 100 },
];

// Simple WebAudio sound engine
class Sfx {
  ctx: AudioContext | null = null;
  ensure() {
    if (!this.ctx) {
      const AC = (window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext);
      this.ctx = new AC();
    }
    if (this.ctx.state === "suspended") void this.ctx.resume();
    return this.ctx;
  }
  private tone(freq: number, dur: number, type: OscillatorType = "sine", gain = 0.15) {
    const ctx = this.ensure();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.value = gain;
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
    o.connect(g).connect(ctx.destination);
    o.start();
    o.stop(ctx.currentTime + dur);
  }
  bumper() {
    const notes = [660, 880, 990, 1320];
    this.tone(notes[Math.floor(Math.random() * notes.length)], 0.15, "triangle", 0.2);
  }
  flip() {
    this.tone(220, 0.08, "square", 0.15);
  }
  start() {
    this.tone(523, 0.1, "triangle", 0.2);
    setTimeout(() => this.tone(784, 0.15, "triangle", 0.2), 100);
  }
  drain() {
    this.tone(300, 0.2, "sawtooth", 0.2);
    setTimeout(() => this.tone(150, 0.3, "sawtooth", 0.2), 150);
  }
  gameover() {
    this.tone(523, 0.15, "triangle", 0.2);
    setTimeout(() => this.tone(659, 0.15, "triangle", 0.2), 150);
    setTimeout(() => this.tone(784, 0.15, "triangle", 0.2), 300);
    setTimeout(() => this.tone(1047, 0.4, "triangle", 0.25), 450);
  }
}

export default function FlippyBall() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<Matter.Engine | null>(null);
  const ballRef = useRef<Matter.Body | null>(null);
  const leftFlipperRef = useRef<Matter.Body | null>(null);
  const rightFlipperRef = useRef<Matter.Body | null>(null);
  const leftPivotRef = useRef<Matter.Constraint | null>(null);
  const rightPivotRef = useRef<Matter.Constraint | null>(null);
  const bumperBodiesRef = useRef<Map<number, BumperDef & { body: Matter.Body; pulse: number }>>(
    new Map(),
  );
  const leftDownRef = useRef(false);
  const rightDownRef = useRef(false);
  const sfxRef = useRef(new Sfx());
  const rafRef = useRef<number | null>(null);
  const ballLostRef = useRef(false);

  const [screen, setScreen] = useState<Screen>("menu");
  const [score, setScore] = useState(0);
  const [ballsLeft, setBallsLeft] = useState(5);
  const [waitingForLaunch, setWaitingForLaunch] = useState(true);

  // ----- Setup engine once when entering play screen -----
  useEffect(() => {
    if (screen !== "play") return;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;

    const engine = Matter.Engine.create();
    engine.gravity.y = 0.45; // langsam & zäh
    engineRef.current = engine;

    const walls: Matter.Body[] = [];
    const wallOpts: Matter.IChamferableBodyDefinition = {
      isStatic: true,
      restitution: 0.5,
      friction: 0.05,
      label: "wall",
    };
    // Ränder
    walls.push(Matter.Bodies.rectangle(W / 2, -10, W, 20, wallOpts)); // oben
    walls.push(Matter.Bodies.rectangle(-10, H / 2, 20, H, wallOpts)); // links
    walls.push(Matter.Bodies.rectangle(W + 10, H / 2, 20, H, wallOpts)); // rechts
    // Unten: Loch in der Mitte -> zwei Segmente
    const gap = 130;
    walls.push(
      Matter.Bodies.rectangle((W / 2 - gap / 2) / 2, H + 10, W / 2 - gap / 2, 20, wallOpts),
    );
    walls.push(
      Matter.Bodies.rectangle(
        W - (W / 2 - gap / 2) / 2,
        H + 10,
        W / 2 - gap / 2,
        20,
        wallOpts,
      ),
    );
    // Schräge Wände unten zur Rinne
    walls.push(
      Matter.Bodies.rectangle(70, 600, 160, 16, {
        ...wallOpts,
        angle: Math.PI / 7,
      }),
    );
    walls.push(
      Matter.Bodies.rectangle(W - 70, 600, 160, 16, {
        ...wallOpts,
        angle: -Math.PI / 7,
      }),
    );
    // Startschacht rechts (Rampe)
    walls.push(
      Matter.Bodies.rectangle(W - 30, 80, 60, 12, {
        ...wallOpts,
        label: "chute",
      }),
    );

    Matter.World.add(engine.world, walls);

    // Bumper
    bumperBodiesRef.current.clear();
    for (const b of BUMPERS) {
      const body = Matter.Bodies.circle(b.x, b.y, b.r, {
        isStatic: true,
        restitution: 1.6,
        label: "bumper",
      });
      Matter.World.add(engine.world, body);
      bumperBodiesRef.current.set(body.id, { ...b, body, pulse: 0 });
    }

    // Flipper
    const flipperW = 110;
    const flipperH = 22;
    const leftPivotPos = { x: W / 2 - gap / 2 - 10, y: H - 110 };
    const rightPivotPos = { x: W / 2 + gap / 2 + 10, y: H - 110 };

    const left = Matter.Bodies.rectangle(
      leftPivotPos.x + flipperW / 2 - 10,
      leftPivotPos.y,
      flipperW,
      flipperH,
      {
        density: 0.02,
        friction: 0.1,
        restitution: 0.6,
        label: "flipperL",
        chamfer: { radius: 10 },
      },
    );
    const right = Matter.Bodies.rectangle(
      rightPivotPos.x - flipperW / 2 + 10,
      rightPivotPos.y,
      flipperW,
      flipperH,
      {
        density: 0.02,
        friction: 0.1,
        restitution: 0.6,
        label: "flipperR",
        chamfer: { radius: 10 },
      },
    );

    const leftPivot = Matter.Constraint.create({
      pointA: leftPivotPos,
      bodyB: left,
      pointB: { x: -flipperW / 2 + 10, y: 0 },
      length: 0,
      stiffness: 1,
    });
    const rightPivot = Matter.Constraint.create({
      pointA: rightPivotPos,
      bodyB: right,
      pointB: { x: flipperW / 2 - 10, y: 0 },
      length: 0,
      stiffness: 1,
    });

    // Ruhe-Stopper: begrenzen den Ruhe-Winkel per Feder
    const leftStopDown = Matter.Constraint.create({
      pointA: { x: leftPivotPos.x + 90, y: leftPivotPos.y + 40 },
      bodyB: left,
      pointB: { x: flipperW / 2 - 12, y: 0 },
      length: 15,
      stiffness: 0.02,
      damping: 0.1,
    });
    const rightStopDown = Matter.Constraint.create({
      pointA: { x: rightPivotPos.x - 90, y: rightPivotPos.y + 40 },
      bodyB: right,
      pointB: { x: -flipperW / 2 + 12, y: 0 },
      length: 15,
      stiffness: 0.02,
      damping: 0.1,
    });

    Matter.World.add(engine.world, [left, right, leftPivot, rightPivot, leftStopDown, rightStopDown]);
    leftFlipperRef.current = left;
    rightFlipperRef.current = right;
    leftPivotRef.current = leftPivot;
    rightPivotRef.current = rightPivot;

    // Ball
    const ball = Matter.Bodies.circle(W - 30, 50, 16, {
      restitution: 0.7,
      friction: 0.002,
      frictionAir: 0.012, // zäh
      density: 0.004,
      label: "ball",
    });
    Matter.Body.setStatic(ball, true);
    Matter.World.add(engine.world, ball);
    ballRef.current = ball;

    // Kollisions-Events
    Matter.Events.on(engine, "collisionStart", (evt) => {
      for (const pair of evt.pairs) {
        const a = pair.bodyA;
        const b = pair.bodyB;
        const other = a.label === "ball" ? b : b.label === "ball" ? a : null;
        if (!other) continue;
        if (other.label === "bumper") {
          const info = bumperBodiesRef.current.get(other.id);
          if (info) {
            info.pulse = 1;
            setScore((s) => s + info.points);
            sfxRef.current.bumper();
            // Kick weg vom Bumper
            const ballBody = ballRef.current!;
            const dx = ballBody.position.x - other.position.x;
            const dy = ballBody.position.y - other.position.y;
            const len = Math.hypot(dx, dy) || 1;
            Matter.Body.setVelocity(ballBody, {
              x: (dx / len) * 6,
              y: (dy / len) * 6,
            });
          }
        }
      }
    });

    // Flipper-Kräfte via beforeUpdate
    Matter.Events.on(engine, "beforeUpdate", () => {
      const lf = leftFlipperRef.current!;
      const rf = rightFlipperRef.current!;
      if (leftDownRef.current) {
        // nach oben schlagen
        Matter.Body.applyForce(
          lf,
          { x: lf.position.x + 40, y: lf.position.y },
          { x: 0, y: -0.18 },
        );
      }
      if (rightDownRef.current) {
        Matter.Body.applyForce(
          rf,
          { x: rf.position.x - 40, y: rf.position.y },
          { x: 0, y: -0.18 },
        );
      }
      // Winkelbegrenzung
      const maxAngle = 0.5;
      if (lf.angle < -maxAngle) {
        Matter.Body.setAngle(lf, -maxAngle);
        Matter.Body.setAngularVelocity(lf, 0);
      }
      if (lf.angle > 0.35) {
        Matter.Body.setAngle(lf, 0.35);
        Matter.Body.setAngularVelocity(lf, 0);
      }
      if (rf.angle > maxAngle) {
        Matter.Body.setAngle(rf, maxAngle);
        Matter.Body.setAngularVelocity(rf, 0);
      }
      if (rf.angle < -0.35) {
        Matter.Body.setAngle(rf, -0.35);
        Matter.Body.setAngularVelocity(rf, 0);
      }

      // Ball verloren?
      const bb = ballRef.current!;
      if (!ballLostRef.current && !bb.isStatic && bb.position.y > H + 40) {
        ballLostRef.current = true;
        sfxRef.current.drain();
        setBallsLeft((n) => {
          const remaining = n - 1;
          if (remaining <= 0) {
            setTimeout(() => {
              sfxRef.current.gameover();
              setScreen("gameover");
            }, 400);
          } else {
            setTimeout(() => {
              resetBall();
              setWaitingForLaunch(true);
              ballLostRef.current = false;
            }, 500);
          }
          return remaining;
        });
      }
    });

    // Render Loop
    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      // Hintergrund (bunter Retro-Verlauf)
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, "#2a0845");
      grad.addColorStop(0.5, "#6441a5");
      grad.addColorStop(1, "#ff4e50");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);

      // Deko-Sterne im Hintergrund
      ctx.save();
      ctx.globalAlpha = 0.15;
      for (let i = 0; i < 30; i++) {
        const x = (i * 53) % W;
        const y = (i * 91) % H;
        ctx.fillStyle = "#fff";
        ctx.beginPath();
        ctx.arc(x, y, 2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // Rinnen / schräge Wände zeichnen
      ctx.strokeStyle = "#ffde59";
      ctx.lineWidth = 6;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(10, 540);
      ctx.lineTo(140, 660);
      ctx.moveTo(W - 10, 540);
      ctx.lineTo(W - 140, 660);
      ctx.stroke();

      // Chute
      ctx.fillStyle = "#ffde59";
      ctx.fillRect(W - 55, 70, 45, 8);
      ctx.fillRect(W - 55, 0, 8, 78);

      // Bumper
      for (const [, info] of bumperBodiesRef.current) {
        const p = info.body.position;
        const pulse = info.pulse;
        const r = info.r + pulse * 8;
        // Glow
        const rg = ctx.createRadialGradient(p.x, p.y, r * 0.4, p.x, p.y, r * 1.6);
        rg.addColorStop(0, info.glow);
        rg.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = rg;
        ctx.beginPath();
        ctx.arc(p.x, p.y, r * 1.6, 0, Math.PI * 2);
        ctx.fill();
        // Body
        ctx.fillStyle = info.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 3;
        ctx.stroke();
        // Emoji
        ctx.font = `${info.r}px serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(info.emoji, p.x, p.y + 2);
        info.pulse = Math.max(0, info.pulse - 0.08);
      }

      // Flipper zeichnen
      const drawFlipper = (body: Matter.Body, color: string) => {
        ctx.save();
        ctx.translate(body.position.x, body.position.y);
        ctx.rotate(body.angle);
        ctx.fillStyle = color;
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 3;
        ctx.beginPath();
        // rounded rect
        const w = 110, h = 22, r = 10;
        ctx.moveTo(-w / 2 + r, -h / 2);
        ctx.lineTo(w / 2 - r, -h / 2);
        ctx.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r);
        ctx.lineTo(w / 2, h / 2 - r);
        ctx.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2);
        ctx.lineTo(-w / 2 + r, h / 2);
        ctx.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r);
        ctx.lineTo(-w / 2, -h / 2 + r);
        ctx.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      };
      drawFlipper(leftFlipperRef.current!, "#ff3b6b");
      drawFlipper(rightFlipperRef.current!, "#00b4ff");

      // Ball
      const bp = ballRef.current!.position;
      const bg = ctx.createRadialGradient(bp.x - 5, bp.y - 5, 3, bp.x, bp.y, 18);
      bg.addColorStop(0, "#fff");
      bg.addColorStop(1, "#ffde59");
      ctx.fillStyle = bg;
      ctx.beginPath();
      ctx.arc(bp.x, bp.y, 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#ff3b6b";
      ctx.lineWidth = 2;
      ctx.stroke();

      Matter.Engine.update(engine, 1000 / 60);
      rafRef.current = requestAnimationFrame(draw);
    };
    rafRef.current = requestAnimationFrame(draw);

    // Keyboard
    const kd = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") leftDownRef.current = true;
      if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") rightDownRef.current = true;
      if (e.key === " " && waitingForLaunch) launchBall();
      if (leftDownRef.current || rightDownRef.current) sfxRef.current.flip();
    };
    const ku = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") leftDownRef.current = false;
      if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") rightDownRef.current = false;
    };
    window.addEventListener("keydown", kd);
    window.addEventListener("keyup", ku);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      window.removeEventListener("keydown", kd);
      window.removeEventListener("keyup", ku);
      Matter.World.clear(engine.world, false);
      Matter.Engine.clear(engine);
      engineRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen]);

  const resetBall = useCallback(() => {
    const b = ballRef.current;
    if (!b) return;
    Matter.Body.setStatic(b, true);
    Matter.Body.setPosition(b, { x: W - 30, y: 50 });
    Matter.Body.setVelocity(b, { x: 0, y: 0 });
    Matter.Body.setAngularVelocity(b, 0);
  }, []);

  const launchBall = useCallback(() => {
    const b = ballRef.current;
    if (!b || !waitingForLaunch) return;
    Matter.Body.setStatic(b, false);
    Matter.Body.setVelocity(b, { x: -6, y: 0 }); // waagrecht nach links
    setWaitingForLaunch(false);
    sfxRef.current.start();
  }, [waitingForLaunch]);

  const startGame = () => {
    setScore(0);
    setBallsLeft(5);
    setWaitingForLaunch(true);
    ballLostRef.current = false;
    setScreen("play");
    sfxRef.current.ensure();
  };

  // Touch handlers
  const pressLeft = (down: boolean) => {
    leftDownRef.current = down;
    if (down) sfxRef.current.flip();
  };
  const pressRight = (down: boolean) => {
    rightDownRef.current = down;
    if (down) sfxRef.current.flip();
  };

  if (screen === "menu") {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[radial-gradient(circle_at_top,#6441a5,#2a0845)] p-4">
        <div className="max-w-md w-full text-center rounded-3xl border-4 border-yellow-300 bg-gradient-to-b from-pink-500 via-purple-600 to-indigo-700 p-8 shadow-[0_0_60px_rgba(255,222,89,0.5)]">
          <h1 className="text-6xl font-black text-yellow-300 drop-shadow-[0_4px_0_#ff3b6b] mb-2 tracking-tight">
            FLIPPY
          </h1>
          <h2 className="text-4xl font-black text-white drop-shadow-[0_3px_0_#00b4ff] mb-6">
            BALL 🎯
          </h2>
          <div className="bg-white/10 rounded-2xl p-4 mb-6 text-left text-white space-y-2">
            <p className="text-lg font-bold text-yellow-200">🎮 So spielst du:</p>
            <p>⭐ Triff bunte Bumper für Punkte</p>
            <p>🕹️ Nutze die großen Flipper unten</p>
            <p>❤️ Du hast 5 Bälle pro Spiel</p>
            <p>⌨️ Tasten: A / D oder ← →</p>
          </div>
          <button
            onClick={startGame}
            className="w-full py-5 rounded-2xl bg-gradient-to-r from-yellow-400 to-orange-500 text-purple-900 text-2xl font-black uppercase shadow-lg border-4 border-white active:scale-95 transition-transform"
          >
            ▶ Spiel starten
          </button>
        </div>
      </div>
    );
  }

  if (screen === "gameover") {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[radial-gradient(circle_at_top,#6441a5,#2a0845)] p-4">
        <div className="max-w-md w-full text-center rounded-3xl border-4 border-yellow-300 bg-gradient-to-b from-pink-500 via-purple-600 to-indigo-700 p-8 shadow-[0_0_60px_rgba(255,222,89,0.5)]">
          <h1 className="text-5xl font-black text-yellow-300 mb-4 drop-shadow-[0_4px_0_#ff3b6b]">
            🎉 GESCHAFFT! 🎉
          </h1>
          <p className="text-white text-2xl mb-2">Deine Punkte:</p>
          <p className="text-7xl font-black text-yellow-200 mb-8 drop-shadow-[0_4px_0_#00b4ff]">
            {score}
          </p>
          <button
            onClick={startGame}
            className="w-full py-5 rounded-2xl bg-gradient-to-r from-green-400 to-emerald-500 text-white text-2xl font-black uppercase shadow-lg border-4 border-white active:scale-95 mb-3"
          >
            🔄 Nochmal spielen
          </button>
          <button
            onClick={() => setScreen("menu")}
            className="w-full py-3 rounded-2xl bg-white/20 text-white text-lg font-bold border-2 border-white/40"
          >
            Zum Startmenü
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex flex-col items-center bg-[radial-gradient(circle_at_top,#6441a5,#2a0845)] p-2 select-none">
      {/* HUD */}
      <div className="w-full max-w-[520px] flex items-center justify-between mb-2 px-2">
        <div className="bg-black/40 border-2 border-yellow-300 rounded-xl px-4 py-2">
          <div className="text-yellow-300 text-xs font-bold">PUNKTE</div>
          <div className="text-white text-2xl font-black tabular-nums">{score}</div>
        </div>
        <div className="bg-black/40 border-2 border-pink-400 rounded-xl px-4 py-2">
          <div className="text-pink-300 text-xs font-bold">BÄLLE</div>
          <div className="text-white text-2xl font-black">
            {"●".repeat(ballsLeft)}
            <span className="opacity-30">{"●".repeat(Math.max(0, 5 - ballsLeft))}</span>
          </div>
        </div>
        <button
          onClick={() => setScreen("menu")}
          className="bg-red-600 hover:bg-red-700 text-white font-black text-sm rounded-xl px-4 py-3 border-2 border-white shadow-lg active:scale-95"
          aria-label="Spiel abbrechen"
        >
          ✕ ABBRECHEN
        </button>
      </div>

      {/* Canvas */}
      <div className="relative w-full max-w-[520px] aspect-[480/720] rounded-2xl overflow-hidden border-4 border-yellow-300 shadow-[0_0_40px_rgba(255,222,89,0.4)]">
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          className="w-full h-full block"
        />
        {waitingForLaunch && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <button
              onClick={launchBall}
              className="px-8 py-5 rounded-2xl bg-gradient-to-r from-yellow-400 to-orange-500 text-purple-900 text-2xl font-black uppercase shadow-2xl border-4 border-white animate-pulse"
            >
              🚀 Neuer Ball starten
            </button>
          </div>
        )}
      </div>

      {/* Flipper Touch Buttons */}
      <div className="w-full max-w-[520px] flex gap-3 mt-3 px-1">
        <button
          onPointerDown={(e) => {
            e.preventDefault();
            pressLeft(true);
          }}
          onPointerUp={() => pressLeft(false)}
          onPointerLeave={() => pressLeft(false)}
          onPointerCancel={() => pressLeft(false)}
          className="flex-1 h-24 rounded-2xl bg-gradient-to-b from-pink-400 to-pink-600 text-white text-3xl font-black border-4 border-white shadow-lg active:scale-95 active:from-pink-500 active:to-pink-700 touch-none"
        >
          ◀ LINKS
        </button>
        <button
          onPointerDown={(e) => {
            e.preventDefault();
            pressRight(true);
          }}
          onPointerUp={() => pressRight(false)}
          onPointerLeave={() => pressRight(false)}
          onPointerCancel={() => pressRight(false)}
          className="flex-1 h-24 rounded-2xl bg-gradient-to-b from-cyan-400 to-blue-600 text-white text-3xl font-black border-4 border-white shadow-lg active:scale-95 active:from-cyan-500 active:to-blue-700 touch-none"
        >
          RECHTS ▶
        </button>
      </div>
    </div>
  );
}
