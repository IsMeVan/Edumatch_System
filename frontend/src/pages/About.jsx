import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function About() {
  const { user } = useAuth()

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      
      {/* HEADER */}
      <div className="text-center mb-10 sm:mb-16">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4 break-words">
          អំពី EduMatch
        </h1>
        <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 break-words">
          ប្រព័ន្ធណែនាំសាលា និងមុខវិជ្ជាសម្រាប់សិស្សកម្ពុជា
        </p>
      </div>


      {/* WHY WE CREATED IT */}
      <Section title="ហេតុអ្វីបានជាយើងបង្កើត EduMatch">
        <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 leading-relaxed break-words mb-4">
          សិស្សកម្ពុជាជាច្រើនមានការលំបាកក្នុងការជ្រើសរើសសាលា និងមុខវិជ្ជា 
          បន្ទាប់ពីបញ្ចប់ការសិក្សានៅវិទ្យាល័យ។ ព័ត៌មានអំពីសាកលវិទ្យាល័យ 
          មុខវិជ្ជាសិក្សា និងអាហារូបករណ៍មានរាយប៉ាយនៅទីផ្សេងៗ ហើយពិបាករកឃើញ។
        </p>
        <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 leading-relaxed break-words mb-4">
          សិស្សជាច្រើនមិនដឹងថាសាលាណាដែលសមរម្យជាមួយចំណាប់អារម្មណ៍ ជំនាញ 
          និងគោលដៅជីវិតរបស់ខ្លួន។ ការសម្រេចចិត្តខុសអាចនាំឱ្យខាតពេលវេលា 
          លុយ និងឱកាសរបស់សិស្ស។
        </p>
        <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 leading-relaxed break-words">
          EduMatch ត្រូវបានបង្កើតឡើងដើម្បីដោះស្រាយបញ្ហានេះ ដោយផ្តល់ជូននូវ
          ប្រព័ន្ធណែនាំសាលា និងមុខវិជ្ជាដ៏ឆ្លាតវៃ ដែលប្រើបច្ចេកវិទ្យា AI 
          ដើម្បីផ្គូផ្គងសិស្សជាមួយឱកាសសិក្សាដែលសមនឹងពួកគេបំផុត។
        </p>
      </Section>


      {/* PURPOSE */}
      <Section title="គោលបំណង">
        <ul className="space-y-3">
          <PurposeItem
            number="១"
            text="ជួយសិស្សកម្ពុជារកសាលា និងមុខវិជ្ជាដែលសមរម្យជាមួយខ្លួន"
          />
          <PurposeItem
            number="២"
            text="ប្រមូលផ្តុំព័ត៌មានគ្រឹះស្ថានឧត្តមសិក្សាទាំងអស់នៅកម្ពុជានៅកន្លែងតែមួយ"
          />
          <PurposeItem
            number="៣"
            text="ផ្តល់ការណែនាំផ្ទាល់ខ្លួនដោយប្រើបច្ចេកវិទ្យា AI"
          />
          <PurposeItem
            number="៤"
            text="បង្ហាញឱកាសអាហារូបករណ៍ដែលអាចជួយសិស្សចំណាយតិច"
          />
          <PurposeItem
            number="៥"
            text="កាត់បន្ថយការខាតពេលវេលា និងធ្វើឱ្យដំណើរការសម្រេចចិត្តងាយស្រួលជាងមុន"
          />
        </ul>
      </Section>


      {/* STATISTICS */}
      <Section title="ស្ថិតិបច្ចុប្បន្ន">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <StatBox number="127" label="សាលា" sublabel="គ្រឹះស្ថានឧត្តមសិក្សា" />
          <StatBox number="813" label="មុខវិជ្ជា" sublabel="ខុសៗគ្នា" />
          <StatBox number="50+" label="អាហារូបករណ៍" sublabel="កម្មវិធី" />
        </div>
      </Section>


      {/* HOW TO USE - STEP BY STEP */}
      <Section title="របៀបប្រើប្រាស់ EduMatch">
        <div className="space-y-4 sm:space-y-5">
          <Step
            number="១"
            title="ចុះឈ្មោះគណនី"
            description="បង្កើតគណនីដោយប្រើអ៊ីមែលរបស់អ្នក។ វាត្រូវការតែប៉ុន្មាននាទីប៉ុណ្ណោះ។"
          />
          <Step
            number="២"
            title="ធ្វើការស្ទង់មតិ"
            description="ឆ្លើយសំណួរ ៥ ដំណាក់កាលអំពីចំណាប់អារម្មណ៍ ជំនាញ និងគោលដៅរបស់អ្នក។ AI របស់យើងនឹងវិភាគចម្លើយរបស់អ្នកដើម្បីរកមុខវិជ្ជា និងសាលាសមរម្យ។"
          />
          <Step
            number="៣"
            title="មើលលទ្ធផលណែនាំ"
            description="ទទួលបានបញ្ជីសាលា និងមុខវិជ្ជាដែលសមនឹងអ្នកបំផុត ព្រមជាមួយភាគរយផ្គូផ្គង។"
          />
          <Step
            number="៤"
            title="ស្វែងយល់លម្អិតពីសាលា"
            description="ចុចលើសាលាណាមួយដើម្បីមើលព័ត៌មានពេញលេញ: ទីតាំង មហាវិទ្យាល័យ មុខវិជ្ជា អាហារូបករណ៍ និងលេខទូរស័ព្ទ។"
          />
          <Step
            number="៥"
            title="រក្សាសាលាដែលអ្នកចូលចិត្ត"
            description="ចុចលើនិមិត្តសញ្ញាបេះដូងដើម្បីរក្សាសាលាដែលអ្នកចាប់អារម្មណ៍ មកមើលឡើងវិញនៅពេលក្រោយ។"
          />
          <Step
            number="៦"
            title="សួរ AI ឆាត"
            description="មានសំណួរ? ប្រើ AI ឆាតរបស់យើងសម្រាប់ការឆ្លើយតបភ្លាមៗអំពីសាលា មុខវិជ្ជា ឬការប្រើប្រាស់ប្រព័ន្ធ។"
          />
        </div>
      </Section>


      {/* FEATURES */}
      <Section title="មុខងារដ៏មានប្រយោជន៍សម្រាប់សិស្ស">
        <div className="space-y-4">
          <Feature
            title="ការស្ទង់មតិ AI ផ្ទាល់ខ្លួន"
            description="ប្រព័ន្ធ AI វិភាគចំណាប់អារម្មណ៍ ជំនាញ និងគោលដៅរបស់អ្នក ដើម្បីណែនាំសាលា និងមុខវិជ្ជាដ៏សមរម្យបំផុត។ មិនមែនគ្រាន់តែស្វែងរកតាមឈ្មោះទេ ប៉ុន្តែផ្គូផ្គងពិតប្រាកដ។"
          />
          <Feature
            title="ព័ត៌មានសាលាពេញលេញ"
            description="មើលព័ត៌មានលម្អិតពីសាកលវិទ្យាល័យទាំងអស់នៅកម្ពុជា: ទីតាំង ប្រភេទសាលា មហាវិទ្យាល័យ មុខវិជ្ជា អាហារូបករណ៍ និងព័ត៌មានទាក់ទង។"
          />
          <Feature
            title="ការសន្ទនាជាមួយ AI"
            description="សួរសំណួរអ្វីក៏បាន អំពីការអប់រំនៅកម្ពុជា។ AI របស់យើងឆ្លើយជាភាសាខ្មែរ និងអង់គ្លេស ផ្តល់ព័ត៌មានរហ័ស និងត្រឹមត្រូវ។"
          />
          <Feature
            title="សាលាដែលចូលចិត្ត"
            description="រក្សាសាលាដែលអ្នកចាប់អារម្មណ៍ដោយចុចបេះដូងតែមួយ។ មកមើលឡើងវិញនៅពេលណាក៏បាន ហើយប្រៀបធៀបជម្រើសរបស់អ្នក។"
          />
          <Feature
            title="ប្រវត្តិការស្ទង់មតិ"
            description="រក្សាទុកលទ្ធផលស្ទង់មតិទាំងអស់របស់អ្នក។ ឆ្លើយម្តងទៀតប្រសិនបើគំនិតអ្នកផ្លាស់ប្តូរ ហើយប្រៀបធៀបលទ្ធផល។"
          />
          <Feature
            title="ព័ត៌មានអាហារូបករណ៍"
            description="ស្វែងយល់ពីឱកាសអាហារូបករណ៍នៅសាលានីមួយៗ ដែលអាចជួយអ្នកសិក្សាដោយចំណាយតិចជាងមុន។"
          />
          <Feature
            title="ការរាយការណ៍បញ្ហា"
            description="ប្រសិនបើអ្នកឃើញបញ្ហា ឬមានសំណើ សូមប្រាប់យើង។ ក្រុមការងារនឹងពិនិត្យ និងឆ្លើយតបទាន់ពេលវេលា។"
          />
        </div>
      </Section>


    </div>
  )
}


/* Helper Components */

function Section({ title, children }) {
  return (
    <div className="mb-10 sm:mb-14">
      <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-5 pb-2 border-b border-gray-200 dark:border-gray-800 break-words">
        {title}
      </h2>
      {children}
    </div>
  )
}


function PurposeItem({ number, text }) {
  return (
    <li className="flex items-start gap-3">
      <span className="
        flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full
        bg-brand-100 dark:bg-brand-900/30
        text-brand-700 dark:text-brand-400
        font-bold text-xs sm:text-sm
        flex items-center justify-center
      ">
        {number}
      </span>
      <span className="text-sm sm:text-base text-gray-700 dark:text-gray-300 leading-relaxed break-words min-w-0">
        {text}
      </span>
    </li>
  )
}


function StatBox({ number, label, sublabel }) {
  return (
    <div className="
      bg-white dark:bg-gray-900
      border border-gray-200 dark:border-gray-800
      rounded-xl p-4 sm:p-5 text-center
    ">
      <div className="text-2xl sm:text-3xl font-bold text-brand-600 dark:text-brand-400 mb-1">
        {number}
      </div>
      <div className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white">
        {label}
      </div>
      <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 break-words">
        {sublabel}
      </div>
    </div>
  )
}


function Step({ number, title, description }) {
  return (
    <div className="flex gap-3 sm:gap-4">
      <div className="
        flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full
        bg-gradient-to-br from-brand-500 to-purple-500
        text-white font-bold text-sm sm:text-base
        flex items-center justify-center
      ">
        {number}
      </div>
      <div className="flex-1 min-w-0 pt-1">
        <h3 className="font-bold text-base sm:text-lg text-gray-900 dark:text-white mb-1 break-words">
          {title}
        </h3>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 leading-relaxed break-words">
          {description}
        </p>
      </div>
    </div>
  )
}


function Feature({ title, description }) {
  return (
    <div className="
      bg-white dark:bg-gray-900
      border border-gray-200 dark:border-gray-800
      rounded-xl p-4 sm:p-5
      hover:border-brand-300 dark:hover:border-brand-700
      transition
    ">
      <h3 className="font-bold text-base sm:text-lg text-gray-900 dark:text-white mb-2 break-words">
        {title}
      </h3>
      <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 leading-relaxed break-words">
        {description}
      </p>
    </div>
  )
}