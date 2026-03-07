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

// 1. 영상을 저장할 uploads 폴더 자동 생성
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

// 2. Multer 업로드 설정
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'media-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

app.use('/uploads', express.static('uploads'));
app.post('/api/upload', upload.single('media'), (req, res) => {
  if (!req.file) return res.status(400).send('파일이 없습니다.');
  res.json({ url: `/uploads/${req.file.filename}` }); 
});

// 3. 데이터 영구 보존용 파일 경로 및 초기화
const DATA_FILE = 'data.json';
let globalSpots = [];
let globalSubmissions = [];
let globalTeams = new Set();
let globalMemos = {}; // 🟢 팀별 메모 저장 객체 추가

// 서버 시작 시 기존 데이터가 있다면 불러오기
if (fs.existsSync(DATA_FILE)) {
  try {
    const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
    if (data.spots) globalSpots = data.spots;
    if (data.submissions) globalSubmissions = data.submissions;
    if (data.teams) globalTeams = new Set(data.teams);
    if (data.memos) globalMemos = data.memos; // 🟢 메모 복구
    console.log('✅ 기존 데이터를 성공적으로 복구했습니다!');
  } catch (e) {
    console.error('❌ 데이터 파일 읽기 오류:', e);
  }
}

// 데이터 변경 시마다 JSON 파일에 기록하는 함수
const saveData = () => {
  const data = {
    spots: globalSpots,
    submissions: globalSubmissions,
    teams: Array.from(globalTeams),
    memos: globalMemos // 🟢 메모 데이터도 함께 저장
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
    // 🟢 memos 데이터도 함께 전송하여 클라이언트 동기화
    socket.emit('init', { 
      spots: globalSpots, 
      submissions: globalSubmissions, 
      teams: Array.from(globalTeams),
      memos: globalMemos
    });
  };

  sendInitData();
  socket.on('request_init', () => sendInitData());
  
  socket.on('join_team', (teamName) => {
    if (teamName) {
      globalTeams.add(teamName);
      io.emit('teams_updated', Array.from(globalTeams));
      saveData();
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

  // 🟢 실시간 팀 메모장 동기화 이벤트
  socket.on('update_memo', ({ teamName, memo }) => {
    globalMemos[teamName] = memo;
    // 변경된 메모를 모든 클라이언트(같은 팀원들)에게 즉시 브로드캐스트
    io.emit('memo_updated', { teamName, memo });
    saveData();
  });

  socket.on('disconnect', () => console.log('User disconnected:', socket.id));
});

const PORT = 3567;
httpServer.listen(PORT, () => console.log(`Socket Server is running on port ${PORT}`));