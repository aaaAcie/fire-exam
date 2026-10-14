(()=>{'use strict';
// 注意：纯前端账号密码只用于轻量访问提示，不提供真正的安全保护。
const CREDENTIALS={username:'admin',password:'123456'};
const STORAGE_KEY='fire-exam-progress-v1';const AUTH_KEY='fire-exam-auth-v1';
const QUESTIONS=window.EXAM_QUESTIONS||[];
const GROUPS=[{type:'单选题',title:'一、单选题',count:100},{type:'多选题',title:'二、多选题',count:40},{type:'判断题',title:'三、判断题',count:60}];
const $=id=>document.getElementById(id);
let answers={},submitted=false,currentId=1;
function show(page){for(const id of ['login-page','exam-page','result-page'])$(id).classList.toggle('hide',id!==page);window.scrollTo(0,0)}
function save(){try{localStorage.setItem(STORAGE_KEY,JSON.stringify({answers,submitted}))}catch(e){console.warn('保存失败',e)}}
function load(){try{const v=JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}');answers=v.answers&&typeof v.answers==='object'?v.answers:{};submitted=!!v.submitted}catch(e){answers={};submitted=false}}
function isAnswered(q){return Array.isArray(answers[q.id])&&answers[q.id].length>0}
function count(){return QUESTIONS.filter(isAnswered).length}
function groupQuestions(type){return QUESTIONS.filter(q=>q.type===type)}
function node(tag,cls,text){const el=document.createElement(tag);if(cls)el.className=cls;if(text!==undefined)el.textContent=text;return el}
function renderCards(){const root=$('answer-cards');root.replaceChildren();GROUPS.forEach(g=>{const section=node('section','card-section'),title=node('h3',null,`${g.title}（共${g.count}题）`),grid=node('div','card-grid');groupQuestions(g.type).forEach((q,i)=>{const b=node('button','number-button',String(i+1));b.type='button';b.title=`第 ${q.id} 题`;b.dataset.qid=q.id;b.setAttribute('aria-label',`${g.type}第${i+1}题`);b.addEventListener('click',()=>jump(q.id));grid.appendChild(b)});section.append(title,grid);root.appendChild(section)});updateProgress()}
function jump(id){const target=$('q-'+id);if(!target)return;currentId=id;target.scrollIntoView({behavior:'smooth',block:'start'});updateProgress()}
function renderExam(){const root=$('question-list');root.replaceChildren();GROUPS.forEach(g=>{const section=node('section','question-section'),title=node('h2',null,`${g.title}（共${g.count}题，每题 0.5 分）`);section.append(title);groupQuestions(g.type).forEach((q,i)=>{const wrap=node('article','question');wrap.id='q-'+q.id;const stem=node('div','stem');const idx=node('span','question-id',`${i+1}. `);stem.append(idx,document.createTextNode(q.stem));const options=node('div','options');q.options.forEach(opt=>{const label=node('label','option'),input=document.createElement('input');input.type=q.type==='多选题'?'checkbox':'radio';input.name='q-'+q.id;input.value=opt.key;input.checked=(answers[q.id]||[]).includes(opt.key);input.addEventListener('change',()=>{if(submitted)return;if(q.type==='多选题'){const a=new Set(answers[q.id]||[]);input.checked?a.add(opt.key):a.delete(opt.key);answers[q.id]=Array.from(a).sort()}else{answers[q.id]=[opt.key]}save();updateProgress()});label.append(input,document.createTextNode(`${opt.key}. ${opt.text}`));options.append(label)});wrap.append(stem,options);section.append(wrap)});root.append(section)})}
function updateProgress(){const n=count();$('header-progress').textContent=`已答 ${n} / ${QUESTIONS.length}`;$('profile-count').textContent=n;$('profile-remain').textContent=QUESTIONS.length-n;document.querySelectorAll('.number-button').forEach(b=>{const id=Number(b.dataset.qid),q=QUESTIONS.find(x=>x.id===id);b.classList.toggle('answered',isAnswered(q));b.classList.toggle('current',id===currentId)})}
function correct(q){const arr=answers[q.id]||[];return arr.slice().sort().join('')===q.answer.split('').sort().join('')}
function start(){load();renderCards();renderExam();if(submitted)renderResults(false);else show('exam-page')}
function openModal(){const n=QUESTIONS.length-count();$('modal-body').textContent=n?`你还有 ${n} 道题未作答。未答题均计 0 分，确认现在交卷吗？`:'所有题目均已作答。交卷后将显示分数和正确答案，确定交卷吗？';$('modal').classList.remove('hide')}
function closeModal(){$('modal').classList.add('hide')}
function submit(){closeModal();submitted=true;save();renderResults(false)}
function renderResults(wrongOnly){const total=QUESTIONS.filter(correct).length,score=(total*.5).toFixed(1),bad=QUESTIONS.length-total;$('score').replaceChildren(document.createTextNode(score),node('span',null,' / 100 分'));$('pass-label').textContent=Number(score)>=60?'考试合格':'考试未合格';$('pass-label').classList.toggle('fail',Number(score)<60);$('score-details').textContent=`答对 ${total} 题 · 答错或未答 ${bad} 题 · 已答 ${count()} 题 · 合格线 60 分`;
 const root=$('review-list');root.replaceChildren();const selected=QUESTIONS.filter(q=>!wrongOnly||!correct(q));if(!selected.length)root.append(node('div','panel review-empty','恭喜！没有错题。'));
 selected.forEach(q=>{const section=node('section','panel review-item'),headline=node('h3',null,`${q.id}. 【${q.type}】${q.stem}`),answer=answers[q.id]||[],mine=node('p',correct(q)?'right':'wrong',`你的答案：${answer.length?answer.join(''):'未作答'} ${correct(q)?'✓':'✗'}`),std=node('p','answer-highlight',`正确答案：${q.answer}`);section.append(headline,mine,std);q.options.forEach(opt=>section.append(node('p','muted',`${opt.key}. ${opt.text}`)));if(q.explanation)section.append(node('p','muted',`解析：${q.explanation}`));root.append(section)});
 $('review-all').classList.toggle('active',!wrongOnly);$('review-wrong').classList.toggle('active',wrongOnly);$('review-all').setAttribute('aria-pressed',String(!wrongOnly));$('review-wrong').setAttribute('aria-pressed',String(wrongOnly));show('result-page')}
function login(e){e.preventDefault();const user=$('username').value.trim(),pass=$('password').value;if(user===CREDENTIALS.username&&pass===CREDENTIALS.password){sessionStorage.setItem(AUTH_KEY,'1');$('login-error').textContent='';start()}else{$('login-error').textContent='账号或密码错误';$('password').value=''}}
function logout(){sessionStorage.removeItem(AUTH_KEY);closeModal();show('login-page')}
function retry(){if(!confirm('确定重新考试？将清空本次全部答题记录。'))return;answers={};submitted=false;save();start()}
function init(){if(QUESTIONS.length!==200){alert('题库加载失败：请确认 questions.js 与 index.html 位于同一目录。');return}
 $('login-form').addEventListener('submit',login);$('logout-btn').addEventListener('click',logout);$('result-logout').addEventListener('click',logout);$('submit-btn').addEventListener('click',openModal);$('submit-mobile').addEventListener('click',openModal);$('modal-cancel').addEventListener('click',closeModal);$('modal-confirm').addEventListener('click',submit);$('modal').addEventListener('click',e=>{if(e.target===$('modal'))closeModal()});$('review-all').addEventListener('click',()=>renderResults(false));$('review-wrong').addEventListener('click',()=>renderResults(true));$('retry-btn').addEventListener('click',retry);
 if(sessionStorage.getItem(AUTH_KEY)==='1')start();else show('login-page')}
 document.addEventListener('DOMContentLoaded',init);
})();
