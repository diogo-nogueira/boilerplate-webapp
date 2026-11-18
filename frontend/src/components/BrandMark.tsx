// Marca neutra do boilerplate: quatro blocos num quadrado com a cor de destaque.
// Troque-a pela marca da aplicação (e o public/favicon.svg também).
export function BrandMark({ size = 24 }: { size?: number }) {
  return (
    <svg
      className="brand-mark"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <rect width="24" height="24" rx="6" fill="currentColor" />
      <rect x="6" y="6" width="5" height="5" rx="1.25" fill="#ffffff" />
      <rect x="13" y="6" width="5" height="5" rx="1.25" fill="#ffffff" opacity="0.6" />
      <rect x="6" y="13" width="5" height="5" rx="1.25" fill="#ffffff" opacity="0.6" />
      <rect x="13" y="13" width="5" height="5" rx="1.25" fill="#ffffff" />
    </svg>
  );
}
