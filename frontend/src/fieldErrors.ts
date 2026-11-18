// Separa os erros do DRF entre os campos que o formulário mostra e os restantes
// (non_field_errors, __all__, campos sem controlo no formulário).

import { ApiError } from "./api/client";

export type FieldErrors = Record<string, string[]>;

export function splitFieldErrors(
  fieldErrors: FieldErrors,
  knownFields: readonly string[],
): { forFields: FieldErrors; others: string[] } {
  const forFields: FieldErrors = {};
  const others: string[] = [];
  for (const [name, messages] of Object.entries(fieldErrors)) {
    if (knownFields.includes(name)) {
      forFields[name] = messages;
    } else {
      others.push(...messages);
    }
  }
  return { forFields, others };
}

// O que um formulário mostra depois de um erro: mensagens por campo e um aviso geral.
// O aviso junta os erros sem campo; sem nenhum erro de campo, usa o detail do
// servidor ou, se o erro nem veio do servidor, a mensagem por defeito.
export function formErrorsFrom(
  caught: unknown,
  knownFields: readonly string[],
  fallback: string,
): { fieldErrors: FieldErrors; formError: string | null } {
  const apiError = caught instanceof ApiError ? caught : null;
  const { forFields, others } = splitFieldErrors(apiError ? apiError.fieldErrors : {}, knownFields);
  let formError: string | null = null;
  if (others.length > 0) {
    formError = others.join(" ");
  } else if (Object.keys(forFields).length === 0) {
    formError = apiError ? apiError.detail : fallback;
  }
  return { fieldErrors: forFields, formError };
}
