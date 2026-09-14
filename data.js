// Each class within a year is defined as { name: "...", reps: N }
// "reps" = number of representative seats for that class (this drives the
// "Rep Number" dropdown and the odd/even General/Reserved seat labelling
// on the Class-wise Details form).
//
// DEFAULT_REPS is used automatically whenever a class doesn't specify "reps"
// — i.e. any manually-typed class, or a class in a college that hasn't been
// filled in below yet (Majlis College, CPA College). You can override the
// default per-class right there on the form when adding a manual class.

const DEFAULT_REPS = 2;

const COLLEGES = {
  "SAFA College": {
    "UG First Year": [
      {name:"BCOM CA", reps:2}, {name:"BCA", reps:2}, {name:"BBA", reps:2}, {name:"BCOM FIN", reps:2},
      {name:"BSW", reps:2}, {name:"BAMC", reps:2}, {name:"GEOGRAPHY", reps:2}, {name:"ENGLISH", reps:2},
      {name:"BAEFT", reps:2}, {name:"PSYCHOLOGY", reps:2}, {name:"MICRO BIOLOGY", reps:2}
    ],
    "UG Second Year": [
      {name:"BCOM CA", reps:2}, {name:"BCA", reps:2}, {name:"BBA", reps:2}, {name:"BCOM FIN", reps:2},
      {name:"BSW", reps:2}, {name:"BAMC", reps:2}, {name:"GEOGRAPHY", reps:2}, {name:"ENGLISH", reps:2},
      {name:"BAEFT", reps:2}, {name:"PSYCHOLOGY", reps:2}, {name:"MICRO BIOLOGY", reps:2}
    ],
    "UG Third Year": [
      {name:"BCOM CA", reps:2}, {name:"BCA", reps:2}, {name:"BBA", reps:2}, {name:"BCOM FIN", reps:2},
      {name:"BSW", reps:2}, {name:"BAMC", reps:2}, {name:"GEOGRAPHY", reps:2}, {name:"ENGLISH", reps:2},
      {name:"BAEFT", reps:2}, {name:"PSYCHOLOGY", reps:2}
    ],
    "PG First Year": [
      {name:"MA ENGLISH", reps:1}, {name:"MCOM", reps:1}, {name:"MA ECONOMICS", reps:1}
    ],
    "PG Second Year": [
      {name:"MA ENGLISH", reps:1}, {name:"MCOM", reps:1}, {name:"MA ECONOMICS", reps:1}
    ]
  },

  // -----------------------------------------------------------------------
  // No data yet for this college. Fill it in using the exact same format as
  // SAFA College above (add years as keys, each with an array of
  // {name, reps} objects) whenever the details are finalised. Example:
  //
  // "Majlis College": {
  //   "UG First Year": [ {name:"BCOM", reps:2}, {name:"BCA", reps:1} ]
  // },
  //
  // Until then, anyone can still enter data for this college on the form —
  // they'll type the year/class manually and it'll default to
  // DEFAULT_REPS (2) reps, editable on the form itself.
  "Majlis College": {},

  "MES KVM College": {
    "UG First Year": [
      {name:"B.COM FINANCE", reps:2}, {name:"B.COM CA", reps:2}, {name:"B.COM SF", reps:2},
      {name:"PHYSICS", reps:2}, {name:"CHEMISTRY", reps:2}, {name:"BCA", reps:2},
      {name:"ZOOLOGY", reps:2}, {name:"BOTANY", reps:1}, {name:"PSYCHOLOGY", reps:2},
      {name:"BVOC RETAIL", reps:2}, {name:"BVOC OPTO", reps:2}, {name:"BAFE", reps:2}
    ],
    "UG Second Year": [
      {name:"B.COM FINANCE", reps:2}, {name:"B.COM CA", reps:2}, {name:"B.COM SF", reps:2},
      {name:"PHYSICS", reps:2}, {name:"CHEMISTRY", reps:2}, {name:"BCA", reps:2},
      {name:"ZOOLOGY", reps:2}, {name:"BOTANY", reps:1}, {name:"PSYCHOLOGY", reps:2},
      {name:"BVOC RETAIL", reps:2}, {name:"BVOC OPTO", reps:2}, {name:"BAFE", reps:2}
    ],
    "UG Third Year": [
      {name:"B.COM FINANCE", reps:2}, {name:"B.COM CA", reps:2}, {name:"B.COM SF", reps:2},
      {name:"PHYSICS", reps:2}, {name:"CHEMISTRY", reps:2}, {name:"BCA", reps:2},
      {name:"ZOOLOGY", reps:2}, {name:"BOTANY", reps:1}, {name:"PSYCHOLOGY", reps:2},
      {name:"BVOC RETAIL", reps:2}, {name:"BVOC OPTO", reps:2}, {name:"BAFE", reps:2}
    ],
    "PG First Year": [
      {name:"MCOM", reps:1}, {name:"MSC PHYSICS", reps:1}, {name:"MSC COMPUTER SCIENCE", reps:1},
      {name:"MSC POLYMER CHEMISTRY", reps:1}, {name:"MA ENGLISH", reps:1}, {name:"MSC ZOOLOGY", reps:1},
      {name:"MSC PSYCHOLOGY", reps:1}, {name:"MSC BOTANY", reps:1}
    ],
    "PG Second Year": [
      {name:"MCOM", reps:1}, {name:"MSC PHYSICS", reps:1}, {name:"MSC COMPUTER SCIENCE", reps:1},
      {name:"MSC POLYMER CHEMISTRY", reps:1}, {name:"MA ENGLISH", reps:1}, {name:"MSC ZOOLOGY", reps:1},
      {name:"MSC BOTANY", reps:1}
    ]
  },

  "KRSN College": {
    "UG First Year": [
      {name:"BCOM FINANCE", reps:2}, {name:"BCOM CA", reps:2}, {name:"BCA", reps:2}, {name:"BBA", reps:2},
      {name:"BA ECO", reps:2}, {name:"BA ENGLISH", reps:2}, {name:"PSYCHOLOGY", reps:2},
      {name:"GEOLOGY", reps:2}, {name:"BSW", reps:2}
    ],
    "UG Second Year": [
      {name:"BCOM FINANCE", reps:2}, {name:"BCOM CA", reps:2}, {name:"BCA", reps:2}, {name:"BBA", reps:2},
      {name:"BA ECO", reps:2}, {name:"PSYCHOLOGY", reps:2}, {name:"GEOLOGY", reps:2}, {name:"BSW", reps:2}
    ],
    "UG Third Year": [
      {name:"BCOM FINANCE", reps:2}, {name:"BCOM CA", reps:2}, {name:"BCA", reps:2}, {name:"BBA", reps:2},
      {name:"BA ECO", reps:2}, {name:"BA ENGLISH", reps:2}, {name:"PSYCHOLOGY", reps:2}, {name:"GEOLOGY", reps:2}
    ],
    "PG First Year": [ {name:"MSC PSYCHOLOGY", reps:2} ],
    "PG Second Year": [ {name:"MSC PSYCHOLOGY", reps:2} ]
  },

  "KMCT Law College": {
    "UG First Year": [
      {name:"B.COM", reps:4}, {name:"BBA", reps:4}, {name:"3 YEAR", reps:2}
    ],
    "UG Second Year": [
      {name:"B.COM", reps:2}, {name:"BBA", reps:4}, {name:"3 YEAR", reps:2}
    ],
    "UG Third Year": [
      {name:"B.COM", reps:4}, {name:"BBA", reps:4}, {name:"3 YEAR", reps:2}
    ],
    "UG Fourth Year": [
      {name:"B.COM", reps:2}, {name:"BBA", reps:4}
    ],
    "UG Fifth Year": [
      {name:"B.COM", reps:4}, {name:"BBA", reps:4}
    ]
  },

  // No data yet — same note as Majlis College above.
  "CPA College": {}
};

const MANUAL_OPTION = "__manual__";
