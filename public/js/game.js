let game;
 
// global game options
let gameOptions = {
    platformStartSpeed: 350,
    spawnRange: [100, 350],
    platformSizeRange: [50, 250],
    playerGravity: 900,
    jumpForce: 400,
    playerStartPosition: 200,
    jumps: 2
}
 
window.onload = function() {
 
    // object containing configuration options
    let gameConfig = {
        type: Phaser.AUTO,
        width: 667,
        height: 375,
        scene: playGame,
        backgroundColor: 0x444444,
 
        // physics settings
        physics: {
            default: "arcade",
            arcade: {
                debug: false
            }
        },
        canvas: document.querySelector('canvas') // need this to place game in html
    }
    game = new Phaser.Game(gameConfig);
}
 
// playGame scene
class playGame extends Phaser.Scene{
    constructor(){
        super("PlayGame");
    }
    preload(){
        this.load.image("platform", "img/platform.png");
        this.load.atlas('canabalt', 'img/sprites.png', 'js/sprites.json');
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
        this.socket = io();
 
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
 
        this.player.play('run');

        // checking for input
        this.socket.on('data', function(data){
            if(data.data > 600){
                console.log(data.data);
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