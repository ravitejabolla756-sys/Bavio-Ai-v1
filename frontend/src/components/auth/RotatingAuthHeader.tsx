interface AuthHeaderProps {
  variant: "login" | "signup";
}

const copy = {
  login: {
    headline: <>Your voice workforce,<br /><span className="text-[#FF6B00]">always on.</span></>,
    body: "AI voice agents that answer calls, qualify leads, and keep your business moving — 24/7.",
  },
  signup: {
    headline: <>Build the voice team<br /><span className="text-[#FF6B00]">your business needs.</span></>,
    body: "Create AI voice agents that answer, qualify, book, and route customer conversations automatically.",
  },
} as const;

export default function RotatingAuthHeader({ variant }: AuthHeaderProps) {
  const message = copy[variant];

  return (
    <div className="absolute left-[11%] top-[35%] z-20 w-[min(500px,72%)] text-left select-none">
      <span className="mb-3 block font-sans text-[12px] font-semibold uppercase tracking-[0.14em] text-[#FF6B00]">
        BAVIO AI WORKFORCE
      </span>
      <h2 className="font-serif text-[48px] font-normal leading-[1.02] tracking-[-0.025em] text-white lg:text-[56px]">
        {message.headline}
      </h2>
      <p
        className="mt-5 max-w-[450px] font-sans text-[16px] leading-[1.55]"
        style={{ color: "rgba(255,255,255,0.64)" }}
      >
        {message.body}
      </p>
    </div>
  );
}
