const presets = new Map(Object.entries({
  emerald: '#34d399', sky: '#38bdf8', violet: '#a78bfa', amber: '#fbbf24', rose: '#fb7185'
}))

export function kpiColor(value) {
  return typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value)
    ? value : presets.get(value) ?? presets.get('emerald')
}
