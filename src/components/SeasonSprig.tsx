export function SeasonSprig({ season }: { season: string }) {
  const plant = season === 'Winter' ? 'winter' : season === 'Autumn' ? 'autumn' : season === 'Summer' ? 'summer' : 'spring';
  return <svg className={`season-sprig season-sprig--${plant}`} viewBox="0 0 64 88" width="48" height="66" aria-hidden="true" focusable="false">
    <path fill="currentColor" d="M30 83c3-18 4-35 3-62h2c2 28 0 47-3 62h-2ZM33 58C17 57 11 46 14 37c11 0 21 8 19 21Zm1-13c1-14 11-24 23-22-1 15-12 22-23 22Z" />
    {plant === 'spring' && <g fill="#ad7e89"><ellipse cx="34" cy="12" rx="6" ry="10"/><ellipse cx="24" cy="20" rx="10" ry="6"/><ellipse cx="44" cy="20" rx="10" ry="6"/><ellipse cx="34" cy="28" rx="6" ry="9"/><circle cx="34" cy="20" r="5" fill="#c9a858"/></g>}
    {plant === 'summer' && <g fill="#b09542"><ellipse cx="30" cy="16" rx="5" ry="10" transform="rotate(-26 30 16)"/><ellipse cx="40" cy="10" rx="5" ry="10" transform="rotate(24 40 10)"/><ellipse cx="41" cy="28" rx="5" ry="9" transform="rotate(40 41 28)"/></g>}
    {plant === 'autumn' && <path fill="#a66b3f" d="M32 30C13 29 12 14 17 3c14 2 23 15 15 27Z"/>}
    {plant === 'winter' && <g fill="#a36557"><circle cx="27" cy="12" r="6"/><circle cx="39" cy="13" r="6"/><circle cx="33" cy="23" r="6"/></g>}
  </svg>;
}
