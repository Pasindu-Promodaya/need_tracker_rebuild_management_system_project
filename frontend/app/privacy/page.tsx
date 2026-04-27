import Link from "next/link";

const sections = [
  {
    title: "What we collect",
    text: "We collect account details, organization information, donation activity, and contact data needed to operate the platform.",
  },
  {
    title: "Why we collect it",
    text: "Data is used to match donations to needs, maintain records, support verification, and improve platform reporting.",
  },
  {
    title: "How we protect it",
    text: "Access is role-based, and sensitive platform operations are limited to authenticated users with appropriate permissions.",
  },
];

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-linear-to-br from-cyan-50 via-white to-slate-50">
      <section className="border-b border-cyan-100 bg-linear-to-r from-cyan-700 to-slate-800 px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <p className="inline-flex rounded-full border border-white/25 bg-white/15 px-4 py-1 text-sm font-semibold text-white backdrop-blur-sm">
            Privacy Policy
          </p>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Privacy that supports safe donation coordination.
          </h1>
          <p className="mt-5 max-w-2xl text-base text-cyan-50 sm:text-lg">
            We keep privacy simple: collect what is needed to run the service, protect access, and use data only to improve donation workflows and accountability.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-6">
          {sections.map((section) => (
            <article key={section.title} className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900">{section.title}</h2>
              <p className="mt-3 text-sm leading-7 text-gray-600">{section.text}</p>
            </article>
          ))}
        </div>

        <article className="mt-8 rounded-2xl border border-cyan-100 bg-cyan-50 p-6">
          <h2 className="text-xl font-bold text-gray-900">Your choices</h2>
          <p className="mt-3 text-sm leading-7 text-gray-600">
            You can update your profile details, limit sharing to the extent supported by your role, and contact us if you need help understanding how your information is used.
          </p>
          <div className="mt-5">
            <Link href="/contact" className="text-sm font-semibold text-cyan-700 hover:text-cyan-800">
              Contact us about privacy →
            </Link>
          </div>
        </article>
      </section>
    </div>
  );
}
