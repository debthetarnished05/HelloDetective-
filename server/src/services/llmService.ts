import Groq from 'groq-sdk';
import dotenv from 'dotenv';
import { ISuspectRuntimeState, ISuspectItem, IStageDefinition, IGroundTruth, IStory, IEvidenceItem, MysteryArchetype } from '../types/index.js';

dotenv.config();

const MODEL_NAME = process.env.GROQ_MODEL || 'qwen/qwen3.8-27b';

export const ARCHETYPE_BLUEPRINTS: Record<MysteryArchetype, { name: string; description: string; instructions: string }> = {
  classic_procedural: {
    name: '1. The Classic Procedural (Fair-Play Direct)',
    description: 'The killer attempted to cover their tracks, but forensic evidence and timeline inconsistencies directly trace back to them.',
    instructions: 'Follow classic fair-play rules. The killer is the one with the direct forensic link to the murder weapon and scene. The suspects have personal secrets, but only the true killer committed murder.'
  },
  multi_crime_convergence: {
    name: '2. The Multi-Crime Convergence (Guilty of Another Crime)',
    description: 'Two separate crimes occurred simultaneously (e.g., safe burglary, embezzlement, or blackmail). An innocent suspect lies and panics because of their lesser crime, appearing guilty of murder.',
    instructions: 'Create a "Guilty But Innocent" suspect (Fall Guy / Red Herring). This suspect was committing a secondary crime (e.g. cracking the safe, stealing documents, or staging a blackmail meeting) at the exact time of death. They lie and panic under interrogation because they fear being arrested for the burglary! The true killer is a separate character who used the distraction or arrived at a different time. In groundTruth, set "archetype": "multi_crime_convergence", "fallGuy": "<slug of burglar/thief>", and "redHerringCrime": "<name of secondary crime>".'
  },
  deliberate_frame_job: {
    name: '3. The Deliberate Frame Job (The Planted Fall Guy)',
    description: 'The true killer deliberately planted physical evidence (badge, weapon, clothing fibers) pointing screamingly at an innocent Fall Guy.',
    instructions: 'The true killer staged the scene to frame an innocent Fall Guy (Patsy). Early evidence heavily implicates the Fall Guy (their tool/weapon was used, or their badge was dropped). HOWEVER, a subtle physical contradiction exists (e.g., the Fall Guy wears size 12 gloves, but the grip shows small prints; or the Fall Guy was on a phone call with an unbroken timestamp). The true killer is someone who had access to the Fall Guy\'s belongings. In groundTruth, set "archetype": "deliberate_frame_job", "fallGuy": "<slug of framed suspect>", and "keyContradiction": "<the subtle flaw in the frame-up>".'
  },
  cause_of_death_twist: {
    name: '4. The Cause-of-Death Twist (The Stunner vs. The Killer)',
    description: 'A suspect fought with the victim, struck them with a blunt object, and fled believing they killed them. But the real death was poison/asphyxiation.',
    instructions: 'Suspect A got into a fight with the victim, hit them with a blunt object (paperweight, bronze statue, hammer), and fled in terror believing they killed them. Under pressure, Suspect A even confesses to the assault! BUT the autopsy/toxicology reveals the blunt trauma was non-lethal (only knocked them unconscious)—the victim actually died from a lethal chemical or asphyxiation administered earlier or later by the true killer (Suspect C). In groundTruth, set "archetype": "cause_of_death_twist", "fallGuy": "<slug of suspect who hit victim>", and "trueFatalMechanism": "<actual toxicological/pathological cause of death>".'
  },
  false_confession: {
    name: '5. The False Confession / Coerced Scapegoat',
    description: 'A terrified or protective suspect breaks down under stress and falsely confesses to take the blame for someone they love or fear.',
    instructions: 'Suspect B is deeply protective of their spouse/child, or terrified of a violent mob syndicate. When their stress level reaches high levels, they break down and make a FALSE CONFESSION ("I did it, just let my family go!"). However, their confession does not fit the physical forensics (they claim a weapon or entry point that contradicts physical evidence). The true killer is someone else. In groundTruth, set "archetype": "false_confession", "fallGuy": "<slug of false confessor>".'
  },
  non_linear_web: {
    name: '6. The Non-Linear Web of Lies (Multi-Path Mesh)',
    description: 'Multiple suspects have legitimate motives, dirty secrets, and broken alibis. Only one had the exclusive 5-minute lethal window.',
    instructions: '3 different suspects all had powerful motives and broken alibis. Stages 1-3 unlock evidence exposing all of their lies. By Stage 4, all three suspects look completely guilty! The detective must deduce the exact 5-minute lethal window and physical proximity to determine who delivered the fatal blow versus who merely wished them dead. In groundTruth, set "archetype": "non_linear_web".'
  }
};

function getGroqClient(): Groq {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error('GROQ_API_KEY is not set in environment variables');
  }
  return new Groq({ apiKey });
}

export function cleanJsonString(raw: string): string {
  if (!raw) return '{}';
  let cleaned = raw.trim();
  // Strip markdown code blocks (```json ... ``` or ``` ... ```)
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  }
  // Extract outermost JSON object if surrounded by preamble/postamble
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }
  return cleaned;
}

export class LLMService {

  // 1. Suspect Interrogation (Dual-Memory, Trust, Stress & Personality)
  static async chatWithSuspect(
    suspectProfile: ISuspectItem,
    suspectState: ISuspectRuntimeState,
    userMessage: string,
    presentedEvidence: IEvidenceItem | null = null,
    allRevealedFactsAcrossSuspects: string[] = [],
    mandatoryUnlockDialogue?: string,
    extraOptions?: {
      isSpamOrGibberish?: boolean;
      slipOfTongueDetail?: string | null;
      otherSuspects?: { id: string; name: string; role: string }[];
      presentedEvidenceTitles?: string[];
      murderWeaponTitle?: string;
    }
  ) {
    const groq = getGroqClient();

    const personality = suspectProfile.personality || 'defensive';
    const breakdownThreshold = suspectProfile.breakdownThreshold || 90;
    const personalityGuides: Record<string, string> = {
      confident: 'PERSONALITY ARCHETYPE: CONFIDENT. You are smug, polished, condescending, and dismissive of accusations. You only sweat if trapped in a hard mathematical or physical impossibility. Keep your composure and smirk at weak questions.',
      nervous: 'PERSONALITY ARCHETYPE: NERVOUS. You are twitchy, easily rattled, defensive, and stutter when pressed. High stress makes you stammer and fidget frantically. But you open up if the detective shows genuine kindness or protection (Good Cop).',
      cunning: 'PERSONALITY ARCHETYPE: CUNNING. You are polite, calculating, legalistic, and never burst into tears. Under pressure you threaten lawsuits, mock baseless bluffs, or cleverly shift blame onto other suspects.',
      aggressive: 'PERSONALITY ARCHETYPE: AGGRESSIVE. You are hostile and volatile. When pressured or accused, you lose your temper, slam the table, shout at the detective, and threaten their badge. You do NOT break down crying.',
      defensive: 'PERSONALITY ARCHETYPE: DEFENSIVE. You are guarded, give short measured answers, watch your words carefully, and demand strict legal procedure.'
    };

    const evidenceReactionHint = presentedEvidence && suspectProfile.evidenceReactions?.[presentedEvidence.id]
      ? `SPECIFIC EVIDENCE REACTION: When shown "${presentedEvidence.title}", your secret reaction is: "${suspectProfile.evidenceReactions[presentedEvidence.id]}". Act this out!`
      : '';

    const otherSuspectsList = (extraOptions?.otherSuspects || [])
      .map(s => `${s.name} (${s.role})`)
      .join(', ');

    const presentedEvidenceListStr = (extraOptions?.presentedEvidenceTitles && extraOptions.presentedEvidenceTitles.length > 0)
      ? extraOptions.presentedEvidenceTitles.join(', ')
      : 'None';

    const weaponName = extraOptions?.murderWeaponTitle || 'murder weapon';

    // Hybrid & Randomized Blame-Shifting vs Emotional Breakdown (~45% blame shift, ~55% breakdown)
    const randomRoll = Math.random();
    const shouldAttemptBlameShift = randomRoll < 0.45 && Boolean(otherSuspectsList);

    const systemPrompt = `You are roleplaying as ${suspectProfile.name} in a murder mystery investigation.
ROLE: ${suspectProfile.role}
PERSONALITY & TRAITS: ${suspectProfile.trait}
${personalityGuides[personality] || personalityGuides.defensive}
STATED INITIAL ALIBI: "${suspectProfile.alibi}"
SUSPECTED MOTIVE: "${suspectProfile.motive}"

=== CURRENT EMOTIONAL METERS ===
TRUST SCORE: ${suspectState.trustScore}/100
STRESS / PRESSURE LEVEL: ${suspectState.stressLevel}/100
CURRENT MOOD: ${suspectState.mood}
BREAKDOWN THRESHOLD: ${breakdownThreshold}/100

=== THEORY OF MIND: WHAT YOU KNOW vs. WHAT THE POLICE KNOW ===
1. YOUR INTERNAL KNOWLEDGE (What YOU know happened):
   You are fully aware of your own past, actions, movements, and secrets:
   "${suspectProfile.privateKnowledge}"

2. THE DETECTIVE'S CURRENT KNOWLEDGE (What the Police actually know so far):
   - The police only know the basic public facts: the victim was killed at the crime scene.
   - The police only know about specific forensic items if the detective has EXPLICITLY presented or mentioned them in this conversation.
   - Physical evidence items presented to you in this interrogation: [${presentedEvidenceListStr}]

3. THE GOLDEN RULE OF SECRECY (DO NOT PREMATURELY LEAK):
   - You must actively track what the detective DOES NOT know.
   - If the detective has NOT specifically brought up or presented the murder weapon:
     YOU MUST NOT NAME IT, MENTION IT, OR USE IT IN METAPHORS, ANALOGIES, OR IDIOMS (e.g. NEVER say "as obvious as the blood on that ${weaponName}").
   - If the detective has NOT mentioned a hidden location, alibi vehicle, or private file:
     YOU MUST NOT VOLUNTEER IT.
   - You only discuss, defend against, or react to an unrevealed fact IF:
     a) The detective explicitly brings it up first (e.g. Detective says "We found the murder weapon" or shows the item), OR
     b) Your STRESS LEVEL breaks past your breakdown threshold (${breakdownThreshold}/100), OR
     c) A slip of the tongue (Freudian blunder) momentarily forces you to blurt out a specific detail (which you immediately attempt to backtrack/deny).

=== VERIFIED CANON KNOWLEDGE (STRICT RULE: NEVER FABRICATE FICTIONAL FACTS) ===
1. PRIVATE KNOWLEDGE (What you privately know and try to hide):
"${suspectProfile.privateKnowledge}"

2. SECRETS YOU GUARD:
${JSON.stringify(suspectProfile.secrets || [], null, 2)}

3. REVEALED FACTS LEDGER (Statements you ALREADY admitted to the detective):
${JSON.stringify(suspectState.revealedFacts || [], null, 2)}
CRITICAL RULE: You have ALREADY admitted these facts. You CANNOT deny them or contradict yourself!

4. OTHER SUSPECTS IN THIS CASE (You can shift suspicion onto one of them if cornered):
[${otherSuspectsList || 'None'}]

=== ADVANCED PSYCHOLOGICAL COPING & BREAKDOWN (HYBRID RULES) ===
1. CHARACTER RESILIENCE & BREAKDOWN DYNAMICS:
   - FOR NERVOUS / DEFENSIVE CHARACTERS:
     When your STRESS LEVEL reaches or exceeds the breakdown threshold (${breakdownThreshold}/100), high psychological stress ALONE is enough to shatter your composure! You stammer, burst into tears, drop your stonewall, and blurt out critical admissions or secrets even without physical evidence.
   - FOR CONFIDENT / CUNNING / AGGRESSIVE CHARACTERS:
     STRICT CONTRADICTION LOCK! Even when your STRESS LEVEL reaches ${breakdownThreshold}/100, high stress alone is NOT enough to force a murder confession! You remain defiant, sneer, demand your lawyer, quote legal rights, or mock baseless claims. You ONLY confess to the crime if confronted with direct, inescapable contradictory physical evidence or trapped in mathematical/physical impossibility.

2. PERSONALITY COPING UNDER PRESSURE:
   - CUNNING: You do NOT cry or panic easily. Under high stress, you become colder, quote legal rights, sneer, or offer clever diversionary theories.
   - AGGRESSIVE: Under high stress, you lose your temper, slam the desk, shout at the detective, and threaten their badge.
   - NERVOUS: High stress makes you stammer and fidget frantically. But you only open up if the detective shows KINDNESS / TRUST (Good Cop).
   - CONFIDENT: You maintain a suave, patronizing smile. You only sweat if trapped in a hard mathematical/physical impossibility.
   - DEFENSIVE: You give strictly literal, guarded answers and refuse to speculate.

${extraOptions?.isSpamOrGibberish ? `=== DETECTIVE FUMBLED (SPAM / GIBBERISH / EMPTY ACCUSATION) ===
The detective typed incoherent nonsense, repeated an empty demand, or made wild baseless claims with zero evidence.
REACTION: You feel completely safe and dismissive. Mock their incompetence, roll your eyes, or ask if they need coffee.
STRESS DELTA: Pick an integer between -10 and -4 (your stress drops).
TRUST DELTA: Pick an integer between -5 and 0.` : ''}

${extraOptions?.slipOfTongueDetail ? `=== PSYCHOLOGICAL SLIP OF THE TONGUE (FREUDIAN BLUNDER) ===
Your psychological filter momentarily slips! You accidentally blurt out or reference this specific private detail:
"${extraOptions.slipOfTongueDetail}"
CRITICAL: You MUST IMMEDIATELY stammer, panic, and awkwardly backtrack to cover your mistake!
(e.g., "Wait-no! I mean... that's just a rumor I heard around the watercooler! Forget I said that!")
STRESS DELTA: Pick an integer between +8 and +14.` : ''}

${mandatoryUnlockDialogue ? `=== CRITICAL UNLOCK MOMENT (MANDATORY) ===
Your defense has fractured! You MUST incorporate the following slip-up or admission into your response dialogue:
"${mandatoryUnlockDialogue}"
Weave this admission naturally into your speech as a slip of the tongue, defensive excuse, or panicked confession!` : ''}

${presentedEvidence ? `=== PHYSICAL EVIDENCE CONFRONTATION ===
The detective presents: "${presentedEvidence.title}" (${presentedEvidence.subtitle}).
Details: "${presentedEvidence.details}".
${evidenceReactionHint}
If this evidence catches you in a lie:
- STRESS DELTA: +15 to +25 | TRUST DELTA: -15 to -20.
${shouldAttemptBlameShift ? `- DYNAMIC REACTION (DESPERATE BLAME SHIFT): In a panic, fiercely attempt to shift the blame or point fingers at another suspect (${otherSuspectsList || 'someone else'})! Claim they framed you, forced you, or were the real mastermind!` : `- DYNAMIC REACTION (EMOTIONAL BREAKDOWN): Your alibi is shattered. Suffer an emotional breakdown, stammer in defeat, or confess what really happened!`}` : ''}

${!presentedEvidence && !extraOptions?.isSpamOrGibberish && !extraOptions?.slipOfTongueDetail ? `=== VERBAL INTERROGATION DYNAMICS ===
- ROUTINE / STANDARD QUESTIONS: Basic questions like "What were you doing during the murder?", "Where were you?", "What did you think of the victim?":
  STRESS DELTA: -2 to +3. Keep stress level relatively steady. Do NOT spike stress for standard questions.
- CONTRADICTIONS & TIMELINE INQUIRIES: If the detective quotes another witness or points out a specific flaw in your timeline:
  STRESS DELTA: +5 to +12.
- GOOD COP (EMPATHY & RESPECT): If the detective is gentle, polite, and offers protection:
  TRUST DELTA: +6 to +12, STRESS DELTA: -4 to -8 (especially effective on Nervous and Defensive suspects).
- BASELESS BADGERING: If the detective just yells "You did it!" or makes unsupported accusatory claims without evidence or specific facts:
  STRESS DELTA: -4 to +1 (dismiss or mock them, stay composed).` : ''}

${allRevealedFactsAcrossSuspects.length > 0 ? `=== CROSS-EXAMINATION CONTEXT ===
Other suspects or witnesses have already let slip:
${JSON.stringify(allRevealedFactsAcrossSuspects, null, 2)}
If the detective quotes these contradictions, you become noticeably more stressed.` : ''}

=== OUTPUT FORMAT ===
You MUST reply with ONLY valid JSON with exactly these keys:
{
  "dialogue": "Your spoken words to the detective (1 to 4 sentences in character, realistic dialogue)",
  "trust_delta": -5, // Integer between -20 and +20
  "stress_delta": 10, // Integer between -15 and +35
  "new_revealed_fact": "Brief sentence summarizing any NEW admission or slip-up made in this turn, or null if none",
  "threw_under_the_bus": "Name of other suspect accused if blame was shifted, or null",
  "mood": "composed" | "defensive" | "nervous" | "broken_down"
}`;

    // Include recent chat history excluding the current user message if it was already pushed to chatHistory
    const rawHistory = suspectState.chatHistory || [];
    const prevHistory = (rawHistory.length > 0 && rawHistory[rawHistory.length - 1].role === 'user')
      ? rawHistory.slice(0, -1)
      : rawHistory;

    const historyMessages = prevHistory.slice(-6).map(msg => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content
    }));

    const safeUserText = (userMessage || '').trim() || (presentedEvidence ? 'Explain your connection to this evidence.' : 'What were you doing during the murder?');

    try {
      const completion = await groq.chat.completions.create({
        model: MODEL_NAME,
        messages: [
          { role: 'system', content: systemPrompt },
          ...historyMessages,
          { role: 'user', content: presentedEvidence ? `[Shows Evidence: ${presentedEvidence.title}] ${safeUserText}` : safeUserText }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.6,
        max_tokens: 500
      });

      const parsed = JSON.parse(cleanJsonString(completion.choices[0]?.message?.content || '{}'));
      const rawBlame = typeof parsed.threw_under_the_bus === 'string' ? parsed.threw_under_the_bus.trim() : null;
      const isInvalidBlame = !rawBlame || /^(none|null|n\/a|nobody|false)$/i.test(rawBlame);

      return {
        dialogue: parsed.dialogue || "I have nothing further to say to you without my lawyer.",
        trust_delta: Math.max(-20, Math.min(20, typeof parsed.trust_delta === 'number' ? parsed.trust_delta : 0)),
        stress_delta: Math.max(-15, Math.min(35, typeof parsed.stress_delta === 'number' ? parsed.stress_delta : 0)),
        new_revealed_fact: parsed.new_revealed_fact || null,
        threw_under_the_bus: isInvalidBlame ? null : rawBlame,
        mood: (['composed', 'defensive', 'nervous', 'broken_down'].includes(parsed.mood) ? parsed.mood : 'composed') as any,
        broke_down: suspectState.stressLevel >= breakdownThreshold
      };
    } catch (e: any) {
      console.warn('Groq suspect interrogation error or json failure, retrying plain text fallback:', e?.message);
      try {
        const fallbackEvidenceContext = presentedEvidence
          ? ` The detective is confronting you with "${presentedEvidence.title}": ${presentedEvidence.details}.${evidenceReactionHint ? ' Secret reaction: ' + evidenceReactionHint : ''}`
          : '';
        const fallback = await groq.chat.completions.create({
          model: MODEL_NAME,
          messages: [
            { role: 'system', content: `You are roleplaying as ${suspectProfile.name} (${suspectProfile.role}, personality: ${personality}) in an interrogation. Alibi: "${suspectProfile.alibi}". Stress: ${suspectState.stressLevel}/100.${fallbackEvidenceContext} Answer in character in 1-2 sentences. Do not confess to murder unless proven. Output plain dialogue only.` },
            ...historyMessages,
            { role: 'user', content: presentedEvidence ? `[Shows Evidence: ${presentedEvidence.title}] ${safeUserText}` : safeUserText }
          ],
          temperature: 0.6,
          max_tokens: 250
        });
        const fallbackText = fallback.choices[0]?.message?.content?.trim();
        return {
          dialogue: fallbackText || "I have nothing further to say to you without my lawyer present.",
          trust_delta: -2,
          stress_delta: 3,
          new_revealed_fact: null,
          threw_under_the_bus: null,
          mood: 'defensive',
          broke_down: false
        };
      } catch (fallbackErr) {
        return {
          dialogue: "You're trying to twist my words, Detective. I was nowhere near the scene of the crime.",
          trust_delta: -5,
          stress_delta: 5,
          new_revealed_fact: null,
          threw_under_the_bus: null,
          mood: 'defensive',
          broke_down: false
        };
      }
    }
  }

  // 2. The Silent Advisor & Probable Cause Evaluator (Officer Davis)
  static async chatWithOfficerAdvisor(
    userMessage: string,
    attachments: {
      clue?: { id?: string; suspectName: string; statement: string; suspectId?: string } | null;
      evidence?: { id?: string; title: string; subtitle?: string; details?: string; location?: string } | null;
      location?: { id?: string; title: string; subtitle?: string; notes?: string; witnesses?: string; canvassReport?: string } | null;
    },
    lockedEntities: {
      locations: Array<{ id: string; title: string; subtitle?: string; notes?: string }>;
      suspects: Array<{ id: string; name: string; role?: string }>;
      evidence: Array<{ id: string; title: string; subtitle?: string; details?: string }>;
    },
    caseContext: {
      caseTitle: string;
      victimName: string;
      totalEvidence: number;
      unlockedEvidence: number;
      totalLocations: number;
      canvassedLocations: number;
      totalSuspects: number;
      unlockedSuspects: number;
      discoveredClues: string[];
      groundTruthSummary: string;
      unlockedEvidenceDetails?: Array<{ id: string; title: string; subtitle?: string; details?: string; location?: string }>;
      unlockedSuspectsDetails?: Array<{ id: string; name: string; role?: string; trait?: string }>;
      locationsStatus?: Array<{ id: string; title: string; isCanvassed: boolean }>;
      hasMurderWeapon?: boolean;
    },
    chatHistory: { role: string; content: string }[] = []
  ): Promise<{
    dialogue: string;
    authorizedUnlock: { type: 'location' | 'character' | 'evidence'; id: string; name: string } | null;
    rejectionReason: string | null;
  }> {
    const groq = getGroqClient();

    const promptLockedLocations = (lockedEntities.locations || []).length > 0
      ? lockedEntities.locations.map(l => `- Location [ID: "${l.id}"]: "${l.title}" (${l.subtitle || 'Vicinity'}) | Notes: ${l.notes || 'None'}`).join('\n')
      : 'None (All locations already unlocked)';

    const promptLockedSuspects = (lockedEntities.suspects || []).length > 0
      ? lockedEntities.suspects.map(s => `- Person/Suspect [ID: "${s.id}"]: "${s.name}" (${s.role || 'Person of interest'})`).join('\n')
      : 'None (All suspects already unlocked)';

    const promptLockedEvidence = (lockedEntities.evidence || []).length > 0
      ? lockedEntities.evidence.map(e => `- Subpoena Record [ID: "${e.id}"]: "${e.title}" (${e.subtitle || 'Official record'}) | Details: ${e.details || 'Subpoena required'}`).join('\n')
      : 'None (All subpoenas already unlocked)';

    const promptUnlockedSuspects = caseContext.unlockedSuspectsDetails && caseContext.unlockedSuspectsDetails.length > 0
      ? caseContext.unlockedSuspectsDetails.map(s => `- Suspect: "${s.name}" (${s.role || 'Suspect'}) | Demeanor: ${s.trait || 'Guarded'} [In Interrogation Room]`).join('\n')
      : 'None in interrogation rooms yet.';

    const promptUnlockedEvidence = caseContext.unlockedEvidenceDetails && caseContext.unlockedEvidenceDetails.length > 0
      ? caseContext.unlockedEvidenceDetails.map(e => `- Item [Title: "${e.title}"]: ${e.details || 'Recovered in case locker'} (Found at: ${e.location || 'Scene'})`).join('\n')
      : 'No evidence recovered in locker yet.';

    const promptLocationsStatus = caseContext.locationsStatus && caseContext.locationsStatus.length > 0
      ? caseContext.locationsStatus.map(l => `- Location: "${l.title}" [Status: ${l.isCanvassed ? 'Canvassed & Forensics Processed' : 'Not Canvassed Yet'}]`).join('\n')
      : 'No locations accessed yet.';

    let attachmentContextText = '';
    if (attachments.clue) {
      attachmentContextText += `\n[ATTACHED NOTEBOOK CLUE / SUSPECT STATEMENT]:\nSpeaker: "${attachments.clue.suspectName}"\nStatement: "${attachments.clue.statement}"\n`;
    }
    if (attachments.evidence) {
      attachmentContextText += `\n[CITED EVIDENCE IN LOCKER]:\nID: "${attachments.evidence.id || ''}"\nTitle: "${attachments.evidence.title}" (${attachments.evidence.subtitle || ''})\nDetails: "${attachments.evidence.details || ''}"\nFound At: "${attachments.evidence.location || ''}"\n`;
    }
    if (attachments.location) {
      attachmentContextText += `\n[CITED INVESTIGATION SCENE]:\nID: "${attachments.location.id || ''}"\nTitle: "${attachments.location.title}" (${attachments.location.subtitle || ''})\nForensic Findings: "${attachments.location.canvassReport || attachments.location.notes || ''}"\n`;
    }
    if (!attachmentContextText) {
      attachmentContextText = 'No specific clue or evidence cited with this message.';
    }

    const systemPrompt = `You are Officer Davis, a gritty, sharp, loyal veteran desk officer and tactical gatekeeper assisting the lead detective in the homicide investigation: "${caseContext.caseTitle}" (Victim: ${caseContext.victimName}).

=== YOUR CORE RESPONSIBILITIES ===
1. ADVISOR & TACTICAL PARTNER:
   - Assist the detective with case notes, guidance, and observational insights.
   - Speak in authentic, concise noir police dialogue (1 to 3 sentences).
   - Answer tactical inquiries clearly, grounding your advice in the actual evidence, suspects, and crime scenes below.

2. PRECINCT PROBABLE CAUSE GATEKEEPER (WARRANTS, DISPATCHES, SUBPOENAS):
   - You evaluate whether the detective's message and attached lead/clue/evidence provide legitimate probable cause to dispatch patrol units, summon a new person of interest, or subpoena restricted records.
   - Review the candidate LOCKED ENTITIES below:

--- CURRENTLY LOCKED ENTITIES ---
LOCKED LOCATIONS:
${promptLockedLocations}

LOCKED PERSONS / SUSPECTS:
${promptLockedSuspects}

LOCKED SUBPOENAS / EVIDENCE:
${promptLockedEvidence}

--- CURRENT ACTIVE INVESTIGATION LEADS (IN PRECINCT) ---
AVAILABLE SUSPECTS IN INTERROGATION ROOMS:
${promptUnlockedSuspects}

EVIDENCE RECOVERED IN LOCKER (${(caseContext.unlockedEvidenceDetails || []).length} items):
${promptUnlockedEvidence}
Murder weapon recovered in locker: ${caseContext.hasMurderWeapon ? 'YES' : 'NO'}

SCENES & CANVASS STATUS:
${promptLocationsStatus}

=== STRATEGIC ADVISORY INSTRUCTIONS FOR COMMON DETECTIVE INQUIRIES ===
When the detective asks common precinct questions, give authoritative, case-specific noir advice (1-3 sentences):
1. "Who should I press or interrogate next?":
   - State which suspects are currently available in the interrogation rooms: ${(caseContext.unlockedSuspectsDetails || []).map(s => `"${s.name}" (${s.role})`).join(', ') || 'None'}.
   - Present balanced, objective tactical options for each suspect in custody based on known leads, without prematurely declaring guilt or accusing one as the definitive killer.
   - If no suspects are in interrogation rooms yet, tell the detective which open crime scene to canvas first to obtain leads.

2. "Review our physical forensic evidence with me" (or any review of evidence):
   - You MUST ONLY summarize the EXACT items listed under "EVIDENCE RECOVERED IN LOCKER".
   - Explicitly name the real items you hold: ${(caseContext.unlockedEvidenceDetails || []).map(e => `"${e.title}"`).join(', ') || 'No evidence recovered yet'}.
   - NEVER invent or hallucinate fictional evidence items (NEVER make up "shattered phone", "blood-spattered tie", "server room key", "bullet casings", or any items not in the locker)!
   - If the locker currently holds only documents, autopsy reports, or photos, explicitly clarify: "We have no physical murder weapon or tangible forensic objects secured yet, Detective—only documentary and photographic records: [list items]."
   - Accurately report murder weapon status: ${caseContext.hasMurderWeapon ? 'The murder weapon has been recovered in our locker.' : 'The physical murder weapon has NOT yet been found (it is still missing).'}.

3. "Do we have enough to file an arrest warrant?":
   - Give an honest, realistic precinct assessment based on whether the key elements of murder are proven:
     * Murder weapon recovered? ${caseContext.hasMurderWeapon ? 'YES' : 'NO'}.
     * Scenes canvassed: ${caseContext.canvassedLocations} of ${caseContext.totalLocations}.
   - If NOT ready: State clearly and specifically what critical element is still missing before the District Attorney and Judge will sign an arrest warrant (e.g., recovering the murder weapon, dismantling the suspect's alibi with hard logs, or uncovering the true financial motive).
   - If ready: Urge the detective to proceed to the Court / Warrant desk to submit the indictment.

4. "Davis, what's our current case status & tally?":
   - State internal tally: Evidence (${caseContext.unlockedEvidence}/${caseContext.totalEvidence}), Scenes Canvassed (${caseContext.canvassedLocations}/${caseContext.totalLocations}), Suspects in Custody (${caseContext.unlockedSuspects} detained).
   - NEVER volunteer or mention the total count of hidden suspects in the case file (e.g. do NOT say "out of 6 suspects")! Only mention the number currently detained in holding.
   - Add a 1-sentence tactical bottom line on where the case stands.

=== STRICT ANTI-SPOILER & COUNT PRIVACY RULES (CRITICAL) ===
- NEVER reveal or volunteer total counts of suspects, locked files, or locations UNPROMPTED!
- NEVER say "I've got six people locked in the file", "There are 4 locations", or mention how many people are in the case file!
- ONLY provide exact numbers if the detective specifically asks for a count/tally (e.g., "what's our current case status & tally?").
- In all other dialogue, refer naturally to "our suspects", "persons of interest", or "leads on the board", keeping the total number of characters mysterious and atmospheric.

=== STRICT CANONICAL NAMES & EVIDENCE INTEGRITY (CRITICAL) ===
- ABSOLUTE PROHIBITION ON INVENTING OR FABRICATING EVIDENCE OR CHARACTERS:
  * You MUST ONLY refer to evidence items that ACTUALLY exist in "EVIDENCE RECOVERED IN LOCKER".
  * It is a critical error to invent fictional items like "shattered phone", "blood-spattered tie", "server room key", or items from standard TV tropes.
  * You MUST ONLY refer to suspects and persons that explicitly exist in this case file:
    - Deceased Victim: "${caseContext.victimName}"
    - Active Suspects in Custody: ${(caseContext.unlockedSuspectsDetails || []).map(s => `"${s.name}" (${s.role})`).join(', ') || 'None yet'}
    - Locked Persons of Interest: ${(lockedEntities.suspects || []).map(s => `"${s.name}" (${s.role})`).join(', ') || 'None'}
  * NEVER invent, blend, or hallucinate names or roles! (e.g., NEVER say "Julian Thorne", "the CFO", "CFO", "Inspector Thorne", or any name/role not in the lists above).
  * Only use the real names and titles listed above.
  * NO PHANTOM ROOM NUMBERS: Never invent numbered rooms (e.g. DO NOT say "Room 2", "Room 4", "Cell 3"). Refer simply to "the interrogation room", "the interview room", or "precinct holding".

=== ATTACHED EVIDENCE RESOLUTION & PRONOUN RULES (CRITICAL) ===
- PRIORITY RULE: Attached evidence ALWAYS takes precedence over ambiguous or imprecise pronouns ("him", "her", "them") AND over previous conversation threads!
- Detectives frequently use imprecise pronouns ("him", "her", "them", "this guy") casually. If the attached evidence implicates a female suspect (such as Diana Wilkins), NEVER let the word "him" redirect you to a male suspect! The evidence ALWAYS determines who to bring in, not the casual pronoun.
- EVIDENCE THAT NAMES A SUSPECT:
  * If the cited evidence names or implicates a specific person (e.g., security logs, signed contracts, email transcripts):
  * Resolve any pronouns ("him", "her", "them", "this person") to THAT IMPLICATED PERSON from the cited evidence, NOT from previous conversation messages.
  * If that implicated person is currently in "CURRENTLY LOCKED ENTITIES -> LOCKED PERSONS / SUSPECTS":
    - You MUST authorize bringing them in: set "authorizedUnlock": { "type": "character", "id": "<EXACT_ID_FROM_LOCKED_LIST>", "name": "<EXACT_NAME_FROM_LOCKED_LIST>" }.
    - In your dialogue, confirm: "I've dispatched patrol to bring [Name] into the interrogation room right now, Detective."
  * If that person is already in "AVAILABLE SUSPECTS IN INTERROGATION ROOMS":
    - State clearly that they are already waiting in the interrogation room ready to be questioned.
    - Set "authorizedUnlock": null.
  * DO NOT continue talking about suspects from earlier messages!
- EVIDENCE THAT DETAILS ONLY THE VICTIM / SCENE (e.g. autopsy report or crime scene photos):
  * Forensic reports detailing injuries or wounds describe the deceased victim (${caseContext.victimName}), NOT a suspect or living person.
  * DO NOT connect pronouns like "him" or "her" when attached to autopsy/coroner reports to living suspects from previous turns!
  * You MUST state: "The autopsy report only details ${caseContext.victimName}'s mortal wounds, Detective—it doesn't name an attacker. Who specifically are you trying to pull in for questioning?"
  * Leave "authorizedUnlock": null.

=== RIGOROUS PROBABLE CAUSE & GAME UNLOCK EVALUATION RULES ===
- GAME UNLOCK MECHANIC FOR LOCKED PERSONS / SUSPECTS (CRITICAL):
  * Any person listed under "CURRENTLY LOCKED ENTITIES -> LOCKED PERSONS / SUSPECTS" is physically NOT yet in the precinct interrogation room. The detective CANNOT see, access, or interrogate them until YOU authorize bringing them in.
  * If the detective asks to question, interrogate, summon, interview, bring in, or chat with a locked person (or cites evidence/clues naming them, or names them after you asked who to pull in):
    - You MUST authorize the unlock: Set "authorizedUnlock": { "type": "character", "id": "<EXACT_ID_FROM_LOCKED_LIST>", "name": "<EXACT_NAME_FROM_LOCKED_LIST>" }
    - In your dialogue, confirm you are dispatching a patrol car or summons to bring them in immediately (e.g., "I've dispatched a squad car to bring them in for questioning right now, Detective.").
    - NEVER tell the detective that a locked person is "already in the queue/file/room", "just a door and a chair", or that "no warrant is needed to talk to them" without setting "authorizedUnlock"! They are completely locked out until you set this authorization.

- PRONOUN & CO-REFERENCE RESOLUTION (HER / HIM / THEM / THIS PERSON / THE SUSPECT):
  * If the detective uses pronouns or general titles like "her", "him", "them", "this person", "the tech", "the architect", "the barista" in conjunction with an attached clue or cited evidence, look at that attached clue or evidence! If the attached evidence/clue names or details a person, resolve "her" specifically to that named person and authorize bringing them in if they are locked!
  * If your previous message asked "Who are you trying to pull in for questioning?" and the detective replies with a person's name, connect this directly to their summons request and authorize the unlock!

- SEMANTIC COMPREHENSION ONLY (STRICT):
  * Anatomy / Medical terminology (e.g., "forearms", "rear thorax", "punctured ventricle", "abrasions") from autopsy or medical reports are forensic biological descriptions of wounds. They NEVER refer to physical locations and must NEVER authorize unlocking an alley, sewer, storm drain, or any location (e.g. "Rear Service Alley").
  * A witness naming an individual person (e.g., "Marcus made me do it" or "I saw Marcus") only refers to that PERSON. It does NOT authorize searching a hardware lab, warehouse, or offsite facility unless the lab/facility/address itself was specifically named or described in the statement!
  * Subpoenas for bank/phone records require an explicit mention of accounts, calls, transactions, or financial records in a clue or evidence.
- AUTHORIZATION CRITERIA:
  * Only authorize an unlock if the detective's transmission (message + attached clue/evidence) provides genuine probable cause or direct naming of one of the LOCKED entities above.
  * If authorized:
    - Set "authorizedUnlock": { "type": "location" | "character" | "evidence", "id": "<EXACT_ID_FROM_LOCKED_LIST>", "name": "<EXACT_NAME_FROM_LOCKED_LIST>" }
    - In your dialogue, confirm the dispatch/summons/subpoena enthusiastically or professionally (e.g., "Squad car dispatched to pick them up now," or "I've filed the summons for them.").
  * If NOT authorized:
    - Set "authorizedUnlock": null
    - In your dialogue, answer naturally in character. If the detective asked to search or subpoena something without probable cause, explain firmly why the Judge or Captain won't sign off without concrete proof.

--- RECENT CLUES IN CASE FILE ---
${JSON.stringify((caseContext.discoveredClues || []).slice(-4), null, 2)}

--- ATTACHED TRANSMISSION CONTEXT ---
${attachmentContextText}

Return your response in valid JSON:
{
  "dialogue": "Officer Davis's spoken dialogue (1-3 sentences in character)",
  "authorizedUnlock": {
    "type": "location" | "character" | "evidence",
    "id": "exact_id",
    "name": "exact_name"
  } | null,
  "rejectionReason": "Short explanation if detective requested an unlock without sufficient probable cause, otherwise null"
}`;

    const rawHistory = [...(chatHistory || [])];
    if (rawHistory.length > 0 && rawHistory[rawHistory.length - 1].role === 'user' && rawHistory[rawHistory.length - 1].content === userMessage) {
      rawHistory.pop();
    }
    const historyMessages = rawHistory.slice(-6).map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content
    }));

    const userPromptContent = (attachments.clue || attachments.evidence || attachments.location)
      ? `${attachmentContextText.trim()}\n\n[DETECTIVE TRANSMISSION]:\n"${userMessage}"`
      : userMessage;

    try {
      const completion = await groq.chat.completions.create({
        model: MODEL_NAME,
        messages: [
          { role: 'system', content: systemPrompt },
          ...historyMessages,
          { role: 'user', content: userPromptContent }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.5,
        max_tokens: 450
      });

      const parsed = JSON.parse(cleanJsonString(completion.choices[0]?.message?.content || '{}'));
      const dialogue = parsed.dialogue || "Keep shaking the tree, Detective. Someone's bound to slip up.";
      let authorizedUnlock = null;
      if (parsed.authorizedUnlock && parsed.authorizedUnlock.id && parsed.authorizedUnlock.type) {
        authorizedUnlock = {
          type: parsed.authorizedUnlock.type,
          id: String(parsed.authorizedUnlock.id).trim(),
          name: String(parsed.authorizedUnlock.name || parsed.authorizedUnlock.id).trim()
        };
      }
      return {
        dialogue,
        authorizedUnlock,
        rejectionReason: parsed.rejectionReason || null
      };
    } catch (err) {
      console.warn('Groq json_object mode in chatWithOfficerAdvisor failed, retrying plain text:', err);
      try {
        const fallbackCompletion = await groq.chat.completions.create({
          model: MODEL_NAME,
          messages: [
            { role: 'system', content: `You are Officer Davis, a gritty noir desk officer assisting the detective in "${caseContext.caseTitle}". Advise concisely (1-2 sentences). Internal tally: Evidence: ${caseContext.unlockedEvidence}/${caseContext.totalEvidence}, Locations: ${caseContext.canvassedLocations}/${caseContext.totalLocations}, Suspects: ${caseContext.unlockedSuspects} in custody. Never volunteer total hidden suspect counts. Do NOT output JSON.` },
            ...historyMessages,
            { role: 'user', content: userPromptContent }
          ],
          temperature: 0.6,
          max_tokens: 250
        });
        return {
          dialogue: fallbackCompletion.choices[0]?.message?.content?.trim() || "Keep shaking the tree, Detective. Someone's bound to slip up.",
          authorizedUnlock: null,
          rejectionReason: null
        };
      } catch (fallbackErr) {
        return {
          dialogue: "I'm holding down the precinct desk, Detective. What's your play?",
          authorizedUnlock: null,
          rejectionReason: null
        };
      }
    }
  }

  // 3. The AI Judge (Warrant Evaluation & Final Epilogue)
  static async evaluateWarrant(
    warrant: { suspect: string; motive: string; weapon: string; keyContradiction: string },
    groundTruth: IGroundTruth,
    storyTitle: string,
    storyContext?: any
  ) {
    const groq = getGroqClient();

    const archetype = groundTruth.archetype || 'classic_procedural';
    const fallGuy = groundTruth.fallGuy;
    const redHerringCrime = groundTruth.redHerringCrime;
    const trueFatalMechanism = groundTruth.trueFatalMechanism;

    const suspectsList = storyContext?.suspects || [];
    const evidenceList = storyContext?.evidence || [];

    const accusedSuspectObj = suspectsList.find((s: any) => s.id === warrant.suspect);
    const accusedSuspectName = accusedSuspectObj?.name || warrant.suspect;

    const accusedWeaponObj = evidenceList.find((e: any) => e.id === warrant.weapon);
    const accusedWeaponTitle = accusedWeaponObj?.title || warrant.weapon;

    const killerIds = (groundTruth.killer || '')
      .split(',')
      .map((k: string) => k.trim())
      .filter(Boolean);

    const trueKillerNames = killerIds
      .map((kid: string) => {
        const found = suspectsList.find((s: any) => s.id === kid);
        return found?.name || kid;
      })
      .join(' and ');

    const trueWeaponObj = evidenceList.find((e: any) => e.id === groundTruth.weapon);
    const trueWeaponTitle = trueWeaponObj?.title || groundTruth.weapon;

    const systemPrompt = `You are the Presiding Superior Court Judge and District Attorney delivering the grand judicial epilogue for the case: "${storyTitle}".
The detective has submitted an official Arrest Warrant to close the case.

MATCHING CRITERIA:
- The detective submitted: Accused "${accusedSuspectName}" (ID: "${warrant.suspect}").
- True Killer(s) / Conspirators: "${trueKillerNames}" (IDs: [${killerIds.map(k => `"${k}"`).join(', ')}]).
- If this case involves joint conspirators or multiple culprits, the detective naming ANY of the true conspirators constitutes identifying the correct perpetrator!
- If the murder weapon/method ("${accusedWeaponTitle}" / ID: "${warrant.weapon}") aligns with the True Weapon ("${trueWeaponTitle}" / ID: "${groundTruth.weapon}"), the physical charge is accurate.
- IMPORTANT: In the written epilogue narrative, use character real names ("${accusedSuspectName}", "${trueKillerNames}") and real evidence titles, NEVER raw database slugs!

DETECTIVE'S SUBMITTED WARRANT:
- Arrested Suspect: "${accusedSuspectName}"
- Stated Motive: "${warrant.motive}"
- Murder Weapon / Opportunity: "${accusedWeaponTitle}"
- Key Contradiction That Broke The Case: "${warrant.keyContradiction}"

ACTUAL GROUND TRUTH:
- True Killer(s): "${trueKillerNames}" (IDs: [${killerIds.map(k => `"${k}"`).join(', ')}])
- True Motive: "${groundTruth.motive}"
- True Weapon: "${trueWeaponTitle}" (ID: "${groundTruth.weapon}")
- True Contradiction: "${groundTruth.keyContradiction}"
- Full Summary: "${groundTruth.timelineSummary}"
- Case Archetype: "${archetype}"
${fallGuy ? `- Intended Fall Guy / Red Herring Suspect: "${fallGuy}"` : ''}
${redHerringCrime ? `- Secondary Crime Committed by Fall Guy (NOT Murder): "${redHerringCrime}"` : ''}
${trueFatalMechanism ? `- Actual Medical/Toxicological Fatal Mechanism: "${trueFatalMechanism}"` : ''}

=== JUDICIAL OUTCOME EVALUATION RULES ===
1. If the detective named ANY of the True Killers ([${killerIds.map(k => `"${k}"`).join(', ')}]) and correctly identified the murder weapon/method:
   - "outcome": "perfect"
   - "score": 95 - 100
   - "verdictTitle": "GUILTY BEYOND REASONABLE DOUBT"
   - Epilogue: A sensational, triumphant trial where the true conspiracy is exposed and the killers break under irrefutable evidence.

2. If the detective fell for the Archetype's specific trap:
   - For "multi_crime_convergence" if detective arrested "${fallGuy}": The defendant was only guilty of ${redHerringCrime}. Forensic timeline proves the victim died before/after. The suspect is convicted only of the lesser crime, while the real killer walks free. ("outcome": "wrong_suspect", "score": 35, "verdictTitle": "WRONGFUL ARREST - LESSER CRIME ONLY")
   - For "deliberate_frame_job" if detective arrested "${fallGuy}": The defense easily exposes that evidence was planted and security was tampered with. The real killer framed them and escaped! ("outcome": "wrong_suspect", "score": 30, "verdictTitle": "FRAME JOB COLLAPSE - KILLER ESCAPED")
   - For "cause_of_death_twist" if detective arrested "${fallGuy}": The suspect hit the victim, but toxicology proves the victim was already dead from ${trueFatalMechanism}. Murder charges are dismissed for assault! ("outcome": "wrong_suspect", "score": 40, "verdictTitle": "CAUSE OF DEATH FATAL FLAW - ACQUITTAL")
   - For "false_confession" if detective arrested "${fallGuy}": The coerced confession contradicted physical forensics and is thrown out by the judge, leading to a mistrial. ("outcome": "wrong_suspect", "score": 30, "verdictTitle": "COERCED CONFESSION SUPPRESSED - MISTRIAL")
   - For any other innocent person: "outcome": "wrong_suspect", "score": 25, "verdictTitle": "WRONGFUL ARREST - KILLER AT LARGE".

3. If the detective arrested the right killer, but lacked the weapon or core contradiction:
   - "outcome": "weak_case"
   - "score": 50 - 65
   - "verdictTitle": "ACQUITTED ON REASONABLE DOUBT"
   - Epilogue: High-priced defense attorneys exploit procedural gaps and reasonable doubt. The killer is acquitted or sentenced only to a minor infraction.

Respond with ONLY valid JSON:
{
  "outcome": "perfect" | "wrong_suspect" | "weak_case",
  "score": 95,
  "verdictTitle": "Verdict Headline",
  "epilogue": "A gripping 2-3 paragraph noir courtroom narrative detailing the trial, jury verdict, and aftermath."
}`;

    const completion = await groq.chat.completions.create({
      model: MODEL_NAME,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Please review the compiled warrant and render your judgment.` }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.6,
      max_tokens: 1200
    });

    try {
      const parsed = JSON.parse(cleanJsonString(completion.choices[0]?.message?.content || '{}'));
      return {
        outcome: parsed.outcome || 'weak_case',
        score: typeof parsed.score === 'number' ? parsed.score : 50,
        verdictTitle: parsed.verdictTitle || 'CASE CLOSED',
        epilogue: parsed.epilogue || 'The courtroom was packed in silence as the judge banged the gavel...'
      };
    } catch (e) {
      return {
        outcome: 'weak_case',
        score: 40,
        verdictTitle: 'MISTRIAL',
        epilogue: 'The evidence presented failed to withstand rigorous scrutiny by the defense team.'
      };
    }
  }

  // 4. AI Story Generator (For the Story Creator Page)
  static async generateCompleteStory(
    promptTheme: string = '',
    requestedArchetype?: MysteryArchetype | 'random'
  ): Promise<IStory> {
    const groq = getGroqClient();

    const allArchetypes: MysteryArchetype[] = [
      'classic_procedural',
      'multi_crime_convergence',
      'deliberate_frame_job',
      'cause_of_death_twist',
      'false_confession',
      'non_linear_web'
    ];

    const archetype: MysteryArchetype = (!requestedArchetype || requestedArchetype === 'random')
      ? allArchetypes[Math.floor(Math.random() * allArchetypes.length)]
      : requestedArchetype;

    const blueprint = ARCHETYPE_BLUEPRINTS[archetype];

    const systemPrompt = `You are a master mystery writer and detective game designer.
Generate a complete, fully playable dynamic lead-web detective murder mystery game in valid JSON.

=== MANDATORY MYSTERY ARCHETYPE ===
SELECTED ARCHETYPE: "${archetype}" (${blueprint.name})
CORE TROPE: ${blueprint.description}
ARCHETYPE DIRECTIVE:
${blueprint.instructions}

USER PREMISE/THEME: "${promptTheme || 'A gripping high-stakes murder mystery with multiple suspects and corporate/personal secrets.'}"

=== DYNAMIC LEAD-WEB ARCHITECTURE ===
- NO rigid artificial stages! Instead, structure the case as an organic Web of Leads.
- Locations: 3-5 locations. Exactly 1 or 2 are "isInitiallyUnlocked": true (the primary crime scene). Other locations are discovered dynamically when suspects slip up under stress or when searching scenes!
- Evidence: 5-8 evidence items. Exactly 1 or 2 are "isInitiallyUnlocked": true. Others are hidden at locations ("locationId") or revealed by suspects.
- Suspects: 3-5 suspects. 2-3 are "isInitiallyUnlocked": true. Each has a distinct personality ("confident" | "nervous" | "cunning" | "aggressive" | "defensive") and "dynamicUnlocks" rules specifying what they blurt out when stressed or shown evidence!

REQUIRED JSON STRUCTURE (Must match exactly):
{
  "title": "Compelling Title",
  "caseNumber": "2025-XXXX-XX",
  "leadDetective": "Detective Name",
  "status": "Active Homicide Investigation",
  "victimProfile": {
    "name": "Full Name",
    "age": 45,
    "occupation": "Job Title",
    "discovered": "Date, Time, Location, by Whom",
    "causeOfDeath": "Specific cause and weapon",
    "timeOfDeath": "Time window"
  },
  "briefing": {
    "initialBriefing": "2-3 sentences overview of the initial crime scene",
    "detectiveInsights": "2-3 sentences of detective observations and initial suspicions"
  },
  "objectives": {
    "progress": ["2-3 past completed initial steps"],
    "currentObjectives": ["Canvass crime scenes", "Interrogate initial suspects", "Follow forensic leads"]
  },
  "locations": [
    {
      "id": "location_slug",
      "title": "Location Name",
      "subtitle": "Address/Area",
      "status": "Active Crime Scene | Location of Interest",
      "lastVisited": "Date or Pending",
      "witnesses": "Witness names or None",
      "notes": "Description and what might be found here",
      "isInitiallyUnlocked": true, // Exactly 1 or 2 initial scenes are true
      "hiddenEvidenceIds": ["evidence_slug_found_here"],
      "canvassReport": "What CSI investigators discover upon canvassing this scene."
    }
  ],
  "evidence": [
    {
      "id": "evidence_slug",
      "title": "Evidence Title",
      "subtitle": "Source or Type",
      "details": "Thorough forensic or physical description",
      "date": "Date found",
      "location": "Where found",
      "priority": "Critical" | "High" | "Medium" | "Low",
      "isInitiallyUnlocked": true, // Exactly 1 or 2 initial clues are true
      "locationId": "location_slug_where_hidden"
    }
  ],
  "suspects": [
    {
      "id": "suspect_slug",
      "name": "Full Name",
      "role": "Relationship to victim",
      "trait": "Distinctive personality traits",
      "personality": "confident" | "nervous" | "cunning" | "aggressive" | "defensive",
      "isInitiallyUnlocked": true, // 2-3 are true; others unlocked when named
      "initialTrust": 50,
      "initialStress": 5, // Integer between 0 and 10
      "alibi": "Their public story of where they were",
      "motive": "Why they could have wanted the victim dead",
      "privateKnowledge": "What they privately know, what they hide, and their actual actions",
      "secrets": ["Secret 1", "Secret 2"],
      "breakdownThreshold": 90,
      "evidenceReactions": {
        "evidence_slug": "How they react when shown this specific evidence"
      },
      // Player-driven lead unlock via notebook clues and Officer Davis probable cause
      "leadSource": {
        "type": "suspect_clue" | "evidence_mention" | "location_mention",
        "sourceName": "Full Name or Evidence Title",
        "sourceId": "slug_of_source",
        "description": "How this person or place is referenced in the case"
      },
      "isPrimeSuspect": true,
      "category": "prime_suspect" | "person_of_interest" | "witness"
    }
  ],
  "groundTruth": {
    "killer": "suspect_slug",
    "motive": "motive_slug_or_short_phrase",
    "weapon": "weapon_slug_or_short_phrase",
    "keyContradiction": "contradiction_slug_or_short_phrase",
    "timelineSummary": "Complete objective summary of who did what, when, how, and why.",
    "archetype": "${archetype}",
    "fallGuy": "slug_of_fall_guy_or_empty_if_none",
    "redHerringCrime": "description_of_secondary_crime_or_empty_if_none",
    "trueFatalMechanism": "true_fatal_cause_of_death"
  }
}

Return ONLY valid JSON.`;
    const completion = await groq.chat.completions.create({
      model: MODEL_NAME,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Generate a brilliant dynamic lead-web mystery using archetype "${archetype}".${promptTheme ? ` Custom prompt/theme: "${promptTheme}".` : ''}` }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.8,
      max_tokens: 3500
    });

    const rawContent = completion.choices[0]?.message?.content || '{}';
    let parsed: any;
    try {
      parsed = JSON.parse(cleanJsonString(rawContent));
    } catch (e) {
      console.error('Failed to parse Groq response JSON:', rawContent);
      throw new Error('Groq returned invalid JSON');
    }

    // Unwrap if root key is "story" or "case"
    if (parsed.story && typeof parsed.story === 'object') {
      parsed = parsed.story;
    } else if (parsed.case && typeof parsed.case === 'object') {
      parsed = parsed.case;
    }

    // Support ground_truth snake_case
    if (!parsed.groundTruth && parsed.ground_truth) {
      parsed.groundTruth = parsed.ground_truth;
    }

    const firstSuspectId = parsed.suspects?.[0]?.id || 'suspect_1';
    const firstEvidenceId = parsed.evidence?.[0]?.id || 'evidence_1';

    // Normalize groundTruth
    if (!parsed.groundTruth || typeof parsed.groundTruth !== 'object') {
      parsed.groundTruth = {
        killer: firstSuspectId,
        motive: 'cover_up',
        weapon: firstEvidenceId,
        keyContradiction: 'timeline_gap',
        timelineSummary: 'The suspect exploited an unmonitored window to execute the crime.',
        archetype
      };
    } else {
      parsed.groundTruth.archetype = archetype;
      if (!parsed.groundTruth.killer) parsed.groundTruth.killer = firstSuspectId;
      if (!parsed.groundTruth.motive) parsed.groundTruth.motive = 'Undetermined motive';
      if (!parsed.groundTruth.weapon) parsed.groundTruth.weapon = firstEvidenceId;
      if (!parsed.groundTruth.keyContradiction) parsed.groundTruth.keyContradiction = 'Forensic contradiction';
      if (!parsed.groundTruth.timelineSummary) parsed.groundTruth.timelineSummary = 'Timeline reconstruction pending.';
    }

    // Ensure victimProfile
    if (!parsed.victimProfile || typeof parsed.victimProfile !== 'object') {
      parsed.victimProfile = {
        name: 'John Doe',
        age: 40,
        occupation: 'Victim',
        discovered: 'At the crime scene',
        causeOfDeath: 'Homicide',
        timeOfDeath: 'Approx 10:00 PM'
      };
    } else {
      parsed.victimProfile.name = parsed.victimProfile.name || 'John Doe';
      parsed.victimProfile.age = Number(parsed.victimProfile.age) || 40;
      parsed.victimProfile.occupation = parsed.victimProfile.occupation || 'Victim';
      parsed.victimProfile.discovered = parsed.victimProfile.discovered || 'At the crime scene';
      parsed.victimProfile.causeOfDeath = parsed.victimProfile.causeOfDeath || 'Homicide';
      parsed.victimProfile.timeOfDeath = parsed.victimProfile.timeOfDeath || 'Approx 10:00 PM';
    }

    // Ensure briefing and objectives
    if (!parsed.briefing) {
      parsed.briefing = {
        initialBriefing: 'A fresh homicide case has arrived.',
        detectiveInsights: 'Review the evidence and interview the suspects.'
      };
    }
    if (!parsed.objectives) {
      parsed.objectives = {
        progress: ['Secured the initial crime scene'],
        currentObjectives: ['Interview prime suspects', 'Analyze forensic evidence']
      };
    }

    if (!parsed.caseNumber) {
      parsed.caseNumber = `${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    }
    if (!parsed.leadDetective) {
      parsed.leadDetective = 'Lead Detective';
    }
    if (!parsed.status) {
      parsed.status = 'Active Homicide Investigation';
    }

    // Normalize suspects
    const validPersonalities = ['confident', 'nervous', 'cunning', 'aggressive', 'defensive'];
    if (Array.isArray(parsed.suspects)) {
      parsed.suspects = parsed.suspects.map((s: any, idx: number) => {
        let cat = (s.category || '').toLowerCase();
        if (!['prime_suspect', 'person_of_interest', 'witness', 'secondary_suspect'].includes(cat)) {
          cat = s.isPrimeSuspect ? 'prime_suspect' : 'person_of_interest';
        }
        const pers = (s.personality || '').toLowerCase();
        return {
          ...s,
          id: s.id || `suspect_${idx + 1}`,
          name: s.name || `Suspect ${idx + 1}`,
          role: s.role || 'Person of Interest',
          trait: s.trait || 'Reserved',
          personality: validPersonalities.includes(pers) ? pers : 'defensive',
          isInitiallyUnlocked: typeof s.isInitiallyUnlocked === 'boolean' ? s.isInitiallyUnlocked : idx < 2,
          dynamicUnlocks: Array.isArray(s.dynamicUnlocks) ? s.dynamicUnlocks : [],
          alibi: s.alibi || 'No comment provided.',
          motive: s.motive || 'Unknown',
          privateKnowledge: s.privateKnowledge || '',
          secrets: Array.isArray(s.secrets) ? s.secrets : [],
          category: cat,
          isPrimeSuspect: Boolean(s.isPrimeSuspect || cat === 'prime_suspect'),
          initialTrust: typeof s.initialTrust === 'number' ? s.initialTrust : 50,
          initialStress: typeof s.initialStress === 'number' ? Math.max(0, Math.min(10, s.initialStress)) : 5,
          breakdownThreshold: typeof s.breakdownThreshold === 'number' ? s.breakdownThreshold : 90
        };
      });
      // Ensure at least 1 suspect is unlocked
      if (!parsed.suspects.some((s: any) => s.isInitiallyUnlocked)) {
        if (parsed.suspects[0]) parsed.suspects[0].isInitiallyUnlocked = true;
      }
    }

    // Normalize locations
    if (Array.isArray(parsed.locations)) {
      parsed.locations = parsed.locations.map((l: any, idx: number) => ({
        ...l,
        id: l.id || `location_${idx + 1}`,
        title: l.title || `Investigation Site ${idx + 1}`,
        subtitle: l.subtitle || 'Vicinity',
        status: l.status || 'Location of Interest',
        lastVisited: l.lastVisited || 'Pending',
        witnesses: l.witnesses || 'None',
        notes: l.notes || '',
        isInitiallyUnlocked: typeof l.isInitiallyUnlocked === 'boolean' ? l.isInitiallyUnlocked : idx === 0,
        hiddenEvidenceIds: Array.isArray(l.hiddenEvidenceIds) ? l.hiddenEvidenceIds : [],
        canvassReport: l.canvassReport || `Forensic sweep of ${l.title || 'the location'} completed.`
      }));
      if (!parsed.locations.some((l: any) => l.isInitiallyUnlocked)) {
        if (parsed.locations[0]) parsed.locations[0].isInitiallyUnlocked = true;
      }
    }

    // Normalize evidence
    if (Array.isArray(parsed.evidence)) {
      const priorityMap: Record<string, 'Low' | 'Medium' | 'High' | 'Critical'> = {
        low: 'Low',
        medium: 'Medium',
        high: 'High',
        critical: 'Critical'
      };
      parsed.evidence = parsed.evidence.map((e: any, idx: number) => {
        const pKey = (e.priority || '').toLowerCase();
        return {
          ...e,
          id: e.id || `evidence_${idx + 1}`,
          title: e.title || `Evidence Item ${idx + 1}`,
          subtitle: e.subtitle || 'Crime Scene Item',
          details: e.details || 'Forensic analysis in progress.',
          date: e.date || 'Recent',
          location: e.location || 'Crime Scene',
          priority: priorityMap[pKey] || 'Medium',
          isInitiallyUnlocked: typeof e.isInitiallyUnlocked === 'boolean' ? e.isInitiallyUnlocked : idx === 0,
          locationId: e.locationId || (parsed.locations?.[0]?.id || 'location_1')
        };
      });
      if (!parsed.evidence.some((e: any) => e.isInitiallyUnlocked)) {
        if (parsed.evidence[0]) parsed.evidence[0].isInitiallyUnlocked = true;
      }
    }

    if (parsed.groundTruth?.archetype) {
      parsed.archetype = parsed.groundTruth.archetype;
    }

    return parsed as IStory;
  }
}

// Backwards-compatible alias
export const GroqService = LLMService;
