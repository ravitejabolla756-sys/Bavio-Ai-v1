import Link from "next/link";
import { useRef } from "react";
import { ArrowRight, Play } from "lucide-react";
import HeroWaves from "./globe/HeroWaves";
import BavioCobeGlobe from "./globe/BavioCobeGlobe";
import styles from "./globe/hero-globe.module.css";

export default function Hero() {
  const heroRef = useRef<HTMLElement>(null);

  return (
    <section ref={heroRef} className={styles.hero} aria-labelledby="hero-heading">
      <BavioCobeGlobe heroRef={heroRef} />
      <HeroWaves />
      <div className={styles.realUi}>
        <div className={styles.copy}>
          <p className={styles.eyebrow}><span aria-hidden="true" />Voice AI operations</p>
          <h1 id="hero-heading" className={styles.heading}>
            <span>Voice agents that turn</span>{" "}<span>conversations into <em>action.</em></span>
          </h1>
          <p className={styles.description}>Bavio answers business calls 24/7, understands customer intent, and turns conversations into structured information your business can use.</p>
        </div>
        <div className={styles.actions}>
          <Link href="/signup" className={styles.primary}>Experience Bavio — $0.99 <ArrowRight size={17} aria-hidden="true" /></Link>
          <Link href="/demo" className={styles.secondary}><Play size={15} aria-hidden="true" /> Watch Demo</Link>
        </div>
        <div className={styles.proofRow} aria-label="Bavio product principles">
          <div><span className={styles.proofMark}>A</span><span><strong>Always on</strong><small>24/7 call handling</small></span></div>
          <div><span className={styles.proofMark}>◌</span><span><strong>Built for business</strong><small>Real outcomes, not just transcripts</small></span></div>
          <div><span className={styles.proofMark}>♡</span><span><strong>Secure &amp; compliant</strong><small>Your data stays yours</small></span></div>
        </div>
      </div>
    </section>
  );
}
