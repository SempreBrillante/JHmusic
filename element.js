let wrongQuestions = [];
let answered = false;
let elementStudyMode = "exam";
let elementSourceMode = "area";

function startElementQuiz(){

    questions = [];

    const selectedQuestions = [];

    const checked = document.querySelectorAll(
        '#home .homeGrid input[type="checkbox"]:checked'
    );

    checked.forEach(box=>{

        const [first, second] = box.value.split("|");

        if(first==="중학교" || first==="고등학교"){

            selectedQuestions.push(
                ...allQuestions.filter(q =>
                    q.school===first &&
                    q.area===second
                )
            );

        }else{

            selectedQuestions.push(
                ...allQuestions.filter(q =>
                    q.course===first &&
                    q.area===second
                )
            );

        }

    });

    elementStudyMode = document.querySelector(
        'input[name="elementStudyMode"]:checked'
    ).value;

    elementSourceMode = document.querySelector(
        'input[name="elementSourceMode"]:checked'
    ).value;

    if(elementSourceMode==="standard"){

        questions = [...selectedQuestions];

    }else{

        const groupedQuestions = new Map();

        selectedQuestions.forEach(item=>{

            const key = [
                item.school,
                item.course,
                item.area
            ].join("|");

            if(!groupedQuestions.has(key)){

                groupedQuestions.set(key,{
                    school:item.school,
                    course:item.course,
                    area:item.area,
                    knowledge:[],
                    skill:[],
                    attitude:[]
                });

            }

            const grouped = groupedQuestions.get(key);

            ["knowledge","skill","attitude"].forEach(category=>{

                item[category].forEach(answer=>{

                    if(!grouped[category].includes(answer)){
                        grouped[category].push(answer);
                    }

                });

            });

        });

        const categories=[
            ["knowledge","지식·이해"],
            ["skill","과정·기능"],
            ["attitude","가치·태도"]
        ];

        questions=[...groupedQuestions.values()].flatMap(grouped=>

            categories
                .filter(([category])=>grouped[category].length)
                .map(([category,categoryLabel])=>({

                    ...grouped,
                    category,
                    categoryLabel,
                    knowledge:category==="knowledge"
                        ? grouped.knowledge : [],
                    skill:category==="skill"
                        ? grouped.skill : [],
                    attitude:category==="attitude"
                        ? grouped.attitude : []

                }))

        );

    }

    console.log("선택된 내용요소 문항 수:",questions.length);

    if(questions.length===0){

        alert("영역을 선택하세요.");
        return;

    }

    currentIndex=0;

    home.style.display="none";
    quiz.style.display="block";

    showElementQuestion();

}
function showElementQuestion(){

    current = questions[currentIndex];

    school.textContent =
        current.school === "진로선택"
            ? current.course
            : current.school;

    area.textContent = current.area;

    if(elementSourceMode === "standard"){

        code.textContent = current.code;

        if(elementStudyMode === "exam"){

            question.textContent = current.text;

        }else if(elementStudyMode === "blank"){

            question.textContent = makeElementBlank(current.text);

        }else{

            question.textContent = current.text;

        }

    }else{

        code.textContent = current.categoryLabel;

        if(elementStudyMode === "exam"){

            question.textContent =
                `${current.area} · ${current.categoryLabel}`;

        }else if(elementStudyMode === "blank"){

            showElementGuide(true);

        }else{

            showElementGuide(false);

        }

    }

    question.style.display = "block";
    toggleBtn.style.display = "inline-block";
    questionVisible = true;
    toggleBtn.textContent = "🙈 내용 숨기기";

    knowledgeAnswer.value = "";
    skillAnswer.value = "";
    attitudeAnswer.value = "";

    result.textContent = "";

    knowledgeBox.style.display =
        current.knowledge.length ? "block" : "none";

    skillBox.style.display =
        current.skill.length ? "block" : "none";

    attitudeBox.style.display =
        current.attitude.length ? "block" : "none";

    progress.textContent =
        `${currentIndex + 1} / ${questions.length}`;

        answered = false;
checkBtn.textContent = "제출";

}
function makeElementBlank(text){

    const tokens = text.split(/(\s+)/);

    const wordIndexes = tokens
        .map((token, index) => ({ token, index }))
        .filter(item => item.token.trim().length >= 2)
        .map(item => item.index);

    const level = getLevel(current.id).level;

    const ratio = {
        1:0.2,
        2:0.35,
        3:0.5,
        4:0.7,
        5:0.9
    };

    const blankCount = Math.max(
        1,
        Math.floor(wordIndexes.length * ratio[level])
    );

    const blankIndexes = new Set();

    while(blankIndexes.size < Math.min(blankCount, wordIndexes.length)){

        const randomIndex = Math.floor(Math.random() * wordIndexes.length);
        blankIndexes.add(wordIndexes[randomIndex]);

    }

    return tokens.map((token, index) =>
        blankIndexes.has(index)
            ? token.replace(/[^\s,]/g, "□")
            : token
    ).join("");

}

function showElementGuide(useBlanks){

    const guideCategories = [
        ["지식·이해", current.knowledge],
        ["과정·기능", current.skill],
        ["가치·태도", current.attitude]
    ];

    question.replaceChildren();

    guideCategories.forEach(([title, answers]) => {

        if(!answers.length) return;

        const heading = document.createElement("h3");
        const list = document.createElement("ul");

        heading.textContent = title;

        answers.forEach(answer => {
            const item = document.createElement("li");

            item.textContent = useBlanks
                ? makeElementBlank(answer)
                : answer;

            list.append(item);
        });

        question.append(heading, list);

    });

}
function checkList(userText, answerList){

    const normalizedInput = normalizeElementAnswer(userText);

    let correct = 0;
    const wrong = [];

    answerList.forEach(answer => {

        const ok = normalizedInput.includes(
            normalizeElementAnswer(answer)
        );

        if(ok){
            correct++;
        }else{
            wrong.push(answer);
        }

    });

    return {
        correct,
        total: answerList.length,
        wrong
    };

}

function normalizeElementAnswer(text){

    return text.replace(/[\s,，•·]/g, "");

}

function formatMissingAnswers(answers){

    if(!answers.length) return "정답";

    return `
        <p>누락</p>
        <ul>
            ${answers.map(answer => `<li>${answer}</li>`).join("")}
        </ul>`;

}
function checkElementAnswer(){

    let html = "";

    if(knowledgeBox.style.display !== "none"){

        const r = checkList(
            knowledgeAnswer.value,
            current.knowledge
        );

        html += `
        <h3>지식·이해 (${r.correct}/${r.total})</h3>
        ${formatMissingAnswers(r.wrong)}
        <hr>`;
    }

    if(skillBox.style.display !== "none"){

        const r = checkList(
            skillAnswer.value,
            current.skill
        );

        html += `
        <h3>과정·기능 (${r.correct}/${r.total})</h3>
        ${formatMissingAnswers(r.wrong)}
        <hr>`;
    }

    if(attitudeBox.style.display !== "none"){

        const r = checkList(
            attitudeAnswer.value,
            current.attitude
        );

        html += `
        <h3>가치·태도 (${r.correct}/${r.total})</h3>
        ${formatMissingAnswers(r.wrong)}
        `;
    }

    result.innerHTML = html;
const isWrong = html.includes("누락");

if(isWrong && !wrongQuestions.includes(current)){
    wrongQuestions.push(current);
}
const isWrong = html.includes("누락");

if(elementStudyMode === "blank"){

    updateLevel(!isWrong);

}
result.innerHTML = html;
}
function nextElementQuestion(){

    if(currentIndex < questions.length-1){
        currentIndex++;
        showElementQuestion();
        return;
    }

    // 마지막 문제까지 왔을 때
    if(wrongQuestions.length){

        alert(`오답 ${wrongQuestions.length}문제를 다시 풉니다.`);

        questions = [...wrongQuestions];
        wrongQuestions = [];

        currentIndex = 0;
        showElementQuestion();
        return;
    }

    alert("🎉 모든 문제를 맞혔습니다!");
}
function prevElementQuestion(){

    if(currentIndex>0){

        currentIndex--;
        showElementQuestion();

    }

}
document.addEventListener("keydown", e=>{

    if(appMode!=="element") return;

    if(e.key==="Enter" && e.ctrlKey){

        e.preventDefault();
        submitOrNext();

    }

});
function submitOrNext(){

    if(!answered){

        checkElementAnswer();

        answered = true;
        checkBtn.textContent = "다음 ▶";

    }else{

        nextElementQuestion();

    }

}