import React from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ScanFace, Camera, Sparkles, FlaskConical, ShoppingBag,
  BadgeCheck, TrendingUp, LayoutDashboard, ArrowRight, ShieldCheck,
} from 'lucide-react'
import Reticle from '../components/Reticle'

const FEATURES = [
  { icon: ScanFace, title: 'AI Skin Assessment', desc: 'Concern-by-concern severity scoring from your profile, refined with a trained model as you use the platform.' },
  { icon: Camera, title: 'Photo-Based Analysis', desc: 'Upload a photo for computer-vision redness, texture, tone-evenness, and shine readings, blended into your assessment.' },
  { icon: Sparkles, title: 'Personalized Routines', desc: 'Morning, evening, weekly, and seasonal routines generated from your concerns and skin type.' },
  { icon: FlaskConical, title: 'Ingredient Intelligence', desc: 'Suitability checks and interaction warnings before you combine actives like retinol and vitamin C.' },
  { icon: ShoppingBag, title: 'Product Matching', desc: 'Suitability-scored recommendations from a trained ranking model, weighed against your budget and allergies.' },
  { icon: BadgeCheck, title: 'Dermatologist Verified', desc: 'Every dermatologist and consultant is credential-checked by an admin before their review carries a verified badge.' },
  { icon: TrendingUp, title: 'Progress Tracking', desc: 'A transparent, weighted skin health score, trended over time as you log routine adherence.' },
  { icon: LayoutDashboard, title: 'Role Dashboards', desc: 'Purpose-built views for skincare users, consultants, dermatologists, and platform admins.' },
]

const STEPS = [
  { n: '01', title: 'Build your profile', desc: 'Skin type, concerns, allergies, lifestyle, sleep, and environment.' },
  { n: '02', title: 'Run your assessment', desc: 'Rule-based and ML scoring identify and prioritize your concerns.' },
  { n: '03', title: 'Get your plan', desc: 'A routine, ingredient guidance, and product matches are generated.' },
  { n: '04', title: 'Track and adjust', desc: 'Log adherence, watch your score trend, refine as your skin changes.' },
]

const STATS = [
  ['12', 'platform modules'],
  ['5', 'role-based dashboards'],
  ['2', 'trained ML models'],
  ['100%', 'dermatologist-verified reviews'],
]

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
}

export default function Landing() {
  return (
    <div className="bg-porcelain text-ink overflow-x-hidden">
      {/* ---------- Nav ---------- */}
      <header className="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
        <span className="font-display text-xl font-semibold tracking-tight">Skinsight</span>
        <div className="flex items-center gap-3">
          <Link to="/login" className="text-sm font-medium text-ink-soft hover:text-ink px-3 py-2">Log in</Link>
          <Link to="/register" className="btn-primary text-sm py-2">Get started</Link>
        </div>
      </header>

      {/* ---------- Hero ---------- */}
      <section className="max-w-6xl mx-auto px-6 pt-10 md:pt-16 pb-20 grid md:grid-cols-2 gap-12 items-center">
        <motion.div initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.12 } } }}>
          <motion.span variants={fadeUp} className="eyebrow">AI-assisted skin intelligence</motion.span>
          <motion.h1 variants={fadeUp} className="font-display text-5xl md:text-6xl leading-[1.05] font-semibold mt-4 mb-6">
            Skin advice,<br />
            <span className="italic text-teal-600">measured</span> — not guessed.
          </motion.h1>
          <motion.p variants={fadeUp} className="text-ink-soft text-lg leading-relaxed mb-8 max-w-md">
            Skinsight blends your lifestyle profile, photo-based visual analysis, and
            dermatologist-verified review into one continuously updated skin health
            score — then builds the routine, ingredients, and products to match.
          </motion.p>
          <motion.div variants={fadeUp} className="flex flex-wrap items-center gap-4 mb-12">
            <Link to="/register" className="btn-primary inline-flex items-center gap-2">
              Start your skin profile <ArrowRight size={16} />
            </Link>
            <Link to="/login" className="btn-outline">I already have an account</Link>
          </motion.div>
          <motion.div variants={fadeUp} className="grid grid-cols-4 gap-6 max-w-lg border-t border-stone-200 pt-6">
            {STATS.map(([n, label]) => (
              <div key={label}>
                <div className="data-figure text-2xl font-semibold text-teal-700">{n}</div>
                <div className="text-xs text-ink-faint leading-snug mt-1">{label}</div>
              </div>
            ))}
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
          className="flex justify-center"
        >
          <Reticle
            size={420}
            readouts={[
              { label: 'CONDITION', value: '82', top: '6%', left: '-4%' },
              { label: 'HYDRATION', value: '74', top: '18%', right: '-8%' },
              { label: 'ROUTINE', value: '91', bottom: '14%', left: '-8%' },
              { label: 'SLEEP', value: '68', bottom: '2%', right: '-2%' },
            ]}
          />
        </motion.div>
      </section>

      {/* ---------- Feature grid ---------- */}
      <section className="bg-white border-y border-stone-200/70">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <motion.div
            initial="hidden" whileInView="show" viewport={{ once: true, margin: '-80px' }} variants={fadeUp}
            className="mb-12 max-w-xl"
          >
            <span className="eyebrow">What's inside</span>
            <h2 className="font-display text-3xl md:text-4xl font-semibold mt-3">
              Every module a skincare platform needs, working together.
            </h2>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                initial="hidden" whileInView="show" viewport={{ once: true, margin: '-60px' }}
                variants={fadeUp} transition={{ delay: (i % 4) * 0.06 }}
                className="card hover:shadow-lifted hover:-translate-y-1 transition-all duration-300"
              >
                <div className="w-10 h-10 rounded-lg bg-teal-50 flex items-center justify-center mb-4">
                  <f.icon size={20} className="text-teal-600" strokeWidth={1.75} />
                </div>
                <h3 className="font-medium text-ink mb-1.5">{f.title}</h3>
                <p className="text-sm text-ink-soft leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- How it works ---------- */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <motion.div initial="hidden" whileInView="show" viewport={{ once: true, margin: '-80px' }} variants={fadeUp} className="mb-12 max-w-xl">
          <span className="eyebrow">The flow</span>
          <h2 className="font-display text-3xl md:text-4xl font-semibold mt-3">Four steps, start to routine.</h2>
        </motion.div>

        <div className="grid md:grid-cols-4 gap-6">
          {STEPS.map((s, i) => (
            <motion.div
              key={s.n}
              initial="hidden" whileInView="show" viewport={{ once: true, margin: '-60px' }}
              variants={fadeUp} transition={{ delay: i * 0.1 }}
              className="relative"
            >
              <div className="data-figure text-4xl text-stone-300 font-semibold mb-3">{s.n}</div>
              <h3 className="font-display text-xl font-medium mb-2">{s.title}</h3>
              <p className="text-sm text-ink-soft leading-relaxed">{s.desc}</p>
              {i < STEPS.length - 1 && (
                <div className="hidden md:block absolute top-3 -right-3 w-6 h-px bg-stone-300" />
              )}
            </motion.div>
          ))}
        </div>
      </section>

      {/* ---------- Trust / verification ---------- */}
      <section className="bg-teal-800 text-porcelain">
        <div className="max-w-6xl mx-auto px-6 py-20 grid md:grid-cols-2 gap-12 items-center">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true, margin: '-80px' }} variants={fadeUp}>
            <span className="eyebrow text-teal-300">Human-verified, not just automated</span>
            <h2 className="font-display text-3xl md:text-4xl font-semibold mt-3 mb-5">
              AI reads the signal. A verified dermatologist reads the picture.
            </h2>
            <p className="text-teal-100 leading-relaxed mb-6">
              Photo analysis and ML scoring are visual estimates, not a diagnosis. Every
              dermatologist and consultant account goes through an admin credential
              review — license number and qualifications checked — before they can
              appear as verified on the platform.
            </p>
            <ul className="space-y-3 text-sm text-teal-100">
              {['Credential submitted by the professional', 'Reviewed and approved by an admin', 'Verified badge shown on their dashboard'].map((t) => (
                <li key={t} className="flex items-center gap-2.5">
                  <ShieldCheck size={16} className="text-teal-300 shrink-0" /> {t}
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="bg-teal-900/60 border border-teal-700 rounded-2xl p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-11 h-11 rounded-full bg-teal-600 flex items-center justify-center text-white font-display font-medium">DP</div>
              <div>
                <div className="font-medium">Dr. Priya Shah</div>
                <div className="text-xs text-teal-300">Dermatologist</div>
              </div>
              <span className="ml-auto badge bg-teal-600 text-white flex items-center gap-1">
                <BadgeCheck size={13} /> Verified
              </span>
            </div>
            <div className="data-figure text-xs text-teal-300 mb-1">LICENSE</div>
            <div className="text-sm text-teal-100 mb-4">MCI-12345-DERM</div>
            <div className="data-figure text-xs text-teal-300 mb-1">STATUS</div>
            <div className="text-sm text-teal-100">Reviewed and approved by platform admin</div>
          </motion.div>
        </div>
      </section>

      {/* ---------- Final CTA ---------- */}
      <section className="max-w-6xl mx-auto px-6 py-24 text-center">
        <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp}>
          <h2 className="font-display text-4xl md:text-5xl font-semibold mb-6 max-w-2xl mx-auto">
            Build your skin profile in under five minutes.
          </h2>
          <Link to="/register" className="btn-primary inline-flex items-center gap-2 text-base px-7 py-3">
            Get started free <ArrowRight size={18} />
          </Link>
        </motion.div>
      </section>

      <footer className="border-t border-stone-200 py-10">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-ink-faint">
          <span className="font-display text-ink">Skinsight</span>
          <span>AI Skin Intelligence & Personalized Skincare Planner</span>
        </div>
      </footer>
    </div>
  )
}
