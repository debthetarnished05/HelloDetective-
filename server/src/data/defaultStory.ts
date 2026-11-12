import { IStory } from '../types/index.js';

export const DEFAULT_STORY: IStory = {
  title: 'Silicon Alibi: The Murder of Michael Reynolds',
  caseNumber: '2025-0421-MR',
  leadDetective: 'Detective Alex Morgan',
  status: 'Active Homicide Investigation',
  archetype: 'multi_crime_convergence',
  trope: 'The Burglar / Embezzler Trap',
  victimProfile: {
    name: 'Michael Reynolds',
    age: 42,
    occupation: 'CEO & Co-Founder, TechVision Solutions',
    discovered: 'April 18, 2025, 8:45 AM by office janitor',
    causeOfDeath: 'Single fatal stab wound to the chest with an antique letter opener',
    timeOfDeath: 'Between 10:30 PM and 11:30 PM, April 17, 2025'
  },
  briefing: {
    initialBriefing: 'Michael Reynolds was found dead at his desk on the 42nd floor of Riverside Corporate Center. The office showed signs of a brief physical struggle, and his personal safe was accessed. Security footage from the executive elevator is missing between 10:30 PM and 11:15 PM.',
    detectiveInsights: 'The initial suspects each have plausible alibis that crack upon close examination. Building access requires RFID keycards after 9:00 PM. A threatening email was sent to Michael shortly before his death. We need to cross-reference suspect statements and build undeniable evidence before presenting arrest warrants.'
  },
  objectives: {
    progress: [
      'Secured executive penthouse crime scene',
      'Obtained preliminary autopsy and forensic reports',
      'Identified three primary persons of interest',
      'Began interrogations of partners, relatives, and staff'
    ],
    currentObjectives: [
      'Interrogate primary persons of interest Marcus Chen and Sarah Reynolds',
      'Canvass the crime scenes to uncover physical evidence and security traces',
      'Cross-examine statements and break suspect composure to reveal undisclosed associates',
      'Uncover the decisive contradiction and submit the official arrest warrant'
    ]
  },
  locations: [
    {
      id: 'riverside_corporate_center',
      title: 'Riverside Corporate Center',
      subtitle: '221B River Lane - 42nd Floor Penthouse',
      status: 'Active Crime Scene',
      lastVisited: 'April 18, 2025',
      witnesses: 'Janitor Maria Garcia, Security Tech Diana Wilkins',
      notes: 'Primary homicide scene. The victim was found slumped over his desk. Letter opener missing from desk caddy.',
      isInitiallyUnlocked: true,
      hiddenEvidenceIds: ['crime_scene_photos', 'autopsy_report', 'camera_override_log'],
      canvassReport: 'Forensic investigators dusted the mahogany desk, recovered the Medical Examiner preliminary autopsy report, detailed crime scene photos, and extracted the 42nd-floor server override audit trail.'
    },
    {
      id: 'riverside_brews',
      title: 'Riverside Brews Cafe',
      subtitle: '104 5th Street',
      status: 'Location of Interest',
      lastVisited: 'Pending Detective Visit',
      witnesses: 'Barista Alex Rivera',
      notes: 'Marcus Chen claims he sat here working alone until midnight. IP address of the threatening email traces to their public Wi-Fi.',
      isInitiallyUnlocked: false,
      leadSource: {
        type: 'suspect_clue',
        sourceName: "Marcus Chen's Alibi",
        description: 'Marcus claims he was working alone at Riverside Brews coffee shop on 5th Street.'
      },
      hiddenEvidenceIds: ['threatening_email', 'barista_statement'],
      canvassReport: 'Detectives swept the public Wi-Fi logs and interviewed the night barista, recovering the email dispatch origin and the barista sworn deposition.'
    },
    {
      id: 'marcus_offsite_lab',
      title: "Marcus's Offsite Hardware Lab",
      subtitle: 'Pier 9 Tech Incubator, Unit 4',
      status: 'Search Warrant Executed',
      lastVisited: 'Pending Detective Visit',
      witnesses: 'Lab Tech Leo Vance',
      notes: 'Private server racks and development benches. Potential storage for proprietary corporate data and foreign contracts.',
      isInitiallyUnlocked: false,
      leadSource: {
        type: 'suspect_clue',
        sourceName: "Marcus's Secret Facility",
        description: 'Private offsite development lab located at Pier 9 Unit 4.'
      },
      hiddenEvidenceIds: ['secret_partnership_agreement'],
      canvassReport: 'A search warrant at the incubator lab revealed locked server racks containing the foreign acquisition contract between Marcus Chen and Aegis Global.'
    },
    {
      id: 'storm_drain_parkade',
      title: 'Rear Service Alley Storm Drain',
      subtitle: 'Behind Riverside Corporate Center',
      status: 'Forensic Recovery Site',
      lastVisited: 'Pending Dive Sweep',
      witnesses: 'None',
      notes: 'Maintenance access drain located beneath the rear emergency fire exit stairs.',
      isInitiallyUnlocked: false,
      leadSource: {
        type: 'suspect_clue',
        sourceName: "Diana Wilkins's Confession",
        description: 'Diana witnessed someone sprint toward the rear alley storm drain and ditch something heavy.'
      },
      hiddenEvidenceIds: ['damascus_letter_opener', 'parkade_security_log'],
      canvassReport: 'CSI recovery divers dredged the rear alley drain, retrieving the bloodstained Damascus letter opener and recovering parkade Gate B scanner records.'
    }
  ],
  evidence: [
    {
      id: 'autopsy_report',
      title: 'Medical Examiner Autopsy Report',
      subtitle: 'Coroner Case #ME-2025-091',
      details: 'Victim suffered a single 4-inch deep penetration to the upper thorax puncturing the left ventricle. Estimated time of death: 10:45 PM ± 30 mins. Defensive abrasions on forearms indicate victim fought his attacker.',
      date: 'April 18, 2025',
      location: 'County Morgue',
      priority: 'Critical',
      isInitiallyUnlocked: true,
      discoveryType: 'initial'
    },
    {
      id: 'crime_scene_photos',
      title: 'Executive Office Crime Scene Photos',
      subtitle: 'Crime Scene Investigation Unit',
      details: 'High-res photos show shattered porcelain mug on hardwood floor, an open wall safe behind the mahogany portrait, and empty velvet slot in the desk organizer where an antique Damascus letter opener usually sat.',
      date: 'April 18, 2025',
      location: 'Riverside Corporate Center',
      priority: 'High',
      isInitiallyUnlocked: true,
      discoveryType: 'initial'
    },
    {
      id: 'camera_override_log',
      title: 'Building Server Override Audit Trail',
      subtitle: '42nd Floor Security Subsystem',
      details: 'Diagnostic log showing administrative credentials for Diana Wilkins were used at 10:32 PM to trigger an emergency firmware reset loop on the 42nd-floor cameras, blindfolding the surveillance system until 11:18 PM.',
      date: 'April 17, 2025',
      location: 'TechVision Mainframe',
      priority: 'Critical',
      isInitiallyUnlocked: false,
      discoveryType: 'location_canvass',
      locationId: 'riverside_corporate_center'
    },
    {
      id: 'threatening_email',
      title: 'Threatening Anonymous Email',
      subtitle: 'Recovered from Victim\'s Laptop Inbox',
      details: 'Sent April 17 at 8:12 PM: "If you move forward with the board vote tomorrow morning, you will not live to see the market open. Sign the waiver or suffer the consequences." Origin IP: Riverside Brews Wi-Fi.',
      date: 'April 17, 2025',
      location: 'Riverside Brews / TechVision Servers',
      priority: 'High',
      isInitiallyUnlocked: false,
      discoveryType: 'location_canvass',
      locationId: 'riverside_brews'
    },
    {
      id: 'barista_statement',
      title: 'Barista Sworn Deposition',
      subtitle: 'Witness Alex Rivera',
      details: 'Alex testifies that Marcus Chen was at Riverside Brews at 10:15 PM, but got into an agitated phone argument shouting "The patent deal is happening tonight whether Michael likes it or not!" and rushed out the door at 10:35 PM, leaving half a cup of cold espresso behind.',
      date: 'April 19, 2025',
      location: 'Riverside Brews',
      priority: 'Critical',
      isInitiallyUnlocked: false,
      discoveryType: 'location_canvass',
      locationId: 'riverside_brews'
    },
    {
      id: 'parkade_security_log',
      title: 'Corporate Parkade Access Log',
      subtitle: 'Automated License Plate & Keycard Scanner',
      details: 'Black Audi sedan registered to Marcus Chen entered the executive underground parking gate at 10:48 PM and departed at 11:22 PM. This directly conflicts with any alibi placing him miles away at that hour.',
      date: 'April 17, 2025',
      location: 'Riverside Corporate Center Gate B',
      priority: 'Critical',
      isInitiallyUnlocked: false,
      discoveryType: 'location_canvass',
      locationId: 'storm_drain_parkade'
    },
    {
      id: 'damascus_letter_opener',
      title: 'Bloody Damascus-Steel Letter Opener',
      subtitle: 'Recovered Murder Weapon',
      details: 'Antique 8-inch steel blade recovered from the rear storm drain. Forensic lab tests confirm Michael Reynolds\'s blood on the blade and a partial latent fingerprint matching Marcus Chen on the brass hilt.',
      date: 'April 20, 2025',
      location: 'Rear Service Alley Storm Drain',
      priority: 'Critical',
      isInitiallyUnlocked: false,
      isMurderWeapon: true,
      discoveryType: 'location_canvass',
      locationId: 'storm_drain_parkade'
    },
    {
      id: 'secret_partnership_agreement',
      title: 'Drafted Foreign Acquisition Contract',
      subtitle: 'Aegis Global Ltd & Marcus Chen',
      details: 'Confidential contract showing Marcus Chen secretly agreed to sell TechVision\'s neural encryption source code for $14,000,000. A handwritten note on the draft from Michael reads: "Over my dead body. Criminal fraud referral filed with SEC."',
      date: 'April 12, 2025',
      location: 'Marcus\'s Offsite Lab Safe',
      priority: 'Critical',
      isInitiallyUnlocked: false,
      discoveryType: 'location_canvass',
      locationId: 'marcus_offsite_lab'
    }
  ],
  suspects: [
    {
      id: 'marcus_chen',
      name: 'Marcus Chen',
      role: 'Co-Founder & Chief Technology Officer',
      trait: 'Arrogant, calculating, easily defensive when trapped by hard data',
      personality: 'cunning',
      isInitiallyUnlocked: true,
      initialTrust: 45,
      initialStress: 8,
      isPrimeSuspect: true,
      category: 'prime_suspect',
      alibi: 'Claims he was working alone at Riverside Brews coffee shop on 5th Street from 9:30 PM until after midnight, minding his own business and writing code.',
      motive: 'Michael caught him selling confidential company patents to Aegis Global and threatened to fire him and send him to federal prison the following morning.',
      privateKnowledge: 'He left the coffee shop in a panic after Michael rejected his phone call, drove his Audi to the office, entered via parking gate B, confronted Michael in the penthouse, and stabbed him with the letter opener during a struggle when Michael reached for the phone to call 911.',
      secrets: [
        'Admitted leaving the coffee shop before 11 PM',
        'Confessed to driving to Riverside Corporate Center that night',
        'Admitted having a furious confrontation with Michael over the Aegis patent contract',
        'Broke down and confessed to stabbing Michael with the desk letter opener in a fit of rage'
      ],
      breakdownThreshold: 90,
      evidenceReactions: {
        parkade_security_log: 'His jaw tightens and his hands shake. He stammers that he might have "just stopped by for five minutes to grab his laptop."',
        barista_statement: 'He curses under his breath and admits he lied about sipping coffee peacefully until midnight.',
        secret_partnership_agreement: 'He turns pale: "Michael wasn\'t supposed to have seen that yet... that wasn\'t finalized!"',
        damascus_letter_opener: 'Complete emotional breakdown. He clutches his face: "It was an accident! He wouldn\'t listen to reason!"'
      }
    },
    {
      id: 'sarah_reynolds',
      name: 'Sarah Reynolds',
      role: 'Victim\'s Sister & Venture Capitalist',
      trait: 'Grieving, high-strung, guarded about her catastrophic debts',
      personality: 'defensive',
      isInitiallyUnlocked: true,
      initialTrust: 40,
      initialStress: 5,
      isPrimeSuspect: true,
      category: 'prime_suspect',
      alibi: 'Claims she was at her downtown condo all night watching television and crying after an argument with Michael earlier that afternoon.',
      motive: 'Named sole beneficiary of Michael\'s $2M life insurance policy; facing imminent bankruptcy from leveraged crypto positions.',
      privateKnowledge: 'She went to the corporate building at 8:00 PM to plead with Michael for cash. He threw her out. She went home before 9:30 PM and did not kill him, but feared she would be framed because of the life insurance payout.',
      secrets: [
        'Admitted she visited Michael at 8:00 PM for money and was rejected',
        'Confessed she was deeply in debt and aware of the $2M life insurance policy',
        'Revealed she saw Marcus Chen lurking in the lobby when she departed at 8:30 PM'
      ],
      breakdownThreshold: 90,
      evidenceReactions: {
        threatening_email: 'She swears on her mother\'s grave that she never sent that email: "Check the IP, I don\'t even know what Riverside Brews is!"',
        crime_scene_photos: 'Breaks into genuine tears seeing her brother\'s office.'
      }
    },
    {
      id: 'diana_wilkins',
      name: 'Diana Wilkins',
      role: 'Lead Systems Architect & Penthouse Neighbor',
      trait: 'Nervous, talkative, terrified of getting caught in an illegal conspiracy',
      personality: 'nervous',
      isInitiallyUnlocked: false,
      leadSource: {
        type: 'evidence_mention',
        sourceName: 'Building Server Override Audit Trail',
        description: 'Diana Wilkins\'s administrative credentials were used to blind the 42nd-floor cameras during the murder window.'
      },
      initialTrust: 55,
      initialStress: 10,
      isPrimeSuspect: true,
      category: 'prime_suspect',
      alibi: 'Claims she was at home running scheduled server updates from her couch and heard a muffled thud through the building walls around 11:00 PM.',
      motive: 'Marcus Chen held compromising personal information on her and coerced her into disabling building security cameras.',
      privateKnowledge: 'Marcus cornered her at 5:00 PM and threatened to leak her private data unless she wiped the 42nd-floor camera feed between 10:30 and 11:15 PM. She complied out of terror, but preserved the audit logs in secret.',
      secrets: [
        'Admitted she was blackmailed by Marcus Chen',
        'Confessed she disabled the 42nd-floor security cameras from 10:32 PM to 11:18 PM on Marcus\'s orders',
        'Revealed she saw Marcus running out of the fire exit stairs toward the rear alley storm drain at 11:20 PM'
      ],
      breakdownThreshold: 90,
      evidenceReactions: {
        camera_override_log: 'She bursts into tears: "Marcus made me do it! He swore he was just going to delete a file from Michael\'s computer, he said nobody would get hurt!"',
        secret_partnership_agreement: 'She confirms Marcus had been accessing unauthorized offshore servers for weeks.'
      }
    },
    {
      id: 'alex_rivera',
      name: 'Alex Rivera',
      role: 'Night Barista at Riverside Brews',
      trait: 'Observant, street-smart, defensive about tipping rules and customer privacy',
      personality: 'confident',
      isInitiallyUnlocked: false,
      leadSource: {
        type: 'location_mention',
        sourceName: 'Riverside Brews Cafe',
        description: 'Night Barista on duty at Riverside Brews coffee shop.'
      },
      initialTrust: 60,
      initialStress: 4,
      isPrimeSuspect: false,
      category: 'witness',
      alibi: 'Behind the espresso bar from 3:00 PM until closing up at 11:30 PM.',
      motive: 'None against the victim; accepted cash from Marcus to keep quiet about his departure.',
      privateKnowledge: 'Marcus sat at the corner booth sweating over his phone. At 10:35 PM, Marcus shouted on a call and stormed out into the rain without his jacket. He also saw someone typing on the cafe Wi-Fi around 8:00 PM when the threatening email was sent.',
      secrets: [
        'Admitted Marcus rushed out of the cafe in a panic at 10:35 PM, leaving half a cup of cold espresso and his coat',
        'Confessed Marcus handed him a $100 bill and muttered "Tell anyone who asks that I was sitting right here all night"',
        'Revealed Marcus returned to the coffee shop at 11:35 PM drenched in rain with mud on his shoes looking terrified'
      ],
      breakdownThreshold: 90,
      evidenceReactions: {
        threatening_email: 'He points at the paper: "That timestamp—8:12 PM! Marcus was sitting right near the router then, furiously typing on his MacBook!"',
        barista_statement: 'He sighs: "You got my statement already. I told you everything except the bribe. Don\'t arrest me, man."',
        parkade_security_log: 'He shakes his head: "Corporate center is only a 10-minute drive from the cafe. He easily could have driven there after 10:35 PM."'
      }
    },
    {
      id: 'leo_vance',
      name: 'Leo Vance',
      role: 'Senior Hardware Engineer at Pier 9 Lab',
      trait: 'Bitter, sharp-tongued engineer, obsessed with proprietary patents and unpaid royalties',
      personality: 'aggressive',
      isInitiallyUnlocked: false,
      leadSource: {
        type: 'location_mention',
        sourceName: "Marcus's Offsite Hardware Lab",
        description: 'Senior hardware engineer at Pier 9 Unit 4.'
      },
      initialTrust: 45,
      initialStress: 6,
      isPrimeSuspect: false,
      category: 'person_of_interest',
      alibi: 'Claims he was working alone soldering prototype boards at the Pier 9 lab until midnight.',
      motive: 'Michael refused to grant him co-inventor status on the neural patents; Leo was secretly copying code for Marcus.',
      privateKnowledge: 'Marcus called him in an absolute panic at 11:28 PM demanding he purge all offsite lab hard drives. Leo refused to delete the logs because he wanted leverage for his unpaid severance. Marcus showed up at the lab at 11:40 PM with scraped knuckles and blood on his cuff.',
      secrets: [
        'Admitted Marcus called him at 11:28 PM ordering an emergency wipe of the Pier 9 server racks',
        'Confessed Marcus showed up at the lab at 11:40 PM breathing raggedly with bruised knuckles and a stain on his shirt cuff',
        'Revealed the security PIN code to the wall safe where Marcus kept the draft contracts with Aegis Global'
      ],
      breakdownThreshold: 90,
      evidenceReactions: {
        secret_partnership_agreement: 'Leo snaps: "Marcus swore this was just a harmless joint venture! He lied to all of us—he was gutting the whole company!"',
        damascus_letter_opener: 'Leo recoils: "That was Michael\'s personal pride and joy. Marcus always twirled it on his fingers during executive reviews."'
      }
    },
    {
      id: 'maria_garcia',
      name: 'Maria Garcia',
      role: 'Night Shift Custodian at Riverside Corporate Center',
      trait: 'Observant, polite, terrified of losing her job or immigration status',
      personality: 'nervous',
      isInitiallyUnlocked: false,
      leadSource: {
        type: 'location_mention',
        sourceName: 'Riverside Corporate Center',
        description: 'Night shift custodian on duty at the corporate center.'
      },
      initialTrust: 65,
      initialStress: 5,
      isPrimeSuspect: false,
      category: 'witness',
      alibi: 'Cleaning the 38th through 41st floor restrooms and cubicles between 9:00 PM and 11:00 PM.',
      motive: 'None. She discovered Michael\'s body the next morning at 8:45 AM while doing her morning rounds.',
      privateKnowledge: 'While running the floor buffer on 41 around 10:45 PM, she heard loud shouting and glass breaking upstairs in the penthouse. At 11:18 PM, she heard somebody sprinting down the metal emergency fire stairs, followed by an emergency exit door clattering shut in the rear service alley.',
      secrets: [
        'Admitted hearing loud crashing and raised voices from the 42nd-floor penthouse between 10:45 PM and 11:00 PM',
        'Confessed she looked through the stairwell window and saw a man with Marcus\'s build running down the stairs toward the alley',
        'Revealed she saw a dark Audi speed out of Gate B into the street without headlights at 11:22 PM'
      ],
      breakdownThreshold: 90,
      evidenceReactions: {
        parkade_security_log: 'She nods vigorously: "Yes! That black car with the shiny rims, it tore out of Gate B so fast it almost hit the dumpster!"',
        crime_scene_photos: 'She clutches her rosary: "The broken coffee mug... I heard that crash while I was emptying trash on 41!"'
      }
    }
  ],
  groundTruth: {
    killer: 'marcus_chen',
    motive: 'patent_theft_and_coverup',
    weapon: 'damascus_letter_opener',
    keyContradiction: 'coffee_shop_alibi_vs_parkade_log',
    timelineSummary: 'Marcus met Aegis Global to sell TechVision neural patents for $14M. Michael discovered the betrayal and threatened criminal prosecution. Marcus staged an alibi at Riverside Brews, drove his Audi to the parkade at 10:48 PM, had Diana disable the cameras, stabbed Michael with the desk letter opener during an argument, dropped the weapon in the rear alley storm drain, and fled at 11:22 PM.',
    archetype: 'multi_crime_convergence',
    fallGuy: 'diana_wilkins',
    redHerringCrime: 'Diana Wilkins embezzled $2.3M in bearer bonds and accessed the executive safe at 10:45 PM; Sarah Reynolds engaged in a violent shouting match at 9:45 PM and shattered a wine glass. Both act guilty of their respective crimes, but neither committed homicide.'
  },
  isDefault: true
};
