const KEY="studentWalletExpensesV1", ALLOW="studentWalletAllowanceV1";
const allowanceDefault=15000;
const BUDGET_KEY="studentWalletCategoryBudgetsV1", DAILY_KEY="studentWalletDailyLimitV1", GOALS_KEY="studentWalletGoalsV1", THEME_KEY="studentWalletThemeV1";
let expenses=JSON.parse(localStorage.getItem(KEY)||"[]");
let allowance=Number(localStorage.getItem(ALLOW)||allowanceDefault);
let budgets=JSON.parse(localStorage.getItem(BUDGET_KEY)||"{}");
let dailyLimit=Number(localStorage.getItem(DAILY_KEY)||0);
let goals=JSON.parse(localStorage.getItem(GOALS_KEY)||"[]");
const labels={Food:"🍛 කෑම / Snacks",Transport:"🚌 ගමන් වියදම්",University:"📚 University",Phone:"📱 Phone / Data",Personal:"🎮 Personal",Other:"📦 වෙනත්"};
const cats=["Food","Transport","University","Phone","Personal","Other"];
const money=n=>"රු. "+Number(n).toLocaleString("en-LK");
const $=id=>document.getElementById(id);
const today=new Date(); $("date").value=localDate(today);
function localDate(d){const x=new Date(d.getTime()-d.getTimezoneOffset()*60000);return x.toISOString().slice(0,10)}
function monthKey(d){return d.slice(0,7)}
function currentMonth(){return localDate(new Date()).slice(0,7)}
function monthExpenses(){return expenses.filter(e=>monthKey(e.date)===currentMonth())}
function save(){localStorage.setItem(KEY,JSON.stringify(expenses));render()}
function toast(msg){$("toast").textContent=msg;$("toast").classList.add("show");setTimeout(()=>$("toast").classList.remove("show"),2200)}
function safe(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function render(){
 const rows=monthExpenses(),spent=rows.reduce((s,e)=>s+Number(e.amount),0),remaining=allowance-spent;
 $("monthLabel").textContent=new Date().toLocaleDateString("si-LK",{month:"long",year:"numeric"});
 $("allowance").textContent=money(allowance);$("spent").textContent=money(spent);$("remaining").textContent=money(remaining);
 $("remaining").style.color=remaining<0?"var(--danger)":"var(--blue)";
 const pct=Math.min(100,allowance?spent/allowance*100:0);$("progressBar").style.width=pct+"%";$("progressText").textContent=`මාසික allowance එකෙන් ${pct.toFixed(0)}%ක් වියදම් කරලා`;
 $("foodSpent").textContent=money(rows.filter(e=>e.category==="Food").reduce((s,e)=>s+Number(e.amount),0));
 const todayKey=localDate(new Date()),todayTotal=expenses.filter(e=>e.date===todayKey).reduce((s,e)=>s+Number(e.amount),0);
 $("todaySpent").textContent=money(todayTotal);$("dailyStatus").textContent=dailyLimit?`අද: ${money(todayTotal)} / ${money(dailyLimit)}${todayTotal>dailyLimit?" · සීමාව ඉක්මවා!":""}`:"දිනපතා සීමාවක් සකසා නැහැ.";
 $("count").textContent=rows.length;$("chartTotal").textContent=money(spent);
 const vals=cats.map(c=>rows.filter(e=>e.category===c).reduce((s,e)=>s+Number(e.amount),0));
 const colors=["#2563eb","#60a5fa","#7c3aed","#06b6d4","#f59e0b","#94a3b8"];
 let angle=0,stops=[];vals.forEach((v,i)=>{if(v>0){const next=angle+(spent?v/spent*100:0)*3.6;stops.push(`${colors[i]} ${angle}deg ${next}deg`);angle=next}});
 $("categoryChart").style.background=stops.length?`conic-gradient(${stops.join(",")})`:"conic-gradient(var(--line) 0 100%)";
 $("categoryChart").innerHTML=`<span>${spent?money(spent):"No expenses"}<br><small>මේ මාසය</small></span>`;
 $("categoryBreakdown").innerHTML=cats.map((c,i)=>{const n=vals[i],p=spent?n/spent*100:0,limit=Number(budgets[c]||0);return `<div class="break-row"><span>${labels[c]}${limit?` <small>· limit ${money(limit)}</small>`:""}</span><b>${money(n)}</b><div class="bar"><i style="width:${p}%;background:${colors[i]}"></i></div>${limit&&n>limit?`<small style="color:var(--danger)">Budget limit ඉක්මවා ඇත</small>`:""}</div>`}).join("");
 const sorted=[...rows].sort((a,b)=>b.date.localeCompare(a.date)||b.id-a.id);
 $("expenseList").innerHTML=sorted.length?sorted.map(e=>`<div class="expense"><div><b>${safe(e.note||labels[e.category])}</b><small>${labels[e.category]} · ${e.date}</small></div><div class="expense-right"><strong>${money(e.amount)}</strong><br><button class="delete" data-delete="${e.id}">Delete</button></div></div>`).join(""):'<p class="empty">තවම මේ මාසයේ වියදම් ඇතුළත් කරලා නැහැ.</p>';
 $("allowanceInput").value=allowance;$("dailyLimit").value=dailyLimit||"";
 renderWeekly();renderGoals();
}
function renderWeekly(){
 const now=new Date(),start=new Date(now);start.setDate(now.getDate()-6);
 const days=Array.from({length:7},(_,i)=>{const d=new Date(start);d.setDate(start.getDate()+i);const key=localDate(d);return {key,label:d.toLocaleDateString("en",{weekday:"short"}),value:expenses.filter(e=>e.date===key).reduce((s,e)=>s+Number(e.amount),0)}});
 const max=Math.max(1,...days.map(d=>d.value));
 $("weeklyChart").innerHTML=days.map(d=>`<div class="week-day" title="${d.key}: ${money(d.value)}"><i style="height:${Math.max(3,d.value/max*78)}px"></i><small>${d.label}</small></div>`).join("");
}
function renderGoals(){
 $("goalsList").innerHTML=goals.length?goals.map(g=>{const p=Math.min(100,Number(g.saved||0)/g.target*100);return `<div class="goal-item"><div class="goal-top"><span>${safe(g.name)}</span><span>${p.toFixed(0)}%</span></div><div class="goal-meta">${money(g.saved||0)} / ${money(g.target)}</div><div class="goal-progress"><i style="width:${p}%"></i></div><div class="goal-actions"><button class="secondary" data-add-goal="${g.id}">＋ Add savings</button><button class="remove-goal" data-remove-goal="${g.id}">Remove</button></div></div>`}).join(""):'<p class="empty">ඔයාගේ පළමු savings goal එක මෙතැනින් හදන්න.</p>';
}
function renderBudgetInputs(){$("budgetInputs").innerHTML=cats.map(c=>`<div class="budget-field"><label for="budget-${c}">${labels[c]}</label><input id="budget-${c}" type="number" min="0" value="${Number(budgets[c]||0)}" placeholder="0"></div>`).join("")}
$("expenseForm").addEventListener("submit",e=>{e.preventDefault();const amount=Number($("amount").value);if(!Number.isFinite(amount)||amount<=0)return;const category=$("category").value,date=$("date").value;expenses.push({id:Date.now(),amount,category,note:$("note").value.trim(),date});save();$("amount").value="";$("note").value="";$("date").value=localDate(new Date());const todaySum=expenses.filter(x=>x.date===localDate(new Date())).reduce((s,x)=>s+Number(x.amount),0);if(dailyLimit&&todaySum>dailyLimit)toast("අවධානයයි! අද daily limit එක ඉක්මවා ඇත.");else if(budgets[category]&&monthExpenses().filter(x=>x.category===category).reduce((s,x)=>s+Number(x.amount),0)>budgets[category])toast("අවධානයයි! මේ category budget එක ඉක්මවා ඇත.");else toast("වියදම සාර්ථකව save කළා! 💙")});
$("expenseList").addEventListener("click",e=>{const id=e.target.dataset.delete;if(!id)return;if(confirm("මේ වියදම delete කරන්නද?")){expenses=expenses.filter(x=>String(x.id)!==id);save();toast("වියදම delete කළා.")}});
$("saveAllowance").addEventListener("click",()=>{const n=Number($("allowanceInput").value);if(n>0){allowance=n;localStorage.setItem(ALLOW,String(n));render();toast("Allowance එක update කළා.")}});
$("saveDailyLimit").addEventListener("click",()=>{const n=Number($("dailyLimit").value);if(n>=0){dailyLimit=n;localStorage.setItem(DAILY_KEY,String(n));render();toast("Daily limit එක save කළා.")}});
$("saveBudgets").addEventListener("click",()=>{cats.forEach(c=>budgets[c]=Math.max(0,Number($("budget-"+c).value)||0));localStorage.setItem(BUDGET_KEY,JSON.stringify(budgets));render();renderBudgetInputs();toast("Category budgets save කළා.")});
$("goalForm").addEventListener("submit",e=>{e.preventDefault();const name=$("goalName").value.trim(),target=Number($("goalTarget").value);if(!name||target<=0)return;goals.push({id:Date.now(),name,target,saved:0});localStorage.setItem(GOALS_KEY,JSON.stringify(goals));$("goalName").value="";$("goalTarget").value="";renderGoals();toast("Savings goal එක එකතු කළා!")});
$("goalsList").addEventListener("click",e=>{const add=e.target.dataset.addGoal,remove=e.target.dataset.removeGoal;if(add){const g=goals.find(x=>String(x.id)===add);if(!g)return;const n=Number(prompt("කොපමණ මුදලක් ඉතිරි කළාද? (රු.)"));if(n>0){g.saved=Number(g.saved||0)+n;localStorage.setItem(GOALS_KEY,JSON.stringify(goals));renderGoals();toast("Savings update කළා!")}}if(remove&&confirm("මේ goal එක ඉවත් කරන්නද?")){goals=goals.filter(x=>String(x.id)!==remove);localStorage.setItem(GOALS_KEY,JSON.stringify(goals));renderGoals()}});
$("themeToggle").addEventListener("click",()=>{document.body.classList.toggle("dark");const dark=document.body.classList.contains("dark");localStorage.setItem(THEME_KEY,dark?"dark":"light");$("themeToggle").textContent=dark?"☀":"☾"});
if(localStorage.getItem(THEME_KEY)==="dark"){document.body.classList.add("dark");$("themeToggle").textContent="☀"}
$("exportBtn").addEventListener("click",()=>{const rows=monthExpenses();if(!rows.length){toast("Export කරන්න වියදම් නැහැ.");return}const csv=[["Date","Category","Note","Amount"],...rows.map(e=>[e.date,labels[e.category],e.note,e.amount])].map(r=>r.map(v=>'"'+String(v??"").replace(/"/g,'""')+'"').join(",")).join("\n");download(csv,"student-wallet-"+currentMonth()+".csv","text/csv;charset=utf-8;")});
$("backupBtn").addEventListener("click",()=>download(JSON.stringify({allowance,expenses,budgets,dailyLimit,goals,theme:localStorage.getItem(THEME_KEY)||"light"},null,2),"student-wallet-backup.json","application/json"));
function download(content,name,type){const blob=new Blob(["\ufeff",content],{type}),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download=name;a.click();URL.revokeObjectURL(url);toast("Download එක සූදානම්!")}
function escapeHtml(s){return safe(s)}
renderBudgetInputs();render();
if("serviceWorker" in navigator && location.protocol!=="file:"){window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(()=>{}))}
