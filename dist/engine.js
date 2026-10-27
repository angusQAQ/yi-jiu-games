import {FIRSTS,SUSHI,LEVELS,RULES,assess,sentence,answerOptions,TRAIN_LEVELS,TRAIN_TOKENS} from './data.js?v=20261027v17';
// Animation events only: there is no game time limit or countdown.
export class AnimationQueue{
 constructor(){this.position=0;this.paused=false;this.jobs=[];this.serial=0;}
 after(delay,fn){const token=++this.serial;this.jobs.push({at:this.position+delay,fn,token});return token;}
 tick(delta){if(this.paused)return;this.position+=Math.max(0,delta);const due=this.jobs.filter(j=>j.at<=this.position);this.jobs=this.jobs.filter(j=>j.at>this.position);for(const j of due.sort((a,b)=>a.at-b.at||a.token-b.token))j.fn();}
 clear(){this.jobs=[];}
}
export function newGame(type){return {type,paused:false,queue:new AnimationQueue(),round:0,money:0,paid:new Set(),locked:false,selected:null,phase:type==='train'?'assembling':'ready',players:[newPlayer(),newPlayer()],stars:new Set(),trainSlots:type==='train'?Array(TRAIN_LEVELS[0].tokens.length).fill(null):[],trainFeedback:null,trainSelected:null};}
export function newPlayer(){return {first:null,result:null,stage:'first',done:new Set(),records:[],score:0,streak:0,fish:0,big:0,locked:false,feedback:null};}
export function payOrder(game,id){if(game.paid.has(id))return false;game.paid.add(id);game.money=game.paid.size*RULES.orderPrice;return true;}
export function remainingFirsts(player){return FIRSTS.filter(id=>!player.done.has(id));}
export function chooseFirst(player,first){if(player.locked||player.done.has(first)||!FIRSTS.includes(first))return false;player.first=first;player.result=null;player.stage='result';player.feedback=null;return true;}
export function scoreResponse(player,result){
 if(player.locked||!player.first)return null;
 const verdict=assess(player.first,result);if(verdict.grade==='incomplete')return null;
 player.result=result;player.feedback=verdict;
 if(!verdict.correct){if(verdict.grade==='unsuitable')player.streak=0;return {...verdict,big:false,awarded:0};}
 if(player.done.has(player.first)){player.locked=true;return {...verdict,grade:'replay',awarded:0,big:false,replay:true};}
 player.done.add(player.first);player.records.push({first:player.first,result});player.streak++;player.fish++;
 const big=player.streak%RULES.streakForBig===0,awarded=big?RULES.bigPoints:RULES.smallPoints;
 player.big+=big?1:0;player.score+=awarded;player.locked=true;
 return {...verdict,big,awarded};
}
export function nextPlayerRound(player){player.first=null;player.result=null;player.stage='first';player.feedback=null;player.locked=remainingFirsts(player).length===0;}
export function chooseIsland(game,id){const q=LEVELS[game.round];if(!q||game.phase==='acting'||game.phase==='complete')return false;game.selected=id;game.phase=id===q.correct?'selected':'retry';return id===q.correct;}
export function performIsland(game){if(game.phase!=='selected')return false;game.phase='acting';return true;}
export function completeIsland(game){if(game.phase!=='acting')return false;game.stars.add(game.round);game.phase='complete';return true;}
export function nextIsland(game){if(game.phase!=='complete'||game.round>=LEVELS.length-1)return false;game.round++;game.selected=null;game.phase='ready';return true;}
export {SUSHI,LEVELS};

export function reviewEntries(game){
 if(game.type==='train')return TRAIN_LEVELS.map(q=>({text:q.sentence,audio:q.audio,pictures:[{train:q.firstTile},{train:q.resultTile}]}));
 if(game.type==='island')return LEVELS.map(q=>({text:q.sentence,audio:'v2-island-'+q.id,pictures:[{island:q.index},{island:q.index+10}]}));
 const pairs=game.type==='sushi'?SUSHI.map(q=>({first:q.first,result:q.answer})):FIRSTS.map(first=>({first,result:answerOptions(first)[0]}));
 return pairs.map(q=>({text:sentence(q.first,q.result),audio:'v2-s-'+q.first,pictures:[{word:q.first},{word:q.result}]}));
}

export function roundCount(type){return type==='sushi'?SUSHI.length:type==='fishing'?FIRSTS.length:type==='island'?LEVELS.length:type==='train'?TRAIN_LEVELS.length:0;}
export function jumpRound(current,index){
 if(!Number.isInteger(index)||index<0||index>=roundCount(current.type))return null;
 current.queue.clear();const next=newGame(current.type);next.round=index;next.money=current.money;next.paid=new Set(current.paid);next.stars=new Set(current.stars);
 if(current.type==='fishing')next.players=current.players.map(p=>({...newPlayer(),score:p.score,streak:p.streak,fish:p.fish,big:p.big,done:new Set(p.done),records:p.records.map(r=>({...r})),first:FIRSTS[index],stage:'result'}));
 if(current.type==='train')next.trainSlots=Array(TRAIN_LEVELS[index].tokens.length).fill(null);
 return next;
}
export function finishGame(game){game.queue.clear();game.queue.paused=false;game.paused=false;game.phase='finished';return game;}
export function placeTrainToken(game,id,target){
 const q=TRAIN_LEVELS[game.round];if(game.type!=='train'||game.paused||game.phase!=='assembling'||!q.tokens.includes(id)||!Number.isInteger(target)||target<0||target>=q.tokens.length)return false;
 const origin=game.trainSlots.indexOf(id),replaced=game.trainSlots[target];if(origin===target)return false;
 if(origin>=0)game.trainSlots[origin]=replaced;game.trainSlots[target]=id;game.trainFeedback=null;return true;
}
export function removeTrainToken(game,id){if(game.type!=='train'||game.paused||game.phase!=='assembling')return false;const i=game.trainSlots.indexOf(id);if(i<0)return false;game.trainSlots[i]=null;game.trainFeedback=null;return true;}
export function trainVerdict(game){const q=TRAIN_LEVELS[game.round],complete=game.trainSlots.length===q.tokens.length&&game.trainSlots.every(Boolean),wrong=game.trainSlots.map((id,i)=>id!==q.tokens[i]?i:-1).filter(i=>i>=0);return {complete,correct:complete&&wrong.length===0,wrong};}
export function departTrain(game){const v=trainVerdict(game);if(game.type!=='train'||game.paused||game.phase!=='assembling'||!v.correct)return false;game.phase='departing';game.stars.add(game.round);return true;}
