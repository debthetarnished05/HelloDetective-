import Groq from 'groq-sdk';
import dotenv from 'dotenv';
import { ISuspectRuntimeState, ISuspectItem, IStageDefinition, IGroundTruth, IStory, IEvidenceItem, MysteryArchetype } from '../types/index';

dotenv.config();

const MODEL_NAME = 'qwen/qwen3.8-27b';

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

export class GroqService {

  // 1. Suspect Interrogation (Dual-Memory, Trust, Stress & Personality)
  static async chatWithSuspect(
    suspectProfile: ISuspectItem,
    suspectState: ISuspectRuntimeState,
    userMessage: string,
    presentedEvidence: IEvidenceItem | null = null,
    allRevealedFactsAcrossSuspects: string[] = [],
    mandatoryUnlockDialogue?: string
  ) {
    const groq = getGroqClient();

    const personality = suspectProfile.personality || 'defensive';
    const personalityGuides: Record<string, string> = {
      confident: 'PERSONALITY ARCHETYPE: CONFIDENT. You are smug, polite, and dismissive of circumstantial accusations. You only gain stress if presented with hard, undeniable physical evidence. Keep your composure and smirk at weak questions.',
      nervous: 'PERSONALITY ARCHETYPE: NERVOUS. You are twitchy, easily rattled, defensive, and stutter when pressed. Mild pressure increases your stress rapidly, and you easily let slip details or blurt out excuses.',
      cunning: 'PERSONALITY ARCHETYPE: CUNNING. You are polite, calculated, deflect blame toward other suspects, and mask your emotions until backed into an undeniable logical corner.',
      aggressive: 'PERSONALITY ARCHETYPE: AGGRESSIVE. You are hostile, confrontational, snap back at questions, and threaten to get the detective\'s badge. Provoking you causes angry, reckless slips of the tongue.',
      defensive: 'PERSONALITY ARCHETYPE: DEFENSIVE. You are guarded, give short measured answers, watch your words carefully, and demand strict legal procedure.'
    };

    const evidenceReactionHint = presentedEvidence && suspectProfile.evidenceReactions?.[presentedEvidence.id]
      ? `SPECIFIC EVIDENCE REACTION: When shown "${presentedEvidence.title}", your secret reaction is: "${suspectProfile.evidenceReactions[presentedEvidence.id]}". Act this out!`
      : '';

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
BREAKDOWN THRESHOLD: ${suspectProfile.breakdownThreshold}/100

=== BEHAVIOR RULES BY METER ===
- If Trust < 30: You are defensive, cold, annoyed, stonewalling, or demand to speak to your attorney.
- If Trust > 70: You are cooperative, sincere, and willing to share context about other people.
- If Stress < 40: You speak smoothly and defend your alibi confidently according to your personality.
- If Stress between 50 and 75: You show visible anxiety, fidgeting, perspiration, stuttering, and defensive irritation.
- If Stress >= ${suspectProfile.breakdownThreshold}: You reach your BREAKDOWN STATE! Your composure crumbles completely. You burst into tears or panic and confess one of your hidden secrets!

=== DUAL-MEMORY SYSTEM ===
1. PRIVATE KNOWLEDGE (What you privately know and try to hide):
"${suspectProfile.privateKnowledge}"

2. SECRETS YOU CAN CONFESS UNDER HIGH PRESSURE OR DIRECT EVIDENCE:
${JSON.stringify(suspectProfile.secrets, null, 2)}

3. REVEALED FACTS LEDGER (Statements you ALREADY admitted to the detective in prior turns):
${JSON.stringify(suspectState.revealedFacts, null, 2)}
CRITICAL RULE: You have ALREADY admitted these facts. You CANNOT deny them or contradict yourself!

${mandatoryUnlockDialogue ? `=== CRITICAL UNLOCK MOMENT (MANDATORY) ===
Your defense has fractured! You MUST incorporate the following slip-up or admission into your response dialogue:
"${mandatoryUnlockDialogue}"
Weave this admission naturally into your speech as a slip of the tongue, defensive excuse, or panicked confession!` : ''}

${presentedEvidence ? `=== EVIDENCE CONFRONTATION RULE ===
The detective is holding up physical evidence: "${presentedEvidence.title}" (${presentedEvidence.subtitle}).
Evidence details: "${presentedEvidence.details}".
${evidenceReactionHint}
If this evidence directly proves you lied, your composure breaks: increase your stress by +15 to +25, lower your trust by -5 to -15, and you MUST offer a panicked excuse or confess!` : ''}

${allRevealedFactsAcrossSuspects.length > 0 ? `=== CROSS-EXAMINATION CONTEXT ===
Other suspects or witnesses have already let slip:
${JSON.stringify(allRevealedFactsAcrossSuspects, null, 2)}
If the detective quotes these contradictions, you become noticeably more stressed.` : ''}

=== OUTPUT FORMAT ===
You MUST reply with ONLY valid JSON with exactly these keys:
{
  "dialogue": "Your spoken words to the detective (1 to 4 sentences in character, realistic dialogue)",
  "trust_delta": -5, // Integer between -15 and +15
  "stress_delta": 10, // Integer between -15 and +25
  "new_revealed_fact": "Brief sentence summarizing any NEW admission or slip-up made in this turn, or null if none",
  "mood": "composed" | "defensive" | "nervous" | "broken_down",
  "broke_down": boolean // true if stress >= ${suspectProfile.breakdownThreshold} or confessed a major secret
}`;

    // Include recent chat history
    const historyMessages = (suspectState.chatHistory || []).slice(-6).map(msg => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content
    }));

    const completion = await groq.chat.completions.create({
      model: MODEL_NAME,
      messages: [
        { role: 'system', content: systemPrompt },
        ...historyMessages,
        { role: 'user', content: presentedEvidence ? `[Shows Evidence: ${presentedEvidence.title}] ${userMessage}` : userMessage }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
      max_tokens: 350
    });

    try {
      const parsed = JSON.parse(completion.choices[0]?.message?.content || '{}');
      return {
        dialogue: parsed.dialogue || "I have nothing further to say to you without my lawyer.",
        trust_delta: typeof parsed.trust_delta === 'number' ? parsed.trust_delta : 0,
        stress_delta: typeof parsed.stress_delta === 'number' ? parsed.stress_delta : 0,
        new_revealed_fact: parsed.new_revealed_fact || null,
        mood: (['composed', 'defensive', 'nervous', 'broken_down'].includes(parsed.mood) ? parsed.mood : 'composed') as any,
        broke_down: Boolean(parsed.broke_down)
      };
    } catch (e) {
      return {
        dialogue: "You're trying to twist my words, Detective. I was nowhere near that office.",
        trust_delta: -5,
        stress_delta: 5,
        new_revealed_fact: null,
        mood: 'defensive',
        broke_down: false
      };
    }
  }

  // 2. The Silent Advisor (Officer Davis)
  static async chatWithOfficerAdvisor(
    userMessage: string,
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
    },
    chatHistory: { role: string; content: string }[] = []
  ) {
    const groq = getGroqClient();

    const systemPrompt = `You are Officer Davis, a gritty, sharp, and loyal veteran desk officer assisting the lead detective in the homicide investigation: "${caseContext.caseTitle}" (Victim: ${caseContext.victimName}).

=== YOUR ROLE AS SILENT ADVISOR ===
1. You assist the detective with case notes, guidance, and observational insights.
2. CRITICAL RULE ON COUNTS/PROGRESS:
   - Do NOT spontaneously volunteer the exact counts or completion statistics (e.g. "We have 4 of 6 evidence").
   - ONLY report the exact numerical progress if the detective EXPLICITLY asks for a sit-rep, status report, count, or how many leads are remaining!
   - Current actual tracking (internal knowledge):
     * Evidence recovered: ${caseContext.unlockedEvidence} of ${caseContext.totalEvidence}
     * Locations canvassed: ${caseContext.canvassedLocations} of ${caseContext.totalLocations}
     * Suspects/Witnesses identified: ${caseContext.unlockedSuspects} of ${caseContext.totalSuspects}
3. If the detective asks for a suggestion on where to look or who to sweat:
   - Provide a realistic, grounded noir tip based on current progress. Remind them to cross-reference statements with physical crime scenes or press suspect nerves.
4. Speak in authentic, concise noir police dialogue (1 to 3 sentences).

Recent clues in the case file:
${JSON.stringify(caseContext.discoveredClues.slice(-5), null, 2)}

Return your response in JSON:
{
  "dialogue": "Officer Davis's in-character spoken dialogue."
}`;

    const historyMessages = (chatHistory || []).slice(-6).map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content
    }));

    const completion = await groq.chat.completions.create({
      model: MODEL_NAME,
      messages: [
        { role: 'system', content: systemPrompt },
        ...historyMessages,
        { role: 'user', content: userMessage }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.6,
      max_tokens: 300
    });

    try {
      const parsed = JSON.parse(completion.choices[0]?.message?.content || '{}');
      return parsed.dialogue || "Keep shaking the tree, Detective. Someone's bound to slip up.";
    } catch (e) {
      return "I'm holding down the precinct desk, Detective. What's your play?";
    }
  }

  // 3. The AI Judge (Warrant Evaluation & Final Epilogue)
  static async evaluateWarrant(
    warrant: { suspect: string; motive: string; weapon: string; keyContradiction: string },
    groundTruth: IGroundTruth,
    storyTitle: string
  ) {
    const groq = getGroqClient();

    const archetype = groundTruth.archetype || 'classic_procedural';
    const fallGuy = groundTruth.fallGuy;
    const redHerringCrime = groundTruth.redHerringCrime;
    const trueFatalMechanism = groundTruth.trueFatalMechanism;

    const systemPrompt = `You are the Presiding Superior Court Judge and District Attorney delivering the grand judicial epilogue for the case: "${storyTitle}".
The detective has submitted an official Arrest Warrant to close the case.

DETECTIVE'S SUBMITTED WARRANT:
- Arrested Suspect: "${warrant.suspect}"
- Stated Motive: "${warrant.motive}"
- Murder Weapon / Opportunity: "${warrant.weapon}"
- Key Contradiction That Broke The Case: "${warrant.keyContradiction}"

ACTUAL GROUND TRUTH:
- True Killer: "${groundTruth.killer}"
- True Motive: "${groundTruth.motive}"
- True Weapon: "${groundTruth.weapon}"
- True Contradiction: "${groundTruth.keyContradiction}"
- Full Summary: "${groundTruth.timelineSummary}"
- Case Archetype: "${archetype}"
${fallGuy ? `- Intended Fall Guy / Red Herring Suspect: "${fallGuy}"` : ''}
${redHerringCrime ? `- Secondary Crime Committed by Fall Guy (NOT Murder): "${redHerringCrime}"` : ''}
${trueFatalMechanism ? `- Actual Medical/Toxicological Fatal Mechanism: "${trueFatalMechanism}"` : ''}

=== JUDICIAL OUTCOME EVALUATION RULES ===
1. If the detective named the True Killer ("${groundTruth.killer}") and correctly identified the murder weapon/method:
   - "outcome": "perfect"
   - "score": 95 - 100
   - "verdictTitle": "GUILTY BEYOND REASONABLE DOUBT"
   - Epilogue: A sensational, triumphant trial where the true killer breaks on the stand under irrefutable evidence.

2. If the detective fell for the Archetype's specific trap:
   - For "multi_crime_convergence" if detective arrested "${fallGuy}": The defendant was only guilty of ${redHerringCrime}. Forensic timeline proves the victim died before/after. The suspect is convicted only of the lesser crime, while the real killer walks free. ("outcome": "wrong_suspect", "score": 35, "verdictTitle": "WRONGFUL ARREST - LESSER CRIME ONLY")
   - For "deliberate_frame_job" if detective arrested "${fallGuy}": The defense easily exposes that evidence was planted and security was tampered with. The real killer ${groundTruth.killer} framed them and escaped! ("outcome": "wrong_suspect", "score": 30, "verdictTitle": "FRAME JOB COLLAPSE - KILLER ESCAPED")
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
      max_tokens: 500
    });

    try {
      const parsed = JSON.parse(completion.choices[0]?.message?.content || '{}');
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
      "initialStress": 25,
      "alibi": "Their public story of where they were",
      "motive": "Why they could have wanted the victim dead",
      "privateKnowledge": "What they privately know, what they hide, and their actual actions",
      "secrets": ["Secret 1", "Secret 2"],
      "breakdownThreshold": 80,
      "evidenceReactions": {
        "evidence_slug": "How they react when shown this specific evidence"
      },
      "dynamicUnlocks": [
        {
          "type": "location" | "evidence" | "character",
          "targetId": "slug_of_target_to_unlock",
          "triggerStress": 55, // or omit if triggered by evidence
          "triggerEvidenceId": "evidence_slug", // or omit if triggered by stress
          "revealDialogue": "What the suspect blurts out that reveals this new location, clue, or person!"
        }
      ],
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
      parsed = JSON.parse(rawContent);
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
          initialStress: typeof s.initialStress === 'number' ? s.initialStress : 20,
          breakdownThreshold: typeof s.breakdownThreshold === 'number' ? s.breakdownThreshold : 75
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

    parsed.stages = [];

    return parsed as IStory;
  }
}