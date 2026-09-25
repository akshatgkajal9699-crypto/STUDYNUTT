export type Difficulty = 'Easy' | 'Medium' | 'Hard';

export interface StudyQuestion {
  id: string;
  subject: string;
  difficulty: Difficulty;
  prompt: string;
  answers: string[];
  correctIndex: number;
  explanation: string;
  chapter: string;
}

export const QUESTION_BANK: StudyQuestion[] = [
  {
    id: 'math-fractions-01',
    subject: 'Mathematics',
    difficulty: 'Easy',
    prompt: 'Calculate ¾ + ⅛.',
    answers: ['⅞', '1', '⅝', '1⅛'],
    correctIndex: 0,
    explanation: 'Convert ¾ to eighths: ¾ = 6/8. Then 6/8 + 1/8 = 7/8.',
    chapter: 'Fractions',
  },
  {
    id: 'math-algebra-02',
    subject: 'Mathematics',
    difficulty: 'Medium',
    prompt: 'Solve 3x − 5 = 16.',
    answers: ['x = 5', 'x = 7', 'x = 11', 'x = 21'],
    correctIndex: 1,
    explanation: 'Add 5 to both sides to get 3x = 21. Divide by 3, so x = 7.',
    chapter: 'Linear equations',
  },
  {
    id: 'math-sequences-03',
    subject: 'Mathematics',
    difficulty: 'Medium',
    prompt: 'The sequence begins 4, 7, 10, 13 … What is the 25th term?',
    answers: ['70', '73', '76', '79'],
    correctIndex: 2,
    explanation: 'The common difference is 3. The nth term is 4 + 3(n − 1), so the 25th term is 4 + 72 = 76.',
    chapter: 'Sequences',
  },
  {
    id: 'math-ratio-04',
    subject: 'Mathematics',
    difficulty: 'Hard',
    prompt: '£36 is shared in the ratio 2:4. What is the smaller share?',
    answers: ['£6', '£12', '£18', '£24'],
    correctIndex: 1,
    explanation: 'There are 6 parts altogether. Each part is £36 ÷ 6 = £6, so the smaller share is 2 × £6 = £12.',
    chapter: 'Ratio',
  },
  {
    id: 'math-geometry-05',
    subject: 'Mathematics',
    difficulty: 'Easy',
    prompt: 'Two angles in a triangle are 54° and 63°. Find the third angle.',
    answers: ['53°', '63°', '73°', '117°'],
    correctIndex: 1,
    explanation: 'Angles in a triangle add to 180°. The missing angle is 180° − 54° − 63° = 63°.',
    chapter: 'Geometry',
  },
  {
    id: 'science-photosynthesis-01',
    subject: 'Integrated Science',
    difficulty: 'Easy',
    prompt: 'Which two raw materials do plants use in photosynthesis?',
    answers: ['Oxygen and glucose', 'Carbon dioxide and water', 'Nitrogen and oxygen', 'Glucose and water'],
    correctIndex: 1,
    explanation: 'Plants use carbon dioxide and water, with light energy, to make glucose and oxygen.',
    chapter: 'Photosynthesis',
  },
  {
    id: 'science-states-02',
    subject: 'Integrated Science',
    difficulty: 'Medium',
    prompt: 'What happens to the particles of a liquid as it is heated?',
    answers: ['They lose energy and stop', 'They gain energy and move faster', 'They become smaller', 'They lose mass'],
    correctIndex: 1,
    explanation: 'Heating transfers energy to the particles. They move faster and can eventually overcome the forces holding them in the liquid.',
    chapter: 'Particle model',
  },
  {
    id: 'science-cells-03',
    subject: 'Integrated Science',
    difficulty: 'Hard',
    prompt: 'Which cell structure controls what enters and leaves the cell?',
    answers: ['Cell membrane', 'Nucleus', 'Cytoplasm', 'Cell wall'],
    correctIndex: 0,
    explanation: 'The cell membrane forms a selectively permeable boundary around the cell.',
    chapter: 'Cells',
  },
  {
    id: 'physics-waves-01',
    subject: 'Physics',
    difficulty: 'Easy',
    prompt: 'A wave has a frequency of 50 Hz and a wavelength of 0.8 m. What is its speed?',
    answers: ['40 m/s', '62.5 m/s', '49.2 m/s', '0.016 m/s'],
    correctIndex: 0,
    explanation: 'Use v = fλ. So v = 50 × 0.8 = 40 m/s.',
    chapter: 'Waves',
  },
  {
    id: 'physics-current-02',
    subject: 'Physics',
    difficulty: 'Medium',
    prompt: 'A charge of 12 C passes a point in 4 s. What is the current?',
    answers: ['3 A', '8 A', '16 A', '48 A'],
    correctIndex: 0,
    explanation: 'Current I = Q ÷ t = 12 ÷ 4 = 3 A.',
    chapter: 'Electricity',
  },
  {
    id: 'physics-energy-03',
    subject: 'Physics',
    difficulty: 'Hard',
    prompt: 'A 2 kg object accelerates at 3 m/s². What resultant force acts on it?',
    answers: ['1.5 N', '5 N', '6 N', '9 N'],
    correctIndex: 2,
    explanation: 'Newton’s second law gives F = ma = 2 × 3 = 6 N.',
    chapter: 'Forces',
  },
  {
    id: 'chemistry-atoms-01',
    subject: 'Chemistry',
    difficulty: 'Easy',
    prompt: 'The atomic number of an element tells you its number of…',
    answers: ['neutrons', 'protons', 'shells', 'isotopes'],
    correctIndex: 1,
    explanation: 'Atomic number is the number of protons in the nucleus. In a neutral atom it also equals the number of electrons.',
    chapter: 'Atomic structure',
  },
  {
    id: 'chemistry-bonding-02',
    subject: 'Chemistry',
    difficulty: 'Medium',
    prompt: 'What happens when two non-metal atoms form a covalent bond?',
    answers: ['They share a pair of electrons', 'They exchange protons', 'They share neutrons', 'One atom loses its nucleus'],
    correctIndex: 0,
    explanation: 'A covalent bond is a shared pair of electrons between atoms.',
    chapter: 'Bonding',
  },
  {
    id: 'chemistry-acids-03',
    subject: 'Chemistry',
    difficulty: 'Hard',
    prompt: 'A solution has a pH of 2. Which statement is correct?',
    answers: ['It is a strong alkali', 'It is acidic', 'It is neutral', 'It contains no ions'],
    correctIndex: 1,
    explanation: 'Values below pH 7 are acidic. A pH of 2 is strongly acidic.',
    chapter: 'Acids and bases',
  },
  {
    id: 'biology-cells-01',
    subject: 'Biology',
    difficulty: 'Easy',
    prompt: 'Which organelle is the main site of aerobic respiration?',
    answers: ['Ribosome', 'Mitochondrion', 'Cell wall', 'Vacuole'],
    correctIndex: 1,
    explanation: 'Mitochondria are the main site of aerobic respiration and release usable energy for the cell.',
    chapter: 'Cell biology',
  },
  {
    id: 'biology-diffusion-02',
    subject: 'Biology',
    difficulty: 'Medium',
    prompt: 'Which description best defines diffusion?',
    answers: ['Water moving through a membrane', 'Particles moving from high to low concentration', 'Particles moving using ATP', 'A liquid changing to gas'],
    correctIndex: 1,
    explanation: 'Diffusion is the net movement of particles from a region of higher concentration to lower concentration.',
    chapter: 'Movement in and out of cells',
  },
  {
    id: 'biology-enzymes-03',
    subject: 'Biology',
    difficulty: 'Hard',
    prompt: 'Why does an enzyme stop working after being exposed to very high temperature?',
    answers: ['Its active site changes shape', 'It turns into a substrate', 'It gains extra amino acids', 'It becomes a cell'],
    correctIndex: 0,
    explanation: 'High temperature can denature an enzyme, changing the shape of its active site so the substrate no longer fits.',
    chapter: 'Enzymes',
  },
  {
    id: 'english-grammar-01',
    subject: 'English',
    difficulty: 'Easy',
    prompt: 'Which word is the conjunction in “Although it rained, the match continued”?',
    answers: ['rained', 'match', 'continued', 'Although'],
    correctIndex: 3,
    explanation: '“Although” joins the dependent clause to the main clause and signals contrast.',
    chapter: 'Grammar',
  },
  {
    id: 'english-analysis-02',
    subject: 'English',
    difficulty: 'Medium',
    prompt: 'A writer describes a room as “a cage of silence”. Which technique is used?',
    answers: ['Simile', 'Metaphor', 'Onomatopoeia', 'Rhyme'],
    correctIndex: 1,
    explanation: 'The room is directly compared to a cage without using “like” or “as”, so this is a metaphor.',
    chapter: 'Language analysis',
  },
  {
    id: 'english-purpose-03',
    subject: 'English',
    difficulty: 'Hard',
    prompt: 'When analysing an extract, what should you explain after identifying a quotation?',
    answers: ['Only the word count', 'How the writer’s choices shape meaning and reader response', 'The author’s biography', 'Whether you agree with the plot'],
    correctIndex: 1,
    explanation: 'A strong response links a precise detail to its effect and to the writer’s purpose.',
    chapter: 'Reading skills',
  },
  {
    id: 'economics-demand-01',
    subject: 'Economics',
    difficulty: 'Medium',
    prompt: 'If demand rises while supply stays the same, what usually happens to equilibrium price?',
    answers: ['It rises', 'It falls', 'It stays at zero', 'It becomes a tax'],
    correctIndex: 0,
    explanation: 'With more buyers competing for the same supply, equilibrium price usually rises.',
    chapter: 'Demand and supply',
  },
  {
    id: 'business-revenue-01',
    subject: 'Business Studies',
    difficulty: 'Easy',
    prompt: 'A business sells 40 items for £8 each. What is its total revenue?',
    answers: ['£48', '£320', '£328', '£5'],
    correctIndex: 1,
    explanation: 'Total revenue = price × quantity = £8 × 40 = £320.',
    chapter: 'Business calculations',
  },
  {
    id: 'geography-rivers-01',
    subject: 'Geography',
    difficulty: 'Medium',
    prompt: 'Which process most directly rounds rocks carried along a river bed?',
    answers: ['Hydraulic action', 'Abrasion', 'Deposition', 'Infiltration'],
    correctIndex: 1,
    explanation: 'Abrasion occurs when transported rocks scrape and collide with the river bed and banks.',
    chapter: 'River processes',
  },
  {
    id: 'history-evidence-01',
    subject: 'History',
    difficulty: 'Medium',
    prompt: 'Which question best tests the reliability of a historical source?',
    answers: ['Is it written in long paragraphs?', 'Who created it, when, and for what purpose?', 'Does it use a map?', 'Is it the oldest source?'],
    correctIndex: 1,
    explanation: 'Provenance—author, date, purpose, and audience—helps assess how and why a source may be reliable or limited.',
    chapter: 'Source analysis',
  },
  {
    id: 'global-evidence-01',
    subject: 'Global Perspectives',
    difficulty: 'Easy',
    prompt: 'Which is the strongest support for a claim in a research report?',
    answers: ['A personal guess', 'A recent, relevant dataset with a clear source', 'A catchy slogan', 'An anonymous comment'],
    correctIndex: 1,
    explanation: 'Evidence is strongest when it is relevant, verifiable, and comes from a credible source.',
    chapter: 'Research skills',
  },
];

export interface WrittenPrompt {
  prompt: string;
  markingGuide: string;
}

export const WRITTEN_PROMPTS: Record<string, WrittenPrompt[]> = {
  Mathematics: [
    {
      prompt: 'Solve x² − 5x + 6 = 0. Show a method that would earn full working marks.',
      markingGuide: 'Factorise to (x − 2)(x − 3) = 0, then state x = 2 or x = 3.',
    },
    {
      prompt: 'A cylinder has radius 3 cm and height 8 cm. Write its volume in terms of π.',
      markingGuide: 'Use V = πr²h. Substitution gives π × 3² × 8 = 72π cm³.',
    },
  ],
  Physics: [
    {
      prompt: 'A wave has frequency 50 Hz and wavelength 0.8 m. Calculate its speed and state the equation used.',
      markingGuide: 'Use v = fλ. Substitute 50 × 0.8 to obtain 40 m/s.',
    },
    {
      prompt: 'Explain why a metal spoon becomes warm when one end is placed in hot water.',
      markingGuide: 'Particles and free electrons transfer energy through the metal from the hotter end to the cooler end by conduction.',
    },
  ],
  Chemistry: [
    {
      prompt: 'Describe what happens to electrons when magnesium reacts with oxygen to form magnesium oxide.',
      markingGuide: 'Magnesium atoms lose two electrons to form Mg²⁺. Oxygen atoms gain two electrons to form O²⁻; electrostatic attraction forms an ionic bond.',
    },
    {
      prompt: 'Explain why increasing temperature usually increases the rate of a chemical reaction.',
      markingGuide: 'Particles move faster, collide more often, and a greater proportion have energy at least equal to the activation energy.',
    },
  ],
  Biology: [
    {
      prompt: 'Describe how a red blood cell is adapted to transport oxygen.',
      markingGuide: 'It contains haemoglobin, has a biconcave shape for a large surface area, and lacks a nucleus to leave more room for haemoglobin.',
    },
    {
      prompt: 'Explain how a high temperature can affect an enzyme-controlled reaction.',
      markingGuide: 'The enzyme may denature; its active site changes shape, so fewer substrate molecules bind and the rate falls.',
    },
  ],
  'Integrated Science': [
    {
      prompt: 'Describe the role of light in photosynthesis and name one product.',
      markingGuide: 'Chlorophyll absorbs light energy, which drives the reaction that makes glucose from carbon dioxide and water. Oxygen is another product.',
    },
  ],
};

export const SUBJECTS_BY_GRADE: Record<'lower' | 'upper', string[]> = {
  lower: [
    'Mathematics',
    'Integrated Science',
    'English',
    'Global Perspectives',
    'Computing',
  ],
  upper: [
    'Mathematics',
    'Additional Mathematics',
    'Physics',
    'Chemistry',
    'Biology',
    'English',
    'Economics',
    'Business Studies',
    'Geography',
    'History',
    'French',
    'Spanish',
    'Arabic',
  ],
};

export function subjectsForGrade(grade: number) {
  return grade <= 8 ? SUBJECTS_BY_GRADE.lower : SUBJECTS_BY_GRADE.upper;
}

export function questionsForSubject(subject: string, difficulty?: string) {
  const resolvedSubject = subject === 'Additional Mathematics' ? 'Mathematics' : subject;
  return QUESTION_BANK.filter(
    (question) =>
      question.subject === resolvedSubject &&
      (!difficulty || question.difficulty === difficulty),
  );
}

export function findQuestion(questionId: string) {
  return QUESTION_BANK.find((question) => question.id === questionId);
}