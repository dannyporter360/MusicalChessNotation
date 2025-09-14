/**
 * Musical Chess Notation v2.2 Converter
 * Converts chess moves to Musical Chess Notation using hiragana and solfege
 */
export class MusicalChessNotation {
  constructor() {
    // File mappings (a-h to hiragana)
    this.files = {
      'a': 'た', 'b': 'ち', 'c': 'つ', 'd': 'て',
      'e': 'で', 'f': 'づ', 'g': 'ぢ', 'h': 'だ'
    };

    // Rank mappings (1-8 to solfege symbols)
    this.ranks = {
      '1': '●',   // Do
      '2': '╱',   // Re
      '3': '—',   // Mi
      '4': '╤',   // Fa
      '5': '○',   // So
      '6': 'Λ',   // La
      '7': '↑',   // Ti
      '8': '●̇'    // Do (upper)
    };

    // Piece mappings
    this.pieces = {
      'N': 'Ⓝ',  // Knight
      'B': 'Ⓑ',  // Bishop
      'R': 'Ⓡ',  // Rook
      'Q': 'Ⓠ',  // Queen
      'K': 'Ⓚ'   // King
    };

    this.resetBoard();
  }

  resetBoard() {
    // Initialize standard chess board
    this.board = [
      ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'],  // Rank 8
      ['p', 'p', 'p', 'p', 'p', 'p', 'p', 'p'],  // Rank 7
      ['.', '.', '.', '.', '.', '.', '.', '.'],  // Rank 6
      ['.', '.', '.', '.', '.', '.', '.', '.'],  // Rank 5
      ['.', '.', '.', '.', '.', '.', '.', '.'],  // Rank 4
      ['.', '.', '.', '.', '.', '.', '.', '.'],  // Rank 3
      ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'],  // Rank 2
      ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R']   // Rank 1
    ];
    this.moveCount = 0;
    this.isWhiteTurn = true;
  }

  squareToMusical(square) {
    if (square.length !== 2) return square;

    const file = square[0];
    const rank = square[1];

    if (this.files[file] && this.ranks[rank]) {
      return this.ranks[rank] + this.files[file];
    }
    return square;
  }

  canKnightMove(srcRank, srcFile, destRank, destFile) {
    const rankDiff = Math.abs(destRank - srcRank);
    const fileDiff = Math.abs(destFile - srcFile);
    return (rankDiff === 2 && fileDiff === 1) || (rankDiff === 1 && fileDiff === 2);
  }

  canBishopMove(srcRank, srcFile, destRank, destFile) {
    const rankDiff = Math.abs(destRank - srcRank);
    const fileDiff = Math.abs(destFile - srcFile);

    if (rankDiff !== fileDiff || rankDiff === 0) return false;

    // Check if path is clear
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

  canRookMove(srcRank, srcFile, destRank, destFile) {
    // Rook moves horizontally or vertically
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

  canQueenMove(srcRank, srcFile, destRank, destFile) {
    // Queen moves like rook or bishop
    return this.canRookMove(srcRank, srcFile, destRank, destFile) ||
           this.canBishopMove(srcRank, srcFile, destRank, destFile);
  }

  canKingMove(srcRank, srcFile, destRank, destFile) {
    // King moves one square in any direction
    const rankDiff = Math.abs(destRank - srcRank);
    const fileDiff = Math.abs(destFile - srcFile);
    return rankDiff <= 1 && fileDiff <= 1 && (rankDiff > 0 || fileDiff > 0);
  }

  canPieceReach(pieceType, srcRank, srcFile, destRank, destFile) {
    if (pieceType === 'N') {
      return this.canKnightMove(srcRank, srcFile, destRank, destFile);
    } else if (pieceType === 'B') {
      return this.canBishopMove(srcRank, srcFile, destRank, destFile);
    } else if (pieceType === 'R') {
      return this.canRookMove(srcRank, srcFile, destRank, destFile);
    } else if (pieceType === 'Q') {
      return this.canQueenMove(srcRank, srcFile, destRank, destFile);
    } else if (pieceType === 'K') {
      return this.canKingMove(srcRank, srcFile, destRank, destFile);
    }
    return true;
  }

  findPieceSource(move, pieceType, destFile, destRank) {
    const pieceChar = this.isWhiteTurn ? pieceType : pieceType.toLowerCase();

    // Extract hints from move string (e.g., Nbd2, R1e1)
    let sourceFileHint = null;
    let sourceRankHint = null;

    // Remove the piece type and look for disambiguation characters
    const withoutPiece = move.substring(1);

    for (let i = 0; i < withoutPiece.length; i++) {
      const char = withoutPiece[i];
      if ('abcdefgh'.includes(char)) {
        // Check if this is a file hint (not the destination file)
        const charFile = char.charCodeAt(0) - 'a'.charCodeAt(0);
        if (charFile !== destFile) {
          sourceFileHint = charFile;
        }
      } else if ('12345678'.includes(char)) {
        // Check if this is a rank hint (not the destination rank)
        const charRank = 8 - parseInt(char);
        if (charRank !== destRank) {
          sourceRankHint = charRank;
        }
      }
    }

    // Find all pieces of this type that could move to destination
    const candidates = [];
    for (let rank = 0; rank < 8; rank++) {
      for (let file = 0; file < 8; file++) {
        if (this.board[rank][file] === pieceChar) {
          // Apply hints if provided
          if (sourceFileHint !== null && file !== sourceFileHint) continue;
          if (sourceRankHint !== null && rank !== sourceRankHint) continue;

          // Check if the piece can actually reach the destination
          if (this.canPieceReach(pieceType, rank, file, destRank, destFile)) {
            candidates.push([rank, file]);
          }
        }
      }
    }

    return candidates.length > 0 ? candidates[0] : null;
  }

  parseAlgebraicMove(move) {
    const originalMove = move;
    move = move.trim();

    // Remove annotations
    move = move.replace(/[+#!?]+$/, '');

    // Handle castling
    if (move === 'O-O' || move === '0-0') {
      return { type: 'castle', side: 'kingside', original: originalMove };
    }
    if (move === 'O-O-O' || move === '0-0-0') {
      return { type: 'castle', side: 'queenside', original: originalMove };
    }

    // Determine if it's a capture
    const isCapture = move.includes('x');
    move = move.replace('x', '');

    // Determine piece type
    let pieceType = null;
    if ('NBRQK'.includes(move[0])) {
      pieceType = move[0];
      move = move.substring(1);
    }

    // Extract destination square
    const destMatch = move.match(/([a-h])([1-8])/);
    if (!destMatch) return null;

    const destFile = destMatch[1].charCodeAt(0) - 'a'.charCodeAt(0);
    const destRank = 8 - parseInt(destMatch[2]);

    // Find source square
    let srcRank, srcFile;
    if (pieceType) {
      const source = this.findPieceSource(originalMove, pieceType, destFile, destRank);
      if (source) {
        [srcRank, srcFile] = source;
      } else {
        return null;
      }
    } else {
      // Pawn move
      srcFile = destFile;
      if (isCapture && originalMove.length > 2) {
        // Pawn capture with file specified
        srcFile = originalMove[0].charCodeAt(0) - 'a'.charCodeAt(0);
      }

      // Find pawn on that file
      if (this.isWhiteTurn) {
        for (let rank = 7; rank >= 0; rank--) {
          if (this.board[rank][srcFile] === 'P') {
            srcRank = rank;
            break;
          }
        }
      } else {
        for (let rank = 0; rank < 8; rank++) {
          if (this.board[rank][srcFile] === 'p') {
            srcRank = rank;
            break;
          }
        }
      }
    }

    // Check if we found valid source coordinates
    if (srcRank === undefined || srcFile === undefined) {
      console.warn(`Could not determine source square for move: ${originalMove}`);
      return null;
    }

    return {
      pieceType,
      src: [srcRank, srcFile],
      dest: [destRank, destFile],
      isCapture,
      original: originalMove
    };
  }

  updateBoard(moveData) {
    if (!moveData || !moveData.src || !moveData.dest) return;

    const [srcRank, srcFile] = moveData.src;
    const [destRank, destFile] = moveData.dest;

    // Get the piece from source
    const piece = this.board[srcRank][srcFile];

    // Move piece
    this.board[destRank][destFile] = piece;
    this.board[srcRank][srcFile] = '.';
  }

  convertMove(move) {
    move = move.trim();

    // Handle castling
    if (move === 'O-O' || move === '0-0') {
      return '|●お';  // Kingside
    }
    if (move === 'O-O-O' || move === '0-0-0') {
      return '●|お';  // Queenside
    }

    // Check for special markers
    const check = move.includes('+');
    const mate = move.includes('#');

    // Parse the move
    const moveData = this.parseAlgebraicMove(move);
    if (!moveData || !moveData.src || !moveData.dest) {
      // If we can't parse it properly, return the original move
      console.warn(`Could not parse move: ${move}`);
      return move;
    }

    const { pieceType, src, dest, isCapture } = moveData;
    const [srcRank, srcFile] = src;
    const [destRank, destFile] = dest;

    // Convert to musical notation
    const srcSquare = String.fromCharCode(srcFile + 'a'.charCodeAt(0)) + (8 - srcRank);
    const destSquare = String.fromCharCode(destFile + 'a'.charCodeAt(0)) + (8 - destRank);

    const srcMusical = this.squareToMusical(srcSquare);
    const destMusical = this.squareToMusical(destSquare);

    // Build the musical move
    let result = '';

    // Add piece symbol if not a pawn
    if (pieceType) {
      result += (this.pieces[pieceType] || pieceType) + ' ';
    }

    // Add source square
    result += srcMusical;

    // Add capture symbol if needed
    if (isCapture) {
      result += ' ×';
    }

    // Add destination square
    result += ' ' + destMusical;

    // Add check/mate markers
    if (mate) {
      result += '#';
    } else if (check) {
      result += '+';
    }

    // Update board state
    this.updateBoard(moveData);

    return result.trim();
  }

  convertGame(movesText) {
    // Reset board for new game
    this.resetBoard();

    // Remove PGN headers (anything between square brackets)
    movesText = movesText.replace(/\[[^\]]*\]/g, '');

    // Remove comments and annotations
    movesText = movesText.replace(/\{[^}]*\}/g, '');

    // Remove excessive whitespace and newlines
    movesText = movesText.replace(/\s+/g, ' ').trim();

    // Split into individual moves
    const moves = [];
    const tokens = movesText.split(/\s+/);

    for (const token of tokens) {
      // Skip empty tokens
      if (!token.trim()) continue;

      // Skip move numbers and result markers
      if (/^\d+\.$/.test(token) || ['*', '1-0', '0-1', '1/2-1/2'].includes(token)) {
        continue;
      }

      // Handle moves like "1.e4"
      if (/^\d+\./.test(token)) {
        const parts = token.split('.');
        if (parts.length > 1 && parts[1].trim()) {
          moves.push(parts[1].trim());
        }
      } else {
        // Only add tokens that look like chess moves
        if (this.isValidChessMove(token.trim())) {
          moves.push(token.trim());
        }
      }
    }

    // Convert each move
    const movePairs = [];
    let currentPair = [];

    for (const move of moves) {
      if (move) {
        const musical = this.convertMove(move);
        currentPair.push({ pgn: move, musical });

        // Toggle turn
        this.isWhiteTurn = !this.isWhiteTurn;

        // Group moves into pairs
        if (currentPair.length === 2) {
          movePairs.push(currentPair);
          currentPair = [];
        }
      }
    }

    // Add incomplete pair if exists
    if (currentPair.length > 0) {
      movePairs.push(currentPair);
    }

    return movePairs;
  }

  isValidChessMove(token) {
    // Check if token looks like a valid chess move
    if (!token || token.length < 2) return false;

    // Castling
    if (/^O-O-?O?$/.test(token) || /^0-0-?0?$/.test(token)) return true;

    // Regular moves (piece + square, or just square for pawn moves)
    // Allow for captures (x), check (+), mate (#), and promotion (=)
    if (/^[KQRBN]?[a-h]?[1-8]?x?[a-h][1-8][+#]?$/.test(token)) return true;
    if (/^[KQRBN][a-h]?[1-8]?x?[a-h][1-8]=[QRBN][+#]?$/.test(token)) return true;

    return false;
  }

  formatOutput(movePairs) {
    const output = [];
    for (let i = 0; i < movePairs.length; i++) {
      const pair = movePairs[i];
      if (pair.length === 2) {
        const [white, black] = pair;
        output.push(`${i + 1}. ${white.musical}    ${black.musical}`);
      } else if (pair.length === 1) {
        const [white] = pair;
        output.push(`${i + 1}. ${white.musical}`);
      }
    }
    return output.join('\n');
  }
}