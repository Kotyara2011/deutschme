import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Check, GraduationCap, Volume2, Play, Pause, Mic, BookOpen, Trophy, BarChart3, Settings, Repeat, Clock, Rocket, RefreshCw, Ear, Pencil, HelpCircle } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from "recharts";

// -------------------------------------------------------
// Utility & persistence
// -------------------------------------------------------
const LS_KEY = "deutschme_state_v1";
function loadState() {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || "null") || undefined; } catch { return undefined; }
}
function saveState(s) { try { localStorage.setItem(LS_KEY, JSON.stringify(s)); } catch {}
}

function usePersistentState(initial) {
  const [state, setState] = useState(() => loadState() ?? initial);
  useEffect(() => saveState(state), [state]);
  return [state, setState];
}

// -------------------------------------------------------
// Minimal spaced repetition (SM-2 light)
// -------------------------------------------------------
function scheduleCard(card, quality) {
  // card: {ef, interval, reps, due}
  const now = Date.now();
  let { ef = 2.5, interval = 0, reps = 0 } = card;
  if (quality < 3) {
    reps = 0; interval = 1; // relearn tomorrow
  } else {
    if (reps === 0) interval = 1;
    else if (reps === 1) interval = 6;
    else interval = Math.round(interval * ef);
    ef = Math.max(1.3, ef + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)));
    reps += 1;
  }
  const due = now + interval * 24 * 60 * 60 * 1000;
  return { ...card, ef, interval, reps, due };
}

// -------------------------------------------------------
// Seed curriculum (A1→B1) – compact demo set
// -------------------------------------------------------
const CURRICULUM = {
  A1: {
    title: "A1: База",
    goals: ["Алфавит и произношение", "Приветствия и вежливость", "Числа, время", "Семья", "Еда"],
    vocab: [
      { de: "Guten Morgen", ru: "Доброе утро", tip: "формальное" },
      { de: "Wie geht's?", ru: "Как дела?", tip: "разговорное" },
      { de: "Ich heiße …", ru: "Меня зовут …" },
      { de: "Danke", ru: "Спасибо" },
      { de: "Bitte", ru: "Пожалуйста/не за что" },
      { de: "Wasser", ru: "вода" },
      { de: "Brot", ru: "хлеб" },
      { de: "Apfel", ru: "яблоко" },
      { de: "eins", ru: "один" },
      { de: "zwei", ru: "два" },
    ],
    grammar: [
      { title: "Глагол sein", rule: "ich bin, du bist, er/sie/es ist, wir sind, ihr seid, sie sind", ex: ["Ich bin Alex.", "Wir sind aus Russland."] },
      { title: "Порядок слов", rule: "Глагол на 2‑м месте в утверждении.", ex: ["Ich komme aus Berlin."] },
    ],
    listening: [
      { text: "Guten Morgen! Wie geht's? Mir geht es gut, danke.", q: "Что сказал второй говорящий?", a: ["Ему хорошо", "Ему плохо", "Он голоден"], correct: 0 },
    ],
  },
  A2: {
    title: "A2: Повседневность",
    goals: ["Покупки", "Поездки", "Здоровье", "Прошедшее время", "Планы"],
    vocab: [
      { de: "Rechnung", ru: "счёт (в кафе)" },
      { de: "Bahnhof", ru: "вокзал" },
      { de: "Termin", ru: "встреча/запись" },
      { de: "gestern", ru: "вчера" },
      { de: "nächste Woche", ru: "на следующей неделе" },
    ],
    grammar: [
      { title: "Perfekt", rule: "haben/sein + Partizip II", ex: ["Ich habe gekocht.", "Er ist gefahren."] },
      { title: "Модальные глаголы", rule: "können, müssen, wollen, dürfen, sollen, mögen", ex: ["Ich kann schwimmen."] },
    ],
    listening: [
      { text: "Ich habe gestern gearbeitet und dann bin ich nach Hause gefahren.", q: "Что сначала сделал говорящий?", a: ["Поехал домой", "Работал", "Готовил"], correct: 1 },
    ],
  },
  B1: {
    title: "B1: Уверенное общение",
    goals: ["Работа и обучение", "Мнения и аргументы", "Письма и email", "Сложные времена", "Подчинённые предложения"],
    vocab: [
      { de: "Erfahrung", ru: "опыт" },
      { de: "Verantwortung", ru: "ответственность" },
      { de: "beeinflussen", ru: "влиять" },
      { de: "trotzdem", ru: "несмотря на это" },
      { de: "obwohl", ru: "хотя" },
    ],
    grammar: [
      { title: "Nebensätze", rule: "Союзы weil, dass, obwohl. Глагол в конец.", ex: ["Ich bleibe zu Hause, weil ich krank bin."] },
      { title: "Futur I", rule: "werden + Infinitiv", ex: ["Ich werde morgen lernen."] },
    ],
    listening: [
      { text: "Obwohl es regnet, gehe ich spazieren, weil ich frische Luft brauche.", q: "Почему он идёт гулять?", a: ["Потому что любит дождь", "Нужен свежий воздух", "У него встреча"], correct: 1 },
    ],
  },
};

// Simple exam pools per level
const EXAMS = {
  A1: [
    { type: "mc", q: "Как перевести: Danke?", options: ["Спасибо", "Пожалуйста", "Привет"], correct: 0 },
    { type: "fill", q: "Ich ___ Alex.", answer: "bin" },
    { type: "order", q: "Соберите: komme / ich / aus / Berlin", parts: ["komme","ich","aus","Berlin"], answer: "ich komme aus Berlin" },
  ],
  A2: [
    { type: "mc", q: "Perfekt от 'gehen'?", options: ["hat gegangen","ist gegangen","war gegangen"], correct: 1 },
    { type: "fill", q: "Ich ___ gestern gearbeitet.", answer: "habe" },
    { type: "mc", q: "'Termin' это…", options: ["идея","встреча","погода"], correct: 1 },
  ],
  B1: [
    { type: "mc", q: "Выберите союз с обратным порядком: ", options: ["und","weil","aber"], correct: 1 },
    { type: "fill", q: "Ich bleibe zu Hause, ___ ich krank bin.", answer: "weil" },
    { type: "order", q: "Соберите: obwohl / es / regnet / gehe / ich / spazieren", parts: ["obwohl","es","regnet","gehe","ich","spazieren"], answer: "obwohl es regnet gehe ich spazieren" },
  ],
};

// -------------------------------------------------------
// TTS helpers (Web Speech API)
// -------------------------------------------------------
function speak(text, lang = "de-DE") {
  if (!("speechSynthesis" in window)) return;
  const u = new SpeechSynthesisUtterance(text);
  u.lang = lang; u.rate = 0.95; u.pitch = 1;
  speechSynthesis.cancel();
  speechSynthesis.speak(u);
}

// -------------------------------------------------------
// Core components
// -------------------------------------------------------
function Stat({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3">
      <div className="p-2 rounded-2xl bg-muted"><Icon className="w-5 h-5" /></div>
      <div>
        <div className="text-sm text-muted-foreground">{label}</div>
        <div className="font-semibold">{value}</div>
      </div>
    </div>
  );
}

function HeaderBar({ level, setLevel }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <GraduationCap className="w-7 h-7" />
        <div>
          <div className="text-xl font-bold">DeutschMe</div>
          <div className="text-xs text-muted-foreground">Немецкий до B1 — интересно и по‑русски</div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Label className="text-xs text-muted-foreground">Уровень</Label>
        <Select value={level} onValueChange={setLevel}>
          <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="A1">A1</SelectItem>
            <SelectItem value="A2">A2</SelectItem>
            <SelectItem value="B1">B1</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

function Flashcard({ card, onGrade }) {
  const [flipped, setFlipped] = useState(false);
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-2">
        <Badge variant="secondary">Слово</Badge>
        <Button variant="ghost" size="icon" onClick={() => speak(card.de)}><Volume2 className="w-4 h-4"/></Button>
      </div>
      <div className="text-center min-h-[80px] flex items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={flipped ? "ru" : "de"}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="text-2xl font-semibold"
          >
            {flipped ? card.ru : card.de}
          </motion.div>
        </AnimatePresence>
      </div>
      {card.tip && <div className="text-xs text-muted-foreground text-center">Подсказка: {card.tip}</div>}
      <div className="flex gap-2 mt-4 justify-center">
        <Button variant="outline" onClick={() => setFlipped(!flipped)}>{flipped ? "Скрыть" : "Показать перевод"}</Button>
      </div>
      <Separator className="my-4" />
      <div className="text-sm text-muted-foreground mb-2 text-center">Оцени, насколько было легко:</div>
      <div className="grid grid-cols-5 gap-2">
        {["😵","😕","🙂","👍","🧠"].map((emo, i) => (
          <Button key={i} variant="secondary" onClick={() => onGrade(i)}>{emo}</Button>
        ))}
      </div>
    </Card>
  );
}

function GrammarCard({ item }) {
  return (
    <Card className="p-4">
      <CardHeader className="p-0 mb-2">
        <CardTitle className="text-lg">{item.title}</CardTitle>
        <CardDescription className="text-sm">{item.rule}</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <ul className="list-disc pl-5 space-y-1">
          {item.ex.map((e, i) => (
            <li key={i} className="flex items-center gap-2"><Button size="icon" variant="ghost" onClick={() => speak(e)}><Volume2 className="w-4 h-4"/></Button><span>{e}</span></li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

function ListeningTask({ task, onAnswer }) {
  const [played, setPlayed] = useState(false);
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-3"><Ear className="w-4 h-4"/><b>Аудирование</b></div>
      <div className="flex gap-2">
        <Button onClick={() => { speak(task.text); setPlayed(true); }}><Play className="w-4 h-4 mr-2"/>Прослушать</Button>
        {played && <Badge>Слушаем…</Badge>}
      </div>
      <div className="mt-3 font-medium">Вопрос: {task.q}</div>
      <div className="grid md:grid-cols-3 gap-2 mt-3">
        {task.a.map((opt, i) => (
          <Button key={i} variant="secondary" onClick={() => onAnswer(i)}>{opt}</Button>
        ))}
      </div>
    </Card>
  );
}

function OrderTask({ q, parts, onCheck }) {
  const [pool, setPool] = useState(parts);
  const [answer, setAnswer] = useState([]);
  function move(word, fromPool) {
    if (fromPool) {
      setPool(pool.filter(w => w !== word)); setAnswer([...answer, word]);
    } else {
      setAnswer(answer.filter(w => w !== word)); setPool([...pool, word]);
    }
  }
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-2"><Pencil className="w-4 h-4"/><b>Порядок слов</b></div>
      <div className="text-sm text-muted-foreground mb-2">{q}</div>
      <div className="flex flex-wrap gap-2 mb-3">
        {pool.map((w,i)=>(<Button key={i} variant="outline" onClick={()=>move(w,true)}>{w}</Button>))}
      </div>
      <div className="flex flex-wrap gap-2 min-h-[44px] p-2 rounded-2xl bg-muted">
        {answer.map((w,i)=>(<Button key={i} variant="secondary" onClick={()=>move(w,false)}>{w}</Button>))}
      </div>
      <div className="mt-3"><Button onClick={()=>onCheck(answer.join(" "))} className="w-full">Проверить</Button></div>
    </Card>
  );
}

// -------------------------------------------------------
// Main App
// -------------------------------------------------------
export default function App() {
  const [store, setStore] = usePersistentState({
    level: "A1",
    streak: 0,
    xp: 0,
    review: {}, // key: "A1|de" -> {ef, interval, reps, due}
    history: [], // [{date, xp}]
    name: "Студент",
    examResults: {},
    dark: false,
  });

  useEffect(()=>{ document.documentElement.classList.toggle("dark", store.dark); },[store.dark]);

  const setLevel = (l)=> setStore(s=>({ ...s, level: l }));
  const levelData = CURRICULUM[store.level];

  // Flashcards due today
  const dueCards = useMemo(()=>{
    const now = Date.now();
    return levelData.vocab.map(v => ({ ...v, key: `${store.level}|${v.de}` }))
      .filter(v => {
        const sch = store.review[v.key];
        return !sch || !sch.due || sch.due <= now;
      });
  }, [store.level, store.review]);

  const [activeTab, setActiveTab] = useState("dashboard");

  // XP helper
  function addXP(amount) {
    setStore(s=>{
      const today = new Date().toISOString().slice(0,10);
      const history = [...s.history];
      const last = history[history.length-1];
      if (!last || last.date !== today) history.push({ date: today, xp: amount });
      else last.xp += amount;
      return { ...s, xp: s.xp + amount, history };
    });
  }

  // Quiz generator per level
  function makeQuiz(level) {
    const items = [];
    // vocab mc
    const vocab = CURRICULUM[level].vocab;
    for (let i=0;i<Math.min(5,vocab.length);i++){
      const correct = vocab[i];
      const wrong = vocab.filter(v=>v!==correct).sort(()=>0.5-Math.random()).slice(0,2);
      const options = [correct.ru, ...wrong.map(w=>w.ru)].sort(()=>0.5-Math.random());
      items.push({ type:"mc", q:`Перевод: ${correct.de}`, options, answer: correct.ru });
    }
    // grammar fill
    const gr = CURRICULUM[level].grammar[0];
    if (gr) items.push({ type:"fill", q:`Вставьте пропущенное слово (${gr.title})`, answer: gr.ex[0].split(" ")[1] ?? "" });
    return items;
  }

  const quiz = useMemo(()=> makeQuiz(store.level), [store.level]);

  // Exam state
  const [examIdx, setExamIdx] = useState(0);
  const [examAns, setExamAns] = useState([]);
  const examPool = EXAMS[store.level];

  function gradeExam() {
    let score = 0;
    examPool.forEach((item, i) => {
      const a = examAns[i];
      if (item.type === "mc" && a === item.correct) score++;
      if (item.type === "fill" && String(a||"").trim().toLowerCase() === item.answer) score++;
      if (item.type === "order" && String(a||"").trim().toLowerCase() === item.answer) score++;
    });
    const percent = Math.round((score / examPool.length) * 100);
    setStore(s => ({ ...s, examResults: { ...s.examResults, [s.level]: percent }}));
    addXP(50);
    return percent;
  }

  // Chart data
  const chartData = (store.history.length? store.history: [{date:new Date().toISOString().slice(0,10), xp: 0}]).map(h=>({ date:h.date.slice(5), xp:h.xp }));

  // UI
  return (
    <div className="min-h-screen bg-background text-foreground p-5 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <HeaderBar level={store.level} setLevel={setLevel} />

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-6 gap-2">
            <TabsTrigger value="dashboard"><Rocket className="w-4 h-4 mr-2"/>Главная</TabsTrigger>
            <TabsTrigger value="learn"><BookOpen className="w-4 h-4 mr-2"/>Уроки</TabsTrigger>
            <TabsTrigger value="practice"><Repeat className="w-4 h-4 mr-2"/>Практика</TabsTrigger>
            <TabsTrigger value="quiz"><HelpCircle className="w-4 h-4 mr-2"/>Тест</TabsTrigger>
            <TabsTrigger value="exam"><Trophy className="w-4 h-4 mr-2"/>Экзамен</TabsTrigger>
            <TabsTrigger value="progress"><BarChart3 className="w-4 h-4 mr-2"/>Прогресс</TabsTrigger>
          </TabsList>

          {/* DASHBOARD */}
          <TabsContent value="dashboard" className="mt-4">
            <div className="grid md:grid-cols-3 gap-4">
              <Card className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-muted-foreground">Добро пожаловать</div>
                    <div className="text-xl font-bold">{store.name}</div>
                  </div>
                  <Badge variant="secondary">{store.level}</Badge>
                </div>
                <Separator className="my-4" />
                <div className="grid gap-3">
                  <Stat icon={Clock} label="Полоса XP" value={`${store.xp} XP`} />
                  <Stat icon={RefreshCw} label="Карточек к повтору" value={dueCards.length} />
                  <Stat icon={Trophy} label="Результат экзамена" value={(store.examResults[store.level] ?? "—") + (store.examResults[store.level]!==undefined? "%":"")} />
                </div>
              </Card>

              <Card className="p-5 col-span-2">
                <CardTitle className="mb-2">Цели уровня</CardTitle>
                <div className="flex flex-wrap gap-2">
                  {levelData.goals.map((g,i)=>(<Badge key={i} variant="outline">{g}</Badge>))}
                </div>
                <Separator className="my-4" />
                <div className="text-sm text-muted-foreground mb-2">Недельная цель XP</div>
                <Slider defaultValue={[150]} max={300} step={10} className="mb-2" />
                <Progress value={Math.min(100, (store.xp%150)/1.5)} />
              </Card>
            </div>
          </TabsContent>

          {/* LEARN */}
          <TabsContent value="learn" className="mt-4">
            <div className="grid md:grid-cols-3 gap-4">
              <Card className="p-5">
                <CardTitle className="mb-2">Слова</CardTitle>
                <div className="space-y-3">
                  {levelData.vocab.map((v,i)=> (
                    <div key={i} className="flex items-center justify-between p-2 rounded-xl bg-muted">
                      <div>
                        <div className="font-medium">{v.de}</div>
                        <div className="text-xs text-muted-foreground">{v.ru}</div>
                      </div>
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" onClick={()=>speak(v.de)}><Volume2 className="w-4 h-4"/></Button>
                        <Badge variant="secondary">{store.level}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              <div className="md:col-span-2 grid gap-4">
                <Card className="p-5">
                  <CardTitle className="mb-2">Грамматика</CardTitle>
                  <div className="grid md:grid-cols-2 gap-3">
                    {levelData.grammar.map((g,i)=>(<GrammarCard key={i} item={g}/>))}
                  </div>
                </Card>

                <Card className="p-5">
                  <CardTitle className="mb-2">Аудирование</CardTitle>
                  <div className="grid gap-3">
                    {levelData.listening.map((t,i)=>(
                      <ListeningTask key={i} task={t} onAnswer={(ans)=>{
                        const ok = ans===t.correct; addXP(ok?10:2);
                        alert(ok?"Отлично!":"Неплохо, посмотрим ещё раз.");
                      }} />
                    ))}
                  </div>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* PRACTICE (SRS) */}
          <TabsContent value="practice" className="mt-4">
            <div className="grid md:grid-cols-2 gap-4">
              <Card className="p-5">
                <CardTitle className="mb-2">Повторение по карточкам</CardTitle>
                {dueCards.length === 0 ? (
                  <div className="text-muted-foreground">Сегодня повторений нет — супер! Переключайтесь на уроки или тест.</div>
                ) : (
                  <Flashcard card={dueCards[0]} onGrade={(q)=>{
                    const key = dueCards[0].key;
                    const curr = store.review[key] || {};
                    const updated = scheduleCard(curr, q); // q: 0..4
                    setStore(s=>({ ...s, review: { ...s.review, [key]: updated }}));
                    addXP(q>=3?8:3);
                  }}/>
                )}
              </Card>

              <Card className="p-5">
                <CardTitle className="mb-2">Мини‑практика (порядок слов)</CardTitle>
                <OrderTask q={EXAMS[store.level].find(x=>x.type==='order')?.q || "Соберите предложение"}
                  parts={EXAMS[store.level].find(x=>x.type==='order')?.parts || ["ich","bin","hier"]}
                  onCheck={(ans)=>{
                    const correct = EXAMS[store.level].find(x=>x.type==='order')?.answer || "";
                    const ok = ans.trim().toLowerCase()===correct;
                    addXP(ok?12:4); alert(ok?"Правильно!":"Почти. Правильный вариант: "+correct);
                  }} />
              </Card>
            </div>
          </TabsContent>

          {/* QUIZ */}
          <TabsContent value="quiz" className="mt-4">
            <div className="grid md:grid-cols-3 gap-4">
              <Card className="p-5 md:col-span-2">
                <CardTitle className="mb-4">Быстрый тест уровня {store.level}</CardTitle>
                <div className="space-y-4">
                  {quiz.map((item, idx) => (
                    <div key={idx} className="p-3 rounded-2xl bg-muted">
                      <div className="font-medium mb-2">{idx+1}. {item.q}</div>
                      {item.type === "mc" && (
                        <div className="grid sm:grid-cols-3 gap-2">
                          {item.options.map((o,i)=>(
                            <Button key={i} variant="secondary" onClick={()=>{ addXP(o===item.answer?6:2); }}>{o}</Button>
                          ))}
                        </div>
                      )}
                      {item.type === "fill" && (
                        <FillAnswer answer={item.answer} onScore={(ok)=>addXP(ok?6:2)} />
                      )}
                    </div>
                  ))}
                </div>
              </Card>
              <Card className="p-5">
                <CardTitle className="mb-2">Подсказки</CardTitle>
                <ul className="list-disc pl-5 text-sm space-y-2 text-muted-foreground">
                  <li>Слушайте вслух немецкие фразы — кнопка динамика рядом с примерами.</li>
                  <li>Пишите короткие заметки по грамматике своими словами.</li>
                  <li>Повторяйте карточки ежедневно — алгоритм планирует оптимальные интервалы.</li>
                </ul>
              </Card>
            </div>
          </TabsContent>

          {/* EXAM */}
          <TabsContent value="exam" className="mt-4">
            <Card className="p-5">
              <div className="flex items-center justify-between">
                <CardTitle>Экзамен {store.level}</CardTitle>
                <Badge variant="secondary">{examIdx+1}/{examPool.length}</Badge>
              </div>
              <Separator className="my-4" />
              <ExamItem item={examPool[examIdx]} onAnswer={(ans)=>{
                setExamAns(prev=>{ const next=[...prev]; next[examIdx]=ans; return next; });
                if (examIdx < examPool.length-1) setExamIdx(examIdx+1);
              }} />
              <div className="flex justify-between mt-4">
                <Button variant="outline" onClick={()=>setExamIdx(Math.max(0, examIdx-1))}>Назад</Button>
                {examIdx === examPool.length-1 ? (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button className="">Завершить</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Показать результат?</DialogTitle>
                        <DialogDescription>Ответы отправятся на проверку.</DialogDescription>
                      </DialogHeader>
                      <Button onClick={()=>{
                        const p = gradeExam();
                        alert(`Результат: ${p}%`);
                      }} className="w-full">Проверить</Button>
                    </DialogContent>
                  </Dialog>
                ) : (
                  <Button onClick={()=>setExamIdx(examIdx+1)}>Дальше</Button>
                )}
              </div>
            </Card>
          </TabsContent>

          {/* PROGRESS */}
          <TabsContent value="progress" className="mt-4">
            <div className="grid md:grid-cols-2 gap-4">
              <Card className="p-5">
                <CardTitle className="mb-2">Активность по дням</CardTitle>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="xp" dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              <Card className="p-5">
                <CardTitle className="mb-2">Настройки</CardTitle>
                <div className="grid gap-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Ночной режим</div>
                      <div className="text-xs text-muted-foreground">Бережём глаза вечером</div>
                    </div>
                    <Switch checked={store.dark} onCheckedChange={(v)=>setStore(s=>({...s, dark:v}))} />
                  </div>
                  <div>
                    <Label className="text-sm">Имя в приложении</Label>
                    <Input value={store.name} onChange={(e)=>setStore(s=>({...s, name:e.target.value}))} />
                  </div>
                  <div className="text-xs text-muted-foreground">Данные хранятся локально (LocalStorage). Можно начать на A1 и дойти до B1 — уроки, практика, тесты и экзамены включены.</div>
                </div>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function FillAnswer({ answer, onScore }){
  const [val, setVal] = useState("");
  return (
    <div className="flex gap-2">
      <Input placeholder="Ваш ответ" value={val} onChange={e=>setVal(e.target.value)} />
      <Button onClick={()=>{ const ok=val.trim().toLowerCase()===answer; onScore(ok); alert(ok?"Верно!":"Правильный ответ: "+answer); }}>OK</Button>
    </div>
  );
}

function ExamItem({ item, onAnswer }){
  if (!item) return null;
  if (item.type === "mc") {
    return (
      <div>
        <div className="font-medium mb-3">{item.q}</div>
        <div className="grid sm:grid-cols-3 gap-2">
          {item.options.map((o,i)=>(<Button key={i} variant="secondary" onClick={()=>onAnswer(i)}>{o}</Button>))}
        </div>
      </div>
    );
  }
  if (item.type === "fill") {
    return (
      <div>
        <div className="font-medium mb-3">{item.q}</div>
        <FillAnswer answer={item.answer} onScore={()=>{}} />
      </div>
    );
  }
  if (item.type === "order") {
    return (
      <OrderTask q={item.q} parts={item.parts} onCheck={(ans)=>onAnswer(ans)} />
    );
  }
  return null;
}
