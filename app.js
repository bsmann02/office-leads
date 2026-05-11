const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);

// Tracked categories: Leads, Meetings, Invoices
let stats = { 
    "Daniel": { leads: 0, meetings: 0, invoices: 0 }, 
    "Lucas": { leads: 0, meetings: 0, invoices: 0 }, 
    "Cooper": { leads: 0, meetings: 0, invoices: 0 } 
};

app.get('/', (req, res) => { res.send(dashboardHTML()); });
app.get('/update', (req, res) => { res.send(updatePortalHTML()); });

io.on('connection', (socket) => {
    socket.emit('refresh', stats);
    socket.on('updateStats', (data) => {
        if (stats[data.name]) {
            stats[data.name][data.type] = data.val; 
            io.emit('updateUI', { name: data.name, stats: stats });
        }
    });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => { console.log('Unishippers Dash Live'); });

function dashboardHTML() {
    return `<!DOCTYPE html><body style="background:#050505; color:white; font-family:sans-serif; text-align:center; margin:0; overflow:hidden;">
        <style>
            @keyframes celebrate {
                0% { background: #111; transform: scale(1); }
                20% { background: #00ff88; transform: scale(1.05); }
                40% { background: #00ff88; box-shadow: 0 0 100px #00ff88; }
                100% { background: #111; transform: scale(1); }
            }
            .updated { animation: celebrate 1.5s ease-out; }
            .metric-label { font-weight: bold; letter-spacing: 2px; }
        </style>
        <div style="background: #111; padding: 15px; border-bottom: 3px solid #00ff88;">
            <h1 style="font-size:3.5vw; margin:0; letter-spacing:5px; color:#00ff88;">UNISHIPPERS SALES BOARD</h1>
        </div>
        <div id="display" style="display:flex; justify-content:space-around; align-items:stretch; height:85vh; padding:30px; gap:20px;"></div>
        <script src="/socket.io/socket.io.js"></script>
        <script>
            const socket = io();
            socket.on('updateUI', (data) => { render(data.stats, data.name); });
            socket.on('refresh', (data) => { render(data, null); });
            function render(data, updatedName) {
                let html = '';
                for(let name in data) {
                    let updateClass = (name === updatedName) ? 'updated' : '';
                    html += '<div class="' + updateClass + '" style="background:#111; border-radius:30px; flex:1; border: 2px solid #333; display:flex; flex-direction:column; transition: all 0.3s;">' +
                            '<div style="background:#222; padding:15px; font-size:3vw; font-weight:bold; color:#00ff88;">' + name + '</div>' +
                            '<div style="flex:1; display:flex; flex-direction:column; justify-content:center; padding:20px;">' +
                                '<div><div class="metric-label" style="color:#aaa; font-size:1.5vw;">LEADS</div>' +
                                '<div style="font-size:13vw; font-weight:900; line-height:1;">' + data[name].leads + '</div></div>' +
                                '<div style="margin:20px 0;"><div class="metric-label" style="color:#00e5ff; font-size:1.2vw;">MEETINGS SET</div>' +
                                '<div style="font-size:6vw; font-weight:bold;">' + data[name].meetings + '</div></div>' +
                                '<div><div class="metric-label" style="color:#ff0055; font-size:1vw;">INVOICES</div>' +
                                '<div style="font-size:3.5vw; font-weight:bold;">' + data[name].invoices + '</div></div>' +
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
            <h2 style="color:#00ff88;">Unishippers Portal</h2>
            <select id="n" style="font-size:1.2rem; width:100%; padding:15px; margin-bottom:20px; background:#333; color:white; border:none; border-radius:10px;">
                <option>Daniel</option><option>Lucas</option><option>Cooper</option>
            </select>
            <select id="t" style="font-size:1.2rem; width:100%; padding:15px; margin-bottom:20px; background:#333; color:white; border:none; border-radius:10px;">
                <option value="leads">Leads</option>
                <option value="meetings">Meetings Set</option>
                <option value="invoices">Invoices</option>
            </select>
            <input type="number" id="v" inputmode="numeric" style="font-size:2rem; width:100%; padding:15px; box-sizing:border-box; margin-bottom:25px; background:#444; color:white; border:none; border-radius:10px;">
            <button onclick="send()" style="background:#00ff88; color:black; width:100%; height:70px; font-size:1.6rem; font-weight:bold; border:none; border-radius:15px;">UPDATE TV</button>
        </div>
        <script src="/socket.io/socket.io.js"></script>
        <script>
            const socket = io();
            function send() {
                const val = document.getElementById('v').value;
                if(!val) return alert("Enter number");
                socket.emit('updateStats', { 
                    name: document.getElementById('n').value, 
                    type: document.getElementById('t').value, 
                    val: parseInt(val) 
                });
                alert('Sent!'); document.getElementById('v').value = '';
            }
        </script></body>`;
}
