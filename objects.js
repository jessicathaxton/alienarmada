// Sprite, Alien, and Message objects

var spriteObject =
{
  sourceX: 0,
  sourceY: 0,
  sourceWidth: 32,
  sourceHeight: 32,
  width: 32,
  height: 32,
  x: 0,
  y: 0,
  vx: 0,
  vy: 0,
  visible: true,
  
  //Getters
  centerX: function()
  {
    return this.x + (this.width / 2);
  },
  centerY: function()
  {
    return this.y + (this.height / 2);
  },
  halfWidth: function()
  {
    return this.width / 2;
  },
  halfHeight: function()
  {
    return this.height / 2;
  },
};

var alienObject = Object.create(spriteObject);
alienObject.NORMAL = 1;
alienObject.EXPLODED = 2;
alienObject.state = alienObject.NORMAL;
alienObject.update = function() {
  this.sourceX = this.state * this.width;
};

var messageObject = {
  x: 0,
  y: 0,
  visible: true,
  text: "",
  font: "normal bold 20px Helvetica",
  textBaseline: "top"
};






