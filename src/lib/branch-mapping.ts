/**
 * Maps full department/branch names or variations to standard branch abbreviations.
 * E.g., "Information Technology" -> "IT"
 *       "B.Tech - Artificial Intelligence and Data Science" -> "AIDS"
 *       "Electronics and Communication Engineering" -> "ECE"
 */
export function normalizeBranchToAbbreviation(rawBranch: string): string {
  if (!rawBranch) return '';
  const trimmed = rawBranch.trim();
  const clean = trimmed.toUpperCase()
    .replace(/^B\.?TECH\.?\s*[-–:]?\s*/i, '')
    .replace(/^B\.?E\.?\s*[-–:]?\s*/i, '')
    .replace(/^M\.?E\.?\s*[-–:]?\s*/i, '')
    .replace(/^M\.?TECH\.?\s*[-–:]?\s*/i, '')
    .replace(/^DIPLOMA\s*[-–:]?\s*/i, '')
    .trim();

  // Known exact standard abbreviations
  const knownAbbrs: Record<string, string> = {
    'IT': 'IT',
    'INFORMATION TECHNOLOGY': 'IT',
    
    'AIDS': 'AIDS',
    'AI&DS': 'AIDS',
    'AI & DS': 'AIDS',
    'AI AND DS': 'AIDS',
    'AI': 'AIDS',
    'ARTIFICIAL INTELLIGENCE AND DATA SCIENCE': 'AIDS',
    'ARTIFICIAL INTELLIGENCE & DATA SCIENCE': 'AIDS',

    'AIML': 'AIML',
    'AI&ML': 'AIML',
    'AI & ML': 'AIML',
    'AI AND ML': 'AIML',
    'ARTIFICIAL INTELLIGENCE AND MACHINE LEARNING': 'AIML',
    'ARTIFICIAL INTELLIGENCE & MACHINE LEARNING': 'AIML',

    'ECE': 'ECE',
    'ELECTRONICS AND COMMUNICATION ENGINEERING': 'ECE',
    'ELECTRONICS & COMMUNICATION ENGINEERING': 'ECE',
    'ELECTRONICS AND COMMUNICATION': 'ECE',
    'ELECTRONICS & COMMUNICATION': 'ECE',

    'CSE': 'CSE',
    'COMPUTER SCIENCE': 'CSE',
    'COMPUTER SCIENCE AND ENGINEERING': 'CSE',
    'COMPUTER SCIENCE & ENGINEERING': 'CSE',

    'EEE': 'EEE',
    'ELECTRICAL AND ELECTRONICS ENGINEERING': 'EEE',
    'ELECTRICAL & ELECTRONICS ENGINEERING': 'EEE',
    'ELECTRICAL ENGINEERING': 'EEE',

    'MECH': 'MECH',
    'MECHANICAL': 'MECH',
    'MECHANICAL ENGINEERING': 'MECH',

    'CIVIL': 'CIVIL',
    'CIVIL ENGINEERING': 'CIVIL',

    'BME': 'BME',
    'BIOMEDICAL': 'BME',
    'BIOMEDICAL ENGINEERING': 'BME',
    'BIO MEDICAL ENGINEERING': 'BME',
    'BIO MEDICAL': 'BME',

    'CSBS': 'CSBS',
    'CS&BS': 'CSBS',
    'CS & BS': 'CSBS',
    'COMPUTER SCIENCE AND BUSINESS SYSTEMS': 'CSBS',
    'COMPUTER SCIENCE & BUSINESS SYSTEMS': 'CSBS',
    'COMPUTER SCIENCE BUSINESS SYSTEM': 'CSBS',

    'CYS': 'CYS',
    'CYBER': 'CYS',
    'CYBER SECURITY': 'CYS',
    'CYBERSECURITY': 'CYS',

    'VLSI': 'VLSI',
    'VLSI DESIGN': 'VLSI',

    'MBA': 'MBA',
    'MASTER OF BUSINESS ADMINISTRATION': 'MBA',
    'MASTERS OF BUSINESS ADMINISTRATION': 'MBA',

    'MCA': 'MCA',
    'MASTER OF COMPUTER APPLICATIONS': 'MCA',
    'MASTERS OF COMPUTER APPLICATIONS': 'MCA',
  };

  if (knownAbbrs[clean]) return knownAbbrs[clean];
  if (knownAbbrs[trimmed.toUpperCase()]) return knownAbbrs[trimmed.toUpperCase()];

  // Keyword / Substring fallback matches
  if (clean.includes('ARTIFICIAL INTELLIGENCE') && (clean.includes('DATA') || clean.includes('DS'))) return 'AIDS';
  if (clean.includes('ARTIFICIAL INTELLIGENCE') && (clean.includes('MACHINE') || clean.includes('ML'))) return 'AIML';
  if (clean.includes('BUSINESS SYSTEM') || clean.includes('BUSINESS SYSTEMS')) return 'CSBS';
  if (clean.includes('CYBER')) return 'CYS';
  if (clean.includes('BIOMEDICAL') || clean.includes('BIO MEDICAL')) return 'BME';
  if (clean.includes('INFORMATION TECHNOLOGY')) return 'IT';
  if (clean.includes('COMPUTER SCIENCE')) return 'CSE';
  if (clean.includes('ELECTRONICS') && clean.includes('COMMUNICATION')) return 'ECE';
  if (clean.includes('ELECTRICAL') && clean.includes('ELECTRONICS')) return 'EEE';
  if (clean.includes('MECHANICAL')) return 'MECH';
  if (clean.includes('CIVIL')) return 'CIVIL';
  if (clean.includes('VLSI')) return 'VLSI';
  if (clean.includes('BUSINESS ADMINISTRATION')) return 'MBA';
  if (clean.includes('COMPUTER APPLICATIONS')) return 'MCA';

  return clean;
}
