import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import { useAuth } from "../../context/AuthContext";
import { getApiErrorMessage } from "../../i18n/get-api-error-message";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";

const MIN_PASSWORD_LENGTH = 8;

interface FieldErrors {
  email?: string;
  password?: string;
  confirmPassword?: string;
}

function validate(
  email: string,
  password: string,
  confirmPassword: string,
  t: TFunction,
): FieldErrors {
  const errors: FieldErrors = {};

  if (!email) {
    errors.email = t("auth.validation.emailRequired");
  }

  if (!password) {
    errors.password = t("auth.validation.passwordRequired");
  } else if (password.length < MIN_PASSWORD_LENGTH) {
    errors.password = t("auth.validation.passwordMinLength", { count: MIN_PASSWORD_LENGTH });
  }

  if (!confirmPassword) {
    errors.confirmPassword = t("auth.validation.confirmPasswordRequired");
  } else if (confirmPassword !== password) {
    errors.confirmPassword = t("auth.validation.passwordMismatch");
  }

  return errors;
}

export function RegisterForm() {
  const { t } = useTranslation();
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

    const errors = validate(email, password, confirmPassword, t);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      return;
    }

    setIsSubmitting(true);
    try {
      await register({ email, password });
      navigate("/dashboard");
    } catch (err) {
      setFormError(getApiErrorMessage(err, t));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6.5">
      <label className="flex flex-col gap-2.5 font-heading text-lg font-semibold text-ink-500">
        {t("auth.fields.email")}
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
        {t("auth.fields.password")}
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
        {t("auth.fields.confirmPassword")}
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
        {isSubmitting ? t("auth.register.submitting") : t("auth.register.submit")}
      </Button>
    </form>
  );
}
