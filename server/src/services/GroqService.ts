import Groq from 'groq-sdk';
import dotenv from 'dotenv';
import { ISuspectRuntimeState, ISuspectItem, IStageDefinition, IGroundTruth, IStory, IEvidenceItem } from '../types/index';

dotenv.config();

const MODEL_NAME = 'qwen/qwen3.8-27b';

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

DETERMINE THE TRIAL OUTCOME:
1. "perfect": Detective named the correct killer, correct murder weapon, and reasonable motive/contradiction.
   - Outcome: A sensational conviction. The suspect collapses on the witness stand or takes a plea deal.
2. "wrong_suspect": Detective arrested an innocent person.
   - Outcome: Disaster. An innocent person is dragged through court while the actual killer (${groundTruth.killer}) quietly flees the jurisdiction forever.
3. "weak_case": Detective named the right killer, but the weapon or contradiction was wrong or unproven.
   - Outcome: High-priced defense attorneys exploit the lack of the murder weapon or procedural gaps. The killer walks on reasonable doubt or a technicality.

Respond with ONLY valid JSON:
{
  "outcome": "perfect" | "wrong_suspect" | "weak_case",
  "score": 95, // 0 to 100
  "verdictTitle": "GUILTY AS CHARGED" | "WRONGFUL ARREST - KILLER AT LARGE" | "MISTRIAL - CASE DISMISSED",
  "epilogue": "A gripping 2-3 paragraph noir narrative detailing the courtroom trial, jury deliberation, defendant reaction, and aftermath."
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
  static async generateCompleteStory(promptTheme: string = ''): Promise<IStory> {
    const groq = getGroqClient();

    const systemPrompt = `You are a master mystery writer and detective game designer.
Generate a complete, fully playable 4-stage detective murder mystery game in valid JSON.

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
      }
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
    "timelineSummary": "Complete objective summary of who did what, when, how, and why."
  }
}

Return ONLY valid JSON.`;

    const completion = await groq.chat.completions.create({
      model: MODEL_NAME,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: 'Generate a brilliant and cohesive detective mystery story according to the schema.' }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.8,
      max_tokens: 950
    });

    const parsed = JSON.parse(completion.choices[0]?.message?.content || '{}');
    return parsed as IStory;
  }
}