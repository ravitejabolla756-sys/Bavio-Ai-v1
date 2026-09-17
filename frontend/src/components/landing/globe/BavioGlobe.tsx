import styles from "./hero-globe.module.css";

export default function BavioGlobe() {
  return (
    <div className={styles.globe} data-globe="" data-ready="true" aria-hidden="true">
      <div className={styles.globeHalo} />
      <img className={styles.globeAsset} src="/images/hero/bavio-pearl-globe.png" alt="" draggable={false} />
      <svg className={styles.globeOrbit} viewBox="0 0 760 620" aria-hidden="true">
        <ellipse className={styles.orbitNeutral} cx="380" cy="310" rx="294" ry="112" transform="rotate(-19 380 310)" />
        <ellipse className={styles.orbitWarm} cx="380" cy="310" rx="310" ry="126" transform="rotate(25 380 310)" />
        <ellipse className={styles.orbitNeutral} cx="380" cy="310" rx="325" ry="82" transform="rotate(-34 380 310)" />
        <circle className={styles.node} cx="152" cy="402" r="4" />
        <circle className={styles.node} cx="638" cy="208" r="4" />
        <circle className={styles.node} cx="208" cy="196" r="3.5" />
        <circle className={styles.node} cx="570" cy="452" r="3.5" />
      </svg>
      <div className={styles.globeQuote} aria-hidden="true">
        <span>Conversations</span>
        <span>that create</span>
        <span>opportunities.</span>
        <i />
      </div>
    </div>
  );
}
