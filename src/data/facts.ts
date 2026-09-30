// Verified facts about Fitness Options (research, 30 Sep 2026). Nothing in this file is invented.
// Everything else the demo shows is sample data and is labelled as such in the UI.

export const GYM = {
  name: "Fitness Options",
  legalName: "Fitness Options Limited",
  tagline: "enjoy your body",
  bio: "Transforming lives daily",
  focus: ["Weight Management", "Coaching", "Wellness"],
  area: "Aguda, Surulere, Lagos",
  phoneDisplay: "+234 706 965 1085",
  phoneE164: "2347069651085",
  instagram: "fitnessoptionsng",
  hours: "Mon–Sun, 6am – 10pm",
  monthlyFeeNgn: 18_000,
  facilities: [
    "Strength room",
    "Cardio room",
    "Treadmill & cycling room (4 treadmills, ~8 bikes)",
    "Sauna",
  ],
  classes: ["Aerobics", "Tabata", "Step", "Dance", "Insanity", "Kickboxing"],
  signature: "No Gym Wear Day — aerobics in your traditional outfit",
} as const;

export const FACT_SOURCES = [
  "Instagram @fitnessoptionsng (bio, location tags, classes, events, WhatsApp link)",
  "africabz.com listing (hours, ₦18,000/month, facilities from reviews)",
  "gymsquare.ng (classes on rotation)",
] as const;
