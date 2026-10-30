// 모든 학습 종류에서 버튼과 단축키가 같은 채점 상태를 사용한다.
let learningSession = null;
const sessionSummary = document.createElement('section');
sessionSummary.id = 'sessionSummary';
sessionSummary.className = 'homeCard';
sessionSummary.style.display = 'none';
document.getElementById('appContent').append(sessionSummary);

function sessionFields(){
    return appMode === 'element' ? [knowledgeAnswer,skillAnswer,attitudeAnswer] : [answer];
}
function sessionSetChecked(value){
    isChecked=value; answered=value; recallChecked=value;
}
function sessionShow(){
    if(!learningSession) return;
    sessionSummary.style.display='none';
    const record=learningSession.records.get(current);
    sessionFields().forEach((field,i)=>field.value=record?.draft[i] || '');
    sessionSetChecked(Boolean(record?.graded));
    if(record?.graded || record?.feedback){
        result.innerHTML=record.feedback;
        result.style.color=record.color;
        question.innerHTML=record.question;
        question.style.display=record.questionDisplay;
    }
    submitBtn.textContent='채점';
    nextBtn.textContent=currentIndex===questions.length-1 ? '결과 보기' : '다음 ▶';
    prevBtn.disabled=currentIndex===0;
}
function sessionRemember(graded,correct){
    if(!learningSession) return;
    learningSession.records.set(current,{
        draft:sessionFields().map(field=>field.value),graded,correct,
        feedback:result.innerHTML,color:result.style.color,feedbackClass:result.className,
        question:question.innerHTML,questionDisplay:question.style.display
    });
}
function sessionFinish(){
    const right=questions.filter(q=>learningSession.records.get(q)?.graded && learningSession.records.get(q).correct);
    const wrong=questions.filter(q=>learningSession.records.get(q)?.graded && !learningSession.records.get(q).correct);
    const pending=questions.filter(q=>!learningSession.records.get(q)?.graded);
    learningSession.retry=questions.filter(q=>!learningSession.records.get(q)?.graded || !learningSession.records.get(q).correct);
    quiz.style.display='none';
    sessionSummary.style.display='block';
    sessionSummary.replaceChildren();
    const heading=document.createElement('h2');heading.textContent='학습 결과';
    const totals=document.createElement('p');
    totals.textContent=`총 ${questions.length}문제 · 정답 ${right.length} · 오답 ${wrong.length} · 미채점 ${pending.length}`;
    sessionSummary.append(heading,totals);
    const list=document.createElement('ul');
    questions.forEach(q=>{
        const record=learningSession.records.get(q);
        const item=document.createElement('li');
        const status=!record?.graded?'미채점':record.correct?'정답':'오답';
        item.textContent=`${status} · ${[q.course || q.school,q.area,q.coreLabel || q.categoryLabel || q.code].filter(Boolean).join(' · ')}`;
        item.className=status==='정답'?'recallCorrect':'recallWrong';
        list.append(item);
    });
    sessionSummary.append(list);
    const retry=document.createElement('button');
    retry.id='retryWrongBtn';
    retry.textContent=`오답·미채점 재도전 (${learningSession.retry.length})`;
    retry.disabled=!learningSession.retry.length;
    retry.onclick=()=>sessionRestart(false);
    const all=document.createElement('button');all.textContent='전체 재도전';all.onclick=()=>sessionRestart(true);
    const homeButton=document.createElement('button');homeButton.textContent='홈으로';homeButton.onclick=()=>goHome();
    sessionSummary.append(retry,all,homeButton);
}
function sessionRestart(all){
    questions=[...(all?learningSession.original:learningSession.retry)];
    if(!questions.length) return;
    learningSession.records=new Map();
    currentIndex=0;sessionSummary.style.display='none';quiz.style.display='block';
    sessionRender();
}
function sessionRender(){
    if(appMode==='study')showQuestion();
    else if(appMode==='element')showElementQuestion();
    else showRecallQuestion();
}
function sessionNext(){
    if(!learningSession || quiz.style.display==='none')return;
    if(!learningSession.records.has(current))sessionRemember(false,false);
    if(currentIndex===questions.length-1){sessionFinish();return;}
    currentIndex++;sessionRender();
}
function sessionPrevious(){
    if(!learningSession || currentIndex===0)return;
    if(!learningSession.records.has(current))sessionRemember(false,false);
    currentIndex--;sessionRender();
}
function sessionWrapStart(original){return function(){
    learningSession=null;sessionSummary.style.display='none';
    original();
    if(questions.length && quiz.style.display!=='none'){
        learningSession={original:[...questions],records:new Map(),retry:[]};
        sessionSetChecked(false);sessionShow();
        prevBtn.onclick=sessionPrevious;nextBtn.onclick=sessionNext;
    }
};}
function sessionWrapShow(original){return function(){original();sessionSetChecked(false);sessionShow();};}
function sessionWrapGrade(original,judge){return function(){
    if(!learningSession || quiz.style.display==='none' || learningSession.records.get(current)?.graded)return;
    original();sessionSetChecked(true);sessionRemember(true,judge());
    submitBtn.textContent='채점 완료';
};}
showQuestion=sessionWrapShow(showQuestion);
showElementQuestion=sessionWrapShow(showElementQuestion);
showRecallQuestion=sessionWrapShow(showRecallQuestion);
startStudyQuiz=sessionWrapStart(startStudyQuiz);
startElementQuiz=sessionWrapStart(startElementQuiz);
startRecallQuiz=sessionWrapStart(startRecallQuiz);
checkAnswer=sessionWrapGrade(checkAnswer,()=>normalize(answer.value)===normalize(current.text));
checkElementAnswer=sessionWrapGrade(checkElementAnswer,()=>[
    [knowledgeAnswer,current.knowledge],[skillAnswer,current.skill],[attitudeAnswer,current.attitude]
].every(([field,items])=>checkList(field.value,items).correct===items.length));
checkRecallAnswer=sessionWrapGrade(checkRecallAnswer,()=>{
    const grade=gradeRecall(current.items,splitRecallInput(answer.value,appMode==='core'));
    return grade.rows.every(row=>row.ok) && grade.extras.every(item=>item.duplicate);
});
nextQuestion=sessionNext;nextElementQuestion=sessionNext;nextRecallQuestion=sessionNext;
prevQuestion=sessionPrevious;prevElementQuestion=sessionPrevious;
submitOrNext=function(){
    if(!learningSession || quiz.style.display==='none')return;
    if(answered)sessionNext();else checkElementAnswer();
};
for(const field of [answer,knowledgeAnswer,skillAnswer,attitudeAnswer]){
    field.addEventListener('input',()=>{
        if(!learningSession || quiz.style.display==='none')return;
        const record=learningSession.records.get(current);
        if(record?.graded){
            record.draft=sessionFields().map(field=>field.value);
            sessionSetChecked(true);
            return;
        }
        sessionSetChecked(false);submitBtn.textContent='채점';
        sessionRemember(false,false);
    });
}
const sessionGoHome=goHome;
goHome=function(){sessionSummary.style.display='none';learningSession=null;prevBtn.disabled=false;sessionGoHome();};
