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

// 修正：定義 APP_ID，解決 ReferenceError
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
    // 這裡使用全域變數 APP_ID，現在已經正確定義了
    const unsub = onSnapshot(doc(db, 'trips', APP_ID, 'data', 'itinerary'), (snap) => {
        setIsSyncing(false);
        if (snap.exists() && snap.data().data) setItineraryData(snap.data().data);
        else setDoc(doc(db, 'trips', APP_ID, 'data', 'itinerary'), { data: INITIAL_ITINERARY });
    });
    return () => unsub();
  }, [user, db]);

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
                            <div key={i} className="bg-white/10 p-4 rounded-2xl border border-white/5 flex gap-4 items-start">
                                <div className="w-12 text-center pt-1">
                                    <div className="font-bold text-lg">{e.time}</div>
                                </div>
                                <div className="flex-1">
                                    <div className="font-bold text-lg mb-1">{e.title}</div>
                                    <div className="text-gray-400 text-sm">{e.sub || e.dest}</div>
                                    {e.notes && <div className="mt-2 text-xs bg-black/20 p-2 rounded text-gray-300">{e.notes}</div>}
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}
            
            {activeTab === 'budget' && <div className="text-center py-20 text-gray-500">記帳列表 (請參考完整版實作)</div>}
            {activeTab === 'checklist' && <div className="text-center py-20 text-gray-500">清單列表 (請參考完整版實作)</div>}
        </div>
        
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2">
             <button onClick={() => window.open("https://apps.apple.com/tw/app/%E7%BF%BB%E8%AD%AF/id1514844618")} className="bg-white text-indigo-900 px-6 py-3 rounded-full font-bold shadow-2xl flex items-center gap-2">
                <Languages size={20}/> 翻譯
             </button>
        </div>
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