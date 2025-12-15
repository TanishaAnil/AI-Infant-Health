import { Language } from '../types';

export const t = (key: string, lang: Language): string => {
  const translations: Record<string, Record<Language, string>> = {
    'app_name': { en: 'NurtureAI', te: 'NurtureAI (పోషణ)' },
    'login_title': { en: 'Patient Login', te: 'పేషెంట్ లాగిన్' },
    'baby_name': { en: 'Baby Name', te: 'పాప/బాబు పేరు' },
    'parent_name': { en: 'Parent Name', te: 'తల్లి/తండ్రి పేరు' },
    'birth_date': { en: 'Birth Date', te: 'పుట్టిన తేదీ' },
    'weight': { en: 'Weight (kg)', te: 'బరువు (kg)' },
    'enter_app': { en: 'Start Monitoring', te: 'పర్యవేక్షణ ప్రారంభించండి' },
    'dashboard': { en: 'Home', te: 'హోమ్' },
    'trends': { en: 'Trends', te: 'పోకడలు' },
    'agent': { en: 'Agent', te: 'ఏజెంట్' },
    'report': { en: 'Report', te: 'నివేదిక' },
    'generate_report': { en: 'Generate Medical Report', te: 'వైద్య నివేదికను రూపొందించండి' },
    'download': { en: 'Download Report', te: 'నివేదికను డౌన్‌లోడ్ చేయండి' },
    'generating': { en: 'Generating...', te: 'రూపొందిస్తోంది...' },
    'quick_log': { en: 'Quick Log', te: 'త్వరిత నమోదు' },
    'recent_activity': { en: 'Recent Activity', te: 'ఇటీవలి కార్యకలాపాలు' },
    'feed': { en: 'Feed', te: 'ఆహారం' },
    'sleep': { en: 'Sleep', te: 'నిద్ర' },
    'diaper': { en: 'Diaper', te: 'డైపర్' },
    'temp': { en: 'Temp', te: 'ఉష్ణోగ్రత' },
    'kb_active': { en: 'Knowledge Base Active', te: 'జ్ఞాన భాండాగారం యాక్టివ్‌గా ఉంది' },
  };

  return translations[key]?.[lang] || key;
};
