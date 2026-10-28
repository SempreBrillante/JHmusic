const progress = document.getElementById("progress");

let allQuestions = [];
let questions = [];

let currentIndex = 0;
let current = null;

const home = document.getElementById("home");
const quiz = document.getElementById("quiz");
const appModeOption = document.getElementById("appModeOption");

const school = document.getElementById("school");
const area = document.getElementById("area");
const code = document.getElementById("code");
const question = document.getElementById("question");
const answer = document.getElementById("answer");
const elementAnswerBox =
document.getElementById("elementAnswerBox");

const knowledgeBox =
document.getElementById("knowledgeBox");

const skillBox =
document.getElementById("skillBox");

const attitudeBox =
document.getElementById("attitudeBox");

const knowledgeAnswer =
document.getElementById("knowledgeAnswer");

const skillAnswer =
document.getElementById("skillAnswer");

const attitudeAnswer =
document.getElementById("attitudeAnswer");


const submitBtn =
document.getElementById("submitBtn");

const prevBtn =
document.getElementById("prevBtn");

const nextBtn =
document.getElementById("nextBtn");
const result = document.getElementById("result");
const toggleBtn = document.getElementById("toggleBtn");

let appMode="study";

async function loadData(){

    const res = await fetch("data.json");
    allQuestions = await res.json();

}

loadData();

function startQuiz(){

    appMode =
    document.querySelector(
        'input[name="appMode"]:checked'
    ).value;
if(appMode === "core" || appMode === "methods" || appMode === "music"){ startRecallQuiz(); return; }
setQuizMode();
    appModeOption.style.display = "none";

    if(appMode==="study"){

        startStudyQuiz();

    }else{

        startElementQuiz();

    }

}
function setQuizMode() {

    if (appMode === "study") {

        answer.style.display = "block";
        elementAnswerBox.style.display = "none";

        submitBtn.onclick = checkAnswer;
        prevBtn.onclick = prevQuestion;
        nextBtn.onclick = nextQuestion;

    } else {

        answer.style.display = "none";
        elementAnswerBox.style.display = "block";

        submitBtn.onclick = checkElementAnswer;
        prevBtn.onclick = prevElementQuestion;
        nextBtn.onclick = nextElementQuestion;

    }

}
