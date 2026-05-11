const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);

// Set your daily lead goal here
const DAILY_GOAL = 30;

let stats = { 
    "Daniel": { leads: 0, meetings: 0, invoices: 0 }, 
    "Lucas": { leads: 0, meetings: 0, invoices: 0 }, 
    "Cooper": { leads: 0, meetings: 0, invoices: 0 } 
};

app.get('/', (req, res) => { res.send(dashboardHTML()); });
app.get('/update', (req, res) => { res.send(updatePortalHTML()); });

io.on('connection', (socket) => {
    socket.emit('refresh', { stats, goal: DAILY_GOAL });
    socket.on('syncFromTV', (savedData) => {
        stats = savedData;
        io.emit('refresh', { stats, goal: DAILY_GOAL });
    });
    socket.on('updateStats', (data) => {
        if (stats[data.name]) {
            stats[data.name][data.type] = data.val; 
            io.emit('updateUI', { name: data.name, stats: stats, goal: DAILY_GOAL });
        }
    });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => { console.log('Unishippers Pro Dash Live'); });

function dashboardHTML() {
    return `<!DOCTYPE html><body style="background:#050505; color:white; font-family:sans-serif; text-align:center; margin:0; overflow:hidden;">
        <script src="https://cdn.jsdelivr.net/npm/canvas-confetti@1.6.0/dist/confetti.browser.min.js"></script>
        <style>
            @keyframes celebrate { 
                0% { background: #111; transform: scale(1); box-shadow: none; } 
                20% { background: #00ff88; transform: scale(1.08); box-shadow: 0 0 80px #00ff88; } 
                100% { background: #111; transform: scale(1); box-shadow: none; } 
            }
            .updated { animation: celebrate 1.2s cubic-bezier(0.175, 0.885, 0.32, 1.275); z-index: 10; }
            .leader-crown { position: absolute; top: -25px; left: 50%; transform: translateX(-50%); font-size: 40px; filter: drop-shadow(0 0 10px gold); }
        </style>
        
        <div style="background: #111; padding: 10px 15px; border-bottom: 3px solid #e31b23; display: flex; flex-direction: column; align-items: center;" onclick="bell.play()">
            <div style="display: flex; align-items: center; justify-content: center; gap: 20px; width: 100%;">
                <img src="https://i.ibb.co/LzN2mD1/Unishippers2.png" style="height: 45px;">
                <h1 style="font-size:2.5vw; margin:0; letter-spacing:3px; color:white; text-transform: uppercase;">Sales Leaderboard</h1>
            </div>
            <div style="width: 60%; background: #333; height: 12px; border-radius: 10px; margin-top: 10px; overflow: hidden; border: 1px solid #444;">
                <div id="goal-bar" style="width: 0%; background: linear-gradient(90deg, #00e5ff, #00ff88); height: 100%; transition: width 1s ease-in-out;"></div>
            </div>
            <div id="goal-text" style="font-size: 0.8vw; color: #aaa; margin-top: 5px; font-weight: bold;">TEAM LEAD GOAL: 0 / ${DAILY_GOAL}</div>
        </div>

        <div id="display" style="display:flex; justify-content:space-around; align-items:stretch; height:78vh; padding:35px 25px; gap:20px;"></div>
        
        <script src="/socket.io/socket.io.js"></script>
        <script>
            const socket = io();
            const bell = new Audio('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3');

            function getToday() { return new Date().toLocaleDateString(); }

            const localData = localStorage.getItem('unishippers_stats');
            const savedDate = localStorage.getItem('unishippers_date');

            if (localData && savedDate === getToday()) {
                socket.emit('syncFromTV', JSON.parse(localData));
            } else {
                localStorage.setItem('unishippers_date', getToday());
                localStorage.removeItem('unishippers_stats');
            }

            socket.on('updateUI', (data) => {
                bell.currentTime = 0;
                bell.play().catch(e => {});
                confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 }, colors: ['#00ff88', '#e31b23', '#ffffff'] });
                
                localStorage.setItem('unishippers_stats', JSON.stringify(data.stats));
                localStorage.setItem('unishippers_date', getToday());
                render(data.stats, data.name, data.goal);
            });

            socket.on('refresh', (data) => { render(data.stats, null, data.goal); });

            function render(data, updatedName, goal) {
                let html = '';
                let totalLeads = 0;
                let maxLeads = -1;
                let leaderName = '';

                for(let name in data) {
                    totalLeads += data[name].leads;
                    if(data[name].leads > maxLeads && data[name].leads > 0) {
                        maxLeads = data[name].leads;
                        leaderName = name;
                    }
                }

                const percent = Math.min((totalLeads / goal) * 100, 100);
                document.getElementById('goal-bar').style.width = percent + '%';
                document.getElementById('goal-text').innerText = 'TEAM LEAD GOAL: ' + totalLeads + ' / ' + goal;

                for(let name in data) {
                    let updateClass = (name === updatedName) ? 'updated' : '';
                    let crown = (name === leaderName) ? '<div class="leader-crown">👑</div>' : '';
                    
                    html += '<div class="' + updateClass + '" style="background:#111; border-radius:30px; flex:1; border: 2px solid #333; display:flex; flex-direction:column; position:relative;">' +
                            crown +
                            '<div style="background:#222; padding:15px; font-size:3vw; font-weight:bold; color:#00ff88; border-radius: 30px 30px 0 0;">' + name + '</div>' +
                            '<div style="flex:1; display:flex; flex-direction:column; justify-content:center; padding:20px;">' +
                                '<div><div style="color:#aaa; font-size:1.5vw; font-weight:bold;">LEADS</div><div style="font-size:12vw; font-weight:900; line-height:1; color:white;">' + data[name].leads + '</div></div>' +
                                '<div style="margin:20px 0;"><div style="color:#00e5ff; font-size:1.2vw; font-weight:bold;">MEETINGS SET</div><div style="font-size:6vw; font-weight:bold;">' + data[name].meetings + '</div></div>' +
                                '<div><div style="color:#ff0055; font-size:1vw; font-weight:bold;">INVOICES</div><div style="font-size:3.5vw; font-weight:bold;">' + data[name].invoices + '</div></div>' +
                            '</div></div>';
                }
                document.getElementById('display').innerHTML = html;
            }
        </script></body>`;
}

function updatePortalHTML() {
    return `<!DOCTYPE html><meta name="viewport" content="width=device-width, initial-scale=1.0">
    <body style="font-family:sans-serif; background:#111; color:white; padding:20px; text-align:center;">
        <div style="max-width:450px; margin:auto; background:#222; padding:30px; border-radius:20px; border:1px solid #444;">
            <img src="https://i.ibb.co/LzN2mD1/Unishippers2.png" style="height: 35px; margin-bottom: 20px;">
            <h2 style="color:white; margin-top:0;">Update Stats</h2>
            <select id="n" style="font-size:1.2rem; width:100%; padding:15px; margin-bottom:20px; background:#333; color:white; border-radius:10px; border:none;">
                <option>Daniel</option><option>Lucas</option><option>Cooper</option>
            </select>
            <select id="t" style="font-size:1.2rem; width:100%; padding:15px; margin-bottom:20px; background:#333; color:white; border-radius:10px; border:none;">
                <option value="leads">Leads</option><option value="meetings">Meetings Set</option><option value="invoices">Invoices</option>
            </select>
            <input type="number" id="v" inputmode="numeric" placeholder="Enter Total" style="font-size:2rem; width:100%; padding:15px; margin-bottom:25px; background:#444; color:white; border-radius:10px; border:none; text-align:center;">
            <button onclick="send()" style="background:#e31b23; color:white; width:100%; height:70px; font-size:1.6rem; font-weight:bold; border-radius:15px; border:none; box-shadow: 0 4px 15px rgba(227,27,35,0.3);">UPDATE TV</button>
        </div>
        <script src="/socket.io/socket.io.js"></script>
        <script>
            const socket = io();
            function send() {
                const val = document.getElementById('v').value;
                if(!val) return alert("Enter a number!");
                socket.emit('updateStats', { name: document.getElementById('n').value, type: document.getElementById('t').value, val: parseInt(val) });
                alert('Success!'); document.getElementById('v').value = '';
            }
        </script></body>`;
}
