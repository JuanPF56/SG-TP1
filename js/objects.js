class Transformable {

    posMatrix;
    children = [];
    
    constructor(children=[]){
        this.posMatrix = mat4.create();
        this.children = this.children.concat(children);
    }

    addChildren(children){
         this.children = this.children.concat(children);
    }

    getPosMatrix(){
        return this.posMatrix;
    }

    getNormMatrix(){
        var normMat = mat4.create(); 
        mat4.invert(normMat, this.posMatrix);
        mat4.transpose(normMat,normMat);
        return normMat;
    }

    translate(deltaX, deltaY, deltaZ){
        mat4.translate(this.posMatrix,this.posMatrix,[deltaX,deltaY,deltaZ]);
    }

    rotateX(angle){
        mat4.rotateX(this.posMatrix,this.posMatrix,angle);
    }

    rotateY(angle){
        mat4.rotateY(this.posMatrix,this.posMatrix,angle);
    }

    rotateZ(angle){
        mat4.rotateZ(this.posMatrix,this.posMatrix,angle);
    }

    scale(scaleFactor){
        mat4.scale(this.posMatrix,this.posMatrix,[scaleFactor,scaleFactor,scaleFactor]);
    }

    draw(parentPosMat, parentNormMat){

        var posMat = mat4.create();
        mat4.mul(posMat, parentPosMat, this.posMatrix);
        var normMat = mat4.create();
        mat4.mul(normMat, parentNormMat, this.getNormMatrix());

        this.children.forEach(child => child.draw(posMat,normMat));
        
    }


}

class Object3D extends Transformable {

    surface;

    positionBuffer = [];
    normalBuffer = [];
    indexBuffer = [];

    constructor(surface, children=[]){
        super(children);
        this.surface = surface;
    }

    setupBuffers(posMat, normMat) {

        this.positionBuffer = this.surface.getPositionBuffer(posMat);
        this.normalBuffer = this.surface.getNormalBuffer(normMat);
        this.indexBuffer = this.surface.getIndexBuffer();

        
        let webgl_position_buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, webgl_position_buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.positionBuffer), gl.STATIC_DRAW);
        webgl_position_buffer.itemSize = 3;
        webgl_position_buffer.numItems = this.positionBuffer.length / 3;

        let webgl_normal_buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, webgl_normal_buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.normalBuffer), gl.STATIC_DRAW);
        webgl_normal_buffer.itemSize = 3;
        webgl_normal_buffer.numItems = this.normalBuffer.length / 3;

        let webgl_index_buffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, webgl_index_buffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.indexBuffer), gl.STATIC_DRAW);
        webgl_index_buffer.itemSize = 1;
        webgl_index_buffer.numItems = this.indexBuffer.length;

        return {
            webgl_position_buffer,
            webgl_normal_buffer,
            webgl_index_buffer
        }

    }

    draw(parentPosMat, parentNormMat) {

        super.draw(parentPosMat, parentNormMat);

        var posMat = mat4.create();
        mat4.mul(posMat, parentPosMat, this.posMatrix);
        var normMat = mat4.create();
        mat4.mul(normMat, parentNormMat, this.getNormMatrix());

        let triangleBuffers = this.setupBuffers(posMat, normMat);

        vertexPositionAttribute = gl.getAttribLocation(glProgram, "aVertexPosition");
        gl.enableVertexAttribArray(vertexPositionAttribute);
        gl.bindBuffer(gl.ARRAY_BUFFER, triangleBuffers.webgl_position_buffer);
        gl.vertexAttribPointer(vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);

        vertexNormalAttribute = gl.getAttribLocation(glProgram, "aVertexNormal");
        gl.enableVertexAttribArray(vertexNormalAttribute);
        gl.bindBuffer(gl.ARRAY_BUFFER, triangleBuffers.webgl_normal_buffer);
        gl.vertexAttribPointer(vertexNormalAttribute, 3, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, triangleBuffers.webgl_index_buffer);
        gl.drawElements(gl.TRIANGLE_STRIP, triangleBuffers.webgl_index_buffer.numItems, gl.UNSIGNED_SHORT, 0);

    }

}

class Terrain extends Object3D{

    constructor(children=[]){
        super(new RevolutionSurface(new CubicBezier2D(readSVGpath("terreno")), 8, 8), children);
    }

}

class Platform extends Object3D{

    constructor(children=[]){
        super(new RevolutionSurface(new CubicBezier2D(readSVGpath("plataforma")), 10, 20), children);
    }

}

class Tower extends Object3D{

    constructor(children=[]){
        super(new RevolutionSurface(new CubicBezier2D(readSVGpath("torre")), 10, 20), children);
    }

}

class TowerC extends Object3D{

    constructor(children=[]){
        super(new RevolutionSurface(new CubicBezier2D(readSVGpath("torreC")), 10, 20), children);
    }

}

class Roof extends Object3D{

    constructor(children=[]){
        super(new RevolutionSurface(new CubicBezier2D(readSVGpath("techoTC")), 10, 20), children);
    }

}

class Window extends Object3D{

    constructor(height=1,width=1,length=5,scaleFactor=0,rotationFactor=0,children=[]){
        super(new SweepSurface(new CubicBezier2D(readSVGpath("ventana")),new CubicBezier2D([[-length/2,0],[-length/4,0],[length/4,0],[length/2,0]]),10,20,scaleFactor,rotationFactor,height,width), children);
    }
}

class Block extends Object3D{

    constructor(height=1,width=1,length=2,scaleFactor=0,rotationFactor=0,children=[]){
        super(new SweepSurface(new CubicBezier2D(readSVGpath("cuadrado")),new CubicBezier2D([[-length/2,0],[-length/4,0],[length/4,0],[length/2,0]]),10,20,scaleFactor,rotationFactor,height,width), children);
    }
}

class Cylinder extends Object3D{

    constructor(height=1,width=1,length=5,scaleFactor=0,rotationFactor=0,children=[]){
        super(new SweepSurface(new CubicBezier2D(readSVGpath("circulo")),new CubicBezier2D([[-length/2,0],[-length/4,0],[length/4,0],[length/2,0]]),10,20,scaleFactor,rotationFactor,height,width), children);
    }
}

class Wall extends Object3D{

    constructor(length=5,scaleFactor=0,rotationFactor=0,children=[]){

        var shapeCurve = new CubicBezier2D(readSVGpath("muralla"));
        super(new SweepSurface(shapeCurve,new CubicBezier2D([[-length/2,0],[-length/4,0],[length/4,0],[length/2,0]]),10,20,scaleFactor,rotationFactor,1,1,false), children);
        mat4.translate(this.posMatrix,this.posMatrix,[0,0,shapeCurve.getCenter()[1]/10]);
    }

}

class Plane extends Object3D{
    constructor(children=[]){
        super(new Surface(), children);
    }
}

class Sphere extends Object3D{
    constructor(children=[]){
        super(new SphereSurf(), children);
    }
}