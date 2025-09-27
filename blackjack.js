let cardOne = 7;
let cardTwo = 5;
let cardThree = 7;
let playersum = cardOne + cardTwo + cardThree;

let cardOneBank = 7;
let cardTwoBank = 5;
let cardThreeBank = 3;
let cardFourBank = 4;
let banksum=cardOneBank+cardTwoBank+cardThreeBank+cardFourBank

if(playersum>21)
    console.log('플레이어 승');
else if(banksum>21)
    console.log('딜러 승');
else if(playersum==banksum)
    console.log('무승부');
else if(banksum>=17)
    console.log('stop')
else if(banksum<17)
    console.log('카드 뽑기')
