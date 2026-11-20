import { getPermit } from '../data/campuses';
import type { PermitId, SignInterpretation } from '../types';

const PERMIT_PATTERNS: Array<{ permit: PermitId; pattern: RegExp; label: string }> = [
  { permit: 'east-economy', pattern: /EAST\s+ECONOMY/, label: 'East Economy' },
  { permit: 'town-point-economy', pattern: /TOWN\s+POINT/, label: 'Town Point Economy' },
  { permit: 'gutenberg-economy', pattern: /GUTENBERG/, label: 'Gutenberg Economy' },
  { permit: 'central', pattern: /CENTRAL/, label: 'Central' },
  { permit: 'east', pattern: /\bEAST\b/, label: 'East' },
  { permit: 'west', pattern: /\bWEST\b/, label: 'West' },
  { permit: 'north', pattern: /\bNORTH\b/, label: 'North' },
  { permit: 'south', pattern: /\bSOUTH\b/, label: 'South' },
  { permit: 'shuttle', pattern: /SHUTTLE/, label: 'Shuttle' },
  { permit: 'hourly', pattern: /HOURLY|PAY[ -]?BY[ -]?PLATE|PAID\s+PARKING|PARKMOBILE/, label: 'Hourly paid' },
];

function cleanText(text: string): string {
  return text.toUpperCase().replace(/[^A-Z0-9:$\-–—. ]+/g, ' ').replace(/\s+/g, ' ').trim();
}

export function interpretParkingSign(
  rawText: string,
  selectedPermit: PermitId,
  arrival: string,
): SignInterpretation {
  const text = cleanText(rawText);
  const permit = getPermit(selectedPermit);
  const matchedRules: string[] = [];
  const cautions = [
    'OCR can miss small or damaged text. Inspect the physical sign before leaving your vehicle.',
    'Official KSU signs and parking rules always override this prototype interpretation.',
  ];

  const timeMatches = [...text.matchAll(/\b(\d{1,2}(?::\d{2})?\s*(?:AM|PM))\s*(?:-|–|—|TO)\s*(\d{1,2}(?::\d{2})?\s*(?:AM|PM))\b/g)];
  const firstTimeMatch = timeMatches[0];
  const timeStart = firstTimeMatch?.[1];
  const timeEnd = firstTimeMatch?.[2];
  if (timeStart && timeEnd) {
    matchedRules.push(`Posted time window detected: ${timeStart}–${timeEnd}.`);
    cautions.push(`The planner is set for ${new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(arrival))}; confirm that the posted time window applies.`);
  }

  if (/FIRE\s+LANE|TOW[ -]?AWAY|NO\s+PARKING|DO\s+NOT\s+PARK/.test(text)) {
    matchedRules.push('A no-parking, fire-lane, or tow-away restriction was detected.');
    return {
      verdict: 'not-allowed',
      title: 'Do not park here',
      summary: 'The recognized text contains a restriction that should be treated as no parking.',
      matchedRules,
      cautions,
    };
  }

  if (/FACULTY|STAFF\s+ONLY|EMPLOYEE\s+ONLY/.test(text)) {
    matchedRules.push('Faculty/staff-only wording was detected.');
    return {
      verdict: 'not-allowed',
      title: 'Student permit does not match',
      summary: `${permit.shortLabel} is a student parking selection, while this sign appears reserved for faculty or staff.`,
      matchedRules,
      cautions,
    };
  }

  if (/RESERVED|SERVICE\s+VEHICLE|LOADING\s+ZONE/.test(text)) {
    matchedRules.push('Reserved, service-vehicle, or loading-zone wording was detected.');
    return {
      verdict: 'conditional',
      title: 'Special authorization appears required',
      summary: 'Do not rely on a standard student permit in this space unless the complete sign explicitly authorizes it.',
      matchedRules,
      cautions,
    };
  }

  if (/HANDICAP|ACCESSIBLE|ADA|PLACARD/.test(text)) {
    matchedRules.push('Accessible-space wording was detected.');
    return {
      verdict: 'conditional',
      title: 'Accessible credentials required',
      summary: 'Use this space only when the vehicle and driver meet every posted accessible-parking requirement.',
      matchedRules,
      cautions,
    };
  }

  if (/LICENSE\s+PLATE|PLATE\s+VISIBLE|NO\s+BACK[ -]?IN|HEAD[ -]?IN/.test(text)) {
    matchedRules.push('Vehicle-orientation or license-plate wording was detected.');
    cautions.push('KSU uses license-plate recognition; keep the registered plate visible from the drive lane.');
  }

  const signPermit = PERMIT_PATTERNS.find(({ pattern }) => pattern.test(text));
  if (signPermit) {
    matchedRules.push(`${signPermit.label} area wording was detected.`);
    if (signPermit.permit === 'hourly') {
      matchedRules.push('Payment wording was detected; a permit alone may not cover the session.');
      return {
        verdict: 'conditional',
        title: 'Parking appears available with payment',
        summary: 'Follow the payment instructions and confirm the space is not subject to another restriction.',
        matchedRules,
        cautions,
      };
    }

    if (signPermit.permit === selectedPermit) {
      return {
        verdict: 'allowed',
        title: 'Permit name appears to match',
        summary: `The recognized area is consistent with your ${permit.label} selection. Check the complete sign, space markings, and time restrictions.`,
        matchedRules,
        cautions,
      };
    }

    return {
      verdict: 'not-allowed',
      title: 'Permit area appears different',
      summary: `The sign appears to require ${signPermit.label}, while your selected permit is ${permit.label}.`,
      matchedRules,
      cautions,
    };
  }

  if (/PERMIT\s+REQUIRED|KSU\s+PERMIT/.test(text)) {
    matchedRules.push('A permit requirement was detected, but no specific area was recognized.');
    return {
      verdict: 'unclear',
      title: 'Permit required; area unclear',
      summary: 'The scanner could not establish whether the selected permit matches this space.',
      matchedRules,
      cautions,
    };
  }

  return {
    verdict: 'unclear',
    title: 'Not enough text to decide',
    summary: 'Try a closer, straight-on photograph or paste the complete wording. Do not park based on an unclear scan.',
    matchedRules,
    cautions,
  };
}

export const DEMO_SIGN_TEXT = `KSU CENTRAL PARKING\nVALID CENTRAL PERMIT REQUIRED\nLICENSE PLATE MUST FACE DRIVE LANE\nENFORCED 24 HOURS`;
