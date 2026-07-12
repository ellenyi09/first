// -------------------------------------------------------------
// [1] 전역 상태 및 유틸리티 함수 (씬 매니저)
// -------------------------------------------------------------
let prepState = { card: false, regulator: false };
let totalScore = 100;
let wrongFeedbacks = [];

function applyPenalty(stepKey, key, feedbackText) {
    if (!wrongFeedbacks.includes(feedbackText)) {
        wrongFeedbacks.push(feedbackText);
        
        const highWeightKeys = [
            "quiz1", "quiz2", "quiz2b", "quiz3", "quiz4", "quiz5", "quiz5b", 
            "quiz6", "quiz7", "quiz8", "quiz9", "quiz9b", "quiz9c", "quiz10", 
            "quiz10b", "quiz11", "quiz12"
        ];
        const isHigh = highWeightKeys.includes(key);
        
        if (isHigh) {
            totalScore -= 5;
        } else {
            totalScore -= 2;
        }
        if (totalScore < 0) totalScore = 0;
        
        // Step-wise breakdown deduction (kept for internal log compatibility)
        if (stepKey && evaluation && evaluation[stepKey] !== undefined) {
            evaluation[stepKey] -= 10;
            if (evaluation[stepKey] < 0) evaluation[stepKey] = 0;
        }
    }
}

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
        const clickedBtn = document.querySelector(`#quiz1-modal .quiz-option[onclick*="(${ans})"]`);
        handleSimpleQuizCorrect("quiz1-modal", clickedBtn, () => {
            showScene("phase-fluid", "block"); 
        });
    } else { 
        showWrongModal();
        applyPenalty(null, "quiz1", "• 퀴즈 1 (5 Rights): 투약의 기본 원칙인 5 Rights에 대해 오답이 있었습니다.");
    } 
}

// 잘못된 수액 선택 시 경고
function wrongFluid() { 
    showWrongModal("🚨 투약카드와 일치하지 않는 수액입니다.<br><br>5right을 다시 확인해주세요!"); 
    applyPenalty(null, "wrong_fluid", "• 수액 선택: 처방과 다른 수액(오답)을 선택하였습니다.");
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
        const clickedBtn = document.querySelector("#quiz2-modal .btn-submit");
        handleSimpleQuizCorrect("quiz2-modal", clickedBtn, () => {
            showScene("phase-prep-room", "block"); 
            let eqBox = document.getElementById('equipment-selection');
            eqBox.style.display = 'block'; 
            setTimeout(() => { 
                eqBox.classList.add('show'); 
            }, 50);
        });
    } else { 
        showWrongModal(); 
        applyPenalty(null, "quiz2", "• 퀴즈 2 (수액 확인): 수액을 꺼낸 후 유효일자 및 이물질 확인이 미흡했습니다.");
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
        showExplainModal(`<strong style="color: #2ecc71; font-size: 22px;">🎉 물품 준비 완료</strong>`, "필요한 물품을 모두 챙겼습니다.", () => {
            showScene("phase-tray-complete", "flex");
        });
    } else { 
        showWrongModal("🚨 어떤 물품이 필요할지 다시 한번 고민해볼까요?");
        applyPenalty(null, "prep_tray", "• 물품 선택: 정맥주사 삽입에 필요한 9가지 물품 준비에 실수가 있었습니다.");
    }
}

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
        // Show OX Quiz 2b
        document.getElementById('quiz2b-modal').style.display = 'flex';
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
        alert("먼저 투약카드와 수액세트를 수액에 모두 연결해야 걸 수 있습니다.");
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
        const clickedBtn = document.querySelector(`#quiz3-modal .quiz-option[onclick*="(${ans})"]`);
        handleSimpleQuizCorrect("quiz3-modal", clickedBtn, () => {
            document.getElementById('nurse-speech-1').classList.remove('show'); 
            setTimeout(() => { 
                document.getElementById('quiz4-modal').style.display = 'flex'; 
            }, 500);
        });
    } else { 
        showWrongModal();
    }
}

// 퀴즈 4 (환자 성함 개방형 질문) 정답 확인
function checkQuiz4(ans) {
    if (ans === 2) {
        const clickedBtn = document.querySelector(`#quiz4-modal .quiz-option[onclick*="(${ans})"]`);
        handleSimpleQuizCorrect("quiz4-modal", clickedBtn, () => {
            document.getElementById('patient-reply').classList.add('show');
            setTimeout(() => { 
                document.getElementById('quiz5-modal').style.display = 'flex'; 
            }, 2000);
        });
    } else { 
        showWrongModal();
        applyPenalty("step4", "quiz4", "• 퀴즈 5 (개방형 식별): 환자 식별 시 개방형으로 성함을 질문하지 못했습니다.");
    }
}

// 퀴즈 5 (입원팔찌 확인 절차) 정답 확인
function checkQuiz5(ans) {
    if (ans === 3) {
        const clickedBtn = document.querySelector(`#quiz5-modal .quiz-option[onclick*="(${ans})"]`);
        handleSimpleQuizCorrect("quiz5-modal", clickedBtn, () => {
            document.getElementById('quiz5b-modal').style.display = 'flex';
        });
    } else { 
        showWrongModal();
        applyPenalty("step4", "quiz5", "• 퀴즈 6 (팔찌 대조): 이름 대답 후 환자 확인을 위해 입원팔찌 대조를 요구하지 못했습니다.");
    }
}

// 퀴즈 5b (대조 확인할 항목 - 신규 퀴즈 7) 정답 확인
let quiz5bPenaltyApplied = false;
function checkQuiz5b() {
    let opt1 = document.getElementById("q5b-opt1").checked;
    let opt2 = document.getElementById("q5b-opt2").checked;
    let opt3 = document.getElementById("q5b-opt3").checked;
    let opt4 = document.getElementById("q5b-opt4").checked;
    let opt5 = document.getElementById("q5b-opt5").checked;
    
    // 정답: 2번(환자명) & 5번(환자 등록번호)
    if (!opt1 && opt2 && !opt3 && !opt4 && opt5) {
        const clickedBtn = document.querySelector("#quiz5b-modal .btn-submit");
        handleSimpleQuizCorrect("quiz5b-modal", clickedBtn, () => {
            startBraceletCheck();
        });
    } else {
        showWrongModal("🚨 오답입니다!<br><br>다시 고민해볼까요?");
        applyPenalty("step4", "quiz5b", "• 퀴즈 7 (팔찌 대조 항목): 입원팔찌와 카드에서 교차 대조할 항목(이름, 등록번호) 선택에 오류가 있었습니다.");
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
let wasteDrops = { needle: null, swab: null, syringe: null };

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
    
    if (actionKey === expectedAction) {
        // 올바른 순서인 경우
        clickedButton.classList.add('completed');
        
        // 해당 액션 실행
        phaseData.actions[actionKey]();
        
        // 인덱스 증가
        phaseData.currentIndex++;
    } else {
        // 잘못된 순서인 경우 (빨간색 색상 변화 제거하여 힌트 노출 예방)
        showWrongModal("🚨 순서가 맞지 않습니다!<br><br>핵심간호술 임상 절차를 다시 생각해보고 알맞은 순서의 버튼을 클릭하세요.");
        
        // 패널티 감점 적용
        if (phase === 'prep') {
            applyPenalty("step4", "seq_prep", "• 천자 준비 단계: 지혈대 묶기 ➔ 손위생 ➔ 소독솜 소독의 순서가 올바르지 않았습니다.");
        } else if (phase === 'insert') {
            applyPenalty("step5", "seq_insert", "• 천자 수행 단계: 바늘 삽입 ➔ 카테터 진입 ➔ 지혈대 풀기 ➔ 탐침 제거 및 연결의 순서가 올바르지 않았습니다.");
        } else if (phase === 'secure') {
            applyPenalty("step6", "seq_secure", "• 수액 고정/속도 조절 단계: 조절기 열기 ➔ 테가덤 고정 ➔ 속도 조절 ➔ 라벨 작성의 순서가 올바르지 않았습니다.");
        }
    }
}

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
        const clickedBtn = document.querySelector(`#quiz6-modal .quiz-option[onclick*="(${ans})"]`);
        handleSimpleQuizCorrect("quiz6-modal", clickedBtn, () => {
            const bubble = document.getElementById("explain-speech");
            if (bubble) {
                bubble.innerText = "안녕하세요 김이화님, 금식 기간동안 탈수 예방을 위해 수액을 투약하겠습니다. 주사부위 통증이나 붓기가 느껴지면 말씀해주세요";
                bubble.style.display = "block";
                bubble.style.opacity = "1";
                bubble.classList.add("show");
            }
            
            setTimeout(() => {
                showScene("phase-vein-prep", "flex");
            }, 4000);
        });
    } else {
        showWrongModal();
        applyPenalty("step4", "quiz6", "• 퀴즈 8 (약물 설명): 금식 기간 수분 공급 목적 및 통증 보고 교육이 적절하지 못했습니다.");
    }
}

// 1. 지혈대 적용 함수
function tieTourniquet() {
    document.getElementById("quiz7-modal").style.display = "flex";
}

// 퀴즈 7 (수행항목 14) 정답 확인
function checkQuiz7(ans) {
    if (ans === 2) {
        document.getElementById("quiz7-modal").style.display = "none";
        showExplainModal(
            `<strong style="color: #2ecc71; font-size: 22px;">🎉 정답입니다!</strong>`,
            "지혈대는 천자할 예정 부위의 12~15cm 위쪽에 묶어야<br>혈관을 충분히 울혈시킬 수 있습니다.",
            () => {
                document.getElementById("vein-prep-arm").src = "assets/토니켓적용(팔찌적용).jpg";
                document.getElementById("vein-prep-instruction").innerText = "순서에 맞춰 다음 술기 단계를 진행하세요.";
            }
        );
    } else {
        showWrongModal("🚨 오답입니다!<br><br>다시 고민해볼까요?");
        applyPenalty("step4", "quiz7", "• 퀴즈 9 (지혈대 위치): 지혈대를 묶는 위치(천자 예정 부위 12~15cm 위쪽) 지정에 오류가 있었습니다.");
    }
}

// 2. 천자 전 손위생 함수
function sanitizeHandsForVein() {
    showStepNotify("손소독제로 손위생을 실시하였습니다.", 2000);
    document.getElementById("vein-prep-instruction").innerText = "순서에 맞춰 다음 술기 단계를 진행하세요.";
}

// 3. 소독솜 닦기 함수
function cleanVeinSite() {
    document.getElementById("quiz8-modal").style.display = "flex";
}

// 퀴즈 8 (수행항목 16) 정답 확인
function checkQuiz8(ans) {
    if (ans === 1) {
        document.getElementById("quiz8-modal").style.display = "none";
        showExplainModal(
            `<strong style="color: #2ecc71; font-size: 22px;">🎉 정답입니다!</strong>`,
            "피부의 안쪽에서 바깥쪽으로 둥글게 원을 그리며<br>5~8cm 직경으로 소독하고 완전히 건조시켜야 합니다.",
            () => {
                showScene("phase-vein-insert", "flex");
            }
        );
    } else {
        showWrongModal("🚨 오답입니다!<br><br>다시 고민해볼까요?");
        applyPenalty("step4", "quiz8", "• 퀴즈 10 (피부 소독): 소독솜으로 안에서 밖으로 원을 그리며 닦는 소독 방식에 오류가 있었습니다.");
    }
}

// Phase 12: 1. 바늘 삽입 퀴즈 노출
function showQuiz9() {
    document.getElementById("quiz9-modal").style.display = "flex";
}

// 퀴즈 9 (수행항목 17) 정답 확인
function checkQuiz9(ans) {
    if (ans === 1) {
        document.getElementById("quiz9-modal").style.display = "none";
        showExplainModal(
            `<strong style="color: #2ecc71; font-size: 22px;">🎉 정답입니다!</strong>`,
            "카테터의 빗면(사면)이 위를 향하게 하여<br>정맥의 흐름 방향을 따라 15도~30도의 각도로<br>비스듬히 천자해야 합니다.",
            () => {
                document.getElementById("flashback-area").style.display = "block";
                document.getElementById("vein-insert-instruction").innerText = "순서에 맞춰 다음 술기 단계를 진행하세요.";
            }
        );
    } else {
        showWrongModal("🚨 오답입니다!<br><br>다시 고민해볼까요?");
        applyPenalty("step5", "quiz9", "• 퀴즈 11 (바늘 각도): 바늘 사면 방향 및 적절한 진입 각도(15~30도) 선택에 오류가 있었습니다.");
    }
}

// 2. 스타일렛 약간 뒤로 빼기 및 카테터 밀어넣기
function advanceCatheter() {
    document.getElementById("flashback-area").style.display = "none";
    document.getElementById('quiz9b-modal').style.display = 'flex';
    document.getElementById("vein-insert-instruction").innerText = "순서에 맞춰 다음 술기 단계를 진행하세요.";
}

// 3. 지혈대 해제
function untieTourniquet() {
    // 지혈대 풀기 알림 팝업 삭제 후 퀴즈 9-3 노출
    document.getElementById('quiz9c-modal').style.display = 'flex';
    document.getElementById("vein-insert-instruction").innerText = "순서에 맞춰 다음 술기 단계를 진행하세요.";
}

// 4. 내관 완전 제거 및 수액 커넥션 연결
function removeStylusAndConnect() {
    showStepNotify("카테터 끝 부위(혈관 부분)를 눌러 혈액이 새지 않게 고정하고, 탐침을 재빨리 제거한 뒤 준비된 수액세트 튜브를 연결하였습니다!", 2000);
    // 스타일렛 제거 및 수액 커넥션이 연결될 때 팔 이미지 갱신
    document.getElementById("vein-insert-arm").src = "assets/주사삽입완료(팔찌적용).jpg";
    showScene("phase-flow-secure", "flex");
}

// Phase 13: 1. 조절기 열기 및 관찰
function openRegulatorAndCheck() {
    showStepNotify("조절기를 열어 수액 방울이 잘 떨어지는지 확인하고, 주사 부위에 발적, 통증, 침윤이 없는지 꼼꼼히 관찰하였습니다.", 2000);
    document.getElementById("flow-secure-instruction").innerText = "순서에 맞춰 다음 술기 단계를 진행하세요.";
}

// 2. 투명 드레싱 고정
function secureCatheter() {
    const tegaderm = document.getElementById("tegaderm-overlay");
    if (tegaderm) {
        tegaderm.classList.add("active");
    }
    showStepNotify("투명 필름 드레싱을 정맥 카테터 삽입 부위에 정확히 밀착하여 감염 예방과 함께 단단히 고정하였습니다.", 2000);
    document.getElementById("flow-secure-instruction").innerText = "순서에 맞춰 다음 술기 단계를 진행하세요.";
}

// 3. 주입 속도 조절 퀴즈
function showQuiz10() {
    document.getElementById("quiz10-modal").style.display = "flex";
}

// 퀴즈 10 (주입 속도 조절) 정답 확인
function checkQuiz10(ans) {
    if (ans === 2) {
        document.getElementById("quiz10-modal").style.display = "none";
        showExplainModal(
            `<strong style="color: #2ecc71; font-size: 22px;">🎉 정답입니다!</strong>`,
            "처방된 수액의 주입 속도는 80cc/hr입니다.",
            () => {
                document.getElementById("quiz10b-modal").style.display = "flex";
            }
        );
    } else {
        showWrongModal("🚨 오답입니다!<br><br>다시 고민해볼까요?");
        applyPenalty("step6", "quiz10", "• 퀴즈 14 (처방 속도): EMR 처방에 따른 올바른 주입 속도(80cc/hr) 확인이 미흡했습니다.");
    }
}

// 퀴즈 10b (방울 수 계산 - 퀴즈 14) 정답 확인
let quiz10bPenaltyApplied = false;
function checkQuiz10b(ans) {
    if (ans === 3) {
        document.getElementById("quiz10b-modal").style.display = "none";
        showExplainModal(
            `<strong style="color: #2ecc71; font-size: 22px;">🎉 정답입니다!</strong>`,
            "80cc/hr ÷ 3 = 26.7gtt/min<br>60초 ÷ 26.7gtt/min = 2.3초/방울 (sec/gtt)",
            () => {
                document.getElementById("flow-secure-instruction").innerText = "순서에 맞춰 다음 술기 단계를 진행하세요.";
            }
        );
    } else {
        showWrongModal("🚨 오답입니다!<br><br>다시 고민해볼까요?");
        applyPenalty("step6", "quiz10b", "• 퀴즈 15 (gtt 계산): 주입 속도 80cc/hr 기준 방울 수 계산(2.3초당 한 방울)에 오답이 있었습니다.");
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
    
    if (item === "needle" || item === "swab" || item === "syringe") {
        document.getElementById("waste-" + item).style.display = "none";
        wasteDrops[item] = binType;
    }
    
    // 분리 배출 모두 일단 올려놓았는지 확인
    if (wasteDrops.needle && wasteDrops.swab && wasteDrops.syringe) {
        document.getElementById("btn-waste-complete").style.display = "block";
    }
}

function completeWasteAndShowChart() {
    document.getElementById("quiz12-modal").style.display = "flex";
}

// 간호기록지 제출 및 최종 점수 계산
function submitChart() {
    // 이전 에러 표시 초기화
    document.querySelectorAll('.chart-input').forEach(el => el.classList.remove('error'));
    
    let name = document.getElementById("chart-name").value.trim();
    let drug = document.getElementById("chart-drug").value.trim();
    let route = document.getElementById("chart-route").value.trim();
    let speed = document.getElementById("chart-speed").value.trim();
    
    let errorFields = [];
    let errorMsgs = [];
    
    if (name !== "김이화") {
        errorFields.push("chart-name");
        errorMsgs.push("대상자명");
        applyPenalty("step7", "chart_name", "• 간호기록지 (대상자명): 환자의 성함을 정확히 기재하지 못했습니다.");
    }
    
    const drugClean = drug.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9\/가-힣]/g, '');
    const hasBase = drugClean.includes("ns") || 
                    drugClean.includes("n/s") || 
                    drugClean.includes("normalsaline") || 
                    drugClean.includes("생리식염수") || 
                    drugClean.includes("식염수");
    const hasVolume = drugClean.includes("1l") || 
                      drugClean.includes("1000ml");
    const isDrugCorrect = hasBase && hasVolume;
    
    if (!isDrugCorrect) {
        errorFields.push("chart-drug");
        errorMsgs.push("투여약물");
        applyPenalty("step7", "chart_drug", "• 간호기록지 (투여약물): 수액명과 용량(1L/1000ml)을 정확히 기재하지 못했습니다.");
    }
    
    const routeClean = route.toUpperCase().replace(/\s+/g, '');
    const isRouteCorrect = routeClean === "IV" || routeClean === "IVF" || routeClean === "정맥" || routeClean === "정맥주사" || routeClean === "정맥내점적주사";
    
    if (!isRouteCorrect) {
        errorFields.push("chart-route");
        errorMsgs.push("투여경로");
        applyPenalty("step7", "chart_route", "• 간호기록지 (투여경로): 투약 방법(IV/IVF/정맥주사)을 정확히 기재하지 못했습니다.");
    }
    
    const speedClean = speed.toLowerCase().replace(/\s+/g, '');
    const isSpeedCorrect = speedClean === "80" || speedClean === "80cc/hr";
    
    if (!isSpeedCorrect) {
        errorFields.push("chart-speed");
        errorMsgs.push("투여속도");
        applyPenalty("step7", "chart_speed", "• 간호기록지 (투여속도): 투여 속도(80 또는 80cc/hr)를 정확히 기재하지 못했습니다.");
    }
    
    if (errorFields.length > 0) {
        // 모든 오답 입력칸을 동시에 빨간색으로 표시
        errorFields.forEach(id => {
            document.getElementById(id).classList.add("error");
        });
        
        // 첫 번째 오답 입력칸에 포커싱
        document.getElementById(errorFields[0]).focus();
        
        // 여러 개의 오답을 한 번에 리스트업하여 노출
        let combinedMsg = "🚨 다음 항목을 다시 확인하세요:<br>";
        errorMsgs.forEach(msg => {
            combinedMsg += `• ${msg}<br>`;
        });
        
        showWrongModal(combinedMsg);
        return;
    }
    
    // 최종 점수 0점 보장
    if (totalScore < 0) totalScore = 0;
    
    // UI 업데이트 (최종 점수 표기)
    document.getElementById("evaluation-score").innerText = totalScore + "점";
    

    
    // 합격/재시험 여부 판정 및 스탬프/지문 렌더링
    const stampEl = document.getElementById("evaluation-stamp");
    const descEl = document.getElementById("evaluation-desc");
    const restartBtn = document.getElementById("btn-restart-game");
    
    if (totalScore >= 60) {
        stampEl.className = "report-stamp pass";
        stampEl.innerText = "PASS";
        descEl.innerText = "정맥수액주입 게임을 성공적으로 수행하셨습니다!";
        restartBtn.innerText = "🔄 다시 시작하기";
    } else {
        stampEl.className = "report-stamp replay";
        stampEl.innerText = "REPLAY";
        descEl.innerText = "다시 한번 정맥수액주입 게임을 풀어봅시다.";
        restartBtn.innerText = "🔄 재시도하기";
    }
    
    // 오답노트(피드백 목록) 렌더링
    const feedbackArea = document.getElementById("report-feedback-area");
    const feedbackList = document.getElementById("report-feedback-list");
    if (feedbackArea && feedbackList) {
        if (wrongFeedbacks.length > 0) {
            feedbackList.innerHTML = wrongFeedbacks.map(f => `<div style="margin-bottom: 8px;">${f}</div>`).join('');
            feedbackArea.style.display = "block";
        } else {
            feedbackList.innerHTML = `<div style="color: #2ecc71; font-weight: bold; text-align: center;">🎉 완벽합니다! 모든 실기 절차를 오차 없이 수행하셨습니다.</div>`;
            feedbackArea.style.display = "block";
        }
    }
    
    showExplainModal(
        `<strong style="color: #2ecc71; font-size: 22px;">🎉 기록 작성 완료</strong>`,
        "기록 작성이 완료되었습니다. 최종 성적 보고서를 확인하세요!",
        () => {
            showScene("phase-report", "flex");
        }
    );
}

// 퀴즈 2-2 (수액세트 연결 OX) 정답 확인
let quiz2bPenaltyApplied = false;
function checkQuiz2b(ans) {
    if (ans === 'X') {
        document.getElementById('quiz2b-modal').style.display = 'none';
        showExplainModal(
            `<strong style="color: #2ecc71; font-size: 22px;">🎉 정답입니다!</strong>`,
            "수액세트에 공기가 차지 않도록 점적통의 1/2 정도를 수액으로 채워야 합니다.",
            () => {
                document.getElementById('item-regulator').style.display = 'none'; 
                document.getElementById('item-ns1l').classList.add('connected-fluid'); 
                prepState.regulator = true; 
                
                if (prepState.card && prepState.regulator) {
                    document.getElementById('prep-instruction').innerHTML = "수액 준비 완료!<br>완성된 수액을 우측 IV 폴대에 걸어주세요.";
                    let ns1l = document.getElementById('item-ns1l'); 
                    ns1l.classList.add('drag-item'); 
                    ns1l.setAttribute('draggable', 'true'); 
                    ns1l.setAttribute('ondragstart', "drag(event, 'ready_fluid')"); 
                }
            }
        );
    } else {
        showWrongModal("🚨 오답입니다!<br><br>다시 고민해볼까요?");
        if (!quiz2bPenaltyApplied) {
            evaluation.step4 -= 10;
            quiz2bPenaltyApplied = true;
        }
    }
}

let quiz9bPenaltyApplied = false;
function checkQuiz9b(ans) {
    if (ans === 4) {
        document.getElementById('quiz9b-modal').style.display = 'none';
        showExplainModal(
            `<strong style="color: #2ecc71; font-size: 22px;">🎉 정답입니다!</strong>`,
            "카테터 내로 혈액이 역류되면 카테터의 삽입각도를<br>약간 낮추면서 카테터를 혈관으로 진입시킨 후,<br>카테터 길이만큼 탐침을 조금씩 빼내야 합니다.",
            () => {}
        );
    } else {
        showWrongModal("🚨 오답입니다!<br><br>다시 고민해볼까요?");
        applyPenalty("step5", "quiz9b", "• 퀴즈 12 (혈액 역류): 바늘에 피가 비칠 때의 각도 조절 및 카테터 진입 요령에 대한 오류가 있었습니다.");
    }
}

// 퀴즈 9-3 정답 확인
let quiz9cPenaltyApplied = false;
function checkQuiz9c(ans) {
    if (ans === 'X') {
        document.getElementById('quiz9c-modal').style.display = 'none';
        showExplainModal(
            `<strong style="color: #2ecc71; font-size: 22px;">🎉 정답입니다!</strong>`,
            "카테터를 잡지 않은 손으로 지혈대를 제거해야 합니다.",
            () => {}
        );
    } else {
        showWrongModal("🚨 오답입니다!<br><br>다시 고민해볼까요?");
        applyPenalty("step5", "quiz9c", "• 퀴즈 13 (지혈대 풀기): 카테터를 잡지 않은 다른 손으로 지혈대를 제거하는 방식에 오답이 있었습니다.");
    }
}

// 퀴즈 공통 해설 모달 열기/닫기 제어
let explainCallback = null;
function showExplainModal(title, text, callback) {
    document.getElementById("quiz-explain-title").innerHTML = title;
    document.getElementById("quiz-explain-text").innerHTML = text;
    explainCallback = callback;
    document.getElementById("quiz-explain-modal").style.display = "flex";
}

function closeQuizExplainModal() {
    document.getElementById("quiz-explain-modal").style.display = "none";
    if (explainCallback) {
        explainCallback();
        explainCallback = null;
    }
}

// 공통 오답 모달 닫기
let wrongModalTimeout = null;
function closeQuizWrongModal() {
    document.getElementById("quiz-wrong-modal").style.display = "none";
    const textEl = document.getElementById("quiz-wrong-text");
    if (textEl) {
        textEl.innerHTML = "다시 고민해볼까요?";
    }
    if (wrongModalTimeout) {
        clearTimeout(wrongModalTimeout);
        wrongModalTimeout = null;
    }
}

// 공통 오답 모달 커스텀 노출
function showWrongModal(customText) {
    const textEl = document.getElementById("quiz-wrong-text");
    if (textEl) {
        textEl.innerHTML = customText || "다시 고민해볼까요?";
    }
    const modal = document.getElementById("quiz-wrong-modal");
    modal.style.display = "flex";
    
    if (wrongModalTimeout) {
        clearTimeout(wrongModalTimeout);
    }
    wrongModalTimeout = setTimeout(() => {
        closeQuizWrongModal();
    }, 2500);
}

// 의료폐기물 분리수거 상태 일괄 검증
let wasteModalTimeout = null;
function checkWasteSeparation() {
    const isNeedleCorrect = (wasteDrops.needle === "sharps");
    const isSwabCorrect = (wasteDrops.swab === "general");
    const isSyringeCorrect = (wasteDrops.syringe === "general");
    
    const contentDiv = document.getElementById("waste-result-content");
    const nextBtn = document.getElementById("btn-waste-result-next");
    
    if (isNeedleCorrect && isSwabCorrect && isSyringeCorrect) {
        contentDiv.innerHTML = `<strong style="color: #2ecc71; font-size: 22px;">🎉 정답입니다!</strong><br><br>손상성 폐기물 전용용기(주사바늘)와 일반 의료폐기물 전용용기(소독솜, 주사기)를 구분하여 사용 물품 정리를 완료했습니다!`;
        nextBtn.innerText = "확인";
        nextBtn.style.display = "block";
        wasteSuccessState = true;
        
        document.getElementById("waste-result-modal").style.display = "flex";
    } else {
        contentDiv.innerHTML = `<strong style="color: #e74c3c; font-size: 22px;">🚨 오답입니다!</strong><br><br>다시 고민해볼까요?`;
        nextBtn.style.display = "none";
        wasteSuccessState = false;
        
        applyPenalty("step6", "waste", "• 폐기물 수거: 사용한 주사바늘(손상성 폐기물 용기) 및 소독솜/주사기(일반 의료폐기물 용기)의 올바른 분리배출이 미흡했습니다.");
        
        document.getElementById("waste-result-modal").style.display = "flex";
        
        if (wasteModalTimeout) {
            clearTimeout(wasteModalTimeout);
        }
        wasteModalTimeout = setTimeout(() => {
            closeWasteResultModal();
        }, 1000);
    }
}

// 폐기물 결과 모달 닫기 및 후속 조치
let wasteSuccessState = false;
function closeWasteResultModal() {
    document.getElementById("waste-result-modal").style.display = "none";
    if (wasteModalTimeout) {
        clearTimeout(wasteModalTimeout);
        wasteModalTimeout = null;
    }
    
    if (wasteSuccessState) {
        completeWasteAndShowChart();
    } else {
        // 틀린 물품 복구
        const isNeedleCorrect = (wasteDrops.needle === "sharps");
        const isSwabCorrect = (wasteDrops.swab === "general");
        const isSyringeCorrect = (wasteDrops.syringe === "general");
        
        if (!isNeedleCorrect) {
            document.getElementById("waste-needle").style.display = "block";
            wasteDrops.needle = null;
        }
        if (!isSwabCorrect) {
            document.getElementById("waste-swab").style.display = "block";
            wasteDrops.swab = null;
        }
        if (!isSyringeCorrect) {
            document.getElementById("waste-syringe").style.display = "block";
            wasteDrops.syringe = null;
        }
        
        document.getElementById("btn-waste-complete").style.display = "none";
    }
}

// 단순 퀴즈 정답 시 녹색 강조 후 0.8초 뒤 자동 넘김 처리
function handleSimpleQuizCorrect(modalId, clickedButton, callback) {
    if (clickedButton) {
        clickedButton.classList.add('correct-highlight');
    }
    
    const modal = document.getElementById(modalId);
    const buttons = modal.querySelectorAll('button, input[type="checkbox"]');
    buttons.forEach(b => {
        b.style.pointerEvents = 'none';
    });
    
    setTimeout(() => {
        modal.style.display = 'none';
        if (clickedButton) {
            clickedButton.classList.remove('correct-highlight');
        }
        buttons.forEach(b => {
            b.style.pointerEvents = '';
        });
        if (callback) callback();
    }, 800);
}

// 퀴즈 11 (고정 네임 라벨 작성) 정답 확인
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
        document.getElementById("quiz11-modal").style.display = "none";
        showExplainModal(
            `<strong style="color: #2ecc71; font-size: 22px;">🎉 정답입니다!</strong>`,
            "고정용 라벨에 삽입 날짜, 시간, 카테터 크기(규격)를<br>적어 부착합니다.<br><br>정맥주사 삽입이 완료되었습니다.<br>사용 물품 정리 및 기록 작성을 위해 이동합니다.",
            () => {
                showScene("phase-document", "flex");
            }
        );
    } else {
        showWrongModal();
        applyPenalty("step6", "quiz11", "• 퀴즈 16 (라벨 기재): 고정용 라벨에 삽입 날짜, 시간, 카테터 크기(규격)를 기재하는 과정에서 오류가 있었습니다.");
    }
}

// 퀴즈 12 (폐기물 정리 후 손위생) 정답 확인
let quiz12PenaltyApplied = false;
function checkQuiz12(ans) {
    if (ans === 3) {
        document.getElementById("quiz12-modal").style.display = "none";
        showExplainModal(
            `<strong style="color: #2ecc71; font-size: 22px;">🎉 정답입니다!</strong>`,
            "물품 정리 직후에는 물과 비누로 깨끗이 손위생을<br>실시하여 병원균 전파를 막습니다.<br><br>간호기록지를 작성해 주세요.",
            () => {
                document.querySelector(".waste-cleanup-box").style.display = "none";
                document.getElementById("chart-area").style.display = "block";
            }
        );
    } else {
        showWrongModal();
        applyPenalty("step6", "quiz12", "• 퀴즈 17 (정리 후 손위생): 물품 정리 정돈 직후 물과 비누를 활용한 손위생 수행 지식에 오답이 있었습니다.");
    }
}

// 수행 완료 자동 알림 모달 제어
function showStepNotify(text, duration = 2500) {
    document.getElementById("step-notify-text").innerHTML = text;
    const modal = document.getElementById("step-notify-modal");
    modal.style.display = "flex";
    
    setTimeout(() => {
        modal.style.display = "none";
    }, duration);
}
