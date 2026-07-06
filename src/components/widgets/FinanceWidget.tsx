'use client'

import { useState, useRef } from 'react'
import { useFinance } from '@/hooks/useData'
import { Wallet, Plus, X, Camera } from 'lucide-react'

const DEFAULT_CATS = ['Food', 'Transport', 'Shopping', 'Health', 'Bills', 'Entertainment']
const CAT_COLORS: Record<string, string> = {
  Food: 'var(--red)', Transport: 'var(--amb)', Shopping: 'var(--grn)',
  Health: 'var(--acc)', Bills: 'var(--pur)', Entertainment: 'var(--pur)',
}

function fmtRp(n: number) {
  if (n >= 1_000_000) return `Rp ${(n / 1_000_000).toFixed(1).replace('.0', '')}jt`
  if (n >= 1_000) return `Rp ${(n / 1_000).toFixed(0)}k`
  return `Rp ${n.toLocaleString('id-ID')}`
}

export function FinanceWidget() {
  const { finance, loading, refresh } = useFinance()
  const [modal, setModal] = useState(false)
  const [tab, setTab] = useState<'manual' | 'scan'>('manual')
  const [amount, setAmount] = useState('')
  const [desc, setDesc] = useState('')
  const [cat, setCat] = useState('Food')
  const [cats, setCats] = useState(DEFAULT_CATS)
  const [saving, setSaving] = useState(false)
  const [scanning, setScanning] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  async function saveExpense() {
    if (!amount) return
    setSaving(true)
    await fetch('/api/finance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: parseFloat(amount), description: desc || cat, category: cat }),
    })
    setSaving(false)
    setAmount(''); setDesc(''); setModal(false)
    refresh()
  }

  async function handleScan(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setScanning(true)
    const fd = new FormData()
    fd.append('receipt', file)
    try {
      const res = await fetch('/api/finance/ocr', { method: 'POST', body: fd })
      const data = await res.json()
      if (data.amount) setAmount(String(data.amount))
      if (data.merchant) setDesc(data.merchant)
      setTab('manual')
    } catch {}
    setScanning(false)
  }

  function addCategory() {
    const name = prompt('New category name:')
    if (!name || cats.includes(name)) return
    setCats(c => [...c, name])
    setCat(name)
  }

  const goals = finance?.savingsGoals || [
    { id: '1', name: 'Emergency fund', current: 8200000, target: null, color: 'var(--grn)' },
    { id: '2', name: 'Laptop upgrade', current: 3500000, target: null, color: 'var(--acc)' },
    { id: '3', name: 'Vacation fund',  current: 1800000, target: null, color: 'var(--pur)' },
  ]

  return (
    <div className="card" style={{ position: 'relative' }}>
      <div style={{ padding: 14 }}>
        <div className="sec-label">
          <Wallet size={13} />
          Finance
          <a href="#" style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--acc)', opacity: 0.7 }}>
            Google Sheet
          </a>
        </div>

        {/* Hero */}
        <div style={{ background: 'var(--s2)', borderRadius: 'var(--rs)', padding: '14px 16px', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 11, color: 'var(--t2)', marginBottom: 4 }}>Net balance · May 2025</div>
              <div style={{ fontSize: 32, fontWeight: 700, letterSpacing: '-.03em', lineHeight: 1 }}>
                {loading ? '—' : fmtRp(finance?.netBalance || 84200000)}
              </div>
              <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' as const }}>
                <span className="pill pill-green">↑ {fmtRp(finance?.income || 24500000)}</span>
                <span className="pill pill-red">↓ {fmtRp(finance?.expenses || 11300000)}</span>
                <span className="pill pill-amber">{finance?.savingsRate || 54}% saved</span>
              </div>
            </div>
            <MiniChart />
          </div>

          {/* Savings Goals */}
          <div style={{ borderTop: '0.5px solid rgba(255,255,255,.06)', paddingTop: 12 }}>
            <div style={{ fontSize: 10, color: 'var(--t2)', marginBottom: 8, fontWeight: 500 }}>Savings goals</div>
            {goals.map(g => (
              <div key={g.id} style={{ marginBottom: 9 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
                  <span style={{ color: 'var(--t2)' }}>{g.name}</span>
                  <span style={{ color: 'var(--t)', fontWeight: 500 }}>
                    {fmtRp(g.current)} <span style={{ color: 'var(--t2)', fontWeight: 400 }}>/ {g.target ? fmtRp(g.target) : '—'}</span>
                  </span>
                </div>
                <div style={{ background: 'rgba(255,255,255,.05)', borderRadius: 3, height: 5, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', borderRadius: 3, background: g.color,
                    width: g.target ? `${Math.min((g.current / g.target) * 100, 100)}%` : '40%',
                    transition: 'width .7s cubic-bezier(.4,0,.2,1)',
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Category stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 12 }}>
          {[
            { l: 'Food & dining', v: 2400000, c: 'var(--red)' },
            { l: 'Transport',     v: 900000,  c: 'var(--amb)' },
            { l: 'Shopping',      v: 600000,  c: 'var(--grn)' },
          ].map(s => (
            <div key={s.l} style={{ background: 'var(--s2)', borderRadius: 'var(--rs)', padding: '9px 11px' }}>
              <div style={{ fontSize: 10, color: 'var(--t2)', marginBottom: 3 }}>{s.l}</div>
              <div style={{ fontSize: 15, fontWeight: 600, letterSpacing: '-.02em', color: s.c }}>
                {fmtRp(s.v)}
              </div>
            </div>
          ))}
        </div>

        {/* Budget bars */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px 20px' }}>
          {[
            { l: 'Food', pct: 72, c: 'var(--red)' },
            { l: 'Transport', pct: 45, c: 'var(--amb)' },
            { l: 'Shopping', pct: 30, c: 'var(--grn)' },
          ].map(b => (
            <div key={b.l} style={{ marginBottom: 7 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--t2)', marginBottom: 3 }}>
                <span>{b.l}</span><span style={{ color: 'var(--t)', fontWeight: 500 }}>{b.pct}%</span>
              </div>
              <div style={{ background: 'rgba(255,255,255,.05)', borderRadius: 3, height: 5, overflow: 'hidden' }}>
                <div style={{ height: '100%', borderRadius: 3, background: b.c, width: `${b.pct}%` }} />
              </div>
            </div>
          ))}
        </div>

        <hr className="div-line" />

        {/* Recent expenses */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--t3)', letterSpacing: '.07em', textTransform: 'uppercase' as const }}>Recent</span>
          <span style={{ fontSize: 10, color: 'var(--t3)' }}>May 2025</span>
        </div>
        {(finance?.recentExpenses || MOCK_EXPENSES).slice(0, 4).map((e, i) => (
          <div key={e.id || i} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '5px 0', borderBottom: '0.5px solid var(--b)', fontSize: 12,
          }}>
            <span style={{ color: 'var(--t2)', display: 'flex', alignItems: 'center', gap: 5 }}>
              {e.category} · {e.description}
            </span>
            <span style={{ fontWeight: 500, color: 'var(--red)' }}>-{fmtRp(e.amount)}</span>
          </div>
        ))}

        <button onClick={() => setModal(true)} style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
          width: '100%', marginTop: 10, padding: '6px',
          fontSize: 11, color: 'var(--t2)',
          background: 'transparent', border: '0.5px solid var(--b)',
          borderRadius: 'var(--rs)', cursor: 'pointer', transition: 'all .18s',
        }}
          onMouseEnter={e => { (e.target as HTMLElement).style.color = 'var(--acc)'; (e.target as HTMLElement).style.borderColor = 'rgba(123,158,248,.3)' }}
          onMouseLeave={e => { (e.target as HTMLElement).style.color = 'var(--t2)'; (e.target as HTMLElement).style.borderColor = 'var(--b)' }}
        >
          <Plus size={12} />
          Add expense
        </button>
      </div>

      {/* Modal */}
      {modal && (
        <div style={{
          position: 'absolute', inset: 0, background: 'rgba(0,0,0,.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 50, borderRadius: 'var(--r)',
          opacity: 1, transition: 'opacity .2s',
        }} onClick={e => { if (e.target === e.currentTarget) setModal(false) }}>
          <div style={{
            background: '#181b26', border: '0.5px solid rgba(255,255,255,.12)',
            borderRadius: 'var(--r)', padding: 18, width: 268,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontSize: 13, fontWeight: 600 }}>Add expense</span>
              <button onClick={() => setModal(false)} style={{ background: 'none', border: 'none', color: 'var(--t2)', cursor: 'pointer' }}>
                <X size={17} />
              </button>
            </div>

            <div style={{ display: 'flex', gap: 5, marginBottom: 11 }}>
              {(['manual', 'scan'] as const).map(t => (
                <button key={t} onClick={() => setTab(t)} style={{
                  flex: 1, padding: 6, borderRadius: 'var(--rs)', fontSize: 11,
                  cursor: 'pointer', border: '0.5px solid',
                  borderColor: tab === t ? 'rgba(123,158,248,.3)' : 'var(--b)',
                  background: tab === t ? 'rgba(123,158,248,.1)' : 'none',
                  color: tab === t ? 'var(--acc)' : 'var(--t2)',
                  transition: 'all .15s',
                }}>
                  {t === 'manual' ? 'Manual' : 'Scan receipt'}
                </button>
              ))}
            </div>

            {tab === 'manual' ? (
              <>
                <label style={{ fontSize: 10, color: 'var(--t2)', marginBottom: 3, display: 'block' }}>Amount (Rp)</label>
                <input value={amount} onChange={e => setAmount(e.target.value)} type="number" placeholder="50000"
                  style={inputStyle} />
                <label style={{ fontSize: 10, color: 'var(--t2)', marginBottom: 3, display: 'block' }}>Description</label>
                <input value={desc} onChange={e => setDesc(e.target.value)} type="text" placeholder="e.g. Lunch at warteg"
                  style={inputStyle} />
                <label style={{ fontSize: 10, color: 'var(--t2)', marginBottom: 3, display: 'block' }}>Category</label>
                <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 4, marginBottom: 10 }}>
                  {cats.map(c => (
                    <button key={c} onClick={() => setCat(c)} style={{
                      fontSize: 10, padding: '3px 8px', borderRadius: 20,
                      border: '0.5px solid',
                      borderColor: cat === c ? 'rgba(123,158,248,.35)' : 'var(--b)',
                      background: cat === c ? 'rgba(123,158,248,.12)' : 'none',
                      color: cat === c ? 'var(--acc)' : 'var(--t2)',
                      cursor: 'pointer', transition: 'all .13s',
                    }}>{c}</button>
                  ))}
                  <button onClick={addCategory} style={{
                    fontSize: 10, padding: '3px 8px', borderRadius: 20,
                    border: '0.5px dashed var(--b)', background: 'none',
                    color: 'var(--t2)', cursor: 'pointer',
                  }}>+ New</button>
                </div>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '14px 0' }}>
                <Camera size={34} color="var(--t2)" />
                <p style={{ fontSize: 11, color: 'var(--t2)', marginTop: 6, lineHeight: 1.5 }}>
                  {scanning ? 'Analyzing receipt...' : 'Photo your receipt — AI extracts the amount.'}
                </p>
                <input ref={fileRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={handleScan} />
                <button onClick={() => fileRef.current?.click()} disabled={scanning} style={{
                  marginTop: 10, padding: '7px 20px', background: 'var(--acc)',
                  border: 'none', borderRadius: 'var(--rs)', fontSize: 12,
                  color: '#0d0e12', fontWeight: 600, cursor: 'pointer',
                }}>Open camera</button>
              </div>
            )}

            <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
              <button onClick={() => setModal(false)} style={{ flex: 1, padding: 8, borderRadius: 'var(--rs)', fontSize: 12, cursor: 'pointer', background: 'none', border: '0.5px solid var(--b)', color: 'var(--t2)' }}>
                Cancel
              </button>
              <button onClick={saveExpense} disabled={saving || !amount} style={{
                flex: 1, padding: 8, borderRadius: 'var(--rs)', fontSize: 12,
                cursor: 'pointer', background: 'var(--acc)', border: 'none',
                color: '#0d0e12', fontWeight: 600, opacity: saving ? 0.7 : 1,
              }}>
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function MiniChart() {
  const bars = [35, 52, 42, 68, 56, 82, 72]
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 40, flexShrink: 0 }}>
      {bars.map((h, i) => (
        <div key={i} style={{
          width: 8, borderRadius: '2px 2px 0 0',
          height: `${h}%`,
          background: i >= 5 ? 'var(--acc)' : 'rgba(123,158,248,.4)',
        }} />
      ))}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%', background: 'rgba(255,255,255,.05)',
  border: '0.5px solid var(--b)', borderRadius: 'var(--rs)',
  padding: '7px 9px', fontSize: 12, color: 'var(--t)',
  outline: 'none', marginBottom: 8,
}

const MOCK_EXPENSES = [
  { id: '1', amount: 45000,  description: 'GoFood lunch',  category: 'Food',      date: '', source: 'manual' as const },
  { id: '2', amount: 32000,  description: 'Grab',          category: 'Transport', date: '', source: 'manual' as const },
  { id: '3', amount: 180000, description: 'Tokopedia',     category: 'Shopping',  date: '', source: 'manual' as const },
]
