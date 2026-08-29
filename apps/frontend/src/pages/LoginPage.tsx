import { Link } from "react-router-dom";
import { LoginForm } from "../components/auth/LoginForm";

export function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-4">
      <h1 className="text-2xl font-semibold">Log in</h1>
      <LoginForm />
      <p className="text-sm text-gray-600">
        Don't have an account?{" "}
        <Link to="/register" className="text-blue-600 underline">
          Register
        </Link>
      </p>
    </div>
  );
}
