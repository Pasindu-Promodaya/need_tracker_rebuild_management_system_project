import Link from "next/link";

const terms = [
  {
    title: "Platform use",
    text: "Use the platform to publish needs, coordinate donations, and manage related records in a respectful and lawful manner.",
  },
  {
    title: "Account responsibility",
    text: "Keep your login details secure and ensure the information you submit is accurate and up to date.",
  },
  {
    title: "Content and moderation",
    text: "We may review, limit, or remove content that is inaccurate, abusive, or inconsistent with the platform’s purpose.",
  },
];

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-linear-to-br from-amber-50 via-white to-orange-50">
      <section className="border-b border-amber-100 bg-linear-to-r from-amber-700 via-orange-700 to-red-700 px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <p className="inline-flex rounded-full border border-white/25 bg-white/15 px-4 py-1 text-sm font-semibold text-white backdrop-blur-sm">
            Terms of Service
          </p>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Clear terms for a trusted donation network.
          </h1>
          <p className="mt-5 max-w-2xl text-base text-amber-50 sm:text-lg">
            These terms describe how the platform should be used and what responsibilities come with creating or managing donation-related records.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-6">
          {terms.map((term) => (
            <article key={term.title} className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900">{term.title}</h2>
              <p className="mt-3 text-sm leading-7 text-gray-600">{term.text}</p>
            </article>
          ))}
        </div>

        <div className="mt-8 rounded-2xl border border-amber-100 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900">Need help?</h2>
          <p className="mt-3 text-sm leading-7 text-gray-600">
            If you need clarification on any platform rule or usage guideline, our team can help.
          </p>
          <div className="mt-5">
            <Link href="/contact" className="text-sm font-semibold text-amber-700 hover:text-amber-800">
              Reach support →
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
