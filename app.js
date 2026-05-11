const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);

const DAILY_GOAL = 15;
let stats = { 
    "Daniel": { leads: 0, meetings: 0, invoices: 0 }, 
    "Lucas": { leads: 0, meetings: 0, invoices: 0 }, 
    "Cooper": { leads: 0, meetings: 0, invoices: 0 } 
};

app.get('/', (req, res) => { res.send(dashboardHTML()); });
app.get('/update', (req, res) => { res.send(updatePortalHTML()); });

io.on('connection', (socket) => {
    socket.emit('requestSync');
    socket.on('syncFromTV', (savedData) => {
        if (savedData) { stats = savedData; io.emit('refresh', { stats, goal: DAILY_GOAL }); }
    });
    socket.on('updateStats', (data) => {
        if (stats[data.name]) {
            stats[data.name][data.type] = data.val; 
            // This sends ONLY the data, not a page instruction
            io.emit('updateUI', { name: data.name, stats: stats, goal: DAILY_GOAL });
        }
    });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => { console.log('Board Live - No-Refresh Mode'); });

function dashboardHTML() {
    return `<!DOCTYPE html><body style="background:#050505; color:white; font-family:sans-serif; text-align:center; margin:0; overflow:hidden;">
        <script src="https://cdn.jsdelivr.net/npm/canvas-confetti@1.6.0/dist/confetti.browser.min.js"></script>
        <style>
            @keyframes celebrate { 
                0% { background: #111; transform: scale(1); } 
                20% { background: #00ff88; transform: scale(1.05); box-shadow: 0 0 50px #00ff88; } 
                100% { background: #111; transform: scale(1); } 
            }
            .updated { animation: celebrate 1.2s ease-out; }
            .card { background:#111; border-radius:30px; flex:1; border: 1px solid #333; position:relative; transition: all 0.3s ease; }
            .leader-crown { position: absolute; top: -45px; left: 50%; transform: translateX(-50%); font-size: 60px; display:none; }
            #btn { position: fixed; inset:0; background: rgba(0,0,0,0.9); color: white; border: none; font-size: 30px; cursor: pointer; z-index: 1000; font-weight: bold; }
        </style>
        
        <button id="btn" onclick="startBoard()">CLICK ONCE TO START BOARD</button>

        <div style="background: #111; padding: 20px; border-bottom: 3px solid #e31b23;">
            <h1 style="font-size:3vw; margin:0; letter-spacing:3px;">SALES LEADERBOARD</h1>
            <div style="width: 60%; background: #333; height: 12px; border-radius: 10px; margin: 10px auto; overflow: hidden;">
                <div id="goal-bar" style="width: 0%; background: #00ff88; height: 100%; transition: width 1s;"></div>
            </div>
            <div id="goal-text" style="font-size: 1.2vw; color: #aaa;">DAILY LEAD GOAL: 0 / ${DAILY_GOAL}</div>
        </div>

        <div id="display" style="display:flex; justify-content:space-around; height:75vh; padding:40px 20px; gap:20px;">
            ${TEAM_NAMES_REPS()}
        </div>
        
        <script src="/socket.io/socket.io.js"></script>
        <script>
            const socket = io();
            const sound = new Audio('https://www.myinstants.com/media/sounds/level-up-191.mp3');

            function startBoard() {
                sound.play().then(() => {
                    sound.pause();
                    document.getElementById('btn').style.display = 'none';
                });
            }

            function getToday() { return new Date().toLocaleDateString(); }

            socket.on('requestSync', () => {
                const localData = localStorage.getItem('unishippers_stats');
                if (localData) socket.emit('syncFromTV', JSON.parse(localData));
            });

            socket.on('updateUI', (data) => {
                // UPDATE WITHOUT REFRESHING PAGE
                updateElements(data.stats, data.name, data.goal);
                sound.currentTime = 0;
                sound.play();
                confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
                localStorage.setItem('unishippers_stats', JSON.stringify(data.stats));
            });

            socket.on('refresh', (data) => { updateElements(data.stats, null, data.goal); });

            function updateElements(data, updatedName, goal) {
                let totalLeads = 0;
                let maxPoints = 0;

                // Calculate totals
                for(let n in data) {
                    totalLeads += data[n].leads;
                    let p = data[n].leads + data[n].meetings + data[n].invoices;
                    if(p > maxPoints) maxPoints = p;
                }

                // Update Progress
                document.getElementById('goal-bar').style.width = (totalLeads/goal*100) + '%';
                document.getElementById('goal-text').innerText = 'DAILY LEAD GOAL: ' + totalLeads + ' / ' + goal;

                // Update Individual Cards
                for(let n in data) {
                    const card = document.getElementById('card-' + n);
                    const pts = data[n].leads + data[n].meetings + data[n].invoices;
                    
                    document.getElementById('leads-' + n).innerText = data[n].leads;
                    document.getElementById('meetings-' + n).innerText = data[n].meetings;
                    document.getElementById('invoices-' + n).innerText = data[n].invoices;
                    
                    // Crown logic
                    document.getElementById('crown-' + n).style.display = (pts === maxPoints && maxPoints > 0) ? 'block' : 'none';
                    
                    // Animation
                    if(n === updatedName) {
                        card.classList.remove('updated');
                        void card.offsetWidth; // Trigger reflow
                        card.classList.add('updated');
                    }
                }
            }
        </script></body>`;
}

function TEAM_NAMES_REPS() {
    return ["Daniel", "Lucas", "Cooper"].map(n => `
        <div id="card-${n}" class="card">
            <div id="crown-${n}" class="leader-crown">👑</div>
            <div style="padding:15px; font-size:3vw; color:#00ff88; font-weight:bold;">${n}</div>
            <div id="leads-${n}" style="font-size:10vw; font-weight:900;">0</div><div style="color:#aaa;">LEADS</div>
            <div id="meetings-${n}" style="font-size:5vw; margin-top:10px;">0</div><div style="color:#00e5ff;">MEETINGS</div>
            <div id="invoices-${n}" style="font-size:3vw; margin-top:10px;">0</div><div style="color:#ff0055;">INVOICES</div>
        </div>
    `).join('');
}

function updatePortalHTML() {
    return `<!DOCTYPE html><body style="font-family:sans-serif; background:#111; color:white; text-align:center; padding:20px;">
        <div style="max-width:400px; margin:auto; background:#222; padding:20px; border-radius:20px;">
            <h2>Update Stats</h2>
            <select id="n" style="width:100%; padding:10px; margin-bottom:10px;"><option>Daniel</option><option>Lucas</option><option>Cooper</option></select>
            <select id="t" style="width:100%; padding:10px; margin-bottom:10px;"><option value="leads">Leads</option><option value="meetings">Meetings</option><option value="invoices">Invoices</option></select>
            <input type="number" id="v" style="width:100%; padding:10px; margin-bottom:10px;" placeholder="New Total">
            <button onclick="send()" style="width:100%; padding:15px; background:#e31b23; color:white; border:none; border-radius:10px; font-weight:bold;">UPDATE TV</button>
        </div>
        <script src="/socket.io/socket.io.js"></script>
        <script>
            const socket = io();
            function send() {
                const val = document.getElementById('v').value;
                if(!val) return;
                socket.emit('updateStats', { name: document.getElementById('n').value, type: document.getElementById('t').value, val: parseInt(val) });
                document.getElementById('v').value = '';
            }
        </script></body>`;
}
