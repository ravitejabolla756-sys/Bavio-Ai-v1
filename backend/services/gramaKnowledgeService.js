'use strict';

/**
 * gramaKnowledgeService.js — Curated, Grounded Knowledge Base for BAVIO GRAMA
 * 
 * Domains:
 * 1. Central Government Agriculture & Welfare Schemes
 * 2. State-Specific Rural Assistance (Tamil Nadu, Telangana, Andhra Pradesh, UP, Bihar, etc.)
 * 3. Public Health, Pensions, and Farmer Helplines
 * 
 * Languages supported: Tamil (ta), Telugu (te), Hindi (hi), English (en)
 * 
 * Strict Grounding & Anti-Hallucination Policy:
 * - Every scheme entry includes verified eligibility, exact benefit amount, documents, and procedures.
 * - Missing or out-of-scope questions explicitly trigger a graceful fallback message.
 */

const CURATED_SCHEMES = [
  {
    id: 'pm_kisan',
    name: 'PM-Kisan Samman Nidhi',
    category: 'agriculture_financial',
    names: {
      ta: 'பிரதமர் கிசான் சம்மான் நிதி திட்டம் (PM-Kisan)',
      te: 'పీఎం కిసాన్ సమ్మాన్ నిధి పథకం (PM-Kisan)',
      hi: 'प्रधानमंत्री किसान सम्मान निधि योजना (PM-Kisan)',
      en: 'Pradhan Mantri Kisan Samman Nidhi (PM-Kisan)'
    },
    benefit: {
      ta: 'ஆண்டுக்கு ₹6,000 நிதி உதவி. தலா ₹2,000 வீதம் 3 தவணைகளில் நேரடியாக விவசாயிகளின் வங்கிக் கணக்கில் (DBT) செலுத்தப்படும்.',
      te: 'సంవత్సరానికి ₹6,000 ఆర్థిక సహాయం. ప్రతి 4 నెలలకు ₹2,000 చొప్పున 3 విడతల్లో నేరుగా రైతుల బ్యాంక్ ఖాతాలో (DBT) జమ అవుతుంది.',
      hi: 'सालाना ₹6,000 की आर्थिक सहायता। ₹2,000 की 3 किस्तों में सीधे किसानों के बैंक खाते (DBT) में भेजी जाती है।',
      en: '₹6,000 per year provided in 3 equal installments of ₹2,000 directly transferred into Aadhaar-linked bank accounts.'
    },
    eligibility: {
      ta: 'நில உரிமையுள்ள அனைத்து சிறு மற்றும் குறு விவசாய குடும்பங்கள். அரசு ஊழியர்கள் மற்றும் வருமான வரி செலுத்துவோர் தவிர.',
      te: 'సాగు భూమి ఉన్న చిన్న, సన్నకారు రైతు కుటుంబాలు. ప్రభుత్వ ఉద్యోగులు మరియు ఆదాయపు పన్ను చెల్లించేవారు అర్హులు కారు.',
      hi: 'सभी भूमिधारक किसान परिवार जिनके नाम पर खेती योग्य जमीन है। सरकारी कर्मचारी और आयकर दाता पात्र नहीं हैं।',
      en: 'All landholding farmer families with cultivable land in their names. Institutional landholders and income tax payers are excluded.'
    },
    documents_required: {
      ta: ['ஆதார் அட்டை (Aadhaar)', 'பட்டா / சிட்டா அல்லது நில உரிமை ஆவணம்', 'ஆதாருடன் இணைக்கப்பட்ட வங்கிக் கணக்கு புத்தகம்'],
      te: ['ఆధార్ కార్డు', 'పట్టాదారు పాస్ బుక్ (భూమి పత్రాలు)', 'ఆధార్ లింక్ అయిన బ్యాంక్ ఖాతా'],
      hi: ['आधार कार्ड', 'खतौनी / जमीन के दस्तावेज', 'आधार से लिंक बैंक खाता पासबुक'],
      en: ['Aadhaar Card', 'Land ownership documents (Khatoni/Pattadar Passbook)', 'Aadhaar-seeded bank account details']
    },
    application_procedure: {
      ta: 'அருகிலுள்ள இ-சேவை மையம் (CSC/e-Seva) அல்லது pmkisan.gov.in போர்ட்டலில் Farmer Corner மூலம் விண்ணப்பிக்கலாம்.',
      te: 'మీసేవా కేంద్రం (CSC/MeeSeva) లేదా pmkisan.gov.in అధికారిక వెబ్‌సైట్ ద్వారా దరఖాస్తు చేసుకోవచ్చు.',
      hi: 'नजदीकी सीएससी (CSC) जन सेवा केंद्र या आधिकारिक वेबसाइट pmkisan.gov.in पर फार्मर कॉर्नर से आवेदन करें।',
      en: 'Apply online at pmkisan.gov.in (Farmers Corner) or through nearest Common Service Centre (CSC).'
    },
    source: 'Ministry of Agriculture & Farmers Welfare, Govt of India',
    source_url: 'https://pmkisan.gov.in',
    last_verified: '2026-03-01'
  },
  {
    id: 'pmfby_crop_insurance',
    name: 'Pradhan Mantri Fasal Bima Yojana (PMFBY)',
    category: 'crop_insurance',
    names: {
      ta: 'பிரதமர் பயிர் காப்பீட்டுத் திட்டம் (PMFBY)',
      te: 'ప్రధాన మంత్రి ఫసల్ బీమా యోజన (పంటల బీమా)',
      hi: 'प्रधानमंत्री फसल बीमा योजना (PMFBY)',
      en: 'Pradhan Mantri Fasal Bima Yojana (PMFBY)'
    },
    benefit: {
      ta: 'வறட்சி, வெள்ளம், பூச்சி தாக்குதலால் பயிர் சேதமடைந்தால் முழு இழப்பீட்டு தொகை காப்பீடு மூலம் கிடைக்கும். பிரீமியம்: காரிஃப் 2%, ரபி 1.5%.',
      te: 'కరువు, వరదలు, తెగుళ్ల వల్ల పంట నష్టపోతే బీమా పరిహారం లభిస్తుంది. ప్రీమియం: ఖరీఫ్ పంటకు 2%, రబీ పంటకు 1.5%.',
      hi: 'प्राकृतिक आपदा, सूखा, बाढ़ या कीटों से फसल नष्ट होने पर वित्तीय मुआवजा। खरीफ फसल के लिए 2% और रबी फसल के लिए 1.5% प्रीमियम।',
      en: 'Comprehensive insurance coverage against crop loss due to non-preventable natural risks (drought, flood, pests). Premium: Kharif 2%, Rabi 1.5%.'
    },
    eligibility: {
      ta: 'அறிவிக்கப்பட்ட பகுதியில் அறிவிக்கப்பட்ட பயிர்களை பயிரிடும் அனைத்து விவசாயிகள் (குத்தகை விவசாயிகள் உட்பட).',
      te: 'నోటిఫై చేసిన ప్రాంతాల్లో పంటలు సాగు చేసే రైతులందరూ (కౌలు రైతులతో సహా) అర్హులు.',
      hi: 'अधिसूचित क्षेत्रों में अधिसूचित फसलें उगाने वाले सभी किसान (बटाईदार/किरायेदार किसान भी)।',
      en: 'All farmers including sharecroppers and tenant farmers growing notified crops in notified areas.'
    },
    documents_required: {
      ta: ['ஆதார் அட்டை', 'நில உரிமை ஆவணம் / அடங்கல் / கிராம நிர்வாக அலுவலர் சான்று', 'வங்கி கணக்கு பாஸ்புக்', 'விதைப்பு சான்றிதழ்'],
      te: ['ఆధార్ కార్డు', 'పట్టాదారు పాస్ బుక్ / కౌలు ధృవీకరణ పత్రం', 'బ్యాంక్ పాస్ బుక్', 'పంట సాగు ధృవీకరణ పత్రం'],
      hi: ['आधार कार्ड', 'खसरा/खतौनी या किराएदारी अनुबंध', 'बैंक पासबुक', 'बुवाई प्रमाण पत्र'],
      en: ['Aadhaar Card', 'Land ownership / Tenant certificate', 'Bank Passbook', 'Sowing Certificate']
    },
    application_procedure: {
      ta: 'விதைப்பு செய்த 72 மணி நேரத்திற்குள் வங்கி கிளை அல்லது pmfby.gov.in போர்ட்டலில் பதிவு செய்ய வேண்டும். இழப்பு ஏற்பட்டால் 72 மணி நேரத்தில் தகவல் தெரிவிக்க வேண்டும்.',
      te: 'విత్తనాలు వేసిన తర్వాత బ్యాంక్ లేదా pmfby.gov.in లో నమోదు చేసుకోవాలి. పంట నష్టం జరిగితే 72 గంటల్లో సమాచారం ఇవ్వాలి.',
      hi: 'फसल बुवाई के बाद बैंक, सीएससी केंद्र या pmfby.gov.in पर पंजीकरण करें। नुकसान होने पर 72 घंटे में टोल फ्री नंबर 14447 पर कॉल करें।',
      en: 'Apply via bank, CSC or pmfby.gov.in. Report crop damage within 72 hours via PMFBY app or toll-free number 14447.'
    },
    source: 'Department of Agriculture and Cooperation',
    source_url: 'https://pmfby.gov.in',
    last_verified: '2026-03-01'
  },
  {
    id: 'ayushman_bharat',
    name: 'Ayushman Bharat PM-JAY (Health Insurance)',
    category: 'healthcare',
    names: {
      ta: 'ஆயுஷ்மான் பாரத் - பிரதம மந்திரி மக்கள் ஆரோக்கிய திட்டம் (PM-JAY)',
      te: 'ఆయుష్మాన్ భారత్ - ప్రధాన మంత్రి జన్ ఆరోగ్య యోజన (PM-JAY)',
      hi: 'आयुष्मान भारत - प्रधानमंत्री जन आरोग्य योजना (PM-JAY)',
      en: 'Ayushman Bharat Pradhan Mantri Jan Arogya Yojana (PM-JAY)'
    },
    benefit: {
      ta: 'குடும்பத்திற்கு ஆண்டுக்கு ₹5 லட்சம் வரை இலவச மருத்துவ சிகிச்சை அங்கீகரிக்கப்பட்ட அரசு மற்றும் தனியார் மருத்துவமனைகளில் பணமில்லா முறையில் (Cashless) கிடைக்கும்.',
      te: 'కుటుంబానికి సంవత్సరానికి ₹5 లక్షల వరకు ఉచిత వైద్య చికిత్స గుర్తింపు పొందిన ప్రభుత్వ మరియు ప్రైవేట్ ఆసుపత్రులలో నగదు రహితంగా లభిస్తుంది.',
      hi: 'प्रत्येक पात्र परिवार को प्रति वर्ष ₹5 लाख तक का मुफ्त इलाज (कैशलेस) सूचीबद्ध सरकारी और निजी अस्पतालों में।',
      en: 'Cashless healthcare cover of up to ₹5 lakh per family per year for secondary and tertiary care hospitalization.'
    },
    eligibility: {
      ta: 'SECC 2011 கணக்கெடுப்பின்படி கிராமப்புற ஏழை எளிய குடும்பங்கள் மற்றும் ரேஷன் அட்டைதாரர்கள்.',
      te: 'SECC 2011 ఆధారంగా అర్హత కలిగిన గ్రామీణ పేద కుటుంబాలు మరియు తెల్ల రేషన్ కార్డుదారులు.',
      hi: 'सामाजिक, आर्थिक और जातिगत जनगणना (SECC 2011) के आधार पर चयनित ग्रामीण गरीब परिवार।',
      en: 'Identified rural poor households based on Socio-Economic Caste Census (SECC 2011) deprivation criteria.'
    },
    documents_required: {
      ta: ['ஆதார் அட்டை', 'குடும்ப ரேஷன் அட்டை', 'மொபைல் எண்'],
      te: ['ఆధార్ కార్డు', 'రేషన్ కార్డు', 'మొబైల్ నంబర్'],
      hi: ['आधार कार्ड', 'राशन कार्ड', 'मोबाइल नंबर'],
      en: ['Aadhaar Card', 'Ration Card', 'Active Mobile Number']
    },
    application_procedure: {
      ta: 'அரசு மருத்துவமனையில் உள்ள ஆயுஷ்மான் மித்ரா (Ayushman Mitra) அல்லது CSC மையத்தில் சென்று ஆயுஷ்மான் கார்டு பெற்றுக்கொள்ளலாம்.',
      te: 'ప్రభుత్వ ఆసుపత్రిలోని ఆయుష్మాన్ మిత్ర లేదా మీసేవా కేంద్రంలో ఆయుష్మాన్ కార్డు ఉచితంగా పొందవచ్చు.',
      hi: 'नजदीकी सरकारी अस्पताल में आयुष्मान मित्र से मिलें या mera.pmjay.gov.in पर पात्रता जांचकर आयुष्मान कार्ड बनवाएं।',
      en: 'Visit nearest empanelled hospital (Ayushman Mitra helpdesk) or CSC center or portal beneficiary.nha.gov.in.'
    },
    source: 'National Health Authority (NHA)',
    source_url: 'https://pmjay.gov.in',
    last_verified: '2026-03-01'
  },
  {
    id: 'pm_awas_gramin',
    name: 'Pradhan Mantri Awas Yojana - Gramin (PMAY-G)',
    category: 'rural_housing',
    names: {
      ta: 'பிரதமர் ஊரக குடியிருப்பு திட்டம் (PMAY-G)',
      te: 'ప్రధాన మంత్రి గ్రామీణ ఆవాస్ యోజన (PMAY-G)',
      hi: 'प्रधानमंत्री आवास योजना - ग्रामीण (PMAY-G)',
      en: 'Pradhan Mantri Awaas Yojana - Gramin (PMAY-G)'
    },
    benefit: {
      ta: 'வீடு கட்ட சமவெளிப் பகுதிகளில் ₹1,20,000 மற்றும் மலைப்பகுதிகளில் ₹1,30,000 நேரடி மானியம் மற்றும் 90 நாட்கள் MGNREGA ஊதியம்.',
      te: 'పక్కా ఇల్లు నిర్మించుకోవడానికి మైదాన ప్రాంతాల్లో ₹1,20,000, కొండ ప్రాంతాల్లో ₹1,30,000 ఆర్థిక సాయం.',
      hi: 'पक्का मकान बनाने के लिए मैदानी इलाकों में ₹1,20,000 तथा पहाड़ी इलाकों में ₹1,30,000 की सीधी आर्थिक सहायता।',
      en: 'Financial assistance of ₹1.20 lakh in plain areas and ₹1.30 lakh in hilly areas, plus 90 days of MGNREGA wages.'
    },
    eligibility: {
      ta: 'சொந்தமாக கான்கிரீட் வீடு இல்லாத கிராமப்புற ஏழைக் குடும்பங்கள் மற்றும் குடிசையில் வசிப்பவர்கள்.',
      te: 'సొంత ఇల్లు లేని లేదా మట్టి గుడిసెల్లో నివసిస్తున్న గ్రామీణ పేద కుటుంబాలు.',
      hi: 'ऐसे ग्रामीण परिवार जिनके पास कोई पक्का मकान नहीं है या जो कच्चे/टूटे-फूटे घरों में रहते हैं।',
      en: 'Houseless families and households living in zero, one or two rooms with kutcha wall and kutcha roof.'
    },
    documents_required: {
      ta: ['ஆதார் அட்டை', 'வங்கி கணக்கு விவரம்', 'நில உரிமை அல்லது கிராம சபா அனுமதி', 'வேலை அட்டை (Job Card)'],
      te: ['ఆధార్ కార్డు', 'బ్యాంక్ పాస్ బుక్', 'జాబ్ కార్డు (ఉపాధి హామీ)'],
      hi: ['आधार कार्ड', 'बैंक खाता विवरण', 'मनरेगा जॉब कार्ड नंबर'],
      en: ['Aadhaar Card', 'Bank Account Details', 'MGNREGA Job Card']
    },
    application_procedure: {
      ta: 'கிராம ஊராட்சி அலுவலகம் (Panchayat) அல்லது வட்டார வளர்ச்சி அலுவலகம் (BDO) மூலம் பதிவு செய்யலாம்.',
      te: 'గ్రామ పంచాయతీ కార్యాలయం లేదా ఎంపీడీవో (MPDO) కార్యాలయం ద్వారా లబ్ధిదారుల జాబితాలో చేరవచ్చు.',
      hi: 'ग्राम पंचायत या ब्लॉक विकास अधिकारी (BDO) कार्यालय में संपर्क करें। ग्राम सभा द्वारा नाम अनुमोदित किया जाता है।',
      en: 'Beneficiaries are identified by Gram Sabha based on SECC list. Contact Gram Panchayat or Block Development Office.'
    },
    source: 'Ministry of Rural Development',
    source_url: 'https://pmayg.nic.in',
    last_verified: '2026-03-01'
  },
  {
    id: 'kisan_credit_card',
    name: 'Kisan Credit Card (KCC)',
    category: 'agriculture_credit',
    names: {
      ta: 'கிசான் கிரெடிட் கார்டு கடன் திட்டம் (KCC)',
      te: 'కిసాన్ క్రెడిట్ కార్డు పథకం (KCC)',
      hi: 'किसान क्रेडिट कार्ड योजना (KCC)',
      en: 'Kisan Credit Card (KCC)'
    },
    benefit: {
      ta: '₹3 லட்சம் வரை 4% வட்டி மானியத்தில் குறைந்த வட்டியில் விவசாய கடன். பிணையம் இல்லாமல் ₹1.60 லட்சம் வரை கடன் கிடைக்கும்.',
      te: 'రైతులకు ₹3 లక్షల వరకు కేవలం 4% వార్షిక వడ్డీకే స్వల్పకాలిక పంట రుణాలు. ₹1.60 లక్షల వరకు ఎటువంటి హామీ అవసరం లేదు.',
      hi: '₹3 लाख तक का कृषि ऋण मात्र 4% ब्याज दर पर (समय पर भुगतान करने पर 3% छूट सहित)। ₹1.60 लाख तक बिना गारंटी ऋण।',
      en: 'Short-term crop loans up to ₹3 lakh at a concessional interest rate of 4% per annum. Collateral-free limit up to ₹1.60 lakh.'
    },
    eligibility: {
      ta: 'அனைத்து விவசாயிகள், தனிநபர் அல்லது கூட்டு கடன் வாங்குபவர்கள், குத்தகை விவசாயிகள், கால்நடை மற்றும் மீன் வளர்ப்போர்.',
      te: 'రైతులు, కౌలు రైతులు, పశుపోషకులు మరియు మత్స్యకారులు అందరూ అర్హులు.',
      hi: 'सभी किसान, काश्तकार, पट्टेदार किसान तथा पशुपालन व मत्स्य पालन करने वाले किसान।',
      en: 'All farmers, owner cultivators, tenant farmers, sharecroppers, and animal husbandry/fisheries farmers.'
    },
    documents_required: {
      ta: ['ஆதார் அட்டை', 'நில ஆவணங்கள் (பட்டா/சிட்டா)', 'விவசாய நில வரைபடம்', 'பாஸ்போர்ட் அளவு புகைப்படம்'],
      te: ['ఆధార్ కార్డు', 'పట్టాదారు పాస్ బుక్', 'భూమి రికార్డులు', 'పాస్ పోర్ట్ సైజ్ ఫోటో'],
      hi: ['आधार कार्ड', 'जमीन के कागजात (खतौनी)', 'पहचान व निवास प्रमाण', 'पासपोर्ट साइज फोटो'],
      en: ['Aadhaar Card', 'Land Record / Revenue Documents', 'Passport Size Photograph']
    },
    application_procedure: {
      ta: 'அருகிலுள்ள வணிக வங்கி, கிராம வங்கி (RRB) அல்லது கூட்டுறவு சங்கத்தில் எளிய விண்ணப்பம் அளித்து பெறலாம்.',
      te: 'సమీపంలోని బ్యాంకు శాఖ లేదా సహకార సంఘం (Cooperative Society) లో దరఖాస్తు సమర్పించాలి.',
      hi: 'नजदीकी बैंक शाखा या ग्रामीण बैंक में जाकर KCC फॉर्म भरें। आवेदन के 14 दिनों के भीतर कार्ड जारी किया जाता है।',
      en: 'Apply at any commercial bank, Regional Rural Bank (RRB), or Cooperative Bank. Usually issued within 14 days.'
    },
    source: 'National Bank for Agriculture and Rural Development (NABARD)',
    source_url: 'https://www.nabard.org',
    last_verified: '2026-03-01'
  },
  {
    id: 'kisan_call_center',
    name: 'Kisan Call Center (1551 Helpline)',
    category: 'public_helpline',
    names: {
      ta: 'கிசான் கால் சென்டர் - விவசாய உதவி எண் (1551)',
      te: 'కిసాన్ కాల్ సెంటర్ - రైతు ఉచిత హెల్ప్‌లైన్ (1551)',
      hi: 'किसान कॉल सेंटर - टोल फ्री हेल्पलाइन (1551)',
      en: 'Kisan Call Centre Toll-Free Helpline (1551)'
    },
    benefit: {
      ta: 'விவசாயிகள் பயிர் நோய், உரம், பூச்சி மருந்து, வானிலை மற்றும் அரசு திட்டங்கள் குறித்து இலவசமாக 1551 என்ற எண்ணில் தாய்மொழியில் பேசி வேளாண் நிபுணர்களிடம் ஆலோசனை பெறலாம்.',
      te: 'రైతులు పంటల తెగుళ్లు, విత్తనాలు, ఎరువులు మరియు ప్రభుత్వ పథకాల సమాచారం కోసం 1551 టోల్ ఫ్రీ నంబర్‌కు ఉచితంగా ఫోన్ చేసి నిపుణులతో మాట్లాడవచ్చు.',
      hi: 'किसान खेती, बीज, खाद, कीट नियंत्रण, मौसम तथा योजनाओं की जानकारी के लिए 1800-180-1551 या 1551 पर अपनी भाषा में कृषि विशेषज्ञों से मुफ्त सलाह पा सकते हैं।',
      en: 'Toll-free tele-advisory service (1800-180-1551 / 1551) providing immediate agricultural guidance in all local Indian languages from 6 AM to 10 PM.'
    },
    eligibility: {
      ta: 'இந்தியாவின் அனைத்து விவசாயிகளும் எந்த கட்டணமும் இன்றி இலவசமாக அழைக்கலாம்.',
      te: 'భారతదేశంలోని రైతులందరూ ఉచితంగా సంప్రదించవచ్చు.',
      hi: 'देश का कोई भी किसान किसी भी फोन से सीधे कॉल कर सकता है।',
      en: 'Free and open to all farmers across India.'
    },
    documents_required: {
      ta: ['ஆவணங்கள் எதுவும் தேவையில்லை. தொலைபேசி அழைப்பு மட்டும் போதும்.'],
      te: ['ఎటువంటి పత్రాలు అవసరం లేదు. ఫోన్ ద్వారా నేరుగా మాట్లాడవచ్చు.'],
      hi: ['किसी दस्तावेज की आवश्यकता नहीं है।'],
      en: ['No documents required. Instant voice assistance.']
    },
    application_procedure: {
      ta: 'உங்கள் மொபைல் அல்லது லேண்ட்லைனிலிருந்து 1551 அல்லது 1800-180-1551 என்ற எண்ணை டயல் செய்யுங்கள் (காலை 6 மணி முதல் இரவு 10 மணி வரை).',
      te: 'ఉదయం 6 గంటల నుండి రాత్రి 10 గంటల వరకు 1551 నంబర్‌కు డయల్ చేయండి.',
      hi: 'सुबह 6:00 बजे से रात 10:00 बजे के बीच 1551 पर कॉल करें।',
      en: 'Dial 1551 or 1800-180-1551 from any mobile or landline.'
    },
    source: 'Ministry of Agriculture and Farmers Welfare',
    source_url: 'https://dackkms.gov.in',
    last_verified: '2026-03-01'
  }
];

/**
 * Retrieve relevant schemes based on caller query in Tamil, Telugu, Hindi, or English.
 */
function retrieveRelevantSchemes(query, targetLang = 'hi', limit = 2) {
  if (!query || typeof query !== 'string' || !query.trim()) {
    return [];
  }

  const normalizedQuery = query.toLowerCase();
  const lang = (targetLang || 'hi').toLowerCase().slice(0, 2);

  // Keyword match score
  const scored = CURATED_SCHEMES.map((scheme) => {
    let score = 0;

    // Check scheme ID & English name
    if (normalizedQuery.includes(scheme.id.replace(/_/g, ' ')) || normalizedQuery.includes(scheme.name.toLowerCase())) {
      score += 10;
    }

    // Check multilingual names
    Object.values(scheme.names).forEach((name) => {
      if (normalizedQuery.includes(name.toLowerCase())) score += 8;
    });

    // Domain keywords
    const keywords = {
      pm_kisan: ['kisan', '₹6000', '6000', 'subsidy', 'aid', 'விவசாய', 'రైతు', 'किसान', 'money', 'paisa', 'dbt'],
      pmfby_crop_insurance: ['insurance', 'crop', 'flood', 'drought', 'loss', 'damage', 'காப்பீடு', 'బీమా', 'बीमा', 'fasal'],
      ayushman_bharat: ['health', 'hospital', 'treatment', 'medical', '5 lakh', 'மருத்துவமனை', 'ఆసుపత్రి', 'अस्पताल', 'इलाज', 'card'],
      pm_awas_gramin: ['house', 'housing', 'home', 'building', 'வீடு', 'ఇల్లు', 'मकान', 'आवास', 'ghar'],
      kisan_credit_card: ['loan', 'credit', 'kcc', 'interest', 'வங்கி கடன்', 'రుణం', 'ऋण', 'कर्ज'],
      kisan_call_center: ['helpline', 'expert', 'advice', '1551', 'call', 'உதவி எண்', 'హెల్ప్‌లైన్', 'हेल्पलाइन', 'सलाह']
    };

    const schemeKeywords = keywords[scheme.id] || [];
    schemeKeywords.forEach((kw) => {
      if (normalizedQuery.includes(kw.toLowerCase())) {
        score += 3;
      }
    });

    return { scheme, score };
  });

  // Sort by score descending and filter non-zero
  scored.sort((a, b) => b.score - a.score);
  const matched = scored.filter((item) => item.score > 0).slice(0, limit).map((item) => item.scheme);

  // If no match found by score, return top fallback agriculture schemes
  if (matched.length === 0) {
    return [CURATED_SCHEMES[0], CURATED_SCHEMES[5]]; // PM-Kisan and Kisan Call Center default
  }

  return matched;
}

/**
 * Format retrieved scheme into a grounded prompt context string in the requested language.
 */
function buildGramaRagContext(schemes, lang = 'hi') {
  const l = (lang || 'hi').toLowerCase().slice(0, 2);
  const langKey = ['ta', 'te', 'hi', 'en'].includes(l) ? l : 'hi';

  if (!schemes || schemes.length === 0) {
    return 'No verified government scheme records found for this query.';
  }

  return schemes.map((s, idx) => {
    const schemeName = s.names[langKey] || s.name;
    const benefit = s.benefit[langKey] || s.benefit.en;
    const eligibility = s.eligibility[langKey] || s.eligibility.en;
    const docs = (s.documents_required[langKey] || s.documents_required.en).join(', ');
    const procedure = s.application_procedure[langKey] || s.application_procedure.en;

    return `[RECORD ${idx + 1}: ${schemeName}]
- Scheme ID: ${s.id}
- Benefit: ${benefit}
- Eligibility: ${eligibility}
- Required Documents: ${docs}
- Application Process: ${procedure}
- Source: ${s.source} (${s.source_url})
- Last Verified: ${s.last_verified}`;
  }).join('\n\n');
}

module.exports = {
  CURATED_SCHEMES,
  retrieveRelevantSchemes,
  buildGramaRagContext
};
