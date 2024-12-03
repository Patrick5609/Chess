/* Testing section */
const POSITIONS = ["rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    "r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1",
    "8/2p5/3p4/KP5r/1R3p1k/8/4P1P1/8 w - - 0 1",
    "r3k2r/Pppp1ppp/1b3nbN/nP6/BBP1P3/q4N2/Pp1P2PP/R2Q1RK1 w kq - 0 1",
    "rnbq1k1r/pp1Pbppp/2p5/8/2B5/8/PPP1NnPP/RNBQK2R w KQ - 1 8",
    "r4rk1/1pp1qppp/p1np1n2/2b1p1B1/2B1P1b1/P1NP1N2/1PP1QPPP/R4RK1 w - - 0 10"];

const NODES = [
    [1,20,400,8902,197281,4865609,119060324],
    [1,48,2039,97862,4085603,193690690,8031647685],
    [1,14,191,2812,43238,674624,11030083],
    [1,6,264,9467,422333,15833292,706045033],
    [1,44,1486,62379,2103487,89941194, 0],
    [1,46,2079,89890,3894594,164075551,6923051137]
];

function testing(positionIndex, depth){
    if(positionIndex > 5 || depth > 6){
        return "invalid input";
    }

    loadPositionFromFEN(POSITIONS[positionIndex]);
    updateBoardUI();

    console.log("Start");
    
    setTimeout(() => {

        console.log("Position: " + positionIndex + " Depth: " + depth);
        const startTime = new Date();
        const result = perfTest(depth);
        const endTime = new Date();

        const expectedResult = NODES[positionIndex][depth];
        const answer = (expectedResult === result)

        console.log("Nodes: " + result);
        console.log("Expected Result: " + expectedResult);
        console.log("Answer = " + answer);
        if(!answer){
            if(result > expectedResult){
                console.log((result - expectedResult) + " too many Nodes");
            }else{
                console.log((expectedResult - result) + " too few Nodes");
            }
        }
        console.log("Time: " + Math.round((endTime - startTime) / 1000) +"s");

    }, 2000);
}
  
function perfTest(depth){
    let moves = 0;
    let movelist = generateLegalMoves(gameState.sideToMove);

    if(depth === 1){
        return movelist.length;
    }

    for(let i = 0; i < movelist.length; i++){
        const state = preserveGamaState();
        makeMove(movelist[i]);
        moves += perfTest(depth - 1);
        restoreGameState(state);
    }

    return moves;
}