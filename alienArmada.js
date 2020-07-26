(function(){
  
var canvas = document.querySelector("canvas");
var drawingSurface = canvas.getContext("2d");
  
var sprites = [];
var assetsToLoad = [];
var missiles = [];
var aliens = [];
var messages = [];

//CREATE BACKGROUND
var background = Object.create(spriteObject);
background.x = 0;
background.y = 0;
background.sourceY = 32;
background.sourceWidth = 480;
background.sourceHeight = 320;
background.width = 480;
background.height = 320;
sprites.push(background);

//CREATE CANNON
var cannon = Object.create(spriteObject);
cannon.x = canvas.width / 2 - cannon.width / 2;
cannon.y = 280;
sprites.push(cannon);

//SCORE MESSAGE
var scoreDisplay = Object.create(messageObject);
scoreDisplay.font = "normal bold 30px Courier";
scoreDisplay.x = 425;
scoreDisplay.y = 10;
messages.push(scoreDisplay);

//GAME OVER MESSAGE
var gameOverMessage = Object.create(messageObject);
gameOverMessage.font = "normal bold 20px Courier";
gameOverMessage.x = 70;
gameOverMessage.y = 120;
gameOverMessage.visible = false;
messages.push(gameOverMessage);

//LOAD TILESHEET IMAGE
var image = new Image();
image.addEventListener("load", loadHandler, false);
image.src = "alienArmada.png";
assetsToLoad.push(image);

//LOAD SOUNDS
var music = document.querySelector("#music");
music.addEventListener("canplaythrough", loadHandler, false);
music.load();
assetsToLoad.push(music);

var shootSound = document.querySelector("#shootSound");
shootSound.addEventListener("canplaythrough", loadHandler, false);
shootSound.load();
assetsToLoad.push(shootSound);

var explosionSound = document.querySelector("#explosionSound");
explosionSound.addEventListener("canplaythrough", loadHandler, false);
explosionSound.load();
assetsToLoad.push(explosionSound);

var assetsLoaded = 0;

//GAME STATES
var LOADING = 0;
var STARTING = 1;
var PLAYING = 2;
var OVER = 3;
var gameState = LOADING;

//ARROW KEYS
var RIGHT = 39;
var LEFT = 37;
var SPACE = 32;

//DIRECTIONS
var moveRight = false;
var moveLeft = false;

//SHOOT MISSILES
var shoot = false;
var spaceKeyIsDown = false;

//OTHER GAME VARIABLES
var score = 0;
var scoreNeededToWin = 50;
var alienFrequency = 200;
var alienTimer = 0;
  
//KEYBOARD LISTENERS
window.addEventListener("keydown", function(event) {
  switch(event.keyCode) {
    case LEFT:
      moveLeft = true;
      break;
      
    case RIGHT:
      moveRight = true;
      break;
      
    case SPACE:
      if(!spaceKeyIsDown) {
        shoot = true;
        spaceKeyIsDown = true;
      }
  }
}, false);

window.addEventListener("keyup", function(event) {
  switch(event.keyCode) {
    case LEFT:
      moveLeft = false;
      break;
    case RIGHT:
      moveRight = false;
      break;
      
    case SPACE:
      spaceKeyIsDown = false;
  }
}, false);

// GAME ANIMATION LOOP
update();

function update() {
  requestAnimationFrame(update, canvas);
  
  //change what game does based on game state
  switch(gameState) {
    case LOADING:
      break;

    case STARTING:
      startGame();
      break;
      
    case PLAYING:
      playGame();
      break;
      
    case OVER:
      endGame();
      break;
  }
  render();
} //end of update function
  
function loadHandler() {
  assetsLoaded++;
  if(assetsLoaded === assetsToLoad.length) {
    //remove load event listener
    image.removeEventListener("load", loadHandler, false);
    music.removeEventListener("canplaythrough", loadHandler, false);
    shootSound.removeEventListener("canplaythrough", loadHandler, false);
    explosionSound.removeEventListener("canplaythrough", loadHandler, false);
        
    var startButton = document.getElementById("startButton");
    startButton.addEventListener("click", startGame);
  }
} //end of loadHandler

function startGame() {
  gameState = PLAYING;

  startButton.removeEventListener("click", startGame);
  startButton.style.display = "none";

  //PLAY MUSIC
  music.play();
  music.volume = 0.3;
}
  
function playGame() {
  if(moveLeft && !moveRight) {
    cannon.vx = -4;
  }
  if(moveRight && !moveLeft) {
    cannon.vx = 4;
  }
  //CANNON VELOCITY to zero is no keys pressed
  if(!moveLeft && !moveRight) {
    cannon.vx = 0;
  }
  //FIRE MISSILE if shoot = true
  if(shoot) {
    fireMissile();
    shoot = false;
  }
  //MOVE CANNON, keep w/i screen boundaries
  cannon.x = Math.max(0, Math.min(cannon.x + cannon.vx, canvas.width - cannon.width));
  
  //MOVE MISSILES
  for(var i = 0; i < missiles.length; i++) {
    var missile = missiles[i];
    missile.y += missile.vy;
    //REMOVE MISSILE if off top of screen
    if(missile.y < 0 - missile.height) {
      removeObject(missile, missiles);
      removeObject(missile, sprites);
      //reduce loop counter by 1 due to remove element
      i--;
    }
  }
  
  //MAKE ALIENS!!!!
  alienTimer++;
  //MAKE NEW ALIEN if timer equals frequency
  if(alienTimer === alienFrequency) {
    makeAlien();
    alienTimer = 0;    //reset timer
    //reduce freq by 1 to gradually increase creation speed
    if(alienFrequency > 2) {  //was 2
      alienFrequency--;
    }
  }
  
  //LOOP THROUGH ALIENS
  for(var i = 0; i < aliens.length; i++) {
    var alien = aliens[i];
    if(alien.state === alien.NORMAL) {
      alien.y += alien.vy/1.25;
    }
    //Has alien crossed bottom of screen?
    if(alien.y > canvas.height + alien.height) {
      //end game if alien reaches Earth
      gameState = OVER;
    }
  }
  
  //COLLISIONS GALORE!!!
  for(var i = 0; i < aliens.length; i++) {
    var alien = aliens[i];
    
    for(var j = 0; j < missiles.length; j++) {
      var missile = missiles[j];
      
      if(hitTestRectangle(missile, alien)
      && alien.state === alien.NORMAL) {
        destroyAlien(alien);
        //update score
        score++;
        //remove missile
        removeObject(missile, missiles);
        removeObject(missile, sprites);
        
        //remove 1 from loop counter due to removed missile
        j--;
      }
    }
  }
  
  //THE SCORE
  scoreDisplay.text = score;
  
  //check for end of game
  if(score === scoreNeededToWin) {
    gameState = OVER;
  }
} //end of playGame

function destroyAlien(alien) {
  //change alien state, update object
  alien.state = alien.EXPLODED;
  alien.update();
  
  setTimeout(removeAlien, 1000);
  
  //play explosion sound
  explosionSound.currentTime = 0;
  explosionSound.play();
  
  function removeAlien() {
    removeObject(alien, aliens);
    removeObject(alien, sprites);
  }
}
  
function endGame() {
  gameOverMessage.visible = true;
  if(score < scoreNeededToWin) {
    gameOverMessage.text = "EARTH DESTROYED!";
  }
  else {
    gameOverMessage.x = 120;
    gameOverMessage.text = "EARTH SAVED!";
  }
  music.volume = 0.1;

  startButton.style.display = "block";
  startButton.innerHTML = "RESET GAME";
  startButton.addEventListener("click", restartGame);
} //end of endGame

function makeAlien() {
  var alien = Object.create(alienObject);
  alien.sourceX = 32;
  alien.y = 0 - alien.height;
  
  //assign random x position
  var randomPosition = Math.floor(Math.random() * 15);
  alien.x = randomPosition * alien.width;
  
  //set speed and push to sprites and arrays
  alien.vy = 1;
  sprites.push(alien);
  aliens.push(alien);
}

function fireMissile() {
  //create missile sprite
  var missile = Object.create(spriteObject);
  missile.sourceX = 96;
  missile.sourceWidth = 16;
  missile.sourceheight = 16;
  missile.width = 16;
  missile.height = 16;
  
  //center over cannon and set speed
  missile.x = cannon.centerX() - missile.halfWidth();
  missile.y = cannon.y - missile.height;
  missile.vy = -8;
  
  //push to sprites and arrays
  sprites.push(missile);
  missiles.push(missile);
  
  shootSound.currentTime = 0;
  shootSound.play();
}

function removeObject(objectToRemove, array) {
  var i = array.indexOf(objectToRemove);
  if (i !== -1) {
    array.splice(i, 1);
  }
}

//for some reason, the book has an extra endGame() here.....
  
function render() {
  drawingSurface.clearRect(0, 0, canvas.width, canvas.height);
  //DISPLAY SPRITES
  if(sprites.length !== 0) {
    for(var i = 0; i < sprites.length; i++) {
      var sprite = sprites[i];
      drawingSurface.drawImage
      (
        image,
        sprite.sourceX, sprite.sourceY, sprite.sourceWidth, sprite.sourceHeight,
        Math.floor(sprite.x), Math.floor(sprite.y), sprite.width, sprite.height
      );
    }
  }
  
  //display game messages
  if(messages.length !== 0) {
    for(var i = 0; i < messages.length; i++) {
      var message = messages[i];
      if(message.visible) {
        drawingSurface.font = message.font;
        drawingSurface.fillstyle = message.fillStyle;
        drawingSurface.textBaseline = message.textBaseline;
        drawingSurface.fillText(message.text, message.x, message.y);
      }
    }
  }
} //end of render()

function restartGame() {
  startButton.removeEventListener("click", restartGame);
  startButton.style.display = "block";
  startButton.innerHTML = "START";
  startButton.addEventListener("click", startGame);
  resetGlobalVar();
} // end of restartGame

function resetGlobalVar() {
  sprites = [];
  score = 0;
  scoreDisplay.text = score;
  missiles = [];
  aliens = [];
  currentTime = 0;
  gameOverMessage.text = "";
  sprites.push(background);
  sprites.push(cannon);
  cannon.x = canvas.width / 2 - cannon.width / 2;
  gameState = LOADING;
  alienTimer = 0;
  alienFrequency = 100;
} // end of resetGlobalVar

}()); //end of the immediate function call

