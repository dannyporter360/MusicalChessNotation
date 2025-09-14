# MCN Converter Logic - Technical Implementation

## Architecture Overview

The Musical Chess Notation converter consists of several core components working together to transform standard chess notation (PGN) into sung musical phrases (MCN).

---

## 🏗️ Core Classes

### `MusicalChessNotation` Class

Primary converter class handling all notation transformations.

```javascript
export class MusicalChessNotation {
  constructor() {
    // Initialize mapping tables
    this.files = { 'a': 'た', 'b': 'ち', ... };
    this.ranks = { '1': '●', '2': '╱', ... };
    this.pieces = { 'N': 'Ⓝ', 'B': 'Ⓑ', ... };

    this.resetBoard();
  }
}
```

### Key Data Structures

**File Mapping Table**
```javascript
this.files = {
  'a': 'た', 'b': 'ち', 'c': 'つ', 'd': 'て',
  'e': 'で', 'f': 'づ', 'g': 'ぢ', 'h': 'だ'
};
```

**Rank Mapping Table**
```javascript
this.ranks = {
  '1': '●',   // Do
  '2': '╱',   // Re
  '3': '—',   // Mi
  '4': '╤',   // Fa
  '5': '○',   // So
  '6': 'Λ',   // La
  '7': '↑',   // Ti
  '8': '●̇'    // Do (octave)
};
```

**Piece Symbol Table**
```javascript
this.pieces = {
  'N': 'Ⓝ',  // Knight
  'B': 'Ⓑ',  // Bishop
  'R': 'Ⓡ',  // Rook
  'Q': 'Ⓠ',  // Queen
  'K': 'Ⓚ'   // King
  // Pawns have no prefix symbol
};
```

---

## 🔄 Core Conversion Process

### 1. Square-to-Musical Conversion

```javascript
squareToMusical(square) {
  if (square.length !== 2) return square;

  const file = square[0];
  const rank = square[1];

  if (this.files[file] && this.ranks[rank]) {
    return this.ranks[rank] + this.files[file];
  }
  return square;
}
```

**Example:**
- Input: `"e4"`
- Process: `file='e'` → `'で'`, `rank='4'` → `'╤'`
- Output: `"╤で"` (Fa-de)

### 2. Move Parsing Algorithm

```javascript
parseMove(moveStr) {
  // Clean the move string
  let move = moveStr.replace(/[+#!?]/g, '').trim();

  // Handle special cases
  if (move === 'O-O' || move === 'O-O-O') {
    return this.handleCastling(move);
  }

  // Extract piece type (default to pawn)
  let pieceType = '';
  if (/^[NBRQK]/.test(move)) {
    pieceType = move[0];
    move = move.substring(1);
  }

  // Extract destination square
  const destMatch = move.match(/[a-h][1-8]$/);
  if (!destMatch) throw new Error(`Invalid move: ${moveStr}`);

  const destSquare = destMatch[0];
  // ... continue processing
}
```

### 3. Board State Management

The converter maintains a complete board state to resolve ambiguous moves:

```javascript
resetBoard() {
  this.board = [
    ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'],  // Rank 8 (black)
    ['p', 'p', 'p', 'p', 'p', 'p', 'p', 'p'],  // Rank 7 (black pawns)
    ['.', '.', '.', '.', '.', '.', '.', '.'],   // Empty squares
    ['.', '.', '.', '.', '.', '.', '.', '.'],
    ['.', '.', '.', '.', '.', '.', '.', '.'],
    ['.', '.', '.', '.', '.', '.', '.', '.'],
    ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'],  // Rank 2 (white pawns)
    ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R']   // Rank 1 (white)
  ];
}
```

### 4. Move Disambiguation Logic

When multiple pieces can reach the same square, the system resolves ambiguity:

```javascript
findPieceSource(move, pieceType, destFile, destRank) {
  const pieceChar = this.isWhiteTurn ? pieceType : pieceType.toLowerCase();

  // Look for pieces that can legally move to destination
  const possibleSources = [];

  for (let rank = 0; rank < 8; rank++) {
    for (let file = 0; file < 8; file++) {
      if (this.board[rank][file] === pieceChar) {
        if (this.canPieceReach(pieceType, rank, file, destRank, destFile)) {
          possibleSources.push({ rank, file });
        }
      }
    }
  }

  // Apply disambiguation rules
  return this.resolveAmbiguity(possibleSources, move, destFile, destRank);
}
```

---

## 🎯 Piece Movement Validation

### Knight Movement
```javascript
canKnightMove(srcRank, srcFile, destRank, destFile) {
  const rankDiff = Math.abs(destRank - srcRank);
  const fileDiff = Math.abs(destFile - srcFile);
  return (rankDiff === 2 && fileDiff === 1) || (rankDiff === 1 && fileDiff === 2);
}
```

### Bishop Movement
```javascript
canBishopMove(srcRank, srcFile, destRank, destFile) {
  const rankDiff = Math.abs(destRank - srcRank);
  const fileDiff = Math.abs(destFile - srcFile);

  // Must move diagonally
  if (rankDiff !== fileDiff || rankDiff === 0) return false;

  // Check path is clear
  const rankStep = destRank > srcRank ? 1 : -1;
  const fileStep = destFile > srcFile ? 1 : -1;

  let currentRank = srcRank + rankStep;
  let currentFile = srcFile + fileStep;

  while (currentRank !== destRank) {
    if (this.board[currentRank][currentFile] !== '.') return false;
    currentRank += rankStep;
    currentFile += fileStep;
  }
  return true;
}
```

### Rook Movement
```javascript
canRookMove(srcRank, srcFile, destRank, destFile) {
  // Must move horizontally or vertically
  if (srcRank !== destRank && srcFile !== destFile) return false;

  // Check if path is clear
  if (srcRank === destRank) {
    // Horizontal move
    const start = Math.min(srcFile, destFile) + 1;
    const end = Math.max(srcFile, destFile);
    for (let file = start; file < end; file++) {
      if (this.board[srcRank][file] !== '.') return false;
    }
  } else {
    // Vertical move
    const start = Math.min(srcRank, destRank) + 1;
    const end = Math.max(srcRank, destRank);
    for (let rank = start; rank < end; rank++) {
      if (this.board[rank][srcFile] !== '.') return false;
    }
  }
  return true;
}
```

---

## 🎼 Game Processing Pipeline

### 1. PGN Game Parsing
```javascript
convertGame(pgnText) {
  const moves = this.extractMovesFromPGN(pgnText);
  const convertedMoves = [];

  this.resetBoard();

  for (let i = 0; i < moves.length; i++) {
    try {
      const musicalMove = this.convertMove(moves[i]);
      convertedMoves.push(musicalMove);
    } catch (error) {
      console.error(`Error converting move ${moves[i]}:`, error);
      convertedMoves.push(moves[i]); // Fallback to original
    }
  }

  return convertedMoves;
}
```

### 2. Move-by-Move Conversion
```javascript
convertMove(moveStr) {
  const moveData = this.parseMove(moveStr);

  if (!moveData.source || !moveData.destination) {
    return moveStr; // Fallback for unparseable moves
  }

  // Convert to musical notation
  const sourceMusical = this.squareToMusical(moveData.source);
  const destMusical = this.squareToMusical(moveData.destination);

  let result = '';

  // Add piece prefix if not a pawn
  if (moveData.pieceType && this.pieces[moveData.pieceType]) {
    result += this.pieces[moveData.pieceType];
  }

  // Add source square
  result += sourceMusical;

  // Add arrow notation
  result += ' → ';

  // Add destination square
  result += destMusical;

  // Add special notation (check, mate, etc.)
  if (moveStr.includes('+')) result += '+';
  if (moveStr.includes('#')) result += '#';

  return result;
}
```

### 3. Output Formatting
```javascript
formatOutput(convertedMoves) {
  let output = '';
  let moveNumber = 1;

  for (let i = 0; i < convertedMoves.length; i += 2) {
    output += `${moveNumber}. `;

    // White move
    output += convertedMoves[i];

    // Black move (if exists)
    if (i + 1 < convertedMoves.length) {
      output += '  ' + convertedMoves[i + 1];
    }

    output += '\n';
    moveNumber++;
  }

  return output;
}
```

---

## 🔍 Error Handling & Validation

### Move Validation
```javascript
validateMove(moveStr) {
  // Basic format validation
  if (!moveStr || typeof moveStr !== 'string') {
    throw new Error('Invalid move format');
  }

  // Check for valid piece notation
  const pieceMatch = moveStr.match(/^[NBRQK]?/);
  if (pieceMatch && pieceMatch[0] && !this.pieces[pieceMatch[0]]) {
    throw new Error(`Unknown piece type: ${pieceMatch[0]}`);
  }

  // Check for valid square notation
  const squareMatch = moveStr.match(/[a-h][1-8]/g);
  if (!squareMatch || squareMatch.length === 0) {
    throw new Error('No valid squares found in move');
  }
}
```

### Graceful Degradation
```javascript
convertMoveWithFallback(moveStr) {
  try {
    return this.convertMove(moveStr);
  } catch (error) {
    console.warn(`Failed to convert move "${moveStr}":`, error.message);
    return moveStr; // Return original move as fallback
  }
}
```

---

## 🎵 Performance Integration

### Audio Synthesis Hooks
```javascript
// Interface for audio synthesis system
generateAudioData(musicalMove) {
  return {
    kana: this.extractKana(musicalMove),
    solfege: this.extractSolfege(musicalMove),
    pieceType: this.extractPieceType(musicalMove),
    rhythm: this.calculateRhythm(musicalMove),
    timing: this.calculateTiming(musicalMove)
  };
}
```

### Real-time Processing
```javascript
// Streaming conversion for real-time playback
*convertGameStream(pgnMoves) {
  this.resetBoard();

  for (const move of pgnMoves) {
    const converted = this.convertMove(move);
    const audioData = this.generateAudioData(converted);

    yield {
      original: move,
      musical: converted,
      audio: audioData,
      boardState: this.getBoardState()
    };
  }
}
```

---

## 🧪 Testing & Validation

### Unit Test Examples
```javascript
// Test basic square conversion
assert(mcn.squareToMusical('e4') === '╤で');
assert(mcn.squareToMusical('a1') === '●た');

// Test piece movement validation
assert(mcn.canKnightMove(0, 1, 2, 2) === true);  // Nb1-c3
assert(mcn.canKnightMove(0, 1, 1, 3) === false); // Invalid knight move

// Test move conversion
assert(mcn.convertMove('e4') === '╱で → ╤で');
assert(mcn.convertMove('Nf3') === 'Ⓝ●ぢ → —づ');
```

### Integration Testing
```javascript
// Test complete game conversion
const italianGame = "1. e4 e5 2. Nf3 Nc6 3. Bc4";
const converted = mcn.convertGame(italianGame);
assert(converted.length === 6); // 6 half-moves
assert(converted[0] === '╱で → ╤で'); // 1. e4
```

---

## 📊 Performance Considerations

### Optimization Strategies

1. **Board State Caching**: Avoid recalculating board positions
2. **Move Validation Memoization**: Cache piece movement calculations
3. **Unicode Handling**: Efficient string manipulation for Japanese characters
4. **Memory Management**: Prevent memory leaks in long games

### Complexity Analysis

- **Square Conversion**: O(1) - direct hash table lookup
- **Move Parsing**: O(n) where n = move string length
- **Piece Finding**: O(64) - worst case full board scan
- **Path Validation**: O(7) - maximum distance across board
- **Game Conversion**: O(m × 64) where m = number of moves

---

*This implementation provides a robust foundation for converting chess notation while maintaining the musical and cultural integrity of the MCN system.*