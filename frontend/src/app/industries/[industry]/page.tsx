"use client";

import React, { use } from "react";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import IndustryHero from "@/components/industries/IndustryHero";
import IndustryProblem from "@/components/industries/IndustryProblem";
import IndustryWorkflow from "@/components/industries/IndustryWorkflow";
import IndustryConversation from "@/components/industries/IndustryConversation";
import IndustryLeadCard from "@/components/industries/IndustryLeadCard";
import IndustryBenefits from "@/components/industries/IndustryBenefits";
import IndustryROI from "@/components/industries/IndustryROI";
import IndustryFAQ from "@/components/industries/IndustryFAQ";
import IndustryCTA from "@/components/industries/IndustryCTA";
import IndustryPlaceholder from "@/components/industries/IndustryPlaceholder";

// Industry Metadata for non-implemented paths
const placeholderIndustries: Record<string, string> = {
  healthcare: "Healthcare",
  education: "Education & Coaching",
  restaurants: "Restaurants & Hospitality",
  "home-services": "Home Services",
  legal: "Legal Services",
  finance: "Finance & Banking",
  ecommerce: "E-commerce",
};

export default function IndustryPage({
  params,
}: {
  params: Promise<{ industry: string }>;
}) {
  const resolvedParams = use(params);
  const { industry } = resolvedParams;

  // Render placeholder if it's one of the other industries
  if (placeholderIndustries[industry]) {
    return <IndustryPlaceholder industryName={placeholderIndustries[industry]} />;
  }

  // Fallback to placeholder if path is unknown and not real-estate
  if (industry !== "real-estate") {
    return <IndustryPlaceholder industryName="Custom Industry" />;
  }

  // ── REAL ESTATE PAGE CONFIGURATION ──
  const heroData = {
    eyebrow: "AI VOICE AGENT FOR REAL ESTATE",
    headline: "Never Miss a Property Enquiry.",
    supportingCopy: "Bavio answers property enquiries, qualifies buyers, captures their requirements, and helps your team turn more calls into real opportunities.",
    primaryCtaText: "Get Started",
    secondaryCtaText: "Hear the AI in Action",
    visualData: {
      callerInput: "I'm looking for a 3-bedroom apartment.",
      bavioReply1: "Sure. What area are you looking in?",
      callerInput2: "Gachibowli. My budget is around ₹80 lakh.",
      bavioReply2: "Got it. Would you like to schedule a site visit?",
      leadTitle: "New Property Lead",
      leadFields: [
        { label: "Name", value: "Rahul Sharma" },
        { label: "Intent", value: "3 BHK Apartment" },
        { label: "Location", value: "Gachibowli" },
        { label: "Budget", value: "₹80 Lakh" },
        { label: "Site Visit", value: "Requested", isBadge: true },
        { label: "Status", value: "Qualified", isBadge: true }
      ]
    }
  };

  const problemData = {
    heading: "Every Missed Call Could Be Your Next Deal.",
    problemSummary: "Real estate agents are constantly showing properties, driving between sites, in client meetings, or signing agreements. In the background, customer calls keep coming. Bavio ensures none of those calls go unanswered.",
    cards: [
      {
        title: "MISSED ENQUIRIES",
        desc: "Potential buyers call when agents are unavailable or out in the field.",
        iconKey: "missed"
      },
      {
        title: "UNQUALIFIED LEADS",
        desc: "Agents waste hours calling back prospects without knowing their budget or criteria.",
        iconKey: "unqualified"
      },
      {
        title: "SLOW FOLLOW-UP",
        desc: "Hot prospects move on to other property listings when they don't get a fast response.",
        iconKey: "slow"
      },
      {
        title: "LOST SITE VISITS",
        desc: "Highly interested callers fail to schedule appointments and fall out of the funnel.",
        iconKey: "lost"
      }
    ]
  };

  const workflowSteps = [
    {
      number: "01",
      title: "ANSWER",
      desc: "Bavio answers every incoming property enquiry instantly, 24/7.",
      iconKey: "answer"
    },
    {
      number: "02",
      title: "UNDERSTAND",
      desc: "It captures details on configuration, area, budget, timeline, and site visit preferences.",
      iconKey: "understand"
    },
    {
      number: "03",
      title: "QUALIFY",
      desc: "It identifies high-intent buyers, isolates unqualified prospects, and logs key details.",
      iconKey: "qualify"
    },
    {
      number: "04",
      title: "FOLLOW UP",
      desc: "Leads appear immediately in your dashboard and trigger instant alerts to your sales team.",
      iconKey: "follow"
    }
  ];

  const conversationData = {
    heading: "It Sounds Like Your Best Agent.",
    sectionTitle: "Conversational Context",
    useCases: [
      {
        title: "PROPERTY ENQUIRIES",
        quote: "Is the Gachibowli 3 BHK project still available for visits?"
      },
      {
        title: "BUDGET QUALIFICATION",
        quote: "I'm looking for a premium property within ₹1.5 crore."
      },
      {
        title: "LOCATION DETAILS",
        quote: "Do you have any listings near Financial District?"
      },
      {
        title: "SITE VISITS",
        quote: "Can we schedule a site walkthrough for tomorrow morning?"
      }
    ],
    dialog: [
      { sender: "caller" as const, text: "Hi, I'm looking for a 3 BHK in Hyderabad." },
      { sender: "bavio" as const, text: "Absolutely. Which area are you considering?" },
      { sender: "caller" as const, text: "Gachibowli or Kondapur." },
      { sender: "bavio" as const, text: "What's your approximate budget?" },
      { sender: "caller" as const, text: "Between ₹70 and ₹90 lakh." },
      { sender: "bavio" as const, text: "Got it. Would you like me to arrange a site visit?" },
      { sender: "caller" as const, text: "Yes, Saturday afternoon." }
    ],
    summaryFields: [
      { label: "Type", value: "3 BHK" },
      { label: "Location", value: "Gachibowli / Kondapur" },
      { label: "Budget", value: "₹70–90 Lakh" },
      { label: "Visit", value: "Saturday afternoon" }
    ]
  };

  const leadCardData = {
    heading: "Every Conversation Becomes a Lead.",
    leadName: "Rahul Sharma",
    leadPhone: "+91 XXXXX XXXXX",
    fields: [
      { label: "Property Interest", value: "3 BHK Apartment" },
      { label: "Location", value: "Gachibowli" },
      { label: "Budget", value: "₹70–90 Lakh" },
      { label: "Timeline", value: "This Week" },
      { label: "Intent", value: "HIGH INTENT", isBadge: true },
      { label: "Status", value: "Site visit requested", isBadge: true }
    ],
    summary: "Call connected at 14:02. Customer is actively looking for a 3 BHK unit in Gachibowli under 90L. Highly interested in scheduling a site walkthrough on Saturday afternoon. Recommended follow-up."
  };

  const benefitsList = [
    {
      title: "24/7 Call Answering",
      desc: "Never let late-night property enquiries or busy weekend calls go unanswered.",
      iconKey: "clock"
    },
    {
      title: "Automatic Lead Qualification",
      desc: "Screen buyer budgets, configurations, and locations before calling back.",
      iconKey: "shield"
    },
    {
      title: "Instant Lead Information",
      desc: "Receive structured lead cards via WhatsApp as soon as the call hangs up.",
      iconKey: "userlist"
    },
    {
      title: "More Site Visits",
      desc: "Guide hot prospects to schedule walkthroughs automatically while interest is high.",
      iconKey: "calendar"
    },
    {
      title: "Consistent Experience",
      desc: "Ensure every potential property buyer is greeted professionally in Hindi, English, or Hinglish.",
      iconKey: "smiley"
    }
  ];

  const roiBefore = [
    { text: "Buyer dials property agency" },
    { text: "Agent is busy showing a site; call is missed" },
    { text: "Buyer leaves no voicemail and moves to next listing" }
  ];

  const roiAfter = [
    { text: "Buyer dials property agency" },
    { text: "Bavio answers in under 500ms, qualifying intent" },
    { text: "Lead card logged: 3 BHK, Gachibowli, ₹80L" },
    { text: "Agent receives instant details & schedules site visit" }
  ];

  const faqList = [
    {
      question: "Can Bavio answer property enquiries after office hours?",
      answer: "Yes. Bavio operates 24/7 in the cloud. It greets late-night property buyers, captures their criteria, and schedules site visits even when your agents are asleep."
    },
    {
      question: "Can Bavio qualify buyers by budget and location?",
      answer: "Absolutely. Bavio engages callers in a natural conversation to extract their budget parameters, preferred configurations (e.g. 2 BHK / 3 BHK), and preferred locations."
    },
    {
      question: "Can Bavio book site visits?",
      answer: "Yes. It can check slot availability and schedule site walkthroughs, updating your CRM or calendar dynamically."
    },
    {
      question: "Can Bavio handle multiple calls?",
      answer: "Bavio is built on highly concurrent cloud telephony servers and can handle hundreds of customer calls simultaneously, eliminating busy tones."
    },
    {
      question: "Can I customize what the AI asks buyers?",
      answer: "Yes, you can edit the voice agent prompt in your workspace settings to customize the criteria, questions, and qualification thresholds."
    },
    {
      question: "Can Bavio send lead information to my team?",
      answer: "Yes. Once the call finishes, Bavio sends a structured lead summary card directly to your dashboard and via instant WhatsApp alerts."
    },
    {
      question: "Can I use my existing business number?",
      answer: "Yes. You can simply set up conditional call forwarding (e.g., forward when busy or unanswered) from your current mobile or landline to your dedicated Bavio number."
    }
  ];

  return (
    <div className="theme-bavio-light min-h-screen bg-[#FFFDF8] text-[#140A02] font-sans antialiased relative overflow-hidden noise-overlay flex flex-col w-full">
      <Navbar />

      <main className="flex-grow w-full">
        {/* Hero Section */}
        <IndustryHero
          eyebrow={heroData.eyebrow}
          headline={heroData.headline}
          supportingCopy={heroData.supportingCopy}
          primaryCtaText={heroData.primaryCtaText}
          secondaryCtaText={heroData.secondaryCtaText}
          visualData={heroData.visualData}
        />

        {/* Problem Section */}
        <IndustryProblem
          heading={problemData.heading}
          problemSummary={problemData.problemSummary}
          cards={problemData.cards}
        />

        {/* Workflow Section */}
        <IndustryWorkflow
          heading="From Call to Qualified Lead."
          steps={workflowSteps}
        />

        {/* Conversation Section */}
        <IndustryConversation
          heading={conversationData.heading}
          sectionTitle={conversationData.sectionTitle}
          useCases={conversationData.useCases}
          dialog={conversationData.dialog}
          summaryFields={conversationData.summaryFields}
        />

        {/* Lead Capture Section */}
        <IndustryLeadCard
          heading={leadCardData.heading}
          leadName={leadCardData.leadName}
          leadPhone={leadCardData.leadPhone}
          fields={leadCardData.fields}
          summary={leadCardData.summary}
        />

        {/* Benefits Section */}
        <IndustryBenefits
          heading={benefitsList[0] ? "Give Your Team More Time to Close." : ""}
          benefits={benefitsList}
        />

        {/* ROI Section */}
        <IndustryROI
          heading="A Direct Path to Bookings."
          beforeSteps={roiBefore}
          afterSteps={roiAfter}
        />

        {/* FAQ Section */}
        <IndustryFAQ
          heading="Questions Worth Asking."
          faqs={faqList}
        />

        {/* Final CTA Section */}
        <IndustryCTA
          heading="Turn More Calls Into Property Opportunities."
          supportingText="Let Bavio handle the calls while your team focuses on closing deals."
          primaryCtaText="Get Started"
          secondaryCtaText="Try the Demo"
        />
      </main>

      <Footer />
    </div>
  );
}
