import { useTranslations } from 'next-intl'
import { getTranslations } from 'next-intl/server'

export async function generateMetadata() {
  const t = await getTranslations('publicAgreement')
  return {
    title: t('title'),
    description: t('description'),
  }
}

export default function PublicAgreementPage() {
  const t = useTranslations('publicAgreement')

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 md:p-12">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4 uppercase">
          {t('mainTitle')}
        </h1>

        <p className="text-gray-700 leading-relaxed mb-8">
          {t('intro')}
        </p>

        <div className="prose prose-gray max-w-none space-y-6">
          {/* Section 1: Definitions */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {t('section1.title')}
            </h2>
            <div className="space-y-3">
              <div>
                <p className="text-gray-700">
                  <strong>{t('section1.publicOffer.term')}</strong> — {t('section1.publicOffer.definition')}
                </p>
              </div>
              <div>
                <p className="text-gray-700">
                  <strong>{t('section1.acceptance.term')}</strong> — {t('section1.acceptance.definition')}
                </p>
              </div>
              <div>
                <p className="text-gray-700">
                  <strong>{t('section1.donation.term')}</strong> — {t('section1.donation.definition')}
                </p>
              </div>
              <div>
                <p className="text-gray-700">
                  <strong>{t('section1.seller.term')}</strong> — {t('section1.seller.definition')}
                </p>
              </div>
            </div>
          </section>

          {/* Section 2: Subject */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {t('section2.title')}
            </h2>
            <p className="text-gray-700 leading-relaxed">
              {t('section2.content')}
            </p>
          </section>

          {/* Section 3: Acceptance */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {t('section3.title')}
            </h2>
            <p className="text-gray-700 leading-relaxed">
              {t('section3.content')}
            </p>
          </section>

          {/* Section 4: Foundation Rights & Obligations */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {t('section4.title')}
            </h2>
            <div className="space-y-4">
              <div>
                <p className="font-semibold text-gray-900 mb-2">
                  {t('section4.rightsTitle')}
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                  <li>{t('section4.right1')}</li>
                  <li>{t('section4.right2')}</li>
                  <li>{t('section4.right3')}</li>
                </ul>
              </div>
              <div>
                <p className="font-semibold text-gray-900 mb-2">
                  {t('section4.obligationsTitle')}
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                  <li>{t('section4.obligation1')}</li>
                  <li>{t('section4.obligation2')}</li>
                  <li>{t('section4.obligation3')}</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Section 5: Donor Rights & Obligations */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {t('section5.title')}
            </h2>
            <div className="space-y-4">
              <div>
                <p className="font-semibold text-gray-900 mb-2">
                  {t('section5.rightsTitle')}
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                  <li>{t('section5.right1')}</li>
                  <li>{t('section5.right2')}</li>
                </ul>
              </div>
              <div>
                <p className="font-semibold text-gray-900 mb-2">
                  {t('section5.obligationsTitle')}
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                  <li>{t('section5.obligation1')}</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Section 6: Place and Terms */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {t('section6.title')}
            </h2>
            <p className="text-gray-700 leading-relaxed">
              {t('section6.content')}
            </p>
          </section>

          {/* Section 7: Methods */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {t('section7.title')}
            </h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              {t('section7.content')}
            </p>
          </section>

          {/* Section 8: Use of Donations */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {t('section8.title')}
            </h2>
            <p className="text-gray-700 leading-relaxed">
              {t('section8.content')}
            </p>
          </section>

          {/* Section 9: Contact */}
          <section className="bg-gray-50 p-6 rounded-lg border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {t('section9.title')}
            </h2>
            <div className="space-y-2 text-gray-700">
              <p>
                <strong>{t('section9.name')}:</strong> Charitable Foundation "Way
                to future UA"
              </p>
              <p>
                <strong>{t('section9.address')}:</strong> Ukraine, 52005,
                Dnipropetrovsk region, Dnipro city, Slobozhanske village, St.
                Heroes of Ukraine, 27c
              </p>
              <p>
                <strong>{t('section9.website')}:</strong>{' '}
                <a
                  href="https://alexzaiwukelan.org.ua/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 underline"
                >
                  https://alexzaiwukelan.org.ua/
                </a>
              </p>
              <p>
                <strong>{t('section9.email')}:</strong> contact@waytofutureua.org.ua
              </p>
              <p>
                <strong>{t('section9.phone')}:</strong> +38 096 383 7878
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
