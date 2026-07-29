const progress =
document.getElementById("progress");

let allQuestions = [];
let questions = [];

let currentIndex = 0;
let current = null;

const home = document.getElementById("home");
const quiz = document.getElementById("quiz");

const school = document.getElementById("school");
const area = document.getElementById("area");
const code = document.getElementById("code");
const question = document.getElementById("question");
const answer = document.getElementById("answer");
const result = document.getElementById("result");
const toggleBtn = document.getElementById("toggleBtn");

let studyMode = "exam";
let questionVisible = true;

async function loadData(){

    const res = await fetch("data.json");
    allQuestions = await res.json();

}

loadData();

function startQuiz(){

    questions=[];

    const checked =
    document.querySelectorAll(
        "#home input[type=checkbox]:checked"
    );

    checked.forEach(box=>{

        const value=box.value;

        if(value.includes("|")){

            const split=value.split("|");

            const s=split[0];
            const a=split[1];

            questions.push(
                ...allQuestions.filter(q=>

                    q.school===s &&
                    q.area===a

                )
            );

        }

        else{

            questions.push(
                ...allQuestions.filter(q=>

                    q.course===value

                )
            );

        }

    });

    if(questions.length===0){

        alert("영역을 선택하세요.");

        return;

    }

    const random =
    document.querySelector(
        "input[name=mode]:checked"
    ).value==="random";
    studyMode = document.querySelector(
    'input[name="studyMode"]:checked'
).value;


    if(random){

        questions.sort(()=>Math.random()-0.5);

    }

    currentIndex=0;

    home.style.display="none";
    quiz.style.display="block";

    showQuestion();

}

function showQuestion(){

    current=questions[currentIndex];

    school.textContent=current.school;
    area.textContent=current.area;
    code.textContent=current.code;
  question.textContent = current.text;

if(studyMode==="exam"){

    question.style.display="none";
    toggleBtn.style.display="none";

}
else{
if(studyMode==="exam"){
    question.style.display="block";
}
    toggleBtn.style.display="inline-block";

    questionVisible=true;
    toggleBtn.textContent="🙈 내용 숨기기";

}

    progress.textContent = `${currentIndex + 1} / ${questions.length}`;

    answer.value="";
    result.textContent="";

}

function nextQuestion(){

    if(currentIndex<questions.length-1){

        currentIndex++;

        showQuestion();

    }

    else{

        alert("🎉 모든 문제를 완료했습니다.");

    }

}

function prevQuestion(){

    if(currentIndex>0){

        currentIndex--;

        showQuestion();

    }

}

function goHome(){

    home.style.display="block";

    quiz.style.display="none";

}

function checkAnswer(){

    question.style.display = "block";

    if(answer.value.trim() == current.text.trim()){

        result.style.color = "green";
        result.innerHTML = "⭕ 정답";

    }
   else{

    let user = answer.value.trim();
    let correct = current.text.trim();

    let html = "<b>❌ 오답</b><br><br>";

    let i = 0;
    let j = 0;

    while(i < correct.length){

        if(j < user.length && correct[i] === user[j]){

            html += correct[i];
            i++;
            j++;

        }else{

            html += `<span style="background:#ffb3b3;color:red;font-weight:bold;">${correct[i]}</span>`;
            i++;

        }

    }

    result.style.color = "black";
    result.innerHTML = html;

}

}

function toggleQuestion(){

    questionVisible=!questionVisible;

    if(questionVisible){

        question.style.display="block";
        toggleBtn.textContent="🙈 내용 숨기기";

    }else{

        question.style.display="none";
        toggleBtn.textContent="👁 내용 보기";

    }

}
let isChecked = false;

answer.addEventListener("keydown", function(event){

    if(event.key !== "Enter") return;

    event.preventDefault();

    if(!isChecked){

        checkAnswer();
        isChecked = true;

    }else{

        nextQuestion();
        isChecked = false;

    }

});