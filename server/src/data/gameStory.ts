export const INITIAL_GAME_STATE = {
  unlockedEvidence: ['autopsy_report', 'crime_scene_photos'],
  unlockedLocations: ['riverside_office', 'victim_apartment'],
  suspects: [
    { suspectId: 'marcus_chen', trustScore: 50, stressLevel: 0, revealedFacts: [] },
    { suspectId: 'sarah_reynolds', trustScore: 50, stressLevel: 0, revealedFacts: [] },
    { suspectId: 'diana_wilkins', trustScore: 50, stressLevel: 0, revealedFacts: [] }
  ]
};

export const GROUND_TRUTH = {
  killer: 'marcus_chen',
  motive: 'secret_partnership_agreement', // Requires unlocking this evidence
  weapon: 'letter_opener',
  keyContradiction: 'coffee_shop_footage' // Required to break alibi
};