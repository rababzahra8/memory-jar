'use client'

import { useEffect, useRef, useState, useCallback, forwardRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Moon, Heart, BookOpen, Smile, Star as StarIcon } from 'lucide-react'

const MEMORY_TYPES = [
  { id: 'secret', label: 'Secret', icon: Sparkles, color: '#c084fc', glow: 'rgba(192,132,252,0.9)' },
  { id: 'named',  label: 'Named',  icon: Heart,    color: '#f472b6', glow: 'rgba(244,114,182,0.9)' },
  { id: 'dream',  label: 'Dream',  icon: Moon,     color: '#60a5fa', glow: 'rgba(96,165,250,0.9)' },
  { id: 'story',  label: 'Story',  icon: BookOpen, color: '#fbbf24', glow: 'rgba(251,191,36,0.9)' },
  { id: 'funny',  label: 'Funny',  icon: Smile,    color: '#fb923c', glow: 'rgba(251,146,60,0.9)' },
]

const typeMeta = (id) => MEMORY_TYPES.find(t => t.id === id) || MEMORY_TYPES[0]

// ---------- Galaxy Background (Canvas) ----------
function GalaxyBackground() {
  const canvasRef = useRef(null)
  const mouseRef = useRef({ x: 0, y: 0 })

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    let w = canvas.width = window.innerWidth
    let h = canvas.height = window.innerHeight
    let raf

    const stars = Array.from({ length: 350 }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: Math.random() * 1.4 + 0.2,
      tw: Math.random() * Math.PI * 2,
      twSpeed: Math.random() * 0.02 + 0.004,
      depth: Math.random() * 0.6 + 0.2,
      hue: 200 + Math.random() * 80,
    }))

    const dust = Array.from({ length: 60 }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.15,
      vy: (Math.random() - 0.5) * 0.15,
      r: Math.random() * 1.6 + 0.4,
      a: Math.random() * 0.4 + 0.1,
    }))

    const nebulae = Array.from({ length: 5 }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: 200 + Math.random() * 260,
      hue: [270, 220, 300, 190, 330][Math.floor(Math.random() * 5)],
      drift: Math.random() * 0.05 + 0.01,
    }))

    let shooting = []
    let nextShoot = performance.now() + 4000

    const onResize = () => {
      w = canvas.width = window.innerWidth
      h = canvas.height = window.innerHeight
    }
    const onMove = (e) => {
      mouseRef.current.x = (e.clientX / w - 0.5)
      mouseRef.current.y = (e.clientY / h - 0.5)
    }
    window.addEventListener('resize', onResize)
    window.addEventListener('mousemove', onMove)

    const draw = (t) => {
      ctx.fillStyle = '#04040d'
      ctx.fillRect(0, 0, w, h)

      // Nebulae
      for (const n of nebulae) {
        n.x += n.drift
        if (n.x - n.r > w) n.x = -n.r
        const g = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r)
        g.addColorStop(0, `hsla(${n.hue}, 90%, 60%, 0.22)`)
        g.addColorStop(0.4, `hsla(${n.hue}, 90%, 50%, 0.08)`)
        g.addColorStop(1, 'hsla(0, 0%, 0%, 0)')
        ctx.fillStyle = g
        ctx.fillRect(0, 0, w, h)
      }

      // Aurora subtle
      const auroraGrad = ctx.createLinearGradient(0, h * 0.2, 0, h * 0.9)
      auroraGrad.addColorStop(0, 'rgba(120,80,200,0.05)')
      auroraGrad.addColorStop(0.5, 'rgba(70,130,220,0.08)')
      auroraGrad.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.fillStyle = auroraGrad
      ctx.fillRect(0, 0, w, h)

      // Stars with parallax + twinkle
      const mx = mouseRef.current.x * 30
      const my = mouseRef.current.y * 30
      for (const s of stars) {
        s.tw += s.twSpeed
        const alpha = 0.5 + Math.sin(s.tw) * 0.5
        ctx.beginPath()
        const px = s.x - mx * s.depth
        const py = s.y - my * s.depth
        ctx.arc(px, py, s.r, 0, Math.PI * 2)
        ctx.fillStyle = `hsla(${s.hue}, 100%, 90%, ${alpha})`
        ctx.shadowBlur = 6
        ctx.shadowColor = `hsla(${s.hue}, 100%, 80%, ${alpha})`
        ctx.fill()
      }
      ctx.shadowBlur = 0

      // Dust
      for (const d of dust) {
        d.x += d.vx
        d.y += d.vy
        if (d.x < 0) d.x = w
        if (d.x > w) d.x = 0
        if (d.y < 0) d.y = h
        if (d.y > h) d.y = 0
        ctx.beginPath()
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(220, 220, 255, ${d.a})`
        ctx.fill()
      }

      // Shooting stars
      if (t > nextShoot) {
        shooting.push({
          x: Math.random() * w * 0.6,
          y: Math.random() * h * 0.4,
          vx: 8 + Math.random() * 5,
          vy: 3 + Math.random() * 3,
          life: 60,
        })
        nextShoot = t + 8000 + Math.random() * 7000
      }
      shooting = shooting.filter(sh => sh.life > 0)
      for (const sh of shooting) {
        const tailX = sh.x - sh.vx * 8
        const tailY = sh.y - sh.vy * 8
        const grad = ctx.createLinearGradient(tailX, tailY, sh.x, sh.y)
        grad.addColorStop(0, 'rgba(255,255,255,0)')
        grad.addColorStop(1, `rgba(255,255,255,${sh.life / 60})`)
        ctx.strokeStyle = grad
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(tailX, tailY)
        ctx.lineTo(sh.x, sh.y)
        ctx.stroke()
        sh.x += sh.vx
        sh.y += sh.vy
        sh.life -= 1
      }

      // Moon glow top-right
      const moonG = ctx.createRadialGradient(w * 0.85, h * 0.18, 0, w * 0.85, h * 0.18, 240)
      moonG.addColorStop(0, 'rgba(255,240,220,0.35)')
      moonG.addColorStop(0.3, 'rgba(255,240,220,0.10)')
      moonG.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.fillStyle = moonG
      ctx.fillRect(0, 0, w, h)
      ctx.beginPath()
      ctx.arc(w * 0.85, h * 0.18, 42, 0, Math.PI * 2)
      ctx.fillStyle = 'rgba(255,245,225,0.85)'
      ctx.shadowBlur = 40
      ctx.shadowColor = 'rgba(255,240,220,0.7)'
      ctx.fill()
      ctx.shadowBlur = 0

      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', onResize)
      window.removeEventListener('mousemove', onMove)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full z-0"
      style={{ pointerEvents: 'none' }}
    />
  )
}

// ---------- Paper Star SVG ----------
function PaperStar({ color = '#c084fc', size = 22, rotate = 0 }) {
  return (
    <svg width={size} height={size} viewBox="-12 -12 24 24" style={{ color, transform: `rotate(${rotate}deg)`, filter: `drop-shadow(0 0 6px ${color})` }}>
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
      <line x1="0" y1="-10" x2="0" y2="4" stroke="rgba(255,255,255,0.35)" strokeWidth="0.3" />
      <line x1="-10" y1="-3.1" x2="6.5" y2="8.1" stroke="rgba(255,255,255,0.15)" strokeWidth="0.3" />
    </svg>
  )
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
          transition={{ duration: 1.2, ease: 'easeOut' }}
          className="absolute pointer-events-none"
          style={{
            left: p.x, top: p.y,
            width: 6, height: 6,
            borderRadius: 999,
            background: p.color,
            boxShadow: `0 0 12px ${p.color}, 0 0 24px ${p.color}`,
          }}
        />
      ))}
    </>
  )
}

// ---------- The Jar ----------
// Jar physics coordinate system:
// Container size 340 x 460 (width x height)
// Interior physics rect: x in [-140, 140], y in [-200, 200]
// Gravity pulls stars toward y = 200 (bottom)

const JAR_W = 340
const JAR_H = 460
const INNER_W = 260   // physics width
const INNER_H = 380   // physics height
const STAR_R = 12     // approximate radius for collision

function useJarPhysics(memories, shakeRef) {
  const [positions, setPositions] = useState([])
  const stateRef = useRef([])
  const rafRef = useRef(null)

  // Sync state when memories change (add/remove)
  useEffect(() => {
    const prev = stateRef.current
    const next = memories.map((m, i) => {
      const existing = prev.find(p => p.id === m.id)
      if (existing) return existing
      // spawn near top with downward velocity
      return {
        id: m.id,
        x: (Math.random() - 0.5) * (INNER_W - STAR_R * 2) * 0.6,
        y: -INNER_H / 2 + 20,
        vx: (Math.random() - 0.5) * 2,
        vy: 0.5,
        rot: Math.random() * 360,
        vrot: (Math.random() - 0.5) * 3,
      }
    })
    stateRef.current = next
  }, [memories])

  useEffect(() => {
    let last = performance.now()
    const step = (t) => {
      const dt = Math.min(32, t - last) / 16.6
      last = t
      const gravity = 0.35 * dt
      const damping = 0.985
      const restitution = 0.55

      // process shake impulses
      if (shakeRef.current > 0) {
        for (const p of stateRef.current) {
          p.vx += (Math.random() - 0.5) * shakeRef.current
          p.vy += (Math.random() - 0.5) * shakeRef.current
          p.vrot += (Math.random() - 0.5) * shakeRef.current
        }
        shakeRef.current *= 0.85
        if (shakeRef.current < 0.05) shakeRef.current = 0
      }

      const arr = stateRef.current
      // integrate
      for (const p of arr) {
        p.vy += gravity
        p.vx *= damping
        p.vy *= damping
        p.vrot *= 0.97
        p.x += p.vx * dt
        p.y += p.vy * dt
        p.rot += p.vrot * dt

        // walls
        const hx = INNER_W / 2 - STAR_R
        const hy = INNER_H / 2 - STAR_R
        if (p.x < -hx) { p.x = -hx; p.vx = -p.vx * restitution }
        if (p.x >  hx) { p.x =  hx; p.vx = -p.vx * restitution }
        if (p.y < -hy) { p.y = -hy; p.vy = -p.vy * restitution }
        if (p.y >  hy) { p.y =  hy; p.vy = -p.vy * restitution; p.vx *= 0.9 }
      }

      // simple pairwise collision
      for (let i = 0; i < arr.length; i++) {
        for (let j = i + 1; j < arr.length; j++) {
          const a = arr[i], b = arr[j]
          const dx = b.x - a.x, dy = b.y - a.y
          const d2 = dx*dx + dy*dy
          const min = STAR_R * 2
          if (d2 < min * min && d2 > 0.01) {
            const d = Math.sqrt(d2)
            const overlap = (min - d) / 2
            const nx = dx / d, ny = dy / d
            a.x -= nx * overlap; a.y -= ny * overlap
            b.x += nx * overlap; b.y += ny * overlap
            // exchange velocity along normal
            const va = a.vx * nx + a.vy * ny
            const vb = b.vx * nx + b.vy * ny
            const diff = (vb - va) * 0.5
            a.vx += diff * nx; a.vy += diff * ny
            b.vx -= diff * nx; b.vy -= diff * ny
          }
        }
      }

      setPositions(arr.map(p => ({ id: p.id, x: p.x, y: p.y, rot: p.rot })))
      rafRef.current = requestAnimationFrame(step)
    }
    rafRef.current = requestAnimationFrame(step)
    return () => cancelAnimationFrame(rafRef.current)
  }, [shakeRef])

  return positions
}

// ---------- Main App ----------
function App() {
  const [memories, setMemories] = useState([])
  const [text, setText] = useState('')
  const [type, setType] = useState('secret')
  const [author, setAuthor] = useState('')
  const [droppingStar, setDroppingStar] = useState(null) // animation of newly dropped star
  const [revealed, setRevealed] = useState(null) // memory being revealed
  const [sparkles, setSparkles] = useState([])
  const shakeRef = useRef(0)
  const jarRef = useRef(null)
  const dragState = useRef({ dragging: false, lastX: 0, lastY: 0 })

  // Load from localStorage
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('memoryJar') || '[]')
      if (Array.isArray(saved)) setMemories(saved)
    } catch {}
  }, [])

  useEffect(() => {
    localStorage.setItem('memoryJar', JSON.stringify(memories))
  }, [memories])

  const positions = useJarPhysics(memories.filter(m => m.id !== revealed?.id), shakeRef)

  // Sparkle trail cleanup
  useEffect(() => {
    if (sparkles.length === 0) return
    const timeout = setTimeout(() => setSparkles([]), 1400)
    return () => clearTimeout(timeout)
  }, [sparkles])

  const emitSparkles = (fromX, fromY, color, count = 12) => {
    const pts = []
    for (let i = 0; i < count; i++) {
      pts.push({
        id: Math.random().toString(36),
        x: fromX + (Math.random() - 0.5) * 40,
        y: fromY + (Math.random() - 0.5) * 40,
        color,
      })
    }
    setSparkles(pts)
  }

  const dropMemory = () => {
    if (!text.trim()) return
    const m = {
      id: crypto.randomUUID(),
      text: text.trim(),
      type,
      author: author.trim() || null,
      createdAt: Date.now(),
    }
    // Animate dropping star from textarea to jar
    setDroppingStar({ id: m.id, color: typeMeta(type).color })
    setText('')
    setAuthor('')

    // After the drop animation, add to jar
    setTimeout(() => {
      setMemories(prev => [...prev, m])
      setDroppingStar(null)
      // sparkle at jar top
      const rect = jarRef.current?.getBoundingClientRect()
      if (rect) emitSparkles(rect.left + rect.width / 2, rect.top + 60, typeMeta(type).color, 18)
    }, 1400)
  }

  const shakeJar = (intensity = 8) => {
    shakeRef.current = Math.min(30, (shakeRef.current || 0) + intensity)
  }

  const pickRandom = () => {
    if (memories.length === 0 || revealed) return
    const m = memories[Math.floor(Math.random() * memories.length)]
    setRevealed(m)
    // auto close after 6s
    setTimeout(() => setRevealed(null), 6500)
  }

  const onJarPointerDown = (e) => {
    dragState.current = { dragging: true, lastX: e.clientX, lastY: e.clientY }
    shakeJar(4)
  }
  const onJarPointerMove = (e) => {
    if (!dragState.current.dragging) return
    const dx = e.clientX - dragState.current.lastX
    const dy = e.clientY - dragState.current.lastY
    dragState.current.lastX = e.clientX
    dragState.current.lastY = e.clientY
    const mag = Math.min(20, Math.abs(dx) + Math.abs(dy))
    if (mag > 3) shakeJar(mag * 0.6)
  }
  const onJarPointerUp = () => {
    if (dragState.current.dragging) {
      dragState.current.dragging = false
      // if there was a big shake, pick a random star
      if ((shakeRef.current || 0) > 4) {
        setTimeout(() => pickRandom(), 900)
      }
    }
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden select-none">
      <GalaxyBackground />

      {/* Aurora layers */}
      <div className="aurora-layer fixed inset-0 z-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 30% 60%, rgba(120, 80, 200, 0.18) 0%, transparent 50%), radial-gradient(ellipse at 70% 40%, rgba(60, 140, 220, 0.14) 0%, transparent 55%)',
        }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center min-h-screen px-4 py-6 md:py-8 overflow-y-auto">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
          className="text-center mb-4"
        >
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
            <span className="inline-block bg-gradient-to-r from-purple-300 via-pink-200 to-amber-200 bg-clip-text text-transparent"
              style={{ filter: 'drop-shadow(0 0 20px rgba(200, 150, 255, 0.4))' }}>
              &#x2B50; Digital Memory Jar
            </span>
          </h1>
          <p className="text-slate-300/80 mt-2 italic text-sm md:text-base">
            &ldquo;Leave a little piece of your heart among the stars.&rdquo;
          </p>
        </motion.header>

        <div className="flex flex-col lg:flex-row items-center lg:items-start justify-center gap-8 w-full max-w-6xl">
          {/* Left: Input */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, delay: 0.3 }}
            className="w-full max-w-md order-2 lg:order-1"
          >
            <div className="rounded-2xl p-5 border border-white/10 bg-white/5 backdrop-blur-md shadow-2xl">
              <label className="text-slate-200/90 text-sm mb-2 block">Your memory</label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Write a memory..."
                rows={4}
                className="w-full rounded-xl bg-black/30 border border-white/10 focus:border-purple-400/60 focus:ring-2 focus:ring-purple-400/30 outline-none px-4 py-3 text-slate-100 placeholder:text-slate-400/60 resize-none transition"
              />

              {type === 'named' && (
                <input
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder="Signed by..."
                  className="mt-3 w-full rounded-xl bg-black/30 border border-white/10 focus:border-pink-400/60 focus:ring-2 focus:ring-pink-400/30 outline-none px-4 py-2.5 text-slate-100 placeholder:text-slate-400/60"
                />
              )}

              <div className="mt-4">
                <div className="text-slate-200/80 text-xs mb-2">Type of memory</div>
                <div className="grid grid-cols-5 gap-2">
                  {MEMORY_TYPES.map(t => {
                    const Icon = t.icon
                    const active = t.id === type
                    return (
                      <button
                        key={t.id}
                        onClick={() => setType(t.id)}
                        className={`group flex flex-col items-center justify-center rounded-xl border py-2.5 transition-all ${active ? 'border-white/30 bg-white/10 scale-[1.03]' : 'border-white/5 hover:border-white/15 bg-white/5'}`}
                        style={active ? { boxShadow: `0 0 20px ${t.glow}, inset 0 0 10px ${t.glow}` } : {}}
                        title={t.label}
                      >
                        <Icon size={16} style={{ color: t.color, filter: `drop-shadow(0 0 6px ${t.glow})` }} />
                        <span className="text-[10px] mt-1 text-slate-200/80">{t.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              <button
                onClick={dropMemory}
                disabled={!text.trim() || !!droppingStar}
                className="btn-glow mt-5 w-full rounded-xl py-3.5 font-semibold text-white bg-gradient-to-r from-purple-600 via-fuchsia-600 to-purple-600 hover:from-purple-500 hover:via-fuchsia-500 hover:to-purple-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden"
              >
                <span className="relative z-10 inline-flex items-center gap-2 justify-center">
                  <Sparkles size={18} /> Drop Into Jar
                </span>
              </button>

              <div className="mt-3 text-center text-xs text-slate-400">
                {memories.length} {memories.length === 1 ? 'memory' : 'memories'} in the jar
                {memories.length > 0 && (
                  <>
                    &nbsp;&middot;&nbsp;
                    <button onClick={pickRandom} className="underline decoration-dotted hover:text-purple-300">
                      draw one
                    </button>
                  </>
                )}
              </div>
            </div>

            <p className="text-center text-[11px] text-slate-500 mt-3">
              Tip: click or drag the jar to shake it &#x2728;
            </p>
          </motion.div>

          {/* Right: Jar */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, delay: 0.4 }}
            className="relative order-1 lg:order-2"
            style={{ width: JAR_W, height: JAR_H + 80 }}
          >
            <JarSVG
              ref={jarRef}
              positions={positions}
              memories={memories.filter(m => m.id !== revealed?.id)}
              onPointerDown={onJarPointerDown}
              onPointerMove={onJarPointerMove}
              onPointerUp={onJarPointerUp}
              onPointerLeave={onJarPointerUp}
              onClick={() => { shakeJar(6); setTimeout(pickRandom, 800) }}
            />
            <SparkleTrail points={[]} />
          </motion.div>
        </div>

        <div className="mt-6 text-center text-xs text-slate-500">
          made with &#x2728; &middot; your memories live only on this device
        </div>
      </div>

      {/* Sparkles overlay */}
      <div className="fixed inset-0 pointer-events-none z-40">
        <SparkleTrail points={sparkles} />
      </div>

      {/* Dropping star animation */}
      <AnimatePresence>
        {droppingStar && <DroppingStarAnim color={droppingStar.color} jarRef={jarRef} />}
      </AnimatePresence>

      {/* Reveal card */}
      <AnimatePresence>
        {revealed && (
          <RevealCard
            memory={revealed}
            onClose={() => setRevealed(null)}
            jarRef={jarRef}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

// ---------- Jar SVG with stars inside ----------

const JarSVG = forwardRef(function JarSVG({ positions, memories, onPointerDown, onPointerMove, onPointerUp, onPointerLeave, onClick }, ref) {
  // Center of physics area within svg
  const cx = JAR_W / 2
  const cy = 60 + INNER_H / 2 // jar body starts a bit below the top

  return (
    <div
      ref={ref}
      className="relative cursor-grab active:cursor-grabbing"
      style={{ width: JAR_W, height: JAR_H + 80, touchAction: 'none' }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerLeave}
      onClick={onClick}
    >
      {/* Table shadow */}
      <div className="absolute left-1/2 -translate-x-1/2"
        style={{
          bottom: 8, width: JAR_W * 0.9, height: 30,
          background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0) 70%)',
          filter: 'blur(6px)',
        }}
      />
      {/* Wooden table */}
      <div className="absolute left-1/2 -translate-x-1/2"
        style={{
          bottom: 20,
          width: JAR_W + 40, height: 26,
          borderRadius: 8,
          background: 'linear-gradient(to bottom, #7a4a25 0%, #6a3d1e 40%, #4d2b13 100%)',
          boxShadow: 'inset 0 2px 6px rgba(255,180,120,0.35), 0 8px 24px rgba(0,0,0,0.6)',
        }}
      >
        {/* wood grain */}
        <div style={{ position: 'absolute', inset: 0, borderRadius: 8, opacity: 0.35,
          background: 'repeating-linear-gradient(90deg, rgba(0,0,0,0.15) 0 2px, transparent 2px 22px)' }} />
      </div>

      <svg width={JAR_W} height={JAR_H + 80} className="absolute inset-0">
        <defs>
          <linearGradient id="glassBody" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="rgba(200,220,255,0.18)" />
            <stop offset="50%" stopColor="rgba(150,180,240,0.10)" />
            <stop offset="100%" stopColor="rgba(120,150,220,0.20)" />
          </linearGradient>
          <linearGradient id="glassHighlight" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(255,255,255,0.55)" />
            <stop offset="40%" stopColor="rgba(255,255,255,0.05)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </linearGradient>
          <radialGradient id="innerGlow" cx="0.5" cy="0.6" r="0.7">
            <stop offset="0%" stopColor="rgba(190,150,255,0.20)" />
            <stop offset="70%" stopColor="rgba(50,30,90,0.0)" />
          </radialGradient>
          <clipPath id="jarClip">
            {/* Match the visible jar body shape (path below) */}
            <path d={jarBodyPath()} />
          </clipPath>
        </defs>

        {/* Jar lid */}
        <g>
          <rect x={cx - 70} y={20} width={140} height={22} rx={6}
            fill="#3a2a1a" stroke="#1c130a" strokeWidth="1" />
          <rect x={cx - 70} y={22} width={140} height={6} rx={3} fill="rgba(255,220,180,0.15)" />
        </g>

        {/* Jar body outline & fill */}
        <path d={jarBodyPath()} fill="url(#glassBody)" stroke="rgba(200,220,255,0.35)" strokeWidth="1.5" />
        <path d={jarBodyPath()} fill="url(#innerGlow)" />

        {/* Inner cumulative glow from stars */}
        <g clipPath="url(#jarClip)">
          {memories.map((m) => {
            const p = positions.find(pp => pp.id === m.id)
            if (!p) return null
            const meta = typeMeta(m.type)
            return (
              <circle key={`glow-${m.id}`}
                cx={cx + p.x} cy={cy + p.y} r={26}
                fill={meta.color}
                opacity="0.18"
                style={{ filter: 'blur(8px)' }}
              />
            )
          })}
        </g>

        {/* Highlights (glass reflections) */}
        <path d={jarHighlightPath()} fill="url(#glassHighlight)" opacity="0.8" />
        <path d={jarHighlightRightPath()} fill="rgba(255,255,255,0.08)" />
      </svg>

      {/* Stars inside (HTML overlay so they can use React motion easily) */}
      <div className="absolute inset-0" style={{ overflow: 'hidden' }}>
        <div className="absolute" style={{ left: cx, top: cy }}>
          {memories.map((m) => {
            const p = positions.find(pp => pp.id === m.id)
            if (!p) return null
            const meta = typeMeta(m.type)
            return (
              <div
                key={m.id}
                className="absolute paper-star"
                style={{
                  transform: `translate(${p.x - 12}px, ${p.y - 12}px) rotate(${p.rot}deg)`,
                  color: meta.color,
                  willChange: 'transform',
                }}
              >
                <PaperStar color={meta.color} size={24} />
              </div>
            )
          })}
        </div>
      </div>

      {/* Empty state */}
      {memories.length === 0 && (
        <div className="absolute inset-x-0 flex justify-center pointer-events-none"
          style={{ top: cy - 10 }}>
          <div className="text-center px-6">
            <div className="text-slate-300/80 italic text-sm max-w-[220px] leading-relaxed"
              style={{ textShadow: '0 0 12px rgba(200,180,255,0.5)' }}>
              &ldquo;The night is waiting for its first memory.&rdquo;
            </div>
          </div>
        </div>
      )}
    </div>
  )
})

function jarBodyPath() {
  // A jar body: neck (narrow) at top, wider body, rounded bottom
  const cx = JAR_W / 2
  const topY = 42
  const shoulderTopY = 70
  const shoulderBotY = 110
  const bottomY = 460
  const neckHalf = 60
  const bodyHalf = 130
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
  `
}

function jarHighlightPath() {
  const cx = JAR_W / 2
  return `
    M ${cx - 110} 130
    C ${cx - 118} 220, ${cx - 118} 340, ${cx - 100} 420
    L ${cx - 92} 420
    C ${cx - 108} 340, ${cx - 108} 220, ${cx - 100} 138
    Z
  `
}
function jarHighlightRightPath() {
  const cx = JAR_W / 2
  return `
    M ${cx + 100} 150
    C ${cx + 112} 240, ${cx + 112} 340, ${cx + 96} 400
    L ${cx + 88} 400
    C ${cx + 104} 340, ${cx + 104} 240, ${cx + 92} 150
    Z
  `
}

// ---------- Dropping Star Animation ----------
function DroppingStarAnim({ color, jarRef }) {
  const [target, setTarget] = useState(null)

  useEffect(() => {
    if (!jarRef.current) return
    const rect = jarRef.current.getBoundingClientRect()
    setTarget({
      x: rect.left + rect.width / 2 - 12,
      y: rect.top + 80,
    })
  }, [jarRef])

  if (!target) return null

  return (
    <motion.div
      initial={{ x: window.innerWidth / 2 - 12, y: window.innerHeight - 240, scale: 0.5, opacity: 0 }}
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
        transition={{ duration: 1.4, ease: 'easeOut' }}
        className="absolute inset-0"
        style={{
          width: 32, height: 32,
          borderRadius: 999,
          background: `radial-gradient(circle, ${color} 0%, transparent 60%)`,
          filter: 'blur(6px)',
        }}
      />
    </motion.div>
  )
}

// ---------- Reveal Card ----------
function RevealCard({ memory, onClose, jarRef }) {
  const meta = typeMeta(memory.type)
  const [phase, setPhase] = useState('floating') // floating -> unfolding -> shown -> folding

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('unfolding'), 700)
    const t2 = setTimeout(() => setPhase('shown'), 1500)
    const t3 = setTimeout(() => setPhase('folding'), 5400)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [])

  const rect = jarRef.current?.getBoundingClientRect()
  const originX = rect ? rect.left + rect.width / 2 : window.innerWidth / 2
  const originY = rect ? rect.top + rect.height / 2 : window.innerHeight / 2

  return (
    <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center">
      {/* Backdrop dim */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 0.5 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px] pointer-events-auto"
        onClick={onClose}
      />

      {/* Floating star / card */}
      <motion.div
        initial={{ x: originX - window.innerWidth / 2, y: originY - window.innerHeight / 2, scale: 0.7, opacity: 0 }}
        animate={
          phase === 'floating'
            ? { x: 0, y: -20, scale: 1, opacity: 1 }
            : phase === 'folding'
              ? { x: originX - window.innerWidth / 2, y: originY - window.innerHeight / 2, scale: 0.6, opacity: 0, rotate: 360 }
              : { x: 0, y: 0, scale: 1, opacity: 1 }
        }
        transition={{ duration: phase === 'folding' ? 1.2 : 1, ease: [0.4, 0, 0.2, 1] }}
        className="relative z-10 pointer-events-auto"
      >
        {(phase === 'floating') && (
          <motion.div
            animate={{ rotate: 720 }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
          >
            <PaperStar color={meta.color} size={80} />
          </motion.div>
        )}
        {phase === 'unfolding' && (
          <motion.div
            initial={{ scale: 0.5, rotateY: 0 }}
            animate={{ scale: 1.05, rotateY: 360 }}
            transition={{ duration: 0.8, ease: 'easeInOut' }}
            style={{ transformStyle: 'preserve-3d' }}
          >
            <PaperStar color={meta.color} size={60} />
          </motion.div>
        )}
        {phase === 'shown' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="relative rounded-3xl px-8 py-7 max-w-md min-w-[300px] border border-white/20 bg-gradient-to-b from-white/15 to-white/5 backdrop-blur-xl shadow-2xl"
            style={{
              boxShadow: `0 0 40px ${meta.color}66, 0 0 80px ${meta.color}44, inset 0 0 24px rgba(255,255,255,0.08)`,
            }}
          >
            <div className="flex items-center gap-2 text-xs uppercase tracking-widest mb-3"
              style={{ color: meta.color }}>
              <StarIcon size={12} /> {meta.label} memory
            </div>
            <p className="text-slate-50 text-lg leading-relaxed whitespace-pre-wrap">
              &ldquo;{memory.text}&rdquo;
            </p>
            {memory.author && (
              <div className="mt-4 text-right text-sm text-slate-300/80 italic">
                &mdash; {memory.author}
              </div>
            )}
            <div className="mt-3 text-[10px] text-slate-400">
              {new Date(memory.createdAt).toLocaleString()}
            </div>
            {/* corner sparkles */}
            <div className="absolute -top-2 -right-2">
              <PaperStar color={meta.color} size={20} />
            </div>
          </motion.div>
        )}
        {phase === 'folding' && (
          <PaperStar color={meta.color} size={40} />
        )}
      </motion.div>
    </div>
  )
}

export default App
