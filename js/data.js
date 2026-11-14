/* =========================================================
   PaperMind — shared demonstration data + store
   Both portals read and write the same object in localStorage,
   so actions in one role are visible in the other role in the
   same browser.
   ========================================================= */
(function () {
  'use strict';
  const PM = (window.PM = window.PM || {});
  const KEY = 'papermind.data.v5';

  /* ---------- small helpers ---------- */
  const MIN = 60 * 1000, HOUR = 60 * MIN, DAY = 24 * HOUR;
  const now = () => Date.now();
  const ago = (ms) => now() - ms;
  const uid = (p) => (p || 'id') + '-' + Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-3);
  const isoDay = (offsetDays) => {
    const d = new Date(now() + offsetDays * DAY);
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  };
  const atTime = (offsetDays, h, m) => { const d = new Date(now() + offsetDays * DAY); d.setHours(h, m, 0, 0); return d.getTime(); };
  const clone = (o) => JSON.parse(JSON.stringify(o));
  const norm = (s) => String(s == null ? '' : s).toLowerCase().replace(/[()]/g, ' ').replace(/½/g, ' 1/2').replace(/¼/g, ' 1/4').replace(/\s+/g, ' ').trim();

  /* ---------- Learning-gap catalogue ---------- */
  const GAPS = {
    'g-de-vocab': {
      title: 'German math vocabulary in word problems', short: 'German word problems', concept: 'German word problems',
      simple: 'Some German math words, like “bleibt übrig” (= what is left over).',
      flagTitle: 'German Terminology Barrier',
      flagStudent: 'Your teacher will help you with German math words. That’s okay — lots of students learn them together!',
      emoji: '🗣️'
    },
    'g-mixed': {
      title: 'Converting improper fractions to mixed numbers', short: 'Mixed numbers', concept: 'Fractions',
      simple: 'Changing fractions like 9/4 into mixed numbers like 2 1/4.',
      flagTitle: 'Fraction Conversion Difficulty',
      flagStudent: 'We will practise mixed numbers together, step by step.',
      emoji: '🍕'
    },
    'g-lessthan': {
      title: 'Comparison words (“weniger als” / “mehr als”)', short: 'Comparison words', concept: 'German word problems',
      simple: 'Words that compare, like “weniger als” (= less than).',
      flagTitle: 'Comparison Word Confusion',
      flagStudent: 'Your teacher will help you with the words “more than” and “less than”.',
      emoji: '⚖️'
    },
    'g-times': {
      title: 'Multiplication facts (7s and 8s)', short: 'Times tables', concept: 'Multiplication',
      simple: 'Some times-table facts, like 7 × 8.', flagTitle: 'Times-Table Fluency',
      flagStudent: 'Let’s practise your times tables with a fun game!', emoji: '✖️'
    },
    'g-past': {
      title: 'Irregular past-tense verbs', short: 'Past tense', concept: 'Grammar',
      simple: 'Some verbs change in a special way in the past, like run → ran.', flagTitle: 'Irregular Verb Pattern',
      flagStudent: 'We will practise tricky past-tense words together.', emoji: '📖'
    },
    'g-spelling': {
      title: 'Spelling of longer words', short: 'Spelling', concept: 'Spelling',
      simple: 'Spelling longer words, like “elephant”.', flagTitle: 'Spelling Support',
      flagStudent: 'We will practise spelling with word games.', emoji: '🔤'
    },
    'g-food-chain': {
      title: 'Food chains and producers', short: 'Food chains', concept: 'Ecosystems',
      simple: 'Which living things make their own food (producers).', flagTitle: 'Ecosystem Concepts',
      flagStudent: 'We will look at food chains together with pictures.', emoji: '🌱'
    }
  };

  /* ---------- Exam question banks (simulated OCR read-outs) ---------- */
  const BANKS = {
    fractionsDE: {
      title: 'Math Quiz 3', subject: 'Math', topics: 'Fractions & Word Problems', lang: 'DE/EN',
      questions: [
        { id: 'q1', label: 'Direct addition', prompt: '1/2 + 1/4 = ?', correct: '3/4', max: 10, read: '3/4', conf: 97, format: 'Direct', concept: 'Fractions', ok: 'Correct, common denominator used.' },
        { id: 'q2', label: 'Like denominators', prompt: '3/4 + 2/4 = ?', correct: '5/4 = 1 1/4', accept: ['5/4', '1 1/4', '5/4 1 1/4'], max: 10, read: '5/4 (1 1/4)', conf: 94, format: 'Direct', concept: 'Fractions', ok: 'Correct, also written as a mixed number.' },
        { id: 'q3', label: 'German word problem', prompt: 'Lena hat 12 Äpfel. Sie gibt 1/3 ab. Wie viele bleiben übrig?', correct: '8', max: 10, read: '4', conf: 91, format: 'Word problem (DE)', concept: 'German word problems', gap: 'g-de-vocab',
          rules: { '4': { score: 3, tag: 'Semantic gap', reasoning: 'Calculated 1/3 of 12 = 4 correctly, but answered what was given away, not what “bleibt übrig” (remains).' } },
          tip: 'In the German word problem, “bleibt übrig” means how many are LEFT, so the answer is 12 − 4 = 8.' },
        { id: 'q4', label: 'Mixed numbers', prompt: 'Write 9/4 as a mixed number', correct: '2 1/4', max: 10, read: '9/4', conf: 62, alts: [['9/4', 62], ['7/4', 30]], format: 'Direct', concept: 'Fractions', gap: 'g-mixed',
          rules: {
            '9/4': { score: 4, tag: 'Partly correct', reasoning: '9/4 is the right value, but it was not converted to a mixed number (2 1/4).' },
            '7/4': { score: 0, tag: 'Incorrect', reasoning: '7/4 is not equal to 9/4.' }
          },
          tip: 'Also try writing 9/4 as a mixed number: 2 1/4.' },
        { id: 'q5', label: 'Multiplication', prompt: '6 × 7 = ?', correct: '42', max: 10, read: '42', conf: 98, format: 'Direct', concept: 'Multiplication' }
      ]
    },
    comparisonDE: {
      title: 'Mathe-Test 3', subject: 'Math', topics: 'Textaufgaben', lang: 'DE',
      questions: [
        { id: 'q1', label: 'Subtraction', prompt: '48 − 19 = ?', correct: '29', max: 10, read: '29', conf: 96, format: 'Direct', concept: 'Subtraction' },
        { id: 'q2', label: 'Fraction of a number', prompt: '1/3 von 15 = ?', correct: '5', max: 10, read: '5', conf: 93, format: 'Direct', concept: 'Fractions' },
        { id: 'q3', label: 'German word problem', prompt: 'Tom hat 20 Murmeln. Mia hat 6 weniger als Tom. Wie viele hat Mia?', correct: '14', max: 10, read: '26', conf: 88, format: 'Word problem (DE)', concept: 'German word problems', gap: 'g-lessthan',
          rules: { '26': { score: 2, tag: 'Semantic gap', reasoning: 'Added instead of subtracted — read “weniger als” (less than) as “more than”.' } },
          tip: '“weniger als” means LESS than, so we subtract: 20 − 6 = 14.' },
        { id: 'q4', label: 'Compare fractions', prompt: 'Which is bigger: 3/5 or 2/5?', correct: '3/5', max: 10, read: '3/5', conf: 95, format: 'Direct', concept: 'Fractions' },
        { id: 'q5', label: 'Multiplication', prompt: '7 × 8 = ?', correct: '56', max: 10, read: '56', conf: 71, alts: [['56', 71], ['36', 22]], format: 'Direct', concept: 'Multiplication', gap: 'g-times', tip: 'Remember: 7 × 8 = 56.' }
      ]
    },
    multiplication: {
      title: 'Multiplication Checkup', subject: 'Math', topics: 'Times tables', lang: 'EN',
      questions: [
        { id: 'q1', label: 'Times table', prompt: '6 × 8 = ?', correct: '48', max: 10, read: '48', conf: 97, format: 'Direct', concept: 'Multiplication' },
        { id: 'q2', label: 'Times table', prompt: '9 × 7 = ?', correct: '63', max: 10, read: '63', conf: 95, format: 'Direct', concept: 'Multiplication', gap: 'g-times', tip: '9 × 7 = 63 — try the finger trick for 9s!' },
        { id: 'q3', label: 'Word problem (EN)', prompt: 'A box has 6 rows of 5 eggs. How many eggs?', correct: '30', max: 10, read: '30', conf: 92, format: 'Word problem (EN)', concept: 'Multiplication' },
        { id: 'q4', label: 'Times table', prompt: '7 × 7 = ?', correct: '49', max: 10, read: '49', conf: 66, alts: [['49', 66], ['44', 27]], format: 'Direct', concept: 'Multiplication', gap: 'g-times', tip: '7 × 7 = 49.' },
        { id: 'q5', label: 'Times table', prompt: '12 × 4 = ?', correct: '48', max: 10, read: '48', conf: 94, format: 'Direct', concept: 'Multiplication' }
      ]
    },
    mathUpload: {
      title: 'Math Test', subject: 'Math', topics: 'Fractions & Division', lang: 'DE/EN',
      questions: [
        { id: 'q1', label: 'Fraction addition', prompt: '2/5 + 1/5 = ?', correct: '3/5', max: 10, read: '3/5', conf: 96, format: 'Direct', concept: 'Fractions' },
        { id: 'q2', label: 'Division', prompt: '15 ÷ 3 = ?', correct: '5', max: 10, read: '5', conf: 97, format: 'Direct', concept: 'Division' },
        { id: 'q3', label: 'German word problem', prompt: 'Ein Kuchen hat 8 Stücke. Tim isst 3. Wie viele bleiben übrig?', correct: '5', max: 10, read: '3', conf: 89, format: 'Word problem (DE)', concept: 'German word problems', gap: 'g-de-vocab',
          rules: { '3': { score: 2, tag: 'Semantic gap', reasoning: 'Wrote the number eaten, not the number that “bleibt übrig” (is left).' } },
          tip: '“bleibt übrig” means what is LEFT: 8 − 3 = 5.' },
        { id: 'q4', label: 'Mixed numbers', prompt: 'Write 7/2 as a mixed number', correct: '3 1/2', max: 10, read: '3 1/2', conf: 64, alts: [['3 1/2', 64], ['3 1/7', 25]], format: 'Direct', concept: 'Fractions', gap: 'g-mixed', tip: '7/2 = 3 1/2.' },
        { id: 'q5', label: 'Multiplication', prompt: '9 × 6 = ?', correct: '54', max: 10, read: '54', conf: 98, format: 'Direct', concept: 'Multiplication' }
      ]
    },
    science: {
      title: 'Science Quiz', subject: 'Science', topics: 'Ecosystems & Living Things', lang: 'EN',
      questions: [
        { id: 'q1', label: 'Plants', prompt: 'What do plants need to make their food?', correct: 'sunlight, water, air', keywords: ['sun', 'light'], max: 10, read: 'sunlight and water', conf: 90, format: 'Short answer', concept: 'Ecosystems' },
        { id: 'q2', label: 'Producers', prompt: 'Is grass a producer or a consumer?', correct: 'producer', max: 10, read: 'consumer', conf: 87, format: 'Short answer', concept: 'Ecosystems', gap: 'g-food-chain', tip: 'Grass is a producer — it makes its own food from sunlight.' },
        { id: 'q3', label: 'Herbivores', prompt: 'Name an animal that eats only plants.', correct: 'rabbit / cow / deer', keywords: ['rabbit', 'cow', 'deer', 'horse', 'sheep', 'giraffe', 'elephant'], max: 10, read: 'rabbit', conf: 93, format: 'Short answer', concept: 'Ecosystems' },
        { id: 'q4', label: 'Habitats', prompt: 'Where does a fish live?', correct: 'water', keywords: ['water', 'sea', 'river', 'lake', 'ocean'], max: 10, read: 'water', conf: 68, alts: [['water', 68], ['winter', 24]], format: 'Short answer', concept: 'Habitats' }
      ]
    },
    english: {
      title: 'English Reading Check', subject: 'English', topics: 'Writing & Comprehension', lang: 'EN',
      questions: [
        { id: 'q1', label: 'Plurals', prompt: 'Plural of “child”', correct: 'children', max: 10, read: 'children', conf: 95, format: 'Short answer', concept: 'Grammar' },
        { id: 'q2', label: 'Opposites', prompt: 'Opposite of “big”', correct: 'small', keywords: ['small', 'little', 'tiny'], max: 10, read: 'small', conf: 96, format: 'Short answer', concept: 'Vocabulary' },
        { id: 'q3', label: 'Past tense', prompt: 'Past tense of “run”', correct: 'ran', max: 10, read: 'runned', conf: 70, alts: [['runned', 70], ['ran', 24]], format: 'Short answer', concept: 'Grammar', gap: 'g-past', tip: 'Some verbs are special: run → ran (not “runned”).' },
        { id: 'q4', label: 'Spelling', prompt: 'Spell the animal with a long trunk', correct: 'elephant', max: 10, read: 'elefant', conf: 84, format: 'Spelling', concept: 'Spelling', gap: 'g-spelling', rules: { 'elefant': { score: 5, tag: 'Spelling', reasoning: 'Right animal, but spelled “elefant” instead of “elephant”.' } }, tip: '“Elephant” is spelled with “ph”.' }
      ]
    }
  };

  /* ---------- Practice quiz banks (multiple choice, child friendly) ---------- */
  const QUIZZES = {
    fractions: [
      { q: 'Which is the same as 9/4?', choices: ['2 1/4', '1 1/4', '9 1/4'], a: 0 },
      { q: '1/2 + 1/4 = ?', choices: ['2/6', '3/4', '1/8'], a: 1 },
      { q: 'Which pizza piece is bigger?', choices: ['1/8 of a pizza', '1/2 of a pizza', 'They are the same'], a: 1 },
      { q: 'Write 5/2 as a mixed number.', choices: ['2 1/2', '5 1/2', '1 1/2'], a: 0 },
      { q: '3/5 or 2/5 — which is more?', choices: ['2/5', '3/5', 'Same'], a: 1 }
    ],
    deVocab: [
      { q: 'What does “bleibt übrig” mean?', choices: ['What is left over', 'What is given away', 'All together'], a: 0 },
      { q: 'What does “weniger als” mean?', choices: ['More than', 'Less than', 'Equal to'], a: 1 },
      { q: 'Lena hat 10 Äpfel. Sie gibt 4 ab. Wie viele bleiben übrig?', choices: ['4', '14', '6'], a: 2 },
      { q: 'What does “zusammen” mean?', choices: ['Together (add)', 'Take away', 'Divide'], a: 0 },
      { q: 'Tom hat 12 Stifte. Mia hat 3 weniger als Tom. Wie viele hat Mia?', choices: ['15', '9', '3'], a: 1 }
    ],
    times: [
      { q: '7 × 8 = ?', choices: ['54', '56', '64'], a: 1 },
      { q: '9 × 7 = ?', choices: ['63', '72', '56'], a: 0 },
      { q: '7 × 7 = ?', choices: ['42', '49', '44'], a: 1 },
      { q: '6 × 8 = ?', choices: ['48', '46', '54'], a: 0 },
      { q: '8 × 8 = ?', choices: ['62', '64', '68'], a: 1 }
    ],
    general: [
      { q: '15 ÷ 3 = ?', choices: ['3', '5', '45'], a: 1 },
      { q: '2/5 + 1/5 = ?', choices: ['3/10', '3/5', '2/5'], a: 1 },
      { q: 'Past tense of “run”?', choices: ['runned', 'ran', 'running'], a: 1 },
      { q: 'Is grass a producer or a consumer?', choices: ['Producer', 'Consumer'], a: 0 },
      { q: '6 × 7 = ?', choices: ['42', '36', '48'], a: 0 }
    ]
  };
  const QUIZ_FOR_GAP = { 'g-de-vocab': 'deVocab', 'g-lessthan': 'deVocab', 'g-mixed': 'fractions', 'g-times': 'times' };

  const LESSONS = {
    fractions: ['A fraction shows parts of a whole. 🍕', '9/4 means 9 quarter-pieces.', '4 quarters make 1 whole, so 8 quarters make 2 wholes.', '9/4 = 2 wholes and 1 quarter left = 2 1/4! 🎉'],
    deVocab: ['Word problems hide math in words. 🔎', '“bleibt übrig” = what is LEFT over → subtract!', '“weniger als” = LESS than → subtract!', '“zusammen” = together → add! You did it! 🎉'],
    times: ['Multiplying is fast adding. ➕', '7 × 8 is 7 groups of 8.', 'Trick: 5, 6, 7, 8 → 56 = 7 × 8!', 'Practise a little every day! 🎉'],
    general: ['Read the question slowly. 📖', 'Underline the important words.', 'Check your answer at the end.', 'Great work! 🎉']
  };

  /* ---------- seed builder ---------- */
  function makeExam(bankKey, opts) {
    const b = BANKS[bankKey];
    const qs = clone(b.questions).map((q) => Object.assign(q, { value: q.read, resolved: !(q.conf < 80) }));
    return Object.assign({
      id: uid('ex'), bank: bankKey, title: b.title, subject: b.subject, topics: b.topics, lang: b.lang,
      questions: qs, status: 'ocr', uploadedAt: now(), ai: null, review: null, published: null,
      ocrEdits: 0, file: null
    }, opts || {});
  }
  function publishedExam(o) {
    return Object.assign({ id: uid('ex'), status: 'published', questions: [], ai: null, review: null, uploadedAt: o.date, lang: 'EN' }, o, {
      published: Object.assign({ at: o.date + 2 * DAY }, o.published)
    });
  }

  function seed() {
    const students = [
      { id: 's1', name: 'Salma Ahmed', first: 'Salma', classId: '4A', username: 'salma.ahmed', pin: '1234', no: 'PM-84920', avatar: '👧', stars: 142, streak: 5, level: 4, badges: ['Math Explorer ⭐', 'Fast Learner 🚀', 'Practice Star 🏆'], guardian: { name: 'Mona Ahmed', email: 'mona.a@email.com' } },
      { id: 's2', name: 'Omar Ali', first: 'Omar', classId: '4A', username: 'omar.ali', pin: '1234', no: 'PM-84921', avatar: '👦', stars: 118, streak: 3, level: 4, badges: ['Fast Learner 🚀'], guardian: { name: 'Hany Ali', email: 'hany.ali@email.com' } },
      { id: 's3', name: 'Lina Hassan', first: 'Lina', classId: '4A', username: 'lina.hassan', pin: '1234', no: 'PM-84922', avatar: '👧', stars: 165, streak: 8, level: 5, badges: ['Practice Star 🏆'], guardian: { name: 'Rania Hassan', email: 'rania.h@email.com' } },
      { id: 's4', name: 'Noah Becker', first: 'Noah', classId: '4A', username: 'noah.becker', pin: '1234', no: 'PM-84923', avatar: '🧒', stars: 96, streak: 1, level: 3, badges: [], guardian: { name: 'Anna Becker', email: 'anna.b@email.com' } },
      { id: 's5', name: 'Emma Adel', first: 'Emma', classId: '4A', username: 'emma.adel', pin: '1234', no: 'PM-84924', avatar: '👧', stars: 150, streak: 6, level: 5, badges: ['Math Explorer ⭐'], guardian: { name: 'Adel Samir', email: 'adel.s@email.com' } },
      { id: 's6', name: 'Youssef Karim', first: 'Youssef', classId: '4A', username: 'youssef.karim', pin: '1234', no: 'PM-84925', avatar: '👦', stars: 88, streak: 2, level: 3, badges: [], guardian: { name: 'Karim Fathy', email: 'karim.f@email.com' } },
      { id: 's7', name: 'Mia Schmidt', first: 'Mia', classId: '4B', username: 'mia.schmidt', pin: '1234', no: 'PM-85010', avatar: '👧', stars: 120, streak: 4, level: 4, badges: [], guardian: { name: 'Julia Schmidt', email: 'julia.s@email.com' } },
      { id: 's8', name: 'Karim Nabil', first: 'Karim', classId: '4B', username: 'karim.nabil', pin: '1234', no: 'PM-85011', avatar: '👦', stars: 101, streak: 2, level: 3, badges: [], guardian: { name: 'Nabil Saad', email: 'nabil.s@email.com' } },
      { id: 's9', name: 'Leon Weber', first: 'Leon', classId: '4B', username: 'leon.weber', pin: '1234', no: 'PM-85012', avatar: '🧒', stars: 133, streak: 5, level: 4, badges: [], guardian: { name: 'Petra Weber', email: 'petra.w@email.com' } },
      { id: 's10', name: 'Hana Mostafa', first: 'Hana', classId: '5A', username: 'hana.mostafa', pin: '1234', no: 'PM-86001', avatar: '👧', stars: 172, streak: 9, level: 6, badges: [], guardian: { name: 'Mostafa Adly', email: 'mostafa.a@email.com' } },
      { id: 's11', name: 'Jonas Fischer', first: 'Jonas', classId: '5A', username: 'jonas.fischer', pin: '1234', no: 'PM-86002', avatar: '👦', stars: 110, streak: 3, level: 5, badges: [], guardian: { name: 'Eva Fischer', email: 'eva.f@email.com' } },
      { id: 's12', name: 'Sara Yousef', first: 'Sara', classId: '5A', username: 'sara.yousef', pin: '1234', no: 'PM-86003', avatar: '👧', stars: 140, streak: 4, level: 5, badges: [], guardian: { name: 'Yousef Omar', email: 'yousef.o@email.com' } }
    ];

    const classes = [
      { id: '4A', name: 'Grade 4A', subject: 'Homeroom & Mathematics',
        mastery: [['Multiplication Tables (1–12)', 89], ['Long Division without remainder', 82], ['German Language Word Problems', 61], ['Fraction Addition & Subtraction', 47]],
        snapshot: [['Multiplication', 89], ['Division', 82], ['Fractions', 47], ['German word problems', 61]],
        weekly: { labels: ['Oct 22', 'Oct 29', 'Nov 5', 'Nov 12'], a: { name: 'Fraction addition & subtraction', v: [52, 50, 44, 47] }, b: { name: 'German word problems', v: [71, 78, 68, 75] } },
        remediation: { before: 54, after: 81, n: 5, improved: 4, topic: 'fractions practice' },
        ocr: { answers: 230, flagged: 16, corrected: 9, exams: 46, note: 'Most corrections: fraction bars and the digits 4 / 9 and 1 / 7.' },
        flags: [['German word problems', 2, 3, 3], ['Fractions', 1, 2, 1], ['Long division', 0, 1, 0]]
      },
      { id: '4B', name: 'Grade 4B', subject: 'Mathematics',
        mastery: [['Multiplication Tables (1–12)', 84], ['Long Division without remainder', 74], ['German Language Word Problems', 69], ['Fraction Addition & Subtraction', 58]],
        snapshot: [['Multiplication', 84], ['Division', 74], ['Fractions', 58], ['German word problems', 69]],
        weekly: { labels: ['Oct 22', 'Oct 29', 'Nov 5', 'Nov 12'], a: { name: 'Fraction addition & subtraction', v: [55, 57, 56, 58] }, b: { name: 'Long division', v: [70, 69, 72, 74] } },
        remediation: { before: 61, after: 72, n: 3, improved: 2, topic: 'division practice' },
        ocr: { answers: 120, flagged: 11, corrected: 6, exams: 24, note: 'Most corrections: the digits 1 / 7 and division signs.' },
        flags: [['German word problems', 1, 1, 0], ['Fractions', 0, 1, 1], ['Long division', 1, 2, 1]]
      },
      { id: '5A', name: 'Grade 5A', subject: 'Mathematics',
        mastery: [['Decimals', 78], ['Long Division with remainder', 71], ['German Language Word Problems', 80], ['Fraction Multiplication', 63]],
        snapshot: [['Decimals', 78], ['Division', 71], ['Fractions', 63], ['German word problems', 80]],
        weekly: { labels: ['Oct 22', 'Oct 29', 'Nov 5', 'Nov 12'], a: { name: 'Fraction multiplication', v: [55, 58, 61, 63] }, b: { name: 'Long division with remainder', v: [66, 64, 69, 71] } },
        remediation: { before: 58, after: 70, n: 4, improved: 3, topic: 'fraction practice' },
        ocr: { answers: 150, flagged: 9, corrected: 5, exams: 30, note: 'Most corrections: decimal points and the digits 3 / 8.' },
        flags: [['German word problems', 0, 1, 0], ['Fractions', 1, 1, 2], ['Long division', 1, 0, 1]]
      }
    ];

    const pubMath = (sid, title, topics, days, pct, extra) => publishedExam(Object.assign({
      studentId: sid, classId: students.find((s) => s.id === sid).classId, title, subject: 'Math', topics, lang: 'DE', date: ago(days * DAY),
      published: { pct, score: Math.round(pct / 2), max: 50, feedback: 'Well done! Keep practising every day.', gaps: [], redFlag: null }
    }, extra || {}));

    const exams = [];
    // Salma — current exam awaiting OCR verification (the main demo flow)
    exams.push(makeExam('fractionsDE', { id: 'ex-salma-q3', studentId: 's1', classId: '4A', uploadedAt: ago(25 * MIN), pages: 2 }));
    // Salma — English awaiting AI review
    const salmaEng = makeExam('english', { id: 'ex-salma-eng', studentId: 's1', classId: '4A', uploadedAt: ago(2 * DAY + 3 * HOUR), pages: 1 });
    exams.push(salmaEng);
    // Omar — AI suggested grade awaiting teacher
    const omar = makeExam('comparisonDE', { id: 'ex-omar-mt3', studentId: 's2', classId: '4A', uploadedAt: ago(HOUR), pages: 2 });
    exams.push(omar);
    // Noah — needs OCR
    exams.push(makeExam('multiplication', { id: 'ex-noah-mc', studentId: 's4', classId: '4A', uploadedAt: ago(3 * HOUR), pages: 1 }));

    // Salma history (published)
    exams.push(pubMath('s1', 'Mathe-Test 1', 'Fractions intro', 51, 72, { published: { pct: 72, score: 36, max: 50, at: ago(49 * DAY), feedback: 'Good start with fractions, Salma! Read every German word problem twice and underline the question words.', gaps: [{ id: 'g-de-vocab' }], redFlag: null } }));
    exams.push(pubMath('s1', 'Multiplication Checkup', 'Times tables', 43, 90, { lang: 'EN', published: { pct: 90, score: 45, max: 50, at: ago(41 * DAY), feedback: 'Super times tables, Salma! 🌟 You only missed one tricky fact.', gaps: [], redFlag: null } }));
    exams.push(publishedExam({ studentId: 's1', classId: '4A', title: 'Science Quiz', subject: 'Science', topics: 'Ecosystems & Living Things', date: ago(37 * DAY), published: { pct: 93, score: 37, max: 40, at: ago(35 * DAY), feedback: 'Amazing work on food chains, Salma! You explained producers and consumers really well. 🌱', gaps: [], redFlag: null } }));
    exams.push(pubMath('s1', 'Mathe-Test 2', 'Fractions & Textaufgaben', 30, 58, { published: { pct: 58, score: 29, max: 50, at: ago(28 * DAY), feedback: 'You worked hard, Salma! Your fraction sums were correct. In word problems, “Rest” means what is left — let’s practise these words.', gaps: [{ id: 'g-de-vocab' }, { id: 'g-mixed' }], redFlag: null } }));
    exams.push(publishedExam({ studentId: 's1', classId: '4A', title: 'Plants & Animals Test', subject: 'Science', topics: 'Habitats & Food Chains', date: ago(12 * DAY), published: { pct: 88, score: 35, max: 40, at: ago(10 * DAY), feedback: 'Wonderful job on habitats, Salma! Remember: plants are producers because they make their own food. 🌿', gaps: [], redFlag: null } }));
    exams.push(publishedExam({ studentId: 's1', classId: '4A', title: 'Spelling Test', subject: 'English', topics: 'Spelling & Vocabulary', date: ago(8 * DAY), published: { pct: 76, score: 38, max: 50, at: ago(6 * DAY), feedback: 'Good spelling, Salma! Watch out for words with “ph”, like elephant and photo. 📖', gaps: [], redFlag: null } }));
    exams.push(publishedExam({ id: 'ex-salma-engw', studentId: 's1', classId: '4A', title: 'English Writing', subject: 'English', topics: 'Writing & Comprehension', date: ago(20 * DAY), published: { pct: 82, score: 33, max: 40, at: ago(18 * DAY), feedback: 'Lovely story, Salma! Remember capital letters at the start of names. ✍️', gaps: [], redFlag: null } }));

    // Others (published)
    exams.push(pubMath('s3', 'Multiplication Checkup', 'Times tables', 1, 94, { lang: 'EN', published: { pct: 94, score: 47, max: 50, at: ago(DAY), feedback: 'Fantastic, Lina!', gaps: [], redFlag: null } }));
    exams.push(pubMath('s5', 'Geometry Angles Test', 'Angles', 2, 88, { lang: 'EN', published: { pct: 88, score: 44, max: 50, at: ago(2 * DAY), feedback: 'Great angle work, Emma!', gaps: [], redFlag: null } }));
    exams.push(pubMath('s2', 'Mathe-Test 2', 'Fractions & Textaufgaben', 30, 64));
    exams.push(pubMath('s6', 'Mathe-Test 2', 'Fractions & Textaufgaben', 30, 71));
    exams.push(pubMath('s4', 'Mathe-Test 2', 'Fractions & Textaufgaben', 30, 48, { published: { pct: 48, score: 24, max: 50, at: ago(28 * DAY), feedback: 'Good try, Noah! Let’s practise fractions together.', gaps: [{ id: 'g-de-vocab' }], redFlag: { title: 'Low score — may need extra support', studentText: 'Your teacher will give you some extra help. You can do it!', gapId: 'g-de-vocab' } } }));
    // 4B / 5A
    exams.push(makeExam('mathUpload', { id: 'ex-mia', studentId: 's7', classId: '4B', uploadedAt: ago(40 * MIN), pages: 1, title: 'Math Test 4' }));
    exams.push(pubMath('s8', 'Long Division Quiz', 'Division', 3, 76));
    exams.push(pubMath('s9', 'Long Division Quiz', 'Division', 3, 81));
    exams.push(makeExam('science', { id: 'ex-hana', studentId: 's10', classId: '5A', uploadedAt: ago(5 * HOUR), pages: 1 }));
    exams.push(pubMath('s11', 'Decimals Test', 'Decimals', 4, 69));

    const recurring = [
      { id: 'r1', classId: '4A', studentId: 's1', gapId: 'g-de-vocab', pattern: 'Answers what is given away, not what remains (“bleibt übrig” / “Rest”)', history: [{ title: 'Mathe-Test 1', when: 'Sep 24', lang: 'DE', ok: false }, { title: 'Mathe-Test 2', when: 'Oct 15', lang: 'DE', ok: false }], latest: null, status: 'confirmed' },
      { id: 'r2', classId: '4A', studentId: 's2', gapId: 'g-lessthan', pattern: 'Misreads “weniger als” (less than) as “more than”', history: [{ title: 'Mathe-Test 1', when: 'Sep 24', lang: 'DE', ok: false }, { title: 'Mathe-Test 2', when: 'Oct 15', lang: 'DE', ok: false }], latest: null, status: 'confirmed' },
      { id: 'r3', classId: '4A', studentId: 's3', gapId: 'g-mixed', pattern: 'Leaves improper fractions unconverted (e.g. 9/4)', history: [{ title: 'Mathe-Test 1', when: 'Sep 24', lang: 'DE', ok: true }, { title: 'Mathe-Test 2', when: 'Oct 15', lang: 'DE', ok: false }], latest: { title: 'Fractions Quiz', when: 'Nov 3', lang: 'EN', ok: false }, status: 'confirmed' },
      { id: 'r4', classId: '4A', studentId: 's1', gapId: 'g-mixed', pattern: 'Leaves improper fractions unconverted (e.g. 9/4)', history: [{ title: 'Mathe-Test 1', when: 'Sep 24', lang: 'DE', ok: true }, { title: 'Mathe-Test 2', when: 'Oct 15', lang: 'DE', ok: false }], latest: null, status: 'confirmed' },
      { id: 'r5', classId: '4B', studentId: 's7', gapId: 'g-de-vocab', pattern: 'Answers what is given away, not what remains (“bleibt übrig”)', history: [{ title: 'Mathe-Test 1', when: 'Sep 25', lang: 'DE', ok: false }, { title: 'Mathe-Test 2', when: 'Oct 16', lang: 'DE', ok: true }], latest: null, status: 'confirmed' }
    ];

    const studentGaps = { s1: ['g-de-vocab', 'g-mixed'], s2: ['g-de-vocab', 'g-lessthan'], s3: ['g-mixed'], s4: ['g-de-vocab'], s5: [], s6: [], s7: ['g-de-vocab'], s8: ['g-times'], s9: [], s10: [], s11: ['g-mixed'], s12: [] };

    const langProfiles = {
      s1: { concept: 'Fraction word problems', direct: 88, wordEn: 80, wordDe: 41, samples: 9, decision: null },
      s2: { concept: 'Comparison word problems', direct: 85, wordEn: 82, wordDe: 52, samples: 7, decision: null },
      s3: { concept: 'Mixed numbers', direct: 55, wordEn: 52, wordDe: 50, samples: 8, decision: null },
      s4: { concept: 'Fraction word problems', direct: 62, wordEn: 48, wordDe: 38, samples: 6, decision: null },
      s5: { concept: 'Geometry word problems', direct: 90, wordEn: 88, wordDe: 86, samples: 7, decision: null },
      s6: { concept: 'Fraction word problems', direct: 74, wordEn: 70, wordDe: 58, samples: 2, decision: null },
      s7: { concept: 'Fraction word problems', direct: 81, wordEn: 78, wordDe: 49, samples: 6, decision: null },
      s8: { concept: 'Multiplication word problems', direct: 60, wordEn: 57, wordDe: 55, samples: 6, decision: null },
      s9: { concept: 'Division word problems', direct: 84, wordEn: 80, wordDe: 79, samples: 5, decision: null },
      s10: { concept: 'Decimal word problems', direct: 86, wordEn: 83, wordDe: 81, samples: 6, decision: null },
      s11: { concept: 'Fraction word problems', direct: 63, wordEn: 49, wordDe: 41, samples: 6, decision: null },
      s12: { concept: 'Decimal word problems', direct: 79, wordEn: 76, wordDe: 60, samples: 3, decision: null }
    };

    const practice = [
      { id: 'p1', classId: '4A', title: 'Visual Fractions Quick Quiz', topic: 'Pizza Slice Fraction Fun', desc: 'Visual fraction puzzle! Help the chef slice pieces for hungry customers.', emoji: '🍕', minutes: 10, gapId: 'g-mixed', quiz: 'fractions', assignedTo: ['s3', 's5', 's1'], due: isoDay(-6), worksheet: null, createdAt: ago(9 * DAY), baseline: 47, after: 58,
        completion: { s3: { score: 5, total: 5, at: ago(2 * HOUR) }, s5: { score: 4, total: 5, at: ago(3 * DAY) }, s1: { score: 4, total: 5, at: ago(5 * DAY) } }, progress: { s1: { video: true, worksheet: true }, s3: { video: true }, s5: {} }, reminded: {} },
      { id: 'p2', classId: '4A', title: 'Word Problem Vocabulary Drill', topic: 'Salma’s Candy Store Adventure', desc: 'Multi-step word problem riddle! Find out what “bleibt übrig” in the candy store.', emoji: '🍬', minutes: 15, gapId: 'g-de-vocab', quiz: 'deVocab', assignedTo: ['s1', 's2'], due: isoDay(1), worksheet: null, createdAt: ago(DAY), baseline: 61, after: null,
        completion: {}, progress: {}, reminded: {} },
      { id: 'p4', classId: '4A', title: 'Fraction Pizza Party', topic: 'Pizza Slice Fraction Fun', desc: 'Slice the pizza and count what is left over!', emoji: '🍕', minutes: 10, gapId: 'g-mixed', quiz: 'fractions', assignedTo: ['s4'], due: isoDay(-2), worksheet: null, createdAt: ago(6 * DAY), baseline: 47, after: null, completion: {}, progress: {}, reminded: {} },
      { id: 'p3', classId: '4B', title: 'Division Warm-up', topic: 'Sharing Cookies', desc: 'Share cookies fairly between friends.', emoji: '🍪', minutes: 10, gapId: 'g-times', quiz: 'times', assignedTo: ['s8'], due: isoDay(3), worksheet: null, createdAt: ago(2 * DAY), baseline: 74, after: null, completion: {}, progress: {}, reminded: {} }
    ];

    const groups = [
      { id: 'g1', classId: '4A', name: 'Bilingual Math Support', gapId: 'g-de-vocab', studentIds: ['s1', 's2', 's4'], source: 'AI-suggested', createdAt: ago(3 * DAY) },
      { id: 'g2', classId: '4A', name: 'Mixed Numbers Club', gapId: 'g-mixed', studentIds: ['s1', 's3'], source: 'Manual', createdAt: ago(2 * DAY) }
    ];

    const sessions = [
      { id: 'ss1', classId: '4A', title: 'Bilingual Math Word Problem Review', groupId: 'g1', invitees: ['s1', 's2', 's4'], at: atTime(1, 15, 30), duration: 45, capacity: 6, location: 'Room 4A', why: 'To practise German math words like “bleibt übrig” together.', registrations: ['s2'], createdAt: ago(3 * DAY) }
    ];

    const notifications = [
      { id: uid('n'), to: 's1', kind: 'practice', title: 'New practice: Word Problem Vocabulary Drill', body: 'Ms. Sarah picked a fun candy-store game to help with German math words. 🍬', link: '#/practice', read: false, at: ago(DAY), from: 'Ms. Sarah' },
      { id: uid('n'), to: 's1', kind: 'session', title: 'You are invited: Bilingual Math Word Problem Review', body: 'Ms. Sarah invited you to a small help session. Why? To practise German math words like “bleibt übrig” together.', link: '#/sessions', sessionId: 'ss1', read: false, at: ago(3 * DAY), from: 'Ms. Sarah' },
      { id: uid('n'), to: 's1', kind: 'feedback', title: 'New feedback: English Writing', body: 'Ms. Sarah: “Lovely story, Salma! Remember capital letters at the start of names.”', link: '#/results/ex-salma-engw', read: true, at: ago(18 * DAY), from: 'Ms. Sarah', examId: 'ex-salma-engw' },
      { id: uid('n'), to: 's1', kind: 'upload', title: 'Upload received: Math Quiz 3', body: 'Your paper was uploaded. Ms. Sarah will check it soon.', link: '#/exams?tab=review', read: true, at: ago(25 * MIN), from: 'PaperMind' },
      { id: uid('n'), to: 's2', kind: 'session', title: 'You are invited: Bilingual Math Word Problem Review', body: 'Ms. Sarah invited you to a small help session.', link: '#/sessions', sessionId: 'ss1', read: true, at: ago(3 * DAY), from: 'Ms. Sarah' },
      { id: uid('n'), to: 'teacher', kind: 'session', title: 'Omar Ali registered', body: 'Omar registered for “Bilingual Math Word Problem Review”.', link: '#/sessions', read: false, at: ago(5 * HOUR) },
      { id: uid('n'), to: 'teacher', kind: 'practice', title: 'Lina Hassan completed practice', body: 'Visual Fractions Quick Quiz — 5/5 correct.', link: '#/practice', read: false, at: ago(2 * HOUR) },
      { id: uid('n'), to: 'teacher', kind: 'upload', title: 'New exam from Salma Ahmed', body: 'Math Quiz 3 is waiting for OCR verification.', link: '#/grading/ex-salma-q3', read: true, at: ago(25 * MIN) }
    ];

    const activity = [
      { id: uid('a'), classId: '4A', kind: 'upload', title: 'New Exam Uploaded', text: '<b>Salma Ahmed</b> uploaded Math Quiz 3 (2 pages) · waiting for OCR check.', at: ago(25 * MIN), link: '#/grading/ex-salma-q3', action: 'Review OCR Scan' },
      { id: uid('a'), classId: '4A', kind: 'ai', title: 'AI Grading Completed', text: '<b>Omar Ali</b>’s Mathe-Test 3: AI suggested a grade · waiting for your confirmation.', at: ago(45 * MIN), link: '#/grading/ex-omar-mt3', action: 'Review AI Grade' },
      { id: uid('a'), classId: '4A', kind: 'practice', title: 'Practice Completed', text: '<b>Lina Hassan</b> completed Visual Fractions Quick Quiz with 5/5 correct.', at: ago(2 * HOUR), link: '#/practice', action: 'View Results' },
      { id: uid('a'), classId: '4A', kind: 'upload', title: 'New Exam Uploaded', text: '<b>Noah Becker</b> uploaded Multiplication Checkup (1 page).', at: ago(3 * HOUR), link: '#/grading/ex-noah-mc', action: 'Review OCR Scan' },
      { id: uid('a'), classId: '4A', kind: 'session', title: 'Session Registration', text: '<b>Omar Ali</b> registered for Bilingual Math Word Problem Review.', at: ago(5 * HOUR), link: '#/sessions', action: 'View Session' },
      { id: uid('a'), classId: '4A', kind: 'publish', title: 'Feedback Published', text: 'You published <b>Emma Adel</b>’s Geometry Angles Test (88%).', at: ago(2 * DAY), link: '#/submissions?filter=published', action: 'Open' },
      { id: uid('a'), classId: '4B', kind: 'upload', title: 'New Exam Uploaded', text: '<b>Mia Schmidt</b> uploaded Math Test 4.', at: ago(40 * MIN), link: '#/grading/ex-mia', action: 'Review OCR Scan' },
      { id: uid('a'), classId: '5A', kind: 'upload', title: 'New Exam Uploaded', text: '<b>Hana Mostafa</b> uploaded Science Quiz.', at: ago(5 * HOUR), link: '#/grading/ex-hana', action: 'Review OCR Scan' }
    ];

    const sent = [
      { id: uid('m'), classId: '4A', title: 'Fantastic Job on Today’s Fractions Work!', body: 'Class, you all tackled visual fractions with wonderful curiosity today!', toLabel: 'All Grade 4A students', to: ['s1', 's2', 's3', 's4', 's5', 's6'], at: ago(DAY + 2 * HOUR) }
    ];

    const state = {
      version: 5,
      teacher: { id: 't1', fullName: 'Sarah Mansour', displayName: 'Ms. Sarah', email: 'sarah.educator@papermind.school', password: 'teacher123', role: 'Grade 4 Lead Educator', classroom: '4A', school: 'Horizon Elementary School', phone: '' },
      classes, students, exams, recurring, studentGaps, langProfiles, practice, groups, sessions, notifications, activity, sent,
      ui: { classId: '4A' }
    };
    // Prepare AI suggestions for the exams that already passed OCR
    [omar, salmaEng].forEach((ex) => {
      ex.questions.forEach((q) => { q.resolved = true; });
      ex.ocrConfirmedAt = ago(50 * MIN);
      ex.status = 'ai';
      runAI(state, ex);
    });
    return state;
  }

  /* =========================================================
     Simulated AI grading engine (rule based, deterministic)
     ========================================================= */
  function matches(q, value) {
    const v = norm(value);
    if (!v) return false;
    if (q.keywords) return q.keywords.some((k) => v.includes(k));
    const acc = (q.accept || [q.correct]).map(norm);
    return acc.includes(v) || norm(q.correct) === v;
  }

  function runAI(state, exam) {
    const st = state.students.find((s) => s.id === exam.studentId);
    const scores = {};
    let total = 0, max = 0;
    const wrongGaps = [];
    exam.questions.forEach((q) => {
      let r;
      if (matches(q, q.value)) r = { score: q.max, tag: 'Perfect', reasoning: q.ok || 'Correct.' };
      else if (q.rules && q.rules[norm(q.value)]) r = Object.assign({}, q.rules[norm(q.value)]);
      else r = { score: 0, tag: 'Incorrect', reasoning: '“' + q.value + '” does not match the expected answer (' + q.correct + ').' };
      r.gap = r.score < q.max ? q.gap || null : null;
      scores[q.id] = r;
      total += r.score; max += q.max;
      if (r.gap && !wrongGaps.includes(r.gap)) wrongGaps.push(r.gap);
    });
    const pct = Math.round((total / max) * 100);

    const confByGap = { 'g-de-vocab': 81, 'g-mixed': 67, 'g-lessthan': 78, 'g-times': 64, 'g-past': 72, 'g-spelling': 70, 'g-food-chain': 69 };
    const gaps = wrongGaps.map((gid) => {
      const qids = exam.questions.filter((q) => scores[q.id].gap === gid).map((q) => q.id.toUpperCase() + ' (wrote “' + q.value + '”)');
      const prior = (state.recurring || []).filter((r) => r.studentId === exam.studentId && r.gapId === gid)
        .flatMap((r) => r.history.filter((h) => !h.ok).map((h) => h.title));
      return { id: gid, evidence: qids.concat(prior).join(' • '), confidence: confByGap[gid] || 70 };
    });

    const recurring = (state.recurring || []).filter((r) => r.studentId === exam.studentId && wrongGaps.includes(r.gapId)).map((r) => r.id);

    let redFlag = null;
    const strongRec = (state.recurring || []).find((r) => recurring.includes(r.id) && r.history.filter((h) => !h.ok).length >= 2);
    if (strongRec) {
      const g = GAPS[strongRec.gapId];
      redFlag = {
        gapId: strongRec.gapId, title: 'Potential ' + g.flagTitle,
        reason: st.first + ' understood the calculation but misread the key words — the 3rd time in German word problems.',
        studentText: g.flagStudent
      };
    } else if (pct < 50) {
      redFlag = { gapId: wrongGaps[0] || null, title: 'Low score — may need extra support', reason: st.first + ' scored ' + pct + '%, well below their usual results.', studentText: 'Your teacher will give you some extra help. You can do it!' };
    }

    const strong = [...new Set(exam.questions.filter((q) => scores[q.id].score === q.max).map((q) => q.concept.toLowerCase()))];
    const weak = wrongGaps.map((g) => GAPS[g].short.toLowerCase());
    const insight = st.first + (strong.length ? ' demonstrates solid fluency with ' + strong.slice(0, 2).join(' and ') : ' needs support across this exam') +
      (weak.length ? ', but struggled with ' + weak.join(' and ') + '.' : ' and made no systematic mistakes.');
    const tips = exam.questions.filter((q) => scores[q.id].score < q.max && q.tip).map((q) => q.tip);
    const feedbackDraft = 'Great job on the ' + (strong[0] || 'exam') + ' questions, ' + st.first + '! 🌟 ' +
      (tips.length ? tips.join(' ') + ' Let’s practise this together.' : 'Everything was correct — keep it up!');

    exam.ai = { scores, total, max, pct, gaps, recurring, redFlag, insight, feedbackDraft, at: now() };
    const prevReview = exam.review || {};
    exam.review = {
      scores: Object.fromEntries(exam.questions.map((q) => [q.id, scores[q.id].score])),
      reasons: {}, gapDecisions: {}, recurringDecisions: {}, redFlagDecision: null,
      privateNote: prevReview.privateNote || '', feedback: feedbackDraft, practiceId: prevReview.practiceId || '', sessionId: prevReview.sessionId || ''
    };
    return exam.ai;
  }

  /* =========================================================
     Store
     ========================================================= */
  let state = null;
  const listeners = [];

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) { state = JSON.parse(raw); if (state && state.version === 5) return state; }
    } catch (e) { /* ignore corrupted data */ }
    state = seed();
    save(true);
    return state;
  }
  function save(silent) {
    try { localStorage.setItem(KEY, JSON.stringify(state)); }
    catch (e) {
      if (!silent && PM.ui) PM.ui.toast('error', 'Could not save', 'Your browser storage is full. Try removing large uploaded files.');
      return false;
    }
    if (!silent) listeners.forEach((fn) => fn());
    return true;
  }
  function reset() { state = seed(); save(true); return state; }

  /* ---------- selectors ---------- */
  const S = () => state;
  const student = (id) => state.students.find((s) => s.id === id);
  const exam = (id) => state.exams.find((e) => e.id === id);
  const cls = (id) => state.classes.find((c) => c.id === id);
  const classStudents = (cid) => state.students.filter((s) => s.classId === cid);
  const classExams = (cid) => state.exams.filter((e) => e.classId === cid);

  function notify(to, n) {
    state.notifications.unshift(Object.assign({ id: uid('n'), to, read: false, at: now() }, n));
  }
  function log(classId, a) {
    state.activity.unshift(Object.assign({ id: uid('a'), classId, at: now() }, a));
  }

  function studentPractice(sid) { return state.practice.filter((p) => p.assignedTo.includes(sid)); }
  function studentSessions(sid) { return state.sessions.filter((s) => s.invitees.includes(sid)); }

  function langHypothesis(p) {
    if (!p) return null;
    if (p.samples < 3) return { key: 'insufficient', label: 'Insufficient evidence', text: 'Only ' + p.samples + ' answers on this concept so far — too few to tell.' };
    const dropDe = p.direct - p.wordDe;
    if (p.direct >= 75 && dropDe >= 25) return { key: 'language', label: 'Language difficulty', text: 'Strong on the same concept in direct and English questions; drops only when the question is in German.' };
    if (p.direct < 65 && dropDe >= 15) return { key: 'both', label: 'Both', text: 'Below target on direct questions and drops further in German word problems.' };
    if (p.direct < 65) return { key: 'concept', label: 'Concept difficulty', text: 'Scores are similarly low in every format and language, so the concept itself looks difficult.' };
    if (dropDe >= 15) return { key: 'language', label: 'Language difficulty', text: 'A moderate drop only in German word problems.' };
    return { key: 'none', label: 'No clear gap', text: 'Performance is similar across formats and languages.' };
  }

  PM.data = {
    KEY, MIN, HOUR, DAY, GAPS, BANKS, QUIZZES, QUIZ_FOR_GAP, LESSONS,
    load, save, reset, get state() { return state; }, S, uid, now, isoDay, norm, makeExam, runAI, matches,
    student, exam, cls, classStudents, classExams, notify, log, studentPractice, studentSessions, langHypothesis,
    onChange(fn) { listeners.push(fn); },
    reloadFromStorage() {
      try { const raw = localStorage.getItem(KEY); if (raw) state = JSON.parse(raw); } catch (e) { /* ignore */ }
      return state;
    }
  };
})();
