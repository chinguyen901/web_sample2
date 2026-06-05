# 5G OAM Interview Preparation Guide

> Dự án: 5G OAM Platform | Role: C++ Backend Developer | 2023–2025

---

## PHẦN 0 — BẢN ĐỒ FILE: NÊN HỌC GÌ TRƯỚC?

> Toàn bộ thư mục có 50+ file. Bảng dưới phân loại rõ **học cái gì, bỏ cái gì, tại sao**.

---

### TIER 1 — Học ngay (Core, bắt buộc)

| File | Loại | Học được gì |
|------|------|-------------|
| [OAM.txt](OAM.txt) | Ghi chú nội bộ | Threading model, folder structure, code walkthrough — bản chất của OAM agent |
| [LogDUSim.txt](LogDUSim.txt) | Log thật | Toàn bộ startup sequence thực tế, tên module, class, MQ topics, state machine |
| [FM alarm/FM_Get_Alarm_List.png](FM%20alarm/FM_Get_Alarm_List.png) | Diagram | Flow đầy đủ khi get alarm list từ NMS |
| [FM alarm/Fow_Clear alarm and notify.png](FM%20alarm/Fow_Clear%20alarm%20and%20notify.png) | Diagram | Flow khi clear alarm + notify NMS |
| [Sequence flow/code_flow-new.png](Sequence%20flow/code_flow-new.png) | Diagram | Code flow diagram tổng quan của OAM agent |
| [Sequence flow/ConfD.pptx](Sequence%20flow/ConfD.pptx) | Presentation | Sequence diagrams chi tiết giữa ConfD ↔ OAM Agent |
| [Sequence flow/image_2023_10_10T02_53_03_205Z.png](Sequence%20flow/image_2023_10_10T02_53_03_205Z.png) | Diagram | Sequence flow thực tế |
| [Sequence flow/image_2023_10_12T13_05_05_433Z.png](Sequence%20flow/image_2023_10_12T13_05_05_433Z.png) | Diagram | Sequence flow thực tế |
| [Sequence flow/image_2023_10_12T13_06_49_807Z.png](Sequence%20flow/image_2023_10_12T13_06_49_807Z.png) | Diagram | Sequence flow thực tế |
| [OAM_Doc/Trillium_5G_NR_Solution_OAM_Guide_R2.4.0_v1.pdf](OAM_Doc/Trillium_5G_NR_Solution_OAM_Guide_R2.4.0_v1.pdf) | PDF chính thức | Official OAM guide của Radisys platform — đây là document chuẩn nhất cho project |
| [04 Fault Management HLD.pdf](04%20Fault%20Management%20%20HLD.pdf) | PDF HLD | High Level Design của FM — thiết kế chi tiết fault management |

---

### TIER 2 — Nên học (Supporting knowledge)

| File | Loại | Học được gì |
|------|------|-------------|
| [build run real binary.txt](build%20run%20real%20binary.txt) | Script ghi chú | Toàn bộ workflow build + deploy thực tế: CU-CP, CU-UP, DU — hiểu được mình làm gì hàng ngày |
| [Process work OAM.txt](Process%20work%20OAM.txt) | Script ghi chú | Build container + run simulator + push config qua NETCONF |
| [Step Component Tests.txt](Step%20Component%20Tests.txt) | Script ghi chú | Setup và chạy component tests, YANG update workflow |
| [GTEST.txt](GTEST.txt) | Ghi chú | GTest/GMock techniques — AAA, Mocking, Stubbing |
| [5G/5G Architecture Overview - v1.0.pdf](5G/5G%20Architecture%20Overview%20-%20v1.0.pdf) | PDF | Big picture 5G architecture — CU/DU split, interfaces |
| [5G/5G_Overview.pdf](5G/5G_Overview.pdf) | PDF | 5G concepts tổng quan — network slicing, NR, etc. |
| [O-RAN_5G_Specification/O-RAN.WG1.OAM-Architecture-v03.00.pdf](O-RAN_5G_Specification/O-RAN.WG1.OAM-Architecture-v03.00.pdf) | Spec chính thức | O-RAN OAM Architecture spec — tiêu chuẩn mà project tuân theo |
| [FM Radisys Evaluation.pdf](FM%20Radisys%20Evaluation.pdf) | PDF | FM evaluation của Radisys — cách họ implement FM |
| [5G Overall Architecture.pptx](5G%20Overall%20Architecture.pptx) | Presentation | Visual overview 5G architecture — dùng để present |
| [OAM_Doc/Trillium_5G_NR_CU_Solution_Description_Guide_R2.4.0_v1.pdf](OAM_Doc/Trillium_5G_NR_CU_Solution_Description_Guide_R2.4.0_v1.pdf) | PDF | CU platform description — hiểu platform mình làm trên đó |
| [OAM_Doc/C_CPP.zip](OAM_Doc/C_CPP.zip) | Source code | **Extract ra** — chứa code C++ thực tế: oam_cu.cpp, oam_cucp.cpp, oam_agent_confd.cpp |

---

### TIER 3 — Tham khảo khi cần (Reference)

| File | Loại | Dùng khi nào |
|------|------|--------------|
| [5G/5G RAN.pdf](5G/5G%20RAN.pdf) | PDF | Khi bị hỏi sâu về RAN architecture, F1/E1 interface |
| [5G/O-RAN.pdf](5G/O-RAN.pdf) | PDF | Khi bị hỏi về O-RAN, open interfaces |
| [O-RAN_5G_Specification/O-RAN.WG1.O-RAN-Architecture-Description-v02.00.pdf](O-RAN_5G_Specification/O-RAN.WG1.O-RAN-Architecture-Description-v02.00.pdf) | Spec | Khi cần cite chuẩn O-RAN architecture |
| [OAM_Doc/Trillium_5G_NR_Solution_Functional_Specification_R2.4.0_v1.pdf](OAM_Doc/Trillium_5G_NR_Solution_Functional_Specification_R2.4.0_v1.pdf) | Spec | Functional spec chi tiết — nếu bị hỏi deep về feature |
| [OAM_Doc/Trillium_5G_NR_CU_Solution_User_Guide_R2.4.0_v1.pdf](OAM_Doc/Trillium_5G_NR_CU_Solution_User_Guide_R2.4.0_v1.pdf) | User guide | Hướng dẫn sử dụng platform — deploy, config |
| [5G RAN.pptx](5G%20RAN.pptx) | Presentation | Visual RAN concepts |
| [TMA_SWI-5G New Radio(NR)_Knowledge Sharing.pptx](TMA_SWI-5G%20New%20Radio%28NR%29_Knowledge%20Sharing.pptx) | Presentation | 5G NR knowledge sharing từ team |
| [node_simulator.txt](node_simulator.txt) | Script | Cách build và run OAM node simulator |
| [Step_CU.txt](Step_CU.txt) | Script | Step-by-step build CU (tóm tắt của build run real binary.txt) |
| [New_Hire_Training.xlsx](New_Hire_Training.xlsx) | Excel | Onboarding checklist — có thể có thông tin về domain |
| [Traning C++ 5G.xlsx](Traning%20C%2B%2B%205G.xlsx) | Excel | C++ training materials |
| [5G/Session5_5G_Identifiers.pdf](5G/Session5_5G_Identifiers.pdf) | PDF | 5G identifiers (IMSI, SUPI, etc.) — nếu bị hỏi về identity |
| [Overview O-RAN 5G.mp4](Overview%20O-RAN%205G.mp4) | Video | Xem khi muốn visual overview O-RAN (không cần đọc) |

---

### TIER 4 — Bỏ qua (Không cần cho interview)

| File | Lý do bỏ |
|------|----------|
| `Restart REDHAT_85.txt` | OS-level procedure, không liên quan interview |
| `plane 29.3.txt` | Python notes linh tinh + ticket notes cũ |
| `Step_merge main_re-run piline.txt` | Git workflow đã biết rồi |
| `Step_container_OAM_AnhPhuc.txt` | Container setup procedure, trùng với các file khác |
| `node_simulator_update.txt` | Update notes cũ |
| `OAM_Doc/Trillium_5G_NR_Solution_Release_Notes_R2.4.0_v1.pdf` | Release notes — bug fix list, không học được gì |
| `5G/Session7_5G_Channel.pdf` | Quá sâu về physical layer, không liên quan OAM |
| `5G/TMA_5G_MultiAccessMethod.pdf` | Radio access methods — không liên quan OAM |
| `Tasks.zip`, `TMA-Dell Head Up.zip`, `Training_by_KhoaLe_USC.zip` | Archive cũ — check nếu tò mò, không bắt buộc |
| `picturemessage_*.png` | Screenshots chat — không có cấu trúc rõ ràng |
| `Flat module.png`, `image_2023_10_09T03_05_57_904Z.png` | Unclear context |
| `Step ticket.txt` | Git workflow cơ bản, đã biết |
| `Sequence flow/F.Y.I.jpeg` | Không rõ nội dung |
| `5G/OIP.jpg` | Image không rõ |

---

### Thứ tự học đề xuất (Learning Path)

```
Ngày 1 — Big Picture
    1. OAM.txt (15 phút)
    2. 5G Architecture Overview - v1.0.pdf (30 phút — skim)
    3. LogDUSim.txt (20 phút — hiểu startup sequence)

Ngày 2 — OAM Deep Dive
    4. Trillium_5G_NR_Solution_OAM_Guide_R2.4.0_v1.pdf (1 tiếng — focus FM/PM/CM chapters)
    5. 04 Fault Management HLD.pdf (30 phút)
    6. FM alarm diagrams (2 file PNG)

Ngày 3 — Flow & Code
    7. Sequence flow diagrams (4 file PNG + ConfD.pptx)
    8. build run real binary.txt (hiểu workflow)
    9. Extract C_CPP.zip → đọc oam_agent_confd.cpp, oam_agent_config_mapper.cpp

Ngày 4 — Spec & Standard
    10. O-RAN OAM Architecture spec (skim — focus OAM interfaces)
    11. FM Radisys Evaluation.pdf

Ngày 5 — Review & Mock
    12. Ôn lại toàn bộ INTERVIEW_PREP_OAM_5G.md
    13. Mock phỏng vấn (Phần 7)
```

---

### Key Insight từ LogDUSim.txt (File log thật)

File log này tiết lộ rất nhiều thứ bạn cần biết để nói trong phỏng vấn:

**Module names thực tế:**
```
OAM_LIB   → Core library (ConfDSubscriber, Dispatcher, Runner, MqIngress...)
OAM_CM    → Configuration Management (CMService, ConfigNodalManager, DUFunctionAttributeMapper)
OAM_PM    → Performance Management (GenericPmSvc, DefinitionFileReader)
OAM_FM    → Fault Management (FMServiceR1, FmDataWriter, FmAlarmCore)
OAM_APP   → Application layer (Simulator, SimulatedDU, RestServer)
OAM_FILE  → File Management (OamSftpServer)
```

**Startup sequence thực tế (từ log):**
```
1. Init OAM modules (CM, PM, FM adapters)
2. Connect to ConfD (NETCONF server tại port 11000)
3. Connect to MQ (ZMQ: consumerUri:tcp://127.0.0.1:10011, producerUri:tcp://127.0.0.1:10012)
4. Register subscriptions: /ManagedElement, /wg5-delay-management, /hardware, /sync
5. Wait for MQ topics ready (ACK từ: GENERIC_PM_SVC, FM_SERVICE, CM_NODAL_MANAGER_TOPIC...)
6. State machine: INITIALIZE → NF_REGISTRATION → NF_READY
7. NETCONF state: INIT → NETCONF_DISCONNECTED → NETCONF_CONNECTED → NETCONF_READY
8. Config apply flow khi nhận config: CDB_SUB_PREPARE → CDB_SUB_COMMIT → Dispatch → ACK
```

**Real class names để mention trong phỏng vấn:**
- `ConfDSubscriber.cpp` — xử lý subscription với ConfD
- `Dispatcher.cpp` — routing messages đến đúng topic (CM/PM/FM)
- `CMService.cpp` — Configuration Management service
- `FMServiceR1.cpp` — Fault Management service
- `OamNFStateMachine.cpp` — State machine cho Network Function connection
- `OamNetconfStateMachine.cpp` — State machine cho NETCONF connection
- `DUFunctionAttributeMapper.cpp` — Map YANG attributes → internal format
- `MqIngress/MqEgress/MqProxy.cpp` — ZMQ message queue handling

---

## PHẦN 1 — OAM-5G LÀ GÌ? CÁC KHÁI NIỆM CẦN NHỚ

### 1.1 5G Network Architecture — Cấu trúc cơ bản

5G dùng kiến trúc **split RAN** — tách base station thành nhiều phần:

```
Core Network (5GC)
       |
   N2/N3 interface
       |
   gNB (5G Base Station)
   ├── gNB-CU (Central Unit)
   │   ├── gNB-CU-CP  → Control Plane: RRC, PDCP-C
   │   └── gNB-CU-UP  → User Plane: PDCP-U, SDAP
   └── gNB-DU (Distributed Unit) → RLC, MAC, PHY
          |
       Radio Unit (RU)
```

- **F1 interface**: kết nối giữa CU và DU
- **E1 interface**: kết nối giữa CU-CP và CU-UP
- **O-RAN**: Open RAN — tiêu chuẩn mở hóa giao diện này
- **gNB**: next Generation Node B — tên gọi của 5G base station

**Câu trả lời mẫu khi hỏi "Em làm về gì?"**:
> "Em làm về OAM subsystem của gNB (5G base station) — cụ thể là develop và maintain C++ OAM agent chạy trên từng node CU-CP, CU-UP, DU. OAM agent là lớp quản lý kết nối giữa management system bên trên và gNB core bên dưới."

---

### 1.2 OAM là gì?

**OAM = Operations, Administration & Maintenance** — lớp quản lý mạng viễn thông.

| Domain | Viết tắt | Chức năng |
|--------|----------|-----------|
| Fault Management | **FM** | Phát hiện, báo cáo, clear alarm khi có lỗi xảy ra |
| Performance Management | **PM** | Thu thập KPI, tạo PM report (RRC counters, throughput...) |
| Configuration Management | **CM** | Apply/read cấu hình mạng qua NETCONF |
| Software Management | **SM** | Quản lý upgrade firmware/software |

**Câu trả lời mẫu**:
> "OAM là lớp quản lý (management plane) của mạng. Thay vì data plane xử lý traffic của user, OAM xử lý việc vận hành hệ thống: cấu hình node, theo dõi lỗi, đo hiệu suất."

---

### 1.3 Các Protocol & Tool quan trọng

| Tên | Vai trò | Cần nói được |
|-----|---------|-------------|
| **NETCONF** | Network Configuration Protocol — XML-based, RFC 6241 | Giao thức để management system gửi config xuống gNB |
| **YANG** | Data modeling language — RFC 6020 | Định nghĩa schema cho config data (giống JSON Schema) |
| **ConfD** | Configuration Daemon (Cisco) | Implements NETCONF server, lưu config vào CDB |
| **CDB** | Configuration DataBase | Internal database của ConfD |
| **ZMQ** | ZeroMQ message queue | OAM agent dùng để giao tiếp nội bộ với các gNB component |
| **GTest/GMock** | Google Test / Google Mock | Framework viết unit test và integration test |

**Giải thích nhanh NETCONF + YANG**:
> "YANG là ngôn ngữ mô tả cấu trúc data — giống như schema. NETCONF là giao thức dùng YANG để gửi config đó qua XML. Khi management system muốn cấu hình một cell, nó gửi NETCONF edit-config với XML data tuân theo YANG schema. ConfD nhận, validate, rồi notify OAM agent."

---

## PHẦN 2 — ARCHITECTURE & FLOW

### 2.1 Overall Architecture

```
┌─────────────────────────────────────┐
│     OSS / NMS / NodeBow Interface   │  ← Management System
└─────────────────┬───────────────────┘
                  │ NETCONF (port 2100 / 2102)
                  │ XML over SSH
┌─────────────────▼───────────────────┐
│           ConfD Daemon              │  ← NETCONF Server
│    - Validates YANG models          │
│    - Stores config in CDB           │
│    - Handles subscriptions          │
└─────────────────┬───────────────────┘
                  │ Subscription callbacks
                  │
┌─────────────────▼───────────────────┐
│         OAM Agent (C++)             │  ← Lớp em làm
│  ┌──────────────┐ ┌───────────────┐ │
│  │ comm_thread  │ │  sys_thread   │ │
│  │ (subscript.) │ │ (dynamic cfg) │ │
│  └──────────────┘ └───────────────┘ │
│  oam_agent_confd.cpp                │
│  oam_agent_config_mapper.cpp        │
│  oam_agent_intf_hdr.cpp             │
└─────────────────┬───────────────────┘
                  │ ZMQ Message Queue
         ┌────────┴─────────┐
         ▼                  ▼
   ┌──────────┐       ┌──────────┐
   │  gNB-CU  │       │  gNB-DU  │
   │(CP + UP) │       │          │
   └──────────┘       └──────────┘
```

**Ba node riêng biệt**: mỗi node (CU-CP, CU-UP, DU) đều chạy OAM agent riêng với port NETCONF riêng:
- CU-CP: port 2102
- CU-UP: (tương tự)
- DU: port 2100

---

### 2.2 Threading Model

OAM Agent có **2 loại thread chính**:

**Thread 1 — OAM_AGENT + OAM_RX (app level)**
- Khởi tạo ở `app/src/app.main.cpp`
- Start config_thread → tạo threads → link core → `threads->join_timer_manager_thread()`

**Thread 2 — ConfD interaction level**
```
comm_thread  → process message, check subscription, handle subscription callback
sys_thread   → vòng lặp infinite đọc dynamic_config_read
```

**Tại sao cần 2 thread? (câu hỏi hay)**
> "ConfD CDB có 2 root path: `ME` (3GPP standard) và `gnbvs` (vendor-specific config của Radisys). Khi chỉ dùng 1 thread để handle cả 2 path này, xảy ra deadlock vì CDB locking mechanism. Tách thành 2 thread giải quyết vấn đề này: comm_thread xử lý subscription callbacks, sys_thread đọc dynamic config."

---

### 2.3 Configuration Management Flow (CM)

```
NMS gửi NETCONF edit-config (XML)
         │
         ▼
  ConfD validate với YANG schema
         │
         ▼
  ConfD lưu vào CDB
         │ (subscription notification)
         ▼
  OAM Agent comm_thread nhận callback
         │
         ▼
  oam_agent_config_mapper.cpp
  map config → internal struct (OAM_GNB_CONFIG_REQ)
         │
         ▼
  Gửi message qua ZMQ → gNB component
         │
         ▼
  gNB apply config → ACK response
```

**Key message**: `OAM_GNB_CONFIG_REQ` — message chính trong config flow

---

### 2.4 Fault Management Flow (FM)

**Khi có lỗi xảy ra:**
```
gNB component detect fault
         │
         ▼
  Gửi FM alarm message → OAM Agent (qua ZMQ)
         │
         ▼
  OAM Agent format alarm data
         │
         ▼
  Report alarm lên ConfD
         │
         ▼
  ConfD gửi NETCONF notification → NMS
```

**Khi clear alarm:**
```
Fault resolved → gNB gửi clear signal
         │ → OAM Agent clear alarm trong ConfD
         │ → Notify NMS alarm cleared
```

Xem diagram: [FM_Get_Alarm_List.png](FM%20alarm/FM_Get_Alarm_List.png) và [Fow_Clear alarm and notify.png](FM%20alarm/Fow_Clear%20alarm%20and%20notify.png)

---

### 2.5 Performance Management Flow (PM)

```
OAM Agent periodically poll gNB components
         │ (theo measurement interval)
         ▼
  Thu thập counters (VD: RRC.ConEStabAtt.Tot)
         │
         ▼
  Tạo XML PM report file
  <measType p="10001">RRC.ConEStabAtt.Tot</measType>
         │
         ▼
  Upload lên NMS / lưu file system
```

---

### 2.6 Log Files

| File | Nội dung |
|------|----------|
| `boot` | Log khi OAM agent khởi động |
| `cu_cp` | Log runtime sau khi config logging |
| `*.xml` | PM measurement report files |

---

## PHẦN 3 — EM ĐÃ LÀM GÌ TRONG DỰ ÁN

### 3.1 Role của Em

**Title**: C++ Backend Developer — OAM Subsystem  
**Team**: Mobile-Phoenix (Radisys 5G NR platform)  
**Repositories**: CU.git, DU.git, oam-node-simulator.git

**Em làm trực tiếp trên**:
- `liboam/oam_cucp/` — OAM agent cho CU-CP
- `liboam/oam_cuup/` — OAM agent cho CU-UP
- `liboam/oam_cu/` — shared CU OAM code
- Từng folder có: `fm/`, `pm/`, `include/`, `lib/`, `oam_agent_confd/`, `src/`, `test/`

**Key files em đụng nhiều**:
- `oam_agent_confd.cpp` — tương tác trực tiếp với ConfD
- `oam_agent_config_mapper.cpp` — map config paths
- `oam_agent_intf_hdr.cpp` — handle app interface

---

### 3.2 Những gì Em Đã Làm

**1. Implement customer-requested features**
- Implement tính năng mới trong FM/PM/CM theo yêu cầu khách hàng
- Ví dụ: thêm alarm type mới, thêm PM counter mới, update YANG model

**2. Bug fixing & performance optimization**
- Fix các system issue ảnh hưởng đến 5G operations
- Optimize performance cho stable operations

**3. YANG model update**
- Chạy `updateCucpYang.sh`, `updateCuupYang.sh`, `updateDuYang.sh`
- Rebuild ConfD với YANG mới: `make stop; make clean; make all`

**4. Component testing**
- Viết và chạy tests với GTest/GMock
- Chạy parallel: `./gtest-parallel ../target/build/component_tests/oam_component_tests`
- Setup test environment: ConfD instance, OAM node simulator, certs

**5. Ticket workflow**
```
git checkout -b MP-<ticket_id>
# fix code
git commit -m "[MP-xxxxx] description"
git push origin MP-<ticket_id>
# → merge request → pipeline CI/CD (Jenkins) → merge main
```

**6. Deployment & debugging**
- Dùng Docker container cho build environment
- Build binary: `./compile_cu.sh -t cp -o -z`
- Push config qua NETCONF: `python3 /opt/confd/bin/netconf-console --port 2102 config.xml`

---

### 3.3 Cách Em Giải Quyết Một Issue (STAR Format)

**Issue mẫu — Port conflict khi start simulator**

**Situation**: Khi chạy OAM simulator (DU/CU), gặp lỗi build/start failed do trùng port.

**Task**: Cần identify và resolve conflict, đảm bảo simulator start được để chạy test.

**Action**:
```bash
# Step 1: List các process đang chạy
ps -ef

# Step 2: Identify PID của process chiếm port
# Step 3: Kill process cũ
kill -9 <PID>

# Step 4: Restart service
make stop; make clean; make all
make start
```

**Result**: Simulator start thành công, tiếp tục được NETCONF config flow.

**Lesson learned**: Document bước cleanup vào runbook, thêm port check vào startup script.

---

**Issue mẫu — Pipeline test fail sau khi rebase main**

**Situation**: Sau khi rebase main, pipeline CI/CD fail ở component tests.

**Task**: Xác định root cause, fix và re-run pipeline.

**Action**:
```bash
git checkout main; git pull
git checkout MP-<ticket>
git rebase main
# Resolve conflicts nếu có
git add <conflict files>
git commit -m "resolve merge conflict"
git push origin MP-<ticket> -f
# Trigger re-run pipeline trên Jenkins
```

**Result**: Pipeline pass, ticket được approve merge.

---

### 3.4 Câu Hỏi Phỏng Vấn Thường Gặp & Cách Trả Lời

**Q: "Em giải thích NETCONF/YANG cho tôi nghe?"**
> "YANG là schema language — nó define structure của config data. NETCONF là protocol dùng XML để transport data đó qua SSH. Trong project của em, management system gửi NETCONF edit-config với XML body theo YANG schema. ConfD nhận, validate, lưu vào CDB, rồi notify OAM agent để apply xuống gNB."

**Q: "Threading model của OAM agent như thế nào?"**
> "OAM agent có 2 nhóm thread chính. Ở app level: OAM_AGENT thread và OAM_RX thread. Ở ConfD interaction level: comm_thread xử lý subscription callbacks, sys_thread chạy infinite loop đọc dynamic config. Lý do tách 2 thread ở level ConfD là tránh deadlock do CDB có 2 root path: ME (3GPP) và gnbvs (vendor-specific)."

**Q: "Em đã handle fault management như thế nào?"**
> "Khi gNB component detect fault, nó gửi alarm message qua ZMQ đến OAM agent. OAM agent format data và report alarm lên ConfD. ConfD gửi NETCONF notification lên NMS. Khi fault clear, OAM agent gửi clear signal và NMS được notify. Em có làm việc với flow này để implement thêm alarm types theo yêu cầu customer."

**Q: "Em dùng GTest như thế nào trong project?"**
> "Em dùng Arrange-Act-Assert pattern: setup test data, gọi function cần test, assert kết quả. Với external dependencies như ZMQ hay ConfD, em dùng GMock để mock interface — tránh phụ thuộc vào real system khi test unit. Để chạy integration tests, em dùng OAM node simulator với ConfD instance thật."

**Q: "Docker dùng trong project như thế nào?"**
> "Docker được dùng cho build environment, không phải production deployment. Mỗi developer create container từ base image của team. Build script `builder.shell.sh` tạo container với đầy đủ toolchain, tránh 'works on my machine' problem. Build xong deploy binary ra target system."

**Q: "Collaboration với QA/DevOps như thế nào?"**
> "Em làm việc với QA team để cover test cases cho features mới — viết component tests và cung cấp test data. Với DevOps, chủ yếu là pipeline Jenkins: mỗi PR cần pass build + component tests trước khi merge. Gặp pipeline fail thì coordinate với DevOps để check build environment."

---

## PHẦN 4 — BẢN ĐỒ HỌC TẬP (Learning Roadmap)

### Cần nắm chắc (Core):
- [ ] Giải thích gNB split architecture (CU/DU)
- [ ] OAM 4 domains: FM, PM, CM, SM
- [ ] NETCONF = protocol, YANG = schema
- [ ] ConfD làm gì (NETCONF server + CDB)
- [ ] Threading model: 2 thread + lý do

### Nên biết (Good to have):
- [ ] F1 / E1 interface là gì
- [ ] O-RAN vs traditional RAN
- [ ] ZMQ pattern (pub/sub vs req/rep)
- [ ] GTest AAA pattern + GMock

### Nếu hỏi sâu:
- [ ] NETCONF operations: get, get-config, edit-config, lock, unlock
- [ ] YANG data types: container, list, leaf, leaf-list
- [ ] CDB 2 root path: ME (3GPP) vs gnbvs
- [ ] PM counters: RRC.ConEStabAtt.Tot và các KPIs 5G

---

## PHẦN 5 — KỸ THUẬT TRÌNH BÀY

### Khi nói về dự án (elevator pitch ~30s):
> "Em làm 2 năm trong team phát triển 5G gNB OAM system — đây là hệ thống quản lý và vận hành base station 5G. Tech stack chính là C++, NETCONF/YANG, ConfD, Docker và PostgreSQL. Em chủ yếu phát triển OAM agent — lớp middleware kết nối management system bên trên với các gNB component bên dưới, implement các tính năng FM, PM, CM theo yêu cầu khách hàng."

### Khi được hỏi về challenge lớn nhất:
> "Challenge lớn nhất là hiểu được toàn bộ data flow trong hệ thống phân tán — từ management system qua NETCONF, qua ConfD, qua OAM agent, xuống đến gNB component. Debugging khi có issue phải trace qua nhiều layer: check ConfD logs, OAM agent logs, ZMQ messages. Em học được cách systematic trace issue từng layer và đọc packet/message để xác định chính xác lỗi ở đâu."

---

*Guide này được xây dựng từ tài liệu thực tế của project: OAM.txt, Process work OAM.txt, Step Component Tests.txt, cùng các diagram flow.*

---

## PHẦN 6 — DEEP DIVE: ARCHITECTURE CHI TIẾT

### 6.1 Hiểu từng Layer — Tại sao nó tồn tại?

#### Layer 1: Management System (NMS / OSS / NodeBow)

```
NMS = Network Management System
OSS = Operations Support System
NodeBow = tên internal của management interface trong project
```

**NMS làm gì?**
- Đây là "bộ não" điều khiển toàn bộ mạng từ xa
- Operator (kỹ sư mạng) ngồi ở trung tâm điều hành, dùng NMS để:
  - Cấu hình cell parameters (tần số, băng thông, power)
  - Xem alarm khi có lỗi xảy ra
  - Xem KPI (performance counters)
  - Upgrade software

**Tại sao dùng NETCONF thay vì REST API?**
- NETCONF là chuẩn viễn thông (RFC 6241) — vendor-agnostic
- Hỗ trợ transaction (lock/unlock), rollback
- Có validation tích hợp với YANG
- Chuẩn O-RAN bắt buộc dùng NETCONF/YANG

---

#### Layer 2: ConfD — NETCONF Server

**ConfD là gì chính xác?**

ConfD (Configuration Daemon) do Cisco/Tail-f phát triển. Nó là một **framework** cung cấp sẵn:

```
ConfD framework cung cấp:
├── NETCONF server (tự handle SSH, XML parsing)
├── CDB (Configuration DataBase) — lưu config
├── Subscription engine — notify khi data thay đổi
├── YANG validator — validate config theo schema
└── CLI engine (optional)
```

**Flow bên trong ConfD:**

```
Client gửi NETCONF edit-config
         │
         ▼
ConfD parse XML → map vào YANG tree
         │
         ▼
Validate: kiểm tra type, range, mandatory fields
         │ (fail → trả error ngay)
         ▼
Lock CDB → write config vào CDB → unlock CDB
         │
         ▼
Notify tất cả subscribers đang watch path này
         │
         ▼
Trả NETCONF OK response cho client
```

**CDB là gì?**

CDB = Configuration DataBase — in-memory + persistent store của ConfD:

```
CDB có 2 datastores:
├── running  → config đang active (current state)
└── startup  → config khi boot (persisted to disk)

Trong project này còn có:
├── ME path      → /3gpp-common-managed-element:ManagedElement/...
└── gnbvs path   → /gnb-vs-config:gnbVsConfig/...
```

**Tại sao có 2 root path ME và gnbvs?**

Đây là điểm kỹ thuật quan trọng nhất trong project:

```
3GPP standard định nghĩa YANG model với root = ME
    └── Đây là path mà NMS biết và gửi config theo

Radisys/Trillium có vendor-specific config (gnbvs)
    └── Đây là config mà gNB binary thực sự cần

OAM agent phải bridge 2 thế giới này:
    NMS config (ME path) → translate → gNB config (gnbvs path)
```

**Subscription mechanism hoạt động như thế nào?**

```c++
// Pseudo-code OAM agent đăng ký subscription
cdb_subscribe(cdb_session, priority, flags, &spoint,
              "/3gpp-common-managed-element:ManagedElement/...");

// Khi ConfD detect thay đổi ở path này:
// → gọi callback function trong comm_thread của OAM agent
```

---

#### Layer 3: OAM Agent (C++) — Em làm ở đây

**OAM Agent là middleware** — nó không xử lý user traffic, chỉ xử lý management messages.

**Startup sequence:**

```
1. app.main.cpp: đọc config file (port, log level, etc.)
2. Init các module (FM, PM, CM)
3. Connect to ConfD (open CDB session)
4. Register subscriptions cho các YANG paths cần watch
5. Start threads:
   - OAM_AGENT thread (main logic)
   - OAM_RX thread (nhận messages từ gNB)
   - comm_thread (handle ConfD callbacks)
   - sys_thread (periodic dynamic config read)
6. Join threads → chạy forever
```

**Threading model — giải thích sâu:**

```
Vấn đề: ConfD CDB dùng session-based locking.

Scenario gây deadlock nếu chỉ dùng 1 thread:

Thread A đang hold lock cho CDB session #1 (đọc ME path)
    → ConfD gửi callback notification
    → callback cần acquire CDB session #2 (đọc gnbvs path)
    → DEADLOCK: Thread A đang chờ chính nó release

Solution: 2 thread riêng biệt với 2 CDB session riêng:
    comm_thread → session cho subscription callbacks
    sys_thread  → session cho dynamic config reads
    Hai session độc lập → không deadlock
```

**File `oam_agent_config_mapper.cpp` làm gì?**

Đây là file "translator":

```
Input:  YANG path từ ConfD (chuẩn 3GPP ME path)
           VD: /ManagedElement/GNBCUCPFunction/NRCellCU/nRCellIdentity

Output: Internal struct gNB hiểu được
           VD: OAM_GNB_CONFIG_REQ { cell_id = 123, ... }

Logic: path-based mapping
    switch(yang_path) {
        case ME_CELL_ID_PATH: req.cell_id = value; break;
        case ME_FREQ_PATH:    req.arfcn = value; break;
        ...
    }
```

**File `oam_agent_intf_hdr.cpp` làm gì?**

Đây là "router" — xác định message đến từ đâu và đi đâu:

```
Nhìn vào interface header của message:
├── Nếu từ ConfD → forward xuống gNB (CM/FM operation)
├── Nếu từ gNB   → forward lên ConfD (alarm/PM report)
└── Nếu internal → handle locally
```

---

#### Layer 4: ZMQ Message Queue

**ZMQ là gì?**

ZeroMQ = lightweight messaging library. Trong project dùng như IPC (Inter-Process Communication) giữa OAM agent và gNB processes.

```
Các pattern ZMQ có thể dùng:
├── REQ/REP  → Request/Reply (synchronous)
├── PUB/SUB  → Publish/Subscribe (one-to-many)
├── PUSH/PULL → Pipeline (one-directional)
└── DEALER/ROUTER → async req/rep

Project này dùng: message-based IPC
OAM Agent ↔ gNB-CU-CP  (qua ZMQ socket)
OAM Agent ↔ gNB-CU-UP  (qua ZMQ socket khác)
OAM Agent ↔ gNB-DU     (qua ZMQ socket khác)
```

**Message format:**

```
Mỗi message có header + payload:
├── Header: message type (OAM_GNB_CONFIG_REQ, FM_ALARM_IND, etc.)
├── Sequence number
└── Payload: actual data (config struct, alarm data, etc.)
```

---

#### Layer 5: gNB Components

```
gNB-CU-CP handles:
├── RRC (Radio Resource Control) — điều khiển kết nối UE
├── PDCP Control Plane
└── F1-C interface với DU

gNB-CU-UP handles:
├── PDCP User Plane — encrypt/decrypt user data
├── SDAP — QoS mapping
└── F1-U interface với DU

gNB-DU handles:
├── RLC (Radio Link Control)
├── MAC (Medium Access Control)
├── PHY (Physical Layer)
└── Radio interface với UE (điện thoại)
```

---

### 6.2 Sequence Diagram Đầy Đủ — CM Flow

```
NMS         ConfD        OAM Agent      gNB-CU-CP
 │             │         comm_thread          │
 │──edit-config──────>│                       │
 │             │ validate YANG                │
 │             │ write CDB                    │
 │             │──subscription notification──>│
 │             │         │ parse path         │
 │             │         │ config_mapper      │
 │             │         │ build struct       │
 │             │         │──ZMQ msg──>        │
 │             │         │               apply config
 │             │         │<──ACK─────────     │
 │             │<──callback OK───────────│
 │<──NETCONF OK─────────│                │
```

---

### 6.3 Sequence Diagram — FM Alarm Flow

```
gNB-CU-CP           OAM Agent          ConfD               NMS
    │               OAM_RX               │                  │
    │──ZMQ alarm msg──>│                 │                  │
    │                  │ format alarm    │                  │
    │                  │──alarm report──>│                  │
    │                  │                 │ store alarm      │
    │                  │                 │──NETCONF notif──>│
    │                  │                 │            NMS shows alarm
    │                  │                 │                  │
[fault clears]         │                 │                  │
    │──ZMQ clear msg──>│                 │                  │
    │                  │──clear alarm───>│                  │
    │                  │                 │──NETCONF notif──>│
    │                  │                 │            alarm cleared
```

---

### 6.4 NETCONF Operations — Cần nhớ

| Operation | Mục đích | Dùng khi nào |
|-----------|----------|-------------|
| `<get>` | Đọc running config + state | Query current state |
| `<get-config>` | Đọc config từ datastore | Query stored config |
| `<edit-config>` | Thay đổi config | NMS gửi config xuống |
| `<lock>` | Lock datastore | Trước khi edit để tránh conflict |
| `<unlock>` | Unlock | Sau khi edit xong |
| `<validate>` | Validate config | Kiểm tra trước khi apply |
| `<commit>` | Apply candidate → running | Confirm changes |
| `<close-session>` | Đóng NETCONF session | Cleanup |

---

### 6.5 YANG Data Types — Cần nhớ

```yang
module example-gnb {
    container ManagedElement {          // nhóm data (như struct)
        leaf gnbId {                    // single value
            type uint32;
            mandatory true;
        }
        list NRCellCU {                 // array of items
            key "cellLocalId";          // primary key
            leaf cellLocalId {
                type uint16;
            }
            leaf nRCellIdentity {
                type uint36;
                config true;            // có thể configure
            }
            leaf operationalState {
                type enumeration {
                    enum ENABLED;
                    enum DISABLED;
                }
                config false;           // read-only (state data)
            }
        }
    }
}
```

---

## PHẦN 7 — MOCK PHỎNG VẤN ĐẦY ĐỦ

> Format: **[Câu hỏi]** → **[Câu trả lời model]** → **[Giải thích tại sao trả lời vậy]**

---

### ROUND 1 — Project Overview

---

**Q1: "Anh/Chị hãy giới thiệu về dự án gần nhất của em."**

**Trả lời:**
> "Em vừa kết thúc 2 năm tại một team phát triển 5G base station — cụ thể là OAM subsystem cho gNB (5G base station) dựa trên platform Radisys Trillium.
>
> OAM là lớp management của hệ thống — nó xử lý việc cấu hình node, giám sát lỗi, và đo hiệu suất mạng. Em phụ trách develop và maintain C++ OAM agent — đây là middleware kết nối giữa management system bên trên (qua NETCONF/YANG) với gNB components bên dưới (CU-CP, CU-UP, DU) qua ZMQ message queue.
>
> Tech stack chính của em là C++, NETCONF/YANG, ConfD, Docker, GTest/GMock, và Jenkins cho CI/CD."

**Tại sao trả lời vậy:**
- Giới thiệu context (5G, gNB) trước → người nghe biết đây là telecom domain
- Explain OAM ngắn gọn → không assume người nghe biết OAM
- Nêu rõ role của mình (middleware, OAM agent) → specific, không generic
- Kết bằng tech stack → dễ follow-up

---

**Q2: "Scale của hệ thống này như thế nào? Phục vụ bao nhiêu user?"**

**Trả lời:**
> "Đây là hệ thống real-time cho 5G base station nên latency requirements rất strict — OAM agent phải xử lý alarm và config trong milliseconds. Về scale, một gNB thường phục vụ hàng trăm đến hàng nghìn UE (user equipment / điện thoại) đồng thời.
>
> OAM layer không trực tiếp xử lý user traffic, nhưng nó ảnh hưởng critical: nếu OAM agent crash hoặc config sai, toàn bộ cell bị outage. Vì vậy stability và correctness là priority số 1 — đó là lý do có component testing nghiêm ngặt và thread pinning để đảm bảo real-time behavior."

---

**Q3: "Team size bao nhiêu người? Em collaborate như thế nào?"**

**Trả lời:**
> "Team Mobile-Phoenix gồm nhiều sub-team: dev, QA, DevOps, và network engineers. Em làm việc trực tiếp với:
>
> - **Dev team**: code review qua GitLab merge requests, branch theo ticket MP-xxxxx
> - **QA team**: cung cấp test cases cho features mới, fix bugs QA report
> - **DevOps**: coordinate khi pipeline Jenkins fail, check build environment
> - **Network team**: clarify requirements khi cần hiểu sâu về 5G spec
>
> Workflow: pick ticket từ Jira → branch → code → push → pipeline pass → merge request → review → merge."

---

### ROUND 2 — Architecture Deep Dive

---

**Q4: "Em describe architecture của OAM system đi."**

**Trả lời:**
> "Hệ thống có 4 layer chính:
>
> **Layer 1 — Management System**: NMS (Network Management System) là nơi operator cấu hình mạng. Nó giao tiếp với gNB qua NETCONF protocol — XML-based, chạy over SSH.
>
> **Layer 2 — ConfD**: NETCONF server chạy trên mỗi gNB node. Nó nhận config từ NMS, validate theo YANG schema, lưu vào CDB (Configuration DataBase), rồi notify OAM agent qua subscription mechanism.
>
> **Layer 3 — OAM Agent (em làm ở đây)**: C++ process đóng vai trò middleware. Nó nhận notification từ ConfD, translate config từ 3GPP format sang internal format, rồi gửi xuống gNB component qua ZMQ.
>
> **Layer 4 — gNB Components**: CU-CP xử lý control plane (RRC), CU-UP xử lý user plane, DU xử lý radio layers. Mỗi component nhận config từ OAM agent và apply.
>
> Mỗi node (CU-CP, CU-UP, DU) chạy OAM agent riêng — không share, độc lập hoàn toàn."

**Mẹo**: Vẽ sơ đồ lên bảng trắng khi nói — interviewer rất thích.

---

**Q5: "Tại sao dùng NETCONF thay vì REST API?"**

**Trả lời:**
> "Có vài lý do:
>
> **1. Chuẩn ngành viễn thông**: O-RAN Alliance và 3GPP mandates NETCONF/YANG. Nếu dùng REST thì không interoperable với các NMS của vendor khác.
>
> **2. Transaction support**: NETCONF có lock/unlock/commit/rollback — đảm bảo atomic config change. REST API không có built-in transaction.
>
> **3. Schema validation**: YANG model tích hợp chặt với NETCONF — ConfD tự validate trước khi apply. REST thường phải implement validation riêng.
>
> **4. Subscription/notification**: NETCONF có notification mechanism để server push alarm lên client. REST phải polling hoặc implement webhook riêng."

---

**Q6: "Giải thích threading model của OAM agent."**

**Trả lời:**
> "OAM agent dùng multi-thread architecture với mỗi thread có responsibility riêng:
>
> **OAM_AGENT thread**: Main coordination thread, xử lý core logic.
>
> **OAM_RX thread**: Dedicated để nhận messages từ gNB components qua ZMQ — tách riêng để không block main thread.
>
> **comm_thread**: Handle subscription callbacks từ ConfD. Khi NMS gửi config, ConfD gọi callback trên thread này. Nó process message và forward xuống gNB.
>
> **sys_thread**: Infinite loop đọc dynamic config từ CDB — các config thay đổi không qua subscription mechanism.
>
> Lý do tách comm_thread và sys_thread: ConfD CDB có 2 root path — ME path (3GPP standard) và gnbvs path (Radisys vendor-specific). Nếu dùng 1 thread cho cả 2 path, CDB session locking gây deadlock — thread đang hold lock A và cần lock B, nhưng B đang chờ A. Tách ra 2 session độc lập giải quyết hoàn toàn vấn đề này.
>
> Ngoài ra, mỗi thread được pin vào specific CPU core để đảm bảo real-time latency — tránh context switching bất ngờ."

---

**Q7: "YANG model update workflow như thế nào?"**

**Trả lời:**
> "Khi cần thêm config parameter mới hoặc thay đổi schema:
>
> 1. Update file YANG (.yang) — define field mới, type, constraints
> 2. Chạy update script: `./updateCucpYang.sh` (hoặc DU, CU-UP tương ứng)
> 3. Rebuild ConfD với YANG mới: `make stop; make clean; make all`
> 4. Restart ConfD: `make start`
> 5. Update OAM agent code — thêm path mới vào `oam_agent_config_mapper.cpp`
> 6. Chạy component tests để verify end-to-end
>
> Quan trọng: YANG changes phải backward-compatible — nếu thêm mandatory field mới mà NMS cũ không gửi, config sẽ fail validation. Thường thêm field với default value hoặc optional."

---

### ROUND 3 — Technical Deep Dive (C++)

---

**Q8: "Em xử lý concurrency trong C++ như thế nào? Có race condition không?"**

**Trả lời:**
> "Trong OAM agent, mỗi thread có responsibility rõ ràng và minimize shared state:
>
> - **comm_thread** và **sys_thread** operate trên separate CDB sessions → không share ConfD state
> - Messages giữa threads đi qua **message queue** (thread-safe) thay vì shared memory
> - Khi cần shared data structure, dùng **mutex** hoặc **atomic** variables
>
> Với ZMQ: ZMQ sockets không thread-safe, nên mỗi thread sở hữu socket của mình — không share socket giữa threads.
>
> Pattern chính: Actor model — mỗi thread là một actor xử lý message queue của nó, minimize locking."

---

**Q9: "Em dùng smart pointer hay raw pointer trong project?"**

**Trả lời:**
> "Project này là legacy C++ codebase (codebase lớn, đã có trước) nên mix cả hai. Nhưng với code mới em viết, ưu tiên:
>
> - `std::unique_ptr` cho ownership rõ ràng — khi object có 1 owner duy nhất
> - `std::shared_ptr` khi cần share ownership (VD: config struct được read bởi nhiều module)
> - Raw pointer chỉ dùng cho non-owning references
>
> Trong viễn thông, memory leak là critical issue — nếu process chạy 24/7 mà leak, sau vài ngày sẽ crash. Smart pointer giúp tránh vấn đề này."

---

**Q10: "GTest/GMock dùng như thế nào? Cho ví dụ cụ thể."**

**Trả lời:**
> "Em dùng pattern AAA — Arrange, Act, Assert:
>
> ```cpp
> // Test: khi nhận alarm từ gNB, OAM agent phải forward lên ConfD
> TEST_F(OamAgentFmTest, ForwardAlarmToConfd) {
>     // Arrange
>     MockConfdInterface mock_confd;
>     OamFmHandler handler(&mock_confd);
>     FmAlarmData alarm = buildTestAlarm(ALARM_TYPE_LINK_DOWN, SEVERITY_CRITICAL);
>
>     // Expect: ConfD interface phải được gọi 1 lần với alarm data đúng
>     EXPECT_CALL(mock_confd, reportAlarm(MatchesAlarm(alarm)))
>         .Times(1);
>
>     // Act
>     handler.processAlarmFromGnb(alarm);
>
>     // Assert: handled bởi EXPECT_CALL ở trên
> }
> ```
>
> Mock rất quan trọng vì trong component test, không muốn start ConfD thật — quá phức tạp và chậm. Mock cho phép test logic của OAM agent độc lập.
>
> Ngoài ra còn có integration test dùng OAM node simulator — simulator giả lập gNB behavior để test end-to-end flow thật."

---

### ROUND 4 — Problem Solving

---

**Q11: "Kể về một bug khó nhất em từng fix."**

**Trả lời (STAR format):**
> "**Situation**: Có một bug production — đôi khi sau khi config cell parameters, cell không apply config đúng, nhưng không có error log nào rõ ràng. Bug intermittent — không reproduce được 100%.
>
> **Task**: Investigate và fix để cell configuration reliable.
>
> **Action**: Em bắt đầu bằng cách add detailed logging ở từng bước của config flow — từ khi ConfD nhận config, qua OAM agent, đến khi gNB apply. Sau khi reproduce được với logging, em thấy pattern: bug xảy ra khi có 2 config changes gần nhau trong milliseconds — subscription callback thứ 2 arrive trước khi callback thứ 1 xử lý xong.
>
> Root cause: race condition ở message queue buffer — khi queue đầy, message thứ 2 bị drop silently.
>
> Fix: Tăng queue size + add retry mechanism + log khi drop để không silent fail.
>
> **Result**: Bug không reproduce được nữa sau fix. Em cũng add metric để monitor queue utilization — nếu gần đầy thì alert trước."

---

**Q12: "Làm thế nào em debug một issue khi không có reproducer?"**

**Trả lời:**
> "Em dùng approach systematic, layer by layer:
>
> **Step 1 — Collect logs từ tất cả layers**:
> - ConfD logs: xem config có arrive không, có validate fail không
> - OAM agent logs: xem subscription callback có trigger không, có map được không
> - gNB logs: xem message có đến không, có apply không
>
> **Step 2 — Compare với working case**:
> - Chạy working scenario → save logs
> - Chạy failing scenario → compare diff
> - Thường tìm được điểm phân kỳ
>
> **Step 3 — Add temporary instrumentation**:
> - Thêm log ở suspicious code paths
> - Log timestamps để detect timing issues
> - Log message payloads để detect data corruption
>
> **Step 4 — Reproduce với stress test**:
> - Nhiều bugs là timing-dependent — chạy many iterations với gtest-parallel
> - Hoặc inject delays để exaggerate timing
>
> Trong telecom, bugs thường liên quan đến timing, state machine, hoặc message ordering — nên luôn check những thứ này đầu tiên."

---

**Q13: "Kể về một lần em phải optimize performance."**

**Trả lời:**
> "**Context**: PM reporting — OAM agent phải collect counters từ nhiều gNB components và generate report trong time window. Khi số lượng cells tăng, reporting bị trễ so với measurement interval.
>
> **Analysis**: Profile code → phát hiện bottleneck ở serialization PM data sang XML — dùng string concatenation, O(n²) complexity.
>
> **Fix**: Switch sang pre-allocated string buffer và proper XML builder — giảm từ O(n²) xuống O(n).
>
> **Result**: PM reporting time giảm 60% với same number of cells. Cũng có thể handle nhiều cells hơn mà không vượt reporting interval.
>
> **Lesson**: Trong viễn thông, profiling thực tế quan trọng hơn premature optimization — luôn measure trước khi optimize."

---

### ROUND 5 — System Design & Concepts

---

**Q14: "Nếu em design lại OAM agent từ đầu, em sẽ thay đổi gì?"**

**Trả lời:**
> "Một vài điều em sẽ consider:
>
> **1. Observability tốt hơn**: Add metrics exporter (Prometheus-compatible) để monitor OAM agent health — queue depth, callback latency, ZMQ message rate. Hiện tại phải đọc log file thủ công.
>
> **2. Schema-driven config mapper**: Thay vì hardcode path mapping trong `oam_agent_config_mapper.cpp`, generate mapper từ YANG model automatically. Khi thêm field YANG mới, không cần update C++ code.
>
> **3. Retry và circuit breaker**: Hiện tại nếu gNB component không respond, OAM agent chỉ log error. Nên có retry với backoff, và circuit breaker để avoid cascade failure.
>
> Tuy nhiên, trong context của project — đây là codebase lớn với delivery deadline — việc incremental improvement thực tế hơn là rewrite."

---

**Q15: "5G OAM khác gì so với 4G OAM?"**

**Trả lời:**
> "Một vài điểm khác biệt chính:
>
> **Protocol**: 4G (LTE) dùng TR-069 (CWMP) hoặc proprietary. 5G standardize hơn với NETCONF/YANG theo O-RAN specification.
>
> **Architecture**: 4G có eNB monolithic (một khối). 5G split thành CU-CP + CU-UP + DU — nên OAM phải manage 3 components riêng thay vì 1.
>
> **O-RAN**: 5G có O-RAN Alliance push open interfaces — O1 interface (NETCONF/YANG), O2 interface (cloud management). Điều này tạo ra ecosystem mở hơn.
>
> **Complexity**: 5G có nhiều config parameters hơn, nhiều states hơn, và stricter latency requirements (for URLLC use cases)."

---

### ROUND 6 — Behavioral / Culture Fit

---

**Q16: "Em học domain 5G viễn thông như thế nào khi mới vào?"**

**Trả lời:**
> "Khi mới vào, em không biết gì về 5G. Em tiếp cận theo top-down:
>
> **Tuần 1–2**: Đọc tài liệu overview — O-RAN architecture, 5G RAN concepts, OAM là gì. Company có training materials và new hire documents.
>
> **Tuần 3–4**: Code walkthrough với senior — hiểu folder structure, threading model, data flow.
>
> **Tháng 2**: Nhận ticket nhỏ — fix bugs, add logging. Đọc code liên quan để hiểu context.
>
> **Tháng 3+**: Feature tickets. Khi gặp khái niệm không hiểu (VD: RRC, PDCP), hỏi network engineer hoặc đọc 3GPP spec relevant section.
>
> Key learning: trong viễn thông, không cần hiểu tất cả — hiểu layer của mình sâu, biết layer trên/dưới đủ để communicate."

---

**Q17: "Điều em thích nhất và không thích nhất về dự án này?"**

**Trả lời:**
> "**Thích nhất**: Domain knowledge — 5G là technology cutting-edge, ảnh hưởng thực tế đến hàng triệu user. Cảm giác biết rằng code của mình đang chạy trong production base stations rất motivating. Cũng học được rất nhiều về distributed systems, real-time constraints, và protocol design.
>
> **Không thích**: Codebase legacy — một số phần code được viết từ rất lâu, documentation ít, phải đọc code để hiểu intent. Đôi khi tốn nhiều thời gian để understand trước khi có thể fix. Đây cũng là lý do em muốn tìm môi trường có code quality practice tốt hơn và more modern codebase."

---

## PHẦN 8 — CHECKLIST TRƯỚC PHỎNG VẤN

### 30 phút trước:
- [ ] Ôn lại sơ đồ architecture (vẽ ra giấy không nhìn)
- [ ] Ôn lại CM flow, FM flow bằng miệng
- [ ] Nhớ 2 issue mẫu theo STAR
- [ ] Chuẩn bị elevator pitch 30 giây

### Trong phỏng vấn:
- [ ] Hỏi lại nếu câu hỏi không rõ
- [ ] Nói to suy nghĩ khi approach vấn đề
- [ ] Vẽ diagram khi giải thích architecture
- [ ] Honest nếu không biết — "Em chưa làm phần đó, nhưng approach của em sẽ là..."

### Red flags cần tránh:
- Nói "em không biết" mà không tiếp tục explore
- Generic answers — luôn kèm ví dụ cụ thể từ project
- Không mention trade-offs khi design
- Claim làm một mình — emphasize collaboration

---

*Tài liệu này combine lý thuyết từ 3GPP/O-RAN specs với thực tế từ project Mobile-Phoenix Radisys Trillium 5G NR.*
