export interface StudyFlashcard {
  front: string;
  back: string;
}

export interface StudyChapter {
  title: string;
  summary: string;
  workedExample: string;
  flashcards: StudyFlashcard[];
}

export interface SubjectLearningPack {
  overview: string;
  chapters: StudyChapter[];
}

type LearningSubject =
  | 'Mathematics'
  | 'Integrated Science'
  | 'English'
  | 'Global Perspectives'
  | 'Computing'
  | 'Additional Mathematics'
  | 'Physics'
  | 'Chemistry'
  | 'Biology'
  | 'Economics'
  | 'Business Studies'
  | 'Geography'
  | 'History'
  | 'French'
  | 'Spanish'
  | 'Arabic';

const chapter = (
  title: string,
  summary: string,
  workedExample: string,
  firstFront: string,
  firstBack: string,
  secondFront: string,
  secondBack: string,
): StudyChapter => ({
  title,
  summary,
  workedExample,
  flashcards: [
    { front: firstFront, back: firstBack },
    { front: secondFront, back: secondBack },
  ],
});

export const LEARNING_CONTENT = {
  Mathematics: {
    overview:
      'Build reliable methods by showing each step, checking units, and testing whether an answer is reasonable.',
    chapters: [
      chapter(
        'Number, ratio & proportion',
        'Use equivalent fractions to add unlike denominators. Ratios compare quantities in the same order; simplify them by dividing every part by the same factor. For direct proportion, a constant multiplier links the two variables.',
        'To share 48 in the ratio 5:3, add the parts (8), find one part (48 ÷ 8 = 6), then share 30 and 18.',
        'How do you add fractions with different denominators?',
        'Rewrite them with a common denominator, add the numerators, then simplify.',
        'What does direct proportion mean?',
        'One quantity is a constant multiple of the other; their ratio stays constant.',
      ),
      chapter(
        'Algebra & graphs',
        'Treat an equation like a balance: perform the same operation on both sides. Collect like terms before solving. A straight-line graph can be written y = mx + c, where m is the gradient and c is the vertical intercept.',
        'For 3x − 5 = 16, add 5 to get 3x = 21, then divide by 3: x = 7. Check by substituting 7.',
        'What keeps an equation balanced?',
        'Doing the same valid operation to both sides.',
        'In y = mx + c, what does m represent?',
        'The gradient or rate of change of the straight line.',
      ),
      chapter(
        'Geometry & data',
        'Use angle facts before substituting into formulae: angles on a straight line sum to 180°, angles around a point to 360°, and triangle angles to 180°. For data, distinguish mean, median, mode, and range, and choose the measure that suits the distribution.',
        'A triangle with angles 48° and 67° has a third angle of 180° − 48° − 67° = 65°.',
        'What is the sum of the interior angles of a triangle?',
        '180 degrees.',
        'When is the median useful?',
        'When extreme values could distort the mean; the median is the middle ordered value.',
      ),
    ],
  },
  'Integrated Science': {
    overview:
      'Connect observations to scientific models. Record variables carefully, repeat measurements, and support conclusions with evidence.',
    chapters: [
      chapter(
        'Cells & living systems',
        'Cells are the basic units of living things. In a plant cell, the cell wall supports the cell, chloroplasts capture light for photosynthesis, and the vacuole stores cell sap. Specialised cells have structures suited to their functions.',
        'A root-hair cell has a long projection that increases surface area for absorbing water and mineral ions.',
        'Where does photosynthesis take place in a plant cell?',
        'In chloroplasts, which contain chlorophyll to absorb light.',
        'Why is a root-hair cell shaped with a long projection?',
        'It increases surface area for absorbing water and mineral ions.',
      ),
      chapter(
        'Matter & chemical change',
        'The particle model explains states and changes of state: particles in a solid vibrate in fixed positions, while particles in a gas move freely. In a chemical reaction atoms are rearranged; the total number of each type of atom is conserved.',
        'When ice melts, its particles gain energy and move past one another; the substance remains water.',
        'What happens to particles when a substance melts?',
        'They gain energy and move more freely while remaining close together.',
        'What is conserved in a chemical reaction?',
        'The number of atoms of each element; atoms are rearranged, not created or destroyed.',
      ),
      chapter(
        'Forces, energy & investigation',
        'A force can change motion or shape. Energy is transferred between stores, for example from a battery’s chemical store to an electrical circuit and then to light and thermal energy. A fair test changes one independent variable and measures one dependent variable.',
        'To compare insulation, use identical containers and volumes of hot water, change only the insulation, and measure temperature at fixed intervals.',
        'What is the independent variable?',
        'The factor deliberately changed in an investigation.',
        'Where does energy go when a lamp lights?',
        'It transfers from the electrical store mainly to light and thermal energy.',
      ),
    ],
  },
  English: {
    overview:
      'Read closely, select precise evidence, and explain how a writer’s choices shape meaning and reader response.',
    chapters: [
      chapter(
        'Reading for meaning',
        'Separate what a text states explicitly from what it implies. Infer meaning from word choice, contrast, tone, and context, then support the inference with a short quotation.',
        'If a narrator calls a room “airless” and “closed in”, the details imply discomfort or restriction; explain how those words create that impression.',
        'What is an inference?',
        'A reasoned conclusion drawn from clues in the text rather than stated directly.',
        'What makes evidence useful in an analysis?',
        'It is brief, relevant, and directly supports the point being made.',
      ),
      chapter(
        'Language & structure',
        'Name a writer’s choice only when you can explain its effect. Consider connotations, imagery, sentence length, shifts in focus, openings, and endings. Avoid treating a technique label as the explanation.',
        'A short sentence after a long description can interrupt the rhythm and make the moment feel sudden or decisive.',
        'What should follow a technique label in analysis?',
        'An explanation of how the choice affects meaning or the reader.',
        'How can sentence length shape pace?',
        'Short sentences can quicken or interrupt pace; longer ones may slow it or build detail.',
      ),
      chapter(
        'Writing with purpose',
        'Choose a clear purpose and audience before drafting. Organise ideas into paragraphs with focused topic sentences, precise vocabulary, varied sentence structures, and a final edit for accuracy.',
        'For a formal letter, state the reason for writing early, group supporting points, and end with a specific, polite request.',
        'What should a topic sentence do?',
        'Introduce the main idea of its paragraph and link to the overall purpose.',
        'What is one useful final-edit check?',
        'Check sentence boundaries, verb agreement, punctuation, and repeated words.',
      ),
    ],
  },
  'Global Perspectives': {
    overview:
      'Explore an issue through multiple viewpoints, evaluate sources, and make claims that can be tested against evidence.',
    chapters: [
      chapter(
        'Issues & perspectives',
        'A global issue affects people in different places but can be experienced locally. Compare stakeholder perspectives by considering their interests, evidence, context, and possible limitations.',
        'For water access, compare the priorities of households, farmers, local authorities, and conservation groups rather than treating the issue as having one viewpoint.',
        'What is a stakeholder?',
        'A person or group affected by an issue or able to influence it.',
        'Why compare perspectives?',
        'Different experiences and interests can reveal trade-offs and overlooked impacts.',
      ),
      chapter(
        'Sources & evidence',
        'Check who produced a source, when, why, and for whom. Reliability is specific to the claim: a source may be useful for one purpose but limited for another. Corroborate important claims with independent evidence.',
        'A campaign poster is strong evidence of how a group promotes its cause, but it may not be neutral evidence of the issue’s scale.',
        'What does provenance include?',
        'The source’s author, date, purpose, and intended audience.',
        'What is corroboration?',
        'Checking a claim against other relevant, preferably independent, evidence.',
      ),
      chapter(
        'Claims & action',
        'Build an argument with a precise claim, supporting evidence, reasoning, and a considered counterpoint. Evaluate possible actions by their feasibility, impact, cost, and effects on different groups.',
        'A school recycling proposal is stronger when it includes local waste evidence, explains the process, and anticipates practical barriers.',
        'What connects evidence to a claim?',
        'Reasoning that explains why the evidence supports that claim.',
        'Name two ways to evaluate an action.',
        'Consider its likely impact and feasibility; also examine costs and who benefits.',
      ),
    ],
  },
  Computing: {
    overview:
      'Design clear algorithms, understand how computers represent information, and protect devices and data through safe practice.',
    chapters: [
      chapter(
        'Algorithms & programming',
        'An algorithm is a finite, ordered set of steps to solve a problem. Sequence, selection, and iteration are core control structures. Trace a program with a table to track how variables change.',
        'To find the largest of three values, set largest to the first value, then compare each remaining value and update largest when needed.',
        'What is iteration?',
        'Repeating a set of instructions, usually while or until a condition is met.',
        'Why trace a program?',
        'To track variable values and find where actual behaviour differs from expected behaviour.',
      ),
      chapter(
        'Data & networks',
        'Computers store data using binary digits. Text, images, and sound are encoded as patterns of bits. Networks transfer data in packets; protocols define rules that allow devices to communicate.',
        'A pixel’s colour can be stored as a set of binary values; greater colour depth allows more distinct colours.',
        'What is a bit?',
        'A binary digit, either 0 or 1.',
        'Why are network protocols needed?',
        'They define shared rules for formatting, sending, and receiving data.',
      ),
      chapter(
        'Cyber safety & systems',
        'Use strong unique passwords, multi-factor authentication where available, and software updates. Phishing uses deceptive messages to obtain information. A system combines input, processing, storage, and output.',
        'Treat an unexpected message asking you to sign in as suspicious: check the sender independently and do not use its unverified link.',
        'What is phishing?',
        'A deceptive attempt to steal information or gain access, often through a message or fake page.',
        'What does a system’s processing stage do?',
        'It acts on input data according to instructions, producing information or an output.',
      ),
    ],
  },
  'Additional Mathematics': {
    overview:
      'Extend algebraic fluency with functions, trigonometry, and calculus. Keep domains and conditions explicit in every method.',
    chapters: [
      chapter(
        'Functions & algebra',
        'A function maps each allowed input to exactly one output. Read f(x) as the output of f for input x. Factor expressions before solving and check any values excluded by denominators.',
        'If f(x) = 2x² − 1, then f(3) = 2(9) − 1 = 17. The notation f(3) means substitute 3 for x.',
        'What is the domain of a function?',
        'The set of inputs for which the function is defined.',
        'What does f(3) mean?',
        'The value of the function when its input is 3.',
      ),
      chapter(
        'Trigonometry & graphs',
        'In a right triangle, sin θ = opposite/hypotenuse, cos θ = adjacent/hypotenuse, and tan θ = opposite/adjacent. Use the correct angle mode and state whether an answer is exact or rounded.',
        'If the opposite side is 6 and the hypotenuse is 10, sin θ = 6/10 = 0.6, so θ = sin⁻¹(0.6) in degree mode.',
        'Which ratio uses opposite over adjacent?',
        'Tangent: tan θ = opposite ÷ adjacent.',
        'What should you verify before using an inverse trig function?',
        'That the calculator is in the required angle mode and the ratio matches the diagram.',
      ),
      chapter(
        'Differentiation & change',
        'For a power term axⁿ, the derivative is anxⁿ⁻¹. Differentiation gives the gradient of a curve; at a stationary point the gradient is zero. Check whether the point is a maximum, minimum, or another stationary point.',
        'For y = x³ − 4x, dy/dx = 3x² − 4. Stationary points satisfy 3x² − 4 = 0.',
        'What does dy/dx represent geometrically?',
        'The gradient of the curve at each point.',
        'What equation identifies a stationary point?',
        'Set the derivative equal to zero and solve.',
      ),
    ],
  },
  Physics: {
    overview:
      'Use physical models to explain observations. Define quantities, write units, and show substitutions before calculating.',
    chapters: [
      chapter(
        'Motion & forces',
        'Speed is distance divided by time. A resultant force changes an object’s motion; balanced forces mean zero resultant force, not necessarily zero motion. Draw labelled force arrows before describing the effect.',
        'A runner covers 150 m in 30 s, so average speed = 150 ÷ 30 = 5 m/s.',
        'What is average speed?',
        'Total distance travelled divided by total time taken.',
        'What do balanced forces tell you?',
        'The resultant force is zero, so there is no acceleration.',
      ),
      chapter(
        'Energy & electricity',
        'Energy is conserved but can be transferred between stores. In a series circuit the current is the same throughout; in parallel branches the potential difference across each branch is the same. Draw circuit symbols clearly.',
        'A 6 V supply across a 3 Ω resistor gives current I = V/R = 6/3 = 2 A.',
        'State the relationship between potential difference, current, and resistance.',
        'V = IR.',
        'What is conserved during an energy transfer?',
        'The total amount of energy; it is transferred between stores, not destroyed.',
      ),
      chapter(
        'Waves & matter',
        'For a wave, speed = frequency × wavelength. Transverse waves oscillate perpendicular to travel; longitudinal waves oscillate parallel to it. Heating changes particle energy and can cause a change of state.',
        'A wave with frequency 5 Hz and wavelength 2 m travels at 10 m/s.',
        'How do particles oscillate in a transverse wave?',
        'Perpendicular to the direction in which the wave travels.',
        'What equation links wave speed, frequency, and wavelength?',
        'Wave speed = frequency × wavelength.',
      ),
    ],
  },
  Chemistry: {
    overview:
      'Explain chemical behaviour with particle models, balanced symbol equations, and evidence from safe practical investigations.',
    chapters: [
      chapter(
        'Atoms, elements & bonding',
        'An atom contains protons and neutrons in a nucleus and electrons around it. The proton number identifies the element. Ionic bonding involves electron transfer; covalent bonding involves shared pairs of electrons.',
        'A neutral sodium atom has 11 protons and 11 electrons; its proton number is 11.',
        'What defines an element?',
        'Its number of protons, called its proton or atomic number.',
        'What happens in covalent bonding?',
        'Atoms share pairs of electrons.',
      ),
      chapter(
        'Reactions & equations',
        'A symbol equation represents a reaction. Balance it by changing coefficients, never subscripts, so each element has equal numbers of atoms on both sides. Acids and bases react to form salt and water in neutralisation.',
        'For hydrogen reacting with oxygen, 2H₂ + O₂ → 2H₂O has four hydrogen atoms and two oxygen atoms on each side.',
        'Why must symbol equations be balanced?',
        'Because atoms are conserved in a chemical reaction.',
        'What products form in neutralisation?',
        'A salt and water.',
      ),
      chapter(
        'Rates & practical chemistry',
        'Reaction rate can increase with higher temperature, concentration, pressure for gases, or surface area because particles collide more often or with greater energy. A catalyst speeds a reaction without being used up.',
        'Powdered calcium carbonate reacts faster than the same mass of large chips because more surface is exposed.',
        'How does increasing surface area affect reaction rate?',
        'It usually increases rate by allowing more frequent collisions.',
        'What does a catalyst do?',
        'Increases reaction rate without being permanently changed or used up.',
      ),
    ],
  },
  Biology: {
    overview:
      'Link structure to function, describe processes in a clear order, and distinguish a supported conclusion from a guess.',
    chapters: [
      chapter(
        'Cells & transport',
        'Cells specialise for particular roles. Diffusion is the net movement of particles from higher to lower concentration. Osmosis is water movement through a partially permeable membrane from a dilute solution toward a more concentrated one.',
        'A red blood cell’s biconcave shape gives a large surface-area-to-volume ratio for gas exchange.',
        'What is diffusion?',
        'The net movement of particles down a concentration gradient.',
        'What does a large surface-area-to-volume ratio help a cell do?',
        'Exchange materials more quickly with its surroundings.',
      ),
      chapter(
        'Human systems & enzymes',
        'Digestion breaks large food molecules into smaller soluble molecules. Enzymes are specific biological catalysts; temperature and pH affect their activity. Above an enzyme’s optimum, its active site may change shape.',
        'If an enzyme denatures, a substrate may no longer fit its active site, so fewer enzyme-substrate complexes form.',
        'How do enzymes speed reactions?',
        'They lower the activation energy without being used up.',
        'What happens to a denatured enzyme’s active site?',
        'Its shape changes, so the substrate binds less effectively or not at all.',
      ),
      chapter(
        'Inheritance & ecosystems',
        'Genes are sections of DNA that influence characteristics. In ecosystems, energy enters mainly through producers and moves through food chains; less energy is available at each transfer. Populations interact with resources and environmental conditions.',
        'In a food chain grass → rabbit → fox, arrows point in the direction energy is transferred.',
        'What do arrows in a food chain show?',
        'The direction of energy transfer from food to consumer.',
        'What is a gene?',
        'A section of DNA associated with a particular protein or characteristic.',
      ),
    ],
  },
  Economics: {
    overview:
      'Explain choices using scarcity, incentives, and evidence. Define terms precisely before comparing likely outcomes.',
    chapters: [
      chapter(
        'Scarcity & choice',
        'Resources are limited while wants can exceed them, creating scarcity. Choosing one option means giving up the next best alternative: this is opportunity cost. Specialisation can increase output when people or places focus on what they do relatively well.',
        'If a student spends an hour revising economics rather than biology, the opportunity cost is the best biology revision they gave up.',
        'What is opportunity cost?',
        'The value of the next best option forgone when a choice is made.',
        'Why does scarcity require choices?',
        'Available resources cannot satisfy every want at the same time.',
      ),
      chapter(
        'Demand, supply & markets',
        'Demand describes how much consumers are willing and able to buy at different prices; supply describes how much producers are willing and able to sell. A change in price causes movement along a curve; other factors may shift it.',
        'If the cost of ingredients rises, a bakery may supply fewer cakes at each price, shifting supply left.',
        'What causes movement along a demand curve?',
        'A change in the good’s own price, with other factors unchanged.',
        'What might shift supply?',
        'A change in production costs, technology, taxes, or the number of suppliers.',
      ),
      chapter(
        'Economic performance',
        'Common aims include stable prices, employment, sustainable growth, and improved living standards. Policies have trade-offs: a policy may help one objective while making another harder to achieve.',
        'Lower interest rates can encourage borrowing and spending, but may also add pressure to prices.',
        'Name two macroeconomic objectives.',
        'For example, low inflation, low unemployment, sustainable growth, or improved living standards.',
        'Why can a policy involve a trade-off?',
        'Because improving one outcome can create costs or weaken another objective.',
      ),
    ],
  },
  'Business Studies': {
    overview:
      'Connect a business decision to its objective, stakeholders, costs, and likely consequences instead of listing generic advantages.',
    chapters: [
      chapter(
        'Enterprise & objectives',
        'Entrepreneurs organise resources and accept risk to create value. Businesses may aim for profit, growth, survival, or social impact. Different stakeholders can have competing interests in a decision.',
        'A business expanding may benefit owners through growth but place short-term pressure on employees and cash flow.',
        'Who is an entrepreneur?',
        'A person who organises resources and takes risks to pursue a business opportunity.',
        'Why can stakeholders disagree?',
        'They may value different outcomes, such as profit, job security, prices, or community impact.',
      ),
      chapter(
        'Marketing & operations',
        'Marketing research reduces uncertainty about customers. The marketing mix combines product, price, place, and promotion. Operations transform inputs into goods or services; quality and productivity affect costs and customer satisfaction.',
        'A student-led survey can test preferences before a school club orders a product in bulk.',
        'What are the four parts of the marketing mix?',
        'Product, price, place, and promotion.',
        'Why use market research before launching?',
        'To learn about customer needs and reduce the risk of a poor product or price choice.',
      ),
      chapter(
        'Finance & decisions',
        'Revenue is price multiplied by quantity sold; profit is revenue minus total costs. Cash flow tracks money entering and leaving over time. A profitable business can still face cash-flow problems if payments arrive late.',
        'Selling 40 items at $5 gives revenue of $200 before costs are deducted.',
        'How is profit calculated?',
        'Total revenue minus total costs.',
        'Why is cash flow different from profit?',
        'Cash flow tracks timing of cash movements; profit compares revenue with costs over a period.',
      ),
    ],
  },
  Geography: {
    overview:
      'Describe spatial patterns, explain the processes behind them, and use fieldwork evidence with appropriate care.',
    chapters: [
      chapter(
        'Physical landscapes',
        'Weathering breaks down rock in place; erosion removes and transports material. Rivers and coasts shape landforms through linked processes, and the same process can produce different outcomes under different conditions.',
        'A river meander erodes its outer bank and deposits material on its inner bank as flow velocity varies.',
        'How does erosion differ from weathering?',
        'Weathering breaks rock down in place; erosion removes and transports it.',
        'Where is deposition more likely in a meander?',
        'On the inner bend, where flow is generally slower.',
      ),
      chapter(
        'People, places & resources',
        'Population patterns reflect birth and death rates, migration, and economic opportunities. Resource use can improve living standards but may create environmental costs; sustainability considers needs over time.',
        'A city may grow when jobs attract migrants, while pressure on housing and transport rises.',
        'What is migration?',
        'The movement of people from one place to another, temporarily or permanently.',
        'What does sustainability consider?',
        'Meeting present needs without undermining the ability of future generations to meet theirs.',
      ),
      chapter(
        'Maps & fieldwork',
        'Maps use scale, direction, symbols, and contours to represent space. Fieldwork should use a repeatable method, suitable sampling, and accurate records. Present patterns clearly and evaluate limitations in the evidence.',
        'If 1 cm represents 2 km, a 4.5 cm map distance represents 9 km on the ground.',
        'What does map scale show?',
        'The relationship between a distance on the map and the corresponding ground distance.',
        'Why repeat a fieldwork measurement?',
        'To identify anomalous readings and improve confidence in the pattern observed.',
      ),
    ],
  },
  History: {
    overview:
      'Build evidence-led accounts of the past by evaluating sources, comparing explanations, and supporting judgements with specific examples.',
    chapters: [
      chapter(
        'Sources & evidence',
        'A source’s provenance shapes what it can tell us. Consider author, date, purpose, audience, content, and context. A limitation does not automatically make a source useless; explain how it affects a particular enquiry.',
        'A private diary may reveal one person’s experience but cannot alone show what an entire population believed.',
        'What is provenance?',
        'Information about a source’s origin, such as who made it, when, and for what purpose.',
        'Why can a limited source still be useful?',
        'It may offer relevant evidence for one focused question even if it cannot answer every question.',
      ),
      chapter(
        'Cause, change & consequence',
        'Historical events usually have multiple causes: immediate triggers and longer-term conditions. Distinguish short- and long-term consequences, and explain how they affected different groups over time.',
        'When evaluating a cause, explain the mechanism linking it to the event rather than simply naming it.',
        'What is a long-term cause?',
        'A condition that develops over an extended period and helps make an event more likely.',
        'How do you explain a consequence?',
        'Show what changed, for whom, and how the change followed from the event.',
      ),
      chapter(
        'Arguments & significance',
        'A historical argument answers the question directly, uses accurate supporting evidence, and weighs alternatives. Significance can be judged by scale, duration, impact, or influence on later events.',
        'A strong conclusion compares the evidence for two explanations and states why one is more convincing for the question asked.',
        'What makes a historical claim stronger?',
        'Relevant, specific evidence and reasoning that clearly connects that evidence to the claim.',
        'Name one way to judge significance.',
        'Consider the event’s scale, duration, impact, or influence on later events.',
      ),
    ],
  },
  French: {
    overview:
      'Grow confidence by learning useful phrases in context, noticing verb patterns, and checking agreement and pronunciation.',
    chapters: [
      chapter(
        'Everyday communication',
        'Learn complete phrases for introductions, routines, school, and opinions. Use context words such as aujourd’hui, souvent, and parce que to make meaning clearer.',
        'Je préfère les sciences parce que c’est intéressant means “I prefer science because it is interesting.”',
        'What does parce que mean?',
        'Because.',
        'Why learn phrases rather than isolated words?',
        'Phrases show how vocabulary and grammar work together in real communication.',
      ),
      chapter(
        'Present & past time',
        'Regular -er verbs often use -e, -es, -e, -ons, -ez, -ent in the present. The passé composé uses an auxiliary verb plus a past participle; common examples use avoir, while some movement verbs use être.',
        'J’ai visité Paris means “I visited Paris”: avoir in the present plus the past participle visité.',
        'What two parts form the passé composé?',
        'An auxiliary verb and a past participle.',
        'What is the usual present-tense nous ending for an -er verb?',
        '-ons, as in nous parlons.',
      ),
      chapter(
        'Listening, reading & writing',
        'Identify time markers, familiar word families, and negatives when reading or listening. For writing, answer the task, use varied time frames, and check adjective agreement and accents.',
        'Ne … pas usually surrounds the conjugated verb: Je ne joue pas means “I do not play.”',
        'Where does ne … pas usually go?',
        'Around the conjugated verb.',
        'What should you check in a final French edit?',
        'Task coverage, verb endings, agreement, negation, and accents.',
      ),
    ],
  },
  Spanish: {
    overview:
      'Build clear Spanish sentences by learning high-use vocabulary, matching verbs to subjects, and recognising time markers.',
    chapters: [
      chapter(
        'Everyday communication',
        'Practise complete phrases for introductions, family, school, and opinions. Connect ideas with porque, pero, and también, and use accents where they change meaning or spelling.',
        'Me gusta la música porque es relajante means “I like music because it is relaxing.”',
        'What does porque mean?',
        'Because.',
        'Why include a connector in a response?',
        'It links ideas and makes the response more developed and coherent.',
      ),
      chapter(
        'Present & past time',
        'Regular -ar verbs often use -o, -as, -a, -amos, -áis, -an in the present. The preterite commonly describes completed past actions; imperfect forms often describe background, habits, or ongoing past situations.',
        'Ayer estudié means “Yesterday I studied”; ayer signals a completed past action.',
        'Which tense often describes a completed past action?',
        'The preterite.',
        'What does the ending -amos commonly signal for a regular -ar verb?',
        'First-person plural, nosotros: for example, hablamos.',
      ),
      chapter(
        'Listening, reading & writing',
        'Listen for familiar cognates but check them against context. Notice time phrases such as hoy, ayer, and mañana. In writing, vary time frames, answer every part, and check noun-adjective agreement.',
        'Tengo quince años means “I am fifteen years old”; Spanish uses tener for age.',
        'How do you say “I am fifteen years old” in Spanish?',
        'Tengo quince años.',
        'What should agree in gender and number?',
        'Adjectives should agree with the nouns they describe.',
      ),
    ],
  },
  Arabic: {
    overview:
      'Develop reading and writing accuracy by attending to root patterns, connected letters, and how meaning depends on context.',
    chapters: [
      chapter(
        'Reading & connected letters',
        'Arabic is written from right to left. Many letters change shape depending on their position in a word; some do not connect to the following letter. Short-vowel marks may be omitted in everyday text.',
        'When reading an unfamiliar word, identify its connected letter shapes and use surrounding words to infer likely vowels.',
        'Which direction is Arabic read and written?',
        'From right to left.',
        'Why can a letter look different inside a word?',
        'Many Arabic letters change shape according to their position and connections.',
      ),
      chapter(
        'Words, roots & sentences',
        'Many Arabic words share a three-letter root that carries a core idea; patterns add grammatical or semantic information. A basic nominal sentence can begin with a noun, while a verbal sentence can begin with a verb.',
        'A root can connect several related words, but check the word pattern and context before assuming the exact meaning.',
        'What is a root in Arabic word formation?',
        'A set of core consonants shared by related words.',
        'What should you check before translating a familiar root?',
        'The word pattern and sentence context, which determine the specific meaning.',
      ),
      chapter(
        'Useful communication',
        'Build practical phrases for greetings, school, and opinions. Pronouns and verb forms carry information about person and number; agreement helps connect adjectives to the nouns they describe.',
        'For a new phrase, identify the subject, verb, and any adjective, then check whether each form matches.',
        'What information can an Arabic verb ending show?',
        'It can indicate features such as person, number, and sometimes gender.',
        'What helps you infer the meaning of an unfamiliar phrase?',
        'Recognising known words, identifying sentence roles, and using context clues.',
      ),
    ],
  },
} satisfies Record<LearningSubject, SubjectLearningPack>;

export type { LearningSubject };