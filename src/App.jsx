import React, { useState, useEffect } from 'react';
import { 
  Plane, Train, MapPin, Utensils, Hotel, Camera, Car, Sun, 
  ShoppingBag, Mountain, IceCream, Edit3, Save, Share, 
  FileText, Link as LinkIcon, Plus, X, Wallet, Globe, Languages,
  Loader2, Trash2, Image as ImageIcon, Check, UploadCloud, 
  CloudRain, Cloud, Wind, Umbrella, Shirt, CloudSun, RefreshCw, Wifi, AlertTriangle,
  Bug
} from 'lucide-react';

// --- Firebase Imports ---
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInAnonymously, 
  onAuthStateChanged
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  onSnapshot, 
  setDoc, 
  updateDoc
} from 'firebase/firestore';

// --- 1. Error Boundary (防白屏護盾) ---
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ error, errorInfo });
    console.error("App Crash:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-900 text-white p-8 flex flex-col items-center justify-center">
          <div className="bg-red-900/30 border-2 border-red-500 rounded-2xl p-6 max-w-lg w-full">
            <div className="flex items-center gap-3 mb-4 text-red-400">
              <Bug size={32} />
              <h1 className="text-2xl font-bold">程式發生錯誤</h1>
            </div>
            <p className="mb-4 text-gray-300">請截圖此畫面給我，以便除錯。</p>
            <div className="bg-black/50 p-4 rounded-lg overflow-auto max-h-60 font-mono text-xs mb-4 border border-red-500/30">
              <p className="text-red-300 font-bold mb-2">{this.state.error && this.state.error.toString()}</p>
            </div>
            <button onClick={() => window.location.reload()} className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-bold">重新整理</button>
          </div>
        </div>
      );
    }
    return this.props.children; 
  }
}

// ============================================================================
// ⚠️⚠️⚠️ 部署前請務必填寫此處！ ⚠️⚠️⚠️
// 請前往 Firebase Console -> Project Settings -> General -> Your apps
// 複製您的設定貼到下方：
// ============================================================================
const firebaseConfig = {
  apiKey: "AIzaSyDoxUP6SH8tPVifz_iSS1PItBuoImIqVBk",
  authDomain: "tokyo-izu.firebaseapp.com",
  projectId: "tokyo-izu",
  storageBucket: "tokyo-izu.firebasestorage.app",
  messagingSenderId: "291700650556",
  appId: "1:291700650556:web:82303d66deaa02e93d4939"
};

// 統一使用全域常數 APP_ID
const app = initializeApp(firebaseConfig);
// ============================================================================

const LOCATIONS = {
    tokyo: { lat: 35.6895, lon: 139.6917 },
    izu: { lat: 34.9714, lon: 139.0925 },
    shuzenji: { lat: 34.9773, lon: 138.9343 }
};

const INITIAL_ITINERARY = [
  {
    date: "11/28 (五)",
    dayLabel: "Day 1",
    location: "東京五反田",
    geoKey: "tokyo", 
    desc: "出發東京 & 飯店 Check-in",
    outfit: "洋蔥式穿搭，進出室內溫差大，建議帶件薄外套或風衣。",
    events: [
      { id: 'd1-1', time: "08:00", endTime: "12:20", type: "flight", title: "KHH 高雄", dest: "NRT 東京", duration: "3h 20m", flightNo: "CI102", terminal: "T1", bg: "bg-blue-600", category: "flight", notes: "記得提前2小時抵達機場，檢查護照效期。" },
      { id: 'd1-2', time: "14:00", type: "transport", title: "前往市區", sub: "成田特快 / Skyliner", iconType: "train", category: "transport", notes: "建議購買外國人優惠票券，約 45 分鐘抵達市區。" },
      { id: 'd1-3', time: "15:30", type: "hotel", title: "Check-in: 三井花園五反田", sub: "大浴場 / 頂樓露台 View", iconType: "hotel", category: "hotel", notes: "從五反田站步行約 3 分鐘。頂樓有大浴場可泡湯消除疲勞。" },
      { id: 'd1-4', time: "16:30", type: "activity", title: "五反田周邊逛街", sub: "Tokyu Square / 唐吉軻德 / UNIQLO", iconType: "shopping", category: "activity", notes: "車站直結 Tokyu Square，附近有大型唐吉軻德方便採買補給品。" },
      { id: 'd1-5', time: "17:30", type: "food", title: "晚餐：黑雞ファニー", sub: "鹿兒島土雞料理 / 雞刺身拼盤", iconType: "food", category: "food", notes: "五反田人氣店！必點鹿兒島直送『黑薩摩雞』刺身與炭火燒烤，口感Q彈鮮甜。" }
    ]
  },
  {
    date: "11/29 (六)",
    dayLabel: "Day 2",
    location: "伊豆",
    geoKey: "izu",
    desc: "特急踴子號 & 伊豆自駕",
    outfit: "伊豆海邊風較大，體感溫度較低。建議穿著防風外套，並準備圍巾。",
    events: [
      { id: 'd2-1', time: "10:38", type: "transport", title: "特急踴子號 (Odoriko)", sub: "品川站 -> 伊東站 (12:13抵達)", iconType: "train", category: "transport", notes: "經典的伊豆特急列車，沿途可欣賞相模灣海景。" },
      { id: 'd2-2', time: "13:00", type: "transport", title: "租車出發", sub: "開始伊豆自駕之旅", iconType: "car", category: "transport", notes: "取車前請確認駕照日文譯本與護照。檢查車體刮痕。" },
      { id: 'd2-3', time: "14:00", type: "activity", title: "大室山登山纜車", sub: "眺望富士山 / 淺間神社", iconType: "mountain", category: "activity", notes: "宛如抹茶布丁的死火山。搭乘纜車上山頂，天氣好可清楚看見富士山與伊豆七島。" },
      { id: 'd2-4', time: "16:00", type: "activity", title: "城崎海岸門脇吊橋", sub: "斷崖絕壁海景", iconType: "camera", category: "activity", notes: "長48公尺、高23公尺的驚險吊橋。下方是洶湧的海浪與熔岩海岸。" },
      { id: 'd2-5', time: "18:00", type: "food", title: "晚餐：網元料理 德造丸", sub: "名物：金目鯛漁師煮", iconType: "food", category: "food", notes: "伊豆必吃！以秘傳濃郁醬汁燉煮的『金目鯛』，魚肉細緻肥美，非常下飯。" },
      { id: 'd2-6', time: "20:00", type: "hotel", title: "入住：銀水莊", sub: "全天候 Lounge 服務", iconType: "hotel", category: "hotel", notes: "享受飯店設施，Lounge 提供免費飲品與點心。別忘了去泡露天溫泉聽海浪聲。" }
    ]
  },
  {
    date: "11/30 (日)",
    dayLabel: "Day 3",
    location: "修善寺",
    geoKey: "shuzenji",
    desc: "芥末冰淇淋 & 和服散策",
    outfit: "山區早晨可能微涼，有30%機率陣雨，建議攜帶折疊傘。",
    events: [
      { id: 'd3-1', time: "10:30", type: "food", title: "道之驛 天城越え", sub: "必吃：芥末霜淇淋", iconType: "icecream", category: "food", notes: "《伊豆舞孃》場景地。必試『現磨芥末霜淇淋』，微辣口感搭配香草冰淇淋意外絕配！" },
      { id: 'd3-2', time: "12:00", type: "food", title: "道之驛 伊豆月ヶ瀬", sub: "午餐：整隻螃蟹咖哩烏龍麵", iconType: "food", category: "food", notes: "伊豆最新的道之驛。特色是使用整隻螃蟹熬煮的濃郁咖哩烏龍麵，還有豬肉丼。" },
      { id: 'd3-3', time: "13:00", type: "activity", title: "修善寺和服體驗", sub: "竹林小徑 / 戀橋拍照", iconType: "camera", category: "activity", notes: "有『伊豆小京都』之稱。穿著和服在竹林小徑散步，在紅葉與桂橋上拍照非常有氛圍。" },
      { id: 'd3-4', time: "15:00", type: "hotel", title: "入住：新井旅館", sub: "國家登錄有形文化財", iconType: "hotel", category: "hotel", notes: "明治時代建立的百年旅館。必體驗『天平大浴場』，全檜木建造，被列為登錄有形文化財。" },
      { id: 'd3-5', time: "18:00", type: "food", title: "旅館懷石料理", sub: "體驗傳統日式晚餐", iconType: "food", category: "food", notes: "精緻的會席料理，使用伊豆當地時令食材。" }
    ]
  },
  {
    date: "12/01 (一)",
    dayLabel: "Day 4",
    location: "回東京",
    geoKey: "tokyo",
    desc: "藍寶石踴子號 & 東京聖誕燈飾",
    outfit: "天氣轉晴回暖，適合戶外活動，穿著舒適的走路鞋。",
    events: [
      { id: 'd4-1', time: "11:00", type: "food", title: "沿途休息站午餐", sub: "簡單用餐", iconType: "food", category: "food", notes: "在開車回程途中尋找特色休息站用餐。" },
      { id: 'd4-2', time: "14:00", type: "transport", title: "還車", sub: "伊東站周邊還車", iconType: "car", category: "transport", notes: "記得加滿油再還車。檢查車內是否有遺落物品。" },
      { id: 'd4-3', time: "15:10", endTime: "16:49", type: "flight", title: "伊東", dest: "東京", duration: "1h 39m", flightNo: "Saphir", terminal: "豪華", bg: "bg-teal-700", category: "transport", notes: "【藍寶石踴子號】全車綠色車廂以上的頂級觀光列車。設有可看海景的麵食酒吧，建議提前預約。" }, 
      { id: 'd4-4', time: "17:30", type: "hotel", title: "入住：淺草豪景飯店別館六區", sub: "10F Lounge 免費點心", iconType: "hotel", category: "hotel", notes: "位於淺草核心地帶。房客可免費使用 10 樓 Lounge，提供淺草老店點心與飲品。" },
      { id: 'd4-5', time: "19:00", type: "activity", title: "東京車站 丸之內", sub: "2025最大規模聖誕市集", iconType: "map", category: "activity", notes: "漫步丸之內仲通，欣賞著名的香檳金聖誕燈飾與市集，感受濃厚聖誕氣氛。" }
    ]
  },
  {
    date: "12/02 (二)",
    dayLabel: "Day 5",
    location: "返台",
    geoKey: "tokyo",
    desc: "淺草美食地圖 & 快樂回家",
    outfit: "多雲天氣，稍微偏涼，建議多層次穿搭以應對室內外溫差。",
    events: [
      { id: 'd5-1', time: "09:00", type: "activity", title: "淺草寺 & 雷門", sub: "參拜 / 抽籤 / 拍大燈籠", iconType: "map", category: "activity", notes: "東京最古老寺廟。建議早點去避開人潮，要在雷門大燈籠下拍照留念。" },
      { id: 'd5-2', time: "10:00", type: "food", title: "仲見世通美食巡禮", sub: "淺草炸肉餅 / 菠蘿麵包", iconType: "food", category: "food", notes: "必吃清單：淺草炸肉餅、花月堂菠蘿麵包、吉備糰子。邊走邊吃要注意店家規定。" },
      { id: 'd5-3', time: "11:30", type: "food", title: "午餐：淺草今半", sub: "百年壽喜燒老店", iconType: "food", category: "food", notes: "明治28年創業，頂級黑毛和牛壽喜燒。午間套餐CP值較高，建議排隊或預約。" },
      { id: 'd5-4', time: "14:00", type: "transport", title: "機場包車接送", sub: "前往成田機場 T2", iconType: "car", category: "transport", notes: "預約好的包車會在飯店門口等候。車程約 60-80 分鐘。" },
      { id: 'd5-5', time: "18:25", endTime: "22:05", type: "flight", title: "NRT 東京", dest: "KHH 高雄", duration: "4h 40m", flightNo: "CI127", terminal: "T2", bg: "bg-pink-600", category: "flight", notes: "快樂賦歸！記得在機場免稅店做最後衝刺。" }
    ]
  }
];

const INITIAL_CHECKLIST = [{ id: 1, text: "護照", checked: false }, { id: 2, text: "機票", checked: false }];

const getWeatherIcon = (c) => c===0?<Sun size={14}/>:c<3?<CloudSun size={14}/>:c<60?<Cloud size={14}/>:<CloudRain size={14}/>;
const WeatherStrip = ({ hourlyWeather, isLoading, isError }) => (
    <div className="flex space-x-4 overflow-x-auto pb-2 no-scrollbar mt-3 min-h-[4rem]">
        {isLoading ? <div className="text-xs text-gray-400 w-full text-center"><Loader2 className="animate-spin inline mr-1"/>載入中...</div> : 
         isError ? <div className="text-xs text-red-300 w-full text-center"><Wifi className="inline mr-1"/>無法連線</div> :
         hourlyWeather.map((w, i) => (
            <div key={i} className="flex flex-col items-center min-w-[3rem] bg-white/10 rounded-lg p-2 flex-shrink-0 border border-white/5">
                <span className="text-[10px] text-gray-300">{w.time}</span>
                <div className="text-yellow-300 my-1">{getWeatherIcon(w.code)}</div>
                <span className="text-xs font-bold">{w.temp}°</span>
            </div>
         ))}
    </div>
);

const TravelApp = () => {
  const [activeTab, setActiveTab] = useState('itinerary');
  const [activeDate, setActiveDate] = useState(0);
  const [user, setUser] = useState(null);
  const [isSyncing, setIsSyncing] = useState(true);
  const [liveWeather, setLiveWeather] = useState({ temp: '--', range: '--', hourly: [] });
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState(false);
  const [itineraryData, setItineraryData] = useState(INITIAL_ITINERARY);
  const [expenses, setExpenses] = useState([]);
  const [checklist, setChecklist] = useState(INITIAL_CHECKLIST);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  
  const [newExpenseName, setNewExpenseName] = useState('');
  const [newExpenseAmount, setNewExpenseAmount] = useState('');
  const [newExpensePayer, setNewExpensePayer] = useState('Jay');
  const [newExpenseDate, setNewExpenseDate] = useState(new Date().toISOString().split('T')[0]);
  const [newItemText, setNewItemText] = useState('');

  const exchangeRate = 0.215;
  const payers = ["Jay", "Tracy", "Emma", "IF"];

  // Firebase Init
  const [db, setDb] = useState(null);
  const isConfigValid = firebaseConfig.apiKey && !firebaseConfig.apiKey.includes("YOUR_API_KEY");

  useEffect(() => {
    if (!isConfigValid) {
        setIsSyncing(false);
        return;
    }
    try {
        const app = initializeApp(firebaseConfig);
        const auth = getAuth(app);
        const firestore = getFirestore(app);
        setDb(firestore);
        signInAnonymously(auth).catch(err => console.error("Auth Fail:", err));
        onAuthStateChanged(auth, setUser);
    } catch (e) {
        console.error("Firebase Init Error:", e);
        setIsSyncing(false);
    }
  }, []);

  // Sync Logic
  useEffect(() => {
    if (!user || !db) return;
    
    // 使用統一的 APP_ID 常數
    const itineraryRef = doc(db, 'trips', APP_ID, 'data', 'itinerary');
    
    const unsub = onSnapshot(itineraryRef, (snap) => {
        setIsSyncing(false);
        if (snap.exists() && snap.data().data) setItineraryData(snap.data().data);
        else setDoc(itineraryRef, { data: INITIAL_ITINERARY });
    });
    return () => unsub();
  }, [user, db]);

  // Sync Expenses
  useEffect(() => {
    if (!user || !db) return;
    const expensesRef = doc(db, 'trips', APP_ID, 'data', 'expenses');
    const unsub = onSnapshot(expensesRef, (snap) => {
      if (snap.exists()) setExpenses(snap.data().list || []);
    });
    return () => unsub();
  }, [user, db]);

  // Sync Checklist
  useEffect(() => {
    if (!user || !db) return;
    const checklistRef = doc(db, 'trips', APP_ID, 'data', 'checklist');
    const unsub = onSnapshot(checklistRef, (snap) => {
      if (snap.exists()) setChecklist(snap.data().list || INITIAL_CHECKLIST);
      else setDoc(checklistRef, { list: INITIAL_CHECKLIST });
    });
    return () => unsub();
  }, [user, db]);

  // Weather API
  useEffect(() => {
      const fetchW = async () => {
          setWeatherLoading(true);
          try {
              const day = (itineraryData[activeDate] || INITIAL_ITINERARY[activeDate]);
              const loc = LOCATIONS[day.geoKey || 'tokyo'];
              const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${loc.lat}&longitude=${loc.lon}&current=temperature_2m,weather_code&hourly=temperature_2m,weather_code&timezone=Asia%2FTokyo&forecast_days=2`);
              const data = await res.json();
              const nowH = new Date().getHours();
              const hourly = data.hourly.time.slice(nowH, nowH+24).map((t,i)=>({
                  time: t.split('T')[1],
                  temp: Math.round(data.hourly.temperature_2m[nowH+i]),
                  code: data.hourly.weather_code[nowH+i]
              })).filter((_,i)=>i%2===0);
              setLiveWeather({
                  temp: `${Math.round(data.current.temperature_2m)}°`,
                  hourly: hourly,
                  conditionCode: data.current.weather_code
              });
          } catch(e) { console.error(e); setWeatherError(true); }
          finally { setWeatherLoading(false); }
      };
      if (activeTab === 'itinerary') fetchW();
  }, [activeDate, activeTab]);

  // Handlers
  const handleEventClick = (event, dateIndex) => {
    if (!event) return;
    setEditingEvent({ ...event, dateIndex });
    setIsModalOpen(true);
  };

  const handleSaveEvent = async () => {
    if (!editingEvent) return;
    const newItinerary = JSON.parse(JSON.stringify(itineraryData));
    if (newItinerary[editingEvent.dateIndex]) {
        const dayEvents = newItinerary[editingEvent.dateIndex].events;
        const eventIndex = dayEvents.findIndex(e => e.id === editingEvent.id);
        if (eventIndex !== -1) {
          dayEvents[eventIndex] = editingEvent; 
          setItineraryData(newItinerary); 
          if (db) {
            const itineraryRef = doc(db, 'trips', APP_ID, 'data', 'itinerary');
            await updateDoc(itineraryRef, { data: newItinerary });
          }
        }
    }
    setIsModalOpen(false);
  };

  const handleDeleteEvent = async () => {
      if (!editingEvent || !confirm("確定要刪除這個行程嗎？")) return;
      const newItinerary = JSON.parse(JSON.stringify(itineraryData));
      if (newItinerary[editingEvent.dateIndex]) {
          const dayEvents = newItinerary[editingEvent.dateIndex].events;
          const updatedEvents = dayEvents.filter(e => e.id !== editingEvent.id);
          newItinerary[editingEvent.dateIndex].events = updatedEvents;
          setItineraryData(newItinerary);
          if (db) {
            const itineraryRef = doc(db, 'trips', APP_ID, 'data', 'itinerary');
            await updateDoc(itineraryRef, { data: newItinerary });
          }
      }
      setIsModalOpen(false);
  };

  const handleImageUpload = (e) => {
      const file = e.target.files[0];
      if (file) {
          if (file.size > 800 * 1024) { 
              alert("圖片太大了！請使用小於 800KB 的圖片。");
              return;
          }
          const reader = new FileReader();
          reader.onloadend = () => {
              setEditingEvent({ ...editingEvent, image: reader.result });
          };
          reader.readAsDataURL(file);
      }
  };

  const handleAddChecklistItem = async () => {
      if (!newItemText.trim()) return;
      const newItem = { id: Date.now(), text: newItemText, checked: false };
      const updatedList = [newItem, ...checklist];
      setChecklist(updatedList);
      setNewItemText('');
      if (db) {
        const checklistRef = doc(db, 'trips', APP_ID, 'data', 'checklist');
        await setDoc(checklistRef, { list: updatedList }, { merge: true });
      }
  };

  const toggleChecklistItem = async (id) => {
      const updatedList = checklist.map(item => 
          item.id === id ? { ...item, checked: !item.checked } : item
      );
      setChecklist(updatedList);
      if (db) {
        const checklistRef = doc(db, 'trips', APP_ID, 'data', 'checklist');
        await setDoc(checklistRef, { list: updatedList }, { merge: true });
      }
  };

  const deleteChecklistItem = async (id) => {
      if(!confirm("刪除此項目？")) return;
      const updatedList = checklist.filter(item => item.id !== id);
      setChecklist(updatedList);
      if (db) {
        const checklistRef = doc(db, 'trips', APP_ID, 'data', 'checklist');
        await setDoc(checklistRef, { list: updatedList }, { merge: true });
      }
  };

  const handleAddExpense = async () => {
    if (newExpenseName && newExpenseAmount && newExpenseDate) {
      const newExpense = { 
        name: newExpenseName, 
        amount: parseInt(newExpenseAmount), 
        payer: newExpensePayer,
        date: newExpenseDate,
        timestamp: new Date().toISOString()
      };
      const updatedExpenses = [...expenses, newExpense];
      setExpenses(updatedExpenses);
      if (db) {
        const expensesRef = doc(db, 'trips', APP_ID, 'data', 'expenses');
        await setDoc(expensesRef, { list: updatedExpenses }, { merge: true });
      }
      setNewExpenseName('');
      setNewExpenseAmount('');
    }
  };

  const exportToCSV = () => {
    const BOM = "\uFEFF"; 
    const headers = "日期,項目,金額 (JPY),付款人,約合台幣 (TWD)\n";
    const rows = expenses.map(e => {
      const twd = Math.round(e.amount * exchangeRate);
      const dateStr = e.date || '';
      return `${dateStr},${e.name},${e.amount},${e.payer},${twd}`;
    }).join("\n");
    const csvContent = "data:text/csv;charset=utf-8," + BOM + headers + rows;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "東京之旅_記帳表.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleTranslateClick = () => {
    window.open("https://apps.apple.com/tw/app/%E7%BF%BB%E8%AD%AF/id1514844618", "_blank");
  };

  if (!isConfigValid) {
      return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4 text-white">
            <div className="bg-red-900/50 border border-red-500 p-6 rounded-xl text-center max-w-sm">
                <AlertTriangle size={48} className="mx-auto mb-4 text-red-400"/>
                <h2 className="text-xl font-bold mb-2">設定未完成</h2>
                <p className="text-sm text-gray-300">請在程式碼中填入 Firebase 設定，App 才能運作。</p>
            </div>
        </div>
      );
  }

  const currentDay = itineraryData[activeDate] || INITIAL_ITINERARY[activeDate];

  const EditModal = () => {
    if (!isModalOpen || !editingEvent) return null;

    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none px-4 select-none">
        <div 
          className="absolute inset-0 bg-black/70 backdrop-blur-sm pointer-events-auto transition-opacity" 
          onClick={() => setIsModalOpen(false)}
        ></div>
        
        <div className="bg-[#fcfaf5] w-full max-w-sm rounded-xl shadow-2xl pointer-events-auto transform transition-transform overflow-hidden animate-in fade-in zoom-in duration-200 border-2 border-[#d4af37]">
          <div className="flex justify-between items-center px-5 py-4 border-b border-gray-200 bg-white">
            <h3 className="text-lg font-bold text-gray-800 tracking-wide font-serif">
              行程編輯
            </h3>
            <button 
                onClick={handleDeleteEvent} 
                className="flex items-center gap-1 text-red-500 hover:text-red-700 text-sm font-medium px-2 py-1 rounded hover:bg-red-50 transition-colors"
            >
              <Trash2 size={14} /> 刪除
            </button>
          </div>

          <div className="p-5 space-y-5 bg-[#fffdf9]">
            <div className="flex gap-4">
               <div className="flex-1">
                <label className="text-xs text-[#8c8c8c] font-medium mb-1 block">時間</label>
                <input 
                  type="text" 
                  value={editingEvent.time} 
                  onChange={e => setEditingEvent({...editingEvent, time: e.target.value})}
                  className="w-full bg-transparent border-b border-[#dcdcdc] py-2 text-xl font-serif text-[#4a4a4a] focus:border-[#d4af37] focus:outline-none placeholder-gray-300"
                />
               </div>
               <div className="flex-1">
                <label className="text-xs text-[#8c8c8c] font-medium mb-1 block">分類</label>
                <div className="relative">
                    <select 
                      value={editingEvent.category || 'activity'}
                      onChange={e => {
                          const cat = e.target.value;
                          const iconType = cat === 'transport' ? 'train' : cat === 'food' ? 'food' : cat === 'hotel' ? 'hotel' : 'camera';
                          setEditingEvent({...editingEvent, category: cat, iconType: iconType});
                      }}
                      className="w-full bg-transparent border-b border-[#dcdcdc] py-2 text-base text-[#4a4a4a] focus:border-[#d4af37] focus:outline-none appearance-none font-serif"
                    >
                        {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                    <div className="absolute right-0 top-3 pointer-events-none text-gray-400">▼</div>
                </div>
               </div>
            </div>

            <div>
              <label className="text-xs text-[#8c8c8c] font-medium mb-1 block">標題</label>
              <input 
                type="text" 
                value={editingEvent.title} 
                onChange={e => setEditingEvent({...editingEvent, title: e.target.value})}
                className="w-full bg-transparent border-b border-[#dcdcdc] py-2 text-lg font-bold text-[#2a2a2a] focus:border-[#d4af37] focus:outline-none font-serif"
              />
            </div>

            <div>
              <label className="text-xs text-[#8c8c8c] font-medium mb-1 block">地圖連結</label>
              <input 
                type="text" 
                placeholder="https://maps.app.goo.gl/..." 
                value={editingEvent.mapLink || ''} 
                onChange={e => setEditingEvent({...editingEvent, mapLink: e.target.value})}
                className="w-full bg-transparent border-b border-[#dcdcdc] py-2 text-sm text-[#5a8bbd] focus:border-[#d4af37] focus:outline-none placeholder-gray-300"
              />
            </div>

            <div>
              <label className="text-xs text-[#8c8c8c] font-medium mb-1 block">備註</label>
              <textarea 
                rows={3}
                placeholder="備註事項..." 
                value={editingEvent.notes || ''} 
                onChange={e => setEditingEvent({...editingEvent, notes: e.target.value})}
                className="w-full bg-transparent border-b border-[#dcdcdc] py-2 text-base text-[#4a4a4a] focus:border-[#d4af37] focus:outline-none resize-none placeholder-gray-300 font-serif"
              />
            </div>

            <div>
               <label className="text-xs text-[#8c8c8c] font-medium mb-2 block">圖片</label>
               <div className="flex items-center gap-3">
                   <label className="cursor-pointer bg-[#f0f0f0] hover:bg-[#e0e0e0] text-[#4a4a4a] text-xs font-bold py-2 px-4 rounded-full transition-colors flex items-center gap-1">
                       <UploadCloud size={14}/> 選擇檔案
                       <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                   </label>
                   <span className="text-xs text-gray-400">
                       {editingEvent.image ? "已選取" : "未選取"}
                   </span>
               </div>
               {editingEvent.image && (
                   <div className="mt-3 relative w-full h-32 rounded-lg overflow-hidden border border-gray-200">
                       <img src={editingEvent.image} alt="Preview" className="w-full h-full object-cover" />
                       <button 
                           onClick={() => setEditingEvent({...editingEvent, image: null})}
                           className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1"
                       >
                           <X size={12}/>
                       </button>
                   </div>
               )}
            </div>
          </div>

          <button 
            onClick={handleSaveEvent}
            className="w-full bg-[#2a2a2a] hover:bg-black text-white py-4 font-bold text-sm tracking-widest transition-colors flex items-center justify-center gap-2"
          >
            保存變更
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#0f0c29] text-white font-sans pb-20 select-none">
        <div className="pt-12 px-6 pb-4 flex justify-between items-end bg-[#0f0c29]/90 backdrop-blur sticky top-0 z-50 border-b border-white/10">
            <div>
                <div className="text-xs text-purple-400 font-bold tracking-widest mb-1">TOKYO TRIP</div>
                <div className="text-2xl font-bold">東京 · 伊豆</div>
            </div>
            <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center"><Share size={14}/></div>
        </div>

        <div className="px-4 mt-4">
            <div className="flex bg-white/5 p-1 rounded-xl">
                {['itinerary', 'budget', 'checklist'].map(t => (
                    <button key={t} onClick={() => setActiveTab(t)} className={`flex-1 py-2 rounded-lg text-sm font-bold ${activeTab===t?'bg-white text-black':'text-gray-400'}`}>
                        {t==='itinerary'?'行程':t==='budget'?'記帳':'清單'}
                    </button>
                ))}
            </div>
        </div>

        <div className="mt-4 px-4">
            {activeTab === 'itinerary' && (
                <>
                    <div className="flex overflow-x-auto gap-3 mb-6 pb-2 no-scrollbar">
                        {["11/28", "11/29", "11/30", "12/01", "12/02"].map((d, i) => (
                            <button key={i} onClick={() => setActiveDate(i)} className={`flex-shrink-0 w-16 h-20 rounded-xl flex flex-col items-center justify-center border ${activeDate===i ? 'bg-purple-600 border-purple-400 text-white' : 'bg-white/5 border-white/10 text-gray-400'}`}>
                                <span className="text-[10px] font-bold mb-1">{d}</span>
                                <span className="text-xl font-bold">D{i+1}</span>
                            </button>
                        ))}
                    </div>

                    <div className="bg-gradient-to-br from-purple-900/80 to-indigo-900/80 p-6 rounded-3xl border border-white/10 shadow-xl mb-6 relative overflow-hidden">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h2 className="text-3xl font-bold">{currentDay.date}</h2>
                                <div className="flex items-center gap-2 text-purple-200 text-xs bg-white/10 px-2 py-1 rounded-full w-fit mt-1">
                                    <Shirt size={12}/> 穿搭建議
                                </div>
                                <p className="text-gray-300 text-xs mt-2 leading-relaxed">{currentDay.outfit}</p>
                            </div>
                            <div className="text-center">
                                {weatherLoading ? <Loader2 className="animate-spin"/> : <div className="text-yellow-300 drop-shadow-lg mb-1">{getWeatherIcon(liveWeather.conditionCode)}</div>}
                                <span className="text-3xl font-bold">{liveWeather.temp}</span>
                            </div>
                        </div>
                        <div className="border-t border-white/10 pt-2">
                            <WeatherStrip hourlyWeather={liveWeather.hourly} isLoading={weatherLoading} isError={weatherError}/>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {(currentDay.events || []).map((e, i) => (
                            <div key={i} className="relative z-10 cursor-pointer select-none" onClick={() => handleEventClick(e, activeDate)}>
                                <div className={`w-full ${e.bg || 'bg-white/10'} ${e.bg ? 'bg-opacity-90' : ''} rounded-3xl p-5 shadow-xl text-white mb-4 relative overflow-hidden border border-white/10`}>
                                    {/* Simple Render for Normal Cards */}
                                    {!e.bg && (
                                        <div className="flex items-start gap-4">
                                            <div className="w-12 text-center pt-1">
                                                <div className="font-bold text-lg">{e.time}</div>
                                                <div className="mt-2 flex justify-center">
                                                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                                                        <IconMap type={e.iconType || e.category} />
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex-1">
                                                <div className="font-bold text-lg mb-1">{e.title}</div>
                                                <div className="text-gray-400 text-sm mb-2">{e.sub || e.dest}</div>
                                                {e.image && (
                                                    <div className="mb-3 w-full h-32 rounded-lg overflow-hidden border border-white/10 relative">
                                                        <img src={e.image} alt="Preview" className="w-full h-full object-cover" />
                                                    </div>
                                                )}
                                                {(e.notes || e.mapLink) && (
                                                    <div className="pt-2 border-t border-white/10 flex flex-col gap-1">
                                                        {e.notes && <div className="text-xs text-gray-300">{e.notes}</div>}
                                                        {e.mapLink && <div className="text-xs text-blue-300 flex items-center gap-1"><MapPin size={10}/> 查看地圖</div>}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                    
                                    {/* Render for Flight Cards (with bg color) */}
                                    {e.bg && (
                                        <div>
                                            <div className="flex justify-between items-center mb-4">
                                                <div>
                                                    <div className="text-3xl font-bold font-mono">{e.time}</div>
                                                    <div className="text-xs opacity-80">{e.title}</div>
                                                </div>
                                                <div className="text-center px-4">
                                                    <div className="text-xs mb-1">{e.duration}</div>
                                                    <Plane className="rotate-90 mx-auto" size={20}/>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-3xl font-bold font-mono">{e.endTime}</div>
                                                    <div className="text-xs opacity-80">{e.dest}</div>
                                                </div>
                                            </div>
                                            <div className="flex justify-between items-center bg-black/20 p-2 rounded">
                                                <div className="text-xs">航廈: {e.terminal}</div>
                                                <div className="text-xs font-bold">{e.flightNo}</div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}
            
            {activeTab === 'budget' && (
                <div className="animate-fade-in select-none">
                    <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl p-6 shadow-xl mb-6 text-center relative overflow-hidden border border-white/10">
                        <button onClick={exportToCSV} className="absolute top-4 right-4 bg-white/20 p-2 rounded-lg hover:bg-white/30 active:scale-95 transition-all text-white flex items-center gap-1 text-xs">
                            <FileText size={14}/> 匯出
                        </button>
                        <div className="text-gray-200 text-sm mb-1 mt-2">總支出 Total</div>
                        <div className="text-4xl font-bold mb-2 font-mono">¥ {expenses.reduce((acc, cur) => acc + cur.amount, 0).toLocaleString()}</div>
                        <div className="text-xl text-purple-200 font-medium">≈ NT$ {Math.round(expenses.reduce((acc, cur) => acc + cur.amount, 0) * exchangeRate).toLocaleString()}</div>
                    </div>

                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 mb-4 border border-white/5">
                        <div className="text-lg font-bold mb-4 flex items-center"><Plus size={18} className="mr-2"/> 新增消費</div>
                        <div className="space-y-3">
                            <div className="flex gap-3">
                                <input type="date" value={newExpenseDate} onChange={(e) => setNewExpenseDate(e.target.value)} className="flex-1 bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-400"/>
                            </div>
                            <input type="text" placeholder="項目 (例: 淺草炸肉餅)" value={newExpenseName} onChange={(e) => setNewExpenseName(e.target.value)} className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-purple-400"/>
                            <div className="flex gap-3">
                                <input type="number" placeholder="0" value={newExpenseAmount} onChange={(e) => setNewExpenseAmount(e.target.value)} className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-purple-400"/>
                                <div className="flex-1">
                                    <select value={newExpensePayer} onChange={(e) => setNewExpensePayer(e.target.value)} className="w-full h-full bg-black/20 border border-white/10 rounded-xl px-1 text-white focus:outline-none appearance-none text-center text-sm">
                                        {payers.map(p => <option key={p} value={p} className="text-black">{p}</option>)}
                                    </select>
                                </div>
                            </div>
                            <button onClick={handleAddExpense} className="w-full bg-purple-500 hover:bg-purple-400 text-white rounded-xl py-3 font-bold flex items-center justify-center transition-colors shadow-lg shadow-purple-500/30">新增紀錄</button>
                        </div>
                    </div>
                    
                    <div className="space-y-3">
                        {expenses.slice().sort((a, b) => new Date(b.date) - new Date(a.date) || new Date(b.timestamp) - new Date(a.timestamp)).map((item, idx) => (
                            <div key={idx} className="bg-white/5 p-4 rounded-xl flex justify-between items-center border border-white/5">
                                <div className="flex items-center gap-3">
                                    <div className="flex flex-col items-center justify-center w-10 h-10 rounded-lg bg-white/5 text-xs text-gray-400 border border-white/5">
                                        <span className="font-bold text-white">{item.date ? item.date.split('-')[2] : '--'}</span>
                                        <span className="text-[10px]">{item.date ? item.date.split('-')[1] + '月' : ''}</span>
                                    </div>
                                    <div className="font-medium">
                                        {item.name}
                                        <div className="text-xs text-gray-400 mt-0.5">{item.payer} 代付</div>
                                    </div>
                                </div>
                                <div className="font-bold font-mono text-lg">¥ {item.amount.toLocaleString()}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            
            {activeTab === 'checklist' && (
                <div className="animate-fade-in select-none">
                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 mb-6 border border-white/10 shadow-lg">
                        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2 text-white">
                            <Check size={24} className="text-green-400"/> 行李清單
                        </h2>
                        
                        <div className="flex gap-2 mb-6">
                            <input type="text" placeholder="輸入想帶的物品..." value={newItemText} onChange={(e) => setNewItemText(e.target.value)} className="flex-1 bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 transition-colors shadow-inner"/>
                            <button onClick={handleAddChecklistItem} className="bg-purple-500 hover:bg-purple-600 text-white rounded-xl px-4 flex items-center justify-center transition-colors shadow-lg">
                                <Plus size={20}/>
                            </button>
                        </div>

                        <div className="space-y-3">
                            {checklist.map((item) => (
                                <div key={item.id} className="group flex items-center justify-between bg-white/5 p-3 rounded-xl hover:bg-white/10 transition-all border border-white/5 shadow-sm">
                                    <div className="flex items-center flex-1 cursor-pointer" onClick={() => toggleChecklistItem(item.id)}>
                                        <div className={`w-6 h-6 rounded-md border-2 mr-3 flex items-center justify-center transition-all ${item.checked ? 'bg-green-500 border-green-500' : 'border-gray-500 bg-transparent'}`}>
                                            {item.checked && <Check size={14} className="text-white" />}
                                        </div>
                                        <span className={`text-base transition-all ${item.checked ? 'text-gray-500 line-through decoration-2 decoration-gray-600' : 'text-white'}`}>{item.text}</span>
                                    </div>
                                    <button onClick={() => deleteChecklistItem(item.id)} className="text-gray-600 hover:text-red-400 p-2 rounded-full hover:bg-white/5 transition-colors opacity-50 group-hover:opacity-100">
                                        <Trash2 size={16}/>
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
        
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2">
             <button onClick={() => window.open("https://apps.apple.com/tw/app/%E7%BF%BB%E8%AD%AF/id1514844618")} className="bg-white text-indigo-900 px-6 py-3 rounded-full font-bold shadow-2xl flex items-center gap-2">
                <Languages size={20}/> 翻譯
             </button>
        </div>

        <EditModal />
    </div>
  );
};

// --- Main Wrapper with Error Boundary ---
export default function App() {
  return (
    <ErrorBoundary>
      <TravelApp />
    </ErrorBoundary>
  );
}