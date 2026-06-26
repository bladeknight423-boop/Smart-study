import { useState, useEffect, useRef, useCallback } from "react";

const SUBJECTS = ["Mathematics","Physics","Chemistry","Biology","English","History","Computer Science","Economics"];
const MOODS = ["😴 Low Energy","😐 Normal","🔥 Focused","⚡ Peak"];

function fmtTime(s){const m=Math.floor(s/60),sec=s%60;return`${String(m).padStart(2,"0")}:${String(sec).padStart(2,"0")}`}
function fmtDate(d){return new Date(d).toLocaleDateString("en-IN",{day:"2-digit",month:"short"})}
function uid(){return Math.random().toString(36).slice(2,9)}
function daysUntil(d){return Math.ceil((new Date(d)-new Date())/(1000*60*60*24))}

// ── KEY CHANGE: All AI calls go through our safe Netlify function ──
async function callClaude({ system = "", messages, max_tokens = 1500 }) {
  const res = await fetch("/.netlify/functions/claude", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ system, messages, max_tokens }),
  });
  const data = await res.json();
  return data.content?.[0]?.text || "";
}

const GlobalStyle = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Space+Grotesk:wght@400;500;600;700&display=swap');
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    :root{
      --bg:#0b0f14;--bg2:#111820;--bg3:#162030;
      --glass:rgba(255,255,255,0.04);--glass2:rgba(255,255,255,0.07);
      --border:rgba(255,255,255,0.08);--border2:rgba(255,255,255,0.12);
      --teal:#00d4aa;--teal2:#00b896;--purple:#7c5cfc;--purple2:#9b7dff;
      --yellow:#f5d76e;--red:#ff5e7d;--text:#e8edf5;--text2:#8b99b0;--text3:#4a5568;
      --r:16px;--r2:12px;--r3:8px;
    }
    html,body,#root{height:100%;overflow:hidden}
    body{font-family:'Inter',sans-serif;background:var(--bg);color:var(--text);-webkit-font-smoothing:antialiased}
    ::-webkit-scrollbar{width:4px;height:4px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:var(--border2);border-radius:99px}
    ::selection{background:rgba(0,212,170,0.25)}
    button{font-family:'Inter',sans-serif;cursor:pointer;border:none;outline:none}
    input,textarea,select{font-family:'Inter',sans-serif;outline:none;border:none}
    .glass{background:var(--glass);border:1px solid var(--border);border-radius:var(--r);backdrop-filter:blur(20px)}
    .glass2{background:var(--glass2);border:1px solid var(--border2);border-radius:var(--r)}
    .teal{color:var(--teal)}.purple{color:var(--purple2)}.yellow{color:var(--yellow)}.red{color:var(--red)}.dim{color:var(--text2)}
    .label{font-size:11px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:var(--text2)}
    @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
    @keyframes fadeIn{from{opacity:0}to{opacity:1}}
    @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}
    @keyframes spin{to{transform:rotate(360deg)}}
    @keyframes scaleIn{from{opacity:0;transform:scale(0.92)}to{opacity:1;transform:scale(1)}}
    @keyframes ping{0%{transform:scale(1);opacity:1}75%,100%{transform:scale(1.8);opacity:0}}
    .anim-fade-up{animation:fadeUp 0.4s cubic-bezier(0.19,1,0.22,1) both}
    .anim-fade-in{animation:fadeIn 0.3s ease both}
    .anim-scale-in{animation:scaleIn 0.35s cubic-bezier(0.19,1,0.22,1) both}
    .delay-1{animation-delay:0.05s}.delay-2{animation-delay:0.1s}.delay-3{animation-delay:0.15s}.delay-4{animation-delay:0.2s}.delay-5{animation-delay:0.25s}
    .hover-lift{transition:transform 0.2s ease,box-shadow 0.2s ease}.hover-lift:hover{transform:translateY(-2px);box-shadow:0 8px 32px rgba(0,0,0,0.3)}
    .btn{display:inline-flex;align-items:center;gap:8px;padding:10px 20px;border-radius:var(--r3);font-size:14px;font-weight:500;transition:all 0.2s ease;cursor:pointer}
    .btn-teal{background:var(--teal);color:#0b0f14;font-weight:600}.btn-teal:hover{background:var(--teal2);transform:translateY(-1px)}
    .btn-purple{background:var(--purple);color:#fff}.btn-purple:hover{background:var(--purple2);transform:translateY(-1px)}
    .btn-ghost{background:var(--glass);border:1px solid var(--border);color:var(--text)}.btn-ghost:hover{background:var(--glass2);border-color:var(--border2)}
    .chip{display:inline-flex;align-items:center;gap:6px;padding:5px 12px;border-radius:99px;font-size:12px;font-weight:500;background:var(--glass);border:1px solid var(--border);cursor:pointer;transition:all 0.15s}
    .chip.active{background:rgba(0,212,170,0.15);border-color:var(--teal);color:var(--teal)}.chip:hover:not(.active){background:var(--glass2)}
    .input{width:100%;background:var(--glass);border:1px solid var(--border);border-radius:var(--r3);padding:10px 14px;color:var(--text);font-size:14px;transition:border-color 0.2s}
    .input:focus{border-color:var(--teal)}.input::placeholder{color:var(--text3)}
    textarea.input{resize:vertical;min-height:100px}select.input{appearance:none;cursor:pointer}
    .tag{display:inline-flex;align-items:center;padding:2px 10px;border-radius:99px;font-size:11px;font-weight:600}
    .tag-teal{background:rgba(0,212,170,0.15);color:var(--teal);border:1px solid rgba(0,212,170,0.3)}
    .tag-purple{background:rgba(124,92,252,0.15);color:var(--purple2);border:1px solid rgba(124,92,252,0.3)}
    .tag-yellow{background:rgba(245,215,110,0.15);color:var(--yellow);border:1px solid rgba(245,215,110,0.3)}
    .tag-red{background:rgba(255,94,125,0.15);color:var(--red);border:1px solid rgba(255,94,125,0.3)}
    .progress-bar{height:4px;background:var(--glass2);border-radius:99px;overflow:hidden}
    .progress-fill{height:100%;border-radius:99px;background:linear-gradient(90deg,var(--teal),var(--purple));transition:width 0.6s cubic-bezier(0.19,1,0.22,1)}
    .sidebar-icon{width:40px;height:40px;border-radius:10px;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all 0.2s;color:var(--text2);font-size:18px;position:relative}
    .sidebar-icon:hover{background:var(--glass2);color:var(--text)}.sidebar-icon.active{background:rgba(0,212,170,0.15);color:var(--teal)}
    .spinner{width:20px;height:20px;border:2px solid var(--border2);border-top-color:var(--teal);border-radius:50%;animation:spin 0.7s linear infinite;display:inline-block}
    .modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.7);backdrop-filter:blur(8px);z-index:100;display:flex;align-items:center;justify-content:center;animation:fadeIn 0.2s ease}
    .modal{background:#131b26;border:1px solid var(--border2);border-radius:20px;padding:28px;max-width:520px;width:90%;max-height:85vh;overflow-y:auto;animation:scaleIn 0.3s cubic-bezier(0.19,1,0.22,1)}
    .note-card{background:var(--glass);border:1px solid var(--border);border-radius:var(--r2);padding:16px;transition:all 0.2s;cursor:pointer}
    .note-card:hover{background:var(--glass2);border-color:var(--border2);transform:translateY(-2px);box-shadow:0 8px 24px rgba(0,0,0,0.2)}
    .timer-circle{transition:stroke-dashoffset 0.5s linear}
    .card-hover{transition:all 0.2s ease;cursor:pointer}.card-hover:hover{background:var(--glass2);border-color:var(--border2);transform:translateY(-1px)}
  `}</style>
);

export default function SmartStudy() {
  const [page, setPage] = useState("dashboard");
  const [notes, setNotes] = useState([
    {id:"n1",title:"Calculus Derivatives",subject:"Mathematics",content:"The derivative of f(x) measures the rate of change.\n• Power rule: d/dx[xⁿ] = nxⁿ⁻¹\n• Chain rule: d/dx[f(g(x))] = f'(g(x))·g'(x)\n• Product rule: d/dx[uv] = u'v + uv'\nApplications: finding maxima/minima, velocity from position.",tags:["calculus","derivatives"],date:"2025-06-20",color:"teal"},
    {id:"n2",title:"Newton's Laws of Motion",subject:"Physics",content:"1st Law: Object at rest stays at rest unless acted upon.\n2nd Law: F = ma\n3rd Law: Every action has equal and opposite reaction.\nKey concepts: inertia, momentum, equilibrium.",tags:["mechanics","newton"],date:"2025-06-22",color:"purple"},
    {id:"n3",title:"Photosynthesis Process",subject:"Biology",content:"6CO₂ + 6H₂O + light → C₆H₁₂O₆ + 6O₂\nTwo stages:\n• Light reactions (thylakoid): ATP + NADPH\n• Calvin cycle (stroma): Glucose synthesized\nChlorophyll absorbs red and blue light.",tags:["biology","plants"],date:"2025-06-23",color:"yellow"},
  ]);
  const [exams, setExams] = useState([
    {id:"e1",subject:"Mathematics",date:"2025-07-15",topics:["Calculus","Algebra","Trigonometry"],priority:"high"},
    {id:"e2",subject:"Physics",date:"2025-07-18",topics:["Mechanics","Optics"],priority:"medium"},
    {id:"e3",subject:"Biology",date:"2025-07-22",topics:["Photosynthesis","Cell Division"],priority:"low"},
  ]);
  const [sessions, setSessions] = useState([
    {id:"s1",subject:"Mathematics",duration:1500,date:"2025-06-23",completed:true},
    {id:"s2",subject:"Physics",duration:2700,date:"2025-06-22",completed:true},
  ]);
  const [quizzes, setQuizzes] = useState([]);
  const [streak, setStreak] = useState(7);
  const [notification, setNotification] = useState(null);
  const [modal, setModal] = useState(null);

  const notify = useCallback((msg, type="teal") => {
    setNotification({msg, type, id:uid()});
    setTimeout(() => setNotification(null), 3000);
  }, []);

  return (
    <>
      <GlobalStyle />
      <div style={{position:"fixed",inset:0,overflow:"hidden",pointerEvents:"none",zIndex:0}}>
        <div style={{position:"absolute",width:600,height:600,borderRadius:"50%",background:"radial-gradient(circle,rgba(0,212,170,0.06) 0%,transparent 70%)",top:-100,right:-100,animation:"pulse 8s ease-in-out infinite"}}/>
        <div style={{position:"absolute",width:500,height:500,borderRadius:"50%",background:"radial-gradient(circle,rgba(124,92,252,0.06) 0%,transparent 70%)",bottom:-100,left:200,animation:"pulse 10s ease-in-out infinite 2s"}}/>
      </div>
      <div style={{display:"flex",height:"100vh",position:"relative",zIndex:1}}>
        <Sidebar page={page} setPage={setPage} streak={streak} />
        <div style={{flex:1,overflow:"hidden",display:"flex",flexDirection:"column"}}>
          <TopBar page={page} notify={notify} />
          <main style={{flex:1,overflow:"auto",padding:"24px"}}>
            {page==="dashboard" && <Dashboard notes={notes} exams={exams} sessions={sessions} streak={streak} setPage={setPage} />}
            {page==="notes"     && <Notes notes={notes} setNotes={setNotes} notify={notify} setModal={setModal} />}
            {page==="schedule"  && <Schedule exams={exams} setExams={setExams} notify={notify} />}
            {page==="timer"     && <FocusTimer sessions={sessions} setSessions={setSessions} notify={notify} setStreak={setStreak} />}
            {page==="quiz"      && <QuizPage notes={notes} quizzes={quizzes} setQuizzes={setQuizzes} notify={notify} />}
            {page==="ai"        && <AITutor notes={notes} notify={notify} />}
          </main>
        </div>
      </div>
      {notification && <Notification key={notification.id} msg={notification.msg} type={notification.type} />}
      {modal && <div className="modal-overlay" onClick={()=>setModal(null)}><div className="modal" onClick={e=>e.stopPropagation()}>{modal}</div></div>}
    </>
  );
}

function Sidebar({page, setPage, streak}) {
  const items=[{id:"dashboard",icon:"🏠"},{id:"notes",icon:"📝"},{id:"schedule",icon:"📅"},{id:"timer",icon:"⏱️"},{id:"quiz",icon:"🧩"},{id:"ai",icon:"✨"}];
  return (
    <aside style={{width:72,background:"rgba(11,15,20,0.9)",borderRight:"1px solid var(--border)",display:"flex",flexDirection:"column",alignItems:"center",padding:"20px 0",gap:8,flexShrink:0}}>
      <div style={{marginBottom:16,width:40,height:40,borderRadius:10,background:"linear-gradient(135deg,var(--teal),var(--purple))",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,fontWeight:800,color:"#0b0f14"}}>S</div>
      {items.map(it=>(
        <div key={it.id} className={`sidebar-icon${page===it.id?" active":""}`} onClick={()=>setPage(it.id)}>
          <span style={{fontSize:18}}>{it.icon}</span>
          {page===it.id&&<div style={{position:"absolute",right:-1,top:"50%",transform:"translateY(-50%)",width:3,height:24,background:"var(--teal)",borderRadius:"3px 0 0 3px"}}/>}
        </div>
      ))}
      <div style={{flex:1}}/>
      <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:2}}>
        <div style={{fontSize:20}}>🔥</div>
        <div style={{fontSize:13,fontWeight:700,color:"var(--yellow)"}}>{streak}</div>
      </div>
    </aside>
  );
}

function TopBar({page, notify}) {
  const titles={dashboard:"My Dashboard",notes:"Smart Notes",schedule:"Study Schedule",timer:"Focus Timer",quiz:"Quiz Generator",ai:"AI Tutor"};
  return (
    <header style={{display:"flex",alignItems:"center",gap:16,padding:"16px 24px",borderBottom:"1px solid var(--border)",background:"rgba(11,15,20,0.8)",backdropFilter:"blur(20px)",flexShrink:0}}>
      <h1 style={{fontFamily:"'Space Grotesk',sans-serif",fontSize:20,fontWeight:700}}>{titles[page]}</h1>
      <div style={{flex:1}}/>
      <button className="btn btn-teal" style={{height:38,fontSize:13}} onClick={()=>notify("Pro features coming soon! 🎉")}>⚡ Go Pro</button>
      <div style={{width:36,height:36,borderRadius:99,background:"linear-gradient(135deg,var(--teal),var(--purple))",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:700,color:"#0b0f14"}}>A</div>
    </header>
  );
}

function Dashboard({notes, exams, sessions, streak, setPage}) {
  const totalTime=sessions.reduce((a,s)=>a+s.duration,0);
  const hours=Math.floor(totalTime/3600);
  const weekData=[45,60,30,90,75,50,80];
  const days=["M","T","W","T","F","S","S"];
  const maxBar=Math.max(...weekData);
  return (
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:20}} className="anim-fade-in">
      {[
        {label:"Study Streak",val:`${streak} days`,icon:"🔥",color:"var(--yellow)",tag:"+2 this week"},
        {label:"Total Study Time",val:`${hours}h ${Math.floor((totalTime%3600)/60)}m`,icon:"⏱️",color:"var(--teal)",tag:"↑ 12%"},
        {label:"Notes Created",val:notes.length,icon:"📝",color:"var(--purple2)",tag:"8 subjects"},
      ].map((s,i)=>(
        <div key={i} className={`glass hover-lift anim-fade-up delay-${i+1}`} style={{padding:"20px 22px"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14}}>
            <div>
              <div className="label">{s.label}</div>
              <div style={{fontSize:28,fontWeight:800,marginTop:8,fontFamily:"'Space Grotesk',sans-serif",color:s.color}}>{s.val}</div>
            </div>
            <div style={{fontSize:28}}>{s.icon}</div>
          </div>
          <span className="tag tag-teal" style={{fontSize:11}}>{s.tag}</span>
        </div>
      ))}
      <div className="glass anim-fade-up delay-4" style={{padding:"20px 22px",gridColumn:"span 2"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
          <div><div className="label">Weekly Activity</div><div style={{fontSize:16,fontWeight:700,marginTop:4}}>Study Minutes per Day</div></div>
        </div>
        <div style={{display:"flex",alignItems:"flex-end",gap:10,height:100}}>
          {weekData.map((v,i)=>(
            <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:6}}>
              <div style={{width:"100%",height:`${(v/maxBar)*80}px`,background:i===6?"linear-gradient(180deg,var(--teal),var(--purple))":"var(--glass2)",borderRadius:"6px 6px 4px 4px",border:i===6?"1px solid var(--teal)":"1px solid var(--border)",position:"relative"}}>
                {i===6&&<div style={{position:"absolute",top:-22,left:"50%",transform:"translateX(-50%)",background:"var(--teal)",color:"#0b0f14",fontSize:10,fontWeight:700,padding:"2px 6px",borderRadius:4}}>{v}m</div>}
              </div>
              <div style={{fontSize:11,color:"var(--text3)"}}>{days[i]}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="glass anim-fade-up delay-5" style={{padding:"20px 22px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
          <div className="label">Upcoming Exams</div>
          <button className="btn btn-ghost" style={{padding:"4px 10px",fontSize:12}} onClick={()=>setPage("schedule")}>All →</button>
        </div>
        {exams.map(e=>{
          const d=daysUntil(e.date);
          const c={high:"var(--red)",medium:"var(--yellow)",low:"var(--teal)"}[e.priority];
          return (
            <div key={e.id} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",background:"var(--glass)",border:"1px solid var(--border)",borderRadius:10,marginBottom:8}}>
              <div style={{width:38,height:38,borderRadius:8,background:`${c}20`,border:`1px solid ${c}40`,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
                <div style={{fontSize:12,fontWeight:700,color:c}}>{d}</div>
                <div style={{fontSize:9,color:"var(--text2)"}}>days</div>
              </div>
              <div style={{flex:1}}><div style={{fontSize:13,fontWeight:600}}>{e.subject}</div><div style={{fontSize:11,color:"var(--text2)"}}>{fmtDate(e.date)}</div></div>
            </div>
          );
        })}
      </div>
      <div className="glass anim-fade-up delay-4" style={{padding:"20px 22px",gridColumn:"span 2"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
          <div className="label">Recent Notes</div>
          <button className="btn btn-ghost" style={{padding:"4px 10px",fontSize:12}} onClick={()=>setPage("notes")}>All →</button>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12}}>
          {notes.slice(0,3).map(n=>(
            <div key={n.id} className="note-card" style={{borderLeft:`3px solid ${({teal:"var(--teal)",purple:"var(--purple2)",yellow:"var(--yellow)"})[n.color]}`}} onClick={()=>setPage("notes")}>
              <div className={`tag tag-${n.color}`} style={{fontSize:10,marginBottom:8}}>{n.subject}</div>
              <div style={{fontSize:13,fontWeight:600,marginBottom:6}}>{n.title}</div>
              <div style={{fontSize:11,color:"var(--text2)",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden"}}>{n.content}</div>
              <div style={{fontSize:10,color:"var(--text3)",marginTop:8}}>{fmtDate(n.date)}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="glass anim-fade-up delay-5" style={{padding:"20px 22px"}}>
        <div className="label" style={{marginBottom:14}}>Quick Actions</div>
        {[{l:"New Note",i:"📝",p:"notes"},{l:"Focus Timer",i:"⏱️",p:"timer"},{l:"Generate Quiz",i:"🧩",p:"quiz"},{l:"Ask AI Tutor",i:"✨",p:"ai"}].map((a,i)=>(
          <button key={i} className="btn btn-ghost" style={{width:"100%",justifyContent:"flex-start",marginBottom:8,fontSize:13}} onClick={()=>setPage(a.p)}>
            <span>{a.i}</span><span>{a.l}</span><span style={{marginLeft:"auto",color:"var(--text3)"}}>→</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function Notes({notes, setNotes, notify, setModal}) {
  const [filter, setFilter] = useState("All");
  const [showForm, setShowForm] = useState(false);
  const [editNote, setEditNote] = useState(null);
  const [form, setForm] = useState({title:"",subject:"Mathematics",content:"",tags:"",color:"teal"});
  const [aiLoading, setAiLoading] = useState(null);
  const colorMap={teal:"var(--teal)",purple:"var(--purple2)",yellow:"var(--yellow)",red:"var(--red)"};
  const subjects=["All",...new Set(notes.map(n=>n.subject))];
  const filtered=filter==="All"?notes:notes.filter(n=>n.subject===filter);

  const saveNote=()=>{
    if(!form.title||!form.content){notify("Title and content required","red");return;}
    if(editNote){setNotes(ns=>ns.map(n=>n.id===editNote.id?{...n,...form,tags:form.tags.split(",").map(t=>t.trim()).filter(Boolean)}:n));}
    else{setNotes(ns=>[...ns,{...form,id:uid(),date:new Date().toISOString().slice(0,10),tags:form.tags.split(",").map(t=>t.trim()).filter(Boolean)}]);}
    notify("Note saved ✓");setShowForm(false);setEditNote(null);setForm({title:"",subject:"Mathematics",content:"",tags:"",color:"teal"});
  };

  const aiSummarize=async(note)=>{
    setAiLoading(note.id);
    try{
      const text=await callClaude({system:"Summarize study notes in 3-5 bullet points then add 2 key takeaways. Be concise and clear.",messages:[{role:"user",content:`Summarize these ${note.subject} notes:\nTitle: ${note.title}\n\n${note.content}`}]});
      setModal(<div>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:20}}><span style={{fontSize:24}}>✨</span><div><div style={{fontWeight:700,fontSize:16}}>AI Summary</div><div style={{fontSize:12,color:"var(--text2)"}}>{note.title}</div></div></div>
        <div style={{background:"var(--glass)",border:"1px solid var(--border)",borderRadius:12,padding:16,fontSize:14,lineHeight:1.7,whiteSpace:"pre-wrap"}}>{text}</div>
        <button className="btn btn-teal" style={{marginTop:16,width:"100%",justifyContent:"center"}} onClick={()=>setModal(null)}>Close</button>
      </div>);
    }catch{notify("AI error","red");}
    finally{setAiLoading(null);}
  };

  return (
    <div className="anim-fade-in">
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:20,flexWrap:"wrap"}}>
        <div style={{display:"flex",gap:8,flex:1,flexWrap:"wrap"}}>{subjects.map(s=><div key={s} className={`chip${filter===s?" active":""}`} onClick={()=>setFilter(s)}>{s}</div>)}</div>
        <button className="btn btn-teal" onClick={()=>{setShowForm(true);setEditNote(null);setForm({title:"",subject:"Mathematics",content:"",tags:"",color:"teal"});}}>+ New Note</button>
      </div>
      {showForm&&(
        <div className="glass anim-scale-in" style={{padding:24,marginBottom:20,border:"1px solid var(--teal)"}}>
          <div style={{fontWeight:700,marginBottom:14}}>{editNote?"Edit Note":"New Note"}</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
            <input className="input" placeholder="Title*" value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))}/>
            <select className="input" value={form.subject} onChange={e=>setForm(f=>({...f,subject:e.target.value}))}>{SUBJECTS.map(s=><option key={s}>{s}</option>)}</select>
          </div>
          <textarea className="input" placeholder="Note content*" value={form.content} onChange={e=>setForm(f=>({...f,content:e.target.value}))} style={{marginBottom:10,minHeight:120}}/>
          <div style={{display:"grid",gridTemplateColumns:"1fr auto",gap:10,marginBottom:14}}>
            <input className="input" placeholder="Tags (comma separated)" value={form.tags} onChange={e=>setForm(f=>({...f,tags:e.target.value}))}/>
            <div style={{display:"flex",gap:8,alignItems:"center"}}>
              {["teal","purple","yellow","red"].map(c=><div key={c} onClick={()=>setForm(f=>({...f,color:c}))} style={{width:24,height:24,borderRadius:6,background:colorMap[c],cursor:"pointer",border:form.color===c?"2px solid white":"2px solid transparent"}}/>)}
            </div>
          </div>
          <div style={{display:"flex",gap:8}}><button className="btn btn-teal" onClick={saveNote}>Save</button><button className="btn btn-ghost" onClick={()=>setShowForm(false)}>Cancel</button></div>
        </div>
      )}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:16}}>
        {filtered.map((n,i)=>(
          <div key={n.id} className={`note-card anim-fade-up delay-${(i%5)+1}`} style={{borderLeft:`3px solid ${colorMap[n.color]||"var(--teal)"}`}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
              <div className={`tag tag-${n.color}`}>{n.subject}</div>
              <div style={{display:"flex",gap:6}}>
                <button className="btn btn-ghost" style={{padding:"3px 8px",fontSize:12}} onClick={()=>aiSummarize(n)}>{aiLoading===n.id?<span className="spinner"/>:"✨"}</button>
                <button className="btn btn-ghost" style={{padding:"3px 8px",fontSize:12}} onClick={()=>{setEditNote(n);setForm({title:n.title,subject:n.subject,content:n.content,tags:n.tags?.join(", ")||"",color:n.color||"teal"});setShowForm(true);}}>✏️</button>
                <button className="btn btn-ghost" style={{padding:"3px 8px",fontSize:12,color:"var(--red)"}} onClick={()=>{setNotes(ns=>ns.filter(x=>x.id!==n.id));notify("Deleted");}}>🗑️</button>
              </div>
            </div>
            <div style={{fontWeight:700,fontSize:15,marginBottom:6}}>{n.title}</div>
            <div style={{fontSize:13,color:"var(--text2)",lineHeight:1.6,display:"-webkit-box",WebkitLineClamp:3,WebkitBoxOrient:"vertical",overflow:"hidden"}}>{n.content}</div>
            {n.tags?.length>0&&<div style={{display:"flex",gap:6,flexWrap:"wrap",marginTop:10}}>{n.tags.map(t=><span key={t} style={{fontSize:10,padding:"2px 8px",borderRadius:99,background:"var(--glass2)",border:"1px solid var(--border)",color:"var(--text2)"}}>#{t}</span>)}</div>}
            <div style={{marginTop:10,fontSize:11,color:"var(--text3)"}}>{fmtDate(n.date)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Schedule({exams, setExams, notify}) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({subject:"Mathematics",date:"",topics:"",priority:"medium"});
  const [schedule, setSchedule] = useState(null);
  const [generating, setGenerating] = useState(false);
  const colors={high:"var(--red)",medium:"var(--yellow)",low:"var(--teal)"};

  const addExam=()=>{
    if(!form.date){notify("Pick a date","red");return;}
    setExams(es=>[...es,{...form,id:uid(),topics:form.topics.split(",").map(t=>t.trim()).filter(Boolean)}]);
    notify("Exam added ✓");setShowForm(false);
  };

  const generateSchedule=async()=>{
    if(!exams.length){notify("Add exams first","red");return;}
    setGenerating(true);
    try{
      const text=await callClaude({system:"You are a study planner. Create a practical day-by-day study schedule. Format each day as: 'Day N (Date): Subject - Topics (X hours)'. Be concise and realistic.",messages:[{role:"user",content:`Today is ${new Date().toDateString()}. Create a study schedule for:\n${exams.map(e=>`- ${e.subject} on ${e.date}, topics: ${e.topics.join(", ")}, priority: ${e.priority}`).join("\n")}\n\nMake a 10-day plan, 3-4 blocks per day.`}],max_tokens:1500});
      setSchedule(text);
    }catch{notify("AI error","red");}
    finally{setGenerating(false);}
  };

  return (
    <div className="anim-fade-in" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:24}}>
      <div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
          <div style={{fontWeight:700,fontSize:16}}>Your Exams</div>
          <div style={{display:"flex",gap:8}}>
            <button className="btn btn-ghost" style={{fontSize:12}} onClick={generateSchedule} disabled={generating}>{generating?<><span className="spinner"/>Generating...</>:"✨ AI Schedule"}</button>
            <button className="btn btn-teal" style={{fontSize:12}} onClick={()=>setShowForm(s=>!s)}>+ Exam</button>
          </div>
        </div>
        {showForm&&(
          <div className="glass anim-scale-in" style={{padding:16,marginBottom:14,border:"1px solid var(--teal)"}}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
              <select className="input" value={form.subject} onChange={e=>setForm(f=>({...f,subject:e.target.value}))}>{SUBJECTS.map(s=><option key={s}>{s}</option>)}</select>
              <input className="input" type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))} style={{colorScheme:"dark"}}/>
            </div>
            <input className="input" placeholder="Topics (comma separated)" value={form.topics} onChange={e=>setForm(f=>({...f,topics:e.target.value}))} style={{marginBottom:8}}/>
            <select className="input" value={form.priority} onChange={e=>setForm(f=>({...f,priority:e.target.value}))} style={{marginBottom:10}}>
              <option value="high">High Priority</option><option value="medium">Medium Priority</option><option value="low">Low Priority</option>
            </select>
            <div style={{display:"flex",gap:8}}><button className="btn btn-teal" style={{fontSize:13}} onClick={addExam}>Add</button><button className="btn btn-ghost" style={{fontSize:13}} onClick={()=>setShowForm(false)}>Cancel</button></div>
          </div>
        )}
        {exams.map((e,i)=>{
          const d=daysUntil(e.date);const c=colors[e.priority];
          return(
            <div key={e.id} className={`glass card-hover anim-fade-up delay-${i+1}`} style={{padding:16,marginBottom:10,borderLeft:`3px solid ${c}`}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                <div><div style={{fontWeight:700}}>{e.subject}</div><div style={{fontSize:12,color:"var(--text2)",marginTop:2}}>{fmtDate(e.date)} · {d>0?`${d} days`:"Today!"}</div></div>
                <button className="btn btn-ghost" style={{padding:"3px 8px",fontSize:12,color:"var(--red)"}} onClick={()=>{setExams(es=>es.filter(x=>x.id!==e.id));notify("Removed");}}>✕</button>
              </div>
              {e.topics?.length>0&&<div style={{marginTop:8,display:"flex",gap:6,flexWrap:"wrap"}}>{e.topics.map(t=><span key={t} style={{fontSize:10,padding:"2px 8px",borderRadius:99,background:"var(--glass2)",border:"1px solid var(--border)",color:"var(--text2)"}}>{t}</span>)}</div>}
            </div>
          );
        })}
        {!exams.length&&<div style={{textAlign:"center",padding:40,color:"var(--text2)"}}>No exams added yet</div>}
      </div>
      <div>
        <div style={{fontWeight:700,fontSize:16,marginBottom:14}}>AI-Generated Schedule</div>
        {schedule?(
          <div className="glass anim-scale-in" style={{padding:20}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}><span>✨</span><div style={{fontWeight:600}}>Your Study Plan</div></div>
            <div style={{fontSize:13,lineHeight:1.8,whiteSpace:"pre-wrap",maxHeight:500,overflowY:"auto",color:"var(--text)"}}>{schedule}</div>
            <button className="btn btn-teal" style={{marginTop:12,width:"100%",justifyContent:"center"}} onClick={generateSchedule} disabled={generating}>{generating?<><span className="spinner"/>...</>:"↺ Regenerate"}</button>
          </div>
        ):(
          <div className="glass" style={{padding:40,textAlign:"center",border:"2px dashed var(--border)"}}>
            <div style={{fontSize:40,marginBottom:12}}>📅</div>
            <div style={{fontWeight:600,marginBottom:6}}>No schedule yet</div>
            <div style={{fontSize:13,color:"var(--text2)",marginBottom:18}}>Add exams and let AI build your study plan</div>
            <button className="btn btn-teal" style={{margin:"0 auto"}} onClick={generateSchedule} disabled={generating}>{generating?<><span className="spinner"/>Building...</>:"✨ Generate Schedule"}</button>
          </div>
        )}
      </div>
    </div>
  );
}

function FocusTimer({sessions, setSessions, notify, setStreak}) {
  const durations={pomodoro:25*60,short:5*60,long:15*60};
  const [mode,setMode]=useState("pomodoro");
  const [timeLeft,setTimeLeft]=useState(durations.pomodoro);
  const [running,setRunning]=useState(false);
  const [phase,setPhase]=useState("focus");
  const [subject,setSubject]=useState("Mathematics");
  const [pomosToday,setPomosToday]=useState(0);
  const [customMin,setCustomMin]=useState(30);
  const intervalRef=useRef(null);
  const totalTime=mode==="custom"?customMin*60:durations[mode];
  const r=100;const circ=2*Math.PI*r;const progress=1-timeLeft/totalTime;
  const phaseColor=phase==="focus"?"var(--teal)":"var(--purple2)";

  useEffect(()=>{
    if(running){
      intervalRef.current=setInterval(()=>{
        setTimeLeft(t=>{
          if(t<=1){
            clearInterval(intervalRef.current);setRunning(false);
            if(phase==="focus"){setSessions(ss=>[...ss,{id:uid(),subject,duration:totalTime,date:new Date().toISOString().slice(0,10),completed:true}]);setPomosToday(p=>p+1);notify(`🎉 Session done! +${Math.floor(totalTime/60)}min`);}
            else notify("☕ Break over — back to work!");
            setPhase(p=>p==="focus"?"break":"focus");return phase==="focus"?durations.short:totalTime;
          }return t-1;
        });
      },1000);
    }return()=>clearInterval(intervalRef.current);
  },[running,phase]);

  return(
    <div className="anim-fade-in" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:24,maxWidth:900}}>
      <div className="glass" style={{padding:32,display:"flex",flexDirection:"column",alignItems:"center",gap:20}}>
        <div style={{display:"flex",gap:8,flexWrap:"wrap",justifyContent:"center"}}>
          {[["pomodoro","25m"],["short","5m"],["long","15m"],["custom","Custom"]].map(([m,l])=>(
            <div key={m} className={`chip${mode===m?" active":""}`} onClick={()=>{if(!running){setMode(m);setTimeLeft(m==="custom"?customMin*60:durations[m]);setPhase("focus");}}}>{l}</div>
          ))}
        </div>
        {mode==="custom"&&!running&&(
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <input type="number" className="input" value={customMin} onChange={e=>{setCustomMin(+e.target.value);setTimeLeft(+e.target.value*60);}} style={{width:70,textAlign:"center"}} min={1} max={120}/>
            <span style={{color:"var(--text2)",fontSize:13}}>minutes</span>
          </div>
        )}
        <div style={{position:"relative",width:220,height:220}}>
          <svg width="220" height="220" style={{transform:"rotate(-90deg)"}}>
            <circle cx="110" cy="110" r={r} fill="none" stroke="var(--glass2)" strokeWidth="8"/>
            <circle cx="110" cy="110" r={r} fill="none" stroke={phaseColor} strokeWidth="8" strokeDasharray={circ} strokeDashoffset={circ*(1-progress)} strokeLinecap="round" className="timer-circle"/>
          </svg>
          <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
            <div style={{fontSize:11,fontWeight:600,letterSpacing:"0.1em",textTransform:"uppercase",color:"var(--text2)"}}>{phase==="focus"?"Focus":"Break"}</div>
            <div style={{fontSize:48,fontWeight:800,fontFamily:"'Space Grotesk',sans-serif",color:phaseColor,fontVariantNumeric:"tabular-nums"}}>{fmtTime(timeLeft)}</div>
            <div style={{fontSize:12,color:"var(--text2)"}}>{subject}</div>
          </div>
        </div>
        <select className="input" value={subject} onChange={e=>setSubject(e.target.value)} style={{width:220}}>
          {SUBJECTS.map(s=><option key={s}>{s}</option>)}
        </select>
        <div style={{display:"flex",gap:10}}>
          <button className="btn btn-ghost" style={{width:44,height:44,justifyContent:"center",borderRadius:99,padding:0,fontSize:18}} onClick={()=>{setRunning(false);clearInterval(intervalRef.current);setTimeLeft(totalTime);setPhase("focus");}}>↺</button>
          <button className="btn" style={{width:120,height:44,justifyContent:"center",borderRadius:99,background:running?"var(--glass2)":"linear-gradient(135deg,var(--teal),var(--purple))",color:running?"var(--text)":"#0b0f14",fontWeight:700,border:running?"1px solid var(--border)":"none",fontSize:15}} onClick={()=>setRunning(r=>!r)}>
            {running?"⏸ Pause":"▶ Start"}
          </button>
        </div>
        <div style={{display:"flex",gap:20,textAlign:"center"}}>
          <div><div style={{fontSize:24,fontWeight:700,color:"var(--teal)"}}>{pomosToday}</div><div style={{fontSize:11,color:"var(--text2)"}}>Today's sessions</div></div>
          <div style={{width:1,background:"var(--border)"}}/>
          <div><div style={{fontSize:24,fontWeight:700,color:"var(--purple2)"}}>{pomosToday*Math.floor(totalTime/60)}m</div><div style={{fontSize:11,color:"var(--text2)"}}>Minutes focused</div></div>
        </div>
      </div>
      <div>
        <div style={{fontWeight:700,fontSize:16,marginBottom:14}}>Session History</div>
        <div style={{display:"flex",flexDirection:"column",gap:8,maxHeight:450,overflowY:"auto"}}>
          {sessions.length===0&&<div style={{textAlign:"center",padding:40,color:"var(--text2)"}}>No sessions yet</div>}
          {[...sessions].reverse().map((s,i)=>(
            <div key={s.id} className="glass" style={{padding:"10px 14px",display:"flex",alignItems:"center",gap:10}}>
              <div style={{width:34,height:34,borderRadius:8,background:"rgba(0,212,170,0.1)",border:"1px solid rgba(0,212,170,0.2)",display:"flex",alignItems:"center",justifyContent:"center"}}>⏱️</div>
              <div style={{flex:1}}><div style={{fontSize:13,fontWeight:600}}>{s.subject}</div><div style={{fontSize:11,color:"var(--text2)"}}>{fmtDate(s.date)}</div></div>
              <div style={{textAlign:"right"}}><div style={{fontSize:14,fontWeight:700,color:"var(--teal)"}}>{Math.floor(s.duration/60)}m</div><div style={{fontSize:10,color:"var(--text3)"}}>✓ Done</div></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function QuizPage({notes, quizzes, setQuizzes, notify}) {
  const [selectedNote,setSelectedNote]=useState(notes[0]?.id||"");
  const [generating,setGenerating]=useState(false);
  const [activeQuiz,setActiveQuiz]=useState(null);
  const [answers,setAnswers]=useState({});
  const [submitted,setSubmitted]=useState(false);
  const [qCount,setQCount]=useState(5);

  const generateQuiz=async()=>{
    const note=notes.find(n=>n.id===selectedNote);
    if(!note){notify("Select a note first","red");return;}
    setGenerating(true);
    try{
      const raw=await callClaude({system:`Generate exactly ${qCount} multiple choice questions. Return ONLY a valid JSON array, nothing else: [{"question":"...","options":["A) ...","B) ...","C) ...","D) ..."],"correct":0,"explanation":"..."}]. correct is 0-based index.`,messages:[{role:"user",content:`Generate ${qCount} MCQ questions from:\nSubject: ${note.subject}\nTitle: ${note.title}\n\n${note.content}`}],max_tokens:2000});
      const clean=raw.replace(/```json|```/g,"").trim();
      const qs=JSON.parse(clean);
      const quiz={id:uid(),noteId:selectedNote,noteTitle:note.title,subject:note.subject,questions:qs,date:new Date().toISOString().slice(0,10),score:null};
      setQuizzes(prev=>[...prev,quiz]);setActiveQuiz(quiz);setAnswers({});setSubmitted(false);
      notify(`Quiz ready! ${qs.length} questions 🧩`);
    }catch(e){notify("Failed to generate — try again","red");console.error(e);}
    finally{setGenerating(false);}
  };

  const submitQuiz=()=>{
    if(Object.keys(answers).length<activeQuiz.questions.length){notify("Answer all questions first","red");return;}
    const correct=activeQuiz.questions.filter((q,i)=>answers[i]===q.correct).length;
    const score=Math.round(correct/activeQuiz.questions.length*100);
    setQuizzes(qs=>qs.map(q=>q.id===activeQuiz.id?{...q,score}:q));
    setActiveQuiz(aq=>({...aq,score}));setSubmitted(true);
    notify(score>=80?`Excellent! ${score}% 🎉`:score>=60?`Good! ${score}% ✓`:`Keep studying! ${score}%`);
  };

  if(activeQuiz) return(
    <div className="anim-fade-in" style={{maxWidth:680}}>
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20}}>
        <button className="btn btn-ghost" onClick={()=>{setActiveQuiz(null);setSubmitted(false);setAnswers({});}}>← Back</button>
        <div><div style={{fontWeight:700}}>{activeQuiz.noteTitle}</div><div style={{fontSize:12,color:"var(--text2)"}}>{activeQuiz.subject} · {activeQuiz.questions.length} questions</div></div>
        {submitted&&<div style={{marginLeft:"auto",textAlign:"right"}}><div style={{fontSize:26,fontWeight:800,color:activeQuiz.score>=80?"var(--teal)":activeQuiz.score>=60?"var(--yellow)":"var(--red)"}}>{activeQuiz.score}%</div></div>}
      </div>
      {submitted&&<div className="glass anim-scale-in" style={{padding:14,marginBottom:16,border:"1px solid var(--teal)",display:"flex",gap:14,alignItems:"center"}}>
        <div style={{fontSize:36}}>{activeQuiz.score>=80?"🎉":activeQuiz.score>=60?"👍":"📚"}</div>
        <div><div style={{fontWeight:700}}>{activeQuiz.score>=80?"Excellent!":activeQuiz.score>=60?"Good effort!":"Keep studying!"}</div><div style={{fontSize:13,color:"var(--text2)"}}>{activeQuiz.questions.filter((q,i)=>answers[i]===q.correct).length} of {activeQuiz.questions.length} correct</div></div>
        <button className="btn btn-teal" style={{marginLeft:"auto"}} onClick={()=>{setAnswers({});setSubmitted(false);}}>Retry</button>
      </div>}
      {activeQuiz.questions.map((q,qi)=>{
        const isCorrect=submitted&&answers[qi]===q.correct;
        return(
          <div key={qi} className={`glass anim-fade-up delay-${(qi%5)+1}`} style={{padding:20,marginBottom:14,border:submitted?`1px solid ${isCorrect?"rgba(0,212,170,0.3)":"rgba(255,94,125,0.3)"}`:"1px solid var(--border)"}}>
            <div style={{display:"flex",gap:10,marginBottom:12}}>
              <div style={{width:24,height:24,borderRadius:6,background:"var(--glass2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,flexShrink:0}}>{qi+1}</div>
              <div style={{fontSize:14,fontWeight:600,lineHeight:1.5}}>{q.question}</div>
            </div>
            {q.options.map((opt,oi)=>{
              const isSel=answers[qi]===oi;const isCorr=oi===q.correct;
              let bg="var(--glass)";let border="1px solid var(--border)";let col="var(--text)";
              if(submitted){if(isCorr){bg="rgba(0,212,170,0.1)";border="1px solid rgba(0,212,170,0.5)";col="var(--teal)";}else if(isSel){bg="rgba(255,94,125,0.1)";border="1px solid rgba(255,94,125,0.5)";col="var(--red)";}}
              else if(isSel){bg="rgba(0,212,170,0.1)";border="1px solid var(--teal)";col="var(--teal)";}
              return(
                <div key={oi} onClick={()=>{if(!submitted)setAnswers(a=>({...a,[qi]:oi}));}} style={{padding:"9px 12px",borderRadius:8,background:bg,border,color:col,fontSize:13,cursor:submitted?"default":"pointer",transition:"all 0.15s",display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
                  <div style={{width:18,height:18,borderRadius:4,border:isSel||submitted&&isCorr?"2px solid currentColor":"2px solid var(--border)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,flexShrink:0}}>
                    {submitted&&isCorr?"✓":submitted&&isSel&&!isCorr?"✕":String.fromCharCode(65+oi)}
                  </div>{opt}
                </div>
              );
            })}
            {submitted&&q.explanation&&<div style={{marginTop:10,padding:"8px 12px",background:"rgba(124,92,252,0.1)",border:"1px solid rgba(124,92,252,0.3)",borderRadius:8,fontSize:12,color:"var(--purple2)",lineHeight:1.5}}>💡 {q.explanation}</div>}
          </div>
        );
      })}
      {!submitted&&<button className="btn btn-teal" style={{marginTop:8,padding:"12px 32px",fontSize:15,fontWeight:700}} onClick={submitQuiz}>Submit Quiz →</button>}
    </div>
  );

  return(
    <div className="anim-fade-in" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:24}}>
      <div>
        <div style={{fontWeight:700,fontSize:16,marginBottom:14}}>Generate Quiz from Notes</div>
        <div className="glass" style={{padding:24}}>
          <div style={{marginBottom:14}}><div className="label" style={{marginBottom:8}}>Select Note</div>
            <select className="input" value={selectedNote} onChange={e=>setSelectedNote(e.target.value)}>{notes.map(n=><option key={n.id} value={n.id}>{n.title} ({n.subject})</option>)}</select>
          </div>
          <div style={{marginBottom:18}}><div className="label" style={{marginBottom:8}}>Number of Questions</div>
            <div style={{display:"flex",gap:8}}>{[3,5,8,10].map(n=><div key={n} className={`chip${qCount===n?" active":""}`} onClick={()=>setQCount(n)}>{n}Q</div>)}</div>
          </div>
          <button className="btn btn-teal" style={{width:"100%",justifyContent:"center",padding:"12px"}} onClick={generateQuiz} disabled={generating||!notes.length}>
            {generating?<><span className="spinner"/>Generating with AI...</>:"✨ Generate Quiz"}
          </button>
        </div>
      </div>
      <div>
        <div style={{fontWeight:700,fontSize:16,marginBottom:14}}>Past Quizzes</div>
        {!quizzes.length&&<div style={{textAlign:"center",padding:40,color:"var(--text2)",border:"2px dashed var(--border)",borderRadius:12}}>No quizzes yet</div>}
        {[...quizzes].reverse().map((q,i)=>(
          <div key={q.id} className={`glass card-hover anim-fade-up delay-${i+1}`} style={{padding:14,marginBottom:10}} onClick={()=>{setActiveQuiz(q);setAnswers({});setSubmitted(!!q.score);}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
              <div><div style={{fontWeight:600,fontSize:14}}>{q.noteTitle}</div><div style={{fontSize:11,color:"var(--text2)",marginTop:2}}>{q.subject} · {q.questions.length}Q · {fmtDate(q.date)}</div></div>
              {q.score!==null&&<div style={{fontSize:18,fontWeight:800,color:q.score>=80?"var(--teal)":q.score>=60?"var(--yellow)":"var(--red)"}}>{q.score}%</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AITutor({notes, notify}) {
  const [messages,setMessages]=useState([{role:"assistant",content:"Hi! I'm your AI study tutor 👋\n\nAsk me anything — explain concepts, solve problems, quiz you on notes, or build a study plan. I can see all your saved notes!"}]);
  const [input,setInput]=useState("");
  const [loading,setLoading]=useState(false);
  const [mood,setMood]=useState("😐 Normal");
  const chatRef=useRef(null);
  useEffect(()=>{if(chatRef.current)chatRef.current.scrollTop=chatRef.current.scrollHeight;},[messages]);

  const notesCtx=notes.map(n=>`[${n.subject}] ${n.title}: ${n.content}`).join("\n\n");

  const send=async()=>{
    if(!input.trim()||loading)return;
    const userMsg={role:"user",content:input};
    setMessages(m=>[...m,userMsg]);setInput("");setLoading(true);
    const history=[...messages,userMsg].map(m=>({role:m.role,content:m.content}));
    try{
      const reply=await callClaude({system:`You are SmartStudy AI, an encouraging tutor for Indian students. Student mood: ${mood}. Be concise but clear. Use simple language. Their notes:\n\n${notesCtx}`,messages:history,max_tokens:1200});
      setMessages(m=>[...m,{role:"assistant",content:reply}]);
    }catch{setMessages(m=>[...m,{role:"assistant",content:"Connection error. Try again!"}]);}
    finally{setLoading(false);}
  };

  const suggestions=["Explain Newton's 3rd law simply","Quiz me on my Calculus notes","What are key steps of photosynthesis?","How do I solve derivative problems?"];

  return(
    <div className="anim-fade-in" style={{display:"grid",gridTemplateColumns:"1fr 260px",gap:20,height:"calc(100vh - 140px)"}}>
      <div className="glass" style={{display:"flex",flexDirection:"column",overflow:"hidden"}}>
        <div style={{padding:"14px 18px",borderBottom:"1px solid var(--border)",display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:34,height:34,borderRadius:99,background:"linear-gradient(135deg,var(--teal),var(--purple))",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>🤖</div>
          <div><div style={{fontWeight:700,fontSize:14}}>SmartStudy AI</div><div style={{fontSize:11,color:"var(--teal)"}}>● Online</div></div>
          <div style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:8}}>
            <span style={{fontSize:11,color:"var(--text2)"}}>Mood:</span>
            <select className="input" value={mood} onChange={e=>setMood(e.target.value)} style={{padding:"3px 8px",fontSize:12,width:"auto"}}>{MOODS.map(m=><option key={m}>{m}</option>)}</select>
          </div>
        </div>
        <div ref={chatRef} style={{flex:1,overflowY:"auto",padding:18,display:"flex",flexDirection:"column",gap:14}}>
          {messages.map((m,i)=>(
            <div key={i} style={{display:"flex",gap:8,alignItems:"flex-start",flexDirection:m.role==="user"?"row-reverse":"row"}}>
              <div style={{width:28,height:28,borderRadius:99,flexShrink:0,background:m.role==="user"?"linear-gradient(135deg,var(--purple),var(--teal))":"linear-gradient(135deg,var(--teal),var(--purple))",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,color:"#0b0f14"}}>
                {m.role==="user"?"A":"🤖"}
              </div>
              <div style={{maxWidth:"75%",padding:"10px 14px",borderRadius:m.role==="user"?"16px 16px 4px 16px":"16px 16px 16px 4px",background:m.role==="user"?"rgba(124,92,252,0.2)":"var(--glass2)",border:"1px solid var(--border)",fontSize:13,lineHeight:1.7,whiteSpace:"pre-wrap"}}>{m.content}</div>
            </div>
          ))}
          {loading&&<div style={{display:"flex",gap:8,alignItems:"center"}}>
            <div style={{width:28,height:28,borderRadius:99,background:"linear-gradient(135deg,var(--teal),var(--purple))",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12}}>🤖</div>
            <div style={{padding:"10px 14px",background:"var(--glass2)",border:"1px solid var(--border)",borderRadius:"16px 16px 16px 4px",display:"flex",gap:5}}>
              {[0,1,2].map(i=><div key={i} style={{width:5,height:5,borderRadius:3,background:"var(--teal)",animation:`pulse 1s ease-in-out ${i*0.2}s infinite`}}/>)}
            </div>
          </div>}
        </div>
        <div style={{padding:14,borderTop:"1px solid var(--border)"}}>
          <div style={{display:"flex",gap:8}}>
            <input className="input" value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&!e.shiftKey&&send()} placeholder="Ask anything... (Enter to send)" style={{flex:1,height:42,borderRadius:99}}/>
            <button className="btn btn-teal" style={{width:42,height:42,borderRadius:99,justifyContent:"center",padding:0,fontSize:15}} onClick={send} disabled={loading}>➤</button>
          </div>
        </div>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:14}}>
        <div className="glass" style={{padding:14}}>
          <div className="label" style={{marginBottom:10}}>Quick Prompts</div>
          {suggestions.map((s,i)=><button key={i} className="btn btn-ghost" style={{justifyContent:"flex-start",fontSize:12,padding:"7px 10px",textAlign:"left",lineHeight:1.4,width:"100%",marginBottom:6}} onClick={()=>setInput(s)}>{s}</button>)}
        </div>
        <div className="glass" style={{padding:14,flex:1,overflow:"auto"}}>
          <div className="label" style={{marginBottom:10}}>Your Notes</div>
          {notes.map(n=>(
            <div key={n.id} className="card-hover" style={{padding:"8px 10px",borderRadius:8,background:"var(--glass)",border:"1px solid var(--border)",marginBottom:6}} onClick={()=>setInput(`Explain my ${n.subject} notes about "${n.title}"`)}>
              <div style={{fontSize:12,fontWeight:600}}>{n.title}</div>
              <div style={{fontSize:10,color:"var(--text2)",marginTop:2}}>{n.subject}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Notification({msg, type}) {
  const c={teal:"var(--teal)",red:"var(--red)",yellow:"var(--yellow)"}[type]||"var(--teal)";
  return<div style={{position:"fixed",bottom:24,right:24,zIndex:200,background:"#1a2433",border:`1px solid ${c}`,borderRadius:12,padding:"12px 20px",fontSize:14,fontWeight:500,color:c,boxShadow:"0 8px 32px rgba(0,0,0,0.4)",animation:"fadeUp 0.3s ease",maxWidth:320}}>{msg}</div>;
}
