import { useState } from "react";

import { formErrorsFrom, type FieldErrors } from "../fieldErrors";

// Erros de um formulário que grava no servidor: por campo junto do campo, os
// restantes num aviso. O servidor responde 400 com {campo: [mensagens]}.
// `prefix` distingue os ids quando há vários formulários na mesma página.
export function useFormErrors(fields: readonly string[], fallback: string) {
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);

  function clear() {
    setFieldErrors({});
    setFormError(null);
  }

  function show(caught: unknown) {
    const errors = formErrorsFrom(caught, fields, fallback);
    setFieldErrors(errors.fieldErrors);
    setFormError(errors.formError);
  }

  function errorProps(prefix: string, name: string) {
    return fieldErrors[name]
      ? { "aria-invalid": true, "aria-describedby": `${prefix}-${name}-erro` }
      : {};
  }

  function renderError(prefix: string, name: string) {
    const messages = fieldErrors[name];
    return messages ? (
      <p className="field-error" id={`${prefix}-${name}-erro`}>
        {messages.join(" ")}
      </p>
    ) : null;
  }

  return { formError, clear, show, errorProps, renderError };
}
