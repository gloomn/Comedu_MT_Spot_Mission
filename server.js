import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import multer from 'multer';
import fs from 'fs';
import path from 'path';

const app = express();
app.use(cors());
app.use(express.json());

if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

// 업로드 용량 제한 50MB 유지
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'media-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ 
  storage,
  limits: { fileSize: 50 * 1024 * 1024 } 
});

app.use('/uploads', express.static('uploads'));
app.post('/api/upload', (req, res) => {
  upload.single('media')(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: '파일 용량이 너무 큽니다. (최대 50MB)' });
      }
      return res.status(400).json({ error: '업로드 중 오류가 발생했습니다.' });
    }
    if (!req.file) return res.status(400).json({ error: '파일이 없습니다.' });
    res.json({ url: `/uploads/${req.file.filename}` }); 
  });
});

const DATA_FILE = 'data.json';
let globalSpots = [];
let globalSubmissions = [];
let globalTeams = new Set();
let globalMemos = {}; 
let globalTeamPasswords = {}; 

// 🟢 추가: 현재 팀별로 접속 중인 단 1개의 기기(소켓 ID)를 기억하는 객체
let activeTeamSockets = {};

if (fs.existsSync(DATA_FILE)) {
  try {
    const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
    if (data.spots) globalSpots = data.spots;
    if (data.submissions) globalSubmissions = data.submissions;
    if (data.teams) globalTeams = new Set(data.teams);
    if (data.memos) globalMemos = data.memos;
    if (data.teamPasswords) globalTeamPasswords = data.teamPasswords;
    console.log('✅ 기존 데이터를 성공적으로 복구했습니다!');
  } catch (e) {
    console.error('❌ 데이터 파일 읽기 오류:', e);
  }
}

const saveData = () => {
  const data = {
    spots: globalSpots,
    submissions: globalSubmissions,
    teams: Array.from(globalTeams),
    memos: globalMemos,
    teamPasswords: globalTeamPasswords
  };
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
};

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: "*" },
  maxHttpBufferSize: 1e8 
});

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  const sendInitData = () => {
    socket.emit('init', { 
      spots: globalSpots, 
      submissions: globalSubmissions, 
      teams: Array.from(globalTeams),
      memos: globalMemos
    });
  };

  sendInitData();
  socket.on('request_init', () => sendInitData());
  
  socket.on('join_team', (data, callback) => {
    if (typeof data === 'string') return; 

    const { teamName, password } = data;
    if (!teamName || !password) {
      if (callback) callback({ success: false, message: '팀 이름과 비밀번호를 모두 입력해주세요.' });
      return;
    }

    let isSuccess = false;

    if (globalTeams.has(teamName)) {
      if (globalTeamPasswords[teamName] === password) {
        isSuccess = true;
      } else {
        if (callback) callback({ success: false, message: '비밀번호가 틀렸습니다. 다시 확인해주세요.' });
        return;
      }
    } else {
      globalTeams.add(teamName);
      globalTeamPasswords[teamName] = password;
      io.emit('teams_updated', Array.from(globalTeams));
      saveData();
      isSuccess = true;
    }

    // 🟢 기기 1대 제한 로직: 로그인 성공 시 기존 기기 강제 로그아웃
    if (isSuccess) {
      const previousSocketId = activeTeamSockets[teamName];
      // 이미 접속 중인 기기가 있다면?
      if (previousSocketId && previousSocketId !== socket.id) {
        // 기존 기기에 '강제 로그아웃' 이벤트 전송
        io.to(previousSocketId).emit('force_logout', '다른 기기에서 접속하여 현재 기기는 로그아웃됩니다. (1팀 1기기 제한)');
      }
      
      // 방금 로그인한 기기를 활성 기기로 등록
      activeTeamSockets[teamName] = socket.id;
      socket.teamName = teamName; 
      
      if (callback) callback({ success: true });
    }
  });

  socket.on('update_spots', (newSpots) => {
    globalSpots = newSpots;
    io.emit('spots_updated', globalSpots);
    saveData();
  });

  socket.on('add_submission', (submission) => {
    const isAlreadyCompleted = globalSubmissions.some(
      s => s.teamName === submission.teamName && s.spotId === submission.spotId
    );
    if (!isAlreadyCompleted) {
      globalSubmissions.push(submission);
      io.emit('submissions_updated', globalSubmissions);
      saveData();
    }
  });

  socket.on('update_memo', ({ teamName, memo }) => {
    globalMemos[teamName] = memo;
    io.emit('memo_updated', { teamName, memo });
    saveData();
  });

  socket.on('delete_team', (teamName) => {
    if (teamName) {
      globalTeams.delete(teamName);
      globalSubmissions = globalSubmissions.filter(sub => sub.teamName !== teamName);
      if (globalMemos[teamName]) delete globalMemos[teamName];
      if (globalTeamPasswords[teamName]) delete globalTeamPasswords[teamName]; 
      
      // 활성 소켓 정보도 삭제
      if (activeTeamSockets[teamName]) delete activeTeamSockets[teamName];

      io.emit('teams_updated', Array.from(globalTeams));
      io.emit('submissions_updated', globalSubmissions);
      saveData();
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    // 연결이 완전히 끊기면 활성 기기 목록에서도 비워주기
    if (socket.teamName && activeTeamSockets[socket.teamName] === socket.id) {
      delete activeTeamSockets[socket.teamName];
    }
  });
});

const PORT = 3567;
httpServer.listen(PORT, () => console.log(`Socket Server is running on port ${PORT}`));