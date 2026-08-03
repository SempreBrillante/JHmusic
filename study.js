       
        let studyMode = "exam";

let levelData =
JSON.parse(localStorage.getItem("levelData")) || {};

let questionVisible = true;


function startStudyQuiz(){

    
    questions=[];

    const checked =
    document.querySelectorAll(
        "#home input[type=checkbox]:checked"
    );

   checked.forEach(box => {

    const value = box.value;

    if (value.includes("|")) {

        const [first, second] = value.split("|");

        // 공통(중학교/고등학교)
        if (first === "중학교" || first === "고등학교") {

            questions.push(
                ...allQuestions.filter(q =>
                    q.school === first &&
                    q.area === second
                )
            );

        }

        // 진로선택
        else {

            questions.push(
                ...allQuestions.filter(q =>
                    q.course === first &&
                    q.area === second
                )
            );

        }

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
    studyMode = document.querySelector('input[name="studyMode"]:checked').value;





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
if(studyMode==="blank"){

    question.textContent = makeBlank(current.text);

}
else{

    question.textContent = current.text;

}

if(studyMode==="exam"){

    question.style.display="none";
    toggleBtn.style.display="none";

}else{

    question.style.display="block";
    toggleBtn.style.display="inline-block";

    questionVisible = true;
    toggleBtn.textContent = "🙈 내용 숨기기";

}

    progress.textContent = `${currentIndex + 1} / ${questions.length}`;

    answer.value="";
    result.textContent="";

}

function nextQuestion(){

   if(currentIndex<questions.length-1){

    currentIndex++;

}else{

    currentIndex = 0;   // 처음으로 돌아감

}

showQuestion();

}

function prevQuestion(){

    if(currentIndex>0){

        currentIndex--;

        showQuestion();

    }

}

function goHome(){

    appModeOption.style.display="block";
    home.style.display="block";

    quiz.style.display="none";

}
function normalize(text){

    return text
        .replace(/\s+/g, "")   // 모든 공백 제거
        .replace(/[·⋅ㆍ]/g, "")
        .trim();

}
function checkAnswer(){

    question.style.display = "block";

const user = normalize(answer.value);
const correct = normalize(current.text);
console.log(user);
console.log(correct);

if(user === correct){

       if(studyMode === "blank"){
    updateLevel(true);
}

const info = getLevel(current.id);

result.style.color = "green";

if(studyMode === "blank"){
    result.innerHTML =
        `⭕ 정답<br>Lv.${info.level}`;
}else{
    result.innerHTML = "⭕ 정답";
}

 }else{

   if(studyMode === "blank"){
    updateLevel(false);
}

    let userText = answer.value.trim();
    let correctText = current.text.trim();

    let html = "<b>❌ 오답</b><br><br>";

    let i = 0;
    let j = 0;

    while(i < correctText.length){

        if(j < userText.length && correctText[i] === userText[j]){

            html += correctText[i];
            i++;
            j++;

        }else{

            html += `<span style="background:#ffb3b3;color:red;font-weight:bold;">${correctText[i]}</span>`;
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
function makeBlank(text){

    const particles = [
        "으로","에서","에게","처럼","까지","부터",
        "으로서","으로써",
        "은","는","이","가","을","를",
        "와","과","의","에","도","만","나","이나","·","⋅","ㆍ",",","."
    ];

    let words = text.split(" ");

    let candidates = [];

    for(let i=0;i<words.length;i++){

        let word = words[i];

        let stem = word;

        let particle = "";

        for(let p of particles.sort((a,b)=>b.length-a.length)){

            if(word.endsWith(p)){

                stem = word.slice(0,-p.length);
                particle = p;
                break;

            }

        }

        candidates.push({
            stem,
            particle
        });

    }

    const level = getLevel(current.id).level;
    console.log("문제:", current.id);
console.log("현재 레벨:", level);

const ratio = {
    1:0.2,
    2:0.5,
    3:0.7,
    4:0.9,
    5:1
};

let count = Math.max(
    1,
    Math.floor(words.length * ratio[level])
);

 const availableIndexes = [];

for (let i = 0; i < candidates.length; i++) {
    if (candidates[i].stem.length >= 2) {
        availableIndexes.push(i);
    }
}

count = Math.min(count, availableIndexes.length);

availableIndexes.sort(() => Math.random() - 0.5);

let indexes = availableIndexes.slice(0, count);

    for(let i of indexes){

        candidates[i].stem="□".repeat(candidates[i].stem.length);

    }

    return candidates.map(x=>x.stem+x.particle).join(" ");

}function getLevel(id){

    if(!levelData[id]){

        levelData[id] = {
            level:1,
            streak:0
        };

    }

    return levelData[id];

}

function saveLevel(){

    localStorage.setItem(
        "levelData",
        JSON.stringify(levelData)
    );

}

function updateLevel(correct){

    const info = getLevel(current.id);

    if(info.wrong === undefined){
        info.wrong = 0;
    }

    if(correct){

        info.level = Math.min(info.level + 1, 5);
        info.wrong = 0;

    }else{

        info.wrong++;

        if(info.wrong >= 2){

            info.level = Math.max(info.level - 1, 1);
            info.wrong = 0;

        }

    }

    saveLevel();

}
function resetLevel(){

    if(!confirm("모든 학습 레벨을 초기화하시겠습니까?")){
        return;
    }

    localStorage.removeItem("levelData");

    alert("학습 레벨이 초기화되었습니다.");

    location.reload();

}
document.querySelectorAll('input[name="studyMode"]').forEach(radio => {
    radio.addEventListener("change", () => {

    

    });
});

// 첫 화면에서도 바로 적용
        
const studyOption = document.getElementById("studyOption");
const elementOption = document.getElementById("elementOption");

document.querySelectorAll('input[name="appMode"]').forEach(radio=>{

    radio.addEventListener("change",()=>{

        if(radio.checked){

            studyOption.style.display =
                radio.value==="study" ? "block" : "none";

            elementOption.style.display =
                radio.value==="element" ? "block" : "none";

        }

    });

});
