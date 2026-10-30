// 표현만 정리한다. 문제 선택, 정오 판정, 학습 레벨과 재도전은 기존 로직을 사용한다.
const learningHeader=document.createElement('div');
learningHeader.className='learningHeader';
quiz.insertBefore(learningHeader,quiz.firstChild);
learningHeader.append(school,area,code,progress);
const answerLabel=document.createElement('label');
answerLabel.htmlFor='answer';answerLabel.className='answerLabel';answerLabel.textContent='답안';
quiz.insertBefore(answerLabel,answer);
const answerHint=document.createElement('p');answerHint.className='answerHint';
answer.after(answerHint);
const referenceToggle=document.createElement('details');
referenceToggle.className='referenceToggle';
const referenceTitle=document.createElement('summary');referenceTitle.textContent='참고 내용';
question.before(referenceToggle);referenceToggle.append(referenceTitle,question);
// 피드백은 입력창 바로 뒤, 이동 버튼 앞에 배치한다.
quiz.insertBefore(result,quiz.querySelector('.buttons'));
result.setAttribute('role','region');result.setAttribute('aria-label','채점 결과');
result.tabIndex=-1;
const gradingState=document.createElement('span');gradingState.className='gradingState';
gradingState.textContent='✓ 채점 완료';
quiz.querySelector('.buttons').insertBefore(gradingState,submitBtn);
function syncStudyAccent(){
    document.getElementById('appContent').dataset.homeMode=document.querySelector('input[name="appMode"]:checked').value;
}
document.querySelectorAll('input[name="appMode"]').forEach(radio=>radio.addEventListener('change',syncStudyAccent));
syncStudyAccent();

function learningAutoSize(field){
    if(field.style.display==='none')return;
    field.style.height='auto';
    const single=appMode==='study'||appMode==='core';
    const minimum=single?88:116;
    field.style.height=Math.max(minimum,field.scrollHeight+4)+'px';
}
function learningButtons(graded){
    quiz.classList.toggle('isGraded',graded);
    submitBtn.textContent=graded?'채점 완료':'채점';
    submitBtn.disabled=graded;
    nextBtn.classList.toggle('primaryAction',graded);
    submitBtn.classList.toggle('primaryAction',!graded);
    nextBtn.textContent=currentIndex===questions.length-1?'결과 보기':'다음 문제';
}
function learningMode(){return appMode==='element'?elementStudyMode:studyMode;}
function learningHasReference(){
    return question.style.display!=='none' && !(appMode==='element' && elementSourceMode==='area' && elementStudyMode==='exam');
}
function learningUpdate(){
    if(!learningSession)return;
    document.getElementById('appContent').classList.add('isStudying');
    quiz.dataset.mode=appMode;
    answerLabel.style.display=answerHint.style.display=appMode==='element'?'none':'block';
    if(appMode==='methods')answerHint.textContent='Enter: 항목 구분 · Ctrl+Enter: 채점 / 다음 문제 · 쉼표도 사용 가능';
    else if(appMode==='music')answerHint.textContent='Enter: 항목 구분 · Ctrl+Enter: 채점 / 다음 문제 · 순서 자유 · 쉼표도 사용 가능';
    else answerHint.textContent='Enter: 채점 / 다음 문제';
    if(appMode!=='element')answer.placeholder=['study','core'].includes(appMode)?'답안을 입력하세요.':'한 항목씩 줄을 나누어 입력하세요.';
    if(appMode==='element'){
        for(const field of [knowledgeAnswer,skillAnswer,attitudeAnswer])field.placeholder='Enter: 항목 구분 · Ctrl+Enter: 채점 / 다음 문제';
    }
    const hasReference=learningHasReference();
    referenceToggle.style.display=hasReference?'block':'none';
    referenceToggle.open=hasReference;
    toggleBtn.style.display='none';
    const record=learningSession.records.get(current);
    learningButtons(Boolean(record?.graded));
    result.style.color='';
    if(record?.feedback)result.className=record.feedbackClass || `learningFeedback ${record.correct?'feedbackSuccess':'feedbackError'}`;
    result.hidden=!record?.feedback;
    for(const field of sessionFields())learningAutoSize(field);
    focusLearningAnswer();
}
function focusLearningAnswer(){
    if(!learningSession||quiz.style.display==='none')return;
    const field=sessionFields().find(input=>input.getClientRects().length && !input.disabled);
    if(!field)return;
    field.focus({preventScroll:true});
    field.setSelectionRange(field.value.length,field.value.length);
    const bounds=field.getBoundingClientRect();
    if(bounds.top<0||bounds.top>innerHeight-80)field.scrollIntoView({block:'center',behavior:'instant'});
}
function learningDetails(title,body){return `<details class="feedbackDetails"><summary>${title}</summary>${body}</details>`;}
function learningItems(items,kind){return `<ul class="feedbackItems ${kind}">${items.map(s=>`<li>${escapeHtml(s)}</li>`).join('')}</ul>`;}
function learningFeedback(){
    const success=learningSession.records.get(current).correct;
    let body='',count='';
    if(appMode==='study'||appMode==='core'){
        const correct=appMode==='study'?current.text:current.items[0];
        if(!success){
            body=preciseComparisonMarkup(answer.value,correct)+'<details class="comparisonHelp"><summary>빨간 표시 안내</summary><p>빠진 글자는 정답에, 추가한 글자는 내 답안에, 바뀐 글자는 양쪽에 표시합니다.</p></details>';
        }else body=learningDetails('정답 확인',`<p>${escapeHtml(correct)}</p>`);
    }else if(appMode==='element'){
        let total=0,matched=0;
        const missing=[],right=[];
        for(const [title,field,items] of [['지식·이해',knowledgeAnswer,current.knowledge],['과정·기능',skillAnswer,current.skill],['가치·태도',attitudeAnswer,current.attitude]]){
            if(!items.length)continue;
            const grade=checkList(field.value,items);total+=grade.total;matched+=grade.correct;
            if(grade.wrong.length){
                const candidates=field.value.split(/[\n;；]+/).flatMap(s=>s.includes('(')?[s]:s.split(/[,，]/)).map(s=>s.trim()).filter(s=>s && !items.some(item=>normalizeElementAnswer(item)===normalizeElementAnswer(s)));
                const paired=pairSimilarAnswers(grade.wrong,candidates);
                const similar=paired.rows.filter(row=>row.user),absent=paired.rows.filter(row=>!row.user);
                if(similar.length)missing.push(`<section><h4>${title} · 비슷한 입력 비교</h4>${similar.map(row=>preciseComparisonMarkup(row.user,row.correct)).join('')}</section>`);
                if(absent.length)missing.push(`<section><h4>${title} · 누락 ${absent.length}</h4>${learningItems(absent.map(row=>row.correct),'missingItems')}</section>`);
            }
            right.push(...items.filter(s=>!grade.wrong.includes(s)).map(s=>`${title} · ${s}`));
        }
        count=`${matched} / ${total}개`;
        body=missing.join('');
        if(right.length)body+=learningDetails(`맞힌 항목 ${right.length}개`,learningItems(right,'correctItems'));
        body+=learningDetails('전체 정답',learningItems([...current.knowledge,...current.skill,...current.attitude],''));
    }else{
        const grade=gradeRecall(current.items,splitRecallInput(answer.value,false));
        count=`${grade.rows.filter(r=>r.ok).length} / ${grade.rows.length}개`;
        const paired=pairSimilarAnswers(grade.rows.filter(r=>!r.ok).map(r=>r.correct),[...grade.rows.filter(r=>!r.ok&&r.user).map(r=>r.user),...grade.extras.filter(e=>!e.duplicate).map(e=>e.text)]);
        const missing=paired.rows.filter(r=>!r.user);
        const wrong=paired.rows.filter(r=>r.user);
        const right=grade.rows.filter(r=>r.ok);
        if(wrong.length)body+=`<section><h4>잘못 입력한 항목 ${wrong.length}개</h4>${wrong.map(r=>preciseComparisonMarkup(r.user,r.correct)).join('')}</section>`;
        if(missing.length)body+=`<section><h4>누락 ${missing.length}개</h4>${learningItems(missing.map(r=>r.correct),'missingItems')}</section>`;
        const extras=[...grade.extras.filter(e=>e.duplicate),...paired.extras.map(text=>({text,duplicate:false}))];
        if(extras.length)body+=`<section><h4>중복·추가 입력</h4>${learningItems(extras.map(e=>`${e.duplicate?'중복 · 한 번만 인정':'목록 밖 입력'}: ${e.text}`),'missingItems')}</section>`;
        if(right.length&&!success)body+=learningDetails(`맞힌 항목 ${right.length}개`,learningItems(right.map(r=>r.correct),'correctItems'));
        body+=learningDetails('전체 정답',learningItems(current.guideItems||current.items,''));
    }
    const level=learningMode()==='blank'?`<span class="levelBadge">Lv.${getLevel(current.id).level}</span>`:'';
    result.className=`learningFeedback ${success?'feedbackSuccess':'feedbackError'}`;
    result.innerHTML=`<div class="feedbackHeading" role="status"><strong>${success?'✓ 정답':'다시 확인'}</strong><span>${count}</span>${level}</div>${body}`;
    result.style.color='';result.hidden=false;
}
function learningWrapShow(original){return function(){original();learningUpdate();};}
showQuestion=learningWrapShow(showQuestion);
showElementQuestion=learningWrapShow(showElementQuestion);
showRecallQuestion=learningWrapShow(showRecallQuestion);
function learningWrapStart(original){return function(){original();learningUpdate();};}
startStudyQuiz=learningWrapStart(startStudyQuiz);
startElementQuiz=learningWrapStart(startElementQuiz);
startRecallQuiz=learningWrapStart(startRecallQuiz);
function learningWrapGrade(original){return function(){
    if(!learningSession||quiz.style.display==='none'||learningSession.records.get(current)?.graded)return;
    const reference=question.innerHTML,referenceDisplay=question.style.display;
    original();
    if(!learningSession.records.get(current)?.graded)return;
    question.innerHTML=reference;question.style.display=referenceDisplay;
    learningFeedback();learningButtons(true);
    const fixedNotice=document.createElement('p');fixedNotice.className='feedbackLabel firstGradeNotice';
    fixedNotice.textContent='최초 결과 유지 · 오답은 마지막에 재인출';
    result.append(fixedNotice);
    referenceToggle.style.display=learningHasReference()?'block':'none';
    sessionRemember(true,learningSession.records.get(current).correct);
    const bounds=result.getBoundingClientRect();
    if(bounds.top>innerHeight-100)result.scrollIntoView({block:'start',behavior:'instant'});
};}
checkAnswer=learningWrapGrade(checkAnswer);
checkElementAnswer=learningWrapGrade(checkElementAnswer);
checkRecallAnswer=learningWrapGrade(checkRecallAnswer);
for(const field of [answer,knowledgeAnswer,skillAnswer,attitudeAnswer]){
    field.addEventListener('input',()=>{
        if(!learningSession||quiz.style.display==='none')return;
        learningAutoSize(field);
        const record=learningSession.records.get(current);
        if(record?.graded){
            learningButtons(true);result.hidden=false;
            return;
        }
        learningButtons(false);result.hidden=true;
    });
}
const learningFinish=sessionFinish;
sessionFinish=function(){
    learningFinish();
    document.getElementById('appContent').classList.remove('isStudying');
    const stats=document.createElement('div');stats.className='summaryStats';
    const counts=[['정답',questions.filter(q=>learningSession.records.get(q)?.graded&&learningSession.records.get(q).correct).length,'correct'],['오답',questions.filter(q=>learningSession.records.get(q)?.graded&&!learningSession.records.get(q).correct).length,'wrong'],['미채점',questions.filter(q=>!learningSession.records.get(q)?.graded).length,'pending']];
    for(const [label,count,kind] of counts){const stat=document.createElement('div');stat.className=`summaryStat ${kind}`;stat.innerHTML=`<strong>${count}</strong><span>${label}</span>`;stats.append(stat);}
    sessionSummary.querySelector('p').after(stats);
    sessionSummary.querySelector('p').textContent=`총 ${questions.length}문제`;
    for(const item of sessionSummary.querySelectorAll('li')){
        if(item.textContent.startsWith('미채점'))item.className='pendingResult';
    }
    const actions=document.createElement('div');actions.className='summaryActions';
    actions.append(...sessionSummary.querySelectorAll('button'));sessionSummary.append(actions);
    actions.firstChild.classList.add('primaryAction');
    sessionSummary.scrollIntoView({block:'start',behavior:'instant'});
    if(appMode==='element'){
        const retry=document.getElementById('retryWrongBtn');
        if(retry&&!retry.disabled)retry.focus({preventScroll:true});
        else{sessionSummary.tabIndex=-1;sessionSummary.focus({preventScroll:true});}
    }
};
const learningHome=goHome;
goHome=function(){document.getElementById('appContent').classList.remove('isStudying');learningHome();};

// 내용요소 결과 화면의 기본 Enter 동작은 기존 오답·미채점 재도전이다.
document.addEventListener('keydown',event=>{
    if(event.defaultPrevented)return;
    if(appMode!=='element'||!learningSession||sessionSummary.style.display==='none')return;
    if(event.key!=='Enter'||event.isComposing||event.keyCode===229||event.altKey)return;
    const retry=document.getElementById('retryWrongBtn');
    if(!retry||retry.disabled)return;
    const button=event.target.closest?.('button');
    if(button&&button!==retry)return;
    event.preventDefault();
    if(event.repeat)return;
    retry.click();
});
