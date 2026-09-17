import styles from "./hero-globe.module.css";

export default function CodedEarth() {
  return (
    <>
      {/* Static coastline artwork; traffic movement lives in the isolated overlay. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        className={styles.earth}
        src="/images/hero/earth-coded-americas.svg"
        width="740"
        height="740"
        alt=""
        fetchPriority="high"
      />
      <p className={styles.earthCaption}>Conversations<br />that create<br />opportunities.<span /></p>
    </>
  );
}
