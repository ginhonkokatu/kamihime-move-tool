const log = document.getElementById("log");

let nextId = 1;

// 現在のターン
let currentTurn = 1;

// 過去ターン編集中なら、そのターン番号を保存
// nullなら通常入力
let editingTurn = null;

// 行動を保存するリスト
let moves = [];

let draggedMoveId = null;

// 行動追加
function addMove(type, name, color = "") {

    // 過去ターン編集中ならそのターン、通常時は現在ターン
    const targetTurn = editingTurn ?? currentTurn;

    moves.push({
        id: Date.now() + Math.random(),
        turn: targetTurn,
        type: type,
        text: name,
        color: color,
        memo: ""
    });

    updateLog();

}

function addAbility(button, id, number) {

    const name = document.getElementById(id).value;

    const color = button.dataset.color || "";

    addMove(
      "ability",
      name + number + "アビ",
      button.dataset.color || ""
    );

}

function startTurnEdit(turn) {

    editingTurn = Number(turn);

    updateLog();

}

function endTurnEdit() {

    editingTurn = null;

    updateLog();

}

// 行動履歴を画面に表示
function updateLog() {

    log.innerHTML = "";

    const turnEditStatus = document.getElementById("turnEditStatus");
    const turnEditText = document.getElementById("turnEditText");

    if (turnEditStatus && turnEditText) {

        if (editingTurn !== null) {

            turnEditStatus.style.display = "block";

            turnEditText.textContent =
                `編集中：ターン${editingTurn} ／ 通常の進行：ターン${currentTurn}`;

        } else {

            turnEditStatus.style.display = "none";

        }

    }

    // アビリティ累計回数
    let abilityCount = {};

    // ターンごとにまとめる
    let turnMap = {};

    for (let i = 0; i < moves.length; i++) {

        let move = moves[i];

        if (!turnMap[move.turn]) {
            turnMap[move.turn] = [];
        }

        turnMap[move.turn].push(move);

    }

    // ターンごとに表示
    for (let turn of Object.keys(turnMap).sort((a, b) => Number(a) - Number(b))) {

        let turnAbilityCount = 0;

        let colorCount = {
          blue: 0,
         red: 0,
         yellow: 0,
         green: 0,
         other: 0
         };

        // まずこのターンのHTMLを作る
        let turnHtml = turnMap[turn].map(move => {

            let text = move.text;

            // 攻撃以外ならアビ回数を数える
            if (move.type === "ability") {

                turnAbilityCount++;

                if (colorCount[move.color] !== undefined) {
                 colorCount[move.color]++;
                 }

                if (!abilityCount[text]) {
                    abilityCount[text] = 0;
                }

                abilityCount[text]++;

                text += `（${abilityCount[text]}回目）`;

            }

                  return `
                    <div
    class="move ${move.color}"
    draggable="true"
    data-id="${move.id}"
    ondragstart="dragStart(${move.id})"
    ondragover="dragOver(event)"
    ondragenter="dragEnter(event)"
    ondragleave="dragLeave(event)"
    ondrop="dropMove(event, ${move.id})">

                      <span class="drag-handle">☰</span>

                         <span class="move-text">${text}</span>

                         <button onclick="editMemo(${move.id})">📝</button>
                         <button onclick="deleteMove(${move.id})">❌</button>

                          ${move.memo ? `<div class="memo">${move.memo}</div>` : ""}
                 </div>
                 `;

        }).join("");

        // HTMLが完成した後に表示
        log.innerHTML += `
    <div class="turn">

        <h3>
            ターン${turn}（アビ${turnAbilityCount}回）

            <br>

            🔵${colorCount.blue}
            🔴${colorCount.red}
            🟡${colorCount.yellow}
            🟢${colorCount.green}
            ⚫${colorCount.other}

        </h3>

        <button
            class="turn-edit-button"
            onclick="startTurnEdit(${turn})">
            ＋ このターンに追加
        </button>

        ${turnHtml}

    </div>
`;

    }

}

function undo() {

    if (moves.length === 0) return;

    // 最後の行動を取得
    let lastMove = moves[moves.length - 1];

    // 攻撃だったらターンを戻す
    if (
        lastMove.text === "バーストON攻撃" ||
        lastMove.text === "バーストOFF攻撃"
    ) {
        currentTurn--;
    }

    // 最後の行動を削除
    moves.pop();

    updateLog();

}

function resetLog() {

    moves = [];
    currentTurn = 1;
    editingTurn = null;

    updateLog();

}

function attack(isBurst) {

    if (isBurst) {
        addMove("attack", "バーストON攻撃");
    } else {
        addMove("attack", "バーストOFF攻撃");
    }

    // 通常入力のときだけ次のターンへ
    if (editingTurn === null) {
        currentTurn++;
    }

}

const colors = [
    "",
    "blue",
    "red",
    "yellow",
    "green",
    "other"
];

function changeColor(button) {

    let index = colors.indexOf(button.dataset.color);

    if (index === -1) index = 0;

    index++;

    if (index >= colors.length) {
        index = 0;
    }

    button.dataset.color = colors[index];

    button.className = "";

    if (colors[index] !== "") {
        button.classList.add(colors[index]);
    }

}

function deleteMove(id) {

    moves = moves.filter(move => move.id !== id);

    updateLog();

}

function editMemo(id) {

    const move = moves.find(move => move.id === id);

    if (!move) return;

    const memo = prompt("メモを入力", move.memo);

    if (memo !== null) {
        move.memo = memo;
        updateLog();
    }

}

function saveData() {

     const data = {
     currentTurn: currentTurn,
     moves: moves,
     hero: document.getElementById("hero").value,
     char1: document.getElementById("char1").value,
     char2: document.getElementById("char2").value,
     char3: document.getElementById("char3").value,
     char4: document.getElementById("char4").value,

    buttonColors: []
 };
 document.querySelectorAll(".buttons button").forEach(button => {

    data.buttonColors.push({
        color: button.dataset.color || ""
    });

});



    const json = JSON.stringify(data, null, 2);

    const blob = new Blob([json], { type: "application/json" });

    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");

    a.href = url;
    a.download = "神姫ムーブ.json";

    a.click();

    URL.revokeObjectURL(url);

}

function loadData(event) {

    const file = event.target.files[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = function(e) {

        const data = JSON.parse(e.target.result);

        currentTurn = data.currentTurn;
        moves = data.moves;
        editingTurn = null;

        document.getElementById("hero").value = data.hero;
        document.getElementById("char1").value = data.char1;
        document.getElementById("char2").value = data.char2;
        document.getElementById("char3").value = data.char3;
        document.getElementById("char4").value = data.char4;

const buttons = document.querySelectorAll(".buttons button");

buttons.forEach((button, index) => {

    button.dataset.color = "";

    button.classList.remove("blue", "red", "yellow", "green", "other");

    if (data.buttonColors[index]) {

        const color = data.buttonColors[index].color;

        button.dataset.color = color;

        if (color !== "") {
            button.classList.add(color);
        }

    }

});
        updateLog();

    };

    reader.readAsText(file);

}

function addSummon(id) {

    const name = document.getElementById(id).value;

    addMove("summon", name + "召喚");

}

function addFixedSummon(name) {

    addMove("summon", name + "召喚");

}

function addSummon(id) {

    const name = document.getElementById(id).value;

    if (name === "") return;

    addMove("summon", name + "召喚");

}

function dragStart(id) {

    draggedMoveId = id;

}

function dragOver(event) {

    event.preventDefault();

}

function dropMove(event, targetId) {

    event.preventDefault();

    event.currentTarget.classList.remove("drag-over");

    if (draggedMoveId === null) return;
    if (draggedMoveId === targetId) return;

    const draggedIndex = moves.findIndex(move => move.id === draggedMoveId);
    const targetIndex = moves.findIndex(move => move.id === targetId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    const draggedMove = moves[draggedIndex];
    const targetMove = moves[targetIndex];

    if (draggedMove.turn !== targetMove.turn) return;

    moves.splice(draggedIndex, 1);

    const newTargetIndex = moves.findIndex(move => move.id === targetId);

    moves.splice(newTargetIndex, 0, draggedMove);

    draggedMoveId = null;

    updateLog();

}

function dragEnter(event) {

    event.currentTarget.classList.add("drag-over");

}

function dragLeave(event) {

    event.currentTarget.classList.remove("drag-over");

}