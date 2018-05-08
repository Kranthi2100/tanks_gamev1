const canvas_width=780
const canvas_height = 520
//tank:player config
const tank_specs_gun_height = 6
const tank_specs_gun_width = 20
let player = {
    x: canvas_width / 2,
    y: canvas_height / 2,
    radius: 20,
    gun: {
        height: tank_specs_gun_height, // also update offset at same time
        width: tank_specs_gun_width,
        offset: tank_specs_gun_height / 2, //dynamically cal'ed,gun stays at cent'
    }
};

let canvas
let pen

let GameComponents = []

class Render{    
    static init(child,tag) {
        Render.objs.push(child)
    }
    static emulate() {
        this.destroy_them = []
        Render.objs.forEach((element) => {
            if (0 > element.x || 0 > element.y)
                this.destroy_them.push(element)
            if (element.x > canvas_width || element.y > canvas_height)
                this.destroy_them.push(element)
        })
        //if (this.destroy_them.length > 0) console.log(this.destroy_them)
        //if(Render.objs.length>0) console.log(Render.objs)
        this.destroy_them.forEach(obj=>obj.destroy())
        Render.objs.forEach(e => {
            e.draw()
        })
    }
    static destroy(child) {
        Render.objs = Render.objs.filter(go => {
            if (go == child) {
                return false
            }
            return true
        })
    }
}
Render.objs = []

class RigidBody{
    static init(child,tag) {
        RigidBody.objs.push(child);
    }
    static emulate() {
        let dist = 0
        RigidBody.objs.forEach(tank => {
            Render.objs.forEach(bullet => {    
                if(bullet instanceof Tank)return 0
                if(bullet.tag == tank.tag)return 0
                dist = Math.sqrt(
                 Math.pow((tank.x - bullet.x), 2)+
                 Math.pow((tank.y - bullet.y), 2)
                )
            if (dist < (tank.radius + bullet.radius)) {
                if(tank.onCollision)
                    tank.onCollision()
                else{
                    console.log(tank)
                }
            }
            })
        })
    }
    static destroy(child) {
        RigidBody.objs = RigidBody.objs.filter(obj => {
            if (obj == child) {
                return false
            }
            return true
        })
    }
}    
RigidBody.objs = []

class AI{
    static init(child,tag) {
        if(tag === "ai"){
            AI.objs.push(child)
        }
        else
        {
            AI.Target = child
        }
    }
    static emulate() {
      let vec_y = 0, vec_x = 0
      AI.objs.forEach( tank =>{
        vec_x = AI.Target.x - tank.x
        vec_y = AI.Target.y - tank.y
        tank.rotate(Math.atan2(vec_y, vec_x))
        if(tank.heat <= 0){
          tank.shoot()
          tank.heat = 500
        }else{
          tank.heat -= 1
        }
    })
    }
    static destroy(child) {
        AI.objs = AI.objs.filter(obj => {
            if (obj == child) {
                return false
            }
            return true
        })
    }
}    
AI.objs = []
AI.Target = undefined

class Bullet{
    constructor(tx, pos_x, pos_y, gun,tag) {
        Bullet.GameComponents.forEach(component => {
            component.init(this,tag)
        })
        this.tag = tag
        this.vec_x = Math.cos(tx)
        this.vec_y = Math.sin(tx)
        this.x = pos_x + (this.vec_x * (gun.width+5))
        this.y = pos_y + (this.vec_y * (gun.width+5))
        this.radius = gun.height/2
    }
    draw() {
        this.x += (this.vec_x * 1)
        this.y += (this.vec_y * 1)
        pen.beginPath();
        pen.arc(this.x, this.y, this.radius, 0,Math.PI*2,false)
        pen.fill();
    }
    destroy() {
        Bullet.GameComponents.forEach(component => {
            component.destroy(this)
        })
    }
}
Bullet.GameComponents = [Render]

class Tank{
    constructor(tank_specs,tag) {
        Tank.GameComponents.forEach(component => {
            component.init(this,tag)
        })
        this.specs = tank_specs
        this.x = this.specs.x
        this.y = this.specs.y
        this.radius = this.specs.radius
        this.turret_rotate = 0
        this.body_rotate = 0
        this.tag = tag
        if(tag === "ai")
            this.heat = 500
        this.init()
    }
    init() {
        let turret_pen = new Path2D()
        turret_pen.arc(this.x,
                     this.y, 
                     this.radius, 0, Math.PI * 2, false)
        this.tank_pen = new Path2D(turret_pen)
        this.tank_pen.rect(this.x,
                    this.y - this.specs.gun.offset,
                    this.specs.gun.width, this.specs.gun.height)
        this.tank_body = new Path2D()
        /*this.tank_body.arc(this.x,
         *   this.y,
         *   this.radius + 5,
         *   0, Math.PI,
         *   false)
        */
        this.tank_body.arc(this.x- (this.radius + 5),this.y,1,0,Math.PI * 2,false)
    }
    rotate(tx) {
        this.turret_rotate = tx
    }
    turn(tx) {
         this.body_rotate += tx
    }
    forward(s) {
     
        this.x = this.x + (Math.cos(this.body_rotate) * s)
        this.y = this.y + (Math.sin(this.body_rotate) * s)
    }
    shoot() {
        new Bullet(
            this.turret_rotate,
            this.x,
            this.y,
            this.specs.gun,
            this.tag
        )
    }
    draw() {
        this.init()
        this.turret_draw()
    }
    turret_draw() {
        //turret
        pen.save()
        pen.translate(this.x, this.y)
        pen.rotate(this.turret_rotate)
        pen.translate(-this.x,-this.y)
        pen.stroke(this.tank_pen)
        pen.restore()
        //body
        pen.save()
        pen.translate(this.x, this.y)
        pen.rotate(this.body_rotate)
        pen.translate(-this.x,-this.y)
        pen.stroke(this.tank_body)
        pen.restore()
    }
    onCollision() {
        this.destroy()
    }
    destroy() {
        if(this.tag === "player"){
            alert("game over!")
            setTimeout(()=>{
                location.reload()
            },10)
        }
        Tank.GameComponents.forEach(component => {
            component.destroy(this)
        })
    }
}
Tank.GameComponents = [Render, RigidBody, AI]

const init = function () {
    canvas = document.getElementById("game_main")
    if (canvas.getContext) {
        pen = canvas.getContext("2d")
        startEngine(canvas)
    }
    //effects init
    GameComponents.push(RigidBody)
    GameComponents.push(Render)
    GameComponents.push(AI)
}

/* code includes
*  border
*/
const startEngine = function(){
    // draw border
    tank = new Tank(player,"player")
    init_canvas_listener(canvas, tank)
    setTimeout(redraw,3)
}

function redraw() {
    //clear&repaint 
    pen.save()
    pen.fillStyle = "white"
    pen.fillRect(0, 0, canvas_width+10, canvas_height+10)
    pen.restore()
    pen.strokeRect(0, 0, canvas_width, canvas_height)
    //Physics Engine
    GameComponents.forEach(function(component){
        component.emulate()
    })
    //Recall function 
    setTimeout(redraw,3)
}

function init_canvas_listener(canvas,tank){
    canvas.addEventListener("mousemove", (e) => {
        tx=0
        relative_y = e.clientY - tank.y || 0
        relative_x = e.clientX - tank.x  || 0
        tx = Math.atan2(relative_y,relative_x)
        tank.rotate(tx)
    })

    canvas.addEventListener("click", (e)=>{
        tank.shoot()
    })

    window.addEventListener("keydown", function (e) {
        if (e.key == "ArrowRight" || e.key.toLowerCase() == "d")
            tank.body_rotate += Math.PI / 2;
    
        else if (e.key == "ArrowLeft" || e.key.toLowerCase() == "a")
            tank.body_rotate -= Math.PI / 2;
        
        else if (e.key == "ArrowDown" || e.key.toLowerCase() == "s")
            tank.forward(10)
        else if (e.key == "ArrowUp" || e.key.toLowerCase() == "w")
            tank.forward(-10)
    })
}


const newTankGenerator = ()=>{
    let radius = player.radius
    let posx = radius + Math.round(Math.random()*1000) % (canvas_width-(radius*2))
    let posy = radius + Math.round(Math.random()*1000) % (canvas_height-(radius*2)) 
    player2 = {...player,
        x:posx,
        y:posy}
    tank2 = new Tank(player2,"ai")
    setTimeout(newTankGenerator,4000)
}

newTankGenerator()