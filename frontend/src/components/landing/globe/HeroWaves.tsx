import { useId } from "react";
import styles from "./hero-globe.module.css";

/** Layered Bezier surfaces: the highlights and troughs give the folds their depth. */
export default function HeroWaves() {
  const id = useId().replace(/:/g, "");
  return (
    <svg className={styles.waves} viewBox="0 0 1774 887" preserveAspectRatio="none" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={`${id}-satin`} x1="0" y1="0" x2=".15" y2="1">
          <stop stopColor="#fff" /><stop offset=".2" stopColor="#fff" />
          <stop offset=".48" stopColor="#e8e4df" /><stop offset=".7" stopColor="#f7f5f2" /><stop offset="1" stopColor="#fff" />
        </linearGradient>
        <linearGradient id={`${id}-fold`} x1="0" y1="0" x2=".25" y2="1">
          <stop stopColor="#fff" /><stop offset=".34" stopColor="#faf9f7" />
          <stop offset=".56" stopColor="#e6e1db" /><stop offset=".78" stopColor="#f5f3f0" /><stop offset="1" stopColor="#fff" />
        </linearGradient>
        <linearGradient id={`${id}-edge`}><stop stopColor="#ff6b00"/><stop offset=".5" stopColor="#ffa544"/><stop offset="1" stopColor="#ffdcaa" stopOpacity="0"/></linearGradient>
        <linearGradient id={`${id}-outer`} x1="1" y1="0" x2=".3" y2="1"><stop stopColor="#ffb45e" stopOpacity="0"/><stop offset=".35" stopColor="#ff6b00"/><stop offset=".73" stopColor="#ff6b00"/><stop offset="1" stopColor="#ffd49b" stopOpacity="0"/></linearGradient>
        <filter id={`${id}-soft`} x="-10%" y="-30%" width="120%" height="180%"><feGaussianBlur stdDeviation="7"/></filter>
      </defs>
      <path d="M-120 215C131 278 143 659 420 739C686 816 782 623 1031 684C1252 738 1471 823 1880 461L1880 940H-120Z" fill={`url(#${id}-satin)`}/>
      <path d="M-90 355C94 397 132 671 351 770C587 876 863 681 1107 730C1370 783 1593 639 1840 537" fill="none" stroke="#cfc7bc" strokeOpacity=".24" strokeWidth="18" filter={`url(#${id}-soft)`}/>
      <path d="M-90 355C94 397 132 671 351 770C587 876 863 681 1107 730C1370 783 1593 639 1840 537L1840 940H-90Z" fill={`url(#${id}-fold)`} stroke="#fff" strokeOpacity=".8"/>
      <path d="M-50 535C194 461 194 806 510 827C834 848 1033 739 1237 704C1504 658 1614 675 1810 492L1810 940H-50Z" fill={`url(#${id}-satin)`}/>
      <path d="M-50 535C194 461 194 806 510 827C834 848 1033 739 1237 704" fill="none" stroke={`url(#${id}-edge)`} strokeWidth="1.6"/>
      <path d="M-120 650C159 576 216 882 552 892C1043 907 1310 753 1538 689C1662 654 1722 612 1840 566L1840 940H-120Z" fill={`url(#${id}-fold)`} stroke="#fff" strokeOpacity=".8"/>
      <path d="M1520-70C1725 86 1786 347 1707 552C1624 769 1476 800 1230 822" fill="none" stroke={`url(#${id}-outer)`} strokeWidth="1.5"/>
    </svg>
  );
}
