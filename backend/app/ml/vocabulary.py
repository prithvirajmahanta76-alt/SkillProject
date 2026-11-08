"""
SignBridge Universal — 25 Core Indian Sign Language (ISL) Medical Vocabulary
"""

ISL_25_VOCABULARY = [
    {"id": "pain", "gloss": "PAIN", "category": "medical", "hindi": "दर्द", "odia": "ଯନ୍ତ୍ରଣା", "telugu": "నొప్పి"},
    {"id": "doctor", "gloss": "DOCTOR", "category": "medical", "hindi": "डॉक्टर", "odia": "ଡାକ୍ତର", "telugu": "వైద్యుడు"},
    {"id": "medicine", "gloss": "MEDICINE", "category": "medical", "hindi": "दवा", "odia": "ଔଷଧ", "telugu": "మందు"},
    {"id": "hospital", "gloss": "HOSPITAL", "category": "medical", "hindi": "अस्पताल", "odia": "ଡାକ୍ତରଖାନା", "telugu": "ఆసుపత్రి"},
    {"id": "emergency", "gloss": "EMERGENCY", "category": "emergency", "hindi": "आपातकालीन", "odia": "ଜରୁରୀକାଳୀନ", "telugu": "అత్యవసరం"},
    {"id": "help", "gloss": "HELP", "category": "emergency", "hindi": "मदद", "odia": "ସାହାଯ୍ୟ", "telugu": "సహాయం"},
    {"id": "water", "gloss": "WATER", "category": "daily_needs", "hindi": "पानी", "odia": "ପାଣି", "telugu": "నీరు"},
    {"id": "food", "gloss": "FOOD", "category": "daily_needs", "hindi": "खाना", "odia": "ଖାଦ୍ୟ", "telugu": "ఆహారం"},
    {"id": "fever", "gloss": "FEVER", "category": "medical", "hindi": "बुखार", "odia": "ଜ୍ୱର", "telugu": "జ్వరం"},
    {"id": "headache", "gloss": "HEADACHE", "category": "medical", "hindi": "सिरदर्द", "odia": "ମୁଣ୍ଡବିନ୍ଧା", "telugu": "తలనొప్పి"},
    {"id": "stomach", "gloss": "STOMACH", "category": "anatomy", "hindi": "पेट", "odia": "ପେଟ", "telugu": "కడుపు"},
    {"id": "chest", "gloss": "CHEST", "category": "anatomy", "hindi": "छाती", "odia": "ଛାତି", "telugu": "ఛాతీ"},
    {"id": "breathe", "gloss": "BREATHE", "category": "medical", "hindi": "साँस", "odia": "ନିଶ୍ୱାସ", "telugu": "శ్వాస"},
    {"id": "dizzy", "gloss": "DIZZY", "category": "medical", "hindi": "चक्कर", "odia": "ମୁଣ୍ଡ ବୁଲାଇବା", "telugu": "కళ్ళు తిరగడం"},
    {"id": "yes", "gloss": "YES", "category": "response", "hindi": "हाँ", "odia": "ହଁ", "telugu": "అవును"},
    {"id": "no", "gloss": "NO", "category": "response", "hindi": "नहीं", "odia": "ନାହିଁ", "telugu": "కాదు"},
    {"id": "please", "gloss": "PLEASE", "category": "polite", "hindi": "कृपया", "odia": "ଦୟାକରି", "telugu": "దయచేసి"},
    {"id": "thank_you", "gloss": "THANK_YOU", "category": "polite", "hindi": "धन्यवाद", "odia": "ଧନ୍ୟବାଦ", "telugu": "ధన్యవాదాలు"},
    {"id": "stop", "gloss": "STOP", "category": "action", "hindi": "रुकिए", "odia": "ରୁହନ୍ତୁ", "telugu": "ఆగండి"},
    {"id": "wait", "gloss": "WAIT", "category": "action", "hindi": "इंतजार करें", "odia": "ଅପେକ୍ଷା କରନ୍ତୁ", "telugu": "వేచి ఉండండి"},
    {"id": "injection", "gloss": "INJECTION", "category": "medical", "hindi": "सुई / इंजेक्शन", "odia": "ଇଞ୍ଜେକ୍ସନ", "telugu": "సూది"},
    {"id": "blood", "gloss": "BLOOD", "category": "medical", "hindi": "खून", "odia": "ରକ୍ତ", "telugu": "రక్తం"},
    {"id": "urine", "gloss": "URINE", "category": "medical", "hindi": "पेशाब", "odia": "ପରିସ୍ରା", "telugu": "మూత్రం"},
    {"id": "wheelchair", "gloss": "WHEELCHAIR", "category": "assistive", "hindi": "व्हीलचेयर", "odia": "ହୁଇଲ୍ ଚେୟାର୍", "telugu": "వీల్‌చైర్"},
    {"id": "family", "gloss": "FAMILY", "category": "people", "hindi": "परिवार", "odia": "ପରିବାର", "telugu": "కుటుంబం"},
]

GLOSS_LIST = [item["gloss"] for item in ISL_25_VOCABULARY]
LABEL_TO_INDEX = {item["gloss"]: idx for idx, item in enumerate(ISL_25_VOCABULARY)}
INDEX_TO_LABEL = {idx: item["gloss"] for idx, item in enumerate(ISL_25_VOCABULARY)}

