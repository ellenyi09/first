// -------------------------------------------------------------
// [1] 전역 상태 및 유틸리티 함수 (씬 매니저)
// -------------------------------------------------------------
let prepState = { card: false, regulator: false };

/**
 * 씬(화면) 전환 관리 함수
 * @param {string} sceneId - 표시할 씬 요소의 ID
 * @param {string} displayType - 표시 방식 ('block', 'flex' 등, 기본값은 'block')
 */
function showScene(sceneId, displayType = 'block') {
    const scenes = document.querySelectorAll('.scene');
    scenes.forEach(scene => {
        scene.style.display = 'none';
    });
    const targetScene = document.getElementById(sceneId);
    if (targetScene) {
        targetScene.style.display = displayType;
    }
}

// -------------------------------------------------------------
// [2] Phase 1 & 2: 병실 인트로 및 EMR 처방 확인
// -------------------------------------------------------------
window.onload = function() {
    // 인트로 문구 페이드아웃 및 팝업 표시 타이머 설정
    setTimeout(() => { 
        document.getElementById("scenario-intro").style.opacity = "0"; 
    }, 8000);
    
    setTimeout(() => { 
        document.getElementById("scenario-intro").style.display = "none"; 
        document.getElementById("alert-popup").style.display = "block"; 
    }, 6000); 
};

// EMR 화면으로 이동
function goToEMR() { 
    showScene("phase-emr", "flex"); 
}

// EMR 처방 우클릭 시 컨텍스트 메뉴 표시
function showContextMenu(e) { 
    e.preventDefault(); 
    let menu = document.getElementById("context-menu"); 
    menu.style.display = "block"; 
    menu.style.left = e.pageX + "px"; 
    menu.style.top = e.pageY + "px"; 
}

// 화면 클릭 시 컨텍스트 메뉴 숨김
window.onclick = function(e) { 
    document.getElementById("context-menu").style.display = "none"; 
}

// -------------------------------------------------------------
// [3] Phase 3 & 4: 투약카드 출력, 수액장 선택 및 관련 퀴즈
// -------------------------------------------------------------
// 투약카드 출력 애니메이션 및 퀴즈 1 노출
function printCard() { 
    showScene("phase-printer", "flex"); 
    setTimeout(() => { 
        document.getElementById("animated-card").classList.add("printed"); 
    }, 500); 
    setTimeout(() => { 
        document.getElementById("quiz1-modal").style.display = "flex"; 
    }, 2500); 
}

// 퀴즈 1 (5 Right) 정답 확인
function checkQuiz1(ans) { 
    if (ans === 6) { 
        alert("정답입니다!"); 
        document.getElementById("quiz1-modal").style.display = "none"; 
        showScene("phase-fluid", "block"); 
    } else { 
        alert("오답입니다."); 
    } 
}

// 잘못된 수액 선택 시 경고
function wrongFluid() { 
    alert("투약카드와 일치하지 않는 수액입니다."); 
}

// 알맞은 수액 선택 시 퀴즈 2 노출
function showQuiz2() { 
    document.getElementById("quiz2-modal").style.display = "flex"; 
}

// 퀴즈 2 (수액 확인 항목) 정답 확인
function checkQuiz2() {
    let opt1 = document.getElementById("q2-opt1").checked;
    let opt2 = document.getElementById("q2-opt2").checked;
    let opt3 = document.getElementById("q2-opt3").checked;
    let opt4 = document.getElementById("q2-opt4").checked;
    
    // 정답 조건: 유효일자(opt1) & 이물질 유무(opt2) 체크, 나머지 미체크
    if (opt1 && opt2 && !opt3 && !opt4) {
        alert("정답입니다!");
        document.getElementById("quiz2-modal").style.display = "none";
        showScene("phase-prep-room", "block"); 
        
        // 물품 준비 영역 서서히 나타나는 효과
        let eqBox = document.getElementById('equipment-selection');
        eqBox.style.display = 'block'; 
        setTimeout(() => { 
            eqBox.classList.add('show'); 
            }, 50);
    } else { 
        alert("틀렸습니다."); 
    }
}

// -------------------------------------------------------------
// [4] Phase 5 & 5-2: 물품 선택 및 트레이 세팅 완료
// -------------------------------------------------------------
// 준비 물품 검증 (9개 아이템 정확히 골랐는지 확인)
function checkEquipment() {
    let btns = document.querySelectorAll('.eq-btn');
    let allCorrect = true;
    let selCount = 0;
    
    btns.forEach(b => {
        let sel = b.classList.contains('selected');
        let ans = b.getAttribute('data-ans') === "1";
        if (sel) selCount++; 
        if ((ans && !sel) || (!ans && sel)) allCorrect = false;
    });
    
    if (allCorrect && selCount === 9) {
        showScene("phase-tray-complete", "flex");
    } else { 
        alert("9개를 정확히 골라주세요."); 
    }
}

// 수액 조립/세팅 화면으로 이동
function goToConnection() { 
    showScene("phase-connect", "block"); 
}

// -------------------------------------------------------------
// [5] Phase 6: 수액 및 세트 조립 (드래그 앤 드롭)
// -------------------------------------------------------------
// 드래그 시작 데이터 설정
function drag(ev, type) { 
    ev.dataTransfer.setData("itemType", type); 
}

// 드래그 오버 시 영역 하이라이트 효과
function allowDrop(ev) {
    ev.preventDefault();
    if (ev.target.id === 'item-ns1l' || ev.target.closest('#item-ns1l')) {
        document.getElementById('item-ns1l').classList.add('highlight');
    } else if (ev.target.id === 'iv-pole' || ev.target.closest('#iv-pole')) {
        document.getElementById('iv-pole').classList.add('highlight');
    }
}

// 마우스가 영역을 벗어났을 때 하이라이트 제거
function dragLeave(ev) { 
    document.getElementById('item-ns1l').classList.remove('highlight'); 
    document.getElementById('iv-pole').classList.remove('highlight'); 
}

// 수액통 위에 투약카드 및 수액세트 조립
function dropOnNS(ev) {
    ev.preventDefault(); 
    document.getElementById('item-ns1l').classList.remove('highlight');
    let type = ev.dataTransfer.getData("itemType");
    
    if (type === 'card') { 
        document.getElementById('item-card').style.display = 'none'; 
        document.getElementById('attached-card').style.display = 'block'; 
        prepState.card = true; 
    } else if (type === 'regulator') { 
        document.getElementById('item-regulator').style.display = 'none'; 
        document.getElementById('item-ns1l').classList.add('connected-fluid'); 
        prepState.regulator = true; 
    }
    
    // 카드와 세트(조절기)가 모두 결합되면 폴대에 걸 수 있도록 드래그 아이템으로 변경
    if (prepState.card && prepState.regulator) {
        document.getElementById('prep-instruction').innerHTML = "수액 준비 완료!<br>완성된 수액을 우측 IV 폴대에 걸어주세요.";
        let ns1l = document.getElementById('item-ns1l'); 
        ns1l.classList.add('drag-item'); 
        ns1l.setAttribute('draggable', 'true'); 
        ns1l.setAttribute('ondragstart', "drag(event, 'ready_fluid')"); 
    }
}

// 폴대에 조립 완료된 수액 거치
function dropOnPole(ev) {
    ev.preventDefault(); 
    let pole = document.getElementById('iv-pole');
    pole.classList.remove('highlight');
    let type = ev.dataTransfer.getData("itemType");
    
    if (type === 'ready_fluid') {
        let fluid = document.getElementById('item-ns1l');
        pole.appendChild(fluid);
        
        // 폴대 내 위치 고정
        fluid.style.position = 'absolute'; 
        fluid.style.top = '5%'; 
        fluid.style.left = '50%'; 
        fluid.style.transform = 'translateX(-50%)';
        fluid.setAttribute('draggable', 'false'); 
        fluid.classList.remove('drag-item');
        
        document.getElementById('prep-instruction').innerHTML = "🎉 준비 완료! 병실로 이동합니다. 🎉";
        
        // 1.5초 후 병실 이동 연출 호출
        setTimeout(() => {
            startMovingToPatientRoom();
        }, 1500);
    } else {
        alert("수액에 먼저 투약카드와 수액세트를 모두 연결해야 걸 수 있습니다.");
    }
}

// -------------------------------------------------------------
// [6] Phase 7 & 8: 병실 이동, 환자 대면 및 확인 퀴즈
// -------------------------------------------------------------
// 병실 이동 복도 -> 문 -> 입장 연출
function startMovingToPatientRoom() {
    showScene("phase-moving", "block");
    let moveScene = document.getElementById('phase-moving');
    
    moveScene.style.backgroundImage = "url('assets/병실복도.jpg')"; 

    setTimeout(() => { 
        moveScene.style.backgroundImage = "url('assets/병실 문.jpg')"; 
    }, 2000); 

    setTimeout(() => {
        moveScene.style.backgroundImage = "url('assets/병실입장(팔찌적용).jpg')"; 
        
        // 병실 도착 후 수액 정보 카드 표시
        setTimeout(() => {
            const medCard = document.getElementById('patient-room-med-card');
        medCard.style.display = 'block';
        void medCard.offsetWidth;
        medCard.style.opacity = '1'; 
        }, 1500); 
        
        // 간호사 첫인사 및 퀴즈 3 노출
        setTimeout(() => {
            document.getElementById('nurse-speech-1').classList.add('show');
            setTimeout(() => { 
                document.getElementById('quiz3-modal').style.display = 'flex'; 
            }, 2000);
        }, 1000);
    }, 4000);
}

// 퀴즈 3 (손위생 최우선 수행) 정답 확인
function checkQuiz3(ans) {
    if (ans === 3) {
        alert("정답입니다!");
        document.getElementById('quiz3-modal').style.display = 'none';
        document.getElementById('nurse-speech-1').classList.remove('show'); 
        setTimeout(() => { 
            document.getElementById('quiz4-modal').style.display = 'flex'; 
        }, 500);
    } else { 
        alert("틀렸습니다."); 
    }
}

// 퀴즈 4 (환자 성함 개방형 질문) 정답 확인
function checkQuiz4(ans) {
    if (ans === 2) {
        alert("정답입니다!");
        document.getElementById('quiz4-modal').style.display = 'none';
        document.getElementById('patient-reply').classList.add('show');
        setTimeout(() => { 
            document.getElementById('quiz5-modal').style.display = 'flex'; 
        }, 2000);
    } else { 
        alert("틀렸습니다."); 
    }
}

// 퀴즈 5 (입원팔찌 확인 절차) 정답 확인
function checkQuiz5(ans) {
    if (ans === 3) {
        alert("정답입니다!");
        document.getElementById('quiz5-modal').style.display = 'none';
        startBraceletCheck();
    } else { 
        alert("틀렸습니다."); 
    }
}

// 이름 -> 등록번호 순차 깜빡임 대조 애니메이션 및 완료 처리
function startBraceletCheck() {
    showScene("phase-verify", "flex");

    // 1초 뒤 이름 대조 시작 (이름 깜빡임 활성화)
    setTimeout(() => {
        document.getElementById('card-name-txt').classList.add('text-blink');
        document.getElementById('hl-brace-name').classList.add('active');
        
        // 3초 뒤 이름 깜빡임 중단 및 등록번호 대조 시작 (등록번호 깜빡임 활성화)
        setTimeout(() => {
            document.getElementById('card-name-txt').classList.remove('text-blink');
            document.getElementById('hl-brace-name').classList.remove('active');
            
            document.getElementById('card-id-txt').classList.add('text-blink');
            document.getElementById('hl-brace-id').classList.add('active');
            
            // 2초 뒤 완료 버튼 노출
            setTimeout(() => { 
                document.getElementById('btn-next-action').style.display = 'block'; 
            }, 2000);
        }, 3000);
    }, 1000);
}

// -------------------------------------------------------------
// [8] Phase 10 ~ 14: 처방 설명, 천자 준비, 천자 수행, 고정, 기록 및 평가
// -------------------------------------------------------------
let evaluation = { step4: 100, step5: 100, step6: 100, step7: 100 };
let wasteState = { needle: false, swab: false, syringe: false };

// 각 단계별 순서 정의 및 진행 인덱스 트래커
let sequenceTracker = {
    prep: {
        sequence: ['tourniquet', 'sanitize', 'clean'], // 1. 지혈대, 2. 손소독, 3. 소독솜
        currentIndex: 0,
        buttonIds: {
            tourniquet: 'btn-tie-tourniquet',
            sanitize: 'btn-sanitize-vein',
            clean: 'btn-clean-vein'
        },
        actions: {
            tourniquet: tieTourniquet,
            sanitize: sanitizeHandsForVein,
            clean: cleanVeinSite
        }
    },
    insert: {
        sequence: ['insert', 'advance', 'untie', 'remove'], // 1. 바늘삽입, 2. 카테터진입, 3. 지혈대풀기, 4. 스타일렛제거&수액선연결
        currentIndex: 0,
        buttonIds: {
            insert: 'btn-insert-catheter',
            advance: 'btn-advance-catheter',
            untie: 'btn-untie-tourniquet',
            remove: 'btn-remove-stylus'
        },
        actions: {
            insert: showQuiz9,
            advance: advanceCatheter,
            untie: untieTourniquet,
            remove: removeStylusAndConnect
        }
    },
    secure: {
        sequence: ['open', 'secure', 'speed', 'label'], // 1. 조절기열기, 2. 테가덤고정, 3. 속도조절, 4. 라벨작성
        currentIndex: 0,
        buttonIds: {
            open: 'btn-open-regulator',
            secure: 'btn-secure-catheter',
            speed: 'btn-adjust-speed',
            label: 'btn-label-dressing'
        },
        actions: {
            open: openRegulatorAndCheck,
            secure: secureCatheter,
            speed: showQuiz10,
            label: labelDressing
        }
    }
};

// 순서 선택 트리거 함수
function triggerStep(phase, actionKey) {
    let phaseData = sequenceTracker[phase];
    let expectedAction = phaseData.sequence[phaseData.currentIndex];
    let clickedButton = document.getElementById(phaseData.buttonIds[actionKey]);
    
    // 클릭된 버튼의 흔들림(에러) 애니메이션 제거용 초기화
    clickedButton.classList.remove('error');
    void clickedButton.offsetWidth; // 리플로우 유도
    
    if (actionKey === expectedAction) {
        // 올바른 순서인 경우
        clickedButton.classList.add('completed');
        
        // 해당 액션 실행
        phaseData.actions[actionKey]();
        
        // 인덱스 증가
        phaseData.currentIndex++;
    } else {
        // 잘못된 순서인 경우
        clickedButton.classList.add('error');
        alert("🚨 순서가 맞지 않습니다! 핵심간호술 임상 절차를 다시 생각해보고 알맞은 순서의 버튼을 클릭하세요.");
        
        // 패널티 감점 적용
        if (phase === 'prep') {
            evaluation.step4 -= 10;
        } else if (phase === 'insert') {
            evaluation.step5 -= 10;
        } else if (phase === 'secure') {
            evaluation.step6 -= 10;
        }
    }
}

// Phase 10: 수액 처방 설명으로 전환
function goToExplain() {
    showScene("phase-prep-explain", "flex");
    const bubble = document.getElementById("explain-speech");
    if (bubble) {
        bubble.style.display = "none";
        bubble.style.opacity = "0";
    }
    setTimeout(() => {
        document.getElementById("quiz6-modal").style.display = "flex";
    }, 300);
}

// 퀴즈 6 (수행항목 11) 정답 확인
function checkQuiz6(ans) {
    if (ans === 1) {
        alert("정답입니다!");
        document.getElementById("quiz6-modal").style.display = "none";
        
        const bubble = document.getElementById("explain-speech");
        if (bubble) {
            bubble.innerText = "안녕하세요 김이화님, 금식 기간동안 수분 공급을 위해 수액을 투약하겠습니다. 주사부위 통증이나 붓기가 느껴지면 말씀해주세요";
            bubble.style.display = "block";
            bubble.style.opacity = "1";
            bubble.classList.add("show");
        }
        
        setTimeout(() => {
            showScene("phase-vein-prep", "flex");
        }, 4000);
    } else {
        alert("오답입니다. 환자에게 처방 수액의 목적(수분 공급), 예상되는 효과, 주의사항(통증/붓기 발생 시 알리기)을 명확하게 설명해야 합니다.");
        evaluation.step4 -= 10;
    }
}

// 1. 지혈대 적용 함수
function tieTourniquet() {
    document.getElementById("quiz7-modal").style.display = "flex";
}

// 퀴즈 7 (수행항목 14) 정답 확인
function checkQuiz7(ans) {
    if (ans === 2) {
        alert("정답입니다!");
        document.getElementById("quiz7-modal").style.display = "none";
        document.getElementById("vein-prep-arm").src = "assets/토니켓적용(팔찌적용).jpg";
        document.getElementById("vein-prep-instruction").innerText = "순서에 맞춰 다음 술기 단계를 진행하세요.";
    } else {
        alert("틀렸습니다. 지혈대는 천자할 예정 부위의 12~15cm 위쪽에 묶어야 충분히 정맥류를 충혈시킬 수 있습니다.");
        evaluation.step4 -= 10;
        // 지혈대 적용은 오답이어도 강제 적용 처리하여 다음 단계로 유도
        document.getElementById("quiz7-modal").style.display = "none";
        document.getElementById("vein-prep-arm").src = "assets/토니켓적용(팔찌적용).jpg";
        document.getElementById("vein-prep-instruction").innerText = "순서에 맞춰 다음 술기 단계를 진행하세요.";
    }
}

// 2. 천자 전 손위생 함수
function sanitizeHandsForVein() {
    alert("손소독제로 손위생을 실시하였습니다.");
    document.getElementById("vein-prep-instruction").innerText = "순서에 맞춰 다음 술기 단계를 진행하세요.";
}

// 3. 소독솜 닦기 함수
function cleanVeinSite() {
    document.getElementById("quiz8-modal").style.display = "flex";
}

// 퀴즈 8 (수행항목 16) 정답 확인
function checkQuiz8(ans) {
    if (ans === 1) {
        alert("정답입니다!");
        document.getElementById("quiz8-modal").style.display = "none";
        alert("소독솜으로 주사 예정 부위를 깨끗이 소독하고 건조시켰습니다. 정맥천자 단계로 진입합니다.");
        showScene("phase-vein-insert", "flex");
    } else {
        alert("틀렸습니다. 피부의 안쪽에서 바깥쪽으로 둥글게 원을 그리며 5~8cm 직경으로 소독해야 균을 변두리로 밀어낼 수 있습니다.");
        evaluation.step4 -= 10;
        document.getElementById("quiz8-modal").style.display = "none";
        alert("정맥천자 단계로 진입합니다.");
        showScene("phase-vein-insert", "flex");
    }
}

// Phase 12: 1. 바늘 삽입 퀴즈 노출
function showQuiz9() {
    document.getElementById("quiz9-modal").style.display = "flex";
}

// 퀴즈 9 (수행항목 17) 정답 확인
function checkQuiz9(ans) {
    if (ans === 1) {
        alert("정답입니다!");
        document.getElementById("quiz9-modal").style.display = "none";
        document.getElementById("flashback-area").style.display = "block";
        document.getElementById("vein-insert-instruction").innerText = "순서에 맞춰 다음 술기 단계를 진행하세요.";
    } else {
        alert("틀렸습니다. 카테터의 빗면(사면)이 위를 향하게 하여 정맥의 흐름 방향을 따라 15도~30도의 각도로 비스듬히 천자해야 합니다.");
        evaluation.step5 -= 10;
        document.getElementById("quiz9-modal").style.display = "none";
        document.getElementById("flashback-area").style.display = "block";
        document.getElementById("vein-insert-instruction").innerText = "순서에 맞춰 다음 술기 단계를 진행하세요.";
    }
}

// 2. 스타일렛 약간 뒤로 빼기 및 카테터 밀어넣기
function advanceCatheter() {
    alert("카테터를 혈관 안으로 끝까지 밀어넣는 동안 내관(스타일렛)은 살짝 뒤로 잡아당겨 뺐습니다.");
    document.getElementById("flashback-area").style.display = "none";
    document.getElementById("vein-insert-instruction").innerText = "순서에 맞춰 다음 술기 단계를 진행하세요.";
}

// 3. 지혈대 해제
function untieTourniquet() {
    alert("지혈대를 풀었습니다.");
    // 이미지 변경을 스타일렛 제거 & 수액선 연결 때로 연기
    document.getElementById("vein-insert-instruction").innerText = "순서에 맞춰 다음 술기 단계를 진행하세요.";
}

// 4. 내관 완전 제거 및 수액 커넥션 연결
function removeStylusAndConnect() {
    alert("카테터 끝 부위(혈관 부분)를 눌러 혈액이 새지 않게 고정하고, 스타일렛을 재빨리 제거한 뒤 준비된 수액세트 튜브를 연결하였습니다!");
    // 스타일렛 제거 및 수액 커넥션이 연결될 때 팔 이미지 갱신
    document.getElementById("vein-insert-arm").src = "assets/주사삽입완료(팔찌적용).jpg";
    showScene("phase-flow-secure", "flex");
}

// Phase 13: 1. 조절기 열기 및 관찰
function openRegulatorAndCheck() {
    alert("조절기를 완전히 열어 수액 방울이 잘 떨어지는지 확인하고, 주사 부위에 붓기(부종), 통증, 새는 부분(침윤)이 없는지 꼼꼼히 관찰하였습니다.");
    document.getElementById("flow-secure-instruction").innerText = "순서에 맞춰 다음 술기 단계를 진행하세요.";
}

// 2. 투명 드레싱 고정
function secureCatheter() {
    const tegaderm = document.getElementById("tegaderm-overlay");
    if (tegaderm) {
        tegaderm.classList.add("active");
    }
    alert("투명 필름 드레싱을 정맥 카테터 삽입 부위에 정확히 밀착하여 감염 예방과 함께 단단히 고정하였습니다.");
    document.getElementById("flow-secure-instruction").innerText = "순서에 맞춰 다음 술기 단계를 진행하세요.";
}

// 3. 주입 속도 조절 퀴즈
function showQuiz10() {
    document.getElementById("quiz10-modal").style.display = "flex";
}

// 퀴즈 10 (주입 속도 조절) 정답 확인
function checkQuiz10(ans) {
    if (ans === 2) {
        alert("정답입니다!");
        document.getElementById("quiz10-modal").style.display = "none";
        document.getElementById("flow-secure-instruction").innerText = "순서에 맞춰 다음 술기 단계를 진행하세요.";
    } else {
        alert("틀렸습니다. 처방된 IVF 주입 속도는 80cc/hr(약 80방울/시간 비율)입니다.");
        evaluation.step6 -= 10;
        document.getElementById("quiz10-modal").style.display = "none";
        document.getElementById("flow-secure-instruction").innerText = "순서에 맞춰 다음 술기 단계를 진행하세요.";
    }
}

// 4. 드레싱 네임 라벨 작성
function labelDressing() {
    document.getElementById("quiz11-modal").style.display = "flex";
}

// -------------------------------------------------------------
// [9] Phase 14: 폐기물 드래그 앤 드롭 및 간호기록지
// -------------------------------------------------------------
function dragWaste(ev, item) {
    ev.dataTransfer.setData("wasteItem", item);
}

function allowWasteDrop(ev) {
    ev.preventDefault();
    ev.target.classList.add("dragover");
}

function leaveWasteBin(ev) {
    ev.target.classList.remove("dragover");
}

function dropWaste(ev, binType) {
    ev.preventDefault();
    ev.target.classList.remove("dragover");
    let item = ev.dataTransfer.getData("wasteItem");
    
    if (binType === "sharps") {
        if (item === "needle") {
            document.getElementById("waste-needle").style.display = "none";
            wasteState.needle = true;
            alert("침 부품(주사바늘)을 손상성폐기물 전용 플라스틱 용기에 안전하게 배출했습니다!");
        } else {
            alert("바늘이 아닌 것은 손상성 폐기물 용기에 버리면 안 됩니다. (오분리 감점)");
            evaluation.step6 -= 5;
        }
    } else if (binType === "general") {
        if (item === "swab") {
            document.getElementById("waste-swab").style.display = "none";
            wasteState.swab = true;
        } else if (item === "syringe") {
            document.getElementById("waste-syringe").style.display = "none";
            wasteState.syringe = true;
        } else {
            alert("주사바늘은 손상 위험이 있어 일반 의료폐기물함에 버릴 수 없습니다. (감점)");
            evaluation.step6 -= 5;
        }
    }
    
    // 일반 폐기물 2가지 버렸을 시 안내
    if (binType === "general" && (item === "swab" || item === "syringe")) {
        alert("알코올 소독솜/주사기를 일반 의료폐기물함에 배출했습니다.");
    }
    
    // 분리 배출 모두 완료되었는지 확인
    if (wasteState.needle && wasteState.swab && wasteState.syringe) {
        document.getElementById("btn-waste-complete").style.display = "block";
    }
}

// 쓰레기 분리배출 완료 및 기록지 노출
function completeWasteAndShowChart() {
    document.getElementById("quiz12-modal").style.display = "flex";
}

// 간호기록지 제출 및 최종 점수 계산
function submitChart() {
    let name = document.getElementById("chart-name").value.trim();
    let drug = document.getElementById("chart-drug").value.trim();
    let route = document.getElementById("chart-route").value.trim();
    let speed = document.getElementById("chart-speed").value.trim();
    
    if (name !== "김이화") {
        alert("틀렸습니다. 대상자 이름이 처방과 일치하지 않습니다. (김이화)");
        evaluation.step7 -= 20;
    }
    const drugClean = drug.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9\/]/g, '');
    const isDrugCorrect = drugClean.includes("ns1l") || 
                          drugClean.includes("n/s1l") || 
                          drugClean.includes("normalsaline1l") || 
                          drugClean.includes("normalsaline1000ml") || 
                          drugClean.includes("normalsalineinj") ||
                          drugClean.includes("ns1000ml") ||
                          drugClean.includes("n/s1000ml") ||
                          drugClean.includes("saline") ||
                          drugClean.includes("수액");
    
    if (!isDrugCorrect) {
        alert("틀렸습니다. 투약약물/수액명이 올바르지 않습니다. (Normal Saline 1L, NS 1L, N/S 1L 등)");
        evaluation.step7 -= 25;
    }
    if (route.toUpperCase() !== "IV" && route.toUpperCase() !== "IVF") {
        alert("틀렸습니다. 투여 경로는 IV 또는 IVF 여야 합니다.");
        evaluation.step7 -= 20;
    }
    const speedClean = speed.toLowerCase().replace(/\s+/g, '');
    if (speedClean !== "80" && speedClean !== "80cc/hr" && speedClean !== "80cc") {
        alert("틀렸습니다. 처방된 주입 속도는 80cc/hr(또는 80)입니다.");
        evaluation.step7 -= 20;
    }
    
    // 최하 점수 0점 보장
    if (evaluation.step4 < 0) evaluation.step4 = 0;
    if (evaluation.step5 < 0) evaluation.step5 = 0;
    if (evaluation.step6 < 0) evaluation.step6 = 0;
    if (evaluation.step7 < 0) evaluation.step7 = 0;
    
    // 최종 평균 점수 산출
    let totalScore = Math.round((100 + 100 + 100 + evaluation.step4 + evaluation.step5 + evaluation.step6 + evaluation.step7) / 7);
    
    // UI 업데이트
    document.getElementById("evaluation-score").innerText = totalScore + "점";
    document.getElementById("eval-step4").innerText = evaluation.step4 === 100 ? "통과 (100점)" : "감점 (" + evaluation.step4 + "점)";
    document.getElementById("eval-step5").innerText = evaluation.step5 === 100 ? "통과 (100점)" : "감점 (" + evaluation.step5 + "점)";
    document.getElementById("eval-step6").innerText = evaluation.step6 === 100 ? "통과 (100점)" : "감점 (" + evaluation.step6 + "점)";
    document.getElementById("eval-step7").innerText = evaluation.step7 === 100 ? "통과 (100점)" : "감점 (" + evaluation.step7 + "점)";
    
    alert("기록 작성이 완료되었습니다. 최종 성적 보고서를 확인하세요!");
    showScene("phase-report", "flex");
}

// -------------------------------------------------------------
// [10] 퀴즈 11 및 퀴즈 12 핸들러
// -------------------------------------------------------------
let quiz11PenaltyApplied = false;
function checkQuiz11() {
    const a1 = document.getElementById("q11-ans1").value.trim().toLowerCase();
    const a2 = document.getElementById("q11-ans2").value.trim().toLowerCase();
    const a3 = document.getElementById("q11-ans3").value.trim().toLowerCase();
    const inputs = [a1, a2, a3];
    
    const hasDate = inputs.some(v => v.includes("날짜") || v.includes("일자") || v.includes("date") || v === "일");
    const hasTime = inputs.some(v => v.includes("시간") || v.includes("시각") || v.includes("time"));
    const hasSize = inputs.some(v => v.includes("크기") || v.includes("규격") || v.includes("게이지") || v.includes("g") || v.includes("size") || v.includes("굵기") || v.includes("규격"));
    
    if (hasDate && hasTime && hasSize) {
        alert("정답입니다! 고정용 라벨에 삽입 날짜, 시간, 카테터 크기(규격)를 적어 부착합니다.");
        document.getElementById("quiz11-modal").style.display = "none";
        alert("정맥주사 삽입이 완료되었습니다. 사용 물품 정리 및 기록 작성을 위해 이동합니다.");
        showScene("phase-document", "flex");
    } else {
        alert("틀렸습니다. 드레싱 고정 테이프(라벨)에 적어야 하는 3가지 주요 내용은 '삽입 날짜', '삽입 시간', '카테터 크기(규격)'입니다.");
        if (!quiz11PenaltyApplied) {
            evaluation.step6 -= 10;
            quiz11PenaltyApplied = true;
        }
    }
}

let quiz12PenaltyApplied = false;
function checkQuiz12(ans) {
    if (ans === 3) {
        alert("정답입니다! 물품 정리 직후에는 물과 비누로 깨끗이 손위생을 실시하여 병원균 전파를 막습니다.");
        document.getElementById("quiz12-modal").style.display = "none";
        alert("물과 비누를 활용하여 깨끗하게 손위생을 마쳤습니다. 간호기록지를 작성해 주세요.");
        document.querySelector(".waste-cleanup-box").style.display = "none";
        document.getElementById("chart-area").style.display = "block";
    } else {
        alert("틀렸습니다. 폐기물 정리 및 주변 환경 청소 후에는 즉시 물과 비누로 손위생을 실시해야 합니다.");
        if (!quiz12PenaltyApplied) {
            evaluation.step6 -= 10;
            quiz12PenaltyApplied = true;
        }
    }
}

