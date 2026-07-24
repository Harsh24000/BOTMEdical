export default function LogoMark({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      <path d="M12 2a10 10 0 000 20 10 10 0 010-20z" fill="#93c5fd" />
      <path d="M12 2a10 10 0 010 20A10 10 0 0112 2z" fill="#2563eb" />
    </svg>
  );
}
