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

// ---------- Van Gogh Starry Night Background (Canvas) ----------
// A living painting: swirling vortices push brushstroke particles along a
// flow field, leaving painterly trails. Golden stars, a luminous moon,
// and shooting stars complete the "Starry Night"-inspired scene.
function GalaxyBackground() {
  const canvasRef = useRef(null)
  const mouseRef = useRef({ x: 0, y: 0 })

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const DPR = Math.min(window.devicePixelRatio || 1, 2)
    let w = window.innerWidth
    let h = window.innerHeight

    const setup = () => {
      w = window.innerWidth
      h = window.innerHeight
      canvas.width = w * DPR
      canvas.height = h * DPR
      canvas.style.width = w + 'px'
      canvas.style.height = h + 'px'
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0)
      // paint an initial deep-sky base so the first frames don't look black
      const g = ctx.createLinearGradient(0, 0, 0, h)
      g.addColorStop(0, '#0a1740')
      g.addColorStop(0.5, '#132a63')
      g.addColorStop(1, '#0a1a4a')
      ctx.fillStyle = g
      ctx.fillRect(0, 0, w, h)
    }
    setup()

    // Van Gogh palette (rich blues, deep purples, golden yellows, cream)
    const PALETTE = [
      '#0d1f52', '#183a86', '#2657b8', '#3b74d6', // blues
      '#2a1b5c', '#3d2a7a', '#5a3e9c',            // purples
      '#e8b923', '#f4c542', '#ffd76a', '#ffe9a3', // golds
      '#f5efd6',                                   // cream
    ]

    // Swirl vortex centers (like the iconic swirls of Starry Night)
    const vortices = [
      { x: w * 0.32, y: h * 0.38, r: Math.max(w, h) * 0.32, s:  1.0, rot: 0 },
      { x: w * 0.72, y: h * 0.28, r: Math.max(w, h) * 0.22, s: -0.9, rot: 0 },
      { x: w * 0.55, y: h * 0.72, r: Math.max(w, h) * 0.36, s:  0.8, rot: 0 },
      { x: w * 0.08, y: h * 0.78, r: Math.max(w, h) * 0.20, s: -0.7, rot: 0 },
      { x: w * 0.92, y: h * 0.62, r: Math.max(w, h) * 0.22, s:  0.9, rot: 0 },
    ]

    // Bright golden stars (fixed positions with halos)
    const goldStars = Array.from({ length: 11 }, () => ({
      x: Math.random() * w,
      y: Math.random() * h * 0.6,
      r: 4 + Math.random() * 4,
      tw: Math.random() * Math.PI * 2,
      twSpeed: 0.012 + Math.random() * 0.02,
    }))
    // ensure a couple near the top for the "big" starry-night stars
    goldStars[0] = { x: w * 0.18, y: h * 0.22, r: 7, tw: 0, twSpeed: 0.015 }
    goldStars[1] = { x: w * 0.42, y: h * 0.14, r: 6, tw: 1, twSpeed: 0.018 }
    goldStars[2] = { x: w * 0.62, y: h * 0.20, r: 5.5, tw: 2, twSpeed: 0.02 }

    // moon position (top-right)
    const moon = { x: w * 0.85, y: h * 0.17, r: 46 }

    // Brushstroke particles that ride the flow field
    const PARTICLE_COUNT = Math.floor(Math.min(1800, (w * h) / 900))
    const particles = Array.from({ length: PARTICLE_COUNT }, () => spawnParticle())

    function spawnParticle() {
      return {
        x: Math.random() * w,
        y: Math.random() * h,
        life: 30 + Math.random() * 120,
        maxLife: 30 + Math.random() * 120,
        color: PALETTE[Math.floor(Math.random() * PALETTE.length)],
        size: 0.8 + Math.random() * 2.4,
      }
    }

    // Flow field: sum contributions from vortices + a slow drift.
    // Returns [vx, vy] in pixels per frame.
    function flowAt(x, y, time) {
      let vx = Math.cos(time * 0.00015 + y * 0.002) * 0.15 // slow ambient
      let vy = Math.sin(time * 0.00012 + x * 0.002) * 0.12
      for (const vo of vortices) {
        const dx = x - vo.x
        const dy = y - vo.y
        const d2 = dx * dx + dy * dy
        const d = Math.sqrt(d2) + 1
        const falloff = Math.exp(-d / vo.r)
        // tangential (perpendicular) rotation
        const tx = -dy / d
        const ty =  dx / d
        // inward pull to keep particles curling
        const ix = -dx / d
        const iy = -dy / d
        const rot = vo.s * (0.9 + Math.sin(vo.rot) * 0.15)
        vx += (tx * 1.6 + ix * 0.35) * rot * falloff
        vy += (ty * 1.6 + iy * 0.35) * rot * falloff
      }
      return [vx, vy]
    }

    let shooting = []
    let nextShoot = performance.now() + 3000
    let raf
    let frame = 0

    const onResize = () => {
      setup()
      moon.x = w * 0.85
      moon.y = h * 0.17
      vortices[0].x = w * 0.32; vortices[0].y = h * 0.38
      vortices[1].x = w * 0.72; vortices[1].y = h * 0.28
      vortices[2].x = w * 0.55; vortices[2].y = h * 0.72
      vortices[3].x = w * 0.08; vortices[3].y = h * 0.78
      vortices[4].x = w * 0.92; vortices[4].y = h * 0.62
    }
    const onMove = (e) => {
      mouseRef.current.x = (e.clientX / w - 0.5)
      mouseRef.current.y = (e.clientY / h - 0.5)
    }
    window.addEventListener('resize', onResize)
    window.addEventListener('mousemove', onMove)

    // painterly base is redrawn every frame with a soft veil so old strokes
    // fade gradually -> creates the living "hand-painted" impression
    const drawFadeBase = () => {
      // subtle vertical gradient veil
      const g = ctx.createLinearGradient(0, 0, 0, h)
      g.addColorStop(0, 'rgba(8, 20, 60, 0.10)')
      g.addColorStop(0.5, 'rgba(20, 40, 100, 0.09)')
      g.addColorStop(1, 'rgba(10, 20, 60, 0.11)')
      ctx.fillStyle = g
      ctx.fillRect(0, 0, w, h)

      // gentle purple wash bottom-left, gold wash mid
      const g2 = ctx.createRadialGradient(w * 0.2, h * 0.85, 0, w * 0.2, h * 0.85, Math.max(w, h) * 0.6)
      g2.addColorStop(0, 'rgba(70, 40, 130, 0.05)')
      g2.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.fillStyle = g2
      ctx.fillRect(0, 0, w, h)
    }

    const drawMoon = (t) => {
      const mx = moon.x, my = moon.y, mr = moon.r
      // outer halo brushstrokes (radiating short strokes)
      ctx.save()
      ctx.globalCompositeOperation = 'lighter'
      const rings = 5
      for (let r = 0; r < rings; r++) {
        const radius = mr + 14 + r * 12
        const strokes = 40 + r * 8
        for (let i = 0; i < strokes; i++) {
          const a = (i / strokes) * Math.PI * 2 + t * 0.00005 * (r % 2 === 0 ? 1 : -1)
          const sx = mx + Math.cos(a) * radius
          const sy = my + Math.sin(a) * radius
          const len = 8 + Math.random() * 6
          const ex = sx + Math.cos(a) * len
          const ey = sy + Math.sin(a) * len
          ctx.strokeStyle = `rgba(255, 220, 130, ${0.10 - r * 0.015})`
          ctx.lineWidth = 2.5 - r * 0.3
          ctx.lineCap = 'round'
          ctx.beginPath()
          ctx.moveTo(sx, sy)
          ctx.lineTo(ex, ey)
          ctx.stroke()
        }
      }
      // moon disc with warm gradient
      const mg = ctx.createRadialGradient(mx - 8, my - 8, 2, mx, my, mr)
      mg.addColorStop(0, '#fff6d0')
      mg.addColorStop(0.6, '#ffd76a')
      mg.addColorStop(1, '#e8a523')
      ctx.fillStyle = mg
      ctx.beginPath()
      ctx.arc(mx, my, mr, 0, Math.PI * 2)
      ctx.fill()
      // inner painterly highlights
      ctx.strokeStyle = 'rgba(255, 250, 210, 0.5)'
      ctx.lineWidth = 1.4
      for (let i = 0; i < 14; i++) {
        const a = i * 0.5 + t * 0.0002
        const rr = mr * 0.35 + (i % 3) * 4
        ctx.beginPath()
        ctx.arc(mx - 6, my - 6, rr, a, a + 0.9)
        ctx.stroke()
      }
      ctx.restore()
    }

    const drawGoldStars = (t) => {
      ctx.save()
      ctx.globalCompositeOperation = 'lighter'
      for (const s of goldStars) {
        s.tw += s.twSpeed
        const pulse = 0.75 + Math.sin(s.tw) * 0.25
        // halo brushstrokes
        for (let r = 0; r < 3; r++) {
          const radius = s.r + 6 + r * 8
          const strokes = 18 + r * 4
          for (let i = 0; i < strokes; i++) {
            const a = (i / strokes) * Math.PI * 2 + t * 0.0002 * (r % 2 ? 1 : -1)
            const sx = s.x + Math.cos(a) * radius
            const sy = s.y + Math.sin(a) * radius
            const len = 4 + Math.random() * 4
            ctx.strokeStyle = `rgba(255, 220, 130, ${(0.14 - r * 0.03) * pulse})`
            ctx.lineWidth = 1.6 - r * 0.3
            ctx.lineCap = 'round'
            ctx.beginPath()
            ctx.moveTo(sx, sy)
            ctx.lineTo(sx + Math.cos(a) * len, sy + Math.sin(a) * len)
            ctx.stroke()
          }
        }
        // star core
        const gs = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r * 2.2)
        gs.addColorStop(0, `rgba(255, 250, 220, ${pulse})`)
        gs.addColorStop(0.4, `rgba(255, 210, 100, ${0.7 * pulse})`)
        gs.addColorStop(1, 'rgba(230, 160, 40, 0)')
        ctx.fillStyle = gs
        ctx.beginPath()
        ctx.arc(s.x, s.y, s.r * 2.2, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.restore()
    }

    const draw = (t) => {
      frame++
      // rotate vortex phases (for subtle "breathing")
      for (const v of vortices) v.rot += 0.003

      drawFadeBase()

      // Brushstroke particles
      const mouseInfluenceX = mouseRef.current.x * 12
      const mouseInfluenceY = mouseRef.current.y * 12
      ctx.lineCap = 'round'
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i]
        const [vx, vy] = flowAt(p.x, p.y, t)
        const nx = p.x + vx + mouseInfluenceX * 0.02
        const ny = p.y + vy + mouseInfluenceY * 0.02
        const speed = Math.hypot(vx, vy)
        const alpha = Math.min(0.9, 0.15 + speed * 0.22) * (p.life / p.maxLife)
        // short brushstroke = line from (p.x,p.y) to (nx,ny)
        ctx.strokeStyle = hexA(p.color, alpha)
        ctx.lineWidth = p.size
        ctx.beginPath()
        ctx.moveTo(p.x, p.y)
        ctx.lineTo(nx, ny)
        ctx.stroke()
        p.x = nx
        p.y = ny
        p.life -= 1
        if (p.life <= 0 || p.x < -20 || p.x > w + 20 || p.y < -20 || p.y > h + 20) {
          Object.assign(p, spawnParticle())
        }
      }

      drawGoldStars(t)
      drawMoon(t)

      // Shooting stars (occasional golden streaks)
      if (t > nextShoot) {
        shooting.push({
          x: Math.random() * w * 0.7,
          y: Math.random() * h * 0.35,
          vx: 9 + Math.random() * 5,
          vy: 3 + Math.random() * 3,
          life: 70,
        })
        nextShoot = t + 8000 + Math.random() * 7000
      }
      shooting = shooting.filter(sh => sh.life > 0)
      ctx.save()
      ctx.globalCompositeOperation = 'lighter'
      for (const sh of shooting) {
        const tailX = sh.x - sh.vx * 9
        const tailY = sh.y - sh.vy * 9
        const grad = ctx.createLinearGradient(tailX, tailY, sh.x, sh.y)
        grad.addColorStop(0, 'rgba(255, 220, 130, 0)')
        grad.addColorStop(0.6, `rgba(255, 230, 160, ${sh.life / 90})`)
        grad.addColorStop(1, `rgba(255, 250, 210, ${sh.life / 70})`)
        ctx.strokeStyle = grad
        ctx.lineWidth = 2.6
        ctx.lineCap = 'round'
        ctx.beginPath()
        ctx.moveTo(tailX, tailY)
        ctx.lineTo(sh.x, sh.y)
        ctx.stroke()
        sh.x += sh.vx
        sh.y += sh.vy
        sh.life -= 1
      }
      ctx.restore()

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

// hex color + alpha helper
function hexA(hex, a) {
  const h = hex.replace('#', '')
  const r = parseInt(h.substring(0, 2), 16)
  const g = parseInt(h.substring(2, 4), 16)
  const b = parseInt(h.substring(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${a})`
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

      {/* Subtle warm gold vignette to enhance painterly feel */}
      <div className="fixed inset-0 z-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 85% 17%, rgba(255, 210, 120, 0.10) 0%, transparent 40%), radial-gradient(ellipse at 20% 80%, rgba(70, 40, 130, 0.10) 0%, transparent 55%)',
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
