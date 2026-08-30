import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../context/AuthContext";
import { getApiErrorMessage } from "../../i18n/get-api-error-message";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import type { TFunction } from "i18next";

interface FieldErrors {
  email?: string;
  password?: string;
}

function validate(email: string, password: string, t: TFunction): FieldErrors {
  const errors: FieldErrors = {};

  if (!email) {
    errors.email = t("auth.validation.emailRequired");
  }

  if (!password) {
    errors.password = t("auth.validation.passwordRequired");
  }

  return errors;
}

export function LoginForm() {
  const { t } = useTranslation();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError(null);

    const errors = validate(email, password, t);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      return;
    }

    setIsSubmitting(true);
    try {
      await login({ email, password });
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

      {formError && (
        <p role="alert" className="font-body text-base text-danger-text">
          {formError}
        </p>
      )}

      <Button type="submit" disabled={isSubmitting} className="text-xl">
        {isSubmitting ? t("auth.login.submitting") : t("auth.login.submit")}
      </Button>
    </form>
  );
}
