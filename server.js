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

// 🟢 1. 영상을 저장할 uploads 폴더 자동 생성
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

// 🟢 2. Multer 업로드 설정 (파일명 겹치지 않게 고유 번호 부여)
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'media-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// 🟢 3. 파일 업로드 API 및 조회용 정적 라우터 설정
app.use('/uploads', express.static('uploads'));
app.post('/api/upload', upload.single('media'), (req, res) => {
  if (!req.file) return res.status(400).send('파일이 없습니다.');
  // 업로드 성공 시 브라우저에서 볼 수 있는 경로 반환
  res.json({ url: `/uploads/${req.file.filename}` }); 
});

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: "*" },
  maxHttpBufferSize: 1e8 
});

let globalSpots = [];
let globalSubmissions = [];
let globalTeams = new Set();

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  const sendInitData = () => {
    socket.emit('init', { spots: globalSpots, submissions: globalSubmissions, teams: Array.from(globalTeams) });
  };

  sendInitData();

  socket.on('request_init', () => sendInitData());
  
  socket.on('join_team', (teamName) => {
    if (teamName) {
      globalTeams.add(teamName);
      io.emit('teams_updated', Array.from(globalTeams));
    }
  });

  socket.on('update_spots', (newSpots) => {
    globalSpots = newSpots;
    io.emit('spots_updated', globalSpots);
  });

  socket.on('add_submission', (submission) => {
    const isAlreadyCompleted = globalSubmissions.some(
      s => s.teamName === submission.teamName && s.spotId === submission.spotId
    );
    if (!isAlreadyCompleted) {
      globalSubmissions.push(submission);
      io.emit('submissions_updated', globalSubmissions);
    }
  });

  socket.on('disconnect', () => console.log('User disconnected:', socket.id));
});

const PORT = 3567;
httpServer.listen(PORT, () => console.log(`Socket Server is running on port ${PORT}`));