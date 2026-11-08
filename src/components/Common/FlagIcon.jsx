export default function FlagIcon({ code, className = 'w-5 h-3.5', rounded = 'rounded-sm' }) {
  const c = (code || '').toLowerCase();

  switch (c) {
    // 🇮🇩 Indonesia
    case 'id':
      return (
        <svg
          viewBox="0 0 640 480"
          className={`${className} ${rounded} overflow-hidden shadow-sm inline-block border border-gray-650 flex-shrink-0`}
          xmlns="http://www.w3.org/2000/svg"
        >
          <path fill="#e70011" d="M0 0h640v240H0z" />
          <path fill="#ffffff" d="M0 240h640v240H0z" />
        </svg>
      );

    // 🇬🇧 United Kingdom / English
    case 'en':
    case 'gb':
    case 'uk':
      return (
        <svg
          viewBox="0 0 60 30"
          className={`${className} ${rounded} overflow-hidden shadow-sm inline-block border border-gray-650 flex-shrink-0`}
          xmlns="http://www.w3.org/2000/svg"
        >
          <clipPath id="flag-gb-clip">
            <path d="M0 0v30h60v-30z" />
          </clipPath>
          <clipPath id="flag-gb-cross">
            <path d="M30 15h30v15zv15h-30zH0zV0h30z" />
          </clipPath>
          <g clipPath="url(#flag-gb-clip)">
            <path d="M0 0v30h60v-30z" fill="#012169" />
            <path d="M0 0l60 30m0-30L0 30" stroke="#fff" strokeWidth="6" />
            <path d="M0 0l60 30m0-30L0 30" clipPath="url(#flag-gb-cross)" stroke="#c8102e" strokeWidth="4" />
            <path d="M30 0v30M0 15h60" stroke="#fff" strokeWidth="10" />
            <path d="M30 0v30M0 15h60" stroke="#c8102e" strokeWidth="6" />
          </g>
        </svg>
      );

    // 🇫🇮 Finland / Suomi
    case 'fi':
      return (
        <svg
          viewBox="0 0 18 11"
          className={`${className} ${rounded} overflow-hidden shadow-sm inline-block border border-gray-650 flex-shrink-0`}
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect width="18" height="11" fill="#ffffff" />
          <rect width="3" height="11" x="5" fill="#003580" />
          <rect width="18" height="3" y="4" fill="#003580" />
        </svg>
      );

    // 🇪🇸 Spain / España
    case 'es':
      return (
        <svg
          viewBox="0 0 750 500"
          className={`${className} ${rounded} overflow-hidden shadow-sm inline-block border border-gray-650 flex-shrink-0`}
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect width="750" height="500" fill="#c60b1e" />
          <rect width="750" height="250" y="125" fill="#ffc400" />
          <g transform="translate(180, 210) scale(0.8)">
            <path d="M0 0h50v45a25 25 0 0 1-50 0z" fill="#c60b1e" />
            <path d="M8 8h34v28a17 17 0 0 1-34 0z" fill="#ffc400" />
          </g>
        </svg>
      );

    // 🇹🇷 Turkey / Türkiye
    case 'tr':
      return (
        <svg
          viewBox="0 0 1200 800"
          className={`${className} ${rounded} overflow-hidden shadow-sm inline-block border border-gray-650 flex-shrink-0`}
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect width="1200" height="800" fill="#e30a17" />
          <circle cx="425" cy="400" r="200" fill="#fff" />
          <circle cx="475" cy="400" r="160" fill="#e30a17" />
          <polygon
            points="583.33,400 706.74,440.09 630.45,335.11 630.45,464.89 706.74,359.91"
            fill="#fff"
          />
        </svg>
      );

    // 🇷🇺 Russia / Россия
    case 'ru':
      return (
        <svg
          viewBox="0 0 9 6"
          className={`${className} ${rounded} overflow-hidden shadow-sm inline-block border border-gray-650 flex-shrink-0`}
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect width="9" height="2" fill="#ffffff" />
          <rect width="9" height="2" y="2" fill="#0039a6" />
          <rect width="9" height="2" y="4" fill="#d52b1e" />
        </svg>
      );

    default:
      return null;
  }
}
