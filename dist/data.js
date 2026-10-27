import {TRAIN_LEVELS,TRAIN_TOKENS} from './train-data.js?v=20261027v17';
export {TRAIN_LEVELS,TRAIN_TOKENS};
import {COURSE} from './curriculum.js?v=20261027v17';
import {DISTINCT} from './distinct-curriculum.js?v=20261027v17';
export const TITLES={sushi:'壽司小店',fishing:'釣魚對戰',island:'小島生活任務',train:'小島句子列車'};
const tiles={arriveHome:0,school:1,hungry:2,thirsty:3,wake:4,bell:5,park:6,dirty:7,hands:8,home:9,rice:10,water:11,teeth:12,classroom:13,play:14,skip:15,homework:16,clothes:17};
const sushiWords=[...COURSE.firsts,...COURSE.results].map(w=>[w.id,{id:w.id,text:w.text,jp:w.jyutping,tile:tiles[w.id],atlas:'life'}]);
const fishWords=[...DISTINCT.fishFirsts,...DISTINCT.fishResults].map((w,i)=>[w.id,{id:w.id,text:w.text,jp:w.jyutping,tile:i,atlas:['traffic','stop'].includes(w.id)?'traffic':'fish'}]);
export const WORDS=Object.fromEntries([...sushiWords,...fishWords]);
export const FIRSTS=DISTINCT.fishFirsts.map(w=>w.id),RESULTS=DISTINCT.fishResults.map(w=>w.id);
const pairs=new Map(COURSE.matrix.map(p=>[p.first+':'+p.result,p]));
for(const q of DISTINCT.fishPairs)for(const result of RESULTS)pairs.set(q.first+':'+result,{grade:result===q.answer?'correct':'unsuitable',student_feedback:result===q.answer?q.feedback:'再試一試。'});
export function assess(first,result){const p=pairs.get(first+':'+result);if(!p)return {grade:'incomplete',correct:false,reason:'先把句子完成。'};return {grade:p.grade,correct:p.grade==='correct',reason:p.student_feedback};}
export function sentence(first,result){return `我一${WORDS[first].text}，就${WORDS[result].text}。`;}
export function answerOptions(first){return [...(DISTINCT.fishPairs.find(q=>q.first===first)?.options||[])];}
const sushiChoices={arriveHome:['hands','classroom','school'],school:['home','classroom','teeth'],hungry:['rice','classroom','play'],thirsty:['water','classroom','teeth'],wake:['teeth','classroom','home'],bell:['classroom','home','play'],park:['play','classroom','teeth'],dirty:['hands','rice','classroom']};
export const SUSHI=COURSE.firsts.map((w,index)=>({id:'order-'+index,first:w.id,options:sushiChoices[w.id],answer:sushiChoices[w.id][0]}));
const kinds={light:'lamp',zip:'zip',fan:'fan',stamp:'stamp',ball:'ball',windmill:'wind',doorbell:'doorbell',tap:'tap',door:'door',boat:'boat'};
export const LEVELS=COURSE.third_game_levels.map((q,i)=>({id:q.id,index:i,category:q.category,kind:kinds[q.id],sentence:q.sentence,before:q.sentence.slice(0,q.sentence.indexOf('就')+1),action:q.action,correct:q.id+'-answer',actionId:q.action_vocabulary.id,actionTile:i,answer:{id:q.id+'-answer',text:q.result,jp:q.result_vocabulary.jyutping,tile:i+10}}));
const other={light:['ball','windmill'],zip:['light','stamp'],fan:['zip','ball'],stamp:['light','zip'],ball:['light','windmill'],windmill:['light','ball'],doorbell:['tap','light'],tap:['doorbell','door'],door:['boat','tap'],boat:['door','windmill']};
for(const q of LEVELS)q.options=[q.answer,...other[q.id].map(id=>({...LEVELS.find(v=>v.id===id).answer,id:q.id+'-distractor-'+id}))];
export const FIRST_SCENE={};
export const RULES={orderPrice:10,smallPoints:1,bigPoints:5,streakForBig:5,fishRounds:FIRSTS.length};
