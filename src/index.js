// let { init, Scene, Sprite, SpriteSheet, GameLoop, collides, Grid, Text, bindKeys, unbindKeys, initPointer, initKeys, keyPressed, getPointer } = kontra;
import { init, Scene, Sprite, SpriteSheet, GameLoop, collides, Grid, Text, bindKeys, unbindKeys, initPointer, initKeys, keyPressed, getPointer } from 'kontra';

let { canvas } = init();
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
initPointer();
initKeys();

console.clear();
var gameState = {
	playing: false,
	timeNow: null,
	egg: null,
};

/** Sprites */
let playerImage = new Image();
playerImage.src = "./assets/Hero.png";
playerImage.onload = function(){
	var sp = SpriteSheet({
		image: playerImage,
		frameWidth: 50, frameHeight: 50,
		animations: {
			walk: {
				frames: "0..2",
				frameRate: 12
			}
		}
	});
	player.animations = sp.animations;
}

let gameGate = new Image();
gameGate.src = "./assets/Gate.png";
gameGate.onload = function(){
	orb.image = gameGate;
}

let enemyImage = new Image();
var enemyAnimation = "";
enemyImage.src = "./assets/Enemy.png";
enemyImage.onload = function(){
	enemyAnimation = SpriteSheet({
		image: enemyImage,
		frameWidth: 20, frameHeight: 20,
		animations: {
			walk: {
				frames: "0..2",
				frameRate: 12
			}
		}
	});
}

/**
 * Circle and rectangle collision
 * @param {Object} circle
 * @param {Object} rectangle
 * @returns boolean
 */
 function circleRect(circle, rectangle){

	var cx = circle.x;
	var cy = circle.y
	var radius = circle.radius;
	var rx = rectangle.x;
	var ry = rectangle.y;
	var rw = rectangle.width;
	var rh = rectangle.height;

	// temporary variables to set edges for testing
	var testX = cx;
	var testY = cy;
  
	// which edge is closest?
	if (cx < rx)         testX = rx;      // test left edge
	else if (cx > rx+rw) testX = rx+rw;   // right edge
	if (cy < ry)         testY = ry;      // top edge
	else if (cy > ry+rh) testY = ry+rh;   // bottom edge
  
	// get distance from closest edges
	var distX = cx-testX;
	var distY = cy-testY;
	var distance = Math.sqrt( (distX*distX) + (distY*distY) );
  
	// if the distance is less than the radius, collision!
	if (distance <= radius) {
	  return true;
	}
	return false;
}

/**
 * Prevent colliding two objects
 * @param {Object} ob1 
 * @param {Object} ob2 
 */
function antiCollide(ob1, ob2){

	var vx = (ob1.x + (ob1.width / 2)) - (ob2.x + (ob2.width / 2));
	var vy = (ob1.y + (ob1.height / 2)) - (ob2.y + (ob2.height / 2));

	var combinedHalfWidths = (ob1.width / 2) + (ob2.width / 2);
	var combinedHalfHeight = (ob1.height / 2) + (ob2.height / 2);

	if( Math.abs(vx) < combinedHalfWidths && Math.abs(vy) < combinedHalfHeight ){
		var overlapX = combinedHalfWidths - Math.abs(vx);
		var overlapY = combinedHalfHeight - Math.abs(vy);

		if( overlapX >= overlapY ){
			if( vy > 0 ){
				ob1.y = ob1.y + overlapY;
			}else{
				ob1.y = ob1.y - overlapY;
				ob1.isGrounded = true;
			}

			ob1.dy = 0; ob2.dy = 0;
			ob1.dx = 0; ob2.dx = 0;
		}else{
			if( vx > 0 ){
				ob1.x = ob1.x + overlapX;
			}else{
				ob1.x = ob1.x - overlapX;
			}

			ob1.dx = 0; ob2.dx = 0;
			ob1.dx = 0; ob2.dx = 0;
		}
	}
}

/** Re/Start all sprites to it's original state */
function gameStart(){
	if( gameState.playing === true ) return;

	var ds = document.querySelector("#death-screen");
		ds.style.display = "none";
		
	playerStatus.style.display = "block";
	enemies = [];
	enemiesBullet = [];
	player.bullets = [];
	player.x = (canvas.width / 2) - 20;
	player.y = orb.y - 60;
	player.score = 0;
	playerScore.innerHTML = 0;
	player.health = 100;
	playerHealth.style.width = `${ player.health }%`;

	loop.start();

	gameState.egg = null;
	gameState.playing = true;

	setTimeout(function(){
		player.allowToFire = true;
	}, 500);
}

/**
 * Death screen
 * @param {String} title
 * @param {String} message
 */
function deathScreen(title, message){
	loop.stop();

	setTimeout(function(){

		var ds = document.querySelector("#death-screen");
		var heading = document.querySelector("#death-screen-h1");
		var context = document.querySelector("#death-screen p");

		gameState.playing = false;
		player.highestScore = Math.max(player.highestScore, player.score);
		player.allowToFire = false;

		playerStatus.style.display = "none";
		ds.style.display = "block";

		heading.innerHTML = title;
		context.innerHTML = message;
		playerHScore.innerHTML = player.highestScore;

		bindKeys(['space'], function(){ gameStart(); });
	}, 1500);
}

/** Base or to protect */
 var orb = Sprite({
	x: (canvas.width / 2) - (25 / 2), y: canvas.height - 40,
	width: 400, height: 80,
	image: null,
	// color: "white",
    anchor: {x: 0.5, y: 0.5}
});

/**
 * Player object with basic movements
 */
var player = Sprite({
	x: (canvas.width / 2) - 20,
	y: orb.y - 60,
	width: 50,
	height: 50,
	bullets: [],
	timeLastFired: null,
	movementSpeed: 5,
	allowToFire: null,
	health: 100,
    anchor: {x: 0.5, y: 0.5},
	animations: null,
	score: 0,
	highestScore: 0,
	interact: function(){

		// Render bullets
		this.bullets.forEach(bullet => {
			bullet.render();
		});

		// Getting the mouse coordinates
		var mp = getPointer();
		var a = Math.atan2(
			mp.y - (this.y + (this.height / 2)), 
			mp.x - (this.x + (this.width / 2))
		);

		// Controls
		if( keyPressed("w") || keyPressed("up") ){
			this.y -= this.movementSpeed;
		}
		if( keyPressed("a") || keyPressed("left") ){
			this.x -= this.movementSpeed;
		}
		if( keyPressed("s") || keyPressed("down") ){
			this.y += this.movementSpeed;
		}
		if( keyPressed("d") || keyPressed("right") ){
			this.x += this.movementSpeed;
		}

		// Window collisions
		if( this.x <= 0 ) this.x = 0;
		if( this.y <= 0 ) this.y = 0;
		if( this.x + this.width >= canvas.width ) this.x = canvas.width - this.width;
		if( this.y + this.height >= canvas.height ) this.y = canvas.height - this.height;

		if( keyPressed("space") && (this.timeLastFired + 250 <= gameState.timeNow || this.timeLastFired == null) && this.allowToFire ){
			this.timeLastFired = gameState.timeNow;

			this.bullets.push(Sprite({
				id: Math.floor( Math.random() * 10000 ),
				x: this.x + ( this.width / 2 ), y: this.y + ( this.height / 2 ),
				radius: 8,
				scaleRadius: 5,
				maxRadius: 75,
				exploded: false,
				timeFired: gameState.timeNow,
				timeMaxed: null,
				dx: Math.cos(a) * 5, dy: Math.sin(a) * 5,
				width: 5, height: 5,
				color: "black",
				particles: [],
				alive: true,
				damage: 50 + Math.floor( Math.random() * 60 ),
				render(){
					this.context.beginPath();
					this.context.fillStyle = "black";
					this.context.shadowBlur = 5;
					this.context.shadowColor = "red";
					this.context.arc(0, 0, this.radius, 0, Math.PI * 2);
					this.context.fill();
					this.context.closePath();

					if( this.exploded ){
						if( this.timeMaxed == null ){
							if( this.radius + this.scaleRadius >= this.maxRadius ){
								this.radius = this.maxRadius;
								this.timeMaxed = gameState.timeNow;
							}else{
								this.radius += this.scaleRadius;
							}
						}else if( this.timeMaxed + 1000 < gameState.timeNow ){
							if( this.radius <= 0 ){
								this.alive = false;
							}else{
								this.radius -= 5;
							}
						}
					}
				},
				execute(enemy){
					if( !this.exploded ){
						this.exploded = true;
						this.x = enemy.x + enemy.width / 2;
						this.y = enemy.y + enemy.height / 2;
						this.dx = 0;
						this.dy = 0;
					}
				}
			}));
		}

	}
});

/**
 * Enemies Object with
 * their behavior
 */
var lastGenerate = null;
var enemies = [];
var enemiesBullet = [];
function generateEnemies(){
	
	// Generating
	var range = 10;
	var generating = 0;
	if( player.score > 100 ){
		range = 20;
	}else if( player.score > 200 ){
		range = 50;
	}

	if( lastGenerate == null ){
		generating = 10;
	}else if( (lastGenerate + 2000 < gameState.timeNow) && enemies.length < 100 ){
		generating = Math.floor( Math.random() * range );
	}else{
		return;
	}

	lastGenerate = gameState.timeNow;
	for(var i = 0; i < generating; i++){
		var speedX = Math.random()  * .8;
		var speedY = Math.random()  * .8;

		enemies.push(Sprite({
			x: Math.random() * canvas.width,
			y: -50,
			width: 20,
			height: 20,
			timeFreezed: null,
			affected: false,
			timeAffected: null,
			health: 100,
			anchor: {x: 0.5, y: 0.5},
			timeWillAttack: null,
			animations: enemyAnimation.animations,

			revert(){
				var a = Math.atan2(
					orb.y - (this.y + (this.height / 2)),
					orb.x - (this.x + (this.width / 2))
				);	
				this.dx = Math.cos(a) * speedX; this.dy = Math.sin(a) * speedY;
			},
	
			/**
			 * Follow object or projectile
			 * @param {object} the projectile
			 */
			follow(obj){
	
				if( this.affected === false ){
					this.affected = true;
					this.health -= obj.damage;
					this.timeAffected = gameState.timeNow;
				}
	
				var easing = .2;
				var vx = (obj.x) - (this.x + this.width / 2);
				var vy = (obj.y) - (this.y + this.height / 2);
				var distance = Math.sqrt(vx * vx + vy * vy);
	
				if( distance >= 1 ){
					this.x += vx * easing;
					this.y += vy * easing;
				}
			},

			/**
			 * Fire at random points
			 */
			fire(){

				// Don't attack
				if( this.timeWillAttack == -1 ){
					return false;

				// Attack
				}else if( this.timeWillAttack == null ){
					this.timeWillAttack = gameState.timeNow + (Math.random() * 5000);
				
				// Attack
				}else if( this.timeWillAttack < gameState.timeNow ){
					if( Math.floor(Math.random() * 100) >= 90 ){
						this.timeWillAttack = -1;
						enemiesBullet.push(Sprite({
							x: this.x, y: this.y,
							dy: 2, color: "red", radius: 5,
							render: function(){
								this.context.beginPath();
								this.context.fillStyle = "red";
								this.context.arc(0, 0, 5, 0, Math.PI * 2);
								this.context.fill();
								this.context.closePath();
							}
						}));

					}else{
						this.timeWillAttack = null;
					}
				}
			}

		}));
	}
}

/** Main game loop */
var loop = GameLoop({
	update: function(){
		
		// Player interact
		if( gameState.playing ){
			player.interact();
		}

		player.update();

		// Fire each bullet
		player.bullets.forEach((bullet, i) => {
			bullet.update();
			if( !bullet.alive || bullet.timeFired + 5000 < gameState.timeNow ){
				player.bullets.splice(i, 1);
			}
		});

		// Check for the projectile d
		enemies.forEach((enemy, i) => {
			enemy.update();
			enemy.fire();

			// Check enemy if with orb
			if( collides(orb, enemy) ){
				deathScreen("YOU FAILED", "Monster takes over the nation");
			}
			
			// Collides with enemy
			if( collides(enemy, player) ){
				player.health -= (Math.random() * 30);
				playerHealth.style.width = `${ player.health }%`;
				player.y += 10;
				enemies.splice(i, 1);
			}

			// Check enemy health
			if( enemy.health <= 0 ){
				enemies.splice(i, 1);
				playerScore.innerHTML = ++player.score;
				return;
			}else if( enemy.timeAffected + 1500 < gameState.timeNow ){
				enemy.affected = false;
			}

			// Check for each projectile
			// Then interact
			player.bullets.forEach(bullet => {
				if( circleRect(bullet, enemy) ){
					bullet.execute(enemy);
					enemy.follow(bullet);
				}
			});

		});

		// Update enemies bullets
		enemiesBullet.forEach((bullet, index) => {
			bullet.update(); 
			if( circleRect(bullet, player) ){
				console.log("Ouch!");
				enemiesBullet.splice(index, 1);
				player.health -= (Math.random() * 50);
				player.y += 10;
				playerHealth.style.width = `${ player.health }%`;
				if( player.health <= 0 ){
					playerHealth.style.width = `0`;
					deathScreen("YOU DIED!", "No more space bender 😥");
				}
			}
		});

		// Check for the collision of other boxes
		for(var i = 0; i < enemies.length; i++){
			for(var x = 0; x < enemies.length; x++){
				if( i == x ) continue;
				antiCollide(enemies[i], enemies[x]);
			}
		}
		
	},
	render: function(){
		gameState.timeNow = new Date()
		gameState.timeNow = gameState.timeNow.getTime();
		
		// Enemies, projectiles, and player is moving
		if( gameState.playing ){
			player.render();
			player.bullets.forEach(bullet => {
				bullet.render();
			});
			generateEnemies();
			enemies.forEach(enemy => {
				enemy.render();
				enemy.revert();
			});
			enemiesBullet.forEach(bullet => {
				bullet.render();
			});
			orb.render();

			// Simple easter egg
			if( gameState.egg === null ){
				gameState.egg = gameState.timeNow + 18000;
			}else if( gameState.egg < gameState.timeNow && gameState.egg != -1 && gameState.egg != null ){
				console.log(" ----------------------- ");
				console.log(" Oh it's been 18 seconds, 🥚");
				console.log(" Thank you!");
				console.log(" ----------------------- ");
				gameState.egg = -1;
			}
		}

	}
});

/** Conversation and welcome screen */
var playerStatus	= document.querySelector("#player-status");
var playerHealth   	= document.querySelector("#player-health");
var playerScore		= document.querySelector("#player-score");
var playerHScore	= document.querySelector("#player-high-score");
var domWelcome 		= document.querySelector("#game-welcome");
var domPlayButton 	= document.querySelector("#play-button");
var domStory 		= document.querySelector("#game-story");
var fromConvo		= document.querySelector("#game-convo-from");
var messageConvo	= document.querySelector("#game-convo-message");
var pressAny		= document.querySelector("#press-any");
var currentStory 	= -1;
var convoList = [
	{ from: "You", message: "What happened? Maestro!" },
	{ from: "Maestro", message: "Ohh, Where have you been?"},
	{ from: "You", message: "..."},
	{ from: "Maestro", message: "We were attacked"},
	{ from: "Maestro", message: "Please defend the nation..."},
	{ from: "Maestro", message: "I used up all my mana.\r\nI can't even skip youtube ads"},
	{ from: "Maestro", message: "Just remember our training"},
	{ from: "You", message: "** About to cry **"},
	{ from: "Maestro", message: "Don't cry, you can do it"},
	{ from: "Maestro", message: "Just remember our training"},
	{ from: "Maestro", message: "Cast `Space` magic"},
	{ from: "Maestro", message: "Move like `WASD`"},
	{ from: "Maestro", message: "And use your `Cursor` to find enemies"},
	{ from: "Maestro", message: "I'm counting on you"},
	{ from: "Maestro", message: "** Cough **"},
	{ from: "You", message: "You're going to be all right."},
	{ from: "Maestro", message: "No, ugghh"},
	{ from: "Maestro", message: "Uwuuu ~"},
	{ from: "Maestro", message: "I'm going to die"},
	{ from: "Maestro", message: "For the one last time"},
	{ from: "You", message: "..."},
	{ from: "Maestro", message: "Never gonna give you up 🎶"},
	{ from: "Maestro", message: "Never gonna let you down 🎶"},
	{ from: "Maestro", message: "Never gonna run around and desert you 🎶"},
	{ from: "Maestro", message: "Never gonna make you cry 🎶"},
	{ from: "Maestro", message: "Never gonna say goodbye 🎶"},
	{ from: "Maestro", message: "Never gonna tell a lie and hurrrtt~ youuu.. 🎶"},
	{ from: "You", message: "..."},
	{ from: "Maestro", message: "Good luck, my favorite student"},
	{ from: "You", message: "..."},
	{ from: "You", message: "Maesstroooo!"},
	{ from: "You", message: "Tsk..."}
];
function startUp(){
	if( currentStory >= convoList.length - 1 ) return;

	if( currentStory == -1 ){
		domWelcome.style.display = "none";
		domStory.style.display = "block";
	}
	currentStory++;
	fromConvo.innerHTML = convoList[currentStory].from;
	messageConvo.innerHTML = convoList[currentStory].message;

	if( currentStory == convoList.length - 1 ){
		domStory.style.opacity = "0";
		playerStatus.style.display = "block";
		setTimeout(function(){
			domStory.style.display = "none";
		}, 1000);
		gameStart();
	}
}
domPlayButton.addEventListener("click", function(){
	startUp();
});
bindKeys(['space'], function(){
	startUp();
});