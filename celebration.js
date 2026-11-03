// 한 회차의 모든 문제를 맞혔을 때만 실행하는 무음 색종이 효과.
const celebratedRounds=new WeakSet();
let stopSuccessConfetti=()=>{};
function launchSuccessConfetti(){
    stopSuccessConfetti();
    if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
    const canvas=document.createElement('canvas');
    canvas.className='successConfetti';canvas.setAttribute('aria-hidden','true');
    Object.assign(canvas.style,{position:'fixed',inset:'0',width:'100%',height:'100%',pointerEvents:'none',zIndex:'1000'});
    document.body.append(canvas);
    const context=canvas.getContext('2d');
    if(!context){canvas.remove();return;}
    let width,height,frame,stopped=false;
    function resize(){
        width=innerWidth;height=innerHeight;
        const ratio=Math.min(devicePixelRatio||1,2);
        canvas.width=Math.round(width*ratio);canvas.height=Math.round(height*ratio);
        context.setTransform(ratio,0,0,ratio,0,0);
    }
    resize();addEventListener('resize',resize);
    const colors=['#4c6ef5','#16a085','#f4bf50','#ec6b8c','#9b7ede','#56b9cf'];
    const scale=Math.min(1,Math.max(.55,width/1100));
    const particles=Array.from({length:180},(_,i)=>{
        const left=i%2===0;
        return {x:left?-12:width+12,y:height*.72,vx:(left?1:-1)*(300+Math.random()*650)*scale,
            vy:-(540+Math.random()*470),rotation:Math.random()*Math.PI*2,spin:(Math.random()-.5)*13,
            w:5+Math.random()*5,h:4+Math.random()*8,color:colors[i%colors.length],round:i%4===0};
    });
    const began=performance.now();let previous=began;
    function stop(){
        if(stopped)return;stopped=true;cancelAnimationFrame(frame);
        removeEventListener('resize',resize);canvas.remove();
        if(stopSuccessConfetti===stop)stopSuccessConfetti=()=>{};
    }
    stopSuccessConfetti=stop;
    function tick(now){
        if(stopped)return;
        const elapsed=now-began,dt=Math.min((now-previous)/1000,.033);previous=now;
        if(elapsed>4500){stop();return;}
        context.clearRect(0,0,width,height);
        context.globalAlpha=Math.min(1,(4500-elapsed)/1100);
        for(const p of particles){
            p.x+=p.vx*dt;p.y+=p.vy*dt;p.vx*=Math.pow(.985,dt*60);p.vy+=660*dt;p.rotation+=p.spin*dt;
            if(p.y>height+30)continue;
            context.save();context.translate(p.x,p.y);context.rotate(p.rotation);context.fillStyle=p.color;
            const flutter=Math.max(.2,Math.abs(Math.cos(p.rotation)));
            if(p.round){context.beginPath();context.ellipse(0,0,p.w/2,p.h*flutter/2,0,0,Math.PI*2);context.fill();}
            else context.fillRect(-p.w/2,-p.h*flutter/2,p.w,p.h*flutter);
            context.restore();
        }
        frame=requestAnimationFrame(tick);
    }
    frame=requestAnimationFrame(tick);
}
const celebrationFinish=sessionFinish;
sessionFinish=function(){
    celebrationFinish();
    if(!learningSession||!questions.length||celebratedRounds.has(learningSession.records))return;
    const allCorrect=questions.every(q=>{
        const record=learningSession.records.get(q);
        return record?.graded===true && record.correct===true;
    });
    if(!allCorrect)return;
    celebratedRounds.add(learningSession.records);
    launchSuccessConfetti();
};
const celebrationRestart=sessionRestart;
sessionRestart=function(all){stopSuccessConfetti();return celebrationRestart(all);};
const celebrationHome=goHome;
goHome=function(){stopSuccessConfetti();return celebrationHome();};
document.addEventListener('visibilitychange',()=>{if(document.hidden)stopSuccessConfetti();});
