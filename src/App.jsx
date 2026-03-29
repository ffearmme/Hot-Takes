import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Flame, 
  User, 
  Plus, 
  TrendingUp, 
  ThumbsUp, 
  ThumbsDown, 
  Sword,
  X,
  Send,
  Trophy,
  Activity,
  Zap,
  Clock,
  CircleAlert,
  LogOut,
  Settings,
  Shield,
  Key,
  Mail,
  Palette,
  ChevronLeft,
  Trash2,
  CheckCircle,
  PlayCircle,
  Flag,
  Handshake,
  Heart,
  Lock
} from 'lucide-react'
import { auth, db } from './firebase'
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  onAuthStateChanged, 
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  sendEmailVerification,
  deleteUser
} from "firebase/auth"
import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  where,
  onSnapshot, 
  doc, 
  setDoc, 
  getDoc,
  updateDoc,
  increment,
  limit,
  serverTimestamp,
  deleteDoc,
  arrayUnion,
  arrayRemove
} from "firebase/firestore"
// Styles are now all in index.css for performance and reliability

// --- Constants ---
const MAX_TURNS = 12; // Double the turns for longer debates
const TURN_TIME = 6 * 60 * 60; // 6 hours

// --- Helper Functions ---
const getAvatarUrl = (seed) => `https://api.dicebear.com/7.x/pixel-art/svg?seed=${seed}`;

// --- Constants & Helpers ---
const RANKS = [
  { name: 'NOVICE', min: 0, max: 1000, color: 'var(--rank-novice)', class: 'rank-novice', aura: 'aura-novice' },
  { name: 'CONTENDER', min: 1001, max: 2500, color: 'var(--rank-contender)', class: 'rank-contender', aura: 'aura-contender' },
  { name: 'ELITE', min: 2501, max: 5000, color: 'var(--rank-elite)', class: 'rank-elite', aura: 'aura-elite' },
  { name: 'LEGEND', min: 5001, max: Infinity, color: 'var(--rank-legend)', class: 'rank-legend', aura: 'aura-legend' }
];

const getRankInfo = (rep) => {
  const rank = RANKS.find(r => rep <= r.max) || RANKS[RANKS.length - 1];
  const nextRank = RANKS[RANKS.indexOf(rank) + 1];
  const progress = nextRank 
    ? ((rep - rank.min) / (nextRank.min - rank.min)) * 100 
    : 100;
  return { ...rank, progress, nextRank };
};

// --- Components ---

function UserPreviewModal({ username, userMap, onClose }) {
  const userData = userMap[username];
  if (!userData) return null;
  const rank = getRankInfo(userData.reputation || 0);

  return (
    <AnimatePresence>
      <motion.div 
        className="overlay preview-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={{ zIndex: 9000, alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
      >
        <motion.div 
          className="user-preview-card glass-morphism"
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          onClick={e => e.stopPropagation()}
        >
          <div className={`avatar preview-avatar ${rank.aura}`} style={{borderRadius: '20px', overflow: 'hidden'}}>
             <img src={userData.avatar} alt="pfp" />
          </div>
          <h2 className="preview-username">@{userData.username.toUpperCase()}</h2>
          <div className={`preview-rank ${rank.class}`}>{rank.name}</div>
          
          <div className="preview-stats">
             <div className="stat-item">
                <span className="stat-label">REPUTATION</span>
                <span className="stat-value" style={{color: rank.color}}>{userData.reputation}</span>
             </div>
             <div className="stat-item">
                <span className="stat-label">ARENA WINS</span>
                <span className="stat-value" style={{color: 'var(--accent-yellow)'}}>{userData.wins || 0}</span>
             </div>
          </div>
          
          <div className="preview-progress-wrap" style={{marginTop: '2rem'}}>
             <div className="reputation-progress" style={{height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden'}}>
                <div 
                   className="reputation-progress-bar" 
                   style={{ height: '100%', width: `${rank.progress}%`, background: rank.color, boxShadow: `0 0 10px ${rank.color}` }} 
                />
             </div>
             {rank.nextRank && (
                <div style={{fontSize: '0.55rem', opacity: 0.4, marginTop: '8px', textAlign: 'right', fontWeight: 900, letterSpacing: '0.05em'}}>
                   {Math.ceil(rank.nextRank.min - userData.reputation)} MORE TO {rank.nextRank.name}
                </div>
             )}
          </div>
          
          <button className="primary-btn" onClick={onClose} style={{width: '100%', height: '52px', marginTop: '2.5rem', borderRadius: '14px', fontSize: '0.8rem'}}>
             DISMISS
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function TutorialOverlay({ user, onComplete, onUpdate }) {
  const [step, setStep] = useState(0);
  const [currentSeed, setCurrentSeed] = useState('samurai');
  const seeds = ['samurai', 'cyber', 'neon', 'glitch', 'retro', 'pixel', 'bot', 'wave', 'storm', 'vortex'];

  const changeAvatar = async (s) => {
    setCurrentSeed(s);
    const newAvatar = `https://api.dicebear.com/7.x/pixel-art/svg?seed=${s}`;
    const userRef = doc(db, "users", user.uid);
    await updateDoc(userRef, { avatar: newAvatar });
    if (onUpdate) onUpdate({ ...user, avatar: newAvatar });
  };

  const steps = [
    {
      title: "WELCOME TO THE ARENA",
      content: "This is where the heat lives. Ready to start your legacy?",
      icon: <Flame size={48} color="var(--accent-neon)" />
    },
    {
      title: "CHOOSE YOUR LOOK",
      content: "Pick an avatar that screams dominance.",
      isAvatarStep: true
    },
    {
      title: "IGNITE DEBATES",
      content: "Use the + button to post your hottest takes. If someone challenges you, be ready to defend your ground in the live arena.",
      icon: <Sword size={48} color="var(--accent-cyan)" />
    },
    {
      title: "THE CROWD DECIDES",
      content: "Vote on other takes to balance the scales. High reputation leads to higher status in the community.",
      icon: <Activity size={48} color="var(--accent-purple)" />
    },
    {
      title: "ARENA COMMANDMENTS",
      content: "To maintain the integrity of our battles, you must agree to follow our code of conduct.",
      isRulesStep: true
    }
  ];

  const handleNext = async () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, { hasSeenTutorial: true });
      onComplete();
    }
  };

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
  };

  return (
    <motion.div className="overlay tutorial-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <motion.div 
        className="tutorial-card glass-morphism" 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
      >
        <div className="tutorial-header">
          {step > 0 ? (
            <button className="back-btn" onClick={handleBack}><ChevronLeft size={20} /></button>
          ) : <div />}
        </div>

        <AnimatePresence mode="wait">
          <motion.div 
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="tutorial-content-wrap"
          >
            {steps[step].icon && <div className="tutorial-icon-wrap">{steps[step].icon}</div>}
            <h2 className="tutorial-title">{steps[step].title}</h2>
            <p className="tutorial-text">{steps[step].content}</p>

            {steps[step].isAvatarStep && (
              <div className="avatar-editor tutorial-avatar-editor">
                <div className="avatar-large tutorial-avatar-preview">
                  <img key={user?.avatar} src={user?.avatar} alt="pfp" />
                </div>
                <div className="seed-grid tutorial-seed-grid">
                  {seeds.map(s => (
                    <button 
                      key={s} 
                      className={`seed-item ${user?.avatar?.includes(`seed=${s}`) ? 'active' : ''}`}
                      onClick={() => changeAvatar(s)}
                    >
                      <img src={`https://api.dicebear.com/7.x/pixel-art/svg?seed=${s}`} alt="seed" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {steps[step].isRulesStep && (
               <div className="tutorial-rules-list glass-morphism" style={{ marginTop: '1.5rem', background: 'rgba(0,0,0,0.3)', borderRadius: '24px', padding: '1.5rem', textAlign: 'left', maxHeight: '30vh', overflowY: 'auto' }}>
                  {[
                    "Debate ideas, NOT people.",
                    "No hate, slurs, or harassment.",
                    "No spam or low-effort bait.",
                    "No doxxing or personal info.",
                    "Keep it relevant and real.",
                    "No impersonation.",
                    "Keep it legal and safe.",
                    "No vote manipulation."
                  ].map((r, i) => (
                    <div key={i} style={{ display: 'flex', gap: '10px', marginBottom: '10px', fontSize: '0.75rem', fontWeight: 600 }}>
                       <CheckCircle size={14} color="var(--accent-cyan)" />
                       <span style={{ opacity: 0.8 }}>{r}</span>
                    </div>
                  ))}
               </div>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="tutorial-footer">
          <button className="primary-btn tutorial-next-btn" onClick={handleNext}>
            {step === steps.length - 1 ? 'I AGREE & ENTER ARENA' : 'CONTINUE'}
          </button>
          
          <div className="step-dots">
            {steps.map((_, i) => (
              <div key={i} className={`step-dot ${i === step ? 'active' : ''}`} />
            ))}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function DebateRoom({ take, user, userMap, onClose, onCrowdVote, onEndBattle, onSurrender, onTruce, onReport, onDeleteMessage, onUserClick }) {
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [winner, setWinner] = useState(null);
  const [isEnding, setIsEnding] = useState(false);
  const [showResult, setShowResult] = useState(true);
  const chatEndRef = useRef(null);
  const chatStartRef = useRef(null);

  const defenderAvatar = userMap?.[take.user]?.avatar || take.avatar || getAvatarUrl(take.user);
  const challengerAvatar = take.challenger ? (userMap?.[take.challenger]?.avatar || getAvatarUrl(take.challenger)) : null;

  const isSpectator = user?.username !== take.user && user?.username !== take.challenger;
  const userVotedDisagree = take.disagreeVoters?.includes(user?.uid);

  const totalVotes = (take.agrees || 0) + (take.disagrees || 0);
  const agreePercent = totalVotes > 0 ? (take.agrees / totalVotes) * 100 : 50;
  const disagreePercent = totalVotes > 0 ? (take.disagrees / totalVotes) * 100 : 50;

  useEffect(() => {
    if (!take.isConcluded) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, take.isConcluded]);

  // Real-time Chat Sync
  useEffect(() => {
    const q = query(collection(db, "takes", take.id, "messages"), orderBy("createdAt", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loadedMsgs = snapshot.docs.map(d => d.data());
      if(loadedMsgs.length === 0) {
        setMessages([{ id: 1, user: take.user, text: `I stand by my take: ${take.content}`, side: 'left' }]);
      } else {
        // Spencer (Author) on LEFT, Challenger on RIGHT
        setMessages(snapshot.docs.map((d, i) => {
          const m = d.data();
          return { id: d.id, user: m.user, text: m.text, side: m.user === take.user ? 'left' : 'right' };
        }));
      }
    });
    return () => unsubscribe();
  }, [take.id, user.username, take.content, take.user]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!userInput.trim()) return;

    await addDoc(collection(db, "takes", take.id, "messages"), {
      user: user.username,
      text: userInput,
      createdAt: serverTimestamp()
    });
    setUserInput('');
  }

  const declareWinner = () => {
    const isAgreeWinner = take.agrees >= take.disagrees;
    setWinner(isAgreeWinner ? take.user : user.username);
  }

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}h ${m}m ${s}s`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  };

  const formatTimeRemaining = () => {
    if (!take.createdAt) return "LIVE";
    const elapsed = Date.now() - take.createdAt.toMillis();
    const remaining = Math.max(0, (6 * 60 * 60 * 1000) - elapsed);
    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const mins = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${mins}m LEFT`;
  };

  return (
    <motion.div 
      className="debate-room"
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
    >
      <div style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', display: 'flex', gap: '12px' }}>
        {user?.username !== take.user && (
          <button className="close-btn" onClick={() => onReport(take)} style={{ color: 'rgba(255,255,255,0.3)', width: '36px', height: '36px' }}><Flag size={16} /></button>
        )}
        <button className="close-btn" onClick={onClose} style={{ width: '36px', height: '36px' }}><X size={20} /></button>
      </div>
      <header className="vs-header">
        <div className="participant them active user-link" onClick={() => onUserClick(take.user)}>
          <div className="avatar">
            <img src={defenderAvatar} alt="defender" />
          </div>
          <div style={{fontSize: '0.75rem', fontWeight: 900, marginTop: '8px', letterSpacing: '0.05em'}}>@{take.user}</div>
        </div>
        
        <div className="vs-badge">VS</div>
        
        <div className={`participant ${take.challenger ? 'active user-link' : ''}`} onClick={() => take.challenger && onUserClick(take.challenger)}>
          <div className="avatar" style={{ opacity: take.challenger ? 1 : 0.3 }}>
            {take.challenger ? <img src={challengerAvatar} alt="challenger" /> : <User size={24} style={{margin: '12px'}} />}
          </div>
          <div style={{fontSize: '0.75rem', fontWeight: 900, marginTop: '8px', letterSpacing: '0.05em'}}>
            {take.challenger ? `@${take.challenger.toUpperCase()}` : 'WAITING...'}
          </div>
        </div>
      </header>
      
      <div className="timer-container" style={{height: '24px', background: take.isConcluded ? 'var(--accent-purple)' : 'var(--accent-cyan)', position: 'relative', boxShadow: take.isConcluded ? '0 0 15px var(--accent-purple)' : '0 0 15px var(--accent-cyan)'}}>
        <div style={{
          position: 'absolute', 
          top: 0, left: 0, right: 0, bottom: 0, 
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '0.65rem', fontWeight: 900, color: 'white', textShadow: 'none',
          letterSpacing: '0.1em'
        }}>
          {take.isConcluded ? 'DEBATE LOGS (REPLAY)' : 'LIVE CHAT ACTIVE'}
        </div>
        {take.isConcluded && !showResult && (
          <button 
            onClick={() => setShowResult(true)}
            style={{
              position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)',
              background: 'rgba(5,2,12,0.8)', border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '6px', padding: '2px 8px', fontSize: '0.55rem', fontWeight: 900,
              color: 'var(--accent-yellow)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px'
            }}
          >
             <Trophy size={10} /> WINNER
          </button>
        )}
      </div>

      <div className="chat-area" style={{ paddingBottom: take.isConcluded ? '4rem' : '240px' }}>
        <div ref={chatStartRef} />
        {messages.map((m) => (
          <motion.div 
            key={m.id}
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className={`chat-bubble ${m.side}`}
            style={{ position: 'relative' }}
          >
            <span className="chat-username user-link" onClick={() => onUserClick(m.user)}>@{m.user}</span>
            {m.text}
            {user?.email === 'ffearmme@gmail.com' && (
              <button 
                onClick={() => onDeleteMessage(take.id, m.id)}
                style={{ position: 'absolute', top: '-8px', right: '-8px', background: '#ff4444', border: 'none', borderRadius: '50%', width: '20px', height: '20px', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '10px', zIndex: 10 }}
              >
                <X size={12} />
              </button>
            )}
          </motion.div>
        ))}
        <div ref={chatEndRef} />
      </div>



      {(!take.challenger || user.username === take.user || user.username === take.challenger) ? (
        <form className="chat-input-container" onSubmit={handleSend} style={{flexDirection: 'column', gap: '12px', background: 'rgba(5,2,12,0.98)'}}>
          
          {(!isSpectator && take.challenger && !take.isConcluded) && (
            <>
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '-4px'}}>
                <div style={{fontWeight: 900, letterSpacing: '0.2em', fontSize: '0.6rem', color: 'var(--accent-cyan)', opacity: 0.6, display: 'flex', alignItems: 'center', gap: '4px'}}>
                  <ThumbsUp size={10} /> {Math.round(agreePercent)}%
                </div>
                <div style={{fontWeight: 900, letterSpacing: '0.2em', fontSize: '0.6rem', color: 'var(--accent-neon)', opacity: 0.6, display: 'flex', alignItems: 'center', gap: '4px'}}>
                  {Math.round(disagreePercent)}% <ThumbsDown size={10} />
                </div>
              </div>
              <div className="ratio-container" style={{height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden', display: 'flex'}}>
                <motion.div className="ratio-agree" animate={{ width: `${agreePercent}%` }} style={{height: '100%', background: 'var(--accent-cyan)', boxShadow: '0 0 10px var(--accent-cyan)'}} />
                <motion.div className="ratio-disagree" animate={{ width: `${disagreePercent}%` }} style={{height: '100%', background: 'var(--accent-neon)', boxShadow: '0 0 10px var(--accent-neon)'}} />
              </div>
              
              <div style={{display: 'flex', gap: '10px', marginTop: '4px'}}>
                 <motion.button 
                   type="button"
                   whileHover={{ scale: 1.02, background: 'rgba(255, 68, 68, 0.15)', borderColor: 'rgba(255, 68, 68, 0.4)' }}
                   whileTap={{ scale: 0.98 }}
                   className="action-btn" 
                   style={{
                     flex: 1, height: '48px', fontSize: '0.65rem',
                     background: 'rgba(255, 68, 68, 0.05)', color: '#ff4444', 
                     border: '1px solid rgba(255, 68, 68, 0.2)', borderRadius: '14px',
                     display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                   }}
                   onClick={() => onSurrender(take)}
                 >
                   <Flag size={14} /> SURRENDER
                 </motion.button>
                 <motion.button 
                   type="button"
                   whileHover={{ scale: 1.02, background: take.truceVotes?.includes(user?.uid) ? 'var(--accent-cyan)' : 'rgba(255, 255, 255, 0.1)', borderColor: 'var(--accent-cyan)' }}
                   whileTap={{ scale: 0.98 }}
                   className="action-btn" 
                   style={{
                     flex: 1.5, height: '48px', fontSize: '0.65rem',
                     background: take.truceVotes?.includes(user?.uid) ? 'var(--accent-cyan)' : 'rgba(255, 255, 255, 0.03)', 
                     color: take.truceVotes?.includes(user?.uid) ? 'black' : 'white',
                     border: `1px solid ${take.truceVotes?.includes(user?.uid) ? 'var(--accent-cyan)' : 'rgba(255, 255, 255, 0.1)'}`, 
                     borderRadius: '14px',
                     display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                   }}
                   onClick={() => onTruce(take)}
                 >
                   <Handshake size={16} /> {take.truceVotes?.includes(user?.uid) ? 'TRUCE PROPOSED' : 'OFFER TRUCE'}
                 </motion.button>
              </div>
              <div style={{height: '1px', background: 'rgba(255,255,255,0.1)', margin: '4px 0'}}></div>
            </>
          )}

          <div style={{display: 'flex', gap: '12px', width: '100%'}}>
            <input 
              type="text" 
              className="chat-input"
              placeholder={!take.challenger ? "Awaiting challenger..." : "Send a message to the arena..."}
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              disabled={winner || !take.challenger}
            />
            <button type="submit" className="send-btn" disabled={!userInput.trim() || !take.challenger}>
              <Send size={18} />
            </button>
          </div>
        </form>
      ) : !take.isConcluded && (
        <div className="chat-input-container" style={{flexDirection: 'column', gap: '8px', padding: '1.25rem 1.5rem', background: 'rgba(5,2,12,0.98)'}}>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px'}}>
             <div style={{fontWeight: 900, letterSpacing: '0.2em', fontSize: '0.6rem', color: 'var(--accent-cyan)', opacity: 0.6, display: 'flex', alignItems: 'center', gap: '4px'}}>
                <ThumbsUp size={10} /> {Math.round(agreePercent)}%
             </div>
             <div style={{fontWeight: 900, letterSpacing: '0.2em', fontSize: '0.6rem', color: 'var(--accent-neon)', opacity: 0.6, display: 'flex', alignItems: 'center', gap: '4px'}}>
                {Math.round(disagreePercent)}% <ThumbsDown size={10} />
             </div>
          </div>
          
          <div className="ratio-container" style={{height: '6px', marginBottom: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden', display: 'flex'}}>
            <motion.div className="ratio-agree" animate={{ width: `${agreePercent}%` }} style={{height: '100%', background: 'var(--accent-cyan)', boxShadow: '0 0 10px var(--accent-cyan)'}} />
            <motion.div className="ratio-disagree" animate={{ width: `${disagreePercent}%` }} style={{height: '100%', background: 'var(--accent-neon)', boxShadow: '0 0 10px var(--accent-neon)'}} />
          </div>
          <div style={{display: 'flex', gap: '12px', width: '100%'}}>
            <button 
              className={`action-btn agree-btn ${take.agreeVoters?.includes(user?.uid) ? 'active' : ''}`} 
              onClick={() => onCrowdVote('agree', take.id)} 
              style={{flex: 1, height: '52px', borderRadius: '14px'}}
            >
              <ThumbsUp size={18} /> <span>AGREE ({take.agrees})</span>
            </button>
            <button 
              className={`action-btn disagree-btn ${take.disagreeVoters?.includes(user?.uid) ? 'active' : ''}`} 
              onClick={() => onCrowdVote('disagree', take.id)}
              style={{flex: 1, height: '52px', borderRadius: '14px'}}
            >
              <ThumbsDown size={18} /> <span>DISAGREE ({take.disagrees})</span>
            </button>
          </div>
        </div>
      )}

      <AnimatePresence>
        {(!take.challenger && take.user === user.username) && (
          <div className="winner-overlay" style={{background: 'rgba(5,2,12,0.98)'}}>
             <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 2 }}>
               <Sword size={64} color="var(--accent-neon)" opacity={0.5} />
             </motion.div>
             <h2 style={{marginTop: '2rem', fontFamily: 'var(--font-heading)'}}>AWAITING CHALLENGER</h2>
             <p style={{opacity: 0.6, marginTop: '1rem', padding: '0 2rem'}}>The arena is open. Waiting for someone to step up and challenge your take.</p>
             <button className="close-btn" style={{position: 'absolute', top: '1.5rem', right: '1.5rem'}} onClick={onClose}><X size={20} /></button>
          </div>
        )}
        {(take.isConcluded || take.winner) && showResult && (
          <motion.div className="winner-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{zIndex: 3500}}>
            <motion.div initial={{ y: -20 }} animate={{ y: 0 }} className="winner-crown" style={{fontSize: '4rem'}}>
              {take.endReason === 'truce' ? '🤝' : '👑'}
            </motion.div>
            <h1 className="glow-text" style={{fontSize: '3rem', letterSpacing: '0.2em'}}>
              {take.endReason === 'truce' ? 'DRAW' : 'WINNER'}
            </h1>
            <div className="aura-legend user-link" onClick={() => onUserClick(take.winner)} style={{width: '120px', height: '120px', borderRadius: '30px', overflow: 'hidden', margin: '1rem 0'}}>
               <img src={take.winner === take.user ? defenderAvatar : challengerAvatar} alt="winner" style={{width: '100%', opacity: take.endReason === 'truce' ? 0.5 : 1}} />
            </div>
            {take.endReason === 'truce' ? (
               <h2 style={{color: 'var(--accent-cyan)', fontSize: '1.5rem'}}>AGREED TO DISAGREE</h2>
            ) : (
               <h2 className="user-link" onClick={() => onUserClick(take.winner)} style={{color: 'var(--accent-neon)', fontSize: '2rem'}}>@{take.winner}</h2>
            )}
            <p style={{marginTop: '1.25rem', opacity: 0.8, fontWeight: 900, letterSpacing: '0.15em', fontSize: '0.9rem'}}>
               {take.endReason === 'surrender' 
                 ? `${take.surrenderedBy} SURRENDERED` 
                 : take.endReason === 'truce' 
                   ? 'DIPLOMATIC RESOLUTION' 
                   : 'THE CROWD HAS SPOKEN'}
            </p>
            
            <div style={{display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '3rem', width: '250px'}}>
              <button className="primary-btn" style={{height: '56px'}} onClick={() => setShowResult(false)}>
                READ CHAT LOGS
              </button>
              <button 
                className="close-btn" 
                style={{height: '56px', width: '100%', borderRadius: '16px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)'}} 
                onClick={onClose}
              >
                BACK TO FEED
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function TakeCard({ take, user, userMap, onAction, onLike, onChallenge, onDelete, onReport, onUserClick }) {
  const total = (take.agrees || 0) + (take.disagrees || 0);
  const agreePercent = total > 0 ? (take.agrees / total) * 100 : 50;
  const disagreePercent = total > 0 ? (take.disagrees / total) * 100 : 50;
  
  const isMyTake = take.user === user?.username;
  const isAdmin = user?.email === 'ffearmme@gmail.com';
  const authorData = userMap?.[take.user];
  const authorRep = authorData?.reputation || 0;
  const rank = getRankInfo(authorRep);

  const hasLiked = take.likedBy?.includes(user?.uid);

  return (
    <motion.div 
      className={`take-card glass-morphism ${(take.challenger && !take.isConcluded) ? 'live-debate-card' : ''} ${take.isFeatured ? 'featured-card' : ''}`}
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      style={{ border: take.isFeatured ? '2px solid var(--accent-yellow)' : undefined }}
    >
      {take.isFeatured && (
        <div className="live-match-badge" style={{ background: 'var(--accent-yellow)', color: 'black', top: '-12px', right: '20px' }}>
          <Zap size={10} fill="black" /> FEATURED
        </div>
      )}

      {take.challenger && !take.isConcluded && (
        <div className="live-match-badge">
          <div className="live-dot" /> LIVE DEBATE
        </div>
      )}
      {take.isConcluded && (
        <div className="live-match-badge concluded">
          <CheckCircle size={14} style={{marginRight: '6px'}} /> FINISHED
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
        <div className={`avatar ${rank.aura} user-link`} onClick={() => onUserClick(take.user)} style={{borderRadius: '12px', overflow: 'hidden'}}>
          <img src={take.avatar || getAvatarUrl(take.user)} alt="avatar" />
        </div>
        <div style={{ flex: 1 }}>
          <div className="user-link" onClick={() => onUserClick(take.user)} style={{ fontWeight: 900, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
            @{take.user}
            <span className={rank.class} style={{fontSize: '0.6rem', letterSpacing: '0.1em'}}>{rank.name}</span>
          </div>
          <div style={{ fontSize: '0.7rem', opacity: 0.5 }}>{take.category || 'General'}</div>
        </div>
        {(isMyTake || isAdmin) && (
          <button onClick={() => {
            if (window.confirm('DELETE DEBATE? Admin override active.')) {
              onDelete(take.id);
            }
          }} style={{ background: 'none', border: 'none', color: '#ff4444', opacity: 0.6, cursor: 'pointer' }}>
            <Trash2 size={16} />
          </button>
        )}
        {!isMyTake && (
          <button onClick={() => onReport(take)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.2)', cursor: 'pointer' }}>
            <Flag size={14} />
          </button>
        )}
      </div>

      {take.isConcluded && (
        <div style={{marginBottom: '1.5rem', padding: '1rem', borderRadius: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '10px'}}>
           <div className="winner-crown" style={{fontSize: '1.2rem'}}>👑</div>
           <div style={{fontSize: '0.85rem', fontWeight: 900, letterSpacing: '0.02em'}}>
              <span className={`user-link ${take.winner === take.user ? rank.class : 'rank-legend'}`} onClick={() => onUserClick(take.winner)} style={{textTransform: 'uppercase'}}>@{take.winner}</span> WON THE ARENA
           </div>
        </div>
      )}
      
      {take.isLive && (
        <div className="live-indicator"><div className="live-dot" /> TRENDING</div>
      )}
      
      <div className="take-content">"{take.content}"</div>

      {(take.challenger || take.isConcluded) && (
        <div style={{ marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.55rem', fontWeight: 900, letterSpacing: '0.1em' }}>
             <div style={{ color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <ThumbsUp size={10} /> {Math.round(agreePercent)}%
             </div>
             <div style={{ color: 'var(--accent-neon)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                {Math.round(disagreePercent)}% <ThumbsDown size={10} />
             </div>
          </div>
          <div className="ratio-container" style={{ marginBottom: 0 }}>
            <motion.div className="ratio-agree" animate={{ width: `${agreePercent}%` }} />
            <motion.div className="ratio-disagree" animate={{ width: `${disagreePercent}%` }} />
          </div>
        </div>
      )}
      
      <div className="take-actions" style={{display: 'flex', gap: '10px'}}>
        <motion.button 
          whileTap={{ scale: 0.9 }}
          onClick={() => onLike(take.id)}
          className={`action-btn ${hasLiked ? 'active' : ''}`}
          style={{
            flex: '0 0 64px', height: '52px', background: hasLiked ? 'rgba(255, 68, 68, 0.1)' : 'rgba(255,255,255,0.03)',
            border: `1px solid ${hasLiked ? 'rgba(255, 68, 68, 0.3)' : 'rgba(255,255,255,0.1)'}`, 
            borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '2px', padding: '0'
          }}
        >
          <Heart size={16} fill={hasLiked ? "#ff4444" : "none"} color={hasLiked ? "#ff4444" : "rgba(255,255,255,0.4)"} />
          <span style={{fontSize: '0.65rem', fontWeight: 900, color: hasLiked ? '#ff4444' : 'rgba(255,255,255,0.4)'}}>{take.likes || 0}</span>
        </motion.button>

        <div style={{flex: 1}}>
          {take.isConcluded ? (
            <button 
              className="primary-btn replay-btn" 
              onClick={() => onChallenge(take)} 
              style={{width: '100%', height: '52px', background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center'}}
            >
              <PlayCircle size={18} style={{marginRight: '8px'}} /> WATCH REPLAY
            </button>
          ) : take.challenger ? (
            <button 
              className="primary-btn watch-btn" 
              style={{width: '100%', height: '52px', background: 'linear-gradient(135deg, var(--accent-purple), var(--accent-neon))', display: 'flex', alignItems: 'center', justifyContent: 'center'}} 
              onClick={() => onChallenge(take)}
            >
              {isMyTake || (user?.username === take.challenger) ? (
                <Sword size={18} style={{marginRight: '8px'}} />
              ) : (
                <Activity size={18} style={{marginRight: '8px'}} />
              )}
              {isMyTake || (user?.username === take.challenger) ? 'ENTER ARENA' : 'WATCH LIVE'}
            </button>
          ) : (
            <button 
              className="primary-btn challenge-btn" 
              style={{width: '100%', height: '52px', background: 'linear-gradient(135deg, var(--accent-purple), var(--accent-neon))', display: 'flex', alignItems: 'center', justifyContent: 'center'}} 
              onClick={() => onChallenge(take)}
            >
              <Sword size={18} style={{marginRight: '8px'}} /> {isMyTake ? 'AWAITING CHALLENGER' : 'START DEBATE'}
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function ResultCard({ take, userMap, onChallenge, onUserClick }) {
  const winnerData = userMap?.[take.winner];
  const winnerRank = getRankInfo(winnerData?.reputation || 0);
  
  return (
    <motion.div 
      className="result-card"
      whileHover={{ y: -8, scale: 1.02 }}
      onClick={() => onChallenge(take)}
    >
      <div className="result-header">
         <div className={`avatar ${winnerRank.aura} user-link`} onClick={(e) => { e.stopPropagation(); onUserClick(take.winner); }} style={{width: '28px', height: '28px'}}>
           <img src={take.winnerAvatar || getAvatarUrl(take.winner)} alt="avatar" />
         </div>
         <span style={{fontSize: '0.65rem', fontWeight: 900, opacity: 0.4, letterSpacing: '0.1em'}}>FINISHED</span>
      </div>
      <div className="result-winner user-link" onClick={(e) => { e.stopPropagation(); onUserClick(take.winner); }}>
         <Trophy size={16} color="var(--accent-yellow)" />
         <span className={winnerRank.class}>@{take.winner}</span>
      </div>
      <div className="result-content">{take.content}</div>
    </motion.div>
  );
}
function ReputationDocsModal({ onClose }) {
  return (
    <motion.div 
      className="overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      style={{ zIndex: 10000, padding: '1.5rem', background: 'rgba(0,0,0,0.9)' }}
    >
      <motion.div 
        className="modal glass-morphism"
        initial={{ y: '20px', scale: 0.95 }}
        animate={{ y: 0, scale: 1 }}
        exit={{ y: '20px', scale: 0.95 }}
        onClick={e => e.stopPropagation()}
        style={{ padding: '2.5rem 1.5rem', maxWidth: '400px', width: '100%', borderRadius: '24px' }}
      >
        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', marginBottom: '1.5rem' }}>REPUTATION <span className="glow-text">SYSTEM</span></h2>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', textAlign: 'left' }}>
           <div className="rep-rule">
              <div className="rep-icon" style={{ background: 'rgba(0, 255, 255, 0.1)', color: 'var(--accent-cyan)' }}><Zap size={14} /></div>
              <div>
                 <div style={{ fontWeight: 900, fontSize: '0.8rem', letterSpacing: '0.05em' }}>STARTING GEAR</div>
                 <div style={{ fontSize: '0.75rem', opacity: 0.6, marginTop: '2px' }}>Every warrior starts with 1,500 Reputation points.</div>
              </div>
           </div>

           <div className="rep-rule">
              <div className="rep-icon" style={{ background: 'rgba(255, 0, 255, 0.1)', color: 'var(--accent-neon)' }}><Sword size={14} /></div>
              <div>
                 <div style={{ fontWeight: 900, fontSize: '0.8rem', letterSpacing: '0.05em' }}>ARENA REWARDS</div>
                 <div style={{ fontSize: '0.75rem', opacity: 0.6, marginTop: '2px' }}>+100 for a Crowd Victory. +25 just for stepping into the Arena.</div>
              </div>
           </div>

           <div className="rep-rule">
              <div className="rep-icon" style={{ background: 'rgba(255, 68, 68, 0.1)', color: '#ff4444' }}><Flag size={14} /></div>
              <div>
                 <div style={{ fontWeight: 900, fontSize: '0.8rem', letterSpacing: '0.05em' }}>DEFEAT & SURRENDER</div>
                 <div style={{ fontSize: '0.75rem', opacity: 0.6, marginTop: '2px' }}>-50 for a Crowd Defeat. -30 for Surrendering.</div>
              </div>
           </div>

           <div className="rep-rule">
              <div className="rep-icon" style={{ background: 'rgba(255, 243, 0, 0.1)', color: 'var(--accent-yellow)' }}><Heart size={14} /></div>
              <div>
                 <div style={{ fontWeight: 900, fontSize: '0.8rem', letterSpacing: '0.05em' }}>SENTIMENT</div>
                 <div style={{ fontSize: '0.75rem', opacity: 0.6, marginTop: '2px' }}>+5 Reputation for every Heart received on your takes.</div>
              </div>
           </div>
        </div>

        <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
           <div style={{ fontSize: '0.6rem', fontWeight: 900, opacity: 0.4, marginBottom: '1rem', letterSpacing: '0.1em' }}>HIERARCHY</div>
           <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', fontWeight: 800 }}>
              <span className="rank-novice">NOVICE (0+)</span>
              <span className="rank-contender">CONTENDER (1K+)</span>
              <span className="rank-elite">ELITE (2.5K+)</span>
              <span className="rank-legend">LEGEND (5K+)</span>
           </div>
        </div>

        <button className="primary-btn" onClick={onClose} style={{ width: '100%', marginTop: '2.5rem', height: '52px', borderRadius: '14px' }}>
           GOT IT
        </button>
      </motion.div>
    </motion.div>
  );
}

function RulesModal({ onClose }) {
  const rules = [
    { title: "DEBATE IDEAS, NOT PEOPLE", desc: "Disagree freely, but don’t insult, attack, or target others.", icon: <Sword size={16} /> },
    { title: "NO HATE OR HARASSMENT", desc: "No slurs, threats, bullying, or targeted insults toward individuals or groups.", icon: <Shield size={16} /> },
    { title: "NO SPAM OR FLOODING", desc: "Don’t post repetitive content, ads, or low-effort bait.", icon: <Flag size={16} /> },
    { title: "NO DOXXING", desc: "Never share private or identifying information about anyone.", icon: <Lock size={16} /> },
    { title: "KEEP IT RELEVANT", desc: "Posts should be real topics meant for discussion and debate.", icon: <Zap size={16} /> },
    { title: "NO IMPERSONATION", desc: "Don’t pretend to be another person, brand, or public figure.", icon: <User size={16} /> },
    { title: "KEEP IT LEGAL & SAFE", desc: "No content promoting violence, illegal activity, or harmful behavior.", icon: <CheckCircle size={16} /> },
    { title: "NO VOTE MANIPULATION", desc: "Don’t use alt accounts or coordinate to influence outcomes.", icon: <Activity size={16} /> }
  ];

  return (
    <motion.div 
      className="overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      style={{ zIndex: 11000, padding: '1.5rem', background: 'rgba(5,2,12,0.95)' }}
    >
      <motion.div 
        className="modal glass-morphism"
        initial={{ y: '20px', scale: 0.95 }}
        animate={{ y: 0, scale: 1 }}
        exit={{ y: '20px', scale: 0.95 }}
        onClick={e => e.stopPropagation()}
        style={{ padding: '2.5rem 1.5rem', maxWidth: '450px', width: '100%', borderRadius: '28px', maxHeight: '90vh', overflowY: 'auto' }}
      >
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <Shield size={40} color="var(--accent-neon)" style={{ marginBottom: '1rem', filter: 'drop-shadow(0 0 10px var(--accent-neon))' }} />
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.8rem' }}>COMMUNITY <span className="glow-text">RULES</span></h2>
          <p style={{ opacity: 0.5, fontSize: '0.8rem', marginTop: '0.5rem' }}>Respect the Arena. Respect the Fight.</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
           {rules.map((rule, i) => (
              <div key={i} className="rep-rule" style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.03)' }}>
                 <div className="rep-icon" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--accent-cyan)' }}>
                    {rule.icon}
                 </div>
                 <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 900, fontSize: '0.75rem', letterSpacing: '0.05em', color: 'white' }}>{rule.title}</div>
                    <div style={{ fontSize: '0.7rem', opacity: 0.8, color: 'rgba(255,255,255,0.7)', marginTop: '4px', lineHeight: '1.4' }}>{rule.desc}</div>
                 </div>
              </div>
           ))}
        </div>

        <button className="primary-btn" onClick={onClose} style={{ width: '100%', marginTop: '2.5rem', height: '56px', borderRadius: '16px' }}>
           I UNDERSTAND
        </button>
      </motion.div>
    </motion.div>
  );
}

function AddTakeModal({ isOpen, onClose, onAdd, onOpenRules }) {
  const [takeText, setTakeText] = useState('')
  const [category, setCategory] = useState('General')
  const categories = ['General', 'Food', 'Tech', 'Culture', 'Politics', 'Gaming']

  const handleSubmit = (e) => {
    e.preventDefault();
    if(takeText.trim()) {
      onAdd({ content: takeText, category });
      setTakeText('');
      onClose();
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          className="overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{ cursor: 'pointer' }}
          onClick={(e) => {
            if (e.target.className === 'overlay') onClose();
          }}
        >
          <motion.div 
            className="modal" 
            initial={{ y: "100%" }} 
            animate={{ y: 0 }} 
            exit={{ y: "100%" }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            style={{ cursor: 'default' }}
          >
            <div className="modal-header">
              <h2 className="modal-title">Post a <span className="glow-text">Take</span></h2>
              <button className="close-btn" onClick={onClose}><X size={20} /></button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="category-scroll">
                {categories.map(c => (
                  <button key={c} type="button" className={`category-badge ${category === c ? 'active' : ''}`} onClick={() => setCategory(c)}>
                    {c}
                  </button>
                ))}
              </div>
              
              <textarea 
                className="take-input" 
                placeholder="What's your most controversial opinion?" 
                rows={4} 
                value={takeText} 
                onChange={(e) => setTakeText(e.target.value)} 
                autoFocus 
                maxLength={140} 
              />
              
              <div style={{textAlign: 'right', fontSize: '0.75rem', opacity: 0.5, marginTop: '8px', fontWeight: 600, letterSpacing: '0.05em'}}>
                {takeText.length} / 140
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1.25rem', marginBottom: '-0.75rem' }}>
                <button 
                  type="button" 
                  className="rules-link" 
                  onClick={onOpenRules}
                  style={{
                    background: 'rgba(0,255,255,0.1)',
                    padding: '10px 20px',
                    borderRadius: '20px',
                    border: '1px solid rgba(0,255,255,0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '0.65rem',
                    fontWeight: 900,
                    color: 'var(--accent-cyan)',
                    boxShadow: '0 0 15px rgba(0,255,255,0.1)'
                  }}
                >
                  <Shield size={14} /> READ THE RULES
                </button>
              </div>

              <motion.button 
                className="primary-btn" 
                style={{ width: '100%', marginTop: '2.5rem', height: '64px'}} 
                whileTap={{ scale: 0.95 }} 
                type="submit" 
                disabled={!takeText.trim()}
              >
                <Zap size={20} style={{marginRight: '8px'}} /> IGNITE DEBATE
              </motion.button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
function HallOfFameModal({ isOpen, onClose, takes, userMap, onChallenge }) {
  const concludedTakes = takes
    .filter(t => t.isConcluded)
    .sort((a, b) => (b.endedAt?.toMillis() || 0) - (a.endedAt?.toMillis() || 0));

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          className="overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          style={{ zIndex: 5000 }}
        >
          <motion.div 
            className="modal" 
            initial={{ y: "100%" }} 
            animate={{ y: 0 }} 
            exit={{ y: "100%" }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            style={{ maxHeight: '85vh' }}
          >
            <div className="modal-header">
              <h2 className="modal-title">HALL OF <span className="glow-text">FAME</span></h2>
              <button className="close-btn" onClick={onClose}><X size={20} /></button>
            </div>
            
            <div className="results-list" style={{ overflowY: 'auto', paddingBottom: '2rem' }}>
              {concludedTakes.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '4rem 2rem', opacity: 0.5 }}>
                  <Trophy size={48} style={{ marginBottom: '1rem', opacity: 0.2 }} />
                  <p>The hall is currently empty. Finish a debate to make history.</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
                  {concludedTakes.map(t => (
                    <ResultCard 
                      key={t.id} 
                      take={t} 
                      userMap={userMap} 
                      onChallenge={() => {
                        onChallenge(t);
                        onClose();
                      }} 
                    />
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function ChallengeConfirmModal({ take, isOpen, onClose, onConfirm }) {
  if (!take) return null;
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div className="overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{zIndex: 6000, alignItems: 'center', justifyContent: 'center', padding: '1rem'}} onClick={onClose}>
          <motion.div 
            className="modal" 
            initial={{ scale: 0.9, opacity: 0, y: 30 }} 
            animate={{ scale: 1, opacity: 1, y: 0 }} 
            exit={{ scale: 0.9, opacity: 0, y: 30 }} 
            onClick={e => e.stopPropagation()} 
            style={{ borderRadius: '40px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', padding: '2.5rem 2rem' }}
          >
            <div style={{textAlign: 'center'}}>
               <motion.div 
                 initial={{ rotate: -15 }} 
                 animate={{ rotate: 15 }} 
                 transition={{ repeat: Infinity, repeatType: 'reverse', duration: 1.5 }}
                 style={{display: 'inline-flex', padding: '1.25rem', borderRadius: '24px', background: 'rgba(255, 0, 255, 0.1)', border: '1px solid rgba(255, 0, 255, 0.2)', marginBottom: '1.5rem'}}
               >
                  <Sword size={28} color="var(--accent-neon)" style={{filter: 'drop-shadow(0 0 10px var(--accent-neon))'}} />
               </motion.div>
               <h2 className="modal-title" style={{fontSize: '1.75rem', marginBottom: '1.5rem', letterSpacing: '0.1em'}}>
                  ARENA <span className="glow-text">CHALLENGE</span>
               </h2>
               <p style={{fontSize: '0.9rem', opacity: 0.7, marginBottom: '2rem', lineHeight: 1.6}}>
                  You are about to challenge <strong>@{take.user}</strong> on their take:
               </p>
               <div className="glass-morphism" style={{fontSize: '1.1rem', fontStyle: 'italic', fontWeight: 600, padding: '1.5rem', marginBottom: '2.5rem', borderLeft: '4px solid var(--accent-cyan)', background: 'rgba(255,255,255,0.02)', textAlign: 'left', borderRadius: '0 16px 16px 0'}}>
                  "{take.content}"
               </div>
               
               <div style={{display: 'flex', gap: '12px', marginTop: '2.5rem'}}>
                  <button 
                    className="glass-morphism" 
                    style={{flex: 1, height: '64px', borderRadius: '18px', border: '1px solid rgba(255,255,255,0.1)', fontWeight: 900, cursor: 'pointer', color: 'rgba(255,255,255,0.6)'}} 
                    onClick={onClose}
                  >
                    CANCEL
                  </button>
                  <button className="primary-btn" style={{flex: 2, height: '64px'}} onClick={() => onConfirm(take)}>
                     IGNITE FIGHT
                  </button>
               </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}



function ArenaActionModal({ type, isOpen, onClose, onConfirm }) {
  const isSurrender = type === 'surrender';
  const isTruce = type === 'truce';
  const isDelete = type === 'delete';

  const title = isDelete ? 'ERASE IDENTITY?' : (isSurrender ? 'SURRENDER?' : 'OFFER TRUCE?');
  const description = isDelete 
    ? "WARNING: THIS ACTION IS IRREVERSIBLE. All your reputation, arena victories, and your digital footprint will be permanently purged from the database." 
    : (isSurrender ? "You are about to forfeit this debate. Your opponent will be declared winner and your reputation will drop." : "Proposing a truce means you are willing to end this fight as a draw. Both players must agree to conclude.");
  
  const icon = isDelete ? <Trash2 size={32} color="#ff4444" /> : (isSurrender ? <Flag size={32} color="#ff4444" /> : <Handshake size={32} color="var(--accent-cyan)" />);
  const btnText = isDelete ? 'CONFIRM PURGE' : (isSurrender ? 'FORFEIT MATCH' : 'SEND PROPOSAL');
  
  const accentColor = (isSurrender || isDelete) ? '#ff4444' : 'var(--accent-cyan)';
  const glowShadow = (isSurrender || isDelete) ? '0 8px 25px rgba(255, 68, 68, 0.3)' : '0 8px 25px rgba(0, 255, 255, 0.3)';

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          className="overlay" 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }} 
          style={{zIndex: 7000, alignItems: 'center', justifyContent: 'center', padding: '1.5rem'}} 
          onClick={onClose}
        >
          <motion.div 
            className="modal" 
            initial={{ scale: 0.9, opacity: 0, y: 20 }} 
            animate={{ scale: 1, opacity: 1, y: 0 }} 
            exit={{ scale: 0.9, opacity: 0, y: 20 }} 
            onClick={e => e.stopPropagation()} 
            style={{maxWidth: '400px', textAlign: 'center', padding: '2.5rem 1.5rem', borderRadius: '32px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)'}}
          >
            
            <motion.div 
              initial={{ rotate: -10 }} 
              animate={{ rotate: 10 }} 
              transition={{ repeat: Infinity, repeatType: 'reverse', duration: 2 }}
              style={{
                display: 'inline-flex', padding: '18px', borderRadius: '24px', 
                background: (isSurrender || isDelete) ? 'rgba(255, 68, 68, 0.1)' : 'rgba(0, 255, 255, 0.1)', 
                border: `1px solid ${(isSurrender || isDelete) ? 'rgba(255, 68, 68, 0.2)' : 'rgba(0, 255, 255, 0.2)'}`, 
                marginBottom: '1.5rem', filter: (isSurrender || isDelete) ? 'drop-shadow(0 0 10px rgba(255, 68, 68, 0.2))' : 'drop-shadow(0 0 10px rgba(0, 255, 255, 0.2))'
              }}
            >
               {icon}
            </motion.div>

            <h2 className="modal-title" style={{fontSize: '1.75rem', marginBottom: '1.25rem', letterSpacing: '0.05em'}}>
               {title}
            </h2>
            
            <p style={{fontSize: '0.9rem', opacity: 0.7, lineHeight: 1.6, marginBottom: '2.5rem', padding: '0 0.5rem'}}>
               {description}
            </p>

            <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
               <button 
                 className="primary-btn" 
                 style={{
                   width: '100%', height: '60px', borderRadius: '18px',
                   background: isTruce ? 'linear-gradient(135deg, var(--accent-cyan), #00cccc)' : 'linear-gradient(135deg, #ff4444, #cc0000)', 
                   color: isTruce ? 'black' : 'white', boxShadow: glowShadow
                 }} 
                 onClick={onConfirm}
               >
                  {btnText}
               </button>
               <button 
                 className="glass-morphism" 
                 style={{width: '100%', height: '56px', borderRadius: '18px', border: '1px solid rgba(255, 255, 255, 0.1)', fontWeight: 800, cursor: 'pointer', color: 'rgba(255,255,255,0.6)'}} 
                 onClick={onClose}
               >
                  GO BACK
               </button>
            </div>

          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Helper for two-tap purge
function DeleteConfirmButton({ takeId, onDelete }) {
  const [confirming, setConfirming] = useState(false);
  const [purged, setPurged] = useState(false);

  if (purged) return <span style={{fontSize: '0.6rem', fontWeight: 900, opacity: 0.4}}>PURGED</span>;

  return (
    <button 
      onClick={(e) => {
        e.stopPropagation();
        if (!confirming) {
          setConfirming(true);
          setTimeout(() => setConfirming(false), 3000); // Reset after 3 seconds
        } else {
          setPurged(true);
          onDelete(takeId);
        }
      }}
      style={{ 
        background: confirming ? 'var(--accent-neon)' : 'rgba(255, 68, 68, 0.08)', 
        color: confirming ? 'black' : '#ff4444', 
        border: '1px solid ' + (confirming ? 'var(--accent-neon)' : 'rgba(255, 68, 68, 0.3)'), 
        padding: '8px 16px', borderRadius: '12px', fontSize: '0.6rem', fontWeight: 900, cursor: 'pointer',
        minWidth: confirming ? '110px' : '80px',
        transition: 'all 0.3s cubic-bezier(0.19, 1, 0.22, 1)',
        boxShadow: confirming ? '0 0 15px var(--accent-neon)' : 'none'
      }}
    >
      {confirming ? 'CONFIRM PURGE?' : 'DELETE'}
    </button>
  );
}


function AdminDashboard({ takes, reports, stats: adminStats, userMap, onDismissReport, onDeleteTake, onFeatureTake, onBanUser, setView }) {
  const stats = {
    totalTakes: adminStats.totalTakes,
    activeDebates: adminStats.activeFights,
    concludedDebates: adminStats.totalTakes - adminStats.activeFights, // Approximate concluded
    totalUsers: adminStats.totalUsers,
    totalReports: adminStats.reports
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="admin-dashboard-overlay"
      style={{ 
        padding: '2rem 1.5rem', 
        paddingTop: '6rem', // Clear top header
        paddingBottom: '320px', // Clear bottom nav fully
        position: 'relative',
        zIndex: 5,
        minHeight: '110vh'
      }}
    >
      <div className="hq-header" style={{ marginBottom: '3rem', textAlign: 'center' }}>
         <motion.div 
           initial={{ scale: 0.8, opacity: 0 }}
           animate={{ scale: 1, opacity: 1 }}
           style={{ display: 'inline-flex', padding: '12px', borderRadius: '16px', background: 'rgba(0, 255, 255, 0.1)', border: '1px solid rgba(0, 255, 255, 0.2)', marginBottom: '1rem' }}
         >
           <Shield size={28} color="var(--accent-cyan)" />
         </motion.div>
         <h2 style={{ fontSize: '2.25rem', fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em', fontWeight: 900 }}>ADMIN <span className="glow-text">HQ</span></h2>
         <p style={{ fontSize: '0.75rem', opacity: 0.4, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', marginTop: '0.5rem' }}>Arena Oversight Terminal</p>
      </div>

      <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
        {[
          { label: 'TOTAL TAKES', value: stats.totalTakes, icon: <Flame size={16} /> },
          { label: 'TOTAL USERS', value: stats.totalUsers, icon: <User size={16} /> },
          { label: 'ACTIVE FIGHTS', value: stats.activeDebates, icon: <Sword size={16} /> },
          { label: 'REPORTS', value: stats.totalReports, icon: <Flag size={16} color={stats.totalReports > 0 ? "#ff4444" : "inherit"} /> }
        ].map(stat => (
          <div key={stat.label} className="glass-morphism" style={{ padding: '1.25rem', borderRadius: '20px', textAlign: 'center' }}>
            <div style={{ opacity: 0.4, fontSize: '0.6rem', fontWeight: 900, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              {stat.icon} {stat.label}
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 900 }}>{stat.value}</div>
          </div>
        ))}
      </div>

      <div className="admin-section" style={{ background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '3rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem' }}>
          <Flag size={18} color="#ff4444" />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 900, opacity: 0.8 }}>ACTIVE REPORTS ({reports.length})</h3>
        </div>
        {reports.length === 0 ? (
          <div className="glass-morphism" style={{ padding: '3rem 2rem', textAlign: 'center', opacity: 0.5, borderRadius: '24px' }}>
            <CheckCircle size={40} style={{ marginBottom: '1rem', opacity: 0.2 }} />
            <p>Arena is clean. No active reports.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {reports.map(report => {
               const take = takes.find(t => t.id === report.takeId);
               return (
                 <div key={report.id} className="glass-morphism" style={{ padding: '1.5rem', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                       <div style={{ fontSize: '0.7rem', opacity: 0.4, fontWeight: 900 }}>REPORTED BY @{report.reportedBy}</div>
                       <button onClick={() => onDismissReport(report.id)} style={{ background: 'none', border: 'none', color: 'var(--accent-cyan)', fontSize: '0.6rem', fontWeight: 900, cursor: 'pointer' }}>DISMISS</button>
                    </div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 600, fontStyle: 'italic', marginBottom: '1rem' }}>"{report.content}"</div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                       <button onClick={() => { setView('explore'); /* Auto search? No, just delete. */ onDeleteTake(report.takeId); }} className="danger-btn" style={{ flex: 1, height: '40px', borderRadius: '10px', fontSize: '0.7rem', fontWeight: 900, background: 'rgba(255,68,68,0.1)', color: '#ff4444', border: '1px solid rgba(255,68,68,0.2)' }}>DELETE TAKE</button>
                       <button onClick={() => onBanUser(report.author)} className="danger-btn" style={{ flex: 1, height: '40px', borderRadius: '10px', fontSize: '0.7rem', fontWeight: 900, background: 'rgba(255,68,68,0.1)', color: '#ff4444', border: '1px solid rgba(255,68,68,0.2)' }}>BAN AUTHOR</button>
                    </div>
                 </div>
               );
            })}
          </div>
        )}
      </div>

      <div className="admin-section" style={{ background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '3rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '0.4rem' }}>
          <Zap size={18} color="var(--accent-yellow)" />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 900, opacity: 0.8 }}>FEATURE ARENA FIGHTS</h3>
        </div>
        <p style={{ fontSize: '0.7rem', opacity: 0.4, marginBottom: '1.25rem', fontWeight: 600 }}>Only active debates with a challenger can be featured.</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
           {takes.length === 0 ? (
             <div className="glass-morphism" style={{ padding: '2rem', textAlign: 'center', opacity: 0.5 }}>NO DEBATES IN SYSTEM</div>
           ) : (
             takes.filter(t => (t.challenger && !t.isConcluded) || t.isFeatured).map(take => (
               <div key={take.id} className="glass-morphism" style={{ padding: '1rem', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '12px', border: take.isFeatured ? '1px solid var(--accent-yellow)' : '1px solid transparent' }}>
                  <div style={{ flex: 1 }}>
                     <div style={{ fontSize: '0.8rem', fontWeight: 900, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{take.content}</div>
                     <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                        <span style={{ fontSize: '0.55rem', fontWeight: 900, opacity: 0.4, textTransform: 'uppercase' }}>@{take.user} VS @{take.challenger || '...'}</span>
                        {take.isConcluded && <span style={{ fontSize: '0.55rem', fontWeight: 900, color: '#ff4444' }}>[FINISHED]</span>}
                     </div>
                  </div>
                  <button 
                    disabled={take.isConcluded && !take.isFeatured}
                    onClick={() => onFeatureTake(take.id, !take.isFeatured)} 
                    style={{ 
                      padding: '8px 12px', borderRadius: '10px', fontSize: '0.6rem', fontWeight: 900, 
                      background: take.isFeatured ? 'var(--accent-yellow)' : 'rgba(255,255,255,0.05)',
                      color: take.isFeatured ? 'black' : 'white', border: 'none', cursor: 'pointer',
                      opacity: (take.isConcluded && !take.isFeatured) ? 0.3 : 1
                    }}
                  >
                    {take.isFeatured ? 'UN-FEATURE' : 'FEATURE FIGHT'}
                  </button>
               </div>
             ))
           )}
        </div>
      </div>
      <div className="admin-section" style={{ background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem' }}>
          <Trash2 size={18} color="#ff4444" />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 900, opacity: 0.8 }}>PURGE ARENA CONTENT</h3>
        </div>
        
        {['Live', 'Unchallenged', 'Finished'].map(cat => {
          let list = [];
          if (cat === 'Live') list = takes.filter(t => t.challenger && !t.isConcluded);
          if (cat === 'Unchallenged') list = takes.filter(t => !t.challenger && !t.isConcluded);
          if (cat === 'Finished') list = takes.filter(t => t.isConcluded);

          return (
            <div key={cat} style={{ marginBottom: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
                <div style={{ padding: '4px 10px', borderRadius: '6px', background: cat === 'Live' ? 'var(--accent-neon)' : 'rgba(255,255,255,0.05)', color: cat === 'Live' ? 'black' : 'white', fontSize: '0.6rem', fontWeight: 900 }}>{cat.toUpperCase()}</div>
                <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.05)' }}></div>
                <div style={{ opacity: 0.4, fontSize: '0.6rem', fontWeight: 900 }}>{list.length} ITEMS</div>
              </div>

              {list.length === 0 ? (
                <div style={{ padding: '1rem', border: '1px dashed rgba(255,255,255,0.05)', borderRadius: '12px', fontSize: '0.7rem', opacity: 0.3, textAlign: 'center' }}>NO {cat.toUpperCase()} CONTENT</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {list.map(take => (
                    <div key={take.id} className="glass-morphism" style={{ padding: '0.75rem 1rem', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ flex: 1, fontSize: '0.75rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', opacity: 0.8 }}>"{take.content}"</div>
                      <DeleteConfirmButton takeId={take.id} onDelete={onDeleteTake} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

// --- Main App ---
function App() {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [view, setView] = useState('explore');
  const [feedLimit, setFeedLimit] = useState(50); // Pagination state
  const [userTotalTakes, setUserTotalTakes] = useState(0); // Personal total takes
  const isAdmin = user?.email === 'ffearmme@gmail.com';
  const [userMap, setUserMap] = useState({});
  const [adminStats, setAdminStats] = useState({
    totalUsers: 0,
    totalTakes: 0,
    activeFights: 0,
    reports: 0
  });
  const [reports, setReports] = useState([]);
  const [activeDebate, setActiveDebate] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isHallOfFameOpen, setIsHallOfFameOpen] = useState(false);
  const [isRepModalOpen, setIsRepModalOpen] = useState(false);
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);
  const [confirmingChallenge, setConfirmingChallenge] = useState(null);
  const [confirmingSurrender, setConfirmingSurrender] = useState(null);
  const [confirmingTruce, setConfirmingTruce] = useState(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [previewingUser, setPreviewingUser] = useState(null);
  const [authError, setAuthError] = useState(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'signup'
  
  const [takes, setTakes] = useState([]);

  // Global Users Listener
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "users"), (snapshot) => {
      setAdminStats(prev => ({ ...prev, totalUsers: snapshot.size }));
      const usersProfileMap = {};
      snapshot.docs.forEach(d => {
        const data = d.data();
        if (data.username) usersProfileMap[data.username] = data;
      });
      setUserMap(usersProfileMap);
    });
    return () => unsubscribe();
  }, []);

  // Global Admin Metrics Listener (Takes & Active Fights)
  useEffect(() => {
    if (!isAdmin) return;
    
    // Total Takes & Active Fights (No limit for admin stats)
    const unsubscribe = onSnapshot(collection(db, "takes"), (snapshot) => {
      const allTakes = snapshot.docs.map(d => d.data());
      const activeFights = allTakes.filter(t => t.challenger && !t.isConcluded).length;
      setAdminStats(prev => ({ 
        ...prev, 
        totalTakes: snapshot.size,
        activeFights: activeFights
      }));
    });
    
    return () => unsubscribe();
  }, [isAdmin]);

  // Personal Take Count Listener
  useEffect(() => {
    if (!user || !userData) return;
    const q = query(collection(db, "takes"), where("user", "==", userData.username));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setUserTotalTakes(snapshot.size);
    });
    return () => unsubscribe();
  }, [user, userData?.username]);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (!u) {
        setIsLoading(false);
        setUserData(null);
      }
    });
    return () => unsubscribe();
  }, []);

  // Real-time User Profile Listener
  useEffect(() => {
    if (!user) return;
    
    setIsLoading(true);
    const unsubscribe = onSnapshot(doc(db, "users", user.uid), (docSnap) => {
      if (docSnap.exists()) {
        setUserData(docSnap.data());
      } else {
        // Fallback for new users during signup flow
        const fallback = { 
          username: user.displayName || 'TheGhost', 
          reputation: 1500, 
          wins: 0, 
          joined: new Date().toLocaleDateString(),
          avatar: getAvatarUrl(user.displayName || user.uid),
          hasSeenTutorial: false
        };
        setUserData(fallback);
      }
      setIsLoading(false);
    }, (err) => {
      console.error("Profile listen error:", err);
      setIsLoading(false);
    });
    
    return () => unsubscribe();
  }, [user]);

  // SPECIAL: Admin Identity Reset (Requested)
  useEffect(() => {
    if (user?.email === 'ffearmme@gmail.com' && userData) {
      if (userData.reputation > 1500 || userData.wins > 0) {
        console.log("ARENA OVERRIDE: Resetting admin identity...");
        updateDoc(doc(db, "users", user.uid), { 
          reputation: 1500, 
          wins: 0,
          aura: 'none'
        });
      }
    }
  }, [user, userData]);

  // Real-time Feed Listener
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "takes"), orderBy("createdAt", "desc"), limit(feedLimit));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const feed = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTakes(feed);
    });
    return () => unsubscribe();
  }, [user, feedLimit]);

  // Debate Timer Auto-Conclude Logic
  useEffect(() => {
    if (!takes || takes.length === 0 || !userData) return;
    const interval = setInterval(() => {
      const now = Date.now();
      takes.forEach(t => {
        if (t.challenger && !t.isConcluded && t.createdAt) {
          const elapsed = now - t.createdAt.toMillis();
          if (elapsed >= (6 * 60 * 60 * 1000)) { // 6 Hours
            // Only the participants or admin trigger the end, to prevent spam
            if (user?.uid === t.authorUid || user?.username === t.challenger || isAdmin) {
              handleFinalizeDebate(t, { reason: 'timeout' });
            }
          }
        }
      });
    }, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [takes, userData, user, isAdmin]);

  // Real-time Reports Listener (Admin Only)
  useEffect(() => {
    if (!isAdmin) return;
    const q = query(collection(db, "reports"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const feed = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setReports(feed);
      setAdminStats(prev => ({ ...prev, reports: snapshot.size }));
    });
    return () => unsubscribe();
  }, [isAdmin]);

  const handleGoogleAuth = async () => {
    setIsAuthenticating(true);
    setAuthError(null);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      const docRef = doc(db, "users", result.user.uid);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        const username = result.user.displayName ? result.user.displayName.replace(/\s+/g, '') : `User${result.user.uid.slice(0,5)}`;
        const newUser = {
          username: username,
          uid: result.user.uid,
          avatar: getAvatarUrl(username),
          joined: new Date().toLocaleDateString(),
          reputation: 1500,
          wins: 0,
          hasSeenTutorial: false
        };
        await setDoc(docRef, newUser);
      }
    } catch(err) {
      console.error(err);
      if (err.code !== 'auth/popup-closed-by-user') {
        setAuthError(err.message.replace('Firebase:', '').trim());
      }
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleAuth = async (username, emailVal, password) => {
    setIsAuthenticating(true);
    setAuthError(null);
    const email = emailVal.trim().toLowerCase();

    try {
      if (authMode === 'login') {
        const finalEmail = email.includes('@') ? email : `${email}@takes.live`;
        await signInWithEmailAndPassword(auth, finalEmail, password);
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        
        // Send Verification Email
        await sendEmailVerification(userCredential.user);
        
        const newUser = {
          username: username.trim(),
          uid: userCredential.user.uid,
          avatar: getAvatarUrl(username.trim()),
          joined: new Date().toLocaleDateString(),
          reputation: 1500,
          wins: 0,
          hasSeenTutorial: false
        };
        await setDoc(doc(db, "users", userCredential.user.uid), newUser);
        setUserData(newUser);
      }
    } catch (err) {
      console.error(err);
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setAuthError("INCORRECT HANDLE OR PASSWORD.");
      } else if (err.code === 'auth/email-already-in-use') {
        setAuthMode('login');
        setAuthError("HANDLE ALREADY TAKEN. TRY LOGGING IN.");
      } else {
        setAuthError(err.message.replace('Firebase:', '').trim());
      }
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setView('explore');
  };

  useEffect(() => {
    if(activeDebate) {
       const fresh = takes.find(t => t.id === activeDebate.id);
       if(fresh) setActiveDebate(fresh);
    }
  }, [takes]);

  const handleAddTake = async ({ content, category }) => {
    if (!userData) return;
    const newTake = { 
      user: userData.username, 
      authorUid: user.uid, // Store UID for reputation updates
      content, 
      category, 
      agrees: 0, 
      disagrees: 0, 
      agreeVoters: [],
      disagreeVoters: [],
      likes: 0,
      likedBy: [],
      avatar: userData.avatar,
      createdAt: serverTimestamp()
    };
    await addDoc(collection(db, "takes"), newTake);
  }

  const handleChallenge = async (take) => {
    if (take.isConcluded || take.challenger) {
      setActiveDebate(take);
    } else if (take.user !== userData.username) {
      setConfirmingChallenge(take);
    } else {
      setActiveDebate(take);
    }
  }

  const executeChallenge = async (take) => {
    const takeRef = doc(db, "takes", take.id);
    await updateDoc(takeRef, { challenger: userData.username });
    
    // REP BOOST: Both players get reputation for starting a fight
    // This incentivizes activity and courage in the arena
    try {
      const defenderUid = take.authorUid || userMap[take.user]?.uid;
      const challengerUid = user?.uid;

      if (defenderUid) {
        await updateDoc(doc(db, "users", defenderUid), {
          reputation: increment(25) // Courageous Defense bonus
        });
      }
      if (challengerUid) {
        await updateDoc(doc(db, "users", challengerUid), {
          reputation: increment(25) // Challenger Spirit bonus
        });
      }
    } catch (err) {
      console.error("COLLECTIVE REP BOOST FAILURE:", err);
    }

    setActiveDebate({ ...take, challenger: userData.username });
    setConfirmingChallenge(null);
  }

  const handleSurrender = async (take) => {
    if (take.isConcluded) return;
    setConfirmingSurrender(take);
  };

  const executeSurrender = async (take) => {
    const isDefender = user.username === take.user;
    const winnerName = isDefender ? take.challenger : take.user;
    await handleFinalizeDebate(take, { forcedWinner: winnerName, reason: 'surrender', surrenderedBy: user.username });
    setConfirmingSurrender(null);
  }

  const handleTruce = async (take) => {
    if (take.isConcluded) return;
    setConfirmingTruce(take);
  };

  const executeTruce = async (take) => {
    const takeRef = doc(db, "takes", take.id);
    const updatedVotes = take.truceVotes || [];
    if (updatedVotes.includes(user.uid)) return;

    const newVotes = [...updatedVotes, user.uid];
    await updateDoc(takeRef, { truceVotes: newVotes });

    if (newVotes.length >= 2) {
      await handleFinalizeDebate(take, { isDraw: true, reason: 'truce' });
    }
    setConfirmingTruce(null);
  }

  const handleFinalizeDebate = async (take, options = {}) => {
    if (!take || !take.id || !take.challenger || take.isConcluded) return;
    
    const isDraw = options.isDraw || false;
    const isDefenderWinner = isDraw ? false : (options.forcedWinner ? options.forcedWinner === take.user : (take.agrees || 0) >= (take.disagrees || 0));
    const winnerName = isDraw ? 'DRAW' : (options.forcedWinner || (isDefenderWinner ? take.user : take.challenger));

    // 1. Immediate UI update
    setActiveDebate(prev => ({ 
      ...prev, 
      isConcluded: true, 
      winner: winnerName, 
      endReason: options.reason || 'crowd',
      surrenderedBy: options.surrenderedBy
    }));

    try {
      await updateDoc(doc(db, "takes", take.id), {
        isConcluded: true,
        winner: winnerName,
        endReason: options.reason || 'crowd',
        surrenderedBy: options.surrenderedBy || null,
        isFeatured: false, // Automatically un-feature on conclusion
        endedAt: serverTimestamp()
      });

      if (!isDraw) {
        const defenderUid = take.authorUid || userMap[take.user]?.uid;
        const challengerUid = userMap[take.challenger]?.uid;
        if (defenderUid && challengerUid) {
          const winnerUid = winnerName === take.user ? defenderUid : challengerUid;
          const loserUid = winnerName === take.user ? challengerUid : defenderUid;
          const loserPenalty = options.reason === 'surrender' ? -30 : -50; 

          await Promise.all([
            updateDoc(doc(db, "users", winnerUid), {
              reputation: increment(100),
              wins: increment(1)
            }),
            updateDoc(doc(db, "users", loserUid), {
              reputation: increment(loserPenalty)
            })
          ]);
        }
      }
    } catch (err) {
      console.error("BATTLE END FAILURE:", err);
    }
  };

  const handleLikeTake = async (id) => {
    if (!user || !userData) return;
    try {
      const takeRef = doc(db, "takes", id);
      const takeSnap = await getDoc(takeRef);
      if (!takeSnap.exists()) return;
      
      const takeData = takeSnap.data();
      const likedBy = takeData.likedBy || [];
      const userUid = user.uid;
      const authorUid = takeData.authorUid || userMap[takeData.user]?.uid;

      if (likedBy.includes(userUid)) {
        // Unlike
        await updateDoc(takeRef, {
           likes: increment(-1),
           likedBy: arrayRemove(userUid)
        });
        // REP LOSS: Losing a heart costs the author rep
        if (authorUid) {
          await updateDoc(doc(db, "users", authorUid), {
            reputation: increment(-5)
          });
        }
      } else {
        // Like
        await updateDoc(takeRef, {
           likes: increment(1),
           likedBy: arrayUnion(userUid)
        });
        // REP GAIN: Each heart gives the author rep
        if (authorUid) {
          await updateDoc(doc(db, "users", authorUid), {
            reputation: increment(5)
          });
        }
      }
    } catch (err) {
      console.error("LIKE FAILURE:", err);
    }
  };

  const handleAction = async (type, id) => {
    if (!user || !userData) return;
    try {
      const takeRef = doc(db, "takes", id);
      const takeSnap = await getDoc(takeRef);
      if (!takeSnap.exists()) return;
      
      const takeData = takeSnap.data();
      const agreeVoters = takeData.agreeVoters || [];
      const disagreeVoters = takeData.disagreeVoters || [];
      const authorUid = takeData.authorUid || userMap[takeData.user]?.uid;
      const challengerUid = userMap[takeData.challenger]?.uid;
      const userUid = user.uid;

      if (authorUid === userUid || (takeData.challenger && challengerUid === userUid)) return; // Can't vote on own debate

      let update = {};
      let defenderRepChange = 0;
      let challengerRepChange = 0;

      // JURY VOTE VALUES:
      // Agree: +10 to Author, -5 to Opponent
      // Disagree: +10 to Opponent, -5 to Author
      // Toggling/Switching cascades these values

      if (type === 'agree') {
        if (agreeVoters.includes(userUid)) {
          // Toggle off Agree
          update = { agrees: increment(-1), agreeVoters: arrayRemove(userUid) };
          defenderRepChange = -10;
          challengerRepChange = 5;
        } else if (disagreeVoters.includes(userUid)) {
          // Switch: Disagree -> Agree
          update = { 
            agrees: increment(1), 
            disagrees: increment(-1), 
            agreeVoters: arrayUnion(userUid), 
            disagreeVoters: arrayRemove(userUid) 
          };
          defenderRepChange = 15; // Reverse -5, add +10
          challengerRepChange = -15; // Reverse +10, add -5
        } else {
          // New Agree
          update = { agrees: increment(1), agreeVoters: arrayUnion(userUid) };
          defenderRepChange = 10;
          challengerRepChange = -5;
        }
      } else {
        // Disagree
        if (disagreeVoters.includes(userUid)) {
          // Toggle off Disagree
          update = { disagrees: increment(-1), disagreeVoters: arrayRemove(userUid) };
          challengerRepChange = -10;
          defenderRepChange = 5;
        } else if (agreeVoters.includes(userUid)) {
          // Switch: Agree -> Disagree
          update = { 
            disagrees: increment(1), 
            agrees: increment(-1), 
            disagreeVoters: arrayUnion(userUid), 
            agreeVoters: arrayRemove(userUid) 
          };
          challengerRepChange = 15; // Reverse -5, add +10
          defenderRepChange = -15; // Reverse +10, add -5
        } else {
          // New Disagree
          update = { disagrees: increment(1), disagreeVoters: arrayUnion(userUid) };
          challengerRepChange = 10;
          defenderRepChange = -5;
        }
      }

      await updateDoc(takeRef, update);
      
      // APPLY REPUTATION CHANGES
      const updates = [];
      if (authorUid && defenderRepChange !== 0) {
        updates.push(updateDoc(doc(db, "users", authorUid), { reputation: increment(defenderRepChange) }));
      }
      if (takeData.challenger && challengerUid && challengerRepChange !== 0) {
        updates.push(updateDoc(doc(db, "users", challengerUid), { reputation: increment(challengerRepChange) }));
      }
      
      if (updates.length > 0) await Promise.all(updates);
      
    } catch(err) {
      console.error("Action error:", err);
    }
  }

  const handleDeleteTake = async (takeId) => {
    alert("PURGE SEQUENCE INITIATED FOR: " + takeId);
    try {
      await deleteDoc(doc(db, "takes", takeId));
      
      // Also delete any associated reports
      const takeReports = reports.filter(r => r.takeId === takeId);
      for (const r of takeReports) {
        await deleteDoc(doc(db, "reports", r.id));
      }
      
      console.log("SUCCESS: Take purged from arena.");
    } catch(err) {
      console.error("PURGE ERROR:", err);
      alert("ARENA SECURE: " + err.message);
    }
  }

  const handleReportTake = async (take) => {
    if (!user) return;
    try {
      await addDoc(collection(db, "reports"), {
        takeId: take.id,
        content: take.content,
        author: take.user,
        reportedBy: userData.username,
        createdAt: serverTimestamp(),
        type: 'take'
      });
      alert("Take reported to the arena council.");
    } catch (err) {
      console.error(err);
    }
  };

  const handleFeatureTake = async (id, isFeatured) => {
    if (!isAdmin) return;
    try {
      await updateDoc(doc(db, "takes", id), { isFeatured });
    } catch (err) {
      console.error(err);
    }
  };

  const handleBanUser = async (username) => {
    if (!isAdmin) return;
    try {
      // Specialized admin reset (Identity purge)
      if (username === 'SELF_RESET') {
        const adminUid = user.uid;
        await updateDoc(doc(db, "users", adminUid), { 
          reputation: 1500, 
          wins: 0,
          aura: 'none'
        });
        alert(`SUCCESS: Your identity has been reset to Novice.`);
        window.location.reload();
        return;
      }

      const targetUser = Object.values(userMap).find(u => u.username === username);
      if (targetUser && targetUser.uid) {
        await updateDoc(doc(db, "users", targetUser.uid), { isBanned: true });
        alert(`User @${username} has been banned.`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteMessage = async (takeId, messageId) => {
    if (!isAdmin || messageId === 1) return; // Prevent deleting the mock initial message
    try {
       await deleteDoc(doc(db, "takes", takeId, "messages", messageId.toString()));
    } catch (err) {
      console.error(err);
    }
  };

  const handleDismissReport = async (reportId) => {
    if (!isAdmin) return;
    try {
      await deleteDoc(doc(db, "reports", reportId));
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user || !userData) return;
    setConfirmingDelete(true);
  };

  const executeDeleteAccount = async () => {
    if (!user || !userData) return;
    
    setConfirmingDelete(false);
    setIsSettingsOpen(false);

    try {
      setIsLoading(true);

      // 1. Delete all stagnant takes (not live)
      const myTakes = takes.filter(t => t.user === userData.username && !t.challenger);
      for (const t of myTakes) {
        await deleteDoc(doc(db, "takes", t.id));
      }

      // 2. Delete Firestore profile
      await deleteDoc(doc(db, "users", user.uid));

      // 3. Delete Firebase Auth user
      await deleteUser(user);

      alert("SUCCESS: Your arena identity has been purged.");
      window.location.reload();

    } catch (err) {
      console.error(err);
      if (err.code === 'auth/requires-recent-login') {
        alert("SECURITY LOCK: This action requires a fresh login. Please log out and back in, then try again immediately.");
      } else {
        alert("CRITICAL PURGE ERROR: " + err.message);
      }
    } finally {
      setIsLoading(false);
      setConfirmingDelete(false);
    }
  }

  if (isLoading || (user && !userData)) {
    return (
      <div className="app-container login-gate">
         <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
            <Activity size={48} color="var(--accent-cyan)" />
         </motion.div>
      </div>
    );
  }

  // Handle email verification requirement
  const isEmailAuth = user?.providerData?.some(p => p.providerId === 'password');
  const needsVerification = user && isEmailAuth && !user.emailVerified;

  if (user && userData?.isBanned) {
    return (
      <div className="app-container login-gate">
        <motion.div 
          className="login-card glass-morphism"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{textAlign: 'center', padding: '3rem'}}
        >
          <div className="logo" style={{fontSize: '2rem', marginBottom: '1.5rem'}}>HOT<span>TAKES</span></div>
          <div style={{background: 'rgba(255, 68, 68, 0.1)', padding: '2rem', borderRadius: '20px', border: '1px solid rgba(255, 68, 68, 0.2)'}}>
            <Shield size={48} color="#ff4444" style={{marginBottom: '1rem', display: 'block', margin: '0 auto 1.5rem'}} />
            <h2 style={{fontFamily: 'var(--font-heading)', fontSize: '1.5rem', marginBottom: '1rem'}}>ACCOUNT SUSPENDED</h2>
            <p style={{opacity: 0.6, fontSize: '0.9rem', lineHeight: '1.6'}}>You have been banned from the arena for violating community standards.</p>
            
            <button 
              className="primary-btn" 
              style={{width: '100%', height: '54px', borderRadius: '12px', marginTop: '2rem', background: '#ff4444'}}
              onClick={handleLogout}
            >
              EXIT ARENA
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (user && needsVerification) {
    return (
      <div className="app-container login-gate">
        <motion.div 
          className="login-card glass-morphism"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{textAlign: 'center', padding: '3rem'}}
        >
          <div className="logo" style={{fontSize: '2rem', marginBottom: '1.5rem'}}>HOT<span>TAKES</span></div>
          <div style={{background: 'rgba(255,255,255,0.05)', padding: '2rem', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)'}}>
            <Mail size={48} color="var(--accent-cyan)" style={{marginBottom: '1rem', display: 'block', margin: '0 auto 1.5rem'}} />
            <h2 style={{fontFamily: 'var(--font-heading)', fontSize: '1.5rem', marginBottom: '1rem'}}>VERIFY YOUR EMAIL</h2>
            <p style={{opacity: 0.6, fontSize: '0.9rem', lineHeight: '1.6'}}>We've sent a portal link to <span style={{color: 'white', fontWeight: 900}}>{user.email}</span>.</p>
            <p style={{opacity: 0.8, fontSize: '0.85rem', marginTop: '1rem', color: 'var(--accent-neon)', fontWeight: 700}}>Check your spam/junk folder if you don't see it!</p>
            <p style={{opacity: 0.6, fontSize: '0.9rem', marginTop: '0.5rem'}}>Please verify your identity to enter the arena.</p>
            
            <button 
              className="primary-btn" 
              style={{width: '100%', height: '54px', borderRadius: '12px', marginTop: '2rem'}}
              onClick={() => window.location.reload()}
            >
              I'VE VERIFIED MY EMAIL
            </button>

            <button 
              style={{background: 'none', border: 'none', color: 'white', opacity: 0.4, fontSize: '0.8rem', marginTop: '1.5rem', cursor: 'pointer', fontWeight: 700}}
              onClick={async () => {
                await sendEmailVerification(user);
                alert("Verification email resent!");
              }}
            >
              RESEND EMAIL
            </button>
          </div>
          
          <button 
            style={{background: 'none', border: 'none', color: 'white', opacity: 0.4, fontSize: '0.8rem', marginTop: '2.5rem', cursor: 'pointer', fontWeight: 700}}
            onClick={handleLogout}
          >
            NOT YOUR EMAIL? SIGN OUT
          </button>
        </motion.div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="app-container login-gate">
        <motion.div 
          className="login-card glass-morphism"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className="logo" style={{fontSize: '2.5rem', marginBottom: '1rem'}}>HOT<span>TAKES</span></div>
          <p style={{opacity: 0.6, marginBottom: '2.5rem', textAlign: 'center'}}>Controversial takes. Live matches. Crowd sourced truth.</p>
          
          <form onSubmit={(e) => { 
            e.preventDefault(); 
            const u = e.target.username ? e.target.username.value : '';
            handleAuth(u, e.target.email.value, e.target.password.value); 
          }} style={{width: '100%'}}>
            <AnimatePresence mode="wait">
              {authError && (
                <motion.div 
                  className="error-message"
                  initial={{ opacity: 0, y: -20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                >
                  <CircleAlert size={18} />
                  <span>{authError}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {authMode === 'signup' && (
              <div className="input-group" style={{marginBottom: '1rem'}}>
                <User size={20} />
                <input 
                  name="username" 
                  placeholder="Choose a handle..." 
                  required 
                  autoComplete="off" 
                  disabled={isAuthenticating} 
                />
              </div>
            )}

            <div className="input-group">
              <Mail size={20} />
              <input 
                name="email" 
                placeholder="Enter your email..." 
                required 
                autoComplete="email" 
                disabled={isAuthenticating} 
              />
            </div>
            
            <div className="input-group" style={{marginTop: '1rem'}}>
              <Key size={20} />
              <input 
                type="password" 
                name="password" 
                placeholder={authMode === 'signup' ? "Create a password..." : "Enter your password..."} 
                required 
                disabled={isAuthenticating} 
              />
            </div>
            
            <button 
              className="primary-btn" 
              style={{width: '100%', height: '60px', borderRadius: '16px', marginTop: '2rem'}}
              disabled={isAuthenticating}
            >
              {isAuthenticating ? (
                <div className="loader-container">
                  <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
                    <Zap size={20} />
                  </motion.div>
                  <span>{authMode === 'login' ? 'CONNECTING...' : 'IGNITING...'}</span>
                </div>
              ) : (authMode === 'login' ? 'ENTER THE ARENA' : 'START YOUR LEGACY')}
            </button>

            <div style={{display: 'flex', alignItems: 'center', margin: '1.5rem 0', opacity: 0.5}}>
              <div style={{flex: 1, height: '1px', background: 'white'}}></div>
              <span style={{padding: '0 1rem', fontSize: '0.75rem', fontWeight: 900}}>OR</span>
              <div style={{flex: 1, height: '1px', background: 'white'}}></div>
            </div>

            <button 
              type="button"
              onClick={handleGoogleAuth}
              className="glass-morphism"
              style={{width: '100%', height: '60px', borderRadius: '16px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', fontWeight: 900, fontSize: '0.9rem', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.1)', color: 'white'}}
              disabled={isAuthenticating}
            >
              <svg width="24" height="24" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
              SIGN IN WITH GOOGLE
            </button>

            <button 
              type="button"
              onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
              style={{
                marginTop: '1rem',
                width: '100%',
                background: 'none',
                border: 'none',
                color: 'white',
                opacity: 0.6,
                fontSize: '0.85rem',
                cursor: 'pointer',
                fontWeight: 600,
                letterSpacing: '0.05em'
              }}
              onMouseEnter={(e) => e.target.style.opacity = 1}
              onMouseLeave={(e) => e.target.style.opacity = 0.6}
            >
              {authMode === 'login' ? "DON'T HAVE AN ACCOUNT? JOIN ARENA" : "ALREADY HAVE AN ACCOUNT? LOG IN"}
            </button>
          </form>
          
          <div style={{marginTop: '2rem', display: 'flex', justifyContent: 'center', gap: '2rem', opacity: 0.4}}>
            <Flame size={20} />
            <TrendingUp size={20} />
            <Sword size={20} />
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="app-container">
      <header className="header glass-morphism">
        <div className="logo" onClick={() => setView('explore')} style={{cursor: 'pointer'}}>HOT<span>TAKES</span></div>
        <div style={{display: 'flex', gap: '8px', alignItems: 'center'}}>
           {isAdmin && (
             <button 
               className={`close-btn ${view === 'admin' ? 'active-admin' : ''}`} 
               onClick={() => setView('admin')} 
               style={{
                 width: '38px', height: '38px', 
                 background: view === 'admin' ? 'rgba(0, 255, 255, 0.15)' : 'rgba(255,255,255,0.03)',
                 color: view === 'admin' ? 'var(--accent-cyan)' : 'white'
               }}
             >
               <Shield size={18} fill={view === 'admin' ? 'var(--accent-cyan)' : 'none'} />
             </button>
           )}
           {view === 'profile' && (
             <button className="close-btn" onClick={() => setIsSettingsOpen(true)} style={{width: '38px', height: '38px'}}>
               <Settings size={18} />
             </button>
           )}
           <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 3 }} style={{marginLeft: '4px'}}>
             <Flame color="var(--accent-neon)" size={26} />
           </motion.div>
        </div>
      </header>

      <main className="main-content">
        <AnimatePresence mode="wait">
          {view === 'explore' ? (
            <motion.div 
              key="explore"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <div className="feed-header">
                <div className="section-title">
                  <TrendingUp size={20} color="var(--accent-cyan)" />
                  <h2>ARENA FEED</h2>
                </div>
                <div className="active-count">
                  {takes.filter(t => !t.isConcluded).length} ACTIVE
                </div>
              </div>

              <div className="arena-feed">
                {isLoading ? (
                  <div className="loader-container"><Activity className="animate-spin" /> LOADING ARENA...</div>
                ) : takes.filter(t => !t.isConcluded).length === 0 ? (
                   <div style={{padding: '4rem 2rem', textAlign: 'center', opacity: 0.5}}>
                      <Sword size={48} style={{marginBottom: '1rem', opacity: 0.2}} />
                      <p>The arena is empty. Start a new take to begin a fight.</p>
                   </div>
                ) : takes.filter(t => !t.isConcluded).map(t => <TakeCard key={t.id} take={t} user={userData} userMap={userMap} onAction={handleAction} onLike={handleLikeTake} onChallenge={handleChallenge} onDelete={handleDeleteTake} onReport={handleReportTake} onUserClick={setPreviewingUser} />)}
                
                {takes.length >= feedLimit && (
                   <button 
                     onClick={() => setFeedLimit(prev => prev + 50)} 
                     className="glass-morphism"
                     style={{
                       width: '100%', padding: '1rem', marginTop: '1rem', 
                       borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)',
                       background: 'rgba(255,255,255,0.05)', color: 'white',
                       fontWeight: 900, cursor: 'pointer', fontSize: '0.8rem'
                     }}
                   >
                     LOAD MORE ARENA LOGS
                   </button>
                )}
              </div>

              <motion.button 
                className="glass-morphism hf-trigger-btn" 
                onClick={() => setIsHallOfFameOpen(true)}
                whileHover={{ scale: 1.02, background: 'rgba(255, 243, 0, 0.1)', borderColor: 'rgba(255, 243, 0, 0.5)' }}
                whileTap={{ scale: 0.98 }}
                style={{
                  width: '100%', marginTop: '2rem', padding: '1.25rem',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px',
                  fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em',
                  color: 'var(--accent-yellow)', border: '1px solid rgba(255, 243, 0, 0.2)',
                  background: 'rgba(255, 243, 0, 0.05)', cursor: 'pointer',
                  borderRadius: '20px'
                }}
              >
                <Trophy size={20} /> VIEW HALL OF FAME
              </motion.button>
            </motion.div>
          ) : view === 'profile' ? (
            (() => {
              const rank = getRankInfo(userData?.reputation || 0);

              return (
                <motion.div 
                  key="profile" 
                  className="profile-page"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <div className="profile-header glass-morphism" style={{ padding: '2.5rem 2rem', borderRadius: '32px', marginBottom: '2rem', textAlign: 'center' }}>
                    <div className={`avatar ${rank.aura}`} style={{ width: '100px', height: '100px', margin: '0 auto 1.5rem', borderRadius: '24px', overflow: 'hidden' }}>
                      <img src={userData?.avatar} alt="pfp" />
                    </div>
                    <h2 style={{ fontSize: '1.8rem', fontWeight: 900, fontFamily: 'var(--font-heading)' }}>@{userData?.username}</h2>
                    
                    <div className="reputation-card">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                         <div style={{ textAlign: 'left' }}>
                            <div style={{ fontSize: '0.7rem', fontWeight: 900, opacity: 0.4, letterSpacing: '0.1em' }}>CURRENT RANK</div>
                            <div className={rank.class} style={{ fontSize: '1.1rem', fontWeight: 900 }}>{rank.name}</div>
                         </div>
                         <div style={{ textAlign: 'right' }}>
                             <div style={{ fontSize: '0.7rem', fontWeight: 900, opacity: 0.4, letterSpacing: '0.1em', display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end' }}>
                                REPUTATION
                             </div>
                             <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px', marginTop: '4px' }}>
                                <div style={{ fontSize: '1.1rem', fontWeight: 900, color: rank.color }}>{userData?.reputation}</div>
                                <button className="how-it-works-btn" onClick={() => setIsRepModalOpen(true)}>
                                   <Shield size={10} /> HELP
                                </button>
                             </div>
                          </div>
                      </div>
                      
                      <div className="reputation-progress">
                         <div 
                            className="reputation-progress-bar" 
                            style={{ width: `${rank.progress}%`, background: rank.color, boxShadow: `0 0 10px ${rank.color}` }} 
                         />
                      </div>
                      {rank.nextRank && (
                        <div style={{ marginTop: '8px', fontSize: '0.6rem', opacity: 0.4, fontWeight: 800, textAlign: 'right', letterSpacing: '0.05em' }}>
                          {Math.ceil(rank.nextRank.min - userData.reputation)} MORE REP TO {rank.nextRank.name}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div style={{marginTop: '2.5rem', display: 'flex', justifyContent: 'center', gap: '2rem'}}>
                     <div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--accent-cyan)' }}>
                           {userTotalTakes}
                        </div>
                        <div style={{ fontSize: '0.6rem', opacity: 0.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>TOTAL TAKES</div>
                     </div>
                     <div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--accent-yellow)' }}>
                           {userData?.wins || 0}
                        </div>
                        <div style={{ fontSize: '0.6rem', opacity: 0.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>ARENA WINS</div>
                     </div>
                  </div>
                  
                  <div style={{marginTop: '3rem'}}>
                     <button className="settings-item glass-morphism" onClick={handleLogout} style={{color: '#ff4444', border: '1px solid rgba(255, 68, 68, 0.2)'}}>
                        <div style={{display: 'flex', gap: '1rem', alignItems: 'center'}}><LogOut size={20} /><span>Sign Out</span></div>
                        <ChevronLeft size={20} style={{transform: 'rotate(180deg)', opacity: 0.3}} />
                     </button>
                  </div>
                </motion.div>
              )
            })()
          ) : view === 'admin' ? (
            <AdminDashboard 
              takes={takes} 
              reports={reports} 
              stats={adminStats}
              userMap={userMap} 
              onDismissReport={handleDismissReport} 
              onDeleteTake={handleDeleteTake} 
              onFeatureTake={handleFeatureTake} 
              onBanUser={handleBanUser} 
              setView={setView}
            />
          ) : null}
        </AnimatePresence>
      </main>

      <div className="bottom-nav-container">
        <nav className="bottom-nav">
          <button className={`nav-item ${view === 'explore' ? 'active' : ''}`} onClick={() => setView('explore')}>
            <TrendingUp size={24} />
            <span className="nav-label">Explore</span>
          </button>
          
          <motion.button 
            className="primary-btn add-button-nav" 
            whileHover={{ scale: 1.1 }} 
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsModalOpen(true)}
          >
            <Plus size={32} strokeWidth={4} />
          </motion.button>
          
          <button className={`nav-item ${view === 'profile' ? 'active' : ''}`} onClick={() => setView('profile')}>
            <User size={24} />
            <span className="nav-label">Profile</span>
          </button>
        </nav>
      </div>

      <AnimatePresence>
        {activeDebate && (
          <DebateRoom 
            take={activeDebate} 
            user={userData} 
            userMap={userMap}
            onClose={() => setActiveDebate(null)} 
            onCrowdVote={handleAction}
            onEndBattle={handleFinalizeDebate}
            onSurrender={handleSurrender}
            onTruce={handleTruce}
            onReport={handleReportTake}
            onDeleteMessage={handleDeleteMessage}
            onUserClick={setPreviewingUser}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {(userData && !userData.hasSeenTutorial && !needsVerification) && (
          <TutorialOverlay 
            user={userData} 
            onComplete={() => setUserData({ ...userData, hasSeenTutorial: true })} 
            onUpdate={setUserData}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isRepModalOpen && (
          <ReputationDocsModal onClose={() => setIsRepModalOpen(false)} />
        )}
      </AnimatePresence>

      <AddTakeModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onAdd={handleAddTake} onOpenRules={() => setIsRulesModalOpen(true)} />

      <HallOfFameModal 
        isOpen={isHallOfFameOpen} 
        onClose={() => setIsHallOfFameOpen(false)} 
        takes={takes} 
        userMap={userMap} 
        onChallenge={handleChallenge} 
        onUserClick={setPreviewingUser}
      />

      <ChallengeConfirmModal 
        isOpen={!!confirmingChallenge} 
        take={confirmingChallenge} 
        onClose={() => setConfirmingChallenge(null)} 
        onConfirm={executeChallenge} 
      />

      <ArenaActionModal 
        type="surrender" 
        isOpen={!!confirmingSurrender} 
        onClose={() => setConfirmingSurrender(null)} 
        onConfirm={() => executeSurrender(confirmingSurrender)} 
      />

      <ArenaActionModal 
        type="truce" 
        isOpen={!!confirmingTruce} 
        onClose={() => setConfirmingTruce(null)} 
        onConfirm={() => executeTruce(confirmingTruce)} 
      />

      <ArenaActionModal 
        type="delete" 
        isOpen={confirmingDelete} 
        onClose={() => setConfirmingDelete(false)} 
        onConfirm={executeDeleteAccount} 
      />

      <AnimatePresence>
        {isRulesModalOpen && (
          <RulesModal onClose={() => setIsRulesModalOpen(false)} />
        )}
      </AnimatePresence>

      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        user={userData} 
        onUpdate={setUserData}
        onDeleteAccount={handleDeleteAccount}
        onOpenRules={() => setIsRulesModalOpen(true)}
      />

      <UserPreviewModal 
        username={previewingUser} 
        userMap={userMap} 
        onClose={() => setPreviewingUser(null)} 
      />
    </div>
  )
}

function SettingsModal({ isOpen, onClose, user, onUpdate, onDeleteAccount, onOpenRules }) {
  const [currentSeed, setCurrentSeed] = useState(user?.username || '');
  const [editedName, setEditedName] = useState(user?.username || '');
  const [isSaving, setIsSaving] = useState(false);
  const seeds = ['samurai', 'cyber', 'neon', 'glitch', 'retro', 'pixel', 'bot', 'wave', 'storm', 'vortex'];

  const changeAvatar = async (s) => {
    setCurrentSeed(s);
    const newAvatar = `https://api.dicebear.com/7.x/pixel-art/svg?seed=${s}`;
    const userRef = doc(db, "users", user.uid);
    await updateDoc(userRef, { avatar: newAvatar });
    onUpdate({...user, avatar: newAvatar});
  };

  const saveSettings = async () => {
    setIsSaving(true);
    try {
      if (editedName.trim() && editedName !== user.username) {
        const userRef = doc(db, "users", user.uid);
        await updateDoc(userRef, { username: editedName.trim() });
        onUpdate({...user, username: editedName.trim()});
      }
    } catch(err) {
      console.error(err);
    } finally {
      setIsSaving(false);
      onClose();
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div className="overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
          <motion.div className="modal" initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} onClick={e => e.stopPropagation()} transition={{ type: 'spring', damping: 25 }}>
            <div className="modal-header">
              <h2 className="modal-title">Account <span className="glow-text">Settings</span></h2>
              <button className="close-btn" onClick={onClose}><X size={20} /></button>
            </div>
            
            <div className="settings-list">
              <div className="settings-section">
                <label style={{fontSize: '0.7rem', fontWeight: 900, opacity: 0.4, textTransform: 'uppercase', letterSpacing: '0.1em', marginLeft: '1rem'}}>Profile Identity</label>
                
                <div className="settings-item glass-morphism" style={{marginTop: '0.5rem', marginBottom: '1rem', flexDirection: 'column', alignItems: 'flex-start'}}>
                   <div style={{display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '10px'}}><User size={20} color="var(--accent-neon)" /><span style={{fontWeight: 900}}>Handle</span></div>
                   <input 
                      type="text" 
                      value={editedName} 
                      onChange={(e) => setEditedName(e.target.value)} 
                      style={{
                        width: '100%', padding: '12px 16px', borderRadius: '12px', 
                        background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)', 
                        color: 'white', fontSize: '1rem', fontWeight: 600, outline: 'none'
                      }}
                   />
                </div>

                <div className="avatar-editor glass-morphism">
                   <div style={{display: 'flex', alignItems: 'center', gap: '1.5rem'}}>
                      <div className="avatar" style={{width: '64px', height: '64px', borderRadius: '12px', overflow: 'hidden'}}><img src={user?.avatar || ''} alt="pfp" /></div>
                      <div style={{flex: 1}}>
                         <div style={{fontWeight: 900, fontSize: '0.9rem'}}>Pixel Avatar</div>
                         <div style={{fontSize: '0.7rem', opacity: 0.5}}>Choose your digital signature</div>
                      </div>
                   </div>
                   
                   <div className="seed-grid">
                      {seeds.map(s => (
                         <button 
                           key={s} 
                           className={`seed-item ${(user && user.avatar) ? (user.avatar.includes(`seed=${s}`) ? 'active' : '') : ''}`}
                           onClick={() => changeAvatar(s)}
                         >
                            <img src={`https://api.dicebear.com/7.x/pixel-art/svg?seed=${s}`} alt="seed" />
                         </button>
                      ))}
                   </div>
                </div>
              </div>

              <div className="settings-section" style={{marginTop: '2rem'}}>
                <label style={{fontSize: '0.7rem', fontWeight: 900, opacity: 0.4, textTransform: 'uppercase', letterSpacing: '0.1em', marginLeft: '1rem'}}>Preferences</label>
                <div className="settings-item glass-morphism" style={{marginTop: '0.5rem'}}>
                   <div style={{display: 'flex', gap: '1rem', alignItems: 'center'}}><Palette size={20} color="var(--accent-cyan)" /><span>Appearance</span></div>
                   <div style={{fontSize: '0.8rem', fontWeight: 900, color: 'var(--accent-cyan)'}}>DARK MODE</div>
                </div>
              </div>

              <div className="settings-section" style={{marginTop: '2rem'}}>
                <label style={{fontSize: '0.7rem', fontWeight: 900, opacity: 0.4, textTransform: 'uppercase', letterSpacing: '0.1em', marginLeft: '1rem'}}>Account Security</label>
                <div className="settings-item glass-morphism" style={{marginTop: '0.5rem'}}>
                   <div style={{display: 'flex', gap: '1rem', alignItems: 'center'}}><Mail size={20} color="var(--accent-neon)" /><span>Email</span></div>
                   <span style={{opacity: 0.5, fontSize: '0.9rem'}}>{auth.currentUser?.email || `${(user?.username || '').toLowerCase()}@takes.live`}</span>
                </div>
              </div>

              <div className="settings-section" style={{marginTop: '2rem'}}>
                <label style={{fontSize: '0.7rem', fontWeight: 900, opacity: 0.4, textTransform: 'uppercase', letterSpacing: '0.1em', marginLeft: '1rem'}}>Arena Standards</label>
                <button 
                  className="settings-item" 
                  onClick={onOpenRules} 
                  style={{
                    marginTop: '0.6rem', width: '100%', 
                    background: 'linear-gradient(90deg, rgba(0,255,140,0.05), rgba(0,255,255,0.05))',
                    border: '1px solid rgba(0,255,255,0.2)',
                    padding: '20px', borderRadius: '16px',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    cursor: 'pointer', boxSshadow: '0 4px 15px rgba(0,0,0,0.2)'
                  }}
                >
                   <div style={{display: 'flex', gap: '1rem', alignItems: 'center'}}>
                      <div style={{
                        width: '36px', height: '36px', borderRadius: '10px', 
                        background: 'rgba(0,255,255,0.1)', display: 'flex', 
                        alignItems: 'center', justifyContent: 'center'
                      }}>
                        <Shield size={20} color="var(--accent-cyan)" />
                      </div>
                      <div style={{textAlign: 'left'}}>
                         <div style={{fontWeight: 900, fontSize: '0.95rem', color: 'white'}}>COMMUNITY RULES</div>
                         <div style={{fontSize: '0.65rem', opacity: 0.8, color: 'var(--accent-cyan)', fontWeight: 800, letterSpacing: '0.05em'}}>BE RESPECTFUL. STAY LEGENDARY.</div>
                      </div>
                   </div>
                   <ChevronLeft size={20} style={{transform: 'rotate(180deg)', color: 'var(--accent-cyan)'}} />
                </button>
              </div>

              <div className="settings-section" style={{marginTop: '2rem'}}>
                <label style={{fontSize: '0.7rem', fontWeight: 900, opacity: 0.4, textTransform: 'uppercase', letterSpacing: '0.1em', marginLeft: '1rem'}}>Danger Zone</label>
                <button 
                  className="settings-item glass-morphism danger-btn" 
                  style={{marginTop: '0.5rem', width: '100%'}}
                  onClick={onDeleteAccount}
                >
                  <div style={{display: 'flex', gap: '1rem', alignItems: 'center'}}><Trash2 size={20} /><span>Permanently Delete Account</span></div>
                </button>
              </div>

              <button className="primary-btn" style={{width: '100%', marginTop: '3rem', height: '60px'}} onClick={saveSettings} disabled={isSaving}>
                {isSaving ? "SAVING..." : "SAVE SETTINGS"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default App
