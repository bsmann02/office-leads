const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);

// Data resets to 0 every time the cloud server restarts (Perfect for your daily reset)
let leads = { 
    "Daniel": 0, 
    "Lucas": 0, 
    "Cooper": 0 
};

app.get('/', (req, res) => { res.send(dashboardHTML()); });
app.get('/update', (req, res) => { res.send(updatePortalHTML()); });

io.on('connection', (socket) => {
    socket.emit('refresh', leads);
    socket.on('updateLeads', (data) => {
        if (leads.hasOwnProperty(data.name)) {
            leads[data.name] = data.val; 
            io.emit('refresh', leads);
        }
    });
});

// Use the Cloud's assigned port or 3000 for local testing
const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
    console.log('Office Dashboard is live on port ' + PORT);
});

function dashboardHTML() {
    return `<!DOCTYPE html><body style="background:#0a0a0a; color:white; font-family:sans-serif; text-align:center; overflow:hidden;">
        <h1 style="font-size:5vw; color:#00ff88; margin-top:30px; letter-spacing:2px;">DAILY LEAD TRACKER</h1>
        <div id="display" style="display:flex; justify-content:center; align-items:center; height:70vh; gap:40px; padding: 0 50px;"></div>
        <script src="/socket.io/socket.io.js"></script>
        <script>
            const socket = io();
            socket.on('refresh', (data) => {
                let html = '';
                for(let name in data) {
                    html += '<div style="background:#1a1a1a; padding:50px; border-radius:30px; flex:1; border: 2px solid #333; box-shadow: 0 20px 50px rgba(0,0,0,0.5);">' +
                            '<h2 style="font-size:3.5vw; color:#aaa; margin-bottom:10px;">' + name + '</h2>' +
                            '<div style="font-size:12vw; font-weight:bold; color:white;">' + data[name] + '</div></div>';
                }
                document.getElementById('display').innerHTML = html;
            });
        </script></body>`;
}

function updatePortalHTML() {
    return `<!DOCTYPE html><meta name="viewport" content="width=device-width, initial-scale=1.0">
    <body style="font-family:sans-serif; padding:20px; text-align:center; background:#f4f4f9;">
        <div style="max-width:400px; margin:auto; background:white; padding:30px; border-radius:15px; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
            <h2 style="color:#333;">Update Leads</h2>
            <select id="n" style="font-size:1.5rem; width:100%; padding:15px; margin-bottom:20px; border-radius:10px;">
                <option>Daniel</option><option>Lucas</option><option>Cooper</option>
            </select>
            <input type="number" id="v" placeholder="Enter Total Leads" style="font-size:1.5rem; width:100%; padding:15px; box-sizing:border-box; margin-bottom:20px; border-radius:10px;">
            <button onclick="send()" style="background:#00c853; color:white; width:100%; height:70px; font-size:1.8rem; font-weight:bold; border:none; border-radius:12px; cursor:pointer;">UPDATE TV</button>
        </div>
        <script src="/socket.io/socket.io.js"></script>
        <script>
            const socket = io();
            function send() {
                const v = document.getElementById('v').value;
                if(!v) return alert("Enter a number!");
                socket.emit('updateLeads', { name: document.getElementById('n').value, val: parseInt(v) });
                alert('Success! TV Updated.');
            }
        </script></body>`;
}