from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from app.core.settings import settings
from app.api import record_send
from contextlib import asynccontextmanager
from QMacroDetector import Pattern_Game

# /api/get_points 호출
# 실행부 -> python -m uvicorn main:app --host 0.0.0.0 --port 8300 --reload
# 8300번
# http -> 8300 /api/get_points
# 같은 서버 호출 http://localhost:8300/api/get_points
# 같은 서버에 올려야 트래픽 제한 거의 없음!

@asynccontextmanager
async def lifespan(app: FastAPI):
    # [START] 서버 시작 시 실행
    print("🚀 서버를 시작합니다. AI 모델을 로드 중...")
    
    try:
        app.state.pattern_game = Pattern_Game()
        print("✅ 모델 로드 완료")
    except Exception as e:
        print(f"❌ 모델 로드 실패: {e}")
    
    yield

    print("🛑 서버 종료 중. 자원을 정리합니다.")

app = FastAPI(lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(GZipMiddleware, minimum_size=1000)

app.include_router(record_send.router, prefix="/api")