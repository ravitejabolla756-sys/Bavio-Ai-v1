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

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────
interface IndustryConfig {
  hero: {
    eyebrow: string;
    headline: string;
    supportingCopy: string;
    primaryCtaText: string;
    secondaryCtaText: string;
    visualData: {
      callerInput: string;
      bavioReply1: string;
      callerInput2: string;
      bavioReply2: string;
      leadTitle: string;
      leadFields: Array<{ label: string; value: string; isBadge?: boolean }>;
    };
  };
  problem: {
    heading: string;
    problemSummary: string;
    cards: Array<{ title: string; desc: string; iconKey: string }>;
  };
  workflowHeading: string;
  workflowSteps: Array<{ number: string; title: string; desc: string; iconKey: string }>;
  conversation: {
    heading: string;
    sectionTitle: string;
    useCases: Array<{ title: string; quote: string }>;
    dialog: Array<{ sender: "caller" | "bavio"; text: string }>;
    summaryFields: Array<{ label: string; value: string }>;
  };
  leadCard: {
    heading: string;
    leadName: string;
    leadPhone: string;
    fields: Array<{ label: string; value: string; isBadge?: boolean }>;
    summary: string;
  };
  benefitsHeading: string;
  benefits: Array<{ title: string; desc: string; iconKey: string }>;
  roiHeading: string;
  roiBefore: Array<{ text: string }>;
  roiAfter: Array<{ text: string }>;
  faqHeading: string;
  faqs: Array<{ question: string; answer: string }>;
  cta: { heading: string; supportingText: string; primaryCtaText: string; secondaryCtaText: string };
}

// ─────────────────────────────────────────────────────────────
// INDUSTRY DATA MAP
// ─────────────────────────────────────────────────────────────
const industryData: Record<string, IndustryConfig> = {

  // ══════════════════════════════════════════════════════
  // HEALTHCARE
  // ══════════════════════════════════════════════════════
  healthcare: {
    hero: {
      eyebrow: "AI VOICE AGENT FOR HEALTHCARE",
      headline: "Never Miss a Patient Call.",
      supportingCopy: "Bavio answers patient calls, handles routine enquiries, helps schedule appointments, and keeps your front desk available when your team is busy.",
      primaryCtaText: "Get Started",
      secondaryCtaText: "Hear the AI in Action",
      visualData: {
        callerInput: "Hi, I'd like to book an appointment.",
        bavioReply1: "Of course. Which doctor would you like to see?",
        callerInput2: "Dr. Sharma. Is there anything available tomorrow?",
        bavioReply2: "Yes. I have an afternoon slot available. Shall I book it?",
        leadTitle: "New Appointment",
        leadFields: [
          { label: "Patient", value: "Ananya Rao" },
          { label: "Doctor", value: "Dr. Sharma" },
          { label: "Date", value: "Tomorrow" },
          { label: "Time", value: "2:30 PM" },
          { label: "Type", value: "Consultation", isBadge: true },
          { label: "Status", value: "Confirmed", isBadge: true },
        ],
      },
    },
    problem: {
      heading: "Every Unanswered Call Is a Patient Left Waiting.",
      problemSummary: "Healthcare reception teams are stretched across registrations, in-person queries, and administrative tasks. When the phone rings and no one answers, patients move on — or worse, feel uncared for. Bavio ensures every patient call is handled immediately.",
      cards: [
        { title: "MISSED APPOINTMENTS", desc: "Patients calling after hours or during busy periods find no one available and never book.", iconKey: "missed" },
        { title: "OVERLOADED RECEPTION", desc: "Front desk staff juggle walk-ins, paperwork, and calls simultaneously — causing delays for everyone.", iconKey: "unqualified" },
        { title: "ROUTINE CALL VOLUME", desc: "Most patient calls are simple: hours, directions, availability. These can be handled automatically.", iconKey: "slow" },
        { title: "AFTER-HOURS GAPS", desc: "Patients have health concerns at all hours. Clinics without 24/7 coverage miss opportunities to serve them.", iconKey: "lost" },
      ],
    },
    workflowHeading: "From Patient Call to Scheduled Appointment.",
    workflowSteps: [
      { number: "01", title: "ANSWER", desc: "Bavio answers every patient call instantly — day, night, or weekend.", iconKey: "answer" },
      { number: "02", title: "UNDERSTAND", desc: "It gathers doctor preference, appointment type, and available timing preferences.", iconKey: "understand" },
      { number: "03", title: "ROUTE", desc: "Urgent calls are escalated. Routine enquiries are resolved or appointments are logged.", iconKey: "qualify" },
      { number: "04", title: "CONFIRM", desc: "Appointment details appear in your dashboard and your team is instantly notified.", iconKey: "follow" },
    ],
    conversation: {
      heading: "Calm, Organised, and Always Available.",
      sectionTitle: "Patient Interaction",
      useCases: [
        { title: "APPOINTMENT BOOKING", quote: "I'd like to book a consultation with Dr. Mehta for next week." },
        { title: "CLINIC HOURS", quote: "What are your Saturday morning timings?" },
        { title: "DOCTOR AVAILABILITY", quote: "Is Dr. Sharma available for a second opinion visit?" },
        { title: "CALL ROUTING", quote: "I have an urgent query — can I speak to the duty doctor?" },
      ],
      dialog: [
        { sender: "caller", text: "Hi, I need to book an appointment." },
        { sender: "bavio", text: "Of course. Which doctor would you like to see?" },
        { sender: "caller", text: "Dr. Mehta, if possible." },
        { sender: "bavio", text: "Sure. Is this for a general consultation or a follow-up?" },
        { sender: "caller", text: "Follow-up from last month." },
        { sender: "bavio", text: "Got it. What day works best for you?" },
        { sender: "caller", text: "Thursday afternoon." },
      ],
      summaryFields: [
        { label: "Patient", value: "Ananya Rao" },
        { label: "Doctor", value: "Dr. Mehta" },
        { label: "Type", value: "Follow-up" },
        { label: "Preferred", value: "Thursday PM" },
      ],
    },
    leadCard: {
      heading: "Every Call Becomes a Scheduled Appointment.",
      leadName: "Ananya Rao",
      leadPhone: "+91 XXXXX XXXXX",
      fields: [
        { label: "Doctor", value: "Dr. Mehta" },
        { label: "Appointment Type", value: "Follow-up" },
        { label: "Preferred Day", value: "Thursday" },
        { label: "Time Preference", value: "Afternoon" },
        { label: "Priority", value: "ROUTINE", isBadge: true },
        { label: "Status", value: "Booking requested", isBadge: true },
      ],
      summary: "Call connected at 10:15. Patient requested a follow-up appointment with Dr. Mehta on Thursday afternoon. No urgent symptoms reported. Appointment to be confirmed by reception team.",
    },
    benefitsHeading: "Give Your Reception Team Room to Breathe.",
    benefits: [
      { title: "24/7 Patient Call Answering", desc: "Handle patient calls at midnight, on weekends, or during peak clinic hours without missing anyone.", iconKey: "clock" },
      { title: "Fewer Missed Appointments", desc: "Capture appointment requests the moment patients call, not hours later when they have already moved on.", iconKey: "calendar" },
      { title: "Reduced Reception Pressure", desc: "Let your staff focus on in-person care while Bavio handles routine call volume.", iconKey: "shield" },
      { title: "Faster Scheduling", desc: "Patients get their appointment details captured immediately without hold music or callbacks.", iconKey: "userlist" },
      { title: "Consistent Patient Experience", desc: "Every caller is greeted warmly and professionally, every single time.", iconKey: "smiley" },
    ],
    roiHeading: "A Smoother Path to Every Appointment.",
    roiBefore: [
      { text: "Patient calls during a busy morning" },
      { text: "Reception is occupied — call goes unanswered" },
      { text: "Patient tries another clinic or gives up" },
    ],
    roiAfter: [
      { text: "Patient calls at any hour" },
      { text: "Bavio answers instantly, collects appointment details" },
      { text: "Appointment logged and team notified" },
      { text: "Patient confirmed and ready to attend" },
    ],
    faqHeading: "Questions About Bavio for Healthcare.",
    faqs: [
      { question: "Can Bavio book patient appointments?", answer: "Yes. Bavio can collect patient name, doctor preference, appointment type, and timing preference. These are logged immediately into your system so your team can confirm." },
      { question: "Does Bavio provide medical advice?", answer: "No. Bavio handles administrative communication — scheduling, routing, and routine enquiries. Medical decisions remain entirely with your clinical team." },
      { question: "Can Bavio handle after-hours patient calls?", answer: "Yes. Bavio operates 24/7, capturing appointment requests and enquiries even when your clinic is closed. Urgent calls can be escalated to an on-call team." },
      { question: "Can Bavio route urgent calls to a doctor or nurse?", answer: "Yes. You can configure call routing logic so that callers who report urgency are connected to your duty staff or emergency line." },
      { question: "Can I customise what Bavio asks patients?", answer: "Yes. From your workspace settings you can edit the voice agent's questions, script, and response logic to match your clinic's specific intake process." },
      { question: "Can Bavio work with my existing clinic number?", answer: "Yes. Simply set up conditional call forwarding from your current number to your dedicated Bavio line — when your reception is busy or unavailable." },
    ],
    cta: {
      heading: "Keep Every Patient Call Covered.",
      supportingText: "Let Bavio handle the phones so your team can focus on delivering great care.",
      primaryCtaText: "Get Started",
      secondaryCtaText: "Try the Demo",
    },
  },

  // ══════════════════════════════════════════════════════
  // EDUCATION & COACHING
  // ══════════════════════════════════════════════════════
  education: {
    hero: {
      eyebrow: "AI VOICE AGENT FOR EDUCATION",
      headline: "Turn Every Course Enquiry Into a Conversation.",
      supportingCopy: "Bavio answers student and parent enquiries, explains course information, captures requirements, and helps schedule counselling or demo sessions.",
      primaryCtaText: "Get Started",
      secondaryCtaText: "Hear the AI in Action",
      visualData: {
        callerInput: "Hi, I wanted to know about your data science course.",
        bavioReply1: "Sure. Are you looking for a weekday or weekend batch?",
        callerInput2: "Weekend. What is the course duration?",
        bavioReply2: "Six months. Would you like me to arrange a counselling call?",
        leadTitle: "New Course Enquiry",
        leadFields: [
          { label: "Name", value: "Arjun Mehta" },
          { label: "Course", value: "Data Science" },
          { label: "Schedule", value: "Weekend" },
          { label: "Level", value: "Beginner" },
          { label: "Counselling", value: "Requested", isBadge: true },
          { label: "Status", value: "Qualified", isBadge: true },
        ],
      },
    },
    problem: {
      heading: "Enquiries Don't Wait for Office Hours.",
      problemSummary: "Students and parents research courses at night, on weekends, and during their lunch breaks. When they call and no one answers, they move to a competitor. Bavio captures every enquiry in the moment — and keeps the conversation alive.",
      cards: [
        { title: "MISSED ENQUIRIES", desc: "Prospective students call during evenings or weekends when admissions staff are unavailable.", iconKey: "missed" },
        { title: "SLOW FOLLOW-UP", desc: "When calls are missed and not followed up quickly, interested students enrol elsewhere.", iconKey: "slow" },
        { title: "REPEAT QUESTIONS", desc: "Admissions teams spend most of their time answering the same course questions on every call.", iconKey: "unqualified" },
        { title: "UNCAPTURED INTENT", desc: "Students who call and get no answer leave without leaving their requirements behind.", iconKey: "lost" },
      ],
    },
    workflowHeading: "From Enquiry Call to Counselling Session.",
    workflowSteps: [
      { number: "01", title: "ANSWER", desc: "Bavio answers every enquiry call immediately, at any hour.", iconKey: "answer" },
      { number: "02", title: "CAPTURE", desc: "It captures course interest, preferred schedule, experience level, and contact details.", iconKey: "understand" },
      { number: "03", title: "QUALIFY", desc: "It identifies serious prospects and flags high-intent callers for priority follow-up.", iconKey: "qualify" },
      { number: "04", title: "SCHEDULE", desc: "A counselling session is arranged and your admissions team gets an instant notification.", iconKey: "follow" },
    ],
    conversation: {
      heading: "Every Student Deserves a Timely Answer.",
      sectionTitle: "Admissions Context",
      useCases: [
        { title: "COURSE ENQUIRIES", quote: "Can you tell me about the full-stack development programme?" },
        { title: "BATCH TIMINGS", quote: "Are there evening batches for working professionals?" },
        { title: "PARENT ENQUIRIES", quote: "I'm calling about my daughter's admission to the design course." },
        { title: "COUNSELLING REQUESTS", quote: "Can I speak with someone who can help me choose the right course?" },
      ],
      dialog: [
        { sender: "caller", text: "Hi, I want to know about the data science course." },
        { sender: "bavio", text: "Happy to help. Are you looking for weekday or weekend batches?" },
        { sender: "caller", text: "Weekend works for me. I'm currently employed." },
        { sender: "bavio", text: "Got it. The weekend programme runs for six months. Do you have any prior experience?" },
        { sender: "caller", text: "Beginner. I know basic Excel." },
        { sender: "bavio", text: "Perfect starting point. Shall I arrange a counselling call?" },
        { sender: "caller", text: "Yes, please." },
      ],
      summaryFields: [
        { label: "Course", value: "Data Science" },
        { label: "Batch", value: "Weekend" },
        { label: "Experience", value: "Beginner" },
        { label: "Next Step", value: "Counselling call" },
      ],
    },
    leadCard: {
      heading: "Every Enquiry Becomes a Counselling Opportunity.",
      leadName: "Arjun Mehta",
      leadPhone: "+91 XXXXX XXXXX",
      fields: [
        { label: "Course Interest", value: "Data Science" },
        { label: "Batch Preference", value: "Weekend" },
        { label: "Experience Level", value: "Beginner" },
        { label: "Employment Status", value: "Working Professional" },
        { label: "Intent", value: "HIGH INTENT", isBadge: true },
        { label: "Status", value: "Counselling requested", isBadge: true },
      ],
      summary: "Call connected at 20:12. Prospective student enquired about the weekend data science programme. Beginner level with Excel background. Keen on a counselling call to understand career paths. High-priority follow-up recommended.",
    },
    benefitsHeading: "Let Your Admissions Team Focus on Enrolments.",
    benefits: [
      { title: "24/7 Enquiry Handling", desc: "Capture student and parent enquiries at any hour — evenings, weekends, and public holidays.", iconKey: "clock" },
      { title: "Higher Enrolment Rates", desc: "Respond to every interested caller instantly before they look elsewhere.", iconKey: "calendar" },
      { title: "Less Repeat Call Volume", desc: "Routine questions about timing, fees, and curriculum are handled automatically.", iconKey: "shield" },
      { title: "Structured Lead Data", desc: "Get a complete picture of each prospect — course interest, experience, and schedule preference.", iconKey: "userlist" },
      { title: "Better First Impression", desc: "Every enquiry is greeted warmly and professionally, setting the right tone for enrolment.", iconKey: "smiley" },
    ],
    roiHeading: "A Shorter Path from Enquiry to Enrolment.",
    roiBefore: [
      { text: "Student calls admissions at 8 PM" },
      { text: "No one available — call goes unanswered" },
      { text: "Student finds a competitor who answers and enrolls" },
    ],
    roiAfter: [
      { text: "Student calls at any hour" },
      { text: "Bavio captures course interest and schedule preference" },
      { text: "Counselling session arranged instantly" },
      { text: "Admissions team follows up with a warm lead" },
    ],
    faqHeading: "Questions About Bavio for Education.",
    faqs: [
      { question: "Can Bavio answer course-specific questions?", answer: "Yes. You can train Bavio with your course catalogue, curriculum highlights, batch timings, and fee structure so it answers accurately on every call." },
      { question: "Can Bavio schedule counselling sessions?", answer: "Yes. Bavio captures the student's availability and arranges a counselling callback. Your admissions team receives the details immediately." },
      { question: "Can Bavio handle parent enquiries?", answer: "Absolutely. Parents often call on behalf of students. Bavio handles these conversations naturally and captures all required information." },
      { question: "Can I customise what Bavio asks prospective students?", answer: "Yes. From your workspace you can edit the questions, qualification criteria, and follow-up logic to match your admissions process." },
      { question: "Can Bavio work after office hours?", answer: "Yes. Bavio operates 24/7 and is particularly valuable during peak evening and weekend enquiry windows." },
      { question: "Can I use my existing admissions number?", answer: "Yes. Set up conditional call forwarding from your current number to Bavio — it will handle calls whenever your team is unavailable." },
    ],
    cta: {
      heading: "Turn Every Enquiry Into an Enrolment Conversation.",
      supportingText: "Let Bavio capture prospective students while your team focuses on closing admissions.",
      primaryCtaText: "Get Started",
      secondaryCtaText: "Try the Demo",
    },
  },

  // ══════════════════════════════════════════════════════
  // RESTAURANTS
  // ══════════════════════════════════════════════════════
  restaurants: {
    hero: {
      eyebrow: "AI VOICE AGENT FOR RESTAURANTS",
      headline: "Never Miss a Reservation Call.",
      supportingCopy: "Bavio answers restaurant calls, handles reservation requests, answers common questions, and helps your team manage every busy period.",
      primaryCtaText: "Get Started",
      secondaryCtaText: "Hear the AI in Action",
      visualData: {
        callerInput: "Hi, I'd like to reserve a table for four tonight.",
        bavioReply1: "Absolutely. What time would you prefer?",
        callerInput2: "8 PM would be great.",
        bavioReply2: "Got it. I'll arrange a table for four at 8 PM.",
        leadTitle: "New Reservation",
        leadFields: [
          { label: "Guest Name", value: "Priya Kapoor" },
          { label: "Guests", value: "4" },
          { label: "Date", value: "Tonight" },
          { label: "Time", value: "8:00 PM" },
          { label: "Request", value: "Dinner", isBadge: true },
          { label: "Status", value: "Confirmed", isBadge: true },
        ],
      },
    },
    problem: {
      heading: "A Missed Call on a Friday Night Is a Lost Table.",
      problemSummary: "During peak service hours, your team is fully focused on delivering great food and hospitality. Phone calls ring unanswered at the host stand. Bavio handles all incoming reservation and enquiry calls so your floor team never has to pause service.",
      cards: [
        { title: "MISSED RESERVATIONS", desc: "Tables go unbooked because guests calling during peak hours never reach the host stand.", iconKey: "missed" },
        { title: "BUSY LINE FRUSTRATION", desc: "Callers who hear a busy signal or wait too long simply move to another restaurant nearby.", iconKey: "slow" },
        { title: "ROUTINE QUESTIONS", desc: "Most calls are simple: hours, location, menu, availability. These don't need a human to answer.", iconKey: "unqualified" },
        { title: "AFTER-HOURS BOOKINGS", desc: "Guests browsing for a dinner venue at 10 PM can't make a reservation if nobody answers.", iconKey: "lost" },
      ],
    },
    workflowHeading: "From Reservation Call to Confirmed Table.",
    workflowSteps: [
      { number: "01", title: "ANSWER", desc: "Bavio answers every reservation call the moment it comes in.", iconKey: "answer" },
      { number: "02", title: "CAPTURE", desc: "It collects guest name, party size, date, time, and any special requests.", iconKey: "understand" },
      { number: "03", title: "CONFIRM", desc: "Reservation details are logged and your team receives an instant notification.", iconKey: "qualify" },
      { number: "04", title: "NOTIFY", desc: "The host stand is updated in real time so the table is ready when guests arrive.", iconKey: "follow" },
    ],
    conversation: {
      heading: "Quick, Warm, and Always Ready to Seat.",
      sectionTitle: "Reservation Context",
      useCases: [
        { title: "TABLE RESERVATIONS", quote: "I'd like to book a table for six this Saturday evening." },
        { title: "MENU QUESTIONS", quote: "Do you have vegetarian options on the main menu?" },
        { title: "OPENING HOURS", quote: "Are you open for lunch on Sunday?" },
        { title: "SPECIAL OCCASIONS", quote: "We'd like to arrange a birthday dinner for eight." },
      ],
      dialog: [
        { sender: "caller", text: "Hi, I'd like to book a table for four tonight." },
        { sender: "bavio", text: "Of course. What time would you prefer?" },
        { sender: "caller", text: "Around 8 PM." },
        { sender: "bavio", text: "Perfect. May I take your name?" },
        { sender: "caller", text: "Priya Kapoor." },
        { sender: "bavio", text: "Thank you Priya. Any special requests for the table?" },
        { sender: "caller", text: "A window seat if possible." },
      ],
      summaryFields: [
        { label: "Name", value: "Priya Kapoor" },
        { label: "Party", value: "4 guests" },
        { label: "Time", value: "8:00 PM" },
        { label: "Request", value: "Window seat" },
      ],
    },
    leadCard: {
      heading: "Every Reservation Call Logged Instantly.",
      leadName: "Priya Kapoor",
      leadPhone: "+91 XXXXX XXXXX",
      fields: [
        { label: "Party Size", value: "4 Guests" },
        { label: "Date", value: "Tonight" },
        { label: "Time", value: "8:00 PM" },
        { label: "Special Request", value: "Window seat" },
        { label: "Type", value: "DINNER", isBadge: true },
        { label: "Status", value: "Reservation logged", isBadge: true },
      ],
      summary: "Call at 17:34. Guest requested a table for four at 8 PM tonight. Requested a window seat if available. No dietary restrictions mentioned. Reservation to be confirmed by host team.",
    },
    benefitsHeading: "Keep the Tables Full and the Team Free.",
    benefits: [
      { title: "24/7 Reservation Handling", desc: "Accept bookings late at night, early in the morning, and during busy service hours.", iconKey: "clock" },
      { title: "No More Missed Tables", desc: "Every incoming call is answered — even when your entire team is on the floor.", iconKey: "calendar" },
      { title: "Menu & Hours Answered Instantly", desc: "Routine questions are handled automatically so your team can focus on guests in front of them.", iconKey: "shield" },
      { title: "Structured Reservation Log", desc: "Receive clear, organized reservation details directly to your host dashboard.", iconKey: "userlist" },
      { title: "Consistent Guest Experience", desc: "Every caller is greeted warmly, every time — even when you're fully packed on a Saturday night.", iconKey: "smiley" },
    ],
    roiHeading: "A Smoother Path from Call to Seated Guest.",
    roiBefore: [
      { text: "Guest calls to book a table during Friday dinner rush" },
      { text: "Host stand is occupied — call goes unanswered" },
      { text: "Guest books at a competing restaurant instead" },
    ],
    roiAfter: [
      { text: "Guest calls at any time" },
      { text: "Bavio captures party size, time, and special requests" },
      { text: "Reservation logged and team notified instantly" },
      { text: "Table ready when guests arrive" },
    ],
    faqHeading: "Questions About Bavio for Restaurants.",
    faqs: [
      { question: "Can Bavio handle reservation calls during peak service hours?", answer: "Yes. Bavio answers calls instantly during rush hours so your floor team never has to leave guests to pick up the phone." },
      { question: "Can Bavio answer questions about the menu or operating hours?", answer: "Yes. You can configure Bavio with your current menu highlights, dietary options, opening hours, and location information." },
      { question: "Can Bavio capture special requests like dietary needs or occasion details?", answer: "Yes. Bavio asks contextual follow-up questions and captures any special requests the guest mentions during the call." },
      { question: "Can I use my existing restaurant number?", answer: "Yes. Set up call forwarding from your existing number to your Bavio line — it will pick up whenever your team is unavailable." },
      { question: "Can Bavio handle multiple calls at the same time?", answer: "Yes. Bavio runs on a concurrent cloud telephony infrastructure and handles unlimited simultaneous calls with no busy signal." },
      { question: "Can I customise what Bavio says to callers?", answer: "Yes. From your workspace settings you can edit the greeting, tone, questions, and what information Bavio collects on each reservation call." },
    ],
    cta: {
      heading: "Keep Every Table Full. Every Night.",
      supportingText: "Let Bavio handle the reservation calls while your team delivers exceptional hospitality.",
      primaryCtaText: "Get Started",
      secondaryCtaText: "Try the Demo",
    },
  },

  // ══════════════════════════════════════════════════════
  // HOME SERVICES
  // ══════════════════════════════════════════════════════
  "home-services": {
    hero: {
      eyebrow: "AI VOICE AGENT FOR HOME SERVICES",
      headline: "Never Miss a Service Request.",
      supportingCopy: "Bavio answers customer calls, understands the service needed, captures the job details, and sends your team a qualified service request the moment the call ends.",
      primaryCtaText: "Get Started",
      secondaryCtaText: "Hear the AI in Action",
      visualData: {
        callerInput: "My AC is not cooling at all.",
        bavioReply1: "I can help log this. What area are you located in?",
        callerInput2: "Kondapur. It's a home, not an office.",
        bavioReply2: "Got it. I'll send the service request to your team now.",
        leadTitle: "New Service Request",
        leadFields: [
          { label: "Customer", value: "Rahul Kumar" },
          { label: "Service", value: "AC Repair" },
          { label: "Location", value: "Kondapur" },
          { label: "Type", value: "Home" },
          { label: "Priority", value: "Urgent", isBadge: true },
          { label: "Status", value: "Request logged", isBadge: true },
        ],
      },
    },
    problem: {
      heading: "Every Missed Call Is a Job Given to Your Competitor.",
      problemSummary: "Home service technicians are on the road, on-site, and hands-on throughout the day. When customers call and no one answers, they call the next number on the list. Bavio captures every service request the instant it comes in — so no job slips through.",
      cards: [
        { title: "CALLS WHILE ON-SITE", desc: "Technicians are busy at a job. New customer calls arrive and go unanswered.", iconKey: "missed" },
        { title: "LOST JOB REQUESTS", desc: "Customers who can't reach you within seconds often call a competitor.", iconKey: "slow" },
        { title: "UNQUALIFIED DISPATCHES", desc: "Technicians arrive at jobs without knowing the issue, location, or scope of the problem.", iconKey: "unqualified" },
        { title: "AFTER-HOURS REQUESTS", desc: "Appliance failures and plumbing issues don't follow business hours — and neither should your intake.", iconKey: "lost" },
      ],
    },
    workflowHeading: "From Service Call to Qualified Job Request.",
    workflowSteps: [
      { number: "01", title: "ANSWER", desc: "Bavio answers every incoming customer call immediately — even when technicians are on-site.", iconKey: "answer" },
      { number: "02", title: "UNDERSTAND", desc: "It captures the service type, issue description, customer location, and urgency.", iconKey: "understand" },
      { number: "03", title: "QUALIFY", desc: "It identifies job type, property type, and urgency level before the technician is dispatched.", iconKey: "qualify" },
      { number: "04", title: "DISPATCH", desc: "A structured job request appears instantly in your dashboard for your team to act on.", iconKey: "follow" },
    ],
    conversation: {
      heading: "Fast, Practical, and Ready for Any Job.",
      sectionTitle: "Service Request Context",
      useCases: [
        { title: "APPLIANCE REPAIRS", quote: "My washing machine stopped mid-cycle and won't start again." },
        { title: "PLUMBING ISSUES", quote: "There's a leaking pipe under my kitchen sink." },
        { title: "AC SERVICING", quote: "My split AC is making a loud noise and barely cooling." },
        { title: "ELECTRICAL FAULTS", quote: "One room in my house has completely lost power." },
      ],
      dialog: [
        { sender: "caller", text: "My AC stopped working completely." },
        { sender: "bavio", text: "I can help log this. What type of AC is it — split or window?" },
        { sender: "caller", text: "Split unit, about three years old." },
        { sender: "bavio", text: "Got it. What area are you located in?" },
        { sender: "caller", text: "Kondapur, Hyderabad." },
        { sender: "bavio", text: "Is this for a home or an office?" },
        { sender: "caller", text: "Home." },
      ],
      summaryFields: [
        { label: "Service", value: "AC Repair" },
        { label: "Type", value: "Split unit" },
        { label: "Location", value: "Kondapur" },
        { label: "Property", value: "Home" },
      ],
    },
    leadCard: {
      heading: "Every Call Becomes a Qualified Job Card.",
      leadName: "Rahul Kumar",
      leadPhone: "+91 XXXXX XXXXX",
      fields: [
        { label: "Service Required", value: "AC Repair" },
        { label: "Unit Type", value: "Split (3 years old)" },
        { label: "Location", value: "Kondapur, Hyderabad" },
        { label: "Property Type", value: "Residential" },
        { label: "Urgency", value: "URGENT", isBadge: true },
        { label: "Status", value: "Technician dispatch pending", isBadge: true },
      ],
      summary: "Call at 14:08. Customer reported complete AC failure on a 3-year-old split unit. Residential property in Kondapur. Urgently requesting technician. Job card created — dispatch team to review and assign.",
    },
    benefitsHeading: "Win More Jobs Without Answering More Calls.",
    benefits: [
      { title: "24/7 Service Request Intake", desc: "Capture emergency repair requests in the middle of the night, weekends, and public holidays.", iconKey: "clock" },
      { title: "Fewer Lost Jobs", desc: "Every customer call is answered immediately, so you never lose a job to a competitor who picked up.", iconKey: "calendar" },
      { title: "Pre-Qualified Dispatch", desc: "Your technicians arrive knowing the issue, location, and urgency before they leave the depot.", iconKey: "shield" },
      { title: "Structured Job Cards", desc: "Receive clean, organised service requests directly to your dashboard for efficient dispatch.", iconKey: "userlist" },
      { title: "Professional First Impression", desc: "Every caller experiences a fast, professional response — even when you're mid-job on another site.", iconKey: "smiley" },
    ],
    roiHeading: "A Direct Line From Problem to Technician.",
    roiBefore: [
      { text: "Customer's AC fails on a Sunday afternoon" },
      { text: "They call — technician is on-site and unavailable" },
      { text: "Customer calls a competitor who answers" },
    ],
    roiAfter: [
      { text: "Customer calls at any time" },
      { text: "Bavio captures issue, location, and urgency instantly" },
      { text: "Structured job card sent to dispatch team" },
      { text: "Technician assigned and customer contacted" },
    ],
    faqHeading: "Questions About Bavio for Home Services.",
    faqs: [
      { question: "Can Bavio capture job details when technicians are unavailable?", answer: "Yes. Bavio answers instantly whenever your team is on-site, in transit, or off-hours. It captures all necessary job information so your dispatch team can act immediately." },
      { question: "Can Bavio handle multiple types of home services?", answer: "Yes. You can configure Bavio for plumbing, AC repair, electrical, cleaning, pest control, and any other service category your business offers." },
      { question: "Can Bavio determine job urgency?", answer: "Yes. Based on the customer's description, Bavio can flag high-urgency requests and escalate them for priority dispatch." },
      { question: "Can I customise what Bavio asks customers?", answer: "Yes. From your workspace settings you can edit the questions, service categories, and data capture fields to match your operations." },
      { question: "Can Bavio work with my current business number?", answer: "Yes. Set up call forwarding from your existing number to Bavio — it handles calls whenever your team is unreachable." },
      { question: "Can Bavio send job cards to my team?", answer: "Yes. Once a call ends, a structured job request appears in your Bavio dashboard and can trigger alerts to your dispatch team immediately." },
    ],
    cta: {
      heading: "Capture Every Service Request. Win Every Job.",
      supportingText: "Let Bavio handle the intake while your technicians focus on the work.",
      primaryCtaText: "Get Started",
      secondaryCtaText: "Try the Demo",
    },
  },

  // ══════════════════════════════════════════════════════
  // LEGAL SERVICES
  // ══════════════════════════════════════════════════════
  legal: {
    hero: {
      eyebrow: "AI VOICE AGENT FOR LEGAL SERVICES",
      headline: "Every Client Enquiry Deserves an Answer.",
      supportingCopy: "Bavio handles initial enquiries, captures basic client information, and helps schedule consultations with your team — so no prospective client is left without a response.",
      primaryCtaText: "Get Started",
      secondaryCtaText: "Hear the AI in Action",
      visualData: {
        callerInput: "I'd like to speak to a lawyer about a property matter.",
        bavioReply1: "Certainly. I can collect some details and arrange a consultation.",
        callerInput2: "Yes, please. I need help urgently.",
        bavioReply2: "Understood. I'll log the details and arrange a consultation for you.",
        leadTitle: "New Client Enquiry",
        leadFields: [
          { label: "Name", value: "Priya Shah" },
          { label: "Matter", value: "Property" },
          { label: "Consultation", value: "Requested" },
          { label: "Preferred", value: "Tomorrow AM" },
          { label: "Priority", value: "Urgent", isBadge: true },
          { label: "Status", value: "Intake logged", isBadge: true },
        ],
      },
    },
    problem: {
      heading: "Prospective Clients Don't Call Twice.",
      problemSummary: "Legal professionals are in meetings, in court, or on calls throughout the working day. When a prospective client calls and gets no response, they move to the next firm on their list. Bavio ensures every new enquiry is acknowledged and captured — professionally, every time.",
      cards: [
        { title: "MISSED INTAKE CALLS", desc: "Potential clients call during hearings or consultations and reach no one.", iconKey: "missed" },
        { title: "SLOW CONSULTATION BOOKINGS", desc: "Without a fast intake process, interested clients move to firms that respond quickly.", iconKey: "slow" },
        { title: "AFTER-HOURS ENQUIRIES", desc: "Legal issues arise at any time. Prospective clients calling outside office hours find no one available.", iconKey: "unqualified" },
        { title: "INCONSISTENT FIRST IMPRESSION", desc: "Every caller forms an opinion of your firm the moment they reach the intake process.", iconKey: "lost" },
      ],
    },
    workflowHeading: "From First Call to Scheduled Consultation.",
    workflowSteps: [
      { number: "01", title: "ANSWER", desc: "Bavio answers every initial enquiry call with a professional, calm tone.", iconKey: "answer" },
      { number: "02", title: "COLLECT", desc: "It captures the caller's name, matter type, and preferred consultation timing.", iconKey: "understand" },
      { number: "03", title: "ROUTE", desc: "Urgent matters are flagged. Standard enquiries are scheduled for the appropriate team.", iconKey: "qualify" },
      { number: "04", title: "SCHEDULE", desc: "A consultation request appears in your dashboard and your team is notified immediately.", iconKey: "follow" },
    ],
    conversation: {
      heading: "Professional, Trustworthy, and Always Present.",
      sectionTitle: "Client Intake Context",
      useCases: [
        { title: "PROPERTY MATTERS", quote: "I need legal help with a property dispute — can I speak with someone?" },
        { title: "FAMILY LAW ENQUIRIES", quote: "I'm looking for guidance on a family legal matter." },
        { title: "CORPORATE ENQUIRIES", quote: "We need a lawyer to review a commercial agreement." },
        { title: "AFTER-HOURS INTAKE", quote: "I know it's late, but I need to speak to someone urgently." },
      ],
      dialog: [
        { sender: "caller", text: "Hi, I need to speak with a lawyer about a property matter." },
        { sender: "bavio", text: "Of course. I can collect your details and arrange a consultation." },
        { sender: "caller", text: "Yes please — it's quite urgent." },
        { sender: "bavio", text: "Understood. May I take your name?" },
        { sender: "caller", text: "Priya Shah." },
        { sender: "bavio", text: "Thank you Priya. When would you prefer a consultation?" },
        { sender: "caller", text: "Tomorrow morning if possible." },
      ],
      summaryFields: [
        { label: "Name", value: "Priya Shah" },
        { label: "Matter", value: "Property" },
        { label: "Urgency", value: "High" },
        { label: "Preferred", value: "Tomorrow AM" },
      ],
    },
    leadCard: {
      heading: "Every Enquiry Becomes a Scheduled Consultation.",
      leadName: "Priya Shah",
      leadPhone: "+91 XXXXX XXXXX",
      fields: [
        { label: "Matter Type", value: "Property Dispute" },
        { label: "Preferred Time", value: "Tomorrow morning" },
        { label: "Urgency", value: "High" },
        { label: "Contact Method", value: "Phone consultation" },
        { label: "Status", value: "PRIORITY", isBadge: true },
        { label: "Next Step", value: "Consultation scheduled", isBadge: true },
      ],
      summary: "Call at 19:45. Client enquired about a property dispute matter. Described the situation as urgent. Requested a consultation for tomorrow morning. Intake logged — legal team to assign and confirm slot.",
    },
    benefitsHeading: "A Professional Intake Process, Fully Automated.",
    benefits: [
      { title: "24/7 Enquiry Availability", desc: "Capture prospective client calls at any hour — including evenings, weekends, and court days.", iconKey: "clock" },
      { title: "Faster Consultation Bookings", desc: "Every interested caller is moved toward a scheduled consultation without delays.", iconKey: "calendar" },
      { title: "Consistent Professional Tone", desc: "Every call is handled with the calm, authoritative tone appropriate for legal intake.", iconKey: "shield" },
      { title: "Structured Client Intake", desc: "Receive organised client information immediately after each call — ready for your legal team.", iconKey: "userlist" },
      { title: "No Missed Opportunities", desc: "Prospective clients who reach Bavio are captured and followed up — not lost to competitors.", iconKey: "smiley" },
    ],
    roiHeading: "A Structured Path From Enquiry to Client.",
    roiBefore: [
      { text: "Prospective client calls during a court hearing" },
      { text: "Phone goes unanswered — no intake captured" },
      { text: "Client contacts another firm and retains them" },
    ],
    roiAfter: [
      { text: "Prospective client calls at any time" },
      { text: "Bavio collects matter details and preferred timing" },
      { text: "Intake logged and legal team notified" },
      { text: "Consultation scheduled before the competitor is even called" },
    ],
    faqHeading: "Questions About Bavio for Legal Services.",
    faqs: [
      { question: "Does Bavio provide legal advice?", answer: "No. Bavio handles administrative intake only — collecting contact information, matter type, and scheduling preferences. All legal matters remain entirely with your qualified legal team." },
      { question: "Can Bavio handle sensitive client calls professionally?", answer: "Yes. Bavio is trained to handle calls calmly and professionally, ensuring prospective clients feel heard and respected from the very first interaction." },
      { question: "Can Bavio schedule consultation calls?", answer: "Yes. Bavio captures client availability and preferred consultation timing, which is immediately sent to your team for confirmation." },
      { question: "Can Bavio route urgent matters to the right team?", answer: "Yes. Based on the matter type and urgency indicated by the caller, Bavio can flag high-priority enquiries for immediate attention." },
      { question: "Can I use my existing firm number?", answer: "Yes. Set up conditional forwarding from your current number so Bavio answers calls when your team is unavailable or in court." },
      { question: "Can I customise the intake questions?", answer: "Yes. From your workspace settings you can configure the specific questions, matter types, and routing logic that Bavio uses during every intake call." },
    ],
    cta: {
      heading: "Never Let a Client Enquiry Go Unanswered.",
      supportingText: "Let Bavio handle intake and scheduling while your legal team focuses on delivering results.",
      primaryCtaText: "Get Started",
      secondaryCtaText: "Try the Demo",
    },
  },

  // ══════════════════════════════════════════════════════
  // FINANCE & BANKING
  // ══════════════════════════════════════════════════════
  finance: {
    hero: {
      eyebrow: "AI VOICE AGENT FOR FINANCE",
      headline: "Handle More Customer Calls. Automatically.",
      supportingCopy: "Bavio handles routine customer enquiries, captures request details, and routes callers to the appropriate team — so your specialists focus on the conversations that matter most.",
      primaryCtaText: "Get Started",
      secondaryCtaText: "Hear the AI in Action",
      visualData: {
        callerInput: "I want to know more about your business loan options.",
        bavioReply1: "I can help with the initial enquiry. What type of business do you run?",
        callerInput2: "I own a retail store in Hyderabad.",
        bavioReply2: "Got it. I'll capture your details and arrange a follow-up.",
        leadTitle: "New Customer Enquiry",
        leadFields: [
          { label: "Customer", value: "Vikram Patel" },
          { label: "Request", value: "Business Loan" },
          { label: "Business", value: "Retail" },
          { label: "Location", value: "Hyderabad" },
          { label: "Follow-up", value: "Requested", isBadge: true },
          { label: "Status", value: "Qualified", isBadge: true },
        ],
      },
    },
    problem: {
      heading: "High Call Volume Shouldn't Mean Slow Service.",
      problemSummary: "Financial services firms handle large volumes of routine customer calls — product enquiries, account questions, and follow-up requests. When every call requires a specialist, wait times grow. Bavio handles the first layer — capturing, qualifying, and routing — so your team responds only where they are needed most.",
      cards: [
        { title: "HIGH CALL VOLUMES", desc: "Teams spend hours on routine enquiries that could be captured and routed automatically.", iconKey: "missed" },
        { title: "SLOW FOLLOW-UP", desc: "Prospective customers who enquire about products expect a fast, structured response.", iconKey: "slow" },
        { title: "UNROUTED CALLS", desc: "Callers reach the wrong team, causing frustration and delays before a resolution is found.", iconKey: "unqualified" },
        { title: "AFTER-HOURS ENQUIRIES", desc: "Customers researching financial products often call outside of standard banking hours.", iconKey: "lost" },
      ],
    },
    workflowHeading: "From Customer Call to the Right Specialist.",
    workflowSteps: [
      { number: "01", title: "ANSWER", desc: "Bavio answers every customer call instantly — no hold music, no waiting.", iconKey: "answer" },
      { number: "02", title: "UNDERSTAND", desc: "It captures the product type, customer profile, and the nature of the enquiry.", iconKey: "understand" },
      { number: "03", title: "ROUTE", desc: "The call is routed to the correct team or a follow-up is logged for the right specialist.", iconKey: "qualify" },
      { number: "04", title: "FOLLOW UP", desc: "A structured enquiry summary is sent to your team for fast, informed callback.", iconKey: "follow" },
    ],
    conversation: {
      heading: "Structured, Secure, and Always Responsive.",
      sectionTitle: "Customer Enquiry Context",
      useCases: [
        { title: "PRODUCT ENQUIRIES", quote: "I'd like to know the current interest rate on your fixed deposit." },
        { title: "LOAN QUERIES", quote: "What documents do I need to apply for a personal loan?" },
        { title: "ACCOUNT QUESTIONS", quote: "I want to know the process for opening a business current account." },
        { title: "SPECIALIST ROUTING", quote: "I need to speak with your wealth management team." },
      ],
      dialog: [
        { sender: "caller", text: "Hi, I want to enquire about a business loan." },
        { sender: "bavio", text: "Of course. What type of business do you operate?" },
        { sender: "caller", text: "I run a retail shop in Hyderabad." },
        { sender: "bavio", text: "Understood. Are you looking for a working capital loan or a term loan?" },
        { sender: "caller", text: "Working capital." },
        { sender: "bavio", text: "I'll capture your details and arrange a follow-up with our team." },
        { sender: "caller", text: "That works for me." },
      ],
      summaryFields: [
        { label: "Customer", value: "Vikram Patel" },
        { label: "Product", value: "Working Capital Loan" },
        { label: "Business", value: "Retail" },
        { label: "Location", value: "Hyderabad" },
      ],
    },
    leadCard: {
      heading: "Every Enquiry Routed to the Right Team.",
      leadName: "Vikram Patel",
      leadPhone: "+91 XXXXX XXXXX",
      fields: [
        { label: "Product Interest", value: "Working Capital Loan" },
        { label: "Business Type", value: "Retail" },
        { label: "Location", value: "Hyderabad" },
        { label: "Preferred Contact", value: "Phone callback" },
        { label: "Qualification", value: "HIGH INTENT", isBadge: true },
        { label: "Status", value: "Follow-up arranged", isBadge: true },
      ],
      summary: "Call at 16:22. Customer enquired about working capital loan options for a retail business in Hyderabad. No specific loan amount discussed. High intent indicated. Routed to business loans team for structured follow-up.",
    },
    benefitsHeading: "Serve More Customers Without Scaling Your Team.",
    benefits: [
      { title: "24/7 Enquiry Handling", desc: "Capture customer calls at any hour, including evenings and weekends when product research peaks.", iconKey: "clock" },
      { title: "Accurate Call Routing", desc: "Get every customer to the right specialist without hold queues or misdirected transfers.", iconKey: "calendar" },
      { title: "Faster Response Times", desc: "Prospective customers receive an immediate acknowledgement and structured follow-up.", iconKey: "shield" },
      { title: "Structured Enquiry Data", desc: "Your team receives complete, organised customer information before every callback.", iconKey: "userlist" },
      { title: "Consistent Brand Experience", desc: "Every customer is greeted professionally and handled with the care your brand demands.", iconKey: "smiley" },
    ],
    roiHeading: "From Enquiry to Expert in One Flow.",
    roiBefore: [
      { text: "Customer calls to enquire about a loan product" },
      { text: "Team is occupied — customer placed on hold or missed" },
      { text: "Customer researches and approaches a competitor" },
    ],
    roiAfter: [
      { text: "Customer calls at any time" },
      { text: "Bavio captures product interest and business profile" },
      { text: "Enquiry routed to the correct specialist" },
      { text: "Structured follow-up completed — customer converted" },
    ],
    faqHeading: "Questions About Bavio for Finance.",
    faqs: [
      { question: "Does Bavio provide financial advice?", answer: "No. Bavio handles enquiry intake and routing only. It does not approve loans, assess eligibility, or offer financial recommendations. All decisions remain with your qualified financial team." },
      { question: "Can Bavio handle high call volumes during peak periods?", answer: "Yes. Bavio runs on concurrent cloud telephony infrastructure and handles unlimited simultaneous calls without any busy signals or wait times." },
      { question: "Can Bavio route callers to the right department?", answer: "Yes. Based on the product type and customer profile captured during the call, Bavio routes enquiries to the appropriate team or specialist." },
      { question: "Can I use Bavio for both retail and business banking enquiries?", answer: "Yes. Bavio can be configured with multiple product categories, business types, and routing paths to support all of your customer segments." },
      { question: "Can I customise the intake questions?", answer: "Yes. From your workspace you can edit the questions, product categories, and routing logic Bavio follows on every customer call." },
      { question: "Can Bavio work with my existing contact number?", answer: "Yes. Set up call forwarding from your current number so Bavio handles calls whenever your team is unavailable or at capacity." },
    ],
    cta: {
      heading: "Respond to Every Customer Enquiry. Instantly.",
      supportingText: "Let Bavio handle the first layer so your specialists can focus on conversion.",
      primaryCtaText: "Get Started",
      secondaryCtaText: "Try the Demo",
    },
  },

  // ══════════════════════════════════════════════════════
  // E-COMMERCE
  // ══════════════════════════════════════════════════════
  ecommerce: {
    hero: {
      eyebrow: "AI VOICE AGENT FOR E-COMMERCE",
      headline: "Your Customers Shouldn't Have to Wait.",
      supportingCopy: "Bavio answers customer calls, handles routine product and order enquiries, captures support requests, and routes complex issues to your team — at any scale.",
      primaryCtaText: "Get Started",
      secondaryCtaText: "Hear the AI in Action",
      visualData: {
        callerInput: "Hi, I want to know where my order is.",
        bavioReply1: "I can help with that. Can you share your order number?",
        callerInput2: "It's BV10482.",
        bavioReply2: "Thanks. I'll help with your order enquiry right away.",
        leadTitle: "Customer Support Request",
        leadFields: [
          { label: "Customer", value: "Neha Singh" },
          { label: "Order", value: "BV10482" },
          { label: "Request", value: "Order Status" },
          { label: "Channel", value: "Phone" },
          { label: "Priority", value: "Normal", isBadge: true },
          { label: "Status", value: "Request logged", isBadge: true },
        ],
      },
    },
    problem: {
      heading: "Support Backlogs Cost You Customers.",
      problemSummary: "As order volumes grow, so does support call volume. Customers calling about orders, deliveries, and returns expect an immediate response. When your team is overwhelmed, customers lose trust and move on. Bavio handles the volume — so your team handles the exceptions.",
      cards: [
        { title: "HIGH SUPPORT VOLUME", desc: "Order enquiries, return requests, and product questions flood in simultaneously.", iconKey: "missed" },
        { title: "LONG WAIT TIMES", desc: "Customers placed on hold or waiting for callbacks feel underserved and frustrated.", iconKey: "slow" },
        { title: "REPETITIVE ENQUIRIES", desc: "The same questions about delivery status, returns policy, and availability repeat endlessly.", iconKey: "unqualified" },
        { title: "AFTER-HOURS SUPPORT", desc: "Customers shop and face issues at all hours — not just during your support team's working day.", iconKey: "lost" },
      ],
    },
    workflowHeading: "From Customer Call to Resolved Request.",
    workflowSteps: [
      { number: "01", title: "ANSWER", desc: "Bavio answers every customer support call instantly — no hold music, no queues.", iconKey: "answer" },
      { number: "02", title: "IDENTIFY", desc: "It collects the order number, issue type, and customer details within the first 30 seconds.", iconKey: "understand" },
      { number: "03", title: "LOG", desc: "Routine enquiries are captured and logged immediately. Complex issues are escalated.", iconKey: "qualify" },
      { number: "04", title: "RESOLVE", desc: "Your support team receives a structured ticket and can follow up with full context.", iconKey: "follow" },
    ],
    conversation: {
      heading: "Fast, Friendly, and Ready for Any Order.",
      sectionTitle: "Support Request Context",
      useCases: [
        { title: "ORDER TRACKING", quote: "My order was supposed to arrive yesterday — where is it?" },
        { title: "RETURNS & REFUNDS", quote: "I want to return an item I ordered last week." },
        { title: "PRODUCT QUESTIONS", quote: "Does the blue variant come in size large?" },
        { title: "DELIVERY ISSUES", quote: "The courier left my package with the wrong neighbour." },
      ],
      dialog: [
        { sender: "caller", text: "Hi, I haven't received my order yet." },
        { sender: "bavio", text: "I understand. Can you share your order number?" },
        { sender: "caller", text: "It's BV10482." },
        { sender: "bavio", text: "Thank you. Is this about a delivery delay or a missing item?" },
        { sender: "caller", text: "Delivery delay — it was supposed to come three days ago." },
        { sender: "bavio", text: "I'll log this as a priority support request right away." },
        { sender: "caller", text: "Please, I need it urgently." },
      ],
      summaryFields: [
        { label: "Order", value: "BV10482" },
        { label: "Issue", value: "Delivery delay" },
        { label: "Expected", value: "3 days ago" },
        { label: "Priority", value: "High" },
      ],
    },
    leadCard: {
      heading: "Every Support Call Becomes a Structured Ticket.",
      leadName: "Neha Singh",
      leadPhone: "+91 XXXXX XXXXX",
      fields: [
        { label: "Order Number", value: "BV10482" },
        { label: "Issue Type", value: "Delivery Delay" },
        { label: "Expected Delivery", value: "3 days overdue" },
        { label: "Customer Urgency", value: "High" },
        { label: "Priority", value: "HIGH", isBadge: true },
        { label: "Status", value: "Escalation pending", isBadge: true },
      ],
      summary: "Call at 21:15. Customer reported a delivery delay for order BV10482, expected 3 days ago. High urgency stated. Support ticket created — team to investigate with courier and update customer within 2 hours.",
    },
    benefitsHeading: "Scale Your Support Without Scaling Your Team.",
    benefits: [
      { title: "24/7 Customer Call Handling", desc: "Answer order and delivery queries at any time — including nights, weekends, and sale peaks.", iconKey: "clock" },
      { title: "No More Hold Queues", desc: "Every customer reaches an instant response — dramatically improving first-contact satisfaction.", iconKey: "calendar" },
      { title: "Fewer Repetitive Tickets", desc: "Routine queries are handled automatically, freeing your team for complex resolutions.", iconKey: "shield" },
      { title: "Structured Support Tickets", desc: "Every call produces a clean, organised support ticket with full context for your team.", iconKey: "userlist" },
      { title: "Better Customer Retention", desc: "Customers who feel heard and served quickly are far more likely to purchase again.", iconKey: "smiley" },
    ],
    roiHeading: "From Customer Frustration to Fast Resolution.",
    roiBefore: [
      { text: "Customer calls about a delayed order at 9 PM" },
      { text: "Support team offline — call goes to voicemail" },
      { text: "Customer leaves a negative review and requests a refund" },
    ],
    roiAfter: [
      { text: "Customer calls at any time" },
      { text: "Bavio captures order details and issue type instantly" },
      { text: "Priority support ticket created and team alerted" },
      { text: "Customer updated quickly — loyalty preserved" },
    ],
    faqHeading: "Questions About Bavio for E-commerce.",
    faqs: [
      { question: "Can Bavio handle a high volume of support calls during sale events?", answer: "Yes. Bavio runs on concurrent cloud infrastructure and handles unlimited simultaneous calls — so a spike in order enquiries during a sale never results in hold queues." },
      { question: "Can Bavio answer questions about order status or delivery?", answer: "Yes. You can configure Bavio to collect order numbers and log enquiries, which your team can resolve with full context using your logistics systems." },
      { question: "Can Bavio handle return and refund requests?", answer: "Yes. Bavio can collect the customer's details, order number, and reason for the return, generating a structured ticket for your support team to process." },
      { question: "Can Bavio answer product questions?", answer: "Yes. Bavio can be trained with your product catalogue, specifications, and availability information to accurately answer common product queries." },
      { question: "Can I use my existing customer support number?", answer: "Yes. Set up call forwarding from your current support number to Bavio — it handles calls when your team is offline or at capacity." },
      { question: "Can I customise how Bavio handles different types of queries?", answer: "Yes. From your workspace you can configure issue categories, escalation rules, and routing logic to match your specific support workflow." },
    ],
    cta: {
      heading: "Answer Every Customer Call. At Any Scale.",
      supportingText: "Let Bavio handle the support volume so your team focuses on turning issues into loyalty.",
      primaryCtaText: "Get Started",
      secondaryCtaText: "Try the Demo",
    },
  },
};

// ─────────────────────────────────────────────────────────────
// REAL ESTATE DATA (unchanged, kept here for reference)
// ─────────────────────────────────────────────────────────────
const realEstateConfig: IndustryConfig = {
  hero: {
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
        { label: "Status", value: "Qualified", isBadge: true },
      ],
    },
  },
  problem: {
    heading: "Every Missed Call Could Be Your Next Deal.",
    problemSummary: "Real estate agents are constantly showing properties, driving between sites, in client meetings, or signing agreements. In the background, customer calls keep coming. Bavio ensures none of those calls go unanswered.",
    cards: [
      { title: "MISSED ENQUIRIES", desc: "Potential buyers call when agents are unavailable or out in the field.", iconKey: "missed" },
      { title: "UNQUALIFIED LEADS", desc: "Agents waste hours calling back prospects without knowing their budget or criteria.", iconKey: "unqualified" },
      { title: "SLOW FOLLOW-UP", desc: "Hot prospects move on to other property listings when they don't get a fast response.", iconKey: "slow" },
      { title: "LOST SITE VISITS", desc: "Highly interested callers fail to schedule appointments and fall out of the funnel.", iconKey: "lost" },
    ],
  },
  workflowHeading: "From Call to Qualified Lead.",
  workflowSteps: [
    { number: "01", title: "ANSWER", desc: "Bavio answers every incoming property enquiry instantly, 24/7.", iconKey: "answer" },
    { number: "02", title: "UNDERSTAND", desc: "It captures details on configuration, area, budget, timeline, and site visit preferences.", iconKey: "understand" },
    { number: "03", title: "QUALIFY", desc: "It identifies high-intent buyers, isolates unqualified prospects, and logs key details.", iconKey: "qualify" },
    { number: "04", title: "FOLLOW UP", desc: "Leads appear immediately in your dashboard and trigger instant alerts to your sales team.", iconKey: "follow" },
  ],
  conversation: {
    heading: "It Sounds Like Your Best Agent.",
    sectionTitle: "Conversational Context",
    useCases: [
      { title: "PROPERTY ENQUIRIES", quote: "Is the Gachibowli 3 BHK project still available for visits?" },
      { title: "BUDGET QUALIFICATION", quote: "I'm looking for a premium property within ₹1.5 crore." },
      { title: "LOCATION DETAILS", quote: "Do you have any listings near Financial District?" },
      { title: "SITE VISITS", quote: "Can we schedule a site walkthrough for tomorrow morning?" },
    ],
    dialog: [
      { sender: "caller", text: "Hi, I'm looking for a 3 BHK in Hyderabad." },
      { sender: "bavio", text: "Absolutely. Which area are you considering?" },
      { sender: "caller", text: "Gachibowli or Kondapur." },
      { sender: "bavio", text: "What's your approximate budget?" },
      { sender: "caller", text: "Between ₹70 and ₹90 lakh." },
      { sender: "bavio", text: "Got it. Would you like me to arrange a site visit?" },
      { sender: "caller", text: "Yes, Saturday afternoon." },
    ],
    summaryFields: [
      { label: "Type", value: "3 BHK" },
      { label: "Location", value: "Gachibowli / Kondapur" },
      { label: "Budget", value: "₹70–90 Lakh" },
      { label: "Visit", value: "Saturday afternoon" },
    ],
  },
  leadCard: {
    heading: "Every Conversation Becomes a Lead.",
    leadName: "Rahul Sharma",
    leadPhone: "+91 XXXXX XXXXX",
    fields: [
      { label: "Property Interest", value: "3 BHK Apartment" },
      { label: "Location", value: "Gachibowli" },
      { label: "Budget", value: "₹70–90 Lakh" },
      { label: "Timeline", value: "This Week" },
      { label: "Intent", value: "HIGH INTENT", isBadge: true },
      { label: "Status", value: "Site visit requested", isBadge: true },
    ],
    summary: "Call connected at 14:02. Customer is actively looking for a 3 BHK unit in Gachibowli under 90L. Highly interested in scheduling a site walkthrough on Saturday afternoon. Recommended follow-up.",
  },
  benefitsHeading: "Give Your Team More Time to Close.",
  benefits: [
    { title: "24/7 Call Answering", desc: "Never let late-night property enquiries or busy weekend calls go unanswered.", iconKey: "clock" },
    { title: "Automatic Lead Qualification", desc: "Screen buyer budgets, configurations, and locations before calling back.", iconKey: "shield" },
    { title: "Instant Lead Information", desc: "Receive structured lead cards via WhatsApp as soon as the call hangs up.", iconKey: "userlist" },
    { title: "More Site Visits", desc: "Guide hot prospects to schedule walkthroughs automatically while interest is high.", iconKey: "calendar" },
    { title: "Consistent Experience", desc: "Ensure every potential property buyer is greeted professionally in Hindi, English, or Hinglish.", iconKey: "smiley" },
  ],
  roiHeading: "A Direct Path to Bookings.",
  roiBefore: [
    { text: "Buyer dials property agency" },
    { text: "Agent is busy showing a site; call is missed" },
    { text: "Buyer leaves no voicemail and moves to next listing" },
  ],
  roiAfter: [
    { text: "Buyer dials property agency" },
    { text: "Bavio answers in under 500ms, qualifying intent" },
    { text: "Lead card logged: 3 BHK, Gachibowli, ₹80L" },
    { text: "Agent receives instant details & schedules site visit" },
  ],
  faqHeading: "Questions Worth Asking.",
  faqs: [
    { question: "Can Bavio answer property enquiries after office hours?", answer: "Yes. Bavio operates 24/7 in the cloud. It greets late-night property buyers, captures their criteria, and schedules site visits even when your agents are asleep." },
    { question: "Can Bavio qualify buyers by budget and location?", answer: "Absolutely. Bavio engages callers in a natural conversation to extract their budget parameters, preferred configurations (e.g. 2 BHK / 3 BHK), and preferred locations." },
    { question: "Can Bavio book site visits?", answer: "Yes. It can check slot availability and schedule site walkthroughs, updating your CRM or calendar dynamically." },
    { question: "Can Bavio handle multiple calls?", answer: "Bavio is built on highly concurrent cloud telephony servers and can handle hundreds of customer calls simultaneously, eliminating busy tones." },
    { question: "Can I customize what the AI asks buyers?", answer: "Yes, you can edit the voice agent prompt in your workspace settings to customize the criteria, questions, and qualification thresholds." },
    { question: "Can Bavio send lead information to my team?", answer: "Yes. Once the call finishes, Bavio sends a structured lead summary card directly to your dashboard and via instant WhatsApp alerts." },
    { question: "Can I use my existing business number?", answer: "Yes. You can simply set up conditional call forwarding (e.g., forward when busy or unanswered) from your current mobile or landline to your dedicated Bavio number." },
  ],
  cta: {
    heading: "Turn More Calls Into Property Opportunities.",
    supportingText: "Let Bavio handle the calls while your team focuses on closing deals.",
    primaryCtaText: "Get Started",
    secondaryCtaText: "Try the Demo",
  },
};

// ─────────────────────────────────────────────────────────────
// PAGE COMPONENT
// ─────────────────────────────────────────────────────────────
export default function IndustryPage({
  params,
}: {
  params: Promise<{ industry: string }>;
}) {
  const resolvedParams = use(params);
  const { industry } = resolvedParams;

  // Resolve config: real-estate uses its own config object, others use the map
  const config: IndustryConfig | null =
    industry === "real-estate"
      ? realEstateConfig
      : industryData[industry] ?? null;

  // If no matching industry, show a minimal 404-style message
  if (!config) {
    return (
      <div className="min-h-screen bg-[#FFFDF8] flex flex-col">
        <Navbar />
        <main className="flex-grow flex items-center justify-center text-center px-6 py-24">
          <div>
            <p className="text-xs font-mono font-bold uppercase tracking-widest text-[#FF6B00] mb-4">
              Industry Not Found
            </p>
            <h1 className="font-display text-4xl font-extrabold text-[#140A02] mb-4">
              Page Not Available
            </h1>
            <p className="text-[#6B5A4C] max-w-sm mx-auto">
              This industry page does not exist. Please select an industry from the navigation menu.
            </p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="theme-bavio-light min-h-screen bg-[#FFFDF8] text-[#140A02] font-sans antialiased relative overflow-hidden noise-overlay flex flex-col w-full">
      <Navbar />

      <main className="flex-grow w-full">
        <IndustryHero
          eyebrow={config.hero.eyebrow}
          headline={config.hero.headline}
          supportingCopy={config.hero.supportingCopy}
          primaryCtaText={config.hero.primaryCtaText}
          secondaryCtaText={config.hero.secondaryCtaText}
          visualData={config.hero.visualData}
        />

        <IndustryProblem
          heading={config.problem.heading}
          problemSummary={config.problem.problemSummary}
          cards={config.problem.cards}
        />

        <IndustryWorkflow
          heading={config.workflowHeading}
          steps={config.workflowSteps}
        />

        <IndustryConversation
          heading={config.conversation.heading}
          sectionTitle={config.conversation.sectionTitle}
          useCases={config.conversation.useCases}
          dialog={config.conversation.dialog}
          summaryFields={config.conversation.summaryFields}
        />

        <IndustryLeadCard
          heading={config.leadCard.heading}
          leadName={config.leadCard.leadName}
          leadPhone={config.leadCard.leadPhone}
          fields={config.leadCard.fields}
          summary={config.leadCard.summary}
        />

        <IndustryBenefits
          heading={config.benefitsHeading}
          benefits={config.benefits}
        />

        <IndustryROI
          heading={config.roiHeading}
          beforeSteps={config.roiBefore}
          afterSteps={config.roiAfter}
        />

        <IndustryFAQ
          heading={config.faqHeading}
          faqs={config.faqs}
        />

        <IndustryCTA
          heading={config.cta.heading}
          supportingText={config.cta.supportingText}
          primaryCtaText={config.cta.primaryCtaText}
          secondaryCtaText={config.cta.secondaryCtaText}
        />
      </main>

      <Footer />
    </div>
  );
}
