export interface OperatorInstruction {
  name: string;
  code?: string; // USSD code prefix for dialing (e.g. '*21*')
  steps: string[];
  videoUrl?: string; // YouTube video embed ID
  portalUrl?: string; // Link to provider portal
  portalLabel?: string; // Label for portal link
  estimatedTimeMinutes: number;
  badge?: string; // Optional warning/info badge
}

export interface CountryInstructions {
  [operatorKey: string]: OperatorInstruction;
}

export const CALL_FORWARD_INSTRUCTIONS: Record<string, CountryInstructions> = {
  US: {
    Carrier: {
      name: "US Carrier Portal (AT&T, Verizon, T-Mobile)",
      steps: [
        "Log in to your carrier's online dashboard or business portal (e.g., My Verizon Business, myAT&T, or T-Mobile Account Manager).",
        "Navigate to 'Account Settings' -> 'Device Management' -> 'Call Settings' -> 'Call Forwarding'.",
        "Select 'Unconditional Call Forwarding' or 'Forward All Calls'.",
        "Input your assigned Bavio virtual number: {virtualNumber}.",
        "Save your settings and allow 1-2 minutes for carrier propagation.",
        "Verify setup by calling your carrier business number from an external phone line."
      ],
      videoUrl: "dQw4w9WgXcQ",
      portalUrl: "https://www.verizon.com/support/call-forwarding-faqs/",
      portalLabel: "Verizon Call Forwarding Setup Guide",
      estimatedTimeMinutes: 5
    },
    Twilio: {
      name: "Twilio / SIP Trunk Routing",
      steps: [
        "Log in to the Twilio Console (console.twilio.com) using your developer credentials.",
        "Navigate to 'Develop' -> 'Phone Numbers' -> 'Active Numbers'.",
        "Click on the phone number you want to forward calls from.",
        "Under the 'Voice & Fax' section, locate the 'A CALL COMES IN' webhook handler option.",
        "Choose 'SIP Trunk' or enter the Bavio SIP webhook destination URL.",
        "Click 'Save' at the bottom of the Twilio console page.",
        "Verify forwarding by making a test call."
      ],
      videoUrl: "dQw4w9WgXcQ",
      portalUrl: "https://console.twilio.com",
      portalLabel: "Open Twilio Console",
      estimatedTimeMinutes: 5
    }
  },
  CA: {
    Carrier: {
      name: "Canadian Carriers (Rogers, Bell, Telus)",
      steps: [
        "Log in to your carrier's customer account dashboard (Rogers MyAccount, Bell MyBell, Telus MyAccount).",
        "Go to 'Phone Settings' or 'Add-on Management' -> 'Call Forwarding / Call Divert'.",
        "Toggle call forwarding to active and input your Bavio virtual number: {virtualNumber}.",
        "Click save and confirm changes.",
        "Verify that calls to your Canadian number now flow to the Bavio AI agent."
      ],
      videoUrl: "dQw4w9WgXcQ",
      portalUrl: "https://www.rogers.com/support/mobility/call-forwarding-features",
      portalLabel: "Rogers Call Features Support",
      estimatedTimeMinutes: 5
    }
  },
  GB: {
    BT: {
      name: "BT (British Telecom)",
      steps: [
        "Log in to the BT Business Portal (business.bt.com).",
        "Navigate to 'Manage Services' -> 'Phone Lines' -> 'Calling Features'.",
        "Select 'Call Divert' / 'Call Forwarding' settings.",
        "Choose to divert 'All Calls' and enter the Bavio destination number: {virtualNumber}.",
        "Save settings. Changes usually take 5 to 10 minutes to propagate across British Telecom's network.",
        "Make a test call to confirm activation."
      ],
      videoUrl: "dQw4w9WgXcQ",
      portalUrl: "https://www.business.bt.com",
      portalLabel: "BT My Account Login",
      estimatedTimeMinutes: 8
    },
    Vodafone: {
      name: "Vodafone UK",
      steps: [
        "Log in to your My Vodafone UK online portal or mobile app.",
        "Navigate to 'Services' -> 'Calling Features' -> 'Divert Calls'.",
        "Activate forwarding and enter the target virtual number: {virtualNumber}.",
        "Save settings.",
        "Allow up to 10 minutes for your UK SIM card profiles to update."
      ],
      videoUrl: "dQw4w9WgXcQ",
      portalUrl: "https://www.vodafone.co.uk",
      portalLabel: "Vodafone UK Help",
      estimatedTimeMinutes: 6
    },
    O2: {
      name: "O2 UK",
      steps: [
        "Log in to My O2 Business or residential customer portal.",
        "Go to 'Account Overview' -> 'Divert Calls / Call Settings'.",
        "Enter your virtual number: {virtualNumber} and click Confirm.",
        "Wait for activation confirmation email or text alert (up to 10 minutes)."
      ],
      videoUrl: "dQw4w9WgXcQ",
      portalUrl: "https://www.o2.co.uk",
      portalLabel: "O2 UK Call Divert Support",
      estimatedTimeMinutes: 7
    }
  },
  AU: {
    Telstra: {
      name: "Telstra",
      steps: [
        "Log in to the My Telstra App or online portal (my.telstra.com.au).",
        "Go to your active phone service line settings.",
        "Under calling features, select 'Call Divert' / 'Call Forwarding'.",
        "Enter the designated Bavio virtual number: {virtualNumber}.",
        "Save and confirm.",
        "Please allow up to 10 minutes for the network routing change to complete."
      ],
      videoUrl: "dQw4w9WgXcQ",
      portalUrl: "https://www.telstra.com.au",
      portalLabel: "Telstra Portal Login",
      estimatedTimeMinutes: 10
    },
    Optus: {
      name: "Optus",
      steps: [
        "Log in to the My Optus app on your device.",
        "Select your active phone service and tap 'Settings' -> 'Call Forwarding'.",
        "Enter the destination virtual number: {virtualNumber}.",
        "Verify details and tap 'Activate'.",
        "Confirm call forwarding status updates on the dashboard."
      ],
      videoUrl: "dQw4w9WgXcQ",
      portalUrl: "https://www.optus.com.au",
      portalLabel: "Optus Support Guide",
      estimatedTimeMinutes: 8
    },
    Vodafone: {
      name: "Vodafone AU",
      steps: [
        "Log in to your My Vodafone Australia dashboard.",
        "Navigate to 'Plan & Services' -> 'Call Divert'.",
        "Select 'Divert All Incoming Calls' and enter: {virtualNumber}.",
        "Confirm and apply changes."
      ],
      videoUrl: "dQw4w9WgXcQ",
      portalUrl: "https://www.vodafone.com.au",
      portalLabel: "Vodafone AU Support",
      estimatedTimeMinutes: 5
    }
  },
  AE: {
    Etisalat: {
      name: "Etisalat",
      steps: [
        "Log in to the Etisalat Business Online portal.",
        "Navigate to your subscription line features and locate 'Call Forwarding'.",
        "Input the destination virtual number: {virtualNumber}.",
        "Important: Under UAE regulatory framework, forwarding requires your Etisalat profile to be linked to a valid Passport/Emirati ID. Ensure verification status is active.",
        "Click Activate and verify forwarding by initiating a test call."
      ],
      badge: "Regulatory verification (Passport/ID) required by Etisalat",
      videoUrl: "dQw4w9WgXcQ",
      portalUrl: "https://www.etisalat.ae",
      portalLabel: "Etisalat Business Portal",
      estimatedTimeMinutes: 8
    },
    du: {
      name: "du",
      steps: [
        "Log in to the du My Account portal or du App.",
        "Select call features and go to call forwarding settings.",
        "Set the redirect phone number to: {virtualNumber}.",
        "Ensure your UAE ID documentation is verified in your account profile to prevent automated blocklist screening.",
        "Save settings and confirm."
      ],
      badge: "Emirati ID compliance check required",
      videoUrl: "dQw4w9WgXcQ",
      portalUrl: "https://www.du.ae",
      portalLabel: "du Business Support Portal",
      estimatedTimeMinutes: 8
    }
  }
};
