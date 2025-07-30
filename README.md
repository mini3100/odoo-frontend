# Odoo 프론트엔드 관리자

Odoo 데이터베이스 연결과 필수 모듈 로드 과정을 시각적으로 관리할 수 있는 React 애플리케이션입니다.

## 주요 기능

### 🔗 데이터베이스 연결 관리
- Odoo 서버에 안전한 연결
- 실시간 연결 상태 모니터링
- 자동 재연결 기능
- 세션 관리

### 📦 모듈 로드 관리
- 필수 모듈 자동 로드
- 모듈 상태 실시간 확인
- 로드 진행률 시각화
- 모듈 의존성 순서 관리

### 📊 시각적 모니터링
- 연결 상태 실시간 표시
- 모듈 로드 진행률 대시보드
- 오류 및 경고 메시지 표시
- 로드된 모듈 목록 확인

## 설치 및 실행

### 0. Odoo 백엔드 서버 실행

1. [Odoo 공식 홈페이지](https://www.odoo.com/page/download) 또는 GitHub에서 Odoo 소스코드 다운로드
2. Python 3.8~3.10 환경 준비 (가상환경 권장)
3. Odoo 폴더에서 필수 패키지 설치
   ```bash
   pip install -r requirements.txt
   ```
4. PostgreSQL 설치 및 Odoo용 DB/유저 생성
   ```sql
   CREATE USER odoo WITH PASSWORD 'odoo';
   CREATE DATABASE odoo OWNER odoo;
   ```
5. Odoo 서버 실행
   ```bash
   python odoo-bin -c odoo.conf
   # 또는 설정 파일 없이
   python odoo-bin --addons-path=addons --db_user=odoo --db_password=odoo
   ```
6. 브라우저에서 [http://localhost:8069](http://localhost:8069) 접속

---

### 1. 의존성 설치
```bash
npm install
```

### 2. 환경 변수 설정
프로젝트 루트에 `.env` 파일을 생성하고 다음 내용을 추가하세요:

```env
# Odoo 서버 설정
REACT_APP_ODOO_URL=http://localhost:8069
REACT_APP_ODOO_DATABASE=your_database_name

# 개발 모드 설정
NODE_ENV=development

# 로깅 설정
REACT_APP_LOG_LEVEL=info
```

### 3. 애플리케이션 실행
```bash
npm start
```

브라우저에서 `http://localhost:3000`으로 접속하세요.

## 사용법

### 1. Odoo 서버 연결
1. 사용자명과 비밀번호를 입력
2. "연결" 버튼 클릭
3. 연결 상태 확인

### 2. 모듈 로드
1. 연결 성공 후 자동으로 필수 모듈 로드 시작
2. 수동으로 "필수 모듈 로드" 버튼 클릭 가능
3. 로드 진행률 및 결과 확인

### 3. 모듈 상태 확인
1. 드롭다운에서 확인할 모듈 선택
2. "상태 확인" 버튼 클릭
3. 모듈 상태 정보 확인

## 프로젝트 구조

```
src/
├── components/
│   ├── OdooConnectionManager.js    # 메인 연결 관리 컴포넌트
│   └── OdooConnectionManager.css   # 스타일 파일
├── config/
│   └── odooConfig.js              # Odoo 설정 및 로깅
├── hooks/
│   └── useOdooConnection.js       # Odoo 연결 React Hook
├── utils/
│   └── odooConnection.js          # Odoo 연결 유틸리티
├── App.js                         # 메인 앱 컴포넌트
└── App.css                        # 앱 스타일
```

## 설정 옵션

### Odoo 서버 설정 (`src/config/odooConfig.js`)

```javascript
export const ODOO_CONFIG = {
  SERVER_URL: 'http://localhost:8069',    // Odoo 서버 URL
  DATABASE: 'odoo_db',                    // 데이터베이스 이름
  SESSION_TIMEOUT: 60,                    // 세션 타임아웃 (분)
  RETRY_CONFIG: {
    maxRetries: 3,                        // 최대 재시도 횟수
    retryDelay: 1000,                     // 재시도 간격 (ms)
  }
};
```

### 필수 모듈 설정

```javascript
export const MODULE_CONFIG = {
  REQUIRED_MODULES: [
    'base', 'web', 'mail', 'sale', 
    'purchase', 'account', 'stock', 'hr'
  ],
  LOAD_ORDER: [
    'base', 'web', 'mail', 'hr',
    'account', 'stock', 'purchase', 'sale'
  ]
};
```

## 로깅 기능

애플리케이션은 다음과 같은 로깅 기능을 제공합니다:

- **연결 과정 로깅**: 연결 시도, 성공, 실패 기록
- **모듈 로드 로깅**: 각 모듈의 로드 상태 및 결과 기록
- **오류 로깅**: 상세한 오류 정보 및 스택 트레이스
- **성능 모니터링**: 연결 시간 및 모듈 로드 시간 측정

### 로그 레벨 설정

- `debug`: 상세한 디버그 정보
- `info`: 일반적인 정보 메시지
- `warn`: 경고 메시지
- `error`: 오류 메시지

## 보안 고려사항

1. **환경 변수 사용**: 민감한 정보는 환경 변수로 관리
2. **HTTPS 연결**: 프로덕션에서는 HTTPS 사용 권장
3. **세션 관리**: 자동 세션 만료 및 재연결 처리
4. **입력 검증**: 사용자 입력에 대한 적절한 검증

## 문제 해결

### 연결 실패
- Odoo 서버가 실행 중인지 확인
- 서버 URL과 포트가 올바른지 확인
- 방화벽 설정 확인

### 모듈 로드 실패
- 모듈이 Odoo에 설치되어 있는지 확인
- 모듈 의존성이 올바른지 확인
- Odoo 로그에서 오류 메시지 확인

### 성능 문제
- 네트워크 연결 상태 확인
- Odoo 서버 성능 확인
- 모듈 로드 순서 최적화

## 개발자 정보

이 프로젝트는 React와 Odoo API를 사용하여 개발되었습니다.

### 기술 스택
- React 19.1.1
- Axios (HTTP 클라이언트)
- CSS3 (스타일링)

### 브라우저 지원
- Chrome (권장)
- Firefox
- Safari
- Edge

## 라이선스

MIT License
