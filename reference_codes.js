/*
JAVASCRIPT: CONVERT STRING TO FUNCTION AND EXECUTE IT
eval("function play_game(board,side) {\n  return board.replace('_',side);\n}")
var board = "_______________"
var side = "X"
play_game(board, side)
> "X______________"

PYTHON: EXECUTE PYTHON STRING CODE
exec "code string"


hitting of homepage
login
new sign up
bots submission (click submit bot)
time spent on time
# of play (click play)


When a player's actual tournament scores exceed his expected scores, the Elo system takes this as evidence that player's rating is too low, and needs to be adjusted upward. Similarly when a player's actual tournament scores fall short of his expected scores, that player's rating is adjusted downward. Elo's original suggestion, which is still widely used, was a simple linear adjustment proportional to the amount by which a player overperformed or underperformed his expected score. The maximum possible adjustment per game, called the K-factor, was set at K = 16 for masters and K = 32 for weaker players.
Supposing Player A was expected to score E_A points but actually scored S_A points. The formula for updating his rating is
R_A^\prime = R_A + K(S_A - E_A).

https://github.com/hugodias/EloRating-JavaScript/blob/master/src/elo_rating.js



GAMEPLAY:
Is move valid: result is not int; if int, is it 0 to 6?

Play:
Counter for player
Constant var for board
While no winner n board not full: Check syntax: Check js or py n if return not integer; error;
Place the coin
Check winning
Stop when someone win or stack is full

/
Return list of players n boards

Select bot or random

/leaderboard
Research on scoring system

Python Web service to execute python code;

Structure:
Player:
- firebase auth
- bot: lang, code,

Check whether the chess score tight to user or bot

*/