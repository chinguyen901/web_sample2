# PLAN — 5G OAM Interview Demo Site

> Bộ não thứ 2 — Công việc thực tế tại TMA Solutions (5G OAM Platform)  
> Mục tiêu: 3 web demo trực quan hóa đúng những gì Chi làm hàng ngày  
> Deploy: Vercel — project riêng, tách hoàn toàn khỏi portfolio Upwork

---

## 1. BỐI CẢNH: CHI LÀM GÌ Ở TMA SOLUTIONS?

**Role:** Software Engineer — C++ Backend, 5G OAM Platform  
**Team:** Mobile-Phoenix (Radisys Trillium 5G NR)  
**Thời gian:** August 2023 – Present (~3 năm)

### Hệ thống Chi đang build

```
NMS (Network Management System)
        │  NETCONF/YANG (XML over SSH)
        ▼
    ConfD Daemon  ←── NETCONF Server + CDB
        │  Subscription callback
        ▼
   OAM Agent (C++) ◄── CHI LÀM Ở ĐÂY
   ├── comm_thread  (ConfD subscription handler)
   ├── sys_thread   (dynamic config reader)
   ├── OAM_RX       (nhận ZMQ từ gNB)
   └── OAM_AGENT    (main coordinator)
        │  ZMQ Message Queue
   ┌────┴────┐────────┐
   ▼         ▼        ▼
gNB-CU-CP  gNB-CU-UP  gNB-DU
```

### 3 Domain chính Chi làm
| Domain | Viết tắt | Chi làm gì |
|--------|----------|------------|
| Fault Management | **FM** | Nhận alarm từ gNB → format → report lên ConfD → NMS notify |
| Performance Management | **PM** | Thu thập KPI counters → tạo XML PM report → upload NMS |
| Configuration Management | **CM** | Nhận config từ NMS → translate YANG path → gửi xuống gNB |

### Key files Chi đụng hàng ngày
- `oam_agent_confd.cpp` — tương tác ConfD, subscription handling
- `oam_agent_config_mapper.cpp` — translate YANG path → internal struct
- `oam_agent_intf_hdr.cpp` — route messages đúng direction

---

## 2. KẾ HOẠCH 3 DEMO

### Nguyên tắc thiết kế demo
- **Small but complete** — mỗi demo fit 1 màn hình, không scroll nhiều
- **Minh họa đúng flow thật** — không invent flow, chỉ visualize những gì Chi nói được
- **Có thể dùng trong phỏng vấn** — mở URL ra, click 1 cái là interviewer hiểu ngay
- **Code Python snippet** — mỗi demo có tab "How it works" với pseudo-code/flow thật

---

### DEMO 1 — Configuration Management Flow

**URL:** `/demo/cm-flow`  
**Tag line:** "How I translate NMS configs to 5G base station in real-time"  
**Thời gian build:** ~1.5 ngày

#### Ý tưởng
Visualize toàn bộ CM flow từ khi NMS gửi NETCONF edit-config đến khi gNB apply config.  
Interviewer click "Send Config" → thấy từng layer xử lý theo thời gian thật.

#### Layout (2 cột)
```
┌─────────────────────────────────────────────────────┐
│  NETCONF Config Editor          Flow Visualizer      │
│  ┌──────────────────────┐      ┌──────────────────┐  │
│  │ XML Config input     │      │ [NMS]            │  │
│  │ <edit-config>        │      │   │ NETCONF XML  │  │
│  │   <gnbId>123</gnbId> │  →   │ [ConfD]          │  │
│  │   <arfcn>6600</arfcn>│      │   │ validate     │  │
│  │ </edit-config>       │      │   │ write CDB    │  │
│  │ [Send Config ▶]      │      │ [OAM Agent]      │  │
│  └──────────────────────┘      │   │ map path     │  │
│                                │   │ build struct │  │
│  YANG Path Inspector           │ [gNB-CU-CP]      │  │
│  Path: /ManagedElement/...     │   ✓ config applied│  │
│  Type: uint32                  └──────────────────┘  │
│  Value: 123                                          │
└─────────────────────────────────────────────────────┘
```

#### Các phần chi tiết

**Panel trái — Config Editor:**
- Dropdown chọn config type: `Cell Config` / `Frequency Config` / `Power Config`
- XML editor (readonly, hiện XML đúng chuẩn NETCONF)
- Hiện YANG path tương ứng khi hover từng field
- Button "Send Config ▶"

**Panel phải — Flow Visualizer:**
- 5 node: NMS → ConfD → OAM Agent → gNB-CU-CP → gNB-DU
- Animation: mũi tên sáng dần từng bước, mỗi node hiện trạng thái
- Mỗi bước có label: `"NETCONF edit-config"`, `"YANG validate ✓"`, `"CDB write"`, `"subscription callback"`, `"ZMQ OAM_GNB_CONFIG_REQ"`, `"config applied ✓"`
- Timing: 600ms/bước, có thể click "Step by Step" hoặc "Auto"

**Panel dưới — Code tab:**
- Tab "C++ snippet" — giải thích `oam_agent_config_mapper.cpp` logic
- Tab "YANG model" — hiện schema của field đang chọn

**Talk point:**
> "Demo này visualize đúng cái comm_thread của OAM agent xử lý — từ subscription callback của ConfD đến khi build OAM_GNB_CONFIG_REQ struct và gửi qua ZMQ."

---

### DEMO 2 — Fault Management Dashboard

**URL:** `/demo/fm-dashboard`  
**Tag line:** "Real-time alarm monitoring and lifecycle management for 5G base stations"  
**Thời gian build:** ~1.5 ngày

#### Ý tưởng
Dashboard FM với alarm table, lifecycle visualization, và NETCONF notification flow.  
Click "Inject Fault" → alarm xuất hiện → theo flow ZMQ → OAM Agent → ConfD → NMS.

#### Layout
```
┌─────────────────────────────────────────────────────┐
│  Stats: [CRITICAL: 2] [MAJOR: 1] [CLEARED: 5]       │
│  [Inject Fault ▼]  [Clear All]                       │
├──────────────────────┬──────────────────────────────┤
│  Active Alarms       │  Alarm Flow Visualizer        │
│  ┌─────────────────┐ │  ┌────────────────────────┐  │
│  │🔴 LINK_DOWN     │ │  │  gNB-CU-CP             │  │
│  │   CU-CP / Cell1 │ │  │    ↓ ZMQ alarm msg     │  │
│  │   12:34:05      │ │  │  OAM Agent             │  │
│  │   [Clear] [Details]│ │  │    ↓ format + report  │  │
│  │─────────────────│ │  │  ConfD                 │  │
│  │🟡 CPU_HIGH      │ │  │    ↓ NETCONF notify    │  │
│  │   DU / All cells│ │  │  NMS                   │  │
│  └─────────────────┘ │  │    ✓ alarm displayed   │  │
│                       │  └────────────────────────┘  │
│  Alarm Detail Panel   │                              │
│  ID: ALM-2024-001     │  Alarm Timeline              │
│  Severity: CRITICAL   │  [chart — alarm count/time]  │
│  Source: gNB-CU-CP    │                              │
└──────────────────────┴──────────────────────────────┘
```

#### Các phần chi tiết

**Inject Fault dropdown:**
- `LINK_DOWN` — gNB-CU-CP / F1 interface (CRITICAL)
- `CPU_HIGH` — gNB-DU (MAJOR)
- `SYNC_LOSS` — gNB-DU / PTP sync (CRITICAL)
- `CELL_UNAVAILABLE` — gNB-CU-CP (MAJOR)
- `MEM_THRESHOLD` — gNB-CU-UP (MINOR)

**Flow khi inject:**
1. Alarm xuất hiện trong table với status `ACTIVE` (màu đỏ blink)
2. Panel phải animate từng bước: ZMQ → OAM Agent → ConfD → NMS
3. Alarm count trong stats tăng

**Clear alarm:**
- Click "Clear" trên row → flow animate ngược: gNB clear → OAM Agent → ConfD → NMS notify cleared
- Row chuyển màu xanh, status `CLEARED`

**Alarm Timeline:**
- SVG line chart — X axis = time, Y axis = active alarm count
- Tự update realtime khi inject/clear

**Talk point:**
> "Tôi implement flow này — cụ thể là phần OAM Agent nhận ZMQ alarm message từ FMServiceR1, format theo 3GPP alarm struct, rồi gọi ConfD API để report. ConfD tự lo NETCONF notification lên NMS."

---

### DEMO 3 — OAM Agent State Machine & Startup Visualizer

**URL:** `/demo/oam-agent`  
**Tag line:** "Inside the OAM Agent: startup sequence, state machines, and threading model"  
**Thời gian build:** ~1 ngày

#### Ý tưởng
Visualize 2 state machine (NF State + NETCONF State) và startup sequence thực tế từ log.  
Click "Boot OAM Agent" → từng module init → state machine chạy → agent ready.

#### Layout
```
┌─────────────────────────────────────────────────────┐
│  [Boot OAM Agent ▶]  [Reset]    Status: ● READY     │
├──────────────────────────────────────────────────────┤
│  Startup Sequence          │  State Machines          │
│  ┌──────────────────────┐  │  NF State:               │
│  │ 1. Init OAM_LIB  ✓   │  │  INIT → NF_REG → READY  │
│  │ 2. Init OAM_CM   ✓   │  │  ●────────────────○      │
│  │ 3. Init OAM_FM   ✓   │  │                          │
│  │ 4. Init OAM_PM   ✓   │  │  NETCONF State:          │
│  │ 5. Connect ConfD  ✓  │  │  INIT → DISCONNECTED     │
│  │ 6. Connect ZMQ   ✓   │  │    → CONNECTED → READY   │
│  │ 7. Register subs  ✓  │  │  ●────────────────○      │
│  │ 8. Wait MQ ready ✓   │  │                          │
│  │ 9. Agent READY   ●   │  │  Thread Model:           │
│  └──────────────────────┘  │  [comm_thread] [sys_thread]│
│                             │  [OAM_AGENT]  [OAM_RX]  │
│  Module Log Terminal        │                          │
│  > OAM_LIB: ConfDSubscriber init                     │
│  > OAM_FM:  FMServiceR1 start                        │
│  > OAM_CM:  CMService start                          │
└─────────────────────────────────────────────────────┘
```

#### Các phần chi tiết

**Startup Sequence (lấy từ log thật trong INTERVIEW_PREP):**
- 9 bước hiện lần lượt, 400ms/bước
- Mỗi bước hiện tên module thật: `OAM_LIB`, `OAM_CM`, `OAM_FM`, `OAM_PM`
- Log terminal ở dưới hiện output giống log thật

**State Machine Visualizer:**
- 2 state machine chạy song song (đúng flow thật)
- NF State: `INITIALIZE → NF_REGISTRATION → NF_READY`
- NETCONF State: `INIT → NETCONF_DISCONNECTED → NETCONF_CONNECTED → NETCONF_READY`
- Dot di chuyển theo state, màu sắc thay đổi

**Thread Model Panel:**
- 4 thread hiển thị như cards
- Khi agent boot, từng thread "start" → highlight
- Hover vào thread → tooltip giải thích responsibility
- Có note về WHY tách comm_thread / sys_thread (CDB deadlock prevention)

**Port info:**
- Hiện CU-CP: port 2102, DU: port 2100 (chi tiết từ project thật)

**Talk point:**
> "Đây là startup sequence thật — tôi lấy trực tiếp từ log của DU simulator. State machine này (`OamNFStateMachine.cpp`, `OamNetconfStateMachine.cpp`) là 2 file tôi làm việc thường xuyên."

---

## 3. TECH STACK CHO DEMO SITE

```
Framework:  Next.js 14 (App Router) + TypeScript strict
Styling:    Tailwind CSS 3.4
Animation:  CSS transitions + Framer Motion (cho state machine dots)
Deploy:     Vercel (project mới, tách khỏi portfolio)
Domain:     oam-demo.vercel.app (hoặc subdomain custom)
```

**Không cần backend API** — toàn bộ là mock + animation, không call API ngoài.

---

## 4. CẤU TRÚC PROJECT

```
oam-interview-demo/          ← Repo mới
├── app/
│   ├── layout.tsx           ← Root layout, dark theme (#0f172a)
│   ├── page.tsx             ← Index: 3 demo cards + "Who am I" section
│   └── demo/
│       ├── cm-flow/
│       │   └── page.tsx     ← Demo 1: CM Flow Visualizer
│       ├── fm-dashboard/
│       │   └── page.tsx     ← Demo 2: FM Alarm Dashboard
│       └── oam-agent/
│           └── page.tsx     ← Demo 3: State Machine Visualizer
├── components/
│   ├── FlowVisualizer.tsx   ← Shared animated flow diagram
│   ├── StateMachine.tsx     ← State machine dot animator
│   ├── LogTerminal.tsx      ← Fake terminal log output
│   └── AlarmTable.tsx       ← FM alarm table
├── data/
│   ├── alarmTypes.ts        ← Mock alarm definitions
│   ├── startupSteps.ts      ← Startup sequence từ log thật
│   └── yangPaths.ts         ← YANG path → field mapping
└── CLAUDE.md
```

---

## 5. TRANG INDEX (page.tsx)

### Layout
```
┌────────────────────────────────────────┐
│  CHI NGUYEN QUOC                       │
│  Software Engineer — 5G OAM @ TMA      │
│  C++ · NETCONF/YANG · ZMQ · ConfD      │
│                                        │
│  "These demos visualize what I         │
│   actually build at work"              │
├────────────────────────────────────────┤
│  [Demo 1]         [Demo 2]  [Demo 3]   │
│  CM Flow          FM Alarm  OAM Agent  │
│  Visualizer       Dashboard Startup    │
│  Config flow      Real-time State mach │
│  step by step     fault mgmt + thread  │
└────────────────────────────────────────┘
```

---

## 6. TIMELINE BUILD

| Ngày | Việc cần làm |
|------|-------------|
| **Ngày 1** | Setup Next.js project mới + deploy Vercel + index page + shared components (FlowVisualizer, LogTerminal) |
| **Ngày 2** | Demo 1: CM Flow (layout + XML editor + animation + YANG inspector) |
| **Ngày 3** | Demo 2: FM Dashboard (alarm table + inject flow + timeline chart) |
| **Ngày 4** | Demo 3: OAM Agent (startup sequence + 2 state machines + thread model) |
| **Ngày 5** | Polish: responsive, loading states, hover tooltips, talk point hints |

**Ước tính tổng:** 5 ngày làm việc (có thể 3–4 nếu tập trung)

---

## 7. TALKING POINTS — DÙNG KHI SHOW DEMO

### Khi mở Demo 1 (CM Flow):
> "Đây là CM flow tôi làm hàng ngày — khi NMS gửi NETCONF edit-config, ConfD validate YANG schema rồi gọi subscription callback vào comm_thread của OAM agent. File `oam_agent_config_mapper.cpp` translate YANG path ra struct gNB hiểu được, rồi gửi qua ZMQ."

### Khi mở Demo 2 (FM Dashboard):
> "Khi gNB detect fault, FMServiceR1 gửi alarm qua ZMQ đến OAM_RX thread. OAM agent format data rồi gọi ConfD API report alarm — ConfD lo việc gửi NETCONF notification lên NMS. Tôi có implement thêm alarm types mới theo yêu cầu customer."

### Khi mở Demo 3 (OAM Agent):
> "Đây là startup sequence thật — lấy từ log DU simulator. Hai state machine chạy song song: NF state và NETCONF state. Lý do tách comm_thread và sys_thread là để tránh deadlock do CDB có 2 root path — ME path (3GPP) và gnbvs path (vendor-specific Radisys)."

---

## 8. CHI TIẾT KỸ THUẬT ĐỂ LUÔN NHỚ

### Ports thật
- CU-CP NETCONF: port 2102
- DU NETCONF: port 2100
- ZMQ consumer: tcp://127.0.0.1:10011
- ZMQ producer: tcp://127.0.0.1:10012

### Class names nên nhắc
- `ConfDSubscriber.cpp` — subscription với ConfD
- `Dispatcher.cpp` — routing messages CM/PM/FM
- `FMServiceR1.cpp` — Fault Management
- `CMService.cpp` — Configuration Management
- `OamNFStateMachine.cpp` — NF connection state
- `OamNetconfStateMachine.cpp` — NETCONF connection state
- `DUFunctionAttributeMapper.cpp` — YANG → internal format
- `MqIngress/MqEgress/MqProxy.cpp` — ZMQ handling

### Message types
- `OAM_GNB_CONFIG_REQ` — config message từ OAM Agent xuống gNB
- `FM_ALARM_IND` — alarm indication từ gNB lên OAM Agent

### MQ Topics (từ log thật)
- `GENERIC_PM_SVC`
- `FM_SERVICE`
- `CM_NODAL_MANAGER_TOPIC`

### CDB Path
- ME path: `/3gpp-common-managed-element:ManagedElement/...`
- gnbvs path: `/gnb-vs-config:gnbVsConfig/...`

---

## 9. KHI NÀO DÙNG DEMO NÀY

| Tình huống | Demo nên show |
|------------|--------------|
| Hỏi "Em làm gì trong project?" | Demo 1 — CM Flow (dễ hiểu nhất) |
| Hỏi về fault management | Demo 2 — FM Dashboard |
| Hỏi về threading model / architecture | Demo 3 — OAM Agent |
| Hỏi "Code của em chạy ở đâu?" | Demo 3 → chỉ vào các node gNB |
| System design question | Demo 1 → mở rộng lên whiteboard |

---

## 10. LINK KHI HOÀN THÀNH

- **Demo site:** `https://oam-demo.vercel.app` *(cần tạo)*
- **GitHub repo:** `https://github.com/nqchi/oam-interview-demo` *(cần tạo)*
- **Portfolio:** `https://portfolio.vercel.app` *(đã có)*

---

*Tài liệu này kết hợp từ: INTERVIEW_PREP_OAM_5G.md + CV_ChiNguyenQuoc.pdf + log thật từ project.*  
*Cập nhật lần cuối: 2026-06-04*
