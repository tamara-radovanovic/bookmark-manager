import { Link } from "react-router-dom";
import { RegisterForm } from "../components/auth/RegisterForm";

export function RegisterPage() {
  return (
    <main className="flex justify-center px-8 py-24 pb-30">
      <div className="w-full max-w-130 rounded-[28px] border border-blush-100 bg-white/90 p-12 shadow-[0_24px_60px_-30px_rgba(160,90,115,0.35)]">
        <div className="mb-9.5 flex flex-col items-center gap-2.5">
          <img src="/bookmark.png" alt="" className="h-19 w-19 object-contain" />
          <h1 className="font-heading text-4xl font-bold text-ink-900">Create an account</h1>
          <p className="text-lg text-ink-300">Start building your reading list.</p>
        </div>
        <RegisterForm />
        <p className="mt-6 text-center text-[17px] text-ink-300">
          Already have an account?{" "}
          <Link
            to="/login"
            className="rounded-sm font-bold text-blush-600 no-underline hover:text-blush-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blush-400 focus-visible:ring-offset-2"
          >
            Log in
          </Link>
        </p>
      </div>
    </main>
  );
}
