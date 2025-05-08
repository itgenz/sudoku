// Game state
const game = {
    selectedNumber: null,
    selectedTile: null,
    errors: 0,
    maxErrors: Infinity,
    timer: {
        interval: null,
        seconds: 0
    },
    board: [],
    solution: [],
    difficulty: 2,
    gameOver: false,
    completedNumbers: new Set(),
    correctCells: new Set()
};

// Initialize game when page loads
window.onload = function() {
    setupEventListeners();
    initializeGame();
};

function setupEventListeners() {
    document.getElementById('new-game').addEventListener('click', initializeGame);
    document.getElementById('difficulty').addEventListener('change', function() {
        game.difficulty = parseInt(this.value);
        initializeGame();
    });
}

function initializeGame() {
    clearGameBoard();
    resetGameState();
    setupNumberSelection();
    generateSudokuBoard();
    startTimer();
}

function clearGameBoard() {
    document.getElementById('board').innerHTML = '';
    document.getElementById('digits').innerHTML = '';
    document.getElementById('board').classList.remove('game-over');
    document.getElementById('errors').classList.remove('error-limit');
}

function resetGameState() {
    game.selectedNumber = null;
    game.selectedTile = null;
    game.errors = 0;
    game.gameOver = false;
    game.completedNumbers.clear();
    game.correctCells.clear();
    
    clearInterval(game.timer.interval);
    game.timer.seconds = 0;
    document.getElementById('timer').textContent = 'Thời gian: 0s';
    
    switch(game.difficulty) {
        case 1: game.maxErrors = Infinity; break;
        case 2: game.maxErrors = 5; break;
        case 3: game.maxErrors = 3; break;
    }
    updateErrorDisplay();
}

function setupNumberSelection() {
    const digitsContainer = document.getElementById('digits');
    digitsContainer.innerHTML = '';
    
    for (let i = 1; i <= 9; i++) {
        const numberElement = document.createElement('div');
        numberElement.className = 'number';
        numberElement.id = `num-${i}`;
        numberElement.textContent = i;
        numberElement.addEventListener('click', () => selectNumber(i, numberElement));
        digitsContainer.appendChild(numberElement);
    }
}

function selectNumber(number, element) {
    if (game.gameOver) return;
    
    if (game.selectedNumber === number) {
        deselectNumber();
        return;
    }
    
    if (game.selectedNumber) {
        document.getElementById(`num-${game.selectedNumber}`).classList.remove('number-selected');
        clearHighlights();
    }
    
    game.selectedNumber = number;
    element.classList.add('number-selected');
    
    highlightNumberOnBoard(number);
    
    if (game.selectedTile) {
        const [row, col] = game.selectedTile.id.split('-').slice(1).map(Number);
        highlightRelatedTiles(row, col);
    }
}

function deselectNumber() {
    if (game.selectedNumber) {
        document.getElementById(`num-${game.selectedNumber}`).classList.remove('number-selected');
        game.selectedNumber = null;
        clearHighlights();
        
        if (game.selectedTile) {
            const [row, col] = game.selectedTile.id.split('-').slice(1).map(Number);
            highlightRelatedTiles(row, col);
        }
    }
}

function highlightNumberOnBoard(number) {
    document.querySelectorAll('.tile').forEach(tile => {
        tile.classList.remove('highlight-number');
        tile.classList.remove('selected-number-cell');
    });
    
    for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
            const tile = document.getElementById(`tile-${row}-${col}`);
            if (tile.textContent === number.toString()) {
                tile.classList.add('highlight-number');
            }
        }
    }
}

function generateSudokuBoard() {
    const solution = generateCompleteBoard();
    const puzzle = createPuzzleBoard(solution, game.difficulty);
    
    game.solution = solution;
    game.board = puzzle;
    
    renderBoard();
}

function generateCompleteBoard() {
    const board = Array(9).fill().map(() => Array(9).fill(0));
    
    function isValid(row, col, num) {
        for (let i = 0; i < 9; i++) {
            if (board[row][i] === num || board[i][col] === num) return false;
        }
        
        const boxRow = Math.floor(row / 3) * 3;
        const boxCol = Math.floor(col / 3) * 3;
        
        for (let r = 0; r < 3; r++) {
            for (let c = 0; c < 3; c++) {
                if (board[boxRow + r][boxCol + c] === num) return false;
            }
        }
        
        return true;
    }
    
    function fillBoard(row = 0, col = 0) {
        if (row === 9) return true;
        if (col === 9) return fillBoard(row + 1, 0);
        if (board[row][col] !== 0) return fillBoard(row, col + 1);
        
        const nums = shuffleArray([1, 2, 3, 4, 5, 6, 7, 8, 9]);
        
        for (const num of nums) {
            if (isValid(row, col, num)) {
                board[row][col] = num;
                if (fillBoard(row, col + 1)) return true;
                board[row][col] = 0;
            }
        }
        
        return false;
    }
    
    fillBoard();
    return board;
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function createPuzzleBoard(solution, difficulty) {
    const puzzle = solution.map(row => [...row]);
    const cellsToRemove = getCellsToRemove(difficulty);
    let removedCount = 0;
    
    while (removedCount < cellsToRemove) {
        const row = Math.floor(Math.random() * 9);
        const col = Math.floor(Math.random() * 9);
        
        if (puzzle[row][col] !== 0) {
            puzzle[row][col] = 0;
            removedCount++;
        }
    }
    
    return puzzle;
}

function getCellsToRemove(difficulty) {
    switch (difficulty) {
        case 1: return 40;  // Easy
        case 3: return 55;  // Hard
        default: return 50; // Medium
    }
}

function renderBoard() {
    const boardContainer = document.getElementById('board');
    boardContainer.innerHTML = '';
    
    for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
            const tile = document.createElement('div');
            tile.className = 'tile';
            tile.id = `tile-${row}-${col}`;
            
            if (row === 2 || row === 5) tile.classList.add('horizontal-line');
            if (col === 2 || col === 5) tile.classList.add('vertical-line');
            
            if (game.board[row][col] !== 0) {
                tile.textContent = game.board[row][col];
                tile.classList.add('tile-start');
            }
            
            tile.addEventListener('click', () => selectTile(row, col, tile));
            boardContainer.appendChild(tile);
        }
    }
}

function selectTile(row, col, tile) {
    if (game.gameOver) return;
    
    if (game.correctCells.has(`${row}-${col}`)) {
        return;
    }
    
    if (game.selectedTile) {
        game.selectedTile.classList.remove('selected-cell');
        clearHighlights();
    }
    
    game.selectedTile = tile;
    tile.classList.add('selected-cell');
    
    highlightRelatedTiles(row, col);
    
    if (game.selectedNumber !== null && !tile.classList.contains('tile-start')) {
        if (game.solution[row][col] === game.selectedNumber) {
            tile.textContent = game.selectedNumber;
            tile.classList.remove('error');
            tile.classList.add('correct-cell');
            game.correctCells.add(`${row}-${col}`);
            
            checkNumberCompletion(game.selectedNumber);
            
            if (checkWin()) {
                endGame(true);
            }
        } else {
            tile.textContent = game.selectedNumber;
            tile.classList.add('error');
            game.errors++;
            updateErrorDisplay();
            
            if (game.errors >= game.maxErrors) {
                endGame(false);
            }
        }
    }
}

function checkNumberCompletion(number) {
    let count = 0;
    for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
            const tile = document.getElementById(`tile-${row}-${col}`);
            if (parseInt(tile.textContent) === number && 
                (game.correctCells.has(`${row}-${col}`) || tile.classList.contains('tile-start'))) {
                count++;
            }
        }
    }
    
    if (count === 9) {
        game.completedNumbers.add(number);
        document.getElementById(`num-${number}`).classList.add('number-hidden');
        
        if (game.selectedNumber === number) {
            deselectNumber();
        }
    } else {
        game.completedNumbers.delete(number);
        document.getElementById(`num-${number}`).classList.remove('number-hidden');
    }
}

function updateErrorDisplay() {
    if (game.difficulty === 1) {
        document.getElementById('errors').textContent = `Lỗi: ${game.errors}/∞`;
    } else {
        document.getElementById('errors').textContent = `Lỗi: ${game.errors}/${game.maxErrors}`;
        
        if (game.errors >= game.maxErrors - 1) {
            document.getElementById('errors').classList.add('error-limit');
        }
    }
}

function highlightRelatedTiles(row, col) {
    clearHighlights();
    
    for (let i = 0; i < 9; i++) {
        document.getElementById(`tile-${row}-${i}`).classList.add('highlight');
        document.getElementById(`tile-${i}-${col}`).classList.add('highlight');
    }
    
    const boxRow = Math.floor(row / 3) * 3;
    const boxCol = Math.floor(col / 3) * 3;
    
    for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
            document.getElementById(`tile-${boxRow + r}-${boxCol + c}`).classList.add('highlight');
        }
    }
    
    if (game.selectedNumber) {
        highlightNumberOnBoard(game.selectedNumber);
    }
}

function clearHighlights() {
    document.querySelectorAll('.tile.highlight').forEach(tile => {
        tile.classList.remove('highlight');
    });
    document.querySelectorAll('.tile.highlight-number').forEach(tile => {
        tile.classList.remove('highlight-number');
        tile.classList.remove('selected-number-cell');
    });
}

function startTimer() {
    clearInterval(game.timer.interval);
    game.timer.seconds = 0;
    updateTimerDisplay();
    
    game.timer.interval = setInterval(() => {
        game.timer.seconds++;
        updateTimerDisplay();
    }, 1000);
}

function updateTimerDisplay() {
    document.getElementById('timer').textContent = `Thời gian: ${game.timer.seconds}s`;
}

function checkWin() {
    for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
            const tile = document.getElementById(`tile-${row}-${col}`);
            if (tile.textContent !== game.solution[row][col].toString()) {
                return false;
            }
        }
    }
    return true;
}

function endGame(isWin) {
    clearInterval(game.timer.interval);
    game.gameOver = true;
    document.getElementById('board').classList.add('game-over');
    
    if (isWin) {
        const time = game.timer.seconds;
        const errors = game.errors;
        
        setTimeout(() => {
            alert(`Chúc mừng! Bạn đã hoàn thành Sudoku trong ${time} giây với ${errors} lỗi.`);
        }, 100);
    } else {
        setTimeout(() => {
            alert(`Game over! Bạn đã vượt quá số lỗi cho phép (${game.maxErrors}).`);
        }, 100);
    }
}