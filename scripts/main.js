
/* Classes*/
class Move{
  constructor(from, to, pieceType, captureFlag = false, castleFlag = false, doubleMoveFlag = false, enPassantFlag = false, promotionFlag = false, notation){
    this.from = from;
    this.to = to;
    this.pieceType = pieceType;
    this.captureFlag = captureFlag;
    this.castleFlag = castleFlag;
    this.doubleMoveFlag = doubleMoveFlag;
    this.enPassantFlag = enPassantFlag;
    this.promotionFlag = promotionFlag;
    this.notation = notation;
  }
}

/* global constants and variables*/
const gameContainer = document.getElementById("game");
const gameHistoryContainer = document.getElementById("game-history");
const promotionButton = document.getElementById("promotion-select-button");
const promotionPopUp = document.getElementById("promotion-pop-up");
const whiteTimer = document.getElementById("white-timer");
const blackTimer = document.getElementById("black-timer");
const START_POSITION = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const piecesToSymbolTable = {
  WPAWN: "♙",
  WKNIGHT: "♘",
  WBISHOP: "♗",
  WROOK: "♖",
  WQUEEN: "♕",
  WKING: "♔",

  BPAWN: "♟",
  BKNIGHT: "♞",
  BBISHOP: "♝",
  BROOK: "♜",
  BQUEEN: "♛",
  BKING: "♚",
}

let gameState = {
  pieces: {
    WPAWN: [],
    WKNIGHT: [],
    WBISHOP: [],
    WROOK: [],
    WQUEEN: [],
    WKING: [],
  
    BPAWN: [],
    BKNIGHT: [],
    BBISHOP: [],
    BROOK: [],
    BQUEEN: [],
    BKING: [],
  
    blackPieces: [],
    whitePieces: [],
    allPieces: [],
  },
  sideToMove: "W",
  moveCounter: 1,
  halfmoveCounter: 0,
  castlingRights: {
    whiteKingSide: false,
    whiteQueenSide: false,
    blackKingSide: false,
    blackQueenSide: false
  },
  enPassantSquare: -1
};
let gameEnd = false;
let repetionCounter = {}; // used to enforce the 3-move-repetition rule
let moveHistory = []; // keeps track of all previous positions
let selectedSquare = -1; // used for player input
let globalMovelist;
let moveHistoryPointer = 0; // keeps track of the currently displayed position
let whiteTime = 0;
let blackTime = 0;


/* Button fucntions */
// switch of black or white on the bottom of the board
// I probably made it way to complicated
// works by playing with a "rotate" class which the board
// After that comes the "hard" part of fixing the pieces and
// text for the file and ranks
document.getElementById("timer-toggle").addEventListener("click", (e) =>{
  if(e.target.checked){
    whiteTime = blackTime = 5 * 60 * 1000;
    whiteTimer.style.display = "inline";
    blackTimer.style.display = "inline";
  }else{
    whiteTimer.style.display = "none";
    blackTimer.style.display = "none";
  } 
})

document.getElementById("swap-side").addEventListener("click", swapSides);

document.getElementById("auto-swap").addEventListener("click", (e) =>{
  if(e.target.checked){
    const boardRotated = document.querySelector(".board").classList.contains("rotate");
    const movingSide = moveHistory.length % 2 === 0;
    if((boardRotated && movingSide) || (!boardRotated && !movingSide)){
      swapSides();
    }
  }
});

document.getElementById("options-menu-button").addEventListener("click", () =>{
  document.getElementById("options-menu").style.display = "flex";
});

document.getElementById("close-options-menu-button").addEventListener("click", ()=>{
  document.getElementById("options-menu").style.display = "none";
});

document.getElementById("restart").addEventListener("click", restart);

document.getElementById("new-game-button").addEventListener("click", () =>{
  restart();
});

document.getElementById("backwards").addEventListener("click", () =>{
  if(moveHistoryPointer > 0){
    moveHistoryPointer--;
    restoreGameState(moveHistory[moveHistoryPointer][1]);
    updateBoardUI();
    updateMoveHistoryHighlight()
    selectedSquare = -1;
    updateSelection();
  }
});
document.getElementById("forwards").addEventListener("click", () =>{
  if(moveHistoryPointer < moveHistory.length - 1){
    moveHistoryPointer++;
    restoreGameState(moveHistory[moveHistoryPointer][1]);
    updateBoardUI();
    updateMoveHistoryHighlight()
    selectedSquare = -1;
    updateSelection();
  }
});

/* Start Function */
window.onload = function(){
  createBoard();
  restart();

  setInterval(reduceTimer, 200);
}

/* Board related stuff */
function preserveGamaState(){
  let state = {
    pieces: {
      WPAWN: [...gameState.pieces.WPAWN],
      WKNIGHT: [...gameState.pieces.WKNIGHT],
      WBISHOP: [...gameState.pieces.WBISHOP],
      WROOK: [...gameState.pieces.WROOK],
      WQUEEN: [...gameState.pieces.WQUEEN],
      WKING: [...gameState.pieces.WKING],
    
      BPAWN: [...gameState.pieces.BPAWN],
      BKNIGHT: [...gameState.pieces.BKNIGHT],
      BBISHOP: [...gameState.pieces.BBISHOP],
      BROOK: [...gameState.pieces.BROOK],
      BQUEEN: [...gameState.pieces.BQUEEN],
      BKING: [...gameState.pieces.BKING],
    
      blackPieces: [...gameState.pieces.blackPieces],
      whitePieces: [...gameState.pieces.whitePieces],
      allPieces: [...gameState.pieces.allPieces],
    },
    sideToMove: gameState.sideToMove,
    moveCounter: gameState.moveCounter,
    halfmoveCounter: gameState.halfmoveCounter,
    castlingRights: {
      whiteKingSide: gameState.castlingRights.whiteKingSide,
      whiteQueenSide: gameState.castlingRights.whiteQueenSide,
      blackKingSide: gameState.castlingRights.blackKingSide,
      blackQueenSide: gameState.castlingRights.blackQueenSide
    },
    enPassantSquare: gameState.enPassantSquare
  };
  return state;
}

function restoreGameState(state){
  gameState.pieces.WPAWN = [...state.pieces.WPAWN];
  gameState.pieces.WKNIGHT = [...state.pieces.WKNIGHT];
  gameState.pieces.WBISHOP = [...state.pieces.WBISHOP];
  gameState.pieces.WROOK = [...state.pieces.WROOK];
  gameState.pieces.WQUEEN = [...state.pieces.WQUEEN];
  gameState.pieces.WKING = [...state.pieces.WKING];

  gameState.pieces.BPAWN = [...state.pieces.BPAWN];
  gameState.pieces.BKNIGHT = [...state.pieces.BKNIGHT];
  gameState.pieces.BBISHOP = [...state.pieces.BBISHOP];
  gameState.pieces.BROOK = [...state.pieces.BROOK];
  gameState.pieces.BQUEEN = [...state.pieces.BQUEEN];
  gameState.pieces.BKING = [...state.pieces.BKING];

  gameState.pieces.whitePieces = [...state.pieces.whitePieces];
  gameState.pieces.blackPieces = [...state.pieces.blackPieces];
  gameState.pieces.allPieces = [...state.pieces.allPieces];

  gameState.sideToMove = state.sideToMove;
  gameState.moveCounter = state.moveCounter;
  gameState.halfmoveCounter = state.halfmoveCounter;

  gameState.castlingRights.whiteKingSide = state.castlingRights.whiteKingSide;
  gameState.castlingRights.whiteQueenSide = state.castlingRights.whiteQueenSide;
  gameState.castlingRights.blackKingSide = state.castlingRights.blackKingSide;
  gameState.castlingRights.blackQueenSide = state.castlingRights.blackQueenSide;

  gameState.enPassantSquare = state.enPassantSquare;
}

/* Make Move */
function getMoves(){
  globalMovelist = generateLegalMoves(gameState.sideToMove);
}

function makeMove(move, isTest = false){
  // remove piece from original position
  gameState.pieces[move.pieceType].splice(gameState.pieces[move.pieceType].indexOf(move.from), 1);
  // handle capture cases and enPassant
  if(move.captureFlag){
    //enPassant
    if(move.enPassantFlag){
      if(move.pieceType.charAt(0) === "W"){
        //white
        gameState.pieces["BPAWN"].splice(gameState.pieces["BPAWN"].indexOf(move.to - 8),1);
      }else{
        //black
        gameState.pieces["WPAWN"].splice(gameState.pieces["WPAWN"].indexOf(move.to + 8),1);
      }
    }else{
      // normal capture
      // find out captured piece
      for(const el of Object.entries(gameState.pieces)){
        if(el[1].includes(move.to)){
          gameState.pieces[el[0]].splice(gameState.pieces[el[0]].indexOf(move.to),1);
          break;
        }
      }
      
    }
  }

  // handle promotion
  if(move.promotionFlag){
    gameState.pieces[move.promotionFlag].push(move.to);
  }else{
    // place to new position
    gameState.pieces[move.pieceType].push(move.to);
  }

  // doublePush cases
  if(move.doubleMoveFlag){
    if(move.pieceType.charAt(0) === "W"){
      gameState.enPassant = move.to - 8;
    }else{
      gameState.enPassant = move.to + 8;
    }
  }else{
    // reset enPassant
    gameState.enPassant = -1;
  }

  // castling 
  if(move.castleFlag){
    switch(move.to){
      case 1:
        gameState.pieces["WROOK"].splice(gameState.pieces["WROOK"].indexOf(0), 1);
        gameState.pieces["WROOK"].push(2);
        break;
      case 5:
        gameState.pieces["WROOK"].splice(gameState.pieces["WROOK"].indexOf(7), 1);
        gameState.pieces["WROOK"].push(4);
        break;
      case 57:
        gameState.pieces["BROOK"].splice(gameState.pieces["BROOK"].indexOf(56), 1);
        gameState.pieces["BROOK"].push(58);
        break;
      case 61:
        gameState.pieces["BROOK"].splice(gameState.pieces["BROOK"].indexOf(63), 1);
        gameState.pieces["BROOK"].push(60);
        break;
      }
  }
  // castling rights
  if(move.castleFlag){
    if(move.pieceType.charAt(0) === "W"){
      gameState.castlingRights["whiteKingSide"] = false;
      gameState.castlingRights["whiteQueenSide"] = false;
    }else{
      gameState.castlingRights["blackKingSide"] = false;
      gameState.castlingRights["blackQueenSide"] = false;
    }
  }else if(move.pieceType.includes("KING")){
    if(move.pieceType.charAt(0) === "W"){
      gameState.castlingRights["whiteKingSide"] = false;
      gameState.castlingRights["whiteQueenSide"] = false;
    }else{
      gameState.castlingRights["blackKingSide"] = false;
      gameState.castlingRights["blackQueenSide"] = false;
    }
  }else if(move.pieceType.includes("ROOK")){
    switch(move.from){
      case 0:
        gameState.castlingRights["whiteKingSide"] = false;
        break;
      case 7:
        gameState.castlingRights["whiteQueenSide"] = false;
        break;
      case 63:
        gameState.castlingRights["blackQueenSide"] = false;
        break;
      case 56:
        gameState.castlingRights["blackKingSide"] = false;
        break;
    }
  }

  if(isTest){
    gameState.sideToMove = gameState.sideToMove === "W" ? "B" : "W"; 
    updatePiecesArray();
  }
}

function prepareForNextMove(moveIndex){
  // check for notation ambiguous
  const ambiguousMoves = globalMovelist.filter( (el) =>{
    return el.notation === globalMovelist[moveIndex].notation;
  });
  if(ambiguousMoves.length > 1){
    // file disambiguous
    ambiguousMoves.forEach(element => {
      element.notation = element.notation.substring(0, 1) + squareToCoordinate(element.from)[0] + element.notation.substring(1, element.notation.length);
    });
    // check again - need a new array here because
    // removing elements from ambiguousMoves array
    // leads to a wrong solution
    let ambiguousTest = ambiguousMoves.filter( (el) =>{
      return el.notation === globalMovelist[moveIndex].notation;
    });
    if(ambiguousTest.length > 1){
      // rank disambiguous
      ambiguousMoves.forEach(element => {
        element.notation = element.notation.substring(0, 1) + squareToCoordinate(element.from)[1] + element.notation.substring(2, element.notation.length);
      });
      // check one last time - if it's still ambiguous, we use both file and rank
      ambiguousTest = globalMovelist.filter( (el) =>{
        return el.notation === globalMovelist[moveIndex].notation;
      });
      if(ambiguousTest.length > 1){
        // file and rank disambiguous - now it can't be ambiguous anymore
        ambiguousMoves.forEach(element => {
          element.notation = element.notation.substring(0, 1) + squareToCoordinate(element.from)[0] + element.notation.substring(1, element.notation.length);
        });
      }
   }
    console.log(ambiguousMoves)
  }

  // update side to move + update move counter
  if(gameState.sideToMove === "B"){
    gameState.sideToMove = "W";
    gameState.moveCounter++;
  }else{
    gameState.sideToMove = "B";
  }

  // update half move counter
  const type = globalMovelist[moveIndex].pieceType.substring(1);
  if(type === "PAWN" || globalMovelist[moveIndex].captureFlag){
    gameState.halfmove = 0;
  }else{
    gameState.halfmove++;
  }

  // update PiecesArrays
  updatePiecesArray();

  // check for 3 move repetition
  const pos = convertPosition();
  if(repetionCounter[pos]){
    repetionCounter[pos] += 1;
    if(repetionCounter[pos] >= 3){
      gameEnd = {
        end: "Draw",
        reason: "3-move-repetition" 
      };
    }
  }else{
    repetionCounter[pos] = 1;
  }
  
  // check for insufficient material
  if(globalMovelist[moveIndex].captureFlag && gameState.pieces["allPieces"].length <= 3){
    // if only one bishop or knight is left it's impossible to checkmate the opponent
    if(gameState.pieces["WPAWN"].length === 0 && gameState.pieces["BPAWN"].length === 0 &&
      gameState.pieces["WROOK"].length === 0 && gameState.pieces["BROOK"].length === 0 &&
      gameState.pieces["WQUEEN"].length === 0 && gameState.pieces["BQUEEN"].length === 0)
      {
        gameEnd = {
          end: "Draw",
          reason: "insufficient material"
        };
      }
  }

  // check 50 move rule
  if(gameState.halfmove >= 100){
    gameEnd = {
      end: "Draw",
      reason: "50-move-rule" 
    };
  }

  // update Movelist
  const move = globalMovelist[moveIndex];
  getMoves();

  // check for checks and checkmates
  const king = gameState.sideToMove+"KING";
  const testMove = new Move(gameState.pieces[king][0], 
    gameState.pieces[king][0], 
    king, 
    false,
    false,
    false,
    false,
    false,
    "testMove");

  const kingInCheck = isIllegal(testMove);
  if(kingInCheck){ // check
    if(globalMovelist.length === 0){ // checkmate
      move.notation += "#";
      gameEnd = {
        end: (gameState.sideToMove === "W" ? "Black" : "White") + " Won",
        reason: "by checkmate" 
      };
    }else{
      move.notation += "+";
    }
  }

  // check for stalemate
  if(!kingInCheck && globalMovelist.length === 0){
    gameEnd = {
      end: "Draw",
      reason: "Stalemate" 
    };
  }

  // add to move-history
  moveHistory.push([move.notation, preserveGamaState(), gameState.moveCounter]);
  updateMoveHistory();

  // update UI
  updateBoardUI();

  // check if gameEnd
  if(gameEnd){
    document.getElementById("winner").textContent = gameEnd.end;
    document.getElementById("reason").textContent = gameEnd.reason;
    document.getElementById("game-end-screen").style.display = "flex";
  }

  if(document.getElementById("auto-swap").checked && !gameEnd){
    const rotated = document.querySelector(".board").classList.contains("rotate");
    if((gameState.sideToMove === "B" && !rotated) || (gameState.sideToMove === "W" && rotated)){
      swapSides();
    }
  }
}

function isIllegal(move){
  // preserve board
  const board = preserveGamaState();
  const king = gameState.sideToMove + "KING";
  // make move
  makeMove(move, true);
  // get king position
  const kingSquare = gameState.pieces[king][0];
  // check if Illegal
  for(const m of generateMoveList(gameState.sideToMove)){
    if(m.captureFlag && m.to === kingSquare){
      restoreGameState(board);
      return true;
    }
  }
  // restore board  
  restoreGameState(board);
  return false;
}

/* Move Generation */
// takes the side to generate the moves for ("W" or "B")
function generateMoveList(side){
  let moveList = [];
  let moves = [];

  // currently need to do some extra step to
  // make sure I don't push an empty array
  // for some reason that caused an error

  // Pawn movement
  for(const pawn of gameState.pieces[side+"PAWN"]){
    moves = pawnMoves(pawn, side);
    if(moves){
      moveList.push(...moves);
    }
  }

  // Knight movement
  for(const knight of gameState.pieces[side+"KNIGHT"]){
    moves = knightMoves(knight, side);
    if(moves){
      moveList.push(...moves);
    }
  }

  // King movement
  for(const king of gameState.pieces[side+"KING"]){
    moves = kingMoves(king, side);
    if(moves){
      moveList.push(...moves);
    }
  }

  // rook movement
  for(const rook of gameState.pieces[side+"ROOK"]){
    moves = rookMoves(rook, side, side+"ROOK");
    if(moves){
      moveList.push(...moves);
    }
  }

  // bishop movement
  for(const bishop of gameState.pieces[side+"BISHOP"]){
    moves = bishopMoves(bishop, side, side+"BISHOP");
    if(moves){
      moveList.push(...moves);
    }
  }

  // queen movement
  for(const queen of gameState.pieces[side+"QUEEN"]){
    moves = queenMoves(queen, side);
    if(moves){
      moveList.push(...moves);
    }
  }
  return moveList;
}

function generateLegalMoves(side){
  let movelist = generateMoveList(side);
  // remove all illegal moves
  for(let i = 0; i < movelist.length; i++){
    if(isIllegal(movelist[i])){
      movelist.splice(i,1);
      // due to the way splice works, we have
      // to reduce i by 1 again, otherwise we will
      // skip some moves
      i--;
      continue;
    }
    // extra check for castling moves
    // since they can't go through "checks"
    // worst way of checking I have ever done

    if(movelist[i].castleFlag){
      let legal = false;
      for(let j = 0; j < movelist.length; j++){
        if(movelist[i].pieceType === movelist[j].pieceType && (((movelist[i].to + movelist[i].from) / 2) === movelist[j].to)){
          legal = true;
          break;
        }
      }
      // used to check if the king is in check, by letting the king move in-place
      // this is needed because you can't castle if you're in check
      const testMove = new Move(movelist[i].from, 
        movelist[i].from, 
        movelist[i].pieceType, 
        false,
        false,
        false,
        false,
        false,
        "testMove");

      if(!legal || isIllegal(testMove)){
        movelist.splice(i,1);
        i--;
      }
    }
  }
  return movelist;
}

function queenMoves(queenSquare, side){
  let tmp2;
  let tmp;

  tmp = bishopMoves(queenSquare, side, side+"QUEEN");
  tmp2 = rookMoves(queenSquare, side, side+"QUEEN");
  return tmp.concat(tmp2);
}

// has an extra argument because it is reused for queen moves 
function bishopMoves(bishopSquare, side ,piece){
  const movement = [-9, -7, 7, 9];
  let moves = [];
  
  for(let i = 0; i < movement.length; i++){
    let targetSquare = bishopSquare + movement[i];
    if(Math.abs(Math.floor(bishopSquare / 8) - Math.floor((targetSquare) / 8)) !== 1){
      continue;
    }
    // check if targetSquare is within board and not occupied by a friendly piece 
    while(targetSquare >= 0 && targetSquare < 64 &&
      !gameState.pieces[side === "W" ? "whitePieces" : "blackPieces"].includes(targetSquare)
    )
    {
      const enemyPieceOnTargetSquare = gameState.pieces[side === "W" ? "blackPieces" : "whitePieces"].includes(targetSquare);
      moves.push(new Move(bishopSquare, 
        targetSquare, 
        piece, 
        enemyPieceOnTargetSquare,
        false,
        false,
        false,
        false,
        piece.charAt(1) + (enemyPieceOnTargetSquare ? "x" : "") + squareToCoordinate(targetSquare)));

      // if the move was a capture the bishop can no longer move along this way
      // also checks if bishop has reached the left or right end of the board
      if(enemyPieceOnTargetSquare || Math.abs(Math.floor(targetSquare / 8) - Math.floor((targetSquare + movement[i]) / 8)) !== 1){
        break;
      }
      targetSquare += movement[i];
    }
  }
  return moves;
}

// has an extra argument because it is reused for queen moves
function rookMoves(rookSquare, side, piece){
  const movement = [1, -1, 8, -8];
  let moves = [];
  let targetSquare;

  // <---
  targetSquare = rookSquare + 1;
  while(!(side === "W" ? gameState.pieces.whitePieces : gameState.pieces.blackPieces).includes(targetSquare)
    && (Math.floor(rookSquare / 8) === Math.floor(targetSquare / 8))
    && targetSquare >= 0 && targetSquare < 64){

    const enemyPieceOnTargetSquare = gameState.pieces[side === "W" ? "blackPieces" : "whitePieces"].includes(targetSquare);
    moves.push(new Move(rookSquare, 
      targetSquare, 
      piece, 
      enemyPieceOnTargetSquare,
      false,
      false,
      false,
      false,
      piece.charAt(1) + (enemyPieceOnTargetSquare ? "x" : "") + squareToCoordinate(targetSquare)));
    
    if(enemyPieceOnTargetSquare){
      break;
    }
    targetSquare += 1;
  }
  // --->
  targetSquare = rookSquare - 1;
  while( !(side === "W" ? gameState.pieces.whitePieces : gameState.pieces.blackPieces).includes(targetSquare)
    && (Math.floor(rookSquare / 8) === Math.floor(targetSquare / 8))
    && targetSquare >= 0 && targetSquare < 64){

    const enemyPieceOnTargetSquare = gameState.pieces[side === "W" ? "blackPieces" : "whitePieces"].includes(targetSquare);
    moves.push(new Move(rookSquare, 
      targetSquare, 
      piece, 
      enemyPieceOnTargetSquare,
      false,
      false,
      false,
      false,
      piece.charAt(1) + (enemyPieceOnTargetSquare ? "x" : "") + squareToCoordinate(targetSquare)));
    
    if(enemyPieceOnTargetSquare){
      break;
    }
    targetSquare -= 1;
  }
  // ↑
  targetSquare = rookSquare + 8;
  while( !(side === "W" ? gameState.pieces.whitePieces : gameState.pieces.blackPieces).includes(targetSquare)
    && targetSquare >= 0 && targetSquare < 64){

    const enemyPieceOnTargetSquare = gameState.pieces[side === "W" ? "blackPieces" : "whitePieces"].includes(targetSquare);
    moves.push(new Move(rookSquare, 
      targetSquare, 
      piece, 
      enemyPieceOnTargetSquare,
      false,
      false,
      false,
      false,
      piece.charAt(1) + (enemyPieceOnTargetSquare ? "x" : "") + squareToCoordinate(targetSquare)));
    
    if(enemyPieceOnTargetSquare){
      break;
    }
    targetSquare += 8;
  }
  // ↓
  targetSquare = rookSquare - 8;
  while( !(side === "W" ? gameState.pieces.whitePieces : gameState.pieces.blackPieces).includes(targetSquare)
    && targetSquare >= 0 && targetSquare < 64){

    const enemyPieceOnTargetSquare = gameState.pieces[side === "W" ? "blackPieces" : "whitePieces"].includes(targetSquare);
    moves.push(new Move(rookSquare, 
      targetSquare, 
      piece, 
      enemyPieceOnTargetSquare,
      false,
      false,
      false,
      false,
      piece.charAt(1) + (enemyPieceOnTargetSquare ? "x" : "") + squareToCoordinate(targetSquare)));
    
    if(enemyPieceOnTargetSquare){
      break;
    }
    targetSquare -= 8;
  }

  return moves;
}

function kingMoves(kingSquare, side){
  let moves = [];
  const movement = [9, 1, -7, // left
                    8, -8, // middle
                    7, -1, -9] // right
  const start = ((kingSquare - 7) % 8 == 0) ? 3 : 0;
  const end = (kingSquare % 8 == 0) ? 4 : 7;

  for(let i = start; i <= end ;i++){
    const targetSquare = kingSquare + movement[i];
    // check if targetSquare is within board and not occupied by a friendly piece
    if(targetSquare >= 0 && targetSquare < 64 &&
      !gameState.pieces[side === "W" ? "whitePieces" : "blackPieces"].includes(targetSquare)
    ){
      const enemyPieceOnTargetSquare = gameState.pieces[side === "W" ? "blackPieces" : "whitePieces"].includes(targetSquare);
      moves.push(new Move(kingSquare, 
        targetSquare, 
        side+"KING", 
        enemyPieceOnTargetSquare,
        false,
        false,
        false,
        false,
        "K" + (enemyPieceOnTargetSquare ? "x" : "") +  squareToCoordinate(targetSquare)));
    }
  }

  // handling castling
  if(side === "W"){
    // white side

    // king side
    if(gameState.castlingRights["whiteKingSide"] && !gameState.pieces["allPieces"].includes(2) && !gameState.pieces["allPieces"].includes(1)
      && gameState.pieces["WROOK"].includes(0)){
      moves.push(new Move(kingSquare,
        1, 
        "WKING", 
        false,
        true,
        false,
        false,
        false,
        "O-O"));
    }
    // queen side
    if(gameState.castlingRights["whiteQueenSide"] && 
      !gameState.pieces["allPieces"].includes(4) && !gameState.pieces["allPieces"].includes(5) && !gameState.pieces["allPieces"].includes(6)
      && gameState.pieces["WROOK"].includes(7)){
      moves.push(new Move(kingSquare,
        5, 
        "WKING", 
        false,
        true,
        false,
        false,
        false,
        "O-O-O"));
    }
  }else{
    // black side

    // king side
    if(gameState.castlingRights["blackKingSide"] && !gameState.pieces["allPieces"].includes(58) && !gameState.pieces["allPieces"].includes(57)
      && gameState.pieces["BROOK"].includes(56)){
      moves.push(new Move(kingSquare,
        57, 
        "BKING", 
        false,
        true,
        false,
        false,
        false,
        "O-O"));
    }
    // queen side
    if(gameState.castlingRights["blackQueenSide"] && 
      !gameState.pieces["allPieces"].includes(62) && !gameState.pieces["allPieces"].includes(61) && !gameState.pieces["allPieces"].includes(60)
      && gameState.pieces["BROOK"].includes(63)){
      moves.push(new Move(kingSquare,
        61, 
        "BKING", 
        false,
        true,
        false,
        false,
        false,
        "O-O-O"));
    }
  }
  return moves;
}

function knightMoves(knightSquare, side){       
  let moves = []; 
  const movement = [10,-6,  // far left  
                    17,-15, // left 
                    15,-17,  // right 
                    6,-10]; // far right
  // handle knights on the A,B,G,H File
  const start = ((knightSquare - 7) % 8 == 0) ? 4 : ((knightSquare - 6) % 8 == 0) ? 2 : 0;
  const end = (knightSquare % 8 == 0) ? 3 : ((knightSquare - 1) % 8 == 0) ? 5 : 7;
  for(let i = start; i <= end; i++){
    const targetSquare = knightSquare + movement[i];
    // check if targetSquare is within board and not occupied by a friendly piece
    if(targetSquare >= 0 && targetSquare < 64 &&
      !gameState.pieces[side === "W" ? "whitePieces" : "blackPieces"].includes(targetSquare)
    ){
      const enemyPieceOnTargetSquare = gameState.pieces[side === "W" ? "blackPieces" : "whitePieces"].includes(targetSquare);
      moves.push(new Move(knightSquare, 
        targetSquare, 
        side+"KNIGHT", 
        enemyPieceOnTargetSquare,
        false,
        false,
        false,
        false,
        "N" + (enemyPieceOnTargetSquare ? "x" : "") + squareToCoordinate(targetSquare)));
    }
  }
  return moves;
}

function pawnMoves(pawnSquare, side){
  let moves = [];
  let targetSquare;
  
  if(side === "W"){ 
    // white Pawn moves

    // one move forward
    targetSquare = pawnSquare + 8;
    if(!gameState.pieces["allPieces"].includes(targetSquare)){
      if(targetSquare > 55){
        // Promotion
        moves.push(new Move(pawnSquare, targetSquare, "WPAWN", false, false, false, false, "WBISHOP", squareToCoordinate(targetSquare) +"=B"));
        moves.push(new Move(pawnSquare, targetSquare, "WPAWN", false, false, false, false, "WROOK", squareToCoordinate(targetSquare) +"=R"));
        moves.push(new Move(pawnSquare, targetSquare, "WPAWN", false, false, false, false, "WKNIGHT", squareToCoordinate(targetSquare) +"=N"));
        moves.push(new Move(pawnSquare, targetSquare, "WPAWN", false, false, false, false, "WQUEEN", squareToCoordinate(targetSquare) +"=Q"));
      }else{ 
        // no Promotion
        moves.push(new Move(pawnSquare, targetSquare, "WPAWN", false, false, false, false, false, squareToCoordinate(targetSquare)));
        
        // two move forward
        targetSquare = pawnSquare + 16;
        if(!gameState.pieces["allPieces"].includes(targetSquare) && pawnSquare < 16){
          moves.push(new Move(pawnSquare, targetSquare, "WPAWN", false, false, true, false, false, squareToCoordinate(targetSquare)));
        }
      }
      
    }
    // captures and en passant
    // capture to the right (h-file special case)
    targetSquare = pawnSquare + 7;
    if((gameState.pieces["blackPieces"].includes(targetSquare) || gameState.enPassant === targetSquare) && pawnSquare % 8 !== 0){
      if(targetSquare > 55){
        //Promotion - doesn't check for enPassant since Promotion and enPassant can't happend together
        moves.push(new Move(pawnSquare, targetSquare, "WPAWN", true, false, false, false, "WBISHOP", 
          squareToCoordinate(pawnSquare)[0] + "x" + squareToCoordinate(targetSquare) + "=B"));
        moves.push(new Move(pawnSquare, targetSquare, "WPAWN", true, false, false, false, "WROOK", 
          squareToCoordinate(pawnSquare)[0] + "x" + squareToCoordinate(targetSquare) + "=R"));
        moves.push(new Move(pawnSquare, targetSquare, "WPAWN", true, false, false, false, "WKNIGHT", 
          squareToCoordinate(pawnSquare)[0] + "x" + squareToCoordinate(targetSquare) + "=N"));
        moves.push(new Move(pawnSquare, targetSquare, "WPAWN", true, false, false, false, "WQUEEN", 
          squareToCoordinate(pawnSquare)[0] + "x" + squareToCoordinate(targetSquare) + "=Q"));
      }else{
        //no Promotion
        moves.push(new Move(pawnSquare, targetSquare, "WPAWN", true, false, false, gameState.enPassant === targetSquare, false, 
          squareToCoordinate(pawnSquare)[0] + "x" + squareToCoordinate(targetSquare)));
      }

    }
    // capture to the left (a-file special case)
    targetSquare = pawnSquare + 9;
    if((gameState.pieces["blackPieces"].includes(targetSquare) || gameState.enPassant === targetSquare) && (pawnSquare - 7) % 8 !== 0){ 
      if(targetSquare > 55){
        //Promotion
        moves.push(new Move(pawnSquare, targetSquare, "WPAWN", true, false, false, false, "WBISHOP",
          squareToCoordinate(pawnSquare)[0] + "x" + squareToCoordinate(targetSquare) + "=B"));
        moves.push(new Move(pawnSquare, targetSquare, "WPAWN", true, false, false, false, "WROOK",
          squareToCoordinate(pawnSquare)[0] + "x" + squareToCoordinate(targetSquare) + "=R"));
        moves.push(new Move(pawnSquare, targetSquare, "WPAWN", true, false, false, false, "WKNIGHT",
          squareToCoordinate(pawnSquare)[0] + "x" + squareToCoordinate(targetSquare) + "=N"));
        moves.push(new Move(pawnSquare, targetSquare, "WPAWN", true, false, false, false, "WQUEEN",
          squareToCoordinate(pawnSquare)[0] + "x" + squareToCoordinate(targetSquare) + "=Q"));
      }else{
        //no Promotion
        moves.push(new Move(pawnSquare, targetSquare, "WPAWN", true, false, false, gameState.enPassant === targetSquare, false,
          squareToCoordinate(pawnSquare)[0] + "x" + squareToCoordinate(targetSquare)));
      }

    }
  }else{ 
    // black pawn moves

    // one move forward
    targetSquare = pawnSquare - 8;
    if(!gameState.pieces["allPieces"].includes(targetSquare)){
      if(targetSquare < 8){
        // Promotion
        moves.push(new Move(pawnSquare, targetSquare, "BPAWN", false, false, false, false, "BBISHOP", squareToCoordinate(targetSquare) + "=B"));
        moves.push(new Move(pawnSquare, targetSquare, "BPAWN", false, false, false, false, "BROOK", squareToCoordinate(targetSquare) + "=R"));
        moves.push(new Move(pawnSquare, targetSquare, "BPAWN", false, false, false, false, "BKNIGHT", squareToCoordinate(targetSquare) + "=N"));
        moves.push(new Move(pawnSquare, targetSquare, "BPAWN", false, false, false, false, "BQUEEN", squareToCoordinate(targetSquare) + "=Q"));
      }else{
        //no Promotion
        moves.push(new Move(pawnSquare, targetSquare, "BPAWN", false, false, false, false, false, squareToCoordinate(targetSquare)));
        // two move forward
        targetSquare = pawnSquare - 16;
        if(!gameState.pieces["allPieces"].includes(targetSquare) && pawnSquare > 47){
          moves.push(new Move(pawnSquare, targetSquare, "BPAWN", false, false, true, false, false, squareToCoordinate(targetSquare)));
        }
      }
    }
    // captures and en passant and promotion
    // capture to the right (h-file special case)
    targetSquare = pawnSquare - 9;
    if((gameState.pieces["whitePieces"].includes(targetSquare) || gameState.enPassant === targetSquare) && pawnSquare % 8 !== 0){ 
      if(targetSquare < 8){
        // Promotion
        moves.push(new Move(pawnSquare, targetSquare, "BPAWN", true, false, false, false, "BBISHOP",
          squareToCoordinate(pawnSquare)[0] + "x" + squareToCoordinate(targetSquare) + "=B"));
        moves.push(new Move(pawnSquare, targetSquare, "BPAWN", true, false, false, false, "BROOK",
          squareToCoordinate(pawnSquare)[0] + "x" + squareToCoordinate(targetSquare) + "=R"));
        moves.push(new Move(pawnSquare, targetSquare, "BPAWN", true, false, false, false, "BKNIGHT",
          squareToCoordinate(pawnSquare)[0] + "x" + squareToCoordinate(targetSquare) + "=N"));
        moves.push(new Move(pawnSquare, targetSquare, "BPAWN", true, false, false, false, "BQUEEN",
          squareToCoordinate(pawnSquare)[0] + "x" + squareToCoordinate(targetSquare) + "=Q"));
      }else{
        // no Promotion
        moves.push(new Move(pawnSquare, targetSquare, "BPAWN", true, false, false, gameState.enPassant === targetSquare, false,
          squareToCoordinate(pawnSquare)[0] + "x" + squareToCoordinate(targetSquare)));
      }

    }
    // capture to the left (a-file special case)
    targetSquare = pawnSquare - 7;
    if((gameState.pieces["whitePieces"].includes(targetSquare) || gameState.enPassant === targetSquare) && (pawnSquare - 7) % 8 !== 0){ 
      if(targetSquare < 8){
        // Promotion
        moves.push(new Move(pawnSquare, targetSquare, "BPAWN", true, false, false, false, "BBISHOP",
          squareToCoordinate(pawnSquare)[0] + "x" + squareToCoordinate(targetSquare) + "=B"));
        moves.push(new Move(pawnSquare, targetSquare, "BPAWN", true, false, false, false, "BROOK",
          squareToCoordinate(pawnSquare)[0] + "x" + squareToCoordinate(targetSquare) + "=R"));
        moves.push(new Move(pawnSquare, targetSquare, "BPAWN", true, false, false, false, "BKNIGHT",
          squareToCoordinate(pawnSquare)[0] + "x" + squareToCoordinate(targetSquare) + "=N"));
        moves.push(new Move(pawnSquare, targetSquare, "BPAWN", true, false, false, false, "BQUEEN",
          squareToCoordinate(pawnSquare)[0] + "x" + squareToCoordinate(targetSquare) + "=Q"));
      }else{
        // no Promotion
        moves.push(new Move(pawnSquare, targetSquare, "BPAWN", true, false, false, gameState.enPassant === targetSquare, false,
          squareToCoordinate(pawnSquare)[0] + "x" + squareToCoordinate(targetSquare)));
      }
    }
  }
  return moves;
}

/* Functions for position related stuff */
// takes the square-number(0-63) and
// turns it into the coordinate (a1,a2 ... h7,h8)
function squareToCoordinate(square){
  return String.fromCharCode(104 - square % 8) + Math.ceil((square + 1) / 8).toString();
}

// takes the coordinate and returns the square-number
function coordinateToSquare(coor){
  return (Number(coor[1]) * 8) - (coor.charCodeAt(0) - 96);
}

function loadPositionFromFEN(str){
  const list = str.split(" ");
  
  // side to move
  gameState.sideToMove = list[1].toUpperCase();

  // castling rights
  for(let i = 0; i < list[2].length; i++){
    switch(list[2][i]){
      case "K":
        gameState.castlingRights["whiteKingSide"] = true;
        break;
      case "Q":
        gameState.castlingRights["whiteQueenSide"] = true;
        break;
      case "k":
        gameState.castlingRights["blackKingSide"] = true;
        break;
      case "q":
        gameState.castlingRights["blackQueenSide"] = true;
        break;
    }
  }

  // en passant
  gameState.enPassantSquare = list[3] === "-" ? -1 : coordinateToSquare(list[3]);

  // halfmove counter - used to handle the 50 move rule
  gameState.halfmoveCounter = Number(list[4]);

  // move counter
  gameState.moveCounter = Number(list[5]);

  // position
  const pos = list[0];
  let s = 63;
  for(let i = 0; i < pos.length; i++){
    switch(pos[i]){
      case 'P':
        gameState.pieces["WPAWN"].push(s)
        s--;
        break;
      case 'R':
        gameState.pieces["WROOK"].push(s)
        s--;
        break;
      case 'B':
        gameState.pieces["WBISHOP"].push(s)
        s--;
        break;
      case 'N':
        gameState.pieces["WKNIGHT"].push(s)
        s--;
        break;
      case 'Q':
        gameState.pieces["WQUEEN"].push(s)
        s--;
        break;
      case 'K':
        gameState.pieces["WKING"].push(s)
        s--;
        break;
      case 'p':
        gameState.pieces["BPAWN"].push(s)
        s--;
        break;
      case 'r':
        gameState.pieces["BROOK"].push(s)
        s--;
        break;
      case 'b':
        gameState.pieces["BBISHOP"].push(s)
        s--;
        break;
      case 'n':
        gameState.pieces["BKNIGHT"].push(s)
        s--;
        break;
      case 'q':
        gameState.pieces["BQUEEN"].push(s)
        s--;
        break;
      case 'k':
        gameState.pieces["BKING"].push(s)
        s--;
        break;
      case pos[i].match(/\d/)?.input: 
        s -= Number(pos[i]);
        continue;
    }
  }
  updatePiecesArray();
}

function clearPieces(){
  gameState.pieces = {
    WPAWN: [],
    WKNIGHT: [],
    WBISHOP: [],
    WROOK: [],
    WQUEEN: [],
    WKING: [],
  
    BPAWN: [],
    BKNIGHT: [],
    BBISHOP: [],
    BROOK: [],
    BQUEEN: [],
    BKING: [],
  
    blackPieces: [],
    whitePieces: [],
    allPieces: [],
  }
}


/* this function converts the current position
into a string that can be used to compare with other
positions to enforce the 3-move-repetition rule
*/
function convertPosition(){
  let str = "";
  const pieces = Object.entries(gameState.pieces).slice(0,12);
  for(const piece of pieces){
    for(const position of piece[1]){
      str += piece[0]+position;
    }
  }
  return str;
}

function updatePiecesArray(){
  gameState.pieces["whitePieces"] = gameState.pieces["WPAWN"].concat(gameState.pieces["WROOK"], gameState.pieces["WKNIGHT"], gameState.pieces["WBISHOP"], gameState.pieces["WQUEEN"], gameState.pieces["WKING"]);
  gameState.pieces["blackPieces"] = [...gameState.pieces["BPAWN"], ...gameState.pieces["BROOK"], ...gameState.pieces["BKNIGHT"], ...gameState.pieces["BBISHOP"], ...gameState.pieces["BQUEEN"], ...gameState.pieces["BKING"]];
  gameState.pieces["allPieces"] = [...gameState.pieces["whitePieces"], ...gameState.pieces["blackPieces"]];
}

function restart(){
  gameState = {
    pieces: {
      WPAWN: [],
      WKNIGHT: [],
      WBISHOP: [],
      WROOK: [],
      WQUEEN: [],
      WKING: [],
    
      BPAWN: [],
      BKNIGHT: [],
      BBISHOP: [],
      BROOK: [],
      BQUEEN: [],
      BKING: [],
    
      blackPieces: [],
      whitePieces: [],
      allPieces: [],
    },
    sideToMove: "W",
    moveCounter: 1,
    halfmoveCounter: 0,
    castlingRights: {
      whiteKingSide: false,
      whiteQueenSide: false,
      blackKingSide: false,
      blackQueenSide: false
    },
    enPassantSquare: -1
  };
  gameEnd = false;
  repetionCounter = {};
  moveHistoryPointer = -1;
  selectedSquare = -1;
  globalMovelist = [];
  moveHistory = [];
  whiteTime = blackTime = 5 * 60 * 1000; // 5 minutes in ms

  loadPositionFromFEN(START_POSITION);
  updateBoardUI();
  clearMoveHistory();
  getMoves();
  updateTimer();
  promotionPopUp.style.display = "none";
  document.getElementById("options-menu").style.display = "none";
  document.getElementById("game-end-screen").style.display = "none";
}

/* UI Functions */
async function selectSquare(event){
  if(!(moveHistoryPointer === moveHistory.length - 1) || gameEnd){
    return;
  }
  const squareElement = event.target.classList.contains("piece") ? event.target.parentElement : event.target;
  const squareNumber = Number(squareElement.classList[1].slice(1));
  if(selectedSquare >= 0){ // something is selected
    // select new
    if(event.target.classList.contains("piece") && 
    (gameState.sideToMove === "W" ? gameState.pieces.whitePieces : gameState.pieces.blackPieces).includes(squareNumber)){
      selectedSquare = squareNumber;
      updateSelection();
      return;
    }
    // makeMove
    if(document.querySelector(".s"+squareNumber).classList.contains("highlight")){
      for(let i = 0; i < globalMovelist.length; i++){
        if(globalMovelist[i].from === selectedSquare && globalMovelist[i].to === squareNumber){
          if(globalMovelist[i].pieceType.slice(1) === "PAWN" && (globalMovelist[i].to >= 56 || globalMovelist[i].to <= 7)){
            // if it's a promotion, we make the promition window pop up
            // and let the player select their piece.
            // after that we need to increase "i" accordingly to select the correct promotion move
            promotionPopUp.style.display = "flex";
            await new Promise((resolve) => promotionButton.addEventListener('click', resolve, {once:true}))
            const promotionType = document.querySelector('input[name="promotion-option"]:checked').value;
            switch(promotionType){
              case "queen":
                i += 3;
                break;
              case "knight":
                i += 2;
                break;
              case "rook":
                i += 1;
                break;
            }
            promotionPopUp.style.display = "none";
          }
          makeMove(globalMovelist[i]);
          prepareForNextMove(i);
          selectedSquare = -1;
          updateSelection();
          return;
        }
      }
    }
    // unselect
    selectedSquare = -1;
  }else{ // nothing is selected
    // check if click square has a piece and that piece
    // belongs to the currently moving side
    if(event.target.classList.contains("piece") && 
    (gameState.sideToMove === "W" ? gameState.pieces.whitePieces : gameState.pieces.blackPieces).includes(squareNumber)){
      selectedSquare = squareNumber;
    }
  }
  updateSelection();
}

function reduceTimer(){
  if(moveHistory.length === 0 || gameEnd || !document.getElementById("timer-toggle").checked){
    return;
  }
  const movingSide = moveHistory.length % 2 === 0;
  if(movingSide){
    whiteTime -= 200;
    if(whiteTime <= 0){
      gameEnd = {
        end: "Black Won",
        reason: "on Time"
      };
    }
  }else{
    blackTime -= 200;
    if(blackTime <= 0){
      gameEnd = {
        end: "White Won",
        reason: "on Time"
      };
    }
  }
  updateTimer();

  if(gameEnd){
    document.getElementById("winner").textContent = gameEnd.end;
    document.getElementById("reason").textContent = gameEnd.reason;
    document.getElementById("game-end-screen").style.display = "flex";
    selectedSquare = -1;
    updateSelection();
  }
}

function updateSelection(){
  // remove selection
  const previousSelection = document.querySelector(".selection");
  if(previousSelection){
    previousSelection.classList.remove("selection");
  }
  // set new selection
  const square = document.querySelector(".s"+selectedSquare);
  if(square){
    square.classList.add("selection");
  }
  // remove hightlights
  const previousHightlights = document.getElementsByClassName("highlight");
  while(previousHightlights[0]){
    previousHightlights[0].classList.remove("highlight");
  }
  // set the new highlights
  for(let i = 0; i < globalMovelist.length; i++){
    if(globalMovelist[i].from === selectedSquare){
      document.querySelector(".s"+globalMovelist[i].to).classList.add("highlight");
    }
  }

}

function updateTimer(){
  // white text
  let minutes = Math.floor(whiteTime / (1000 * 60));
  let seconds = String(Math.floor(whiteTime / 1000) % 60);
  if(seconds.length === 1){
    seconds = "0" + seconds;
  }
  whiteTimer.textContent = minutes + ":" + seconds;

  // black text
  minutes = Math.floor(blackTime / (1000 * 60));
  seconds = String(Math.floor(blackTime / 1000) % 60);
  if(seconds.length === 1){
    seconds = "0" + seconds;
  }
  blackTimer.textContent = minutes + ":" + seconds;
}

function updateBoardUI(){
  // remove all Pieces from the board
  let pieces = document.getElementsByClassName('piece');
  const rotation = pieces[0] ? pieces[0].classList.contains("rotate") : false;
  while(pieces[0]) {
    pieces[0].parentNode.removeChild(pieces[0]);
  }
  // set all Pieces to their updated position
  // removes the last 3 elements since they
  // are not needed (blackPieces, whitePieces, allPieces)
  const entries = Object.entries(gameState.pieces);
  entries.splice(12);
  for(const el of entries){
    for(const s of el[1]){
      const piece = document.createElement("span");
      piece.classList.add("piece");
      if(rotation){
        piece.classList.add("rotate");
      }
      piece.textContent = piecesToSymbolTable[el[0]];
      document.querySelector(".s" + s).appendChild(piece); 
    }
  }
} 

function updateMoveHistory(){
  if(gameState.sideToMove === "B"){
    const moveNumber = document.createElement("div");
    moveNumber.textContent = moveHistory.at(-1)[2] + ".";
    moveNumber.classList.add("move-counter");
    gameHistoryContainer.appendChild(moveNumber);
  }
  const moveContainer = document.createElement("div");
  moveHistoryPointer++;
  moveContainer.classList.add("move");
  moveContainer.classList.add("m"+moveHistoryPointer);
  moveContainer.textContent = moveHistory.at(-1)[0];
  moveContainer.addEventListener("click", (e)=>{
    moveHistoryPointer = Number(e.target.classList[1].slice(1));
    restoreGameState(moveHistory[moveHistoryPointer][1]);
    updateBoardUI();
    updateMoveHistoryHighlight();
    selectedSquare = -1;
    updateSelection();
  });
  gameHistoryContainer.appendChild(moveContainer);
  updateMoveHistoryHighlight();

}

function updateMoveHistoryHighlight(){
  // remove highlight
  const previousHighlight = document.querySelector(".move-highlight");
  if(previousHighlight){
    previousHighlight.classList.remove("move-highlight");
  }
  // set new highlight
  const move = document.querySelector(".m"+moveHistoryPointer);
  if(move){
    move.classList.add("move-highlight");
  }
}

function clearMoveHistory(){
  let moves = document.getElementsByClassName("move");
  while(moves[0]){
    moves[0].parentNode.removeChild(moves[0]);
  }

  let movesCounters = document.getElementsByClassName("move-counter");
  while(movesCounters[0]){
    movesCounters[0].parentNode.removeChild(movesCounters[0]);
  }
}

function createBoard(){
  // create the board
  const board = document.querySelector(".board");

  for(let i = 0; i < 8; i++){
    // create a rank- used to align the squares into a "board shape"
    const rank = document.createElement("div");
    rank.classList.add("rank");

    // append rank to board
    board.appendChild(rank);
    // create the squares
    for(let j = 0; j < 8; j++){
      const square = document.createElement("div");
      const squareNumber = 63 - (i * 8 + j)
      // square.textContent = squareNumber;
      square.classList.add("square");
      square.classList.add("s" + squareNumber);
      square.classList.add( (i + j) % 2 == 1 ? "black" : "white");
      square.addEventListener("click", selectSquare);
      // add rank and file text to the certain squares
      if(j == 0){
        const rankText = document.createElement("span");
        rankText.textContent = 8 - i;
        rankText.classList.add("rankText");
        rankText.classList.add( (i + j) % 2 == 1 ? "black" : "white");
        square.appendChild(rankText);
      }
      if(i == 7){
        const fileText = document.createElement("span");
        fileText.textContent = String.fromCharCode(97 + j);
        fileText.classList.add("fileText");
        fileText.classList.add( (i + j) % 2 == 1 ? "black" : "white");
        square.appendChild(fileText);
      }
      // append the square to the current rank
      rank.appendChild(square);
    }
  }

}

function swapSides(){
  const board = document.querySelector(".board");
  if(board.classList.contains("rotate")){
    // removing the rotation
    board.classList.remove("rotate");
    const pieces = document.querySelectorAll(".square");
    for(const el of pieces){
      el.classList.remove("rotate");
    }
    // now we just need to put the file and 
    // rank texts to the correct squares
    const rankTexts = document.querySelectorAll(".rankText");
    const fileTexts = document.querySelectorAll(".fileText");
    for(const el of rankTexts){
      const parent = el.parentElement;
      const str = parent.classList[1];
      const squareNumber = Number(str.replace("s",""));
      el.remove();
      // correcting some color stuff
      if(el.classList.contains("black")){
        el.classList.remove("black");
        el.classList.add("white");
      }else{
        el.classList.add("black");
        el.classList.remove("white");
      }
      el.classList.remove("rotate");
      document.querySelector(".s" + (squareNumber + 7)).appendChild(el);
    }

    for(const el of fileTexts){
      const parent = el.parentElement;
      const str = parent.classList[1];
      const squareNumber = Number(str.replace("s",""));
      el.remove();
      // correcting some color stuff
      if(el.classList.contains("black")){
        el.classList.remove("black");
        el.classList.add("white");
      }else{
        el.classList.add("black");
        el.classList.remove("white");
      }
      el.classList.remove("rotate");
      document.querySelector(".s" + (squareNumber - 56)).appendChild(el);
    }
    // other menus need to be handled as well
    // promotion / option / win screen
    document.getElementById("options-menu").classList.remove("rotate");
    document.getElementById("promotion-pop-up").classList.remove("rotate");
    document.getElementById("game-end-screen").classList.remove("rotate");
    // finally the player "names" need to be swapped
    document.getElementById("black-player").after(board);
    board.after(document.getElementById("white-player"));


  }else{

    // add the rotation

    // rotate board and then rotate piece as well to
    // make them face the correct way again
    board.classList.add("rotate");
    const pieces = document.querySelectorAll(".square");
    for(const el of pieces){
      el.classList.add("rotate");
    }
    // now we just need to put the file and 
    // rank texts to the correct squares
    const rankTexts = document.querySelectorAll(".rankText");
    const fileTexts = document.querySelectorAll(".fileText");
    for(const el of rankTexts){
      const parent = el.parentElement;
      const str = parent.classList[1];
      const squareNumber = Number(str.replace("s",""));
      el.remove();
      // correcting some color stuff
      if(el.classList.contains("black")){
        el.classList.remove("black");
        el.classList.add("white");
      }else{
        el.classList.add("black");
        el.classList.remove("white");
      }
      document.querySelector(".s" + (squareNumber - 7)).appendChild(el);
    }

    for(const el of fileTexts){
      const parent = el.parentElement;
      const str = parent.classList[1];
      const squareNumber = Number(str.replace("s",""));
      el.remove();
      // correcting some color stuff
      if(el.classList.contains("black")){
        el.classList.remove("black");
        el.classList.add("white");
      }else{
        el.classList.add("black");
        el.classList.remove("white");
      }
      document.querySelector(".s" + (56 + squareNumber)).appendChild(el);
    }
    // other menus need to be handled as well
    // promotion / option / win screen
    document.getElementById("options-menu").classList.add("rotate");
    document.getElementById("promotion-pop-up").classList.add("rotate");
    document.getElementById("game-end-screen").classList.add("rotate");

    // finally the player "names" need to be swapped
    document.getElementById("white-player").after(board);
    board.after(document.getElementById("black-player"));
  }
}