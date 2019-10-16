let game;
 
// global game options
let gameOptions = {
    platformStartSpeed: 350,
    spawnRange: [100, 300],
    platformSizeRange: [100, 250],
    playerGravity: 900,
    jumpForce: 400,
    playerStartPosition: 200,
    jumps: 2
}
 
window.onload = function() {
 
    // object containing configuration options
    let gameConfig = {
        type: Phaser.AUTO,
        width: 976,
        height: 336,
        scene: [preloadGame, playGame],
        backgroundColor: 0x4D4D59,
 
        // physics settings
        physics: {
            default: "arcade",
            arcade: {
                debug: false
            }
        },
        canvas: document.querySelector('canvas') // need this to place game in html
    }
    socket = io();
    game = new Phaser.Game(gameConfig);
}


// preloadGame scene
class preloadGame extends Phaser.Scene{
    constructor(){
        super("PreloadGame");
    }
    preload(){
        this.load.image("platform", "img/platform.png");
        this.load.atlas('canabalt', 'img/sprites.png', 'js/sprites.json');
        this.load.image("play_btn", "img/play_button.png");
        this.load.image("game_title", "img/game_title.png");
        this.load.image("title_bg", "img/game_title_bg.png");
    }
    create(){
 
        // create run animation
        this.anims.create({
            key: 'run',
            repeat: -1,
            frameRate: 20,
            frames: this.anims.generateFrameNames('canabalt', {
                prefix: 'Player_',
                suffix: '.png',
                start: 1,
                end: 16,
                zeroPad: 2
            })
        });

        // add the title for the game in the start menu
        this.add.image(game.config.width / 2, game.config.height * 0.20, "game_title").setDepth(1);

        // add the background image for the start menu
        this.add.image(0, 0, "title_bg").setOrigin(0).setDepth(0);

        // add text to the scene to instruct the user to click the play button of tap their foot to start
        this.instructions = this.add.text(game.config.width * 0.50, game.config.height * 0.90, "click play or tap your shoe to start your daring escape.", { font: '20px Arial' });
        this.instructions.setTint(0xffffff);

        // add a play button and set it as interactive
        this.playButton = this.add.image(game.config.width / 2, game.config.height / 2, "play_btn").setDepth(1);
        this.playButton.setInteractive();

        // on hover change the color of the play button to blue
        this.playButton.on("pointerover", ()=>{
            this.playButton.setTint(0x429bf5);
        });

        // when the user doesn't hover over the play button set the tint back to the original color
        this.playButton.on("pointerout", ()=>{
            this.playButton.setTint(0xffffff); 
        });

        // on click and release start the game
        this.playButton.on("pointerup", ()=>{
            this.scene.start("PlayGame");
        });

        // the player could also just use their shoe to start the game
        socket.on('data', function(){
            if(data.data > 600){
                this.scene.start("PlayGame");
            }
        });

    }
}

// playGame scene
class playGame extends Phaser.Scene{
    constructor(){
        super("PlayGame");
    }
    create(){
 
        // group with all active platforms.
        this.platformGroup = this.add.group({
 
            // once a platform is removed, it's added to the pool
            removeCallback: function(platform){
                platform.scene.platformPool.add(platform)
            }
        });

        var self = this;
 
        // pool
        this.platformPool = this.add.group({
 
            // once a platform is removed from the pool, it's added to the active platforms group
            removeCallback: function(platform){
                platform.scene.platformGroup.add(platform)
            }
        });
 
        // number of consecutive jumps made by the player
        this.playerJumps = 0;
 
        // adding a platform to the game, the arguments are platform width and x position
        this.addPlatform(game.config.width, game.config.width / 2);
 
        // adding the player;
        this.player = this.physics.add.sprite(gameOptions.playerStartPosition, game.config.height / 2, 'canabalt', 'Player_01.png');
        this.player.setGravityY(gameOptions.playerGravity);
        this.player.setDisplaySize(32,48);
        this.player.body.offset.y = 2;
 
        // setting collisions between the player and the platform group
        this.physics.add.collider(this.player, this.platformGroup);
 
        // start the running animation for the player
        this.player.anims.play('run');

        // checking for input
        socket.on('data', function(data){
            if(data.data > 600){
                if(self.player.body.touching.down || (self.playerJumps > 0 && self.playerJumps < gameOptions.jumps)){
                    if(self.player.body.touching.down){
                        self.playerJumps = 0;
                    }
                    self.player.setVelocityY(gameOptions.jumpForce * -1);
                    self.playerJumps++;
                }
            }
        });

    }
 
    // the core of the script: platform are added from the pool or created on the fly
    addPlatform(platformWidth, posX){
        let platform;
        if(this.platformPool.getLength()){
            platform = this.platformPool.getFirst();
            platform.x = posX;
            platform.active = true;
            platform.visible = true;
            this.platformPool.remove(platform);
        }
        else{
            platform = this.physics.add.sprite(posX, game.config.height * 0.8, "platform");
            platform.setImmovable(true);
            platform.setVelocityX(gameOptions.platformStartSpeed * -1);
            this.platformGroup.add(platform);
        }
        platform.displayWidth = platformWidth;
        this.nextPlatformDistance = Phaser.Math.Between(gameOptions.spawnRange[0], gameOptions.spawnRange[1]);
    }
    update(){
 
        // game over
        if(this.player.y > game.config.height){
            this.scene.start("PlayGame");
        }
        this.player.x = gameOptions.playerStartPosition;
 
        // recycling platforms
        let minDistance = game.config.width;
        this.platformGroup.getChildren().forEach(function(platform){
            let platformDistance = game.config.width - platform.x - platform.displayWidth / 2;
            minDistance = Math.min(minDistance, platformDistance);
            if(platform.x < - platform.displayWidth / 2){
                this.platformGroup.killAndHide(platform);
                this.platformGroup.remove(platform);
            }
        }, this);
 
        // adding new platforms
        if(minDistance > this.nextPlatformDistance){
            var nextPlatformWidth = Phaser.Math.Between(gameOptions.platformSizeRange[0], gameOptions.platformSizeRange[1]);
            this.addPlatform(nextPlatformWidth, game.config.width + nextPlatformWidth / 2);
        }
    }
};