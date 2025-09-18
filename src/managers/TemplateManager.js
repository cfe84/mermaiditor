/**
 * TemplateManager - Manages diagram templates and examples
 */
export class TemplateManager {
    constructor() {
        this.templates = this.initializeTemplates();
    }

    initializeTemplates() {
        const readme = "graph TD;\n    A[\"This default project contains a number of sample diagrams that you can use for reference.\"]\n	B[\"I recommend you start by creating a new project to save your diagrams.\"]\n	C[\"If you don't want to keep those examples, you can delete the sample project using the option in the projects drop down. You  can recreate it simply by creating a new project called Default.\"]\n	D[\"Have fun!\"]\n	A --> B\n    A --> C\n    B --> D\n    C --> D";
        
        const defaultContent = "graph TD;\n    A[Create a project]-->B[Create a diagram];\n    B-->C[Copy diagram to clipboard];\n    B-->D[Export diagram as PNG];\n    C-->E[Happiness];\n    D-->E[Happiness];\n    A[Create a project]-->F[Export project];\n    F--Import project-->A";
        
        const sequenceExample = "sequenceDiagram;\n    A->>B: Hello B, how are you?\n    B->>A: I am good thanks!\n    A->>C: Hello C, how are you?\n    C->>A: I am good thanks!";
        
        const classDiagramExample = "---\ntitle: Animal example\n---\nclassDiagram\n    note \"From Duck till Zebra\"\n    Animal <|-- Duck\n    note for Duck \"can fly\ncan swim\ncan dive\ncan help in debugging\"\n    Animal <|-- Fish\n    Animal <|-- Zebra\n    Animal : +int age\n    Animal : +String gender\n    Animal: +isMammal()\n    Animal: +mate()\n    class Duck{\n        +String beakColor\n        +swim()\n        +quack()\n    }\n    class Fish{\n        -int sizeInFeet\n        -canEat()\n    }\n    class Zebra{\n        +bool is_wild\n        +run()\n    }\n";
        
        const stateDiagramExample = "stateDiagram-v2\n    [*] --> State1\n    State1 --> [*]\n    State1 --> State2\n    State2 --> State1\n    State2 --> [*]";
        
        const erdExample = "erDiagram\n    CUSTOMER ||--o{ ORDER : places\n    ORDER ||--|{ LINE-ITEM : contains\n    CUSTOMER }|..|{ DELIVERY-ADDRESS : uses";
        
        const userJourney = "journey\n    title My working day\n    section Go to work\n      Make tea: 5: Me\n      Go upstairs: 3: Me\n      Do work: 1: Me, Cat\n    section Go home\n      Go downstairs: 5: Me\n      Sit down: 5: Me";
        
        const flowchartExample = "flowchart TD;\n    A[Create a project]-->B[Create a diagram];\n    B-->C[Copy diagram to clipboard];\n    B-->D[Export diagram as PNG];\n    C-->E[Happiness];\n    D-->E[Happiness];\n    A[Create a project]-->F[Export project];\n    F--Import project-->A";
        
        const gitGraphExample = "gitGraph\n    commit\n    branch develop\n    commit\n    branch feature\n    commit\n    checkout develop\n    merge feature\n    commit\n    checkout main\n    merge develop";
        
        const mindmapExample = "mindmap\n  root\n    A\n      B\n    C\n      D\n      E\n    F\n      G\n      H";
        
        const pieChartExample = "pie\n    title Pets adopted by volunteers\n    \"Dogs\": 386\n    \"Cats\": 85\n    \"Rats\": 15\n    \"Rabbits\": 15";
        
        const quadrantChartExample = "quadrantChart\n    title Reach and engagement of campaigns\n    x-axis Low Reach --> High Reach\n    y-axis Low Engagement --> High Engagement\n    quadrant-1 We should expand\n    quadrant-2 Need to promote\n    quadrant-3 Re-evaluate\n    quadrant-4 May be improved\n    Campaign A: [0.3, 0.6]\n    Campaign B: [0.45, 0.23]\n    Campaign C: [0.57, 0.69]\n    Campaign D: [0.78, 0.34]\n    Campaign E: [0.40, 0.34]\n    Campaign F: [0.35, 0.78]";
        
        const requirementDiagramExample = "requirementDiagram\n\n    requirement test_req {\n    id: 1\n    text: the test text.\n    risk: high\n    verifymethod: test\n    }\n\n    element test_entity {\n    type: simulation\n    }\n\n    test_entity - satisfies -> test_req\n";
        
        const sankeyExample = "---\nconfig:\n  sankey:\n    showValues: false\n---\nsankey-beta\n\n%% source,target,value\nElectricity grid,Over generation / exports,104.453\nElectricity grid,Heating and cooling - homes,113.726\nElectricity grid,H2 conversion,27.14\n";
        
        const xyExample = "---\nconfig:\n    xyChart:\n        width: 900\n        height: 600\n    themeVariables:\n        xyChart:\n            titleColor: \"#ff0000\"\n---\nxychart-beta\n    title \"Sales Revenue\"\n    x-axis [jan, feb, mar, apr, may, jun, jul, aug, sep, oct, nov, dec]\n    y-axis \"Revenue (in $)\" 4000 --> 11000\n    bar [5000, 6000, 7500, 8200, 9500, 10500, 11000, 10200, 9200, 8500, 7000, 6000]\n    line [5000, 6000, 7500, 8200, 9500, 10500, 11000, 10200, 9200, 8500, 7000, 6000]\n";
        
        const kanbanExample = "---\nconfig:\n  kanban:\n    ticketBaseUrl: 'https://mermaidchart.atlassian.net/browse/#TICKET#'\n---\nkanban\n  Todo\n    [Create Documentation]\n    docs[Create Blog about the new diagram]\n  [In progress]\n    id6[Create renderer so that it works in all cases. We also add som extra text here for testing purposes. And some more just for the extra flare.]\n  id9[Ready for deploy]\n    id8[Design grammar]@{ assigned: 'knsv' }\n  id10[Ready for test]\n    id4[Create parsing tests]@{ ticket: MC-2038, assigned: 'K.Sveidqvist', priority: 'High' }\n    id66[last item]@{ priority: 'Very Low', assigned: 'knsv' }\n  id11[Done]\n    id5[define getData]\n    id2[Title of diagram is more than 100 chars when user duplicates diagram with 100 char]@{ ticket: MC-2036, priority: 'Very High'}\n    id3[Update DB function]@{ ticket: MC-2037, assigned: knsv, priority: 'High' }\n\n  id12[Can't reproduce]\n    id3[Weird flickering in Firefox]\n";
        
        const ganttExample = "gantt\n    title A Gantt Diagram\n    dateFormat  YYYY-MM-DD\n    section A section\n    A task           :a1, 2014-01-01, 30d\n    Another task     :after a1  , 12d\n    section Critical tasks\n    Important task   :crit, 24d\n    Another critical task: 48h\n    section The last section\n    last task       : 30d";
        
        const timelineExample = "timeline\n    title History of Social Media Platform\n    2002 : LinkedIn\n    2004 : Facebook\n         : Google\n    2005 : Youtube\n    2006 : Twitter";

        return {
            Graph: defaultContent,
            Sequence: sequenceExample,
            State: stateDiagramExample,
            Class: classDiagramExample,
            ERD: erdExample,
            Mindmap: mindmapExample,
            Flowchart: flowchartExample,
            GitGraph: gitGraphExample,
            UserJourney: userJourney,
            Requirements: requirementDiagramExample,
            PieChart: pieChartExample,
            QuadrantChart: quadrantChartExample,
            Sankey: sankeyExample,
            XY: xyExample,
            Timeline: timelineExample,
            Kanban: kanbanExample,
            Gantt: ganttExample,
            Readme: readme
        };
    }

    getTemplate(name) {
        return this.templates[name] || this.templates.Graph;
    }

    getTemplateNames() {
        return Object.keys(this.templates);
    }

    getAllTemplates() {
        return this.templates;
    }

    getDefaultContent() {
        return this.templates.Graph;
    }

    getReadmeContent() {
        return this.templates.Readme;
    }
}