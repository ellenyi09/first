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
            document.getElementById('patient-room-med-card').style.display = 'block'; 
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

// -------------------------------------------------------------
// [7] Phase 9: 환자 팔찌 및 투약카드 대조 교차 확인
// -------------------------------------------------------------
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
