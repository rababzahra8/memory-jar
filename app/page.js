"use client";

import {
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
  forwardRef,
} from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Moon,
  Heart,
  BookOpen,
  Smile,
  Star as StarIcon,
  Flower2,
  X,
  PenLine,
  Lock,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

const MEMORY_TYPES = [
  {
    id: "secret",
    label: "Secret",
    icon: Sparkles,
    color: "#c084fc",
    glow: "rgba(192,132,252,0.9)",
  },
  {
    id: "named",
    label: "Named",
    icon: Heart,
    color: "#f472b6",
    glow: "rgba(244,114,182,0.9)",
  },
  {
    id: "dream",
    label: "Dream",
    icon: Moon,
    color: "#60a5fa",
    glow: "rgba(96,165,250,0.9)",
  },
  {
    id: "story",
    label: "Story",
    icon: BookOpen,
    color: "#fbbf24",
    glow: "rgba(251,191,36,0.9)",
  },
  {
    id: "funny",
    label: "Funny",
    icon: Smile,
    color: "#fb923c",
    glow: "rgba(251,146,60,0.9)",
  },
  {
    id: "flower",
    label: "Flower",
    icon: Flower2,
    color: "#f472b6",
    glow: "rgba(244,114,182,0.9)",
  },
];

const EMOJI_PICKS = [
  "🌸",
  "🌻",
  "🌹",
  "🌷",
  "💐",
  "🦋",
  "😂",
  "🤪",
  "🥳",
  "😭",
  "✨",
  "💖",
];

function isLegacyBuiltinMemory(m) {
  return Boolean(
    m?.isSample ||
    String(m?.id).startsWith("sample-") ||
    String(m?.id).startsWith("system-"),
  );
}

function isUserMemory(m) {
  return m && !isLegacyBuiltinMemory(m);
}

const MINE_IDS_KEY = "memoryJarMine";
const DRAW_QUEUE_KEY = "memoryJarDrawQueue";

function shuffleIds(ids) {
  const list = [...ids];
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
}

function loadDrawQueue() {
  try {
    const raw = JSON.parse(localStorage.getItem(DRAW_QUEUE_KEY) || "null");
    if (!raw || !Array.isArray(raw.queue)) return null;
    return raw;
  } catch {
    return null;
  }
}

function saveDrawQueue(state) {
  localStorage.setItem(DRAW_QUEUE_KEY, JSON.stringify(state));
}

/** Pick from pool without repeat until every note has been shown, then reshuffle. */
function pickShuffledFromPool(pool) {
  if (!pool.length) return null;
  const poolKey = pool
    .map((m) => m.id)
    .sort()
    .join("|");
  let state = loadDrawQueue();
  if (!state || state.poolKey !== poolKey || state.queue.length === 0) {
    state = { poolKey, queue: shuffleIds(pool.map((m) => m.id)) };
  }
  let nextId = state.queue.shift();
  if (!nextId) {
    state.queue = shuffleIds(pool.map((m) => m.id));
    nextId = state.queue.shift();
  }
  saveDrawQueue(state);
  return pool.find((m) => m.id === nextId) || pool[0];
}

function loadMineIds() {
  try {
    const raw = JSON.parse(localStorage.getItem(MINE_IDS_KEY) || "[]");
    return new Set(Array.isArray(raw) ? raw : []);
  } catch {
    return new Set();
  }
}

function persistMineIds(set) {
  localStorage.setItem(MINE_IDS_KEY, JSON.stringify([...set]));
}

function saveMineId(id) {
  if (!id) return;
  const set = loadMineIds();
  set.add(id);
  persistMineIds(set);
}

function replaceMineId(oldId, newId) {
  if (!newId) return;
  const set = loadMineIds();
  if (oldId) set.delete(oldId);
  set.add(newId);
  persistMineIds(set);
}

function memorySourceLabel() {
  return "Memory / note by real people";
}

function noteStartsWithEmoji(note, e) {
  const t = (note || "").trimStart();
  return t.startsWith(`${e} `) || t === e;
}

function toggleEmojiInNote(note, e) {
  const trimmed = (note || "").trim();
  if (noteStartsWithEmoji(trimmed, e)) {
    return trimmed.startsWith(`${e} `)
      ? trimmed.slice(e.length + 1)
      : trimmed.slice(e.length).trimStart();
  }
  return trimmed ? `${e} ${trimmed}` : e;
}

const typeMeta = (id) =>
  MEMORY_TYPES.find((t) => t.id === id) || MEMORY_TYPES[0];

// ---------- Van Gogh Starry Night Background (Canvas) ----------
// A living painting: swirling vortices push brushstroke particles along a
// flow field, leaving painterly trails. Golden stars, a luminous moon,
// and shooting stars complete the "Starry Night"-inspired scene.
function GalaxyBackground() {
  const canvasRef = useRef(null);
  const mouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const DPR = Math.min(window.devicePixelRatio || 1, 2);
    let w = window.innerWidth;
    let h = window.innerHeight;

    const setup = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * DPR;
      canvas.height = h * DPR;
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      // paint an initial deep-sky base so the first frames don't look black
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, "#0c2d6e");
      g.addColorStop(0.35, "#1a4fa8");
      g.addColorStop(0.65, "#1e3d8f");
      g.addColorStop(1, "#0a2260");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    };
    setup();

    // Van Gogh palette (rich blues, deep purples, golden yellows, cream)
    const PALETTE = [
      "#1d4ed8",
      "#2563eb",
      "#3b82f6",
      "#60a5fa",
      "#38bdf8", // cobalt & sky blues
      "#4338ca",
      "#5b21b6",
      "#7c3aed",
      "#a78bfa", // violets
      "#eab308",
      "#facc15",
      "#fde047",
      "#fef08a",
      "#fff7c2", // starry golds
      "#22d3ee",
      "#06b6d4", // teal accents
    ];

    // Swirl vortex centers (like the iconic swirls of Starry Night)
    const vortices = [
      { x: w * 0.32, y: h * 0.38, r: Math.max(w, h) * 0.32, s: 1.0, rot: 0 },
      { x: w * 0.72, y: h * 0.28, r: Math.max(w, h) * 0.22, s: -0.9, rot: 0 },
      { x: w * 0.55, y: h * 0.72, r: Math.max(w, h) * 0.36, s: 0.8, rot: 0 },
      { x: w * 0.08, y: h * 0.78, r: Math.max(w, h) * 0.2, s: -0.7, rot: 0 },
      { x: w * 0.92, y: h * 0.62, r: Math.max(w, h) * 0.22, s: 0.9, rot: 0 },
    ];

    const isMobileView = () => w < 768;

    // Iconic big gold stars — fixed positions, spread so halos don't overlap
    const buildIconicGoldStars = () => {
      const scale = isMobileView() ? 0.82 : 1;
      return [
        { x: w * 0.1, y: h * 0.11, r: 14 * scale, tw: 0, twSpeed: 0.015 },
        { x: w * 0.34, y: h * 0.07, r: 12 * scale, tw: 1, twSpeed: 0.018 },
        { x: w * 0.54, y: h * 0.13, r: 11 * scale, tw: 2, twSpeed: 0.02 },
        { x: w * 0.18, y: h * 0.44, r: 10 * scale, tw: 0.5, twSpeed: 0.016 },
        { x: w * 0.7, y: h * 0.46, r: 9 * scale, tw: 1.5, twSpeed: 0.014 },
      ];
    };

    const goldHaloReach = (s) => s.r * 4.5 + 30;

    const canPlaceGold = (stars, x, y, r) => {
      const reach = goldHaloReach({ r });
      if (
        stars.some(
          (g) => Math.hypot(g.x - x, g.y - y) < goldHaloReach(g) + reach,
        )
      )
        return false;
      if (Math.hypot(moon.x - x, moon.y - y) < moon.r + reach + 12)
        return false;
      return true;
    };

    const moon = { x: w * 0.85, y: h * 0.17, r: 46 };

    const buildGoldStars = () => {
      const stars = buildIconicGoldStars();
      // Two smaller bottom stars on mobile — spread apart below the jar
      if (isMobileView()) {
        const bottomPairs = [
          { x: w * 0.12, y: h * 0.76, r: 6.5, tw: 0.4, twSpeed: 0.012 },
          { x: w * 0.88, y: h * 0.79, r: 6.5, tw: 2.1, twSpeed: 0.013 },
        ];
        for (const s of bottomPairs) {
          if (canPlaceGold(stars, s.x, s.y, s.r)) stars.push(s);
        }
      }
      // Medium grid stars only on tablet+ — reject overlaps
      if (w >= 768) {
        const gridCols = w >= 1024 ? 5 : 3;
        const gridRows = w >= 1024 ? 4 : 2;
        const cellW = w / gridCols;
        const cellH = h / gridRows;
        for (let gy = 0; gy < gridRows; gy++) {
          for (let gx = 0; gx < gridCols; gx++) {
            const r = 7 + Math.random() * 5;
            for (let attempt = 0; attempt < 24; attempt++) {
              const x = gx * cellW + cellW * (0.2 + Math.random() * 0.6);
              const y = gy * cellH + cellH * (0.2 + Math.random() * 0.6);
              if (canPlaceGold(stars, x, y, r)) {
                stars.push({
                  x,
                  y,
                  r,
                  tw: Math.random() * Math.PI * 2,
                  twSpeed: 0.01 + Math.random() * 0.02,
                });
                break;
              }
            }
          }
        }
      }
      return stars;
    };

    const buildSmallStars = (goldList) => {
      const mobile = isMobileView();
      const target = w < 480 ? 22 : w < 768 ? 36 : w < 1024 ? 60 : 85;
      const minDist = mobile ? 32 : 36;
      const sizeScale = mobile ? 0.85 : 1;
      const stars = [];
      for (
        let attempt = 0;
        attempt < target * 50 && stars.length < target;
        attempt++
      ) {
        const x = Math.random() * w;
        const y = Math.random() * h;
        if (stars.some((s) => Math.hypot(s.x - x, s.y - y) < minDist)) continue;
        const nearGold = goldList.some(
          (g) => Math.hypot(g.x - x, g.y - y) < goldHaloReach(g) + 8,
        );
        if (nearGold) continue;
        if (Math.hypot(moon.x - x, moon.y - y) < moon.r + 36) continue;
        stars.push({
          x,
          y,
          r: (0.35 + Math.random() * 0.85) * sizeScale,
          tw: Math.random() * Math.PI * 2,
          twSpeed: 0.003 + Math.random() * 0.01,
          brightness: 0.2 + Math.random() * 0.38,
        });
      }
      return stars;
    };

    let goldStars = buildGoldStars();
    let smallStars = buildSmallStars(goldStars);

    const rebuildStars = () => {
      goldStars = buildGoldStars();
      smallStars = buildSmallStars(goldStars);
    };

    // Brushstroke particles that ride the flow field
    const PARTICLE_COUNT = Math.floor(Math.min(2200, (w * h) / 750));
    const particles = Array.from({ length: PARTICLE_COUNT }, () =>
      spawnParticle(),
    );

    function spawnParticle() {
      return {
        x: Math.random() * w,
        y: Math.random() * h,
        life: 30 + Math.random() * 120,
        maxLife: 30 + Math.random() * 120,
        color: PALETTE[Math.floor(Math.random() * PALETTE.length)],
        size: 1.2 + Math.random() * 3.2,
      };
    }

    // Flow field: sum contributions from vortices + a slow drift.
    // Returns [vx, vy] in pixels per frame.
    function flowAt(x, y, time) {
      let vx = Math.cos(time * 0.00015 + y * 0.002) * 0.15; // slow ambient
      let vy = Math.sin(time * 0.00012 + x * 0.002) * 0.12;
      for (const vo of vortices) {
        const dx = x - vo.x;
        const dy = y - vo.y;
        const d2 = dx * dx + dy * dy;
        const d = Math.sqrt(d2) + 1;
        const falloff = Math.exp(-d / vo.r);
        // tangential (perpendicular) rotation
        const tx = -dy / d;
        const ty = dx / d;
        // inward pull to keep particles curling
        const ix = -dx / d;
        const iy = -dy / d;
        const rot = vo.s * (0.9 + Math.sin(vo.rot) * 0.15);
        vx += (tx * 1.6 + ix * 0.35) * rot * falloff;
        vy += (ty * 1.6 + iy * 0.35) * rot * falloff;
      }
      return [vx, vy];
    }

    let shooting = [];
    let nextShoot = performance.now() + 3000;
    let raf;
    let frame = 0;

    const onResize = () => {
      setup();
      moon.x = w * 0.85;
      moon.y = h * 0.17;
      vortices[0].x = w * 0.32;
      vortices[0].y = h * 0.38;
      vortices[1].x = w * 0.72;
      vortices[1].y = h * 0.28;
      vortices[2].x = w * 0.55;
      vortices[2].y = h * 0.72;
      vortices[3].x = w * 0.08;
      vortices[3].y = h * 0.78;
      vortices[4].x = w * 0.92;
      vortices[4].y = h * 0.62;
      rebuildStars();
    };
    const onMove = (e) => {
      mouseRef.current.x = e.clientX / w - 0.5;
      mouseRef.current.y = e.clientY / h - 0.5;
    };
    window.addEventListener("resize", onResize);
    window.addEventListener("mousemove", onMove);

    // painterly base is redrawn every frame with a soft veil so old strokes
    // fade gradually -> creates the living "hand-painted" impression
    const drawFadeBase = () => {
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, "rgba(30, 80, 180, 0.045)");
      g.addColorStop(0.5, "rgba(50, 100, 220, 0.04)");
      g.addColorStop(1, "rgba(20, 50, 140, 0.05)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);

      const g2 = ctx.createRadialGradient(
        w * 0.25,
        h * 0.3,
        0,
        w * 0.25,
        h * 0.3,
        Math.max(w, h) * 0.55,
      );
      g2.addColorStop(0, "rgba(100, 160, 255, 0.07)");
      g2.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g2;
      ctx.fillRect(0, 0, w, h);

      const g3 = ctx.createRadialGradient(
        w * 0.75,
        h * 0.2,
        0,
        w * 0.75,
        h * 0.2,
        Math.max(w, h) * 0.45,
      );
      g3.addColorStop(0, "rgba(255, 220, 100, 0.06)");
      g3.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g3;
      ctx.fillRect(0, 0, w, h);

      const g4 = ctx.createRadialGradient(
        w * 0.15,
        h * 0.82,
        0,
        w * 0.15,
        h * 0.82,
        Math.max(w, h) * 0.5,
      );
      g4.addColorStop(0, "rgba(120, 60, 200, 0.08)");
      g4.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g4;
      ctx.fillRect(0, 0, w, h);
    };

    const drawMoon = (t) => {
      const mx = moon.x,
        my = moon.y,
        mr = moon.r;
      // outer halo brushstrokes (radiating short strokes)
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      const rings = 5;
      for (let r = 0; r < rings; r++) {
        const radius = mr + 14 + r * 12;
        const strokes = 40 + r * 8;
        for (let i = 0; i < strokes; i++) {
          const a =
            (i / strokes) * Math.PI * 2 + t * 0.00005 * (r % 2 === 0 ? 1 : -1);
          const sx = mx + Math.cos(a) * radius;
          const sy = my + Math.sin(a) * radius;
          const len = 8 + Math.random() * 6;
          const ex = sx + Math.cos(a) * len;
          const ey = sy + Math.sin(a) * len;
          ctx.strokeStyle = `rgba(255, 220, 130, ${0.1 - r * 0.015})`;
          ctx.lineWidth = 2.5 - r * 0.3;
          ctx.lineCap = "round";
          ctx.beginPath();
          ctx.moveTo(sx, sy);
          ctx.lineTo(ex, ey);
          ctx.stroke();
        }
      }
      // moon disc with warm gradient
      const mg = ctx.createRadialGradient(mx - 8, my - 8, 2, mx, my, mr);
      mg.addColorStop(0, "#fff6d0");
      mg.addColorStop(0.6, "#ffd76a");
      mg.addColorStop(1, "#e8a523");
      ctx.fillStyle = mg;
      ctx.beginPath();
      ctx.arc(mx, my, mr, 0, Math.PI * 2);
      ctx.fill();
      // inner painterly highlights
      ctx.strokeStyle = "rgba(255, 250, 210, 0.5)";
      ctx.lineWidth = 1.4;
      for (let i = 0; i < 14; i++) {
        const a = i * 0.5 + t * 0.0002;
        const rr = mr * 0.35 + (i % 3) * 4;
        ctx.beginPath();
        ctx.arc(mx - 6, my - 6, rr, a, a + 0.9);
        ctx.stroke();
      }
      ctx.restore();
    };

    const drawSmallStars = (t) => {
      ctx.save();
      for (const s of smallStars) {
        s.tw += s.twSpeed;
        const pulse = 0.45 + Math.sin(s.tw) * 0.55;
        ctx.fillStyle = `rgba(210, 225, 255, ${s.brightness * pulse})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    };

    const drawGoldStars = (t) => {
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      const haloRings = isMobileView() ? 2 : 4;
      const haloSpread = isMobileView() ? 0.55 : 1;
      for (const s of goldStars) {
        s.tw += s.twSpeed;
        const pulse = 0.75 + Math.sin(s.tw) * 0.25;
        // halo brushstrokes
        for (let r = 0; r < haloRings; r++) {
          const radius = s.r + (8 + r * 10) * haloSpread;
          const strokes = 22 + r * 6;
          for (let i = 0; i < strokes; i++) {
            const a =
              (i / strokes) * Math.PI * 2 + t * 0.0002 * (r % 2 ? 1 : -1);
            const sx = s.x + Math.cos(a) * radius;
            const sy = s.y + Math.sin(a) * radius;
            const len = 4 + Math.random() * 4;
            ctx.strokeStyle = `rgba(255, 230, 140, ${(0.22 - r * 0.04) * pulse})`;
            ctx.lineWidth = 1.6 - r * 0.3;
            ctx.lineCap = "round";
            ctx.beginPath();
            ctx.moveTo(sx, sy);
            ctx.lineTo(sx + Math.cos(a) * len, sy + Math.sin(a) * len);
            ctx.stroke();
          }
        }
        // star core
        const gs = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r * 2.2);
        gs.addColorStop(0, `rgba(255, 250, 220, ${pulse})`);
        gs.addColorStop(0.4, `rgba(255, 210, 100, ${0.7 * pulse})`);
        gs.addColorStop(1, "rgba(230, 160, 40, 0)");
        ctx.fillStyle = gs;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r * 2.2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    };

    const draw = (t) => {
      frame++;
      // rotate vortex phases (for subtle "breathing")
      for (const v of vortices) v.rot += 0.003;

      drawFadeBase();

      // Brushstroke particles
      const mouseInfluenceX = mouseRef.current.x * 12;
      const mouseInfluenceY = mouseRef.current.y * 12;
      ctx.lineCap = "round";
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        const [vx, vy] = flowAt(p.x, p.y, t);
        const nx = p.x + vx + mouseInfluenceX * 0.02;
        const ny = p.y + vy + mouseInfluenceY * 0.02;
        const speed = Math.hypot(vx, vy);
        const alpha =
          Math.min(0.95, 0.28 + speed * 0.38) * (p.life / p.maxLife);
        // short brushstroke = line from (p.x,p.y) to (nx,ny)
        ctx.strokeStyle = hexA(p.color, alpha);
        ctx.lineWidth = p.size;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(nx, ny);
        ctx.stroke();
        p.x = nx;
        p.y = ny;
        p.life -= 1;
        if (
          p.life <= 0 ||
          p.x < -20 ||
          p.x > w + 20 ||
          p.y < -20 ||
          p.y > h + 20
        ) {
          Object.assign(p, spawnParticle());
        }
      }

      drawSmallStars(t);
      drawGoldStars(t);
      drawMoon(t);

      // Shooting stars (occasional golden streaks)
      if (t > nextShoot) {
        shooting.push({
          x: Math.random() * w * 0.7,
          y: Math.random() * h * 0.35,
          vx: 9 + Math.random() * 5,
          vy: 3 + Math.random() * 3,
          life: 70,
        });
        nextShoot = t + 8000 + Math.random() * 7000;
      }
      shooting = shooting.filter((sh) => sh.life > 0);
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      for (const sh of shooting) {
        const tailX = sh.x - sh.vx * 9;
        const tailY = sh.y - sh.vy * 9;
        const grad = ctx.createLinearGradient(tailX, tailY, sh.x, sh.y);
        grad.addColorStop(0, "rgba(255, 220, 130, 0)");
        grad.addColorStop(0.6, `rgba(255, 230, 160, ${sh.life / 90})`);
        grad.addColorStop(1, `rgba(255, 250, 210, ${sh.life / 70})`);
        ctx.strokeStyle = grad;
        ctx.lineWidth = 2.6;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(tailX, tailY);
        ctx.lineTo(sh.x, sh.y);
        ctx.stroke();
        sh.x += sh.vx;
        sh.y += sh.vy;
        sh.life -= 1;
      }
      ctx.restore();

      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("mousemove", onMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full z-0"
      style={{ pointerEvents: "none" }}
    />
  );
}

// hex color + alpha helper
function hexA(hex, a) {
  const h = hex.replace("#", "");
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

// ---------- Paper star marker (jar always shows stars by memory type) ----------
function MemoryGlyph({ memory, size = 24 }) {
  return (
    <span title="Memory / note">
      <PaperStar color={typeMeta(memory.type).color} size={size} />
    </span>
  );
}

function PaperStar({ color = "#c084fc", size = 22, rotate = 0 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="-12 -12 24 24"
      style={{
        color,
        transform: `rotate(${rotate}deg)`,
        filter: `drop-shadow(0 0 6px ${color})`,
      }}
    >
      <defs>
        <linearGradient id={`pg-${color}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
          <stop offset="70%" stopColor={color} stopOpacity="0.95" />
          <stop offset="100%" stopColor={color} stopOpacity="0.7" />
        </linearGradient>
      </defs>
      <polygon
        points="0,-10 2.9,-3.1 10,-3.1 4.2,1.2 6.5,8.1 0,4 -6.5,8.1 -4.2,1.2 -10,-3.1 -2.9,-3.1"
        fill={`url(#pg-${color})`}
        stroke={color}
        strokeWidth="0.5"
        strokeLinejoin="round"
      />
      {/* fold creases */}
      <line
        x1="0"
        y1="-10"
        x2="0"
        y2="4"
        stroke="rgba(255,255,255,0.35)"
        strokeWidth="0.3"
      />
      <line
        x1="-10"
        y1="-3.1"
        x2="6.5"
        y2="8.1"
        stroke="rgba(255,255,255,0.15)"
        strokeWidth="0.3"
      />
    </svg>
  );
}

// ---------- Sparkle Trail ----------
function SparkleTrail({ points }) {
  return (
    <>
      {points.map((p, i) => (
        <motion.div
          key={p.id}
          initial={{ opacity: 0.9, scale: 1 }}
          animate={{ opacity: 0, scale: 0.2 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          className="absolute pointer-events-none"
          style={{
            left: p.x,
            top: p.y,
            width: 6,
            height: 6,
            borderRadius: 999,
            background: p.color,
            boxShadow: `0 0 12px ${p.color}, 0 0 24px ${p.color}`,
          }}
        />
      ))}
    </>
  );
}

// ---------- The Jar ----------
// Jar physics coordinate system:
// Container size 340 x 460 (width x height)
// Interior physics rect: x in [-140, 140], y in [-200, 200]
// Gravity pulls stars toward y = 200 (bottom)

const JAR_W = 340;
const JAR_H = 460;
const JAR_INTERIOR_TOP = 110; // shoulderBotY — top of wide jar body
const JAR_INTERIOR_FLOOR = 430; // flat interior floor (bottomY - 30)
const JAR_PHYSICS_CY =
  JAR_INTERIOR_TOP + (JAR_INTERIOR_FLOOR - JAR_INTERIOR_TOP) / 2;
const INNER_W = 240; // physics width (inside jar body, not neck)
const INNER_H = JAR_INTERIOR_FLOOR - JAR_INTERIOR_TOP;
const JAR_STAR_SIZE = 36;
const STAR_R = 18; // collision radius ≈ half of star size
const JAR_HX = INNER_W / 2 - STAR_R;
const JAR_HY = INNER_H / 2 - STAR_R;

const clampStar = (p) => {
  p.x = Math.max(-JAR_HX, Math.min(JAR_HX, p.x));
  p.y = Math.max(-JAR_HY, Math.min(JAR_HY, p.y));
};

function useJarPhysics(memories, shakeRef, wakeRef) {
  const [positions, setPositions] = useState([]);
  const stateRef = useRef([]);
  const rafRef = useRef(null);
  const posCacheRef = useRef([]);
  const lastTimeRef = useRef(0);
  const memoryIdsKey = memories.map((m) => m.id).join(",");

  const REST_V = 0.08;
  const REST_VROT = 0.15;
  const MIN_DIST = STAR_R * 2;

  const trySleep = (p, arr, hx, hy) => {
    const speed = Math.hypot(p.vx, p.vy);
    if (speed >= REST_V || Math.abs(p.vrot) >= REST_VROT) return false;
    const onFloor = p.y >= hy - 1;
    let onSupport = onFloor;
    if (!onSupport) {
      for (const other of arr) {
        if (other.id === p.id) continue;
        const dx = other.x - p.x;
        const dy = p.y - other.y;
        if (dy > 0.5 && dy < MIN_DIST + 2 && Math.abs(dx) < MIN_DIST - 2) {
          onSupport = true;
          break;
        }
      }
    }
    if (!onSupport) return false;
    p.sleeping = true;
    p.x = Math.round(p.x * 10) / 10;
    p.y = Math.round(p.y * 10) / 10;
    p.rot = Math.round(p.rot * 10) / 10;
    p.vx = 0;
    p.vy = 0;
    p.vrot = 0;
    return true;
  };

  const resolvePair = (a, b, minDist) => {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const d2 = dx * dx + dy * dy;
    if (d2 >= minDist * minDist || d2 <= 0.01) return null;
    const d = Math.sqrt(d2);
    const overlap = (minDist - d) / 2;
    const nx = dx / d;
    const ny = dy / d;
    return { overlap, nx, ny };
  };

  const step = useCallback(
    (t) => {
      rafRef.current = null;
      if (!lastTimeRef.current) lastTimeRef.current = t;
      const dt = Math.min(32, t - lastTimeRef.current) / 16.6;
      lastTimeRef.current = t;

      const gravity = 0.32 * dt;
      const damping = 0.988;
      const restitution = 0.45;
      const floorDamping = 0.82;

      if (shakeRef.current > 0.05) {
        for (const p of stateRef.current) {
          p.sleeping = false;
          p.vx += (Math.random() - 0.5) * shakeRef.current;
          p.vy += (Math.random() - 0.5) * shakeRef.current;
          p.vrot += (Math.random() - 0.5) * shakeRef.current * 0.5;
        }
        shakeRef.current *= 0.82;
        if (shakeRef.current < 0.05) shakeRef.current = 0;
      }

      const arr = stateRef.current;
      const hx = JAR_HX;
      const hy = JAR_HY;
      let anyAwake = shakeRef.current > 0.05;

      for (const p of arr) {
        if (p.sleeping) continue;

        anyAwake = true;
        p.vy += gravity;
        p.vx *= damping;
        p.vy *= damping;
        p.vrot *= 0.96;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.rot += p.vrot * dt;

        if (p.y < -hy) {
          p.y = -hy;
          p.vy = -p.vy * restitution;
        }
        if (p.y > hy) {
          p.y = hy;
          p.vy = -Math.abs(p.vy) * restitution * floorDamping;
          p.vx *= 0.92;
          p.vrot *= 0.88;
        }
        if (p.x < -hx) {
          p.x = -hx;
          p.vx = -p.vx * restitution;
        }
        if (p.x > hx) {
          p.x = hx;
          p.vx = -p.vx * restitution;
        }

        trySleep(p, arr, hx, hy);
      }

      for (let i = 0; i < arr.length; i++) {
        for (let j = i + 1; j < arr.length; j++) {
          const a = arr[i],
            b = arr[j];
          const hit = resolvePair(a, b, MIN_DIST);
          if (!hit) continue;

          const { overlap, nx, ny } = hit;
          const relVel = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
          const impact = Math.abs(relVel);

          if (a.sleeping && b.sleeping) {
            a.x -= nx * overlap;
            a.y -= ny * overlap;
            b.x += nx * overlap;
            b.y += ny * overlap;
            continue;
          }

          if (impact < 0.45) {
            a.x -= nx * overlap;
            a.y -= ny * overlap;
            b.x += nx * overlap;
            b.y += ny * overlap;
            a.vx *= 0.35;
            a.vy *= 0.35;
            b.vx *= 0.35;
            b.vy *= 0.35;
            trySleep(a, arr, hx, hy);
            trySleep(b, arr, hx, hy);
            continue;
          }

          anyAwake = true;
          if (a.sleeping) {
            a.sleeping = false;
            a.vx = 0;
            a.vy = 0;
          }
          if (b.sleeping) {
            b.sleeping = false;
            b.vx = 0;
            b.vy = 0;
          }
          a.x -= nx * overlap;
          a.y -= ny * overlap;
          b.x += nx * overlap;
          b.y += ny * overlap;
          const va = a.vx * nx + a.vy * ny;
          const vb = b.vx * nx + b.vy * ny;
          const bounce = impact < 0.8 ? 0.08 : 0.28;
          const diff = (vb - va) * bounce;
          a.vx += diff * nx;
          a.vy += diff * ny;
          b.vx -= diff * nx;
          b.vy -= diff * ny;
        }
      }

      for (const p of arr) clampStar(p);

      const nextPos = arr.map((p) => ({
        id: p.id,
        x: p.x,
        y: p.y,
        rot: p.rot,
      }));
      const prev = posCacheRef.current;
      const moved =
        nextPos.length !== prev.length ||
        nextPos.some((p) => {
          const o = prev.find((x) => x.id === p.id);
          if (!o) return true;
          return (
            Math.abs(o.x - p.x) > 0.05 ||
            Math.abs(o.y - p.y) > 0.05 ||
            Math.abs(o.rot - p.rot) > 0.2
          );
        });
      if (moved) {
        posCacheRef.current = nextPos;
        setPositions(nextPos);
      }

      if (anyAwake) {
        rafRef.current = requestAnimationFrame(step);
      }
    },
    [shakeRef],
  );

  const wakeAll = useCallback(() => {
    for (const p of stateRef.current) p.sleeping = false;
    if (!rafRef.current) {
      lastTimeRef.current = 0;
      rafRef.current = requestAnimationFrame(step);
    }
  }, [step]);

  useEffect(() => {
    if (wakeRef) wakeRef.current = wakeAll;
  }, [wakeAll, wakeRef]);

  useEffect(() => {
    const prev = stateRef.current;
    const hx = JAR_HX;
    const hy = JAR_HY;
    const cols = 5;
    const spacingX = (hx * 2) / cols;
    const spacingY = MIN_DIST + 1;
    const next = memories.map((m, i) => {
      const existing = prev.find((p) => p.id === m.id);
      if (existing) return existing;
      if (isLegacyBuiltinMemory(m)) {
        const col = i % cols;
        const row = Math.floor(i / cols);
        return {
          id: m.id,
          x: -hx + (col + 0.5) * spacingX,
          y: hy - row * spacingY,
          vx: 0,
          vy: 0,
          rot: (i * 47) % 360,
          vrot: 0,
          sleeping: true,
        };
      }
      return {
        id: m.id,
        x: (Math.random() - 0.5) * (INNER_W - STAR_R * 2) * 0.6,
        y: -INNER_H / 2 + 20,
        vx: (Math.random() - 0.5) * 1.2,
        vy: 0.4,
        rot: Math.random() * 360,
        vrot: (Math.random() - 0.5) * 1.5,
        sleeping: false,
      };
    });
    const prevKey = prev.map((p) => p.id).join(",");
    const nextKey = next.map((p) => p.id).join(",");
    if (prevKey === nextKey) return;

    for (let pass = 0; pass < 12; pass++) {
      for (let i = 0; i < next.length; i++) {
        for (let j = i + 1; j < next.length; j++) {
          const hit = resolvePair(next[i], next[j], MIN_DIST);
          if (!hit) continue;
          next[i].x -= hit.nx * hit.overlap;
          next[i].y -= hit.ny * hit.overlap;
          next[j].x += hit.nx * hit.overlap;
          next[j].y += hit.ny * hit.overlap;
        }
        next[i].x = Math.max(-hx, Math.min(hx, next[i].x));
        next[i].y = Math.max(-hy, Math.min(hy, next[i].y));
        clampStar(next[i]);
      }
    }

    stateRef.current = next;
    posCacheRef.current = next.map((p) => ({
      id: p.id,
      x: p.x,
      y: p.y,
      rot: p.rot,
    }));
    setPositions(posCacheRef.current);
    const needsWake = next.some((p) => !p.sleeping);
    if (needsWake) wakeAll();
  }, [memoryIdsKey, wakeAll]);

  useEffect(() => {
    lastTimeRef.current = 0;
    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [step]);

  return positions;
}

// ---------- Main App ----------
// ---------- Memory form (shared desktop panel + mobile sheet) ----------

function MemoryFormFields({
  text,
  setText,
  author,
  setAuthor,
  type,
  setType,
  dropMemory,
  droppingStar,
  memories,
  othersMemories,
  compact = false,
}) {
  return (
    <>
      <label className="text-slate-100 text-sm mb-1.5 block text-safe">
        Your memory / note
      </label>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Write a memory or note..."
        rows={compact ? 2 : 3}
        className="w-full rounded-xl bg-black/50 border border-white/20 focus:border-purple-400/60 focus:ring-2 focus:ring-purple-400/30 outline-none px-3 py-2.5 text-sm text-slate-50 placeholder:text-slate-400/70 resize-none transition"
      />

      <input
        value={author}
        onChange={(e) => setAuthor(e.target.value)}
        placeholder="Name (optional)"
        maxLength={80}
        className="mt-2 w-full rounded-xl bg-black/50 border border-white/20 focus:border-pink-400/60 focus:ring-2 focus:ring-pink-400/30 outline-none px-3 py-2 text-sm text-slate-50 placeholder:text-slate-400/70"
      />

      <div className="mt-2">
        <div className="text-slate-200 text-xs mb-1.5 text-safe">
          Emoji (optional)
        </div>
        <div className="flex flex-wrap gap-1.5">
          {EMOJI_PICKS.map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => setText((prev) => toggleEmojiInNote(prev, e))}
              className={`text-lg leading-none w-9 h-9 rounded-lg border transition-all ${noteStartsWithEmoji(text, e) ? "border-white/40 bg-white/15 scale-110" : "border-white/10 bg-black/40 hover:border-white/25 hover:bg-white/10"}`}
              title={
                noteStartsWithEmoji(text, e)
                  ? "Remove from note"
                  : "Add to note"
              }
            >
              {e}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-2">
        <div className="text-slate-200 text-xs mb-1.5 text-safe">
          Type of memory / note
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          {MEMORY_TYPES.map((t) => {
            const Icon = t.icon;
            const active = t.id === type;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setType(t.id)}
                className={`group flex flex-col items-center justify-center rounded-xl border py-2 transition-all ${active ? "border-white/30 bg-white/10 scale-[1.03]" : "border-white/5 hover:border-white/15 bg-white/5"}`}
                style={
                  active
                    ? {
                        boxShadow: `0 0 16px ${t.glow}, inset 0 0 8px ${t.glow}`,
                      }
                    : {}
                }
                title={t.label}
              >
                <Icon
                  size={15}
                  style={{
                    color: t.color,
                    filter: `drop-shadow(0 0 6px ${t.glow})`,
                  }}
                />
                <span className="text-[9px] mt-0.5 text-slate-200/90 leading-tight text-center">
                  {t.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-4 space-y-2">
        <button
          type="button"
          onClick={dropMemory}
          disabled={!text.trim() || !!droppingStar}
          className="btn-glow w-full rounded-xl py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-purple-600 via-fuchsia-600 to-purple-600 hover:from-purple-500 hover:via-fuchsia-500 hover:to-purple-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="inline-flex items-center gap-2 justify-center">
            <Sparkles size={16} /> Drop Into Jar
          </span>
        </button>

        <div className="text-center text-xs text-slate-100 text-safe leading-relaxed">
          {memories.length}{" "}
          {memories.length === 1 ? "memory / note" : "memories / notes"} in the
          jar
          {othersMemories.length > 0 && (
            <span className="text-slate-300/80">
              {" "}
              · {othersMemories.length} by real people (others)
            </span>
          )}
        </div>
      </div>
    </>
  );
}

function App() {
  const [userMemories, setUserMemories] = useState([]);
  const [mineIdsVersion, setMineIdsVersion] = useState(0);
  const bumpMineIds = useCallback(() => setMineIdsVersion((v) => v + 1), []);

  const mineIds = useMemo(() => loadMineIds(), [mineIdsVersion, userMemories]);
  const myMemories = useMemo(
    () => userMemories.filter((m) => mineIds.has(m.id)),
    [userMemories, mineIds],
  );
  const othersMemories = useMemo(
    () => userMemories.filter((m) => !mineIds.has(m.id)),
    [userMemories, mineIds],
  );

  // One-time: treat pre-existing local memories as "yours" on this device
  useEffect(() => {
    if (localStorage.getItem("memoryJarMineMigrated")) return;
    try {
      const saved = JSON.parse(localStorage.getItem("memoryJar") || "[]");
      const set = loadMineIds();
      saved.filter(isUserMemory).forEach((m) => set.add(m.id));
      persistMineIds(set);
      localStorage.setItem("memoryJarMineMigrated", "1");
      bumpMineIds();
    } catch {}
  }, [bumpMineIds]);

  const memories = useMemo(() => userMemories, [userMemories]);
  const userMemoryCount = userMemories.length;
  const [text, setText] = useState("");
  const [type, setType] = useState("secret");
  const [author, setAuthor] = useState("");
  const [droppingStar, setDroppingStar] = useState(null); // animation of newly dropped star
  const [revealed, setRevealed] = useState(null); // memory being revealed
  const [memoryFormOpen, setMemoryFormOpen] = useState(false);
  const jarMemories = useMemo(
    () => (revealed ? memories.filter((m) => m.id !== revealed.id) : memories),
    [memories, revealed?.id],
  );
  const [sparkles, setSparkles] = useState([]);
  const shakeRef = useRef(0);
  const wakePhysicsRef = useRef(() => {});
  const jarRef = useRef(null);
  const dragState = useRef({
    dragging: false,
    lastX: 0,
    lastY: 0,
    moved: false,
  });
  const revealedRef = useRef(null);
  revealedRef.current = revealed;

  // Load memories: try Supabase first, fall back to localStorage cache
  useEffect(() => {
    let cancelled = false;
    // 1) instant local cache render
    try {
      const saved = JSON.parse(localStorage.getItem("memoryJar") || "[]");
      if (Array.isArray(saved)) {
        setUserMemories(saved.filter(isUserMemory));
      }
    } catch {}
    // 2) authoritative Supabase load
    (async () => {
      try {
        const res = await fetch("/api/memories");
        const body = await res.json();
        if (cancelled) return;
        if (Array.isArray(body?.memories) && body.supabase) {
          const normalized = body.memories
            .filter((m) => !m.archived)
            .map((m) => ({
            id: m.id,
            text: m.text,
            type: m.type || "secret",
            author: m.author,
            createdAt: m.created_at
              ? new Date(m.created_at).getTime()
              : Date.now(),
          }));
          setUserMemories(normalized.filter(isUserMemory));
        }
      } catch {}
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // keep a localStorage cache mirror so returning visitors see stars instantly
  useEffect(() => {
    localStorage.setItem(
      "memoryJar",
      JSON.stringify(userMemories.filter(isUserMemory)),
    );
  }, [userMemories]);

  const positions = useJarPhysics(jarMemories, shakeRef, wakePhysicsRef);

  // Sparkle trail cleanup
  useEffect(() => {
    if (sparkles.length === 0) return;
    const timeout = setTimeout(() => setSparkles([]), 1400);
    return () => clearTimeout(timeout);
  }, [sparkles]);

  const emitSparkles = (fromX, fromY, color, count = 12) => {
    const pts = [];
    for (let i = 0; i < count; i++) {
      pts.push({
        id: Math.random().toString(36),
        x: fromX + (Math.random() - 0.5) * 40,
        y: fromY + (Math.random() - 0.5) * 40,
        color,
      });
    }
    setSparkles(pts);
  };

  const dropMemory = () => {
    if (!text.trim()) return;
    const tempId = crypto.randomUUID();
    const trimmed = text.trim();
    const m = {
      id: tempId,
      text: trimmed,
      type,
      author: author.trim() || null,
      createdAt: Date.now(),
    };
    const payload = { text: trimmed, type: m.type, author: m.author };

    setDroppingStar({ id: m.id, color: typeMeta(type).color });
    saveMineId(tempId);
    bumpMineIds();
    setText("");
    setAuthor("");
    setMemoryFormOpen(false);

    // After the drop animation, add to jar
    setTimeout(() => {
      setUserMemories((prev) => [...prev, m]);
      setDroppingStar(null);
      const rect = jarRef.current?.getBoundingClientRect();
      if (rect)
        emitSparkles(
          rect.left + rect.width / 2,
          rect.top + 60,
          typeMeta(m.type).color,
          18,
        );
    }, 1400);

    // Persist to Supabase in background; reconcile id
    (async () => {
      try {
        const res = await fetch("/api/memories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) return;
        const body = await res.json();
        const saved = body?.memory;
        if (saved?.id) {
          replaceMineId(tempId, saved.id);
          bumpMineIds();
          setUserMemories((prev) =>
            prev.map((x) =>
              x.id === tempId
                ? {
                    id: saved.id,
                    text: saved.text,
                    type: saved.type,
                    author: saved.author,
                    createdAt: saved.created_at
                      ? new Date(saved.created_at).getTime()
                      : Date.now(),
                  }
                : x,
            ),
          );
        }
      } catch {
        // offline / no supabase configured -> keep local copy silently
      }
    })();
  };

  const shakeJar = (intensity = 8) => {
    shakeRef.current = Math.min(30, (shakeRef.current || 0) + intensity);
    wakePhysicsRef.current();
  };

  const pickRandomFrom = useCallback(
    (pool, { instant = true } = {}) => {
      if (revealedRef.current) return;
      let list = [];
      if (pool === "people") list = userMemories;
      else if (pool === "others") list = othersMemories;
      else if (pool === "yours") list = myMemories;
      else list = memories;
      if (list.length === 0) return;
      const picked = pickShuffledFromPool(list);
      if (!picked) return;
      setRevealed({ ...picked, _instant: instant });
    },
    [userMemories, memories, myMemories, othersMemories],
  );

  const closeReveal = useCallback(() => {
    setRevealed(null);
  }, []);

  const onJarPointerDown = (e) => {
    dragState.current = {
      dragging: true,
      lastX: e.clientX,
      lastY: e.clientY,
      moved: false,
    };
    shakeJar(4);
  };
  const onJarPointerMove = (e) => {
    if (!dragState.current.dragging) return;
    const dx = e.clientX - dragState.current.lastX;
    const dy = e.clientY - dragState.current.lastY;
    dragState.current.lastX = e.clientX;
    dragState.current.lastY = e.clientY;
    if (Math.abs(dx) + Math.abs(dy) > 6) dragState.current.moved = true;
    const mag = Math.min(20, Math.abs(dx) + Math.abs(dy));
    if (mag > 3) shakeJar(mag * 0.6);
  };
  const onJarPointerUp = () => {
    dragState.current.dragging = false;
  };

  const onJarClick = () => {
    if (dragState.current.moved) return;
    shakeJar(3);
    pickRandomFrom("any", { instant: true });
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden select-none">
      <GalaxyBackground />

      {/* Vibrant Starry Night washes — keep light so the painting shows through */}
      <div
        className="fixed inset-0 z-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at 85% 17%, rgba(255, 220, 100, 0.22) 0%, transparent 45%), radial-gradient(ellipse at 15% 75%, rgba(120, 80, 220, 0.18) 0%, transparent 50%), radial-gradient(ellipse at 50% 100%, rgba(30, 100, 200, 0.15) 0%, transparent 55%)",
        }}
      />
      <div
        className="fixed inset-0 z-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at 50% 45%, rgba(4, 8, 26, 0) 0%, rgba(4, 8, 26, 0.18) 65%, rgba(4, 8, 26, 0.42) 100%)",
        }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col min-h-[100dvh]">
        <div className="flex-shrink-0 px-3 sm:px-4 pt-4 sm:pt-6 lg:pt-8">
          {/* Header */}
          <motion.header
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="text-center mx-auto px-4 py-2.5 sm:py-3 rounded-xl bg-black/50 backdrop-blur-md border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)] max-w-lg w-full"
          >
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight">
              <span className="inline-block text-[#f3e8ff] title-glow">
                &#x2B50; Digital Memory Jar
              </span>
            </h1>
            <p className="text-slate-100 mt-1 italic text-[11px] sm:text-xs text-safe-strong">
              Leave a little piece of your heart among the stars.
            </p>
            <p className="text-slate-100 mt-1 italic text-[11px] sm:text-xs text-safe-strong">
              Tap the jar to draw a random memory / note
            </p>
          </motion.header>
        </div>

        {/* Jar + form — jar centered in remaining space */}
        <main className="flex-1 flex flex-col lg:flex-row items-center justify-center gap-6 lg:gap-10 w-full max-w-5xl mx-auto px-3 sm:px-4 pb-24">
          {/* Desktop: memory form */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, delay: 0.3 }}
            className="hidden lg:block flex-shrink-0 w-[320px] self-center"
          >
            <div className="rounded-2xl p-4 border border-white/15 bg-black/45 backdrop-blur-md shadow-2xl">
              <MemoryFormFields
                text={text}
                setText={setText}
                author={author}
                setAuthor={setAuthor}
                type={type}
                setType={setType}
                dropMemory={dropMemory}
                droppingStar={droppingStar}
                memories={memories}
                othersMemories={othersMemories}
              />
            </div>
          </motion.div>

          {/* Jar */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, delay: 0.4 }}
            className="relative flex-shrink-0 flex items-center justify-center"
          >
            <div
              className="relative origin-center scale-[0.78] sm:scale-90 lg:scale-100"
              style={{ width: JAR_W, height: JAR_H + 80 }}
            >
              <JarSVG
                ref={jarRef}
                positions={positions}
                memories={jarMemories}
                onPointerDown={onJarPointerDown}
                onPointerMove={onJarPointerMove}
                onPointerUp={onJarPointerUp}
                onPointerLeave={onJarPointerUp}
                onClick={onJarClick}
              />
              <SparkleTrail points={[]} />
            </div>
          </motion.div>
        </main>

        {/* Footer — admin left, write button right (mobile) */}
        <footer className="fixed bottom-0 inset-x-0 z-30 bg-black/65 backdrop-blur-lg border-t border-white/10 shadow-[0_-8px_32px_rgba(0,0,0,0.45)]">
          <div className="flex items-center justify-between gap-3 px-4 py-3 sm:py-3.5 max-w-5xl mx-auto w-full pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            <Link
              href="/admin"
              className="inline-flex items-center gap-1 text-[10px] sm:text-xs text-slate-400 hover:text-slate-200 transition-colors"
              aria-label="Admin access"
            >
              <Lock size={12} />
              Admin
            </Link>
            <button
              type="button"
              onClick={() => setMemoryFormOpen(true)}
              className="lg:hidden flex-shrink-0 flex items-center justify-center w-11 h-11 rounded-full bg-gradient-to-br from-purple-600 to-fuchsia-600 text-white shadow-[0_2px_16px_rgba(168,85,247,0.5)] border border-white/25 active:scale-95 transition-transform"
              aria-label="Write a memory or note"
            >
              <PenLine size={20} strokeWidth={2.25} />
            </button>
          </div>
        </footer>
      </div>

      <Sheet open={memoryFormOpen} onOpenChange={setMemoryFormOpen}>
        <SheetContent
          side="bottom"
          className="lg:hidden rounded-t-2xl border-white/15 bg-indigo-950/95 backdrop-blur-xl text-white max-h-[82vh] overflow-y-auto px-4 pb-6 pt-2"
        >
          <SheetHeader className="text-left mb-2">
            <SheetTitle className="text-white text-base font-semibold">
              Write a memory / note
            </SheetTitle>
          </SheetHeader>
          <MemoryFormFields
            compact
            text={text}
            setText={setText}
            author={author}
            setAuthor={setAuthor}
            type={type}
            setType={setType}
            dropMemory={dropMemory}
            droppingStar={droppingStar}
            memories={memories}
            othersMemories={othersMemories}
          />
        </SheetContent>
      </Sheet>

      {/* Sparkles overlay */}
      <div className="fixed inset-0 pointer-events-none z-40">
        <SparkleTrail points={sparkles} />
      </div>

      {/* Dropping star animation */}
      <AnimatePresence>
        {droppingStar && (
          <DroppingStarAnim color={droppingStar.color} jarRef={jarRef} />
        )}
      </AnimatePresence>

      {/* Reveal card */}
      <AnimatePresence>
        {revealed && (
          <RevealCard
            key={revealed.id}
            memory={revealed}
            instant={Boolean(revealed._instant)}
            onClose={closeReveal}
            jarRef={jarRef}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ---------- Jar SVG with stars inside ----------

const JarSVG = forwardRef(function JarSVG(
  {
    positions,
    memories,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerLeave,
    onClick,
  },
  ref,
) {
  // Center of physics area within svg
  const cx = JAR_W / 2;
  const cy = JAR_PHYSICS_CY;
  const starOffset = JAR_STAR_SIZE / 2;

  return (
    <div
      ref={ref}
      className="relative cursor-grab active:cursor-grabbing"
      style={{ width: JAR_W, height: JAR_H + 80, touchAction: "none" }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerLeave}
      onClick={onClick}
    >
      {/* Single shelf — jar rests on this */}
      <div
        className="absolute left-1/2 -translate-x-1/2"
        style={{
          bottom: 14,
          width: JAR_W + 48,
          height: 28,
          borderRadius: 8,
          background:
            "linear-gradient(to bottom, #7a4a25 0%, #6a3d1e 40%, #4d2b13 100%)",
          boxShadow:
            "inset 0 2px 6px rgba(255,180,120,0.35), 0 10px 28px rgba(0,0,0,0.55), 0 4px 12px rgba(0,0,0,0.35)",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: 8,
            opacity: 0.35,
            background:
              "repeating-linear-gradient(90deg, rgba(0,0,0,0.15) 0 2px, transparent 2px 22px)",
          }}
        />
      </div>

      <svg width={JAR_W} height={JAR_H + 80} className="absolute inset-0">
        <defs>
          <linearGradient id="glassBody" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="rgba(200,220,255,0.42)" />
            <stop offset="50%" stopColor="rgba(150,180,240,0.32)" />
            <stop offset="100%" stopColor="rgba(120,150,220,0.38)" />
          </linearGradient>
          <linearGradient id="glassHighlight" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(255,255,255,0.75)" />
            <stop offset="40%" stopColor="rgba(255,255,255,0.12)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </linearGradient>
          <radialGradient id="innerGlow" cx="0.5" cy="0.6" r="0.7">
            <stop offset="0%" stopColor="rgba(190,150,255,0.35)" />
            <stop offset="70%" stopColor="rgba(50,30,90,0.05)" />
          </radialGradient>
          <clipPath id="jarClip" clipPathUnits="userSpaceOnUse">
            <path d={jarBodyPath()} />
          </clipPath>
        </defs>

        {/* Jar lid */}
        <g>
          <rect
            x={cx - 70}
            y={20}
            width={140}
            height={22}
            rx={6}
            fill="#3a2a1a"
            stroke="#1c130a"
            strokeWidth="1"
          />
          <rect
            x={cx - 70}
            y={22}
            width={140}
            height={6}
            rx={3}
            fill="rgba(255,220,180,0.15)"
          />
        </g>

        {/* Frosted glass backing for visibility */}
        <path d={jarBodyPath()} fill="rgba(180,200,255,0.18)" />

        {/* Jar body outline & fill */}
        <path
          d={jarBodyPath()}
          fill="url(#glassBody)"
          stroke="rgba(200,220,255,0.72)"
          strokeWidth="2.2"
        />
        <path d={jarBodyPath()} fill="url(#innerGlow)" />

        {/* Inner cumulative glow from stars */}
        <g clipPath="url(#jarClip)">
          {memories.map((m) => {
            const p = positions.find((pp) => pp.id === m.id);
            if (!p) return null;
            const meta = typeMeta(m.type);
            return (
              <circle
                key={`glow-${m.id}`}
                cx={cx + p.x}
                cy={cy + p.y}
                r={JAR_STAR_SIZE * 0.85}
                fill={meta.color}
                opacity="0.18"
                style={{ filter: "blur(8px)" }}
              />
            );
          })}
        </g>

        {/* Highlights (glass reflections) */}
        <path
          d={jarHighlightPath()}
          fill="url(#glassHighlight)"
          opacity="0.95"
        />
        <path d={jarHighlightRightPath()} fill="rgba(255,255,255,0.18)" />

        {/* Paper stars — clipped to jar interior */}
        <g clipPath="url(#jarClip)">
          {memories.map((m) => {
            const p = positions.find((pp) => pp.id === m.id);
            if (!p) return null;
            const meta = typeMeta(m.type);
            return (
              <g
                key={m.id}
                transform={`translate(${cx + p.x}, ${cy + p.y}) rotate(${p.rot})`}
              >
                <g transform={`translate(${-starOffset}, ${-starOffset})`}>
                  <PaperStar color={meta.color} size={JAR_STAR_SIZE} />
                </g>
              </g>
            );
          })}
        </g>
      </svg>

      {/* Empty state */}
      {memories.length === 0 && (
        <div
          className="absolute inset-x-0 flex justify-center pointer-events-none"
          style={{ top: cy - 10 }}
        >
          <div className="text-center px-6">
            <div
              className="text-slate-300/80 italic text-sm max-w-[220px] leading-relaxed"
              style={{ textShadow: "0 0 12px rgba(200,180,255,0.5)" }}
            >
              The night is waiting for its first memory.
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

function jarBodyPath() {
  // A jar body: neck (narrow) at top, wider body, rounded bottom
  const cx = JAR_W / 2;
  const topY = 42;
  const shoulderTopY = 70;
  const shoulderBotY = 110;
  const bottomY = 460;
  const neckHalf = 60;
  const bodyHalf = 130;
  return `
    M ${cx - neckHalf} ${topY}
    L ${cx - neckHalf} ${shoulderTopY}
    C ${cx - neckHalf} ${shoulderTopY + 12}, ${cx - bodyHalf} ${shoulderBotY - 12}, ${cx - bodyHalf} ${shoulderBotY}
    L ${cx - bodyHalf} ${bottomY - 30}
    C ${cx - bodyHalf} ${bottomY}, ${cx - bodyHalf + 40} ${bottomY + 4}, ${cx} ${bottomY + 4}
    C ${cx + bodyHalf - 40} ${bottomY + 4}, ${cx + bodyHalf} ${bottomY}, ${cx + bodyHalf} ${bottomY - 30}
    L ${cx + bodyHalf} ${shoulderBotY}
    C ${cx + bodyHalf} ${shoulderBotY - 12}, ${cx + neckHalf} ${shoulderTopY + 12}, ${cx + neckHalf} ${shoulderTopY}
    L ${cx + neckHalf} ${topY}
    Z
  `;
}

function jarHighlightPath() {
  const cx = JAR_W / 2;
  return `
    M ${cx - 110} 130
    C ${cx - 118} 220, ${cx - 118} 340, ${cx - 100} 420
    L ${cx - 92} 420
    C ${cx - 108} 340, ${cx - 108} 220, ${cx - 100} 138
    Z
  `;
}
function jarHighlightRightPath() {
  const cx = JAR_W / 2;
  return `
    M ${cx + 100} 150
    C ${cx + 112} 240, ${cx + 112} 340, ${cx + 96} 400
    L ${cx + 88} 400
    C ${cx + 104} 340, ${cx + 104} 240, ${cx + 92} 150
    Z
  `;
}

// ---------- Dropping Star Animation ----------
function DroppingStarAnim({ color, jarRef }) {
  const [target, setTarget] = useState(null);

  useEffect(() => {
    if (!jarRef.current) return;
    const rect = jarRef.current.getBoundingClientRect();
    setTarget({
      x: rect.left + rect.width / 2 - 12,
      y: rect.top + 80,
    });
  }, [jarRef]);

  if (!target) return null;

  return (
    <motion.div
      initial={{
        x: window.innerWidth / 2 - 12,
        y: window.innerHeight - 240,
        scale: 0.5,
        opacity: 0,
      }}
      animate={{ x: target.x, y: target.y, scale: 1, opacity: 1, rotate: 720 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.4, ease: [0.4, 0, 0.2, 1] }}
      className="fixed z-50 pointer-events-none"
      style={{ left: 0, top: 0 }}
    >
      <div className="paper-star" style={{ color }}>
        <PaperStar color={color} size={32} />
      </div>
      {/* sparkle trail */}
      <motion.div
        animate={{ opacity: [0.9, 0], scale: [1, 2] }}
        transition={{ duration: 1.4, ease: "easeOut" }}
        className="absolute inset-0"
        style={{
          width: 32,
          height: 32,
          borderRadius: 999,
          background: `radial-gradient(circle, ${color} 0%, transparent 60%)`,
          filter: "blur(6px)",
        }}
      />
    </motion.div>
  );
}

// ---------- Reveal Card ----------
function RevealCard({ memory, onClose, jarRef, instant = false }) {
  const meta = typeMeta(memory.type);
  const [phase, setPhase] = useState(instant ? "shown" : "floating");
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (instant) {
      setPhase("shown");
      const onKey = (e) => {
        if (e.key === "Escape") onCloseRef.current();
      };
      window.addEventListener("keydown", onKey);
      return () => window.removeEventListener("keydown", onKey);
    }

    setPhase("floating");
    const t1 = setTimeout(() => setPhase("unfolding"), 500);
    const t2 = setTimeout(() => setPhase("shown"), 1100);
    const onKey = (e) => {
      if (e.key === "Escape") onCloseRef.current();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      window.removeEventListener("keydown", onKey);
    };
  }, [memory.id, instant]);

  const rect = jarRef.current?.getBoundingClientRect();
  const originX = rect ? rect.left + rect.width / 2 : window.innerWidth / 2;
  const originY = rect ? rect.top + rect.height / 2 : window.innerHeight / 2;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center touch-manipulation cursor-pointer px-4 sm:px-6"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Memory reveal"
    >
      {/* Lighter backdrop — let the painting glow through */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.28 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-indigo-950/50 pointer-events-none"
      />

      {/* Close button — always visible */}
      <button
        type="button"
        aria-label="Close memory"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        className="absolute top-4 right-4 z-30 pointer-events-auto flex items-center justify-center w-11 h-11 rounded-full bg-black/55 border border-white/30 text-white hover:bg-black/75 hover:border-white/50 backdrop-blur-md shadow-lg transition-colors"
      >
        <X size={22} strokeWidth={2.5} />
      </button>

      <p className="absolute bottom-6 left-0 right-0 z-30 text-center text-xs text-white/70 text-safe pointer-events-none px-4">
        Tap anywhere or press ✕ to close
      </p>

      {/* Floating star / card — taps pass through to overlay */}
      <motion.div
        initial={{
          x: originX - window.innerWidth / 2,
          y: originY - window.innerHeight / 2,
          scale: 0.7,
          opacity: 0,
        }}
        animate={
          phase === "floating"
            ? { x: 0, y: -20, scale: 1, opacity: 1 }
            : phase === "folding"
              ? {
                  x: originX - window.innerWidth / 2,
                  y: originY - window.innerHeight / 2,
                  scale: 0.6,
                  opacity: 0,
                  rotate: 360,
                }
              : { x: 0, y: 0, scale: 1, opacity: 1 }
        }
        transition={{
          duration: phase === "folding" ? 1.2 : 1,
          ease: [0.4, 0, 0.2, 1],
        }}
        className="relative z-10 pointer-events-none w-full max-w-md"
      >
        {phase === "floating" && (
          <motion.div
            animate={{ rotate: 720 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
          >
            <PaperStar color={meta.color} size={80} />
          </motion.div>
        )}
        {phase === "unfolding" && (
          <motion.div
            initial={{ scale: 0.5, rotateY: 0 }}
            animate={{ scale: 1.05, rotateY: 360 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            style={{ transformStyle: "preserve-3d" }}
          >
            <PaperStar color={meta.color} size={60} />
          </motion.div>
        )}
        {phase === "shown" && (
          <>
            <p className="text-center text-xs uppercase tracking-widest text-slate-200/90 mb-3 text-safe pointer-events-none">
              {memorySourceLabel()}
            </p>
            <motion.div
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="relative rounded-2xl sm:rounded-3xl px-4 py-5 sm:px-8 sm:py-7 w-full border border-white/20 bg-gradient-to-b from-white/15 to-white/5 backdrop-blur-xl shadow-2xl"
              style={{
                boxShadow: `0 0 40px ${meta.color}66, 0 0 80px ${meta.color}44, inset 0 0 24px rgba(255,255,255,0.08)`,
              }}
            >
              <div
                className="flex items-center gap-2 text-xs uppercase tracking-widest mb-3"
                style={{ color: meta.color }}
              >
                <StarIcon size={12} /> {meta.label} memory / note
              </div>
              <p className="text-slate-50 text-base sm:text-lg leading-relaxed whitespace-pre-wrap break-words">
                {memory.text}
              </p>
            {memory.author && (
              <div className="mt-4 text-right text-sm text-slate-300/80 italic">
                &mdash; {memory.author}
              </div>
            )}
            <div className="mt-3 text-[10px] text-slate-400">
              {new Date(memory.createdAt).toLocaleString()}
            </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onClose();
                }}
                className="mt-5 w-full pointer-events-auto rounded-xl py-2.5 text-sm font-medium text-slate-200 bg-white/10 hover:bg-white/20 border border-white/20 transition-colors"
              >
                Close
              </button>
              {/* corner sparkles */}
              <div className="absolute -top-2 -right-2">
                <PaperStar color={meta.color} size={20} />
              </div>
            </motion.div>
          </>
        )}
        {phase === "folding" && <PaperStar color={meta.color} size={40} />}
      </motion.div>
    </div>
  );
}

export default App;
