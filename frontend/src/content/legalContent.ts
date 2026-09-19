export type LegalSection = {
  id: string;
  title: string;
  paragraphs?: string[];
  bullets?: string[];
  callout?: { label: string; text: string };
};

export type LegalDocument = {
  slug: string;
  title: string;
  eyebrow: string;
  description: string;
  updated: string;
  sections: LegalSection[];
};

const draftDate = "[EFFECTIVE_DATE]";
const review = "This document is a draft for founder and legal review. It is not legal advice and does not create a commitment until approved and published.";

const section = (id: string, title: string, paragraphs: string[] = [], bullets: string[] = [], callout?: LegalSection["callout"]): LegalSection => ({ id, title, paragraphs, bullets, callout });

export const legalDocuments: Record<string, LegalDocument> = {
  terms: {
    slug: "terms", title: "Terms of Service", eyebrow: "Core policy", description: "The contractual framework for Bavio workspaces, voice services, AI features, actions, and workflows.", updated: draftDate,
    sections: [
      section("agreement", "1. Agreement and scope", [review, "These Terms govern access to Bavio’s dashboard, APIs, voice-agent services, Phone Numbers, Conversations, Leads, Actions, Workflows, Knowledge, and platform features. The contracting entity is [LEGAL_ENTITY_NAME]. By using a Workspace, an authorized representative accepts these Terms for the customer."], [], { label: "Review status", text: "Entity name, registered address, effective date, governing law, and dispute process remain unresolved placeholders." }),
      section("definitions", "2. Definitions", ["“Workspace” means the customer environment and its users, configuration, data, and resources. “Customer Content” means information supplied to or generated for the customer through configured use. “Agent” means a configured voice or language experience. “Action” and “Workflow” mean customer-configured execution paths that may affect external systems." ]),
      section("eligibility", "3. Eligibility and authority", ["The customer must be legally able to enter a contract and must have authority to administer the Workspace. The customer is responsible for age, sector, geography, and authorization requirements that apply to its use." ]),
      section("account", "4. Account registration and security", ["Registration information must be accurate and kept current. The customer controls users, credentials, API keys, Phone Numbers, Agent instructions, Knowledge, webhook destinations, Actions, and Workflows. Report suspected unauthorized access promptly and do not expose service-role keys or secrets in client code." ]),
      section("services", "5. Services and changes", ["Bavio provides the features that are enabled for a Workspace. Features may depend on third-party infrastructure, provider availability, configuration, plan, or geography. Bavio may change or discontinue a feature subject to applicable notice obligations; no unlisted availability commitment is made." ]),
      section("voice", "6. Voice, telephony, and numbers", ["Customers are responsible for lawful calling, number ownership, caller identification, opt-outs, DND/DNC requirements, geographic restrictions, and provider rules. Phone Number availability, porting, reassignment, fees, emergency calling, and continued provider access are not guaranteed by these Terms." ]),
      section("recording", "7. Recording, transcription, and caller notice", ["Recording and transcription depend on the configured provider path and customer settings. Customers must determine whether notice or consent is required, identify AI use where required, and implement opt-out and retention behavior. Bavio does not make a recording lawful in every jurisdiction." ]),
      section("content", "8. Customer Content and Knowledge", ["The customer retains responsibility for the content, rights, permissions, instructions, recordings, transcripts, Knowledge, and caller information it supplies or makes available. The customer grants the limited rights needed to host, process, secure, and deliver configured services." ]),
      section("ai", "9. AI processing and output", ["AI output can be inaccurate, incomplete, stale, or unsuitable for a decision. Customers must review high-risk use, provide human oversight where appropriate, and not represent an AI output as verified merely because a technical request succeeded. Bavio is not a provider of legal, medical, financial, or emergency advice." ]),
      section("actions", "10. Actions and Workflows", ["Actions and Workflows can create external effects, including Lead records and webhook requests. Customers must review configuration, permissions, payloads, destinations, and human approval requirements before enabling them. Execution evidence describes a technical attempt or result; it does not prove a business, legal, or factual outcome." ]),
      section("providers", "11. Third-party providers", ["Bavio may use infrastructure, AI, telephony, email, and payment providers identified in the draft Subprocessors list. Provider terms, locations, outages, rate limits, and policy restrictions may affect a feature. Customer-configured providers remain the customer’s responsibility." ]),
      section("acceptable-use", "12. Acceptable use", ["Use must comply with the Acceptable Use Policy, privacy and consumer-protection requirements, telecommunications rules, recording laws, and applicable sector restrictions." ]),
      section("billing", "13. Billing and taxes", ["Commercial terms are described in the Billing and Subscription Terms. Final plan prices, interval, included usage, top-ups, overages, taxes, credits, processor, failed-payment handling, and proration remain [FOUNDER POLICY DECISION REQUIRED] unless shown in an approved order or checkout." ]),
      section("suspension", "14. Suspension and termination", ["Bavio may restrict or suspend access for security risk, provider restrictions, unlawful or abusive use, non-payment, or breach, subject to applicable law and any required notice. The customer may cancel only under the approved commercial policy. Suspension does not remove obligations to callers, providers, or regulators." ]),
      section("data-after", "15. Data after termination", ["Retention, export, deletion, backup handling, and provider copies vary by data type and configuration. The repository does not establish a single complete deletion schedule or instant purge for every entity. See the Privacy Policy, Data Retention note, and DPA draft." ]),
      section("ip", "16. Intellectual property and feedback", ["Bavio owns its service, software, documentation, and marks. The customer owns or controls its Customer Content and retains rights in pre-existing material. Feedback may be used to improve the service without transferring Customer Content ownership." ]),
      section("confidentiality", "17. Confidentiality", ["Each party should protect non-public information received from the other party and use it only for the relationship. Counsel must finalize exclusions, compelled disclosure, security obligations, and remedies." ]),
      section("disclaimers", "18. Disclaimers", ["To the extent permitted by law, the service is provided without a promise that it will be uninterrupted, error-free, accurate, lawful for every use, or suitable for a particular decision. AI, carrier, network, provider, and callback failures may occur." ]),
      section("liability", "19. Liability and indemnity", ["Liability caps, exclusions, customer indemnity, consequential damages, and exceptions require counsel-approved language: [LIABILITY_TERMS] and [INDEMNITY_TERMS]." ]),
      section("changes", "20. Changes and communications", ["Bavio may update these Terms through the approved notice method [NOTICE_METHOD]. Continued use after an effective change is governed by the approved version, subject to applicable law." ]),
      section("contact", "21. Contact", ["Support: hello@bavio.in. Legal notices: [LEGAL_EMAIL]. Privacy requests: [PRIVACY_EMAIL]. Security reports: [SECURITY_EMAIL]. Registered address: [REGISTERED_ADDRESS]. Governing law and venue: [GOVERNING_LAW] / [DISPUTE_JURISDICTION]."]),
    ],
  },
  privacy: {
    slug: "privacy", title: "Privacy Policy", eyebrow: "Data and privacy", description: "How Bavio and its customers may handle account, caller, conversation, AI, and execution data.", updated: draftDate,
    sections: [
      section("scope", "1. Scope and roles", [review, "This draft covers Bavio account data and data relating to people who interact with a customer’s Agent. In many deployments, the customer decides why and how caller data is used while Bavio processes it to provide the service. The legal role can vary by deployment and jurisdiction." ]),
      section("account", "2. Account and Workspace data", ["Bavio may process names, email addresses, business profile information, onboarding state, subscription state, users, Agent settings, Knowledge, Phone Numbers, telephony configuration, and authentication metadata." ]),
      section("telephony", "3. Telephony and caller data", ["Configured telephony paths may expose caller numbers, provider call identifiers, call status, timestamps, duration, routing metadata, and audio or media references. Customers decide which calls they route and must provide required notices." ]),
      section("conversation", "4. Audio, recordings, transcripts, and insights", ["Conversation paths may store transcript structures, summaries, extracted fields, recordings or recording references, and processing state. The repository shows targeted TTS cleanup paths, but not one complete retention window for every category." ]),
      section("ai", "5. Agent instructions, Knowledge, and AI output", ["Prompts, Agent instructions, Knowledge context, model inputs, generated speech or text, structured extraction, and conversation insights may be processed by configured provider paths. AI output is not automatically verified or professional advice." ]),
      section("business", "6. Leads, Actions, Workflows, and webhooks", ["Bavio may process Lead fields, ActionExecution, ExecutionEvidence, WorkflowExecution, webhook configuration, delivery metadata, request status, and related audit information. A successful HTTP request does not prove the intended business result." ]),
      section("billing", "7. Billing and payment references", ["The audited code includes subscription, usage, processor event, and payment references. It does not establish that Bavio stores full payment-card numbers. Dodo is an observed billing path; final processor terms remain subject to confirmation." ]),
      section("technical", "8. Technical, security, and browser data", ["The runtime may generate request metadata, errors, operational logs, and security events. The frontend uses authentication/onboarding cookies, localStorage values for session and preferences, and sessionStorage for country context. No analytics or advertising vendor was established by this audit." ]),
      section("purpose", "9. How data is used", ["Data may be used to authenticate users, provide voice and dashboard features, persist Conversations, produce transcripts or structured understanding, execute configured Actions and Workflows, deliver webhooks, bill usage, prevent abuse, troubleshoot, and provide support." ]),
      section("sharing", "10. Providers and sharing", ["Depending on configuration, service paths may call Supabase, Twilio, Deepgram, ElevenLabs, Cerebras, Groq, OpenAI, Sarvam, Resend, and Dodo. The draft Subprocessors list identifies observed paths; activation, legal names, processing locations, and transfer mechanisms require confirmation." ]),
      section("retention", "11. Retention", ["Retention periods vary by data type, provider, customer configuration, and legal requirement and are being finalized before production launch. Do not treat UI removal as database, object storage, backup, provider-copy, or log deletion." ], [], { label: "Launch blocker", text: "[DATA_RETENTION_PERIOD] and category-specific deletion behavior require founder and legal approval." }),
      section("security", "12. Security", ["Observed controls include tenant checks, PostgreSQL RLS on selected tables, signed provider callbacks, encrypted webhook-secret storage, HTTPS validation, environment-based secrets, and idempotency in selected action/workflow paths. These statements are implementation observations, not certification claims." ]),
      section("rights", "13. Privacy requests", ["Depending on applicable law, a person may request access, correction, deletion, export, restriction, objection, or other rights. Contact [PRIVACY_EMAIL] and include enough information to verify identity. Customers may need to coordinate requests concerning their caller data." ]),
      section("deletion", "14. Deletion and account closure", ["The repository does not establish a complete self-service deletion flow for every database and storage entity. Sign-out or clearing browser storage does not delete server-side data. Bavio will apply approved request procedures subject to legal, security, provider, backup, and fraud-prevention constraints." ]),
      section("children", "15. Children and sensitive data", ["The service is intended for business use. Customers must not collect sensitive or regulated information unless their use is lawful, necessary, configured safely, and supported by an approved agreement. Age and sector rules require legal review." ]),
      section("international", "16. International processing", ["Providers may process data in locations determined by their service configuration. Primary hosting region and transfer mechanism are [PRIMARY_HOSTING_REGION] and [TRANSFER_MECHANISM] until confirmed." ]),
      section("changes", "17. Changes", ["This notice may change as product behavior, providers, or legal requirements change. The approved update date and notice method remain [EFFECTIVE_DATE] and [NOTICE_METHOD]." ]),
      section("contact", "18. Contact", ["Privacy contact: [PRIVACY_EMAIL]. Support: hello@bavio.in. Legal entity and address: [LEGAL_ENTITY_NAME], [REGISTERED_ADDRESS]."]),
    ],
  },
  "acceptable-use": {
    slug: "acceptable-use", title: "Acceptable Use Policy", eyebrow: "Core policy", description: "Rules for lawful, consent-aware, and non-abusive use of Bavio voice and automation features.", updated: draftDate,
    sections: [
      section("lawful", "1. Lawful and authorized use", [review, "Use Bavio only for lawful business activity and only with the authority to use the data, numbers, voices, content, and systems involved." ]),
      section("fraud", "2. Fraud and deception", ["Do not use Bavio for fraud, phishing, credential theft, malware, social engineering, fake support, false representations, or deceptive collection of personal information." ]),
      section("communications", "3. Spam and harassment", ["Do not send unlawful robocalls, spam, threats, harassment, stalking, or repeated communications after a valid opt-out. Honor DND/DNC and provider-specific restrictions." ]),
      section("identity", "4. Identity and voice", ["Do not impersonate a person or organization deceptively, clone a real person’s voice without authorization, spoof caller identity, or hide the automated nature of an interaction where disclosure is required." ]),
      section("privacy", "5. Privacy and surveillance", ["Do not conduct unlawful surveillance, scrape personal data without authorization, bypass consent, or use recordings and transcripts outside an approved purpose." ]),
      section("regulated", "6. Regulated and high-risk uses", ["Do not make unauthorized legal, medical, financial, insurance, employment, housing, or emergency-service decisions or representations. Use human review and sector counsel where required." ]),
      section("security", "7. Security and circumvention", ["Do not exploit, probe, bypass, reverse engineer, overload, or interfere with the service or provider controls; upload malware; or expose credentials or secrets." ]),
      section("external", "8. External systems", ["Do not configure Actions, Workflows, or webhooks to create unauthorized external effects, transfer data to an unapproved destination, or evade provider policy." ]),
      section("enforcement", "9. Enforcement", ["Bavio may investigate, limit, suspend, or terminate use where necessary for safety, security, provider compliance, legal obligations, or breach. Notice and appeal processes are [ENFORCEMENT_PROCESS]." ]),
      section("contact", "10. Reporting", ["Report abuse or security concerns to [SECURITY_EMAIL]. Customer support is hello@bavio.in."]),
    ],
  },
  billing: {
    slug: "billing", title: "Billing and Subscription Terms", eyebrow: "Commercial policy", description: "A fact-checked commercial framework that keeps undecided pricing and payment rules visible for approval.", updated: draftDate,
    sections: [
      section("scope", "1. Scope", [review, "The repository contains pricing and usage concepts, subscription state, minute accounting, top-up/overage references, and a Dodo billing webhook path. Final commercial terms must be approved before publication." ]),
      section("plans", "2. Plans and included usage", ["Plan names, prices, currency, billing interval, included minutes, feature entitlements, and geographic availability are shown only in an approved checkout or order. Unapproved values are [PLAN_PRICING] and [USAGE_POLICY]." ]),
      section("usage", "3. Usage measurement", ["Usage may depend on call lifecycle, provider events, duration, and application accounting. The customer should review the usage record and report a suspected error through the approved support channel." ]),
      section("topups", "4. Top-ups and overages", ["Whether top-ups exist, expire, roll over, or survive cancellation, and whether overage is charged, blocked, or prepaid, remains [TOP_UP_POLICY] and [OVERAGE_POLICY] until approved." ]),
      section("renewal", "5. Renewal and payment", ["Billing date, automatic renewal, failed-payment grace period, invoices, receipts, taxes, and payment processor are [RENEWAL_POLICY], [TAX_POLICY], and [PAYMENT_PROCESSOR_LEGAL_NAME]." ]),
      section("changes", "6. Upgrades, downgrades, and price changes", ["Proration, effective time, credits, promotional pricing, and notice for price changes are [PRORATION_POLICY] and [PRICE_CHANGE_POLICY]." ]),
      section("cancellation", "7. Cancellation", ["Cancellation method and effective time are [CANCELLATION_METHOD] and [CANCELLATION_EFFECTIVE_TIME]. Cancellation and refund eligibility are separate decisions." ]),
      section("refunds", "8. Refunds and chargebacks", ["Refund eligibility, service-failure requests, duplicate charges, statutory rights, and chargeback handling are described only after approval in the Refund and Cancellation Policy." ]),
      section("responsibility", "9. Customer responsibility", ["Customers remain responsible for authorized Workspace activity, configured usage, provider charges disclosed at checkout, taxes, and secure payment administration. Do not send full card numbers by email." ]),
      section("contact", "10. Contact", ["Commercial questions: hello@bavio.in. Payment and refund decisions: [SUPPORT_EMAIL]."]),
    ],
  },
  refund: {
    slug: "refund", title: "Refund and Cancellation Policy", eyebrow: "Commercial policy", description: "A review-ready refund framework that separates cancellation from refund eligibility.", updated: draftDate,
    sections: [
      section("scope", "1. Scope", [review, "This draft applies to subscription charges, usage charges, prepaid credits or minutes if offered, and payment corrections. It does not replace mandatory consumer rights." ]),
      section("charges", "2. Charges and usage", ["Subscription charges, usage charges, top-up treatment, taxes, and processor fees require approved commercial rules: [REFUND_POLICY], [CONSUMED_USAGE_RULE], and [TAX_POLICY]." ]),
      section("cancellation", "3. Cancellation", ["Cancellation method and when access changes are [CANCELLATION_METHOD] and [CANCELLATION_EFFECTIVE_TIME]. Cancellation does not automatically establish refund eligibility." ]),
      section("eligibility", "4. Refund eligibility", ["The final refund window, pro-rata treatment, unused-credit rule, service-failure review, duplicate-charge correction, promotional-credit rule, and statutory treatment are [REFUND_POLICY]." ]),
      section("chargebacks", "5. Chargebacks", ["Contact Bavio first where possible so a duplicate or incorrect charge can be investigated. Do not submit sensitive payment credentials by email. Fraud and chargeback handling remains subject to processor rules." ]),
      section("request", "6. How to request", ["Send the Workspace, payment reference, charge date, and a concise explanation to [SUPPORT_EMAIL]. Never include a full card number." ]),
      section("processing", "7. Processing and contact", ["Review timing, decision notice, tax treatment, and payment processor timing are [REFUND_REVIEW_PERIOD] and [PAYMENT_PROCESSOR_LEGAL_NAME]."]),
    ],
  },
  cookies: {
    slug: "cookies", title: "Cookie and Browser Storage Policy", eyebrow: "Data and privacy", description: "The browser storage and cookie behavior observed in the current frontend.", updated: draftDate,
    sections: [
      section("scope", "1. Scope", [review, "This draft describes browser storage observed in the repository. Browser behavior may change as authentication and analytics integrations evolve." ]),
      section("essential", "2. Essential cookies", ["The frontend references bavio_auth and bavio_onboarding_completed cookies for authentication and onboarding routing. Blocking them may interrupt routing or session behavior." ]),
      section("storage", "3. Local and session storage", ["localStorage is used for Bavio token/client/display state, authentication messages, and theme preference. sessionStorage is used for selected country context. Clearing storage can end a local browser session or remove preferences." ]),
      section("analytics", "4. Analytics and marketing", ["This audit did not establish Google Analytics, Meta Pixel, advertising cookies, or a consent-management vendor. Do not assume analytics or marketing cookies are active unless the implementation and notice are updated." ]),
      section("third-party", "5. Authentication providers", ["Supabase authentication client behavior may create additional session storage depending on the runtime configuration. Confirm production cookie names and attributes before publication." ]),
      section("choices", "6. Browser choices", ["Browser settings can block or clear cookies and storage. This does not delete server-side account, Conversation, Lead, billing, or provider data." ]),
      section("changes", "7. Changes", ["Cookie classification, consent requirements, retention, and names should be reviewed when authentication or analytics changes." ]),
      section("contact", "8. Contact", ["Privacy requests: [PRIVACY_EMAIL]. Support: hello@bavio.in."]),
    ],
  },
  ai: {
    slug: "ai", title: "AI and Automated Systems Disclosure", eyebrow: "Voice and AI", description: "What Bavio’s AI features can do, what they cannot prove, and where customers remain responsible.", updated: draftDate,
    sections: [
      section("systems", "1. AI systems", [review, "Bavio may use language, speech recognition, speech synthesis, extraction, summarization, and routing components depending on configuration. Provider availability and model behavior vary." ]),
      section("output", "2. Accuracy and limitations", ["AI output can be wrong, incomplete, stale, ambiguous, or biased. A generated answer, Lead, insight, or transcript is not automatically a fact or professional opinion." ]),
      section("disclosure", "3. Human and AI disclosure", ["Customers must disclose AI interaction where required and provide a human path where appropriate. Do not represent an Agent as a person or claim that a caller reached a human when that is not true." ]),
      section("actions", "4. Automated actions", ["Actions and Workflows can create external effects. Execution evidence can show a request was attempted or acknowledged; it does not establish that a business, legal, financial, or factual outcome occurred." ]),
      section("models", "5. Providers and data", ["Configured paths may use OpenAI, Cerebras, Groq, Sarvam, Deepgram, or ElevenLabs. The active provider, processing location, and retention terms depend on configuration and provider contracts." ]),
      section("high-risk", "6. High-risk uses", ["Do not use Bavio as the sole basis for emergency response, medical diagnosis, legal advice, financial advice, employment, housing, credit, insurance, or other high-impact decisions." ]),
      section("identity", "7. Voice and identity", ["Do not clone or imitate a real person’s voice without authorization, impersonate, spoof identity, or use generated speech for fraud or coercion." ]),
      section("responsibility", "8. Customer review", ["Customers are responsible for Agent instructions, Knowledge rights, caller notices, generated content review, escalation design, and the consequences of enabled automation." ]),
      section("contact", "9. Contact", ["AI and safety questions: [LEGAL_EMAIL]. Support: hello@bavio.in."]),
    ],
  },
  "call-recording": {
    slug: "call-recording", title: "Call Recording and Consent", eyebrow: "Voice and AI", description: "Practical guidance for recording, transcription, notice, consent, and customer-controlled retention decisions.", updated: draftDate,
    sections: [
      section("support", "1. What Bavio supports", [review, "The repository contains recording, media, transcript, and cleanup paths, but not one universal recording behavior for every provider or call. Recording may be enabled, disabled, temporary, or provider-controlled." ]),
      section("law", "2. Applicable law", ["Recording and transcription rules vary by jurisdiction and context. Some locations require notice or consent from one participant; others require notice or consent from all relevant participants. Customers must obtain advice for their calling footprint." ]),
      section("notice", "3. Notice and AI disclosure", ["Customers should announce recording or transcription where required, identify AI participation where required, and keep notice understandable and timely." ]),
      section("consent", "4. Consent and opt-out", ["Customers must implement the required consent, refusal, pause, opt-out, and human handoff behavior for their use. Bavio does not automatically make a call lawful." ]),
      section("providers", "5. Provider behavior", ["Twilio and other configured providers may determine media callbacks, recording objects, identifiers, and storage paths. Provider behavior and location must be confirmed for each deployment." ]),
      section("retention", "6. Retention and deletion", ["Retention varies by data type and configuration. The repository shows targeted TTS cleanup, not a universal recording deletion schedule. Distinguish database rows, storage objects, backups, logs, and provider copies." ]),
      section("access", "7. Access and security", ["Limit Workspace access, protect provider credentials, and review who can view recordings and transcripts. Observed tenant checks and selected RLS protections do not replace customer access governance." ]),
      section("sensitive", "8. Sensitive information", ["Avoid collecting information that is not needed. Configure prompts and handoffs to limit sensitive data and escalate uncertain or high-risk requests." ]),
      section("contact", "9. Contact", ["Privacy requests: [PRIVACY_EMAIL]. Legal review: [LEGAL_EMAIL]. Support: hello@bavio.in."]),
    ],
  },
  telecommunications: {
    slug: "telecommunications", title: "Telecommunications Terms", eyebrow: "Voice and AI", description: "Rules for lawful calling, numbers, provider restrictions, and emergency-service limitations.", updated: draftDate,
    sections: [
      section("lawful", "1. Lawful calling", [review, "Customers must use Phone Numbers and voice services only for authorized communications and comply with the laws, rules, and provider policies applicable to each destination." ]),
      section("consent", "2. Consent and opt-outs", ["Customers are responsible for outbound consent, DND/DNC obligations, frequency limits, opt-outs, caller notices, and suppression lists." ]),
      section("inbound", "3. Inbound calls", ["Inbound calls still require lawful data handling, truthful identification, recording notice where applicable, and safe escalation for urgent or sensitive requests." ]),
      section("automated", "4. Automated and synthetic calls", ["Disclose automation where required. Do not use synthetic voice, prerecorded messages, or automated outreach to evade consent or anti-spam rules." ]),
      section("identity", "5. Caller identification", ["Do not spoof caller ID, misrepresent ownership, use a number without authorization, or present a callback path that is not controlled by the customer." ]),
      section("numbers", "6. Provisioning and availability", ["Number availability, geographic coverage, porting, reassignment, regulatory documents, and provider access vary. Bavio does not promise availability everywhere or continued ownership of a number." ]),
      section("providers", "7. Carrier and provider restrictions", ["Provider policies, callbacks, network events, rate limits, and outages can affect calls, recordings, transcripts, Actions, Workflows, and webhooks." ]),
      section("emergency", "8. Emergency services", ["Emergency calling availability is not established by the repository and must not be assumed. Customers must provide a separate lawful emergency path." ]),
      section("enforcement", "9. Abuse and suspension", ["Bavio may restrict or suspend telecommunications use for abuse, unlawful traffic, provider action, security risk, or policy circumvention." ]),
      section("contact", "10. Contact", ["Telecommunications questions: [LEGAL_EMAIL]. Support: hello@bavio.in."]),
    ],
  },
  dpa: {
    slug: "dpa", title: "Data Processing Addendum", eyebrow: "Data and privacy", description: "A review-ready processor addendum template with processing, security, subprocessors, and deletion schedules.", updated: draftDate,
    sections: [
      section("definitions", "1. Definitions and roles", [review, "This template is intended for a customer that determines purposes and means for configured Customer Content and Bavio as a service provider or processor. The correct role depends on deployment and jurisdiction." ]),
      section("scope", "2. Scope and duration", ["Bavio processes account, Workspace, telephony, Conversation, transcript, recording-reference, AI, Lead, Action, Workflow, webhook, and billing-related data to provide the service during [PROCESSING_DURATION]." ]),
      section("instructions", "3. Documented instructions", ["Bavio processes Customer Content to provide configured services, maintain security, prevent abuse, troubleshoot, and comply with law. Additional instructions must be lawful, documented, and technically feasible." ]),
      section("confidentiality", "4. Confidentiality and personnel", ["Authorized personnel and subprocessors should be bound by confidentiality obligations and access controls appropriate to their role." ]),
      section("security", "5. Security measures", ["Observed controls include tenant checks, selected RLS, encrypted webhook-secret storage, signed provider callbacks, HTTPS validation, environment-based secrets, and selected idempotency. These are not certification claims." ]),
      section("subprocessors", "6. Subprocessors and transfers", ["Observed provider paths are listed in Subprocessors. Legal names, processing locations, transfer mechanisms, notice, and objection terms are [TRANSFER_MECHANISM] and [SUBPROCESSOR_TERMS]." ]),
      section("requests", "7. Data subject requests", ["Bavio will reasonably assist with access, correction, deletion, export, or restriction requests subject to the service, customer instructions, identity verification, and law. Customer coordination is required for caller data." ]),
      section("incidents", "8. Incidents and cooperation", ["Incident notification timing, assistance scope, audit evidence, and contact are [INCIDENT_NOTIFICATION_PERIOD], [AUDIT_TERMS], and [DPA_CONTACT]." ]),
      section("return", "9. Return and deletion", ["Return, deletion, backups, provider copies, and post-termination retention are [DELETION_AND_AUDIT_TERMS]. No universal automated deletion window is established by the repository." ]),
      section("schedules", "10. Schedules", ["Schedule A: processing details, categories, data subjects, purposes, and duration. Schedule B: security measures. Schedule C: approved subprocessors. Counsel must complete each schedule before signature." ]),
    ],
  },
  subprocessors: {
    slug: "subprocessors", title: "Subprocessors", eyebrow: "Data and privacy", description: "Provider paths observed in the repository, with activation and location caveats preserved.", updated: "2026-09-14",
    sections: [
      section("status", "1. Status and scope", [review, "A provider appearing in code or configuration is not proof that it is active in every deployment. Confirm contracts, legal names, processing locations, and data terms before publication." ]),
      section("core", "2. Core infrastructure", ["Supabase: PostgreSQL, authentication client, and Storage; account, Workspace, Conversation, transcript, recording/TTS where used, and execution data; region [PRIMARY_HOSTING_REGION]." ]),
      section("voice", "3. Voice and telephony", ["Twilio: telephony, Phone Numbers, callbacks, and media paths where configured. Deepgram: speech recognition path. ElevenLabs: speech synthesis path. Provider locations and active configuration require confirmation." ]),
      section("ai", "4. AI and model providers", ["Cerebras and Groq appear in LLM paths; OpenAI appears in current or configurable LLM/STT/TTS paths; Sarvam appears in optional Indic STT/LLM/TTS paths. Prompts, audio/text, Knowledge context, and generated output may be involved." ]),
      section("business", "5. Email and payments", ["Resend appears in email delivery paths. Dodo appears in billing webhook handling. Processing locations, retention, and contract terms require confirmation." ]),
      section("excluded", "6. Not established by this audit", ["AWS, Stripe, Razorpay, HubSpot, Capsule, Mailchimp, Discord, Zendesk, Help Scout, and Google Sheets are not listed as active subprocessors from this audit. Retired or optional code requires separate evidence." ]),
      section("contact", "7. Contact and updates", ["Subprocessor questions and notices: [LEGAL_EMAIL]. The approved notice period and update process are [SUBPROCESSOR_NOTICE]."]),
    ],
  },
  "api-terms": {
    slug: "api-terms", title: "API Terms", eyebrow: "Developer policy", description: "Rules for authenticating, securing, and operating against Bavio API surfaces.", updated: draftDate,
    sections: [
      section("access", "1. Authorized access", [review, "Use a supported session or API key for an authorized Workspace. Keep credentials secret, scope requests correctly, and never expose service-role keys in browser code." ]),
      section("content", "2. Requests and data", ["The customer is responsible for request input, imported data, Knowledge, Agent instructions, payloads, destinations, and external effects." ]),
      section("security", "3. Security and replay", ["Validate inputs, protect secrets, use HTTPS endpoints, implement replay protection where relevant, and verify signatures for provider or webhook messages." ]),
      section("limits", "4. Rate limits and availability", ["Public rate limits, fair-use thresholds, support response targets, and availability commitments are not yet published. Requests may fail due to authentication, validation, provider, network, or service conditions." ]),
      section("surface", "5. API surface", ["Observed V1 areas include Agents, Calls, Campaigns, Leads/Usage, Webhooks, API keys, Actions reads, and Workflows reads. Internal verification routes and private service calls are not API commitments." ]),
      section("webhooks", "6. Webhooks and external effects", ["Customers own endpoint behavior, secret handling, idempotency, response interpretation, and downstream effects. A successful HTTP response does not prove business completion." ]),
      section("changes", "7. Versioning and changes", ["Versioned routes should be used where available. Bavio may change API behavior subject to approved notice and compatibility policy [API_CHANGE_POLICY]." ]),
      section("use", "8. Acceptable use", ["API use must follow the Acceptable Use Policy, Terms of Service, provider requirements, and applicable law." ]),
      section("contact", "9. Contact", ["Developer support: hello@bavio.in. Security: [SECURITY_EMAIL]."]),
    ],
  },
  security: {
    slug: "security", title: "Security Overview", eyebrow: "Trust and security", description: "An implementation-grounded overview of controls observed in the Bavio repository, without certification or hosting claims.", updated: "2026-09-14",
    sections: [
      section("scope", "1. Scope and status", [review, "This overview describes controls observed in the current repository. It is not a certification, audit report, uptime commitment, or guarantee of security for every deployment." ]),
      section("isolation", "2. Tenant isolation", ["Tenant-aware services, authorization checks, and selected PostgreSQL RLS protections are used in platform paths. Customers must still configure Workspace users, provider access, Actions, Workflows, and webhook destinations carefully." ]),
      section("secrets", "3. Secrets and credentials", ["Environment-based secrets, signed provider callbacks, signed outbound webhooks, and encrypted webhook-secret storage are present in supported paths. Do not expose service-role keys or provider secrets in client code." ]),
      section("transport", "4. Transport and endpoints", ["Supported HTTPS integrations and endpoint validation are used where implemented. Provider and network behavior can vary; this page does not claim a universal TLS version or end-to-end encryption for every data path." ]),
      section("access", "5. Access and authentication", ["Authentication callbacks, session behavior, tenant checks, and route-level authorization are part of the observed application. Customers are responsible for user access, credential hygiene, and prompt reporting of unauthorized activity." ]),
      section("evidence", "6. Execution evidence", ["Action and Workflow evidence records technical execution state. It does not prove a business outcome, caller intent, legal basis, or correctness of AI interpretation." ]),
      section("providers", "7. Infrastructure and providers", ["Supabase, Twilio, configurable model/speech providers, email, and billing paths may process data depending on configuration. Hosting region, transfer mechanism, certifications, and provider contract terms require confirmation." ]),
      section("incidents", "8. Incidents and reporting", ["Report suspected security issues to [SECURITY_EMAIL]. Incident response, notification timing, recovery objectives, and support targets are [INCIDENT_NOTIFICATION_PERIOD], [RTO], [RPO], and [SUPPORT_POLICY]."]),
      section("review", "9. Security review", ["The current package intentionally does not claim ISO, SOC, HIPAA, GDPR certification, sovereign hosting, or a fixed uptime percentage. Those statements require independent evidence and approval." ]),
    ],
  },
};

export const legalIndexGroups = [
  { title: "Core", items: [["terms", "Terms of Service"], ["privacy", "Privacy Policy"], ["acceptable-use", "Acceptable Use Policy"]] },
  { title: "Voice and AI", items: [["ai", "AI and Automated Systems"], ["call-recording", "Call Recording and Consent"], ["telecommunications", "Telecommunications Terms"]] },
  { title: "Commercial", items: [["billing", "Billing and Subscription Terms"], ["refund", "Refund and Cancellation"]] },
  { title: "Data", items: [["cookies", "Cookie Policy"], ["dpa", "Data Processing Addendum"], ["subprocessors", "Subprocessors"]] },
  { title: "Developer", items: [["api-terms", "API Terms"]] },
] as const;
