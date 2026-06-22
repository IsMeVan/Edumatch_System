import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'

// Survey options (Khmer) — no icons in data, just text
const STUDY_TRACKS = [
  { value: 'វិទ្យាសាស្ត្រ', label: 'វិទ្យាសាស្ត្រ' },
  { value: 'សង្គមវិទ្យា',  label: 'សង្គមវិទ្យា'  },
]

const GPA_LEVELS = [
  { value: 'high',   label: 'ខ្ពស់ ' },
  { value: 'medium', label: 'មធ្យម ' },
  { value: 'low',    label: 'ក្រោមមធ្យម' },
]

const CAREER_INTERESTS = [
  { value: 'វិស្វកម្ម' },
  { value: 'ព័ត៌មានវិទ្យា' },
  { value: 'វេជ្ជសាស្ត្រ' },
  { value: 'គ្រប់គ្រងពាណិជ្ជកម្ម' },
  { value: 'នីតិសាស្ត្រ' },
  { value: 'អប់រំ' },
  { value: 'កសិកម្ម' },
  { value: 'វិចិត្រសិល្បៈ' },
  { value: 'វិទ្យាសាស្ត្រ' },
  { value: 'ទេសចរណ៍' },
]

const STRONG_SUBJECTS = [
  { value: 'គណិតវិទ្យា' },
  { value: 'រូបវិទ្យា' },
  { value: 'គីមីវិទ្យា' },
  { value: 'ជីវវិទ្យា' },
  { value: 'ភាសាអង់គ្លេស' },
  { value: 'អក្សរសាស្ត្រខ្មែរ' },
  { value: 'ប្រវត្តិសាស្ត្រ' },
  { value: 'ភូមិវិទ្យា' },
  { value: 'សេដ្ឋកិច្ច' },
]


export default function Survey() {
  const navigate = useNavigate()
  const [started, setStarted] = useState(false)
  const [agreed, setAgreed] = useState(false)
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    study_track: '',
    gpa_level: '',
    career_interest: '',
    strong_subjects: [],
    free_text: '',
  })

  const toggleSubject = (subj) => {
    setForm((f) => ({
      ...f,
      strong_subjects: f.strong_subjects.includes(subj)
        ? f.strong_subjects.filter((s) => s !== subj)
        : [...f.strong_subjects, subj],
    }))
  }

  const canProceed = () => {
    if (step === 1) return form.study_track !== ''
    if (step === 2) return form.gpa_level !== ''
    if (step === 3) return form.career_interest !== ''
    if (step === 4) return form.strong_subjects.length > 0
    return true
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await api.post('/survey/submit', form)
      const surveyId = res.data.survey_id
      navigate(`/results/${surveyId}`)
    } catch (err) {
      setError(err.response?.data?.detail || 'Submit failed')
    } finally {
      setLoading(false)
    }
  }

  // INTRO SCREEN
  if (!started) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <div className="
          bg-white dark:bg-gray-900
          border border-gray-100 dark:border-gray-800
          rounded-2xl shadow-xl p-5 sm:p-8 md:p-10
        ">
          {/* Shield icon */}
          <div className="
            w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-6 rounded-2xl
            bg-gradient-to-br from-brand-500 to-purple-500
            flex items-center justify-center
            shadow-lg shadow-brand-500/30
          ">
            <svg className="w-8 h-8 sm:w-10 sm:h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>

          {/* Title */}
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white text-center mb-3 break-words">
            ស្វាគមន៍មកកាន់ការតេស្ត
          </h1>
          <p className="text-sm sm:text-base text-center text-gray-500 dark:text-gray-400 mb-6 sm:mb-8 break-words">
            ការតេស្តនេះនឹងជួយណែនាំសាលា មុខវិជ្ជា និងអាហារូបករណ៍ដែលសមស្របបំផុតសម្រាប់អ្នក
          </p>

          {/* Info pills */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6 sm:mb-8">
            <InfoBox icon={<ClockIcon />} title="3 នាទី" subtitle="រយៈពេលរហ័ស" />
            <InfoBox icon={<ListIcon />} title="5 ជំហាន" subtitle="ងាយយល់" />
            <InfoBox icon={<LockIcon />} title="សុវត្ថិភាព" subtitle="ទិន្នន័យឯកជន" />
          </div>

          {/* What we collect */}
          <div className="
            bg-blue-50 dark:bg-blue-900/20
            border border-blue-200 dark:border-blue-800
            rounded-xl p-4 sm:p-5 mb-6
          ">
            <h3 className="font-semibold text-blue-900 dark:text-blue-200 mb-2 flex items-center gap-2 text-sm sm:text-base">
              <InfoIcon />
              តើយើងសួរអ្វីខ្លះ?
            </h3>
            <ul className="space-y-1.5 text-xs sm:text-sm text-blue-800 dark:text-blue-300">
              <li className="break-words">· ប្រភេទមុខវិជ្ជារបស់អ្នក (វិទ្យាសាស្ត្រ / សង្គមវិទ្យា)</li>
              <li className="break-words">· លទ្ធផលសិក្សា (GPA)</li>
              <li className="break-words">· ចំណាប់អារម្មណ៍ការងារ</li>
              <li className="break-words">· មុខវិជ្ជាដែលអ្នកខ្លាំង</li>
              <li className="break-words">· ព័ត៌មានបន្ថែម (ជាជម្រើស)</li>
            </ul>
          </div>

          {/* Agreement checkbox */}
          <label className="
            flex items-start gap-3 p-3 sm:p-4 rounded-xl cursor-pointer
            bg-gray-50 dark:bg-gray-800
            border border-gray-200 dark:border-gray-700
            hover:bg-gray-100 dark:hover:bg-gray-700
            transition
          ">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-0.5 w-5 h-5 rounded text-brand-600 focus:ring-brand-500 flex-shrink-0"
            />
            <span className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 break-words min-w-0">
              ខ្ញុំយល់ព្រមផ្តល់ព័ត៌មាននេះ ដើម្បីទទួលបានការណែនាំសាលា និងមុខវិជ្ជាសមរម្យ។
              ព័ត៌មានរបស់ខ្ញុំនឹងត្រូវរក្សាជាសម្ងាត់។
            </span>
          </label>

          {/* Start button */}
          <button
            onClick={() => setStarted(true)}
            disabled={!agreed}
            className="
              w-full mt-6 py-3 sm:py-3.5 rounded-full font-semibold text-white text-sm sm:text-base
              bg-gradient-to-r from-brand-500 to-purple-500
              hover:from-brand-600 hover:to-purple-600
              shadow-lg shadow-brand-500/30
              disabled:opacity-40 disabled:cursor-not-allowed
              transition
            "
          >
            ចាប់ផ្តើមការតេស្ត →
          </button>
        </div>
      </div>
    )
  }

  // SURVEY STEPS
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      {/* Progress bar */}
      <div className="mb-6 sm:mb-8">
        <div className="flex justify-between text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-2">
          <span>Step {step} of 5</span>
          <span>{Math.round((step / 5) * 100)}% complete</span>
        </div>
        <div className="h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-brand-600 transition-all duration-300"
            style={{ width: `${(step / 5) * 100}%` }}
          />
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-xl p-5 sm:p-8">
        {step === 1 && (
          <Section title="ប្រភេទមុខវិជ្ជា" subtitle="Choose your study track">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {STUDY_TRACKS.map((t) => (
                <OptionCard
                  key={t.value}
                  selected={form.study_track === t.value}
                  onClick={() => setForm({ ...form, study_track: t.value })}
                  label={t.label}
                />
              ))}
            </div>
          </Section>
        )}

        {step === 2 && (
          <Section title="លទ្ធផលសិក្សា" subtitle="What's your current GPA?">
            <div className="grid grid-cols-1 gap-3 sm:gap-4">
              {GPA_LEVELS.map((g) => (
                <OptionCard
                  key={g.value}
                  selected={form.gpa_level === g.value}
                  onClick={() => setForm({ ...form, gpa_level: g.value })}
                  label={g.label}
                />
              ))}
            </div>
          </Section>
        )}

        {step === 3 && (
          <Section title="ចំណាប់អារម្មណ៍ការងារ" subtitle="Pick one career field">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {CAREER_INTERESTS.map((c) => (
                <OptionCard
                  key={c.value}
                  selected={form.career_interest === c.value}
                  onClick={() => setForm({ ...form, career_interest: c.value })}
                  label={c.value}
                />
              ))}
            </div>
          </Section>
        )}

        {step === 4 && (
          <Section title="មុខវិជ្ជាខ្លាំង" subtitle="Pick subjects you're good at (multiple)">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
              {STRONG_SUBJECTS.map((s) => (
                <OptionCard
                  key={s.value}
                  selected={form.strong_subjects.includes(s.value)}
                  onClick={() => toggleSubject(s.value)}
                  label={s.value}
                  compact
                />
              ))}
            </div>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-4">
              Selected: {form.strong_subjects.length}
            </p>
          </Section>
        )}

        {step === 5 && (
          <Section title="ប្រាប់យើងបន្ថែម" subtitle="Optional: tell us more (any language)">
            <textarea
              value={form.free_text}
              onChange={(e) => setForm({ ...form, free_text: e.target.value })}
              placeholder="ឧ. ខ្ញុំចូលចិត្តកូដ និងបញ្ហាគណិតវិទ្យា..."
              className="
                w-full h-32 sm:h-40 px-3 sm:px-4 py-3 rounded-xl resize-none outline-none text-sm sm:text-base
                bg-white dark:bg-gray-800
                border border-gray-300 dark:border-gray-700
                text-gray-900 dark:text-white
                focus:ring-2 focus:ring-brand-500
              "
            />
          </Section>
        )}

        {error && (
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-xs sm:text-sm rounded-lg p-3 mt-6 break-words">
            {error}
          </div>
        )}

        <div className="flex justify-between mt-6 sm:mt-8 gap-3">
          <button
            onClick={() => setStep(step - 1)}
            disabled={step === 1}
            className="
              px-4 sm:px-6 py-2.5 rounded-lg font-medium text-sm sm:text-base
              text-gray-600 dark:text-gray-400
              disabled:opacity-30
              hover:bg-gray-100 dark:hover:bg-gray-800
              whitespace-nowrap
            "
          >
            Back
          </button>

          {step < 5 ? (
            <button
              onClick={() => setStep(step + 1)}
              disabled={!canProceed()}
              className="px-6 sm:px-8 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-medium rounded-lg disabled:opacity-50 transition text-sm sm:text-base whitespace-nowrap"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-4 sm:px-8 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-medium rounded-lg disabled:opacity-50 transition text-xs sm:text-base whitespace-nowrap"
            >
              {loading ? 'Finding matches...' : 'Get Recommendations'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}


/* Helper Components */

function InfoBox({ icon, title, subtitle }) {
  return (
    <div className="
      text-center p-3 sm:p-4 rounded-xl
      bg-gray-50 dark:bg-gray-800
      border border-gray-200 dark:border-gray-700
    ">
      <div className="flex justify-center mb-2 text-brand-600 dark:text-brand-400">
        {icon}
      </div>
      <div className="font-semibold text-gray-900 dark:text-white text-xs sm:text-sm break-words">{title}</div>
      <div className="text-xs text-gray-500 dark:text-gray-400 break-words">{subtitle}</div>
    </div>
  )
}

function Section({ title, subtitle, children }) {
  return (
    <div>
      <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white break-words">{title}</h2>
      <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mb-4 sm:mb-6 break-words">{subtitle}</p>
      {children}
    </div>
  )
}

function OptionCard({ selected, onClick, label, compact = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        flex items-center gap-2 sm:gap-3 ${compact ? 'p-2.5 sm:p-3' : 'p-3 sm:p-4'} rounded-xl border-2 text-left transition min-w-0
        ${selected
          ? 'border-brand-600 bg-brand-50 dark:bg-brand-600/20 dark:border-brand-500 shadow-md'
          : 'border-gray-200 dark:border-gray-700 hover:border-brand-300 hover:bg-gray-50 dark:hover:bg-gray-800'
        }
      `}
    >
      {/* Checkmark */}
      <span className={`
        flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center
        ${selected
          ? 'border-brand-600 bg-brand-600'
          : 'border-gray-300 dark:border-gray-600'
        }
      `}>
        {selected && (
          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </span>
      <span className={`font-medium break-words min-w-0 ${
        selected
          ? 'text-brand-700 dark:text-brand-300'
          : 'text-gray-700 dark:text-gray-300'
      } ${compact ? 'text-xs sm:text-sm' : 'text-sm sm:text-base'}`}>
        {label}
      </span>
    </button>
  )
}


/* SVG Icons */

function ClockIcon() {
  return (
    <svg className="w-6 h-6 sm:w-7 sm:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

function ListIcon() {
  return (
    <svg className="w-6 h-6 sm:w-7 sm:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
  )
}

function LockIcon() {
  return (
    <svg className="w-6 h-6 sm:w-7 sm:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  )
}

function InfoIcon() {
  return (
    <svg className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}