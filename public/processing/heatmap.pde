 /* @pjs preload="img/foot.png"; */

Blob[] blobs = new Blob[4];
PImage fut; // image for foot
let socket = io();

void setup() {
    size(290, 720); // set size of canvas
    
    colorMode(HSB);

    background(51);

    blobs[0] = new Blob(95,205); // MF
    blobs[1] = new Blob(230, 270); // LF
    blobs[2] = new Blob(100, 380); // MM
    blobs[3] = new Blob(135, 620); // HEEL

    fut = loadImage("img/foot.png");

    socket.on('data', function(data){
        
    });
}

void draw() {

    loadPixels();
    for (int x = 0; x < width; x++) {
        for (int y = 0; y < height; y++) {
            int index = x + y * width;
            float sum = 0;
            for (Blob b : blobs) {
                float d = dist(x, y, b.pos.x, b.pos.y);
                sum += 75 * b.r / d;
            }
            pixels[index] = color(sum, 255, 255);
        }
    }

    updatePixels();
    image(fut, 0, 0);

    for (Blob b : blobs) {
        b.update();
        b.show();
    }
}

class Blob {

    PVector pos;

    float r;

    PVector vel;

    Blob(float x, float y) {

        pos = new PVector(x, y);

        vel = PVector.random2D();

        vel.mult(random(0, 0));

        r = 45;
    }

    void update() {

        pos.add(vel); 

        if (pos.x > width || pos.x < 0) {

            vel.x *= -1;

        }

        if (pos.y > height || pos.y < 0) {

            vel.y *= -1;

        }

    }

    void show() {

        noFill();

        stroke(0);

        strokeWeight(1);

        ellipse(pos.x, pos.y, r*2, r*2);

    }
}