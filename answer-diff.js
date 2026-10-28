// 양쪽 답안을 한 번에 정렬해 대치·누락·추가 위치를 일관되게 표시한다.
function compareAnswerDifference(userText,correctText){
    const ignored=/[\s·⋅ㆍ,，.。!?！？:;；“”"'‘’()\[\]{}]/;
    const chars=text=>[...text].filter(c=>!ignored.test(c));
    const user=chars(userText),correct=chars(correctText);
    const costs=Array.from({length:correct.length+1},()=>Array(user.length+1).fill(0));
    for(let i=0;i<=correct.length;i++)costs[i][0]=i;
    for(let j=0;j<=user.length;j++)costs[0][j]=j;
    for(let i=1;i<=correct.length;i++)for(let j=1;j<=user.length;j++){
        costs[i][j]=Math.min(costs[i-1][j-1]+(correct[i-1]===user[j-1]?0:1),costs[i-1][j]+1,costs[i][j-1]+1);
    }
    const wrongCorrect=new Set(),wrongUser=new Set();
    let i=correct.length,j=user.length;
    while(i||j){
        if(i&&j&&correct[i-1]===user[j-1]&&costs[i][j]===costs[i-1][j-1]){i--;j--;}
        else if(i&&j&&costs[i][j]===costs[i-1][j-1]+1){wrongCorrect.add(--i);wrongUser.add(--j);}
        else if(i&&costs[i][j]===costs[i-1][j]+1){wrongCorrect.add(--i);}
        else{wrongUser.add(--j);}
    }
    function render(text,wrong){
        let position=0,html='',active=false;
        for(const char of text){
            if(ignored.test(char)){
                if(active){html+='</span>';active=false;}
                html+=escapeHtml(char);continue;
            }
            const bad=wrong.has(position++);
            if(bad&&!active){html+='<span class="wrongChar">';active=true;}
            if(!bad&&active){html+='</span>';active=false;}
            html+=escapeHtml(char);
        }
        return html+(active?'</span>':'');
    }
    return {user:render(userText,wrongUser),correct:render(correctText,wrongCorrect)};
}
makeDifferenceMarkup=function(userText,correctText){return compareAnswerDifference(userText,correctText).correct;};
function preciseComparisonMarkup(userText,correctText){
    const compared=compareAnswerDifference(userText,correctText);
    return `<div class="preciseComparison"><div><span class="comparisonLabel">내 답안</span><p>${compared.user||'<span class="emptyAnswer">입력 없음</span>'}</p></div><div><span class="comparisonLabel">정답</span><p>${compared.correct}</p></div></div>`;
}
// 유사 항목은 가장 가까운 쌍부터 연결한다. 이것은 표시용이며 정오 판정을 바꾸지 않는다.
function pairSimilarAnswers(correctItems,entries){
    const pairs=[];
    correctItems.forEach((correct,i)=>entries.forEach((user,j)=>{
        const score=recallSimilarity(correct,user);
        if(score>=.5)pairs.push({i,j,score});
    }));
    pairs.sort((a,b)=>b.score-a.score||a.i-b.i||a.j-b.j);
    const assigned=new Map(),used=new Set();
    for(const pair of pairs)if(!assigned.has(pair.i)&&!used.has(pair.j)){assigned.set(pair.i,pair.j);used.add(pair.j);}
    return {
        rows:correctItems.map((correct,i)=>({correct,user:assigned.has(i)?entries[assigned.get(i)]:''})),
        extras:entries.filter((_,i)=>!used.has(i))
    };
}
