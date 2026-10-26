import Groq from 'groq-sdk';
import { IGameSession, ISuspectState } from '../models/GameSession';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export class GroqService {
  
  // 1. Suspect Interrogation (Dual-Memory & Trust)
  static async chatWithSuspect(
    suspectId: string, 
    suspectState: ISuspectState, 
    userMessage: string, 
    presentedEvidence: string | null
  ) {
    const systemPrompt = `You are ${suspectId} in a murder investigation. 
    CURRENT TRUST SCORE: ${suspectState.trustScore}/100. (If below 30, be defensive/hostile. If above 70, be cooperative).
    
    PRIVATE KNOWLEDGE: You know you were at the coffee shop at 10:45 PM, but your initial alibi is that you were working late.
    REVEALED FACTS LEDGER: You have already admitted to the detective: ${JSON.stringify(suspectState.revealedFacts)}. Do not contradict this.
    ${presentedEvidence ? `THE DETECTIVE JUST SHOWED YOU EVIDENCE: ${presentedEvidence}. If this breaks your alibi, your composure drops unless you have a good excuse.` : ''}
    
    Respond in JSON format with exactly three keys:
    {
      "dialogue": "Your spoken response to the detective",
      "trust_delta": -5, // An integer between -10 and +10 representing how the detective's tone/evidence affected your trust/pressure
      "new_revealed_fact": "A string summarizing any NEW piece of information you just let slip. Leave null if none."
    }`;

    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ],
      model: 'llama3-70b-8192',
      response_format: { type: 'json_object' }
    });

    return JSON.parse(completion.choices[0]?.message?.content || '{}');
  }

  // 2. The Deduction Gate (Officer Davis)
  static async evaluateDeduction(session: IGameSession, deduction: string) {
    const systemPrompt = `You are Officer Davis. The detective is presenting a deduction to advance from Stage ${session.currentStage}.
    The user deduction is: "${deduction}".
    
    Rules for Stage 1: They must figure out Marcus was at the coffee shop.
    Rules for Stage 2: They must figure out the motive involving the patents.
    
    Evaluate the deduction. Respond in JSON format:
    {
      "isApproved": boolean,
      "dialogue": "Your response as Officer Davis (e.g., 'Good catch' or 'We need more proof')",
      "unlockEvidence": ["array_of_new_evidence_ids"],
      "unlockLocations": ["array_of_new_location_ids"]
    }`;

    const completion = await groq.chat.completions.create({
      messages: [{ role: 'system', content: systemPrompt }],
      model: 'llama3-70b-8192',
      response_format: { type: 'json_object' }
    });

    return JSON.parse(completion.choices[0]?.message?.content || '{}');
  }

  // 3. The AI Judge (Final Warrant Evaluation)
  static async evaluateWarrant(warrant: { suspect: string, motive: string, weapon: string }, groundTruth: any) {
    const systemPrompt = `You are the District Attorney/Judge generating the game's final epilogue.
    The detective submitted an arrest warrant for:
    Suspect: ${warrant.suspect}
    Motive: ${warrant.motive}
    Weapon/Evidence: ${warrant.weapon}

    The GROUND TRUTH of the murder is: ${JSON.stringify(groundTruth)}.
    
    Compare the warrant to the ground truth. Write a 2-3 paragraph epilogue detailing the trial. 
    If they got it perfectly right, describe a successful conviction. If they got the wrong suspect, describe the disastrous trial and the real killer escaping. If they got the right suspect but the wrong weapon/motive, describe them getting off on a technicality.`;

    const completion = await groq.chat.completions.create({
      messages: [{ role: 'system', content: systemPrompt }],
      model: 'llama3-70b-8192'
    });

    return completion.choices[0]?.message?.content || 'The court has adjourned.';
  }
}