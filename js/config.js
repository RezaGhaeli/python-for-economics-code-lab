/*
   Lab settings: everything that makes this lab yours. The engine (app.js, checker.js) reads
   these values; the activities themselves live in activities.js.
   Image paths are relative to index.html. Any image can be null: the app then draws a
   coloured banner instead.
*/
const LAB = {
  title: 'Python for Economics Code Lab',                    // big title on the home page and in the browser tab
  brand: 'Econ Code Lab',                    // short name beside the logo in the top bar, e.g. "Code Lab"
  kicker: 'First-year Economics · Introduction to Python',                  // small line above the title, e.g. "CSIS 1280 · Modules 1 to 6"
  scope: 'the introduction to Python',                    // used in sentences, e.g. "Modules 1–6"
  lead: 'Ten short Python activities built on economic questions: GDP, inflation, elasticity, supply and demand, compounding, and real data. Write the code, run it, answer three quick questions, and see exactly what to fix.',                      // one or two sentences under the title
  footer: 'First-year Economics · Introduction to Python',                  // footer text, e.g. "CSIS 1280 · Web Design"
  storageKey: 'codeLab.python-for-economics-code-lab.v1',         // unique per lab, so two labs never share progress
  author: { name: 'Reza Ghaeli', url: 'https://github.com/RezaGhaeli' },                          // credit, e.g. { name: 'Reza Ghaeli', url: 'https://github.com/RezaGhaeli' }: home byline, footer, printed results

  logo: null,                            // e.g. 'img/logo.png' (wide logo for the dark top bar)
  heroArt: null,                         // e.g. 'img/hero.png' (wide picture on the home page)
  heroAlt: '',
  summaryArt: null,                      // picture on the final results page
  how: [                                 // the four "How it works" cards; img may be null
    { img: null, title: 'Read the task', text: 'Each activity tells a short story and lists the steps.' },
    { img: null, title: 'Write the code', text: 'You write lab.py. Code from earlier activities can be given at the top.' },
    { img: null, title: 'Run, answer, submit', text: 'Press Run to see your output and charts and compare them with the goal output. Answer the three questions under the code, then submit.' },
    { img: null, title: 'Learn from the report', text: 'See each mistake, why it matters, the proper code, the right quiz answers, and your score.' }
  ],
  guide: null,                           // e.g. 'guide/Student_Guide.pdf' adds a "Student guide" button

  files: { py: 'lab.py' },   // names on the editor tabs and in <link>/<script src>
  jsx: false,                            // true: compile the JS file from JSX with Babel (React labs); see the React section of the authoring guide
  express: false,                        // true: the JS file is an Express server (server.js) run in the browser; see "Express labs" in the authoring guide
  apiTester: false,                      // Express labs: true adds a method menu (GET/POST/PUT/PATCH/DELETE), a JSON body box and a Send button to the mini browser (REST API labs)
  console: false,                        // true: a console lab (console.log, prompt, loops; no page to look at): the preview shows the program's console,
                                         // prompt() is answered from each activity's `answers` (a box students can edit), and endless loops are stopped.
                                         // false: student code runs exactly as in a browser. See "Console programs" in the authoring guide
  readySelector: null,                   // grading waits until this element has children (default '#root' when jsx is true)

  python: true,                    // true: students write Python (lab.py) run by Pyodide; set files to { py: 'lab.py' }
  pyPackages: ['numpy', 'pandas'],   // loaded when Python starts (matplotlib loads on first import)
  pyData: ['data/provinces.csv'],                            // data files students read by name, e.g. ['data/diabetes.csv'] → pd.read_csv('diabetes.csv')
  pyTimeout: 60000,                      // stop a run after this many milliseconds

  /* Exam mode (null = a practice lab). A timed, one-sitting exam: students enter name + id and start a timer;
     all activities ("sections") are open; nothing is graded or shown until they finish (or time runs out);
     then they download a Word report (.docx) carrying their code, which grade.html re-grades in bulk.
     Keep solutions OUT of activities.js in an exam: see "Exams" in references/authoring-activities.md. e.g.
     { minutes: 40, idLabel: 'Student number', accessCode: null, review: false, rules: ['Work alone.', …] } */
  exam: null,

  chromeOnly: false,                     // true: the lab opens only in Google Chrome (other browsers see a 'please use Chrome' page)
  passMark: 80,                          // "redo anything below this" advice on the results page
  desktopWidth: 960,                     // width of the hidden grading frame for desktop checks
  phoneWidth: 400                        // width used for csN()/rectN() checks and the Phone preview
};
