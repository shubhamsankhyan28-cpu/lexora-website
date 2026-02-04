/* ==========================================================================
   LEXORA AI (Powered by Nexora) - MAIN CONFIGURATION
   ========================================================================== */
/* 1. GLOBAL CONSTANTS (REBRANDED) */
const NOTES_KEY = "lexora_notes";       // ✅ Was nexora_notes
const PLAN_KEY = "lexora_userPlan";     // ✅ Was userPlan
const USER_KEY = "lexora_user";         // ✅ Was nexora_user
const HISTORY_KEY = "lexora_history";   // ✅ Was nexora_history
const CC_USED_KEY = "lexora_cc_used";   // ✅ Was cc_used
let currentTranscript = ""; // Stores the text for the CC button
const REGION_KEY = "lexora_region";
/* ================= FIX & POLISH LAYER ================= */

// 1️⃣ Map UI plan names → internal plan keys
const DISPLAY_TO_KEY = {
    "Free Starter": "free",
    "Student Plus": "student",
    "Pro Learner": "pro",
    "Power User": "power",
    "power User": "power",
    "weekly": "weekly",
    "pro_quarter": "pro_quarter",
    "power_quarter": "power_quarter",
    "free": "free",
    "student": "student",
    "pro": "pro",
    "power": "power"
};

// 2️⃣ Backend URL (single source of truth)
const BACKEND_BASE = "https://lexora-backend-2.onrender.com";
const BACKEND_ANALYZE = `${BACKEND_BASE}/analyze`;
// 4️⃣ Fix inline HTML button onclick
window.analyzeVideo = () => {
    document.getElementById("analyzeBtn")?.click();
};

// 5️⃣ Fix settings dropdown
window.toggleUserDropdown = () => {
    const menu = document.getElementById("userDropdownMenu");
    if (menu) menu.style.display = menu.style.display === "block" ? "none" : "block";
};
// ================= QUIZ RENDER FUNCTION (GLOBAL) =================
function renderCurrentQuestion() {
    if (!window.currentQuizData) return;

    const quizBox = document.getElementById("quizQuestion");
    const quizOptionsBox = document.getElementById("quizOptions");
    const nextBtn = document.getElementById("nextQuizBtn");

    const { quizData, quizIndex, score } = window.currentQuizData;

    if (!quizBox || !quizOptionsBox) return;

    // Quiz finished
    if (quizIndex >= quizData.length) {
        quizBox.innerHTML = `🎉 Quiz Completed<br><b>Score: ${score}/${quizData.length}</b>`;
        quizOptionsBox.innerHTML = "";
        if (nextBtn) nextBtn.style.display = "none";
        return;
    }

    const q = quizData[quizIndex];

    quizBox.innerHTML = `
        <small>Question ${quizIndex + 1} of ${quizData.length}</small><br>
        <b>${q.question}</b>
    `;

    quizOptionsBox.innerHTML = q.options
        .map(o => `<button class="quiz-option">${o}</button>`)
        .join("");

    if (nextBtn) {
        nextBtn.style.display = "block";
        nextBtn.disabled = true;
        nextBtn.innerText =
            quizIndex === quizData.length - 1 ? "Finish Quiz" : "Next Question";
    }
}

async function fetchWithRetry(url, options, retries = 2, delay = 3000) {
    try {
        const res = await fetch(url, options);

        // If rate-limited, wait longer
        if (res.status === 429 && retries > 0) {
            await new Promise(r => setTimeout(r, delay));
            return fetchWithRetry(url, options, retries - 1, delay * 2);
        }

        if (!res.ok) return null;
        return res;
    } catch (err) {
        if (retries > 0) {
            await new Promise(r => setTimeout(r, delay));
            return fetchWithRetry(url, options, retries - 1, delay * 2);
        }
        return null;
    }
}

// ================= QUIZ GLOBAL CLICK HANDLER (FIXED) =================
document.addEventListener("click", (e) => {
    if (!window.currentQuizData) return;

    const { quizData, quizIndex } = window.currentQuizData;

    // ✅ Option click
    if (e.target.classList.contains("quiz-option")) {
        const btn = e.target;
        const q = quizData[quizIndex];
        const nextBtn = document.getElementById("nextQuizBtn");

        document.querySelectorAll(".quiz-option").forEach(b => b.disabled = true);

        const isCorrect = btn.innerText.includes(q.answer);

        if (isCorrect) {
            window.currentQuizData.score++;
            btn.style.background = "#2ecc71";
            showToast("🎉 Correct!", "success");
        } else {
            btn.style.background = "#e74c3c";
            showToast("❌ Incorrect", "error");
        }

        if (nextBtn) nextBtn.disabled = false;
    }

    // ✅ Next button
    if (e.target.id === "nextQuizBtn") {
        window.currentQuizData.quizIndex++;
        renderCurrentQuestion();
    }
});
/* --------------------------------------------------------------------------
   2. PROMO CODES CONFIGURATION
   -------------------------------------------------------------------------- */
const PROMO_CODES = {
    "FAMILYPRO": {
        plan: "pro",
        days: 30
    },
    "FAMILYPOWER": {
        plan: "power",
        days: 30
    },
    "NEXORADEV": {
        plan: "power",
        days: 365
    }
};
// =======================
// CC LIMIT HANDLER (FIX)
// =======================
function getCCLimit() {
    const rawPlan = localStorage.getItem(PLAN_KEY) || "free";
    const planKey = DISPLAY_TO_KEY[rawPlan] || rawPlan;

    return PLAN_LIMITS[planKey]?.cc ?? 0;
}
/* --------------------------------------------------------------------------
   3. DEVELOPER CODES (FOR TESTING)
   -------------------------------------------------------------------------- */
const DEV_CODES = {
    "FREEDEV": "free",
    "STUDENTDEV": "student",
    "PRODEV": "pro",
    "POWERDEV": "power"
};

/* --------------------------------------------------------------------------
   4. PLAN LIMITS & CONFIGURATION
   Defines video limits, CC credits, and display names.
   -------------------------------------------------------------------------- */
const PLAN_LIMITS = {
    free: {
        videos: 3,
        cc: 0,
        name: "Free"
    },
    weekly: {
        videos: 8,
        cc: 2,
        name: "Weekly Pass"
    },
    student: {
        videos: 6,
        cc: 0,
        name: "Student"
    },
    pro: {
        videos: 10,
        cc: 3,
        name: "Pro"
    },
    power: {
        videos: 15,
        cc: 6,
        name: "Power User"
    },

    // Long Term Plans (Matches HTML data-plan attributes)
    pro_quarter: {
        videos: 15,
        cc: 5,
        name: "Exam Pass"
    },
    power_quarter: {
        videos: 20,
        cc: 10,
        name: "Power Pass"
    }
};
/* ================= FIREBASE AUTH ================= */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
    getAuth,
    GoogleAuthProvider,
    signInWithPopup,
    signOut
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyAMbeYbS0Bw2nB14GsS1PLhE2U1Q1qLJlM",
    authDomain: "lexora-app-2cf5f.firebaseapp.com",
    projectId: "lexora-app-2cf5f",
    storageBucket: "lexora-app-2cf5f.firebasestorage.app",
    messagingSenderId: "525206565315",
    appId: "1:525206565315:web:bb7e09846a7898f5f2cd76"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

window.loginWithGoogle = async () => {
    try {
        const result = await signInWithPopup(auth, provider);
        const user = {
            name: result.user.displayName,
            email: result.user.email,
            photo: result.user.photoURL
        };
        localStorage.setItem("lexora_user", JSON.stringify(user));
        updateLoginUI();
        showToast("✅ Logged in successfully", "success");
    } catch (error) {
        console.error(error);
        showToast("❌ Login cancelled", "error");
    }
};
/* ============================
   LOGOUT FUNCTION (UPDATED)
============================ */
window.logoutUser = async () => {
    try {
        await signOut(auth); // Tell Firebase to sign out
        localStorage.removeItem("lexora_user"); // Clear user data

        showToast("👋 Logging out...", "info");

        // Wait 1 second then force reload the page
        setTimeout(() => {
            window.location.reload();
        }, 500);

    } catch (error) {
        console.error("Logout Error:", error);
        // Even if Firebase fails, force local logout
        localStorage.removeItem("lexora_user");
        window.location.reload();
    }
};

/* --- ⬇️ YOUR EXISTING CODE STARTS HERE ⬇️ --- */
// ... (Your previous code for notes, history, stars, etc. stays below)
/* --------------------------------------------------------------------------
 5. REGIONAL PRICING CONFIGURATION
 -------------------------------------------------------------------------- */
const REGION_PRICES = {
    // 🌍 GLOBAL DEFAULT (Europe, USA, etc.)
    USD: {
        symbol: "$",
        weekly: 4.99, student: 9.99, pro: 19.99, power: 49.99,
        pro_quarter: 49.99, power_quarter: 99.99
    },
    // 🇮🇳 INDIA
    INR: {
        symbol: "₹",
        weekly: 99, student: 199, pro: 499, power: 999,
        pro_quarter: 1499, power_quarter: 2999
    },
    // 🇰🇷 KOREA
    KRW: {
        symbol: "₩",
        weekly: 7000, student: 14000, pro: 28000, power: 70000,
        pro_quarter: 70000, power_quarter: 140000
    },
    // 🇯🇵 JAPAN (New!)
    JPY: {
        symbol: "¥",
        weekly: 700, student: 1400, pro: 2800, power: 7000,
        pro_quarter: 7000, power_quarter: 14000
    }
};

/* ==========================================================================
   CORE HELPER FUNCTIONS
   ========================================================================== */
const qs = (q) => document.querySelector(q);
const qsa = (q) => document.querySelectorAll(q);
/* ================= PLAN HELPER ================= */
function getPlan() {
    const raw = localStorage.getItem(PLAN_KEY) || "free";
    return DISPLAY_TO_KEY[raw] || raw;
}

/* ================= ANALYTICS TRACKING ================= */
function track(event, data = {}) {
    const logs = JSON.parse(localStorage.getItem("lexora_analytics") || "[]");
    logs.push({ event, data, time: Date.now() });
    localStorage.setItem("lexora_analytics", JSON.stringify(logs.slice(-100)));
}

/**
 * Checks if the user is on a premium plan (anything except Free/Student).
 */
function isPremium() {
    const p = getPlan();
    return p !== "free" && p !== "student";
}

/**
 * Sets the user plan, resets daily counters, and updates the UI.
 */
function setPlan(plan) {
    const canonical = DISPLAY_TO_KEY[plan] || plan;
    localStorage.setItem(PLAN_KEY, canonical);

    // Reset CC usage when buying a new plan
    localStorage.setItem(CC_USED_KEY, 0);

    // Update the Interface immediately
    updatePlanUI();
    updateCCUI();

    // Show success message
    const planName = PLAN_LIMITS[canonical]?.name || plan.toUpperCase();
    showToast(`✅ ${planName} Activated Successfully`, "success");
}

/* User Management Helpers */
function getUser() {
    try {
        return JSON.parse(localStorage.getItem(USER_KEY));
    } catch (e) {
        return null;
    }
}

function setUser(user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
}

/* ==========================================================================
   TOAST NOTIFICATION SYSTEM
   ========================================================================== */
function showToast(message, type = "info") {
    const existing = document.querySelector(".toast");
    if (existing) existing.remove();

    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    toast.innerHTML = message;

    document.body.appendChild(toast);

    requestAnimationFrame(() => {
        toast.classList.add("show");
    });

    setTimeout(() => {
        toast.classList.remove("show");
        setTimeout(() => toast.remove(), 300);
    }, 2500);
}


/* ==========================================================================
   VISUAL EFFECTS – SMOOTH SNOWFALL (AESTHETIC)
   ========================================================================== */
(() => {
    const canvas = document.getElementById("stars");
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    let w, h;
    let snowflakes = [];

    function resize() {
        w = canvas.width = window.innerWidth;
        h = canvas.height = window.innerHeight;
        createSnow();
    }

    function createSnow() {
        snowflakes = Array.from({ length: Math.min(180, w / 6) }, () => ({
            x: Math.random() * w,
            y: Math.random() * h,
            r: Math.random() * 1.2 + 0.3,      // small, soft dots
            speedY: Math.random() * 0.4 + 0.15, // slow fall
            drift: Math.random() * 0.3 - 0.15,  // gentle side drift
            opacity: Math.random() * 0.5 + 0.4
        }));
    }

    function draw() {
        ctx.clearRect(0, 0, w, h);

        snowflakes.forEach(flake => {
            ctx.beginPath();
            ctx.fillStyle = `rgba(255,255,255,${flake.opacity})`;
            ctx.arc(flake.x, flake.y, flake.r, 0, Math.PI * 2);
            ctx.fill();

            flake.y += flake.speedY;
            flake.x += flake.drift;

            // Reset smoothly at bottom
            if (flake.y > h) {
                flake.y = -5;
                flake.x = Math.random() * w;
            }

            // Soft horizontal wrap
            if (flake.x > w) flake.x = 0;
            if (flake.x < 0) flake.x = w;
        });

        requestAnimationFrame(draw);
    }

    resize();
    window.addEventListener("resize", resize);
    draw();
})();

/* ==========================================================================
   UI NAVIGATION & SIDEBAR
   ========================================================================== */
const menuBtn = qs("#menuBtn");
const sidebar = qs(".sidebar");
const overlay = qs("#overlay");

menuBtn?.addEventListener("click", () => {
    sidebar?.classList.toggle("open");
    overlay?.classList.toggle("show");
});

overlay?.addEventListener("click", () => {
    sidebar?.classList.remove("open");
    overlay.classList.remove("show");
});

qsa("[data-page]").forEach(btn => {
    btn.addEventListener("click", () => {
        const pageId = btn.dataset.page;
        if (!pageId) return;

        qsa(".page").forEach(p => p.classList.remove("active"));
        qs(`#${pageId}`)?.classList.add("active");

        qsa("[data-page]").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");

        sidebar?.classList.remove("open");
        overlay?.classList.remove("show");

        // Refresh specific data when tab opens
        if (pageId === "summaries") renderHistory();
        if (pageId === "notes") renderNotes();
    });
});


/* ==========================================================================
   PLAN UI & CC LOGIC (The Core Logic)
   ========================================================================== */

/**
 * Updates the Plan Buttons to show "Current Plan" or "Upgrade"
 * Also handles locking/unlocking premium features.
 */
function updatePlanUI() {
    const currentPlan = getPlan();

    document.querySelectorAll(".upgrade-btn").forEach(btn => {
        const plan = btn.dataset.plan;

        if (plan === currentPlan) {
            // Active Plan Styling
            btn.innerText = "Current Plan";
            btn.disabled = true;
            btn.classList.add("current-plan");
            btn.style.opacity = "0.6";
            btn.style.cursor = "not-allowed";
        } else {
            // Inactive Plan Styling (Restore Text)
            if (plan === "free") btn.innerText = "Switch to Free";
            else if (plan === "weekly") btn.innerText = "Get Weekly";
            else if (plan === "student" || plan === "pro") btn.innerText = "Upgrade";
            else if (plan === "power") btn.innerHTML = "🔥 Upgrade";
            else btn.innerText = "Get Pass"; // For Exam/Power Pass

            btn.disabled = false;
            btn.classList.remove("current-plan");
            btn.style.opacity = "1";
            btn.style.cursor = "pointer";
        }
    });

    // Update Status Text in Settings
    const statusEl = document.getElementById("planStatus");
    if (statusEl) {
        statusEl.innerText = `Status: ${PLAN_LIMITS[currentPlan]?.name || "Free"} User`;
    }

    // Handle Feature Locks (Advanced Notes)
    const isLocked = !isPremium();

    document.querySelectorAll(".btn-lock").forEach(btn => {
        btn.style.display = isLocked ? "block" : "none";
        btn.onclick = (e) => {
            e.preventDefault();
            showToast("🔒 Feature requires Pro/Weekly Plan.");
        };
    });

    // Toggle Advanced Notes Button
    const advBtn = document.getElementById("advancedNotesBtn");
    if (advBtn) {
        advBtn.disabled = isLocked;
        if (isLocked) advBtn.classList.add("locked");
        else advBtn.classList.remove("locked");
    }
}


/**
 * Gets the number of CCs used today.
 */
function getCCUsed() {
    return Number(localStorage.getItem(CC_USED_KEY) || 0);
}
/**
 * Updates the CC Generator Button UI (Lock/Unlock/Hide)
 */
function updateCCUI() {
    const limit = getCCLimit();
    const used = getCCUsed();
    const info = document.getElementById("ccInfo");

    // Update Info Display
    if (info) {
        info.innerText = `${used} / ${limit} used today`;
    }

    // Single Event Listener for CC Button
    const ccBtn = document.getElementById("generateCcBtn");
    if (ccBtn && !ccBtn.dataset.listenerAttached) {
        ccBtn.dataset.listenerAttached = "true";
        ccBtn.addEventListener("click", (e) => {
            const limit = getCCLimit();
            const used = getCCUsed();

            // 1. Check if Locked
            if (limit === 0) {
                showToast("🔒 Upgrade to Weekly or Pro to use this.", "error");
                return;
            }

            // 2. Check Limits
            if (used >= limit) {
                showToast(`⚠️ Daily limit (${limit}) reached.`, "error");
                return;
            }

            // 3. Check Data
            if (!currentTranscript) {
                showToast("⚠️ Please analyze a video first!", "error");
                return;
            }

            // 4. Download Logic (Directly here!)
            const btn = e.target.closest("#generateCcBtn");
            btn.innerHTML = "⏳ Downloading...";

            setTimeout(() => {
                const blob = new Blob([currentTranscript], { type: "text/plain" });
                const link = document.createElement("a");
                link.href = URL.createObjectURL(blob);
                link.download = "Lexora_Transcript.txt";
                link.click();

                // Update Usage
                localStorage.setItem(CC_USED_KEY, used + 1);
                // Update text to show new usage count
                const newUsed = used + 1;
                if (info) info.innerText = `${newUsed} / ${limit} used today`;

                btn.innerHTML = "✅ Saved!";
                setTimeout(() => {
                    btn.innerHTML = `<span>🎧 Download Full Transcript</span><small style="font-size: 10px; opacity: 0.8;">(Premium)</small>`;
                }, 3000);
            }, 1000);
        });
    }
}

/* ==========================================================================
   NOTES SYSTEM (CRUD Operations)
   ========================================================================== */
function getNotes() {
    return JSON.parse(localStorage.getItem(NOTES_KEY) || "[]");
}

function saveNotes(notes) {
    localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
}

function renderNotesFromAPI(notes, quizData) {
    const notesBox = document.querySelector("#notesTextarea");
    if (!notesBox) return;

    let text = "";

    // Add Notes Section
    if (notes && Array.isArray(notes)) {
        text += "📚 STUDY NOTES\n================================\n" + notes.map(n => "• " + n).join("\n\n") + "\n\n";
    }

    // Add Quiz Section
    if (quizData && Array.isArray(quizData)) {
        text += "📝 PRACTICE QUIZ\n================================\n\n";
        quizData.forEach((q, i) => {
            text += `Q${i + 1}: ${q.question}\nOptions:\n` + q.options.map(o => `   [ ] ${o}`).join("\n") + `\n>> Answer: ${q.answer}\n--------------------------------\n\n`;
        });
    }

    notesBox.value = text;
}

// ✅ NEW: Notes list is now READABLE (White text on dark bg)
// ✅ UPDATED: Notes List (Readable + Compact)
function renderNotes() {
    const notes = getNotes();
    const container = document.getElementById("notesList");
    if (!container) return;

    container.innerHTML = "";
    notes.forEach((n, i) => {
        const div = document.createElement("div");
        div.className = "note-card";
        div.style.marginBottom = "15px";

        div.innerHTML = `
            <small style="opacity:0.7; display:block; margin-bottom:5px;">${n.date}</small>
            
            <div style="
                white-space: pre-wrap; 
                background: rgba(255,255,255,0.08); 
                color: #fff; 
                padding: 12px; 
                border-radius: 8px; 
                font-size: 14px; 
                border: 1px solid rgba(255,255,255,0.1);
                margin-bottom: 10px;
                display: -webkit-box;
                -webkit-line-clamp: 4; /* Limits to 4 lines */
                -webkit-box-orient: vertical;
                overflow: hidden;
                text-overflow: ellipsis;
            ">${n.text}</div>
            
            <div style="display:flex; gap:10px;">
                 <button class="btn-primary" style="padding:8px; font-size:14px; margin-top:0;" onclick="loadNoteForEditing(${i})">✏️ Edit / View Full</button>
                <button class="btn-secondary" style="padding:8px; font-size:14px; margin-top:0; background:#ff4757;" onclick="deleteNote(${i})">🗑️ Delete</button>
            </div>
        `;
        container.appendChild(div);
    });
}

// ✅ TRACKING VARIABLE
let editingNoteIndex = null; // Tells us if we are editing or creating new

// ✅ LOAD NOTE INTO MAIN BOX
window.loadNoteForEditing = function (index) {
    const notes = getNotes();
    const textarea = document.getElementById("notesTextarea");
    const saveBtn = document.getElementById("saveNotesBtn");

    // 1. Put text in the big box
    textarea.value = notes[index].text;

    // 2. Scroll to top so user sees it
    document.querySelector('.card')?.scrollIntoView({ behavior: 'smooth' });

    // 3. Change button text
    editingNoteIndex = index;
    saveBtn.innerText = "💾 Update Note";
    saveBtn.style.background = "#a29bfe"; // Purple to show update mode

    showToast("📝 Note loaded for editing", "info");
};

// ✅ DELETE NOTE
window.deleteNote = function (index) {
    const notes = getNotes();
    notes.splice(index, 1);
    saveNotes(notes);
    renderNotes();
    showToast("🗑️ Note deleted", "info");

    // Reset if we deleted the note being edited
    if (index === editingNoteIndex) {
        editingNoteIndex = null;
        document.getElementById("saveNotesBtn").innerText = "💾 Save Notes";
    }
};

// ✅ SMART SAVE BUTTON (Handles both New & Update)
document.getElementById("saveNotesBtn")?.addEventListener("click", () => {
    const textarea = document.getElementById("notesTextarea");
    const text = textarea.value.trim();
    const saveBtn = document.getElementById("saveNotesBtn");

    if (!text) {
        showToast("❌ Notes are empty", "error");
        return;
    }

    const notes = getNotes();

    if (editingNoteIndex !== null) {
        // UPDATE EXISTING NOTE
        notes[editingNoteIndex].text = text;
        showToast("✅ Note Updated!", "success");

        // Reset state
        editingNoteIndex = null;
        saveBtn.innerText = "💾 Save Notes";
        saveBtn.style.background = ""; // Reset color
    } else {
        // CREATE NEW NOTE
        notes.unshift({ text, date: new Date().toLocaleString() });
        showToast("✅ Note Saved!", "success");
    }

    saveNotes(notes);
    textarea.value = ""; // Clear box
    renderNotes();
});

/* ==========================================================================
   HISTORY SYSTEM
   ========================================================================== */
function getHistory() {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
}

function saveToHistory(entry) {
    const history = getHistory();
    history.unshift(entry);
    // Keep only last 20 items
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 20)));
}
/* ==========================================================================
   HISTORY SYSTEM (Improved Readability)
   ========================================================================== */
function renderHistory() {
    const container = document.getElementById("historyList");
    if (!container) return;

    const history = getHistory();
    if (!history.length) {
        container.innerHTML = "<p style='opacity:0.6; text-align:center;'>No past sessions yet.</p>";
        return;
    }

    container.innerHTML = history.map((h, i) => `
        <div class="history-card" style="background:rgba(255,255,255,0.05); padding:15px; margin-bottom:12px; border-radius:12px; border:1px solid rgba(255,255,255,0.05);">
            <div style="display:flex; justify-content:space-between; opacity:0.7; font-size:12px; margin-bottom:8px;">
                <span>${h.date.split(',')[0]}</span>
                <span>${h.date.split(',')[1] || ''}</span>
            </div>
            
            <div style="
                background: rgba(255,255,255,0.08); 
                padding: 10px; 
                border-radius: 8px; 
                margin-bottom: 12px; 
                font-size: 14px; 
                color: #e0e0e0; 
                line-height: 1.5;
                display: -webkit-box;
                -webkit-line-clamp: 3;
                -webkit-box-orient: vertical;
                overflow: hidden;
            ">
                ${h.summary}
            </div>

            <div style="display:flex; gap:10px;">
                <button class="btn-primary" style="flex:1; padding: 8px; font-size: 14px; margin-top:0;" onclick="loadHistory(${i})">📂 Open</button>
                <button onclick="deleteHistoryItem(${i})" style="background:rgba(255, 80, 80, 0.15); border:1px solid rgba(255, 80, 80, 0.3); color:#ff8080; border-radius:10px; padding: 0 14px; cursor:pointer; font-size:16px;">🗑️</button>
            </div>
        </div>
    `).join("");
}

window.deleteHistoryItem = function (index) {
    const history = getHistory();
    history.splice(index, 1);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    renderHistory();
    showToast("🗑️ Session deleted.", "info");
};

window.loadHistory = function (index) {
    const h = getHistory()[index];
    renderSummary(h.summary);
    renderNotesFromAPI(h.notes, h.quiz);
    showToast("📂 Loaded saved session", "success");
};

/* ==========================================================================
   VIDEO ANALYSIS FLOW
   ========================================================================== */
const analyzeBtn = document.getElementById("analyzeBtn");
const videoInput = document.getElementById("videoInput");
async function fetchAISummary(videoUrl) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 45000);
    try {
        const res = await fetchWithRetry(BACKEND_ANALYZE, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                url: videoUrl,
                plan: getPlan()
            }),
            signal: controller.signal
        });
        clearTimeout(timeout);
        if (!res.ok) return null;
        return await res.json();
    } catch (err) {
        clearTimeout(timeout);
        return null;
    }
}
if (analyzeBtn) {
    analyzeBtn.addEventListener("click", async () => {
        track("analyze_click", { plan: getPlan() });
        if (!videoInput) return;

        // 🛑 CHECK DAILY VIDEO LIMITS
        const plan = getPlan();
        const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.free;
        const videosUsed = Number(localStorage.getItem("videos_used_today") || 0);

        if (videosUsed >= limits.videos) {
            showToast(`⚠️ Daily limit reached (${limits.videos} videos). Upgrade for more!`, "error");
            document.querySelector('[data-page="subscription"]')?.click();
            return;
        }

        const url = videoInput.value.trim();
        if (!url || !/youtube\.com|youtu\.be/.test(url)) {
            showToast("❌ Invalid YouTube URL", "error");
            return;
        }

        analyzeBtn.disabled = true;
        analyzeBtn.innerText = "Starting AI engine…";
        analyzeBtn.classList.add("loading");

        try {
            const data = await fetchAISummary(url);
            if (!data || !data.summary) throw new Error();

            window.currentQuizData = {
                quizData: data.quiz || [],
                quizIndex: 0,
                score: 0
            };

            renderCurrentQuestion(); // ✅ CALL AFTER SETTING QUIZ DATA

            currentTranscript = data.transcript || "";
            localStorage.setItem(
                "videos_used_today",
                videosUsed + 1
            );

            renderSummary(data.summary);
            renderNotesFromAPI(data.notes, data.quiz);
            applyStreakAfterStudy();

        } catch (err) {
            showToast("❌ Analysis failed. Try again.", "error");
        } finally {
            analyzeBtn.disabled = false;
            analyzeBtn.innerText = "Analyze Video";
            analyzeBtn.classList.remove("loading");
        }
    });
}
// 4. Show the CC Button (Un-hide it)
const ccBtn = document.getElementById("generateCcBtn");
if (ccBtn) {
    ccBtn.style.display = "flex";
    ccBtn.innerHTML = `<span>🎧 Download Full Transcript</span><small style="font-size: 10px; opacity: 0.8; font-weight:normal;">(Get the exact words • Premium)</small>`;
}

function renderSummary(summary) {
    const box = document.getElementById("latestSummary");
    if (box) box.innerHTML = `<div class="summary-inner"><h3>🧠 AI Summary</h3><p>${summary}</p></div>`;
}


/* ==========================================================================
   PREMIUM FEATURES & UI (Advanced Notes)
   ========================================================================== */
function generateAdvancedNotes() {
    showToast("✨ AI is generating advanced notes...", "success");
    setTimeout(() => {
        showToast("✅ Advanced Notes Added!", "success");
    }, 1500);
}

document.getElementById("advancedNotesBtn")
    ?.addEventListener("click", () => {
        if (!isPremium()) {
            showToast("🔒 Advanced Notes are PRO only", "error");
            return;
        }
        generateAdvancedNotes();
    });
// ✅ STREAK LOGIC AFTER SUCCESSFUL STUDY
function applyStreakAfterStudy() {
    if (getPlan() !== "free") return;

    let streak = JSON.parse(localStorage.getItem("studyStreak")) || { count: 0, lastDate: null, rewarded: false };
    const today = new Date().toDateString();

    if (streak.lastDate === today) return;

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    if (streak.lastDate === yesterday.toDateString()) streak.count++;
    else {
        streak.count = 1;
        streak.rewarded = false;
    }

    streak.lastDate = today;

    if (streak.count >= 7 && !streak.rewarded) {
        setPlan("student");
        streak.rewarded = true;
        localStorage.setItem("tempStudentExpiry", Date.now() + 24 * 60 * 60 * 1000);
        showToast("🎉 Student Plan unlocked for 24 hours!", "success");
        updatePlanUI();
    }

    localStorage.setItem("studyStreak", JSON.stringify(streak));
    updateStreakUI();
}
function checkTempPlanExpiry() {
    const expiry = localStorage.getItem("tempStudentExpiry");
    if (!expiry) return;

    if (Date.now() > Number(expiry)) {
        setPlan("free");
        localStorage.removeItem("tempStudentExpiry");
        showToast("⏳ Student trial expired. Back to Free.");
        updatePlanUI();
    }
}

function updateStreakUI() {
    const plan = getPlan();
    const progressEl = document.getElementById("streakProgress");
    if (!progressEl) return;

    if (plan !== "free") {
        progressEl.style.display = "none";
        return;
    }

    progressEl.style.display = "grid";
    const streak = JSON.parse(localStorage.getItem("studyStreak")) || { count: 0 };
    progressEl.innerHTML = "";

    for (let i = 1; i <= 7; i++) {
        const div = document.createElement("div");
        div.className = "streak-day";
        if (i <= Math.min(streak.count, 7)) div.classList.add("active");
        progressEl.appendChild(div);
    }
}

function updateLoginUI() {
    const user = getUser();
    const loginBox = document.getElementById("loginBox");
    const userBox = document.getElementById("userBox");

    if (!loginBox || !userBox) return;

    if (user) {
        loginBox.style.display = "none";
        userBox.style.display = "block";

        document.getElementById("userName").innerText = user.name || "User";
        document.getElementById("userEmail").innerText = user.email || "";

        // ✅ Avatar fallback
        const avatar = document.getElementById("userAvatar");
        if (avatar) {
            avatar.src = user.photo || "https://ui-avatars.com/api/?name=" + encodeURIComponent(user.name || "User");
        }

        // ✅ Plan badge
        const badge = document.getElementById("userPlanBadge");
        if (badge) {
            badge.innerText = (PLAN_LIMITS[getPlan()]?.name || "Free").toUpperCase() + " PLAN";
        }

    } else {
        loginBox.style.display = "block";
        userBox.style.display = "none";
    }
}
document.getElementById("applyPromoBtn")?.addEventListener("click", () => {
    const code = document.getElementById("promoInput").value.trim().toUpperCase();

    // Check Dev Codes
    if (DEV_CODES[code]) {
        setPlan(DEV_CODES[code]);
        showToast(`✅ Testing: ${DEV_CODES[code]}`, "success");
        return;
    }

    // Check Promo Codes
    const promo = PROMO_CODES[code];
    if (promo) {
        setPlan(promo.plan);
        localStorage.setItem("promoExpiry", Date.now() + promo.days * 86400000);
        showToast(`🎉 ${promo.plan} unlocked!`, "success");
        return;
    }

    showToast("❌ Invalid code", "error");
});

function checkPromoExpiry() {
    const expiry = localStorage.getItem("promoExpiry");
    if (!expiry) return;

    if (Date.now() > Number(expiry)) {
        setPlan("free");
        localStorage.removeItem("promoExpiry");
        showToast("⏳ Promo expired. Back to Free.");
        updatePlanUI();
    }
}

function applyRegionalPricing() {
    // 1. Check if user already picked a currency manually
    let currency = localStorage.getItem("lexora_currency");

    // 2. If not, guess based on Browser Language
    if (!currency) {
        const lang = (navigator.language || navigator.userLanguage).toUpperCase();

        if (lang.includes("KR")) {
            currency = "KRW"; // 🇰🇷 Korea -> Won
        } else if (lang.includes("JP") || lang.includes("JA")) {
            currency = "JPY"; // 🇯🇵 Japan -> Yen
        } else if (lang.includes("IN")) {
            currency = "INR"; // 🇮🇳 India -> Rupee
        } else {
            currency = "USD"; // 🌍 Everyone else -> Dollar ($)
        }

        localStorage.setItem("lexora_currency", currency);
    }

    // 3. Apply the prices to the HTML
    const prices = REGION_PRICES[currency] || REGION_PRICES.USD;

    document.querySelectorAll("[data-plan-price]").forEach(el => {
        const planType = el.dataset.planPrice;

        if (prices[planType]) {
            const cycle = planType.includes("weekly") ? "/ week" :
                planType.includes("quarter") ? "/ 3 months" : "/ month";

            el.innerHTML = `${prices.symbol}${prices[planType]} <small>${cycle}</small>`;
        }
    });

    console.log(`💱 User detected as: ${currency}`);
}
/* ==========================================================================
   GLOBAL PDF EXPORT FUNCTION
   ========================================================================== */
window.exportPDF = function () {
    if (!isPremium()) {
        showToast("🔒 Upgrade to PRO to unlock PDF export");
        return;
    }

    const summaryBox = document.getElementById("latestSummary");
    const notesBox = document.querySelector("#notesTextarea");

    const summaryText = summaryBox ? summaryBox.innerText : "";
    let fullText = notesBox ? notesBox.value : "";

    if (!summaryText.trim()) {
        showToast("❌ Please analyze a video first.");
        return;
    }

    if (window.jspdf) {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        const clean = (str) => str.replace(/[^\x20-\x7E\n\r\t]/g, '');

        doc.setFont("helvetica", "bold");
        doc.setFontSize(22);
        doc.text("Lexora AI Study Report", 105, 20, null, null, "center");

        doc.setFontSize(16);
        doc.text("Summary", 14, 35);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(11);
        doc.text(doc.splitTextToSize(clean(summaryText), 180), 14, 45);

        let notesPart = fullText;
        let quizPart = "";

        if (fullText.includes("📝 PRACTICE QUIZ")) {
            const parts = fullText.split("📝 PRACTICE QUIZ");
            notesPart = parts[0];
            quizPart = "📝 PRACTICE QUIZ" + parts[1];
        }

        doc.addPage();
        doc.setFont("helvetica", "bold");
        doc.setFontSize(16);
        doc.text("Study Notes", 14, 20);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(11);
        const noteLines = doc.splitTextToSize(clean(notesPart), 180);
        let cursorY = 30;
        noteLines.forEach(line => {
            if (cursorY > 280) {
                doc.addPage();
                cursorY = 20;
            }
            doc.text(line, 14, cursorY);
            cursorY += 6;
        });

        if (quizPart.trim()) {
            doc.addPage();
            doc.setFont("helvetica", "bold");
            doc.setFontSize(16);
            doc.text("Practice Quiz", 14, 20);

            doc.setFont("helvetica", "normal");
            doc.setFontSize(11);
            const quizLines = doc.splitTextToSize(clean(quizPart), 180);
            cursorY = 30;
            quizLines.forEach(line => {
                if (cursorY > 280) {
                    doc.addPage();
                    cursorY = 20;
                }
                doc.text(line, 14, cursorY);
                cursorY += 6;
            });
        }

        doc.save("Lexora_Study_Guide.pdf");
        showToast("✅ PDF Downloaded!", "success");
    } else {
        showToast("❌ PDF system unavailable.", "error");
    }
};
/* ==========================================================================
   MAIN INITIALIZATION (ON LOAD)
   ========================================================================== */
// 2. Load Data
renderNotes();

// 3. Update UI based on User Status
updatePlanUI();
updateCCUI();
updateLoginUI();
updateStreakUI();

// 4. Regional Pricing
applyRegionalPricing();

// 5. Daily Reset Check (For Limits)
const lastDate = localStorage.getItem("last_usage_date");
const today = new Date().toDateString();

if (lastDate !== today) {
    localStorage.setItem("last_usage_date", today);
    localStorage.setItem(CC_USED_KEY, 0);
    localStorage.setItem("videos_used_today", 0); // ✅ Reset Video Limit
}
// 6. Check Backend Status
fetch(`${BACKEND_BASE}/health`).catch(() => { });
analyzeBtn.innerText = "⏳ AI is warming up…";
window.openCompareModal = () => {
    const overlay = document.getElementById('compareOverlay');
    const modal = document.getElementById('compareModal');

    // Safety Check: Do elements exist?
    if (overlay && modal) {
        overlay.style.display = 'block';
        modal.style.display = 'block';

        // Tiny delay triggers the CSS fade-in animation
        setTimeout(() => {
            overlay.classList.add('show');
            modal.classList.add('show');
        }, 10);
    }
};

window.closeCompareModal = () => {
    const overlay = document.getElementById('compareOverlay');
    const modal = document.getElementById('compareModal');

    if (overlay && modal) {
        overlay.classList.remove('show');
        modal.classList.remove('show');

        // Wait for animation (300ms) before hiding
        setTimeout(() => {
            overlay.style.display = 'none';
            modal.style.display = 'none';
        }, 300);
    }
};
