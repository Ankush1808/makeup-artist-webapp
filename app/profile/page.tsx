export default function ProfilePage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-pink-50 via-white to-pink-50 p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <section className="bg-white rounded-[2rem] shadow-xl border border-pink-100 p-6 md:p-10">
          <p className="text-sm uppercase tracking-[0.25em] text-pink-500 font-semibold">
            Business Settings
          </p>

          <h1 className="mt-3 text-4xl md:text-5xl font-bold text-pink-950">
            Profile
          </h1>

          <p className="mt-3 text-gray-600 text-lg max-w-2xl">
            Manage your artist identity, business details and quotation branding.
          </p>
        </section>

        <section className="grid md:grid-cols-2 gap-5">
          <div className="bg-white rounded-3xl shadow-md border border-pink-100 p-6">
            <div className="text-3xl mb-4">👩‍🎨</div>
            <h2 className="text-xl font-bold text-pink-950">
              Artist Details
            </h2>
            <p className="text-gray-500 mt-2">
              Artist name, city, phone number and Instagram handle.
            </p>
          </div>

          <div className="bg-white rounded-3xl shadow-md border border-pink-100 p-6">
            <div className="text-3xl mb-4">✨</div>
            <h2 className="text-xl font-bold text-pink-950">
              Business Branding
            </h2>
            <p className="text-gray-500 mt-2">
              Business name, logo and PDF quotation identity.
            </p>
          </div>

          <div className="bg-white rounded-3xl shadow-md border border-pink-100 p-6">
            <div className="text-3xl mb-4">📄</div>
            <h2 className="text-xl font-bold text-pink-950">
              PDF Preferences
            </h2>
            <p className="text-gray-500 mt-2">
              Luxury quotation templates and branding preferences.
            </p>
          </div>

          <div className="bg-white rounded-3xl shadow-md border border-pink-100 p-6">
            <div className="text-3xl mb-4">🔐</div>
            <h2 className="text-xl font-bold text-pink-950">
              Account
            </h2>
            <p className="text-gray-500 mt-2">
              Login, security and account related settings.
            </p>
          </div>
        </section>

        <section className="bg-pink-900 text-white rounded-3xl shadow-xl p-6 md:p-8">
          <h2 className="text-2xl font-bold">
            Coming Next
          </h2>

          <p className="mt-2 text-pink-100">
            We will connect this page with your Supabase profile table so artists can edit their
            business name, artist name, phone, Instagram, city and branding details.
          </p>
        </section>
      </div>
    </main>
  );
}