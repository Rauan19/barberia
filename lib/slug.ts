const DIACRITICS = /[̀-ͯ]/g;

/** Slug de URL a partir do nome da barbearia. */
export function slugify(input: string) {
  const base = input
    .normalize('NFD')
    .replace(DIACRITICS, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
  return base || 'barbearia';
}

/** Telefone somente com digitos, para comparar cadastros. */
export function normalizePhone(phone: string) {
  return phone.replace(/\D/g, '');
}
