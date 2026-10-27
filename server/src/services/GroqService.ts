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

  // 1. Suspect Interrogation (Dual-Memory, Trust, Stress & Evidence Reaction)
  static async chatWithSuspect(
    suspectProfile: ISuspectItem,
    suspectState: ISuspectRuntimeState,
    userMessage: string,
    presentedEvidence: IEvidenceItem | null = null,
    allRevealedFactsAcrossSuspects: string[] = []
  ) {
    const groq = getGroqClient();

    const evidenceReactionHint = presentedEvidence && suspectProfile.evidenceReactions?.[presentedEvidence.id]
      ? `SPECIFIC EVIDENCE REACTION: When shown "${presentedEvidence.title}", your secret reaction is: "${suspectProfile.evidenceReactions[presentedEvidence.id]}". Act this out!`
      : '';

    const systemPrompt = `You are roleplaying as ${suspectProfile.name} in a murder mystery investigation.
ROLE: ${suspectProfile.role}
PERSONALITY & TRAITS: ${suspectProfile.trait}
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
- If Stress < 40: You speak smoothly and defend your alibi confidently.
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

  // 2. The Deduction Gate (Officer Davis)
  static async evaluateDeduction(
    currentStage: number,
    stageDef: IStageDefinition,
    deduction: string,
    revealedFacts: string[],
    groundTruth: IGroundTruth
  ) {
    const groq = getGroqClient();

    const systemPrompt = `You are Officer Davis, a seasoned veteran police officer assisting the lead detective in a homicide case.
You evaluate whether the detective's theory has enough substance and evidence to advance to the next stage of the investigation.

CURRENT STAGE: ${currentStage} - "${stageDef.title}"
STAGE GOAL & GATE RULES: "${stageDef.gateRules}"
GROUND TRUTH SUMMARY: "${groundTruth.timelineSummary}"

EVIDENCE / FACTS ADMITTED BY SUSPECTS SO FAR:
${JSON.stringify(revealedFacts, null, 2)}

DETECTIVE'S SUBMITTED DEDUCTION:
"${deduction}"

EVALUATION CRITERIA:
- The detective does NOT need identical phrasing, but they MUST capture the core insight described in the GATE RULES (e.g., catching the specific lie, discovering the real motive, or linking the weapon/opportunity).
- If their deduction is accurate and grounded in the facts uncovered:
  - "isApproved": true
  - "dialogue": Gritty, encouraging police dialogue (e.g. "Good work, Detective. That cracks this wide open. I'll get a warrant signed right away.")
- If their deduction is incomplete, premature, or wrong:
  - "isApproved": false
  - "dialogue": Constructive police skepticism (e.g. "I hear what you're saying, Detective, but the DA won't sign off on a hunch. We need concrete proof that places him there.")

You MUST respond in ONLY valid JSON:
{
  "isApproved": boolean,
  "dialogue": "Your in-character spoken words as Officer Davis",
  "feedback": "A short detective note giving guidance on what proof is still missing"
}`;

    const completion = await groq.chat.completions.create({
      model: MODEL_NAME,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Officer Davis, review my deduction: "${deduction}"` }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
      max_tokens: 350
    });

    try {
      const parsed = JSON.parse(completion.choices[0]?.message?.content || '{}');
      return {
        isApproved: Boolean(parsed.isApproved),
        dialogue: parsed.dialogue || "We need more than that to make a move, Detective.",
        feedback: parsed.feedback || "Cross-examine suspect alibis with physical logs."
      };
    } catch (e) {
      return {
        isApproved: false,
        dialogue: "I can't take this to the Captain yet. Bring me harder evidence.",
        feedback: "Check the timeline contradictions."
      };
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
Generate a complete, fully playable 4-stage detective murder mystery game in valid JSON.

=== MANDATORY MYSTERY ARCHETYPE ===
SELECTED ARCHETYPE: "${archetype}" (${blueprint.name})
CORE TROPE: ${blueprint.description}
ARCHETYPE DIRECTIVE:
${blueprint.instructions}

USER PREMISE/THEME: "${promptTheme || 'A gripping high-stakes murder mystery with multiple suspects and corporate/personal secrets.'}"

REQUIRED STRUCTURE (Must match exactly):
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
    "currentObjectives": ["3-4 clear objectives for the detective"]
  },
  "locations": [
    {
      "id": "location_slug",
      "title": "Location Name",
      "subtitle": "Address/Area",
      "status": "Active Crime Scene | Location of Interest",
      "lastVisited": "Date or Pending",
      "witnesses": "Witness names",
      "notes": "Description and what might be found here",
      "unlockStage": 1 // 1, 2, 3, or 4
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
      "unlockStage": 1 // 1, 2, 3, or 4
    }
  ],
  "suspects": [
    {
      "id": "suspect_slug",
      "name": "Full Name",
      "role": "Relationship to victim",
      "trait": "Distinctive personality traits",
      "initialTrust": 50,
      "initialStress": 25,
      "alibi": "Their public story of where they were",
      "motive": "Why they could have wanted the victim dead",
      "privateKnowledge": "What they privately know, what they hide, and their actual actions",
      "secrets": ["Secret 1", "Secret 2", "Secret 3"],
      "breakdownThreshold": 80,
      "evidenceReactions": {
        "evidence_slug": "How they react when shown this specific evidence"
      },
      "isPrimeSuspect": true,
      "category": "prime_suspect"
    }
  ],
  "stages": [
    {
      "stage": 1,
      "title": "Stage 1: The Initial Scene (The Lie)",
      "description": "Expose the first major flaw in someone's alibi",
      "gateRules": "Exact condition the detective must state to Officer Davis to advance",
      "unlockEvidenceIds": ["evidence_slug"],
      "unlockLocationIds": ["location_slug"]
    },
    {
      "stage": 2,
      "title": "Stage 2: The Hidden Web (The Motive)",
      "description": "Uncover the financial or personal motive",
      "gateRules": "Exact condition the detective must deduce to advance to stage 3",
      "unlockEvidenceIds": ["evidence_slug"],
      "unlockLocationIds": ["location_slug"]
    },
    {
      "stage": 3,
      "title": "Stage 3: The Cornered Suspects (The Opportunity & Weapon)",
      "description": "Discover how security was breached or where the weapon was hidden",
      "gateRules": "Exact condition the detective must deduce to advance to stage 4",
      "unlockEvidenceIds": ["evidence_slug"],
      "unlockLocationIds": ["location_slug"]
    },
    {
      "stage": 4,
      "title": "Stage 4: The Final Squeeze",
      "description": "Confront the killer and prepare the arrest warrant",
      "gateRules": "Stage 4 requires submitting the final Arrest Warrant to the Judge",
      "unlockEvidenceIds": [],
      "unlockLocationIds": []
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
        { role: 'user', content: `Generate a brilliant detective mystery using archetype "${archetype}".${promptTheme ? ` Custom prompt/theme: "${promptTheme}".` : ''}` }
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
    if (Array.isArray(parsed.suspects)) {
      parsed.suspects = parsed.suspects.map((s: any, idx: number) => {
        let cat = (s.category || '').toLowerCase();
        if (!['prime_suspect', 'person_of_interest', 'witness', 'secondary_suspect'].includes(cat)) {
          cat = s.isPrimeSuspect ? 'prime_suspect' : 'person_of_interest';
        }
        return {
          ...s,
          id: s.id || `suspect_${idx + 1}`,
          name: s.name || `Suspect ${idx + 1}`,
          role: s.role || 'Person of Interest',
          trait: s.trait || 'Reserved',
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
          unlockStage: Number(e.unlockStage) || 1
        };
      });
    }

    // Normalize locations
    if (Array.isArray(parsed.locations)) {
      parsed.locations = parsed.locations.map((l: any, idx: number) => ({
        ...l,
        id: l.id || `location_${idx + 1}`,
        title: l.title || `Investigation Site ${idx + 1}`,
        subtitle: l.subtitle || 'Vicinity',
        status: l.status || 'Active Crime Scene',
        lastVisited: l.lastVisited || 'Pending',
        witnesses: l.witnesses || 'None',
        notes: l.notes || '',
        unlockStage: Number(l.unlockStage) || 1
      }));
    }

    // Normalize stages
    if (Array.isArray(parsed.stages)) {
      parsed.stages = parsed.stages.map((st: any, idx: number) => ({
        stage: Number(st.stage) || idx + 1,
        title: st.title || `Stage ${idx + 1}`,
        description: st.description || 'Investigation progression',
        gateRules: st.gateRules || 'Report key breakthrough to Officer Davis.',
        unlockEvidenceIds: Array.isArray(st.unlockEvidenceIds) ? st.unlockEvidenceIds : [],
        unlockLocationIds: Array.isArray(st.unlockLocationIds) ? st.unlockLocationIds : []
      }));
    }

    return parsed as IStory;
  }
}