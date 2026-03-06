type Props = { slug: string }

export function TemplatePreview({ slug }: Props) {
  switch (slug) {
    case 'hook-insight-cta':   return <HookInsightCta />
    case 'problem-solution':   return <ProblemSolution />
    case 'step-by-step':       return <StepByStep />
    case 'story-thread':       return <StoryThread />
    case 'case-study':         return <CaseStudy />
    default:                   return <Fallback />
  }
}

/* ── Hook → Insight → CTA ──────────────────────────────────────────────────
   Layout: large hook bar / two body lines / CTA button outline            */
function HookInsightCta() {
  return (
    <svg className="w-full h-full" viewBox="0 0 100 75" fill="none">
      {/* Hook bar */}
      <rect x="4" y="6" width="92" height="10" rx="2.5" fill="#f59e0b" opacity="0.9" />
      {/* Body lines */}
      <rect x="4" y="22" width="76" height="4.5" rx="1.5" fill="#d1d5db" />
      <rect x="4" y="29" width="60" height="4.5" rx="1.5" fill="#e5e7eb" />
      <rect x="4" y="36" width="68" height="4.5" rx="1.5" fill="#d1d5db" />
      {/* CTA outline button */}
      <rect x="4" y="50" width="36" height="12" rx="3" stroke="#9ca3af" strokeWidth="1.2" fill="none" />
      <rect x="6" y="54.5" width="24" height="3" rx="1.5" fill="#d1d5db" />
      {/* Arrow */}
      <path d="M44 56h10M50 53l4 3-4 3" stroke="#d1d5db" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/* ── Problem / Solution ─────────────────────────────────────────────────────
   Layout: two equal sections separated by a divider                       */
function ProblemSolution() {
  return (
    <svg className="w-full h-full" viewBox="0 0 100 75" fill="none">
      {/* Top: Problem */}
      <rect x="4" y="5" width="28" height="6" rx="2" fill="#fca5a5" />
      <rect x="4" y="14" width="80" height="3.5" rx="1.5" fill="#d1d5db" />
      <rect x="4" y="20" width="64" height="3.5" rx="1.5" fill="#e5e7eb" />
      <rect x="4" y="26" width="72" height="3.5" rx="1.5" fill="#d1d5db" />
      {/* Divider */}
      <line x1="4" y1="37" x2="96" y2="37" stroke="#e5e7eb" strokeWidth="1.2" />
      {/* Bottom: Solution */}
      <rect x="4" y="43" width="32" height="6" rx="2" fill="#86efac" />
      <rect x="4" y="52" width="80" height="3.5" rx="1.5" fill="#d1d5db" />
      <rect x="4" y="58.5" width="56" height="3.5" rx="1.5" fill="#e5e7eb" />
      <rect x="4" y="65" width="68" height="3.5" rx="1.5" fill="#d1d5db" />
    </svg>
  )
}

/* ── Step by Step ───────────────────────────────────────────────────────────
   Layout: numbered list with connector line                               */
function StepByStep() {
  const steps = [
    { y: 10, w: 72 },
    { y: 30, w: 60 },
    { y: 50, w: 68 },
  ]
  return (
    <svg className="w-full h-full" viewBox="0 0 100 75" fill="none">
      {/* Vertical connector */}
      <line x1="13" y1="16" x2="13" y2="54" stroke="#e5e7eb" strokeWidth="1.5" strokeDasharray="3 2" />
      {steps.map(({ y, w }, i) => (
        <g key={i}>
          {/* Number circle */}
          <circle cx="13" cy={y + 6} r="6" fill={i === 0 ? '#f59e0b' : '#f3f4f6'} />
          <text x="13" y={y + 9.5} textAnchor="middle" fontSize="6" fontWeight="700"
            fill={i === 0 ? 'white' : '#9ca3af'}>{i + 1}</text>
          {/* Content bar */}
          <rect x="24" y={y + 3} width={w} height="5" rx="2" fill="#d1d5db" />
          <rect x="24" y={y + 10.5} width={w * 0.65} height="3.5" rx="1.5" fill="#e5e7eb" />
        </g>
      ))}
    </svg>
  )
}

/* ── Story Thread ───────────────────────────────────────────────────────────
   Layout: arc narrative with rising/falling tension line                  */
function StoryThread() {
  return (
    <svg className="w-full h-full" viewBox="0 0 100 75" fill="none">
      {/* Tension arc */}
      <path d="M6 58 C20 58 28 14 50 14 C72 14 80 52 94 48"
        stroke="#f59e0b" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.6" />
      {/* Dots on arc */}
      <circle cx="6" cy="58" r="3" fill="#f59e0b" opacity="0.8" />
      <circle cx="50" cy="14" r="3" fill="#f59e0b" />
      <circle cx="94" cy="48" r="3" fill="#f59e0b" opacity="0.8" />
      {/* Labels */}
      <rect x="2" y="64" width="20" height="3.5" rx="1.5" fill="#e5e7eb" />
      <rect x="38" y="6" width="24" height="3.5" rx="1.5" fill="#d1d5db" />
      <rect x="82" y="54" width="16" height="3.5" rx="1.5" fill="#e5e7eb" />
    </svg>
  )
}

/* ── Case Study ─────────────────────────────────────────────────────────────
   Layout: title / 2-column metrics / summary bar                         */
function CaseStudy() {
  return (
    <svg className="w-full h-full" viewBox="0 0 100 75" fill="none">
      {/* Title */}
      <rect x="4" y="5" width="52" height="7" rx="2" fill="#374151" />
      {/* Two metric boxes */}
      <rect x="4" y="17" width="43" height="28" rx="3" fill="#f9fafb" stroke="#e5e7eb" strokeWidth="1" />
      <rect x="53" y="17" width="43" height="28" rx="3" fill="#f9fafb" stroke="#e5e7eb" strokeWidth="1" />
      {/* Metric values */}
      <rect x="10" y="24" width="20" height="8" rx="2" fill="#f59e0b" opacity="0.7" />
      <rect x="10" y="35" width="30" height="3" rx="1.5" fill="#d1d5db" />
      <rect x="59" y="24" width="20" height="8" rx="2" fill="#86efac" opacity="0.8" />
      <rect x="59" y="35" width="26" height="3" rx="1.5" fill="#d1d5db" />
      {/* Summary */}
      <rect x="4" y="52" width="92" height="3.5" rx="1.5" fill="#d1d5db" />
      <rect x="4" y="58" width="76" height="3.5" rx="1.5" fill="#e5e7eb" />
      <rect x="4" y="64" width="84" height="3.5" rx="1.5" fill="#d1d5db" />
    </svg>
  )
}

function Fallback() {
  return (
    <svg className="w-full h-full" viewBox="0 0 100 75" fill="none">
      <rect x="4" y="10" width="92" height="7" rx="2" fill="#e5e7eb" />
      <rect x="4" y="24" width="76" height="4" rx="1.5" fill="#f3f4f6" />
      <rect x="4" y="31" width="60" height="4" rx="1.5" fill="#f3f4f6" />
      <rect x="4" y="38" width="68" height="4" rx="1.5" fill="#f3f4f6" />
    </svg>
  )
}
