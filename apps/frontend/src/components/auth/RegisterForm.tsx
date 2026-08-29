import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { isAxiosError } from "axios";
import { useAuth } from "../../context/AuthContext";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";

const MIN_PASSWORD_LENGTH = 8;

interface FieldErrors {
  email?: string;
  password?: string;
  confirmPassword?: string;
}

function validate(email: string, password: string, confirmPassword: string): FieldErrors {
  const errors: FieldErrors = {};

  if (!email) {
    errors.email = "Email is required.";
  }

  if (!password) {
    errors.password = "Password is required.";
  } else if (password.length < MIN_PASSWORD_LENGTH) {
    errors.password = `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
  }

  if (!confirmPassword) {
    errors.confirmPassword = "Please confirm your password.";
  } else if (confirmPassword !== password) {
    errors.confirmPassword = "Passwords do not match.";
  }

  return errors;
}

export function RegisterForm() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError(null);

    const errors = validate(email, password, confirmPassword);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      return;
    }

    setIsSubmitting(true);
    try {
      await register({ email, password });
      navigate("/dashboard");
    } catch (err) {
      if (isAxiosError(err) && err.response?.status === 409) {
        setFormError("An account with this email already exists.");
      } else if (isAxiosError(err) && err.response?.status === 400) {
        setFormError("Please enter a valid email and password.");
      } else {
        setFormError("Something went wrong. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6.5">
      <label className="flex flex-col gap-2.5 font-heading text-lg font-semibold text-ink-500">
        Email
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          hasError={Boolean(fieldErrors.email)}
          aria-describedby={fieldErrors.email ? "email-error" : undefined}
        />
        {fieldErrors.email && (
          <p
            id="email-error"
            role="alert"
            className="font-body text-sm font-normal text-danger-text"
          >
            {fieldErrors.email}
          </p>
        )}
      </label>

      <label className="flex flex-col gap-2.5 font-heading text-lg font-semibold text-ink-500">
        Password
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          hasError={Boolean(fieldErrors.password)}
          aria-describedby={fieldErrors.password ? "password-error" : undefined}
        />
        {fieldErrors.password && (
          <p
            id="password-error"
            role="alert"
            className="font-body text-sm font-normal text-danger-text"
          >
            {fieldErrors.password}
          </p>
        )}
      </label>

      <label className="flex flex-col gap-2.5 font-heading text-lg font-semibold text-ink-500">
        Confirm password
        <Input
          id="confirmPassword"
          type="password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          hasError={Boolean(fieldErrors.confirmPassword)}
          aria-describedby={fieldErrors.confirmPassword ? "confirmPassword-error" : undefined}
        />
        {fieldErrors.confirmPassword && (
          <p
            id="confirmPassword-error"
            role="alert"
            className="font-body text-sm font-normal text-danger-text"
          >
            {fieldErrors.confirmPassword}
          </p>
        )}
      </label>

      {formError && (
        <p role="alert" className="font-body text-base text-danger-text">
          {formError}
        </p>
      )}

      <Button type="submit" disabled={isSubmitting} className="text-xl">
        {isSubmitting ? "Creating account..." : "Create account"}
      </Button>
    </form>
  );
}
