class Transformable {

    // Objeto "Transformable" para agrupar otros objetos

    posMatrix;
    completePosMatrix;
    children = [];
    
    constructor(children=[]){
        this.posMatrix = mat4.create();
        this.completePosMatrix = mat4.create();
        this.children = this.children.concat(children);
    }

    addChildren(children){
         this.children = this.children.concat(children);
    }

    getPosMatrix(){
        return this.posMatrix;
    }

    getCompletePosMatrix(){
        return this.completePosMatrix;
    }

    setPosMatrix(posMatrix){
        this.posMatrix = posMatrix;
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

        mat4.mul(this.completePosMatrix, parentPosMat, this.posMatrix);
        var normMat = mat4.create();
        mat4.mul(normMat, parentNormMat, this.getNormMatrix());

        this.children.forEach(child => child.draw(this.completePosMatrix,normMat));
        
    }


}

class Object3D extends Transformable {

    surface;
    color;
    texture;
    textureNormal;

    ambFactor; // Parámetro de iluminación de ambiente
    difFactor; // Parámetro de iluminación difusa

    specular; // Refleja especularmente?
    lightSource; // Es una fuente de luz?

    positionBuffer = [];
    normalBuffer = [];
    tangentBuffer = [];
    biNormalBuffer = [];
    colorBuffer = [];
    uvBuffer = [];
    indexBuffer = [];

    constructor(color,surface,children=[]){

        super(children);

        this.surface = surface;
        this.color = color;
        this.texture = textures.uvGrid;
        this.textureNormal = textures.uvGrid;

        this.ambFactor = 1.0;
        this.difFactor = 1.0;

        this.lightSource = false;
        this.specular = false;

    }

    setTexture(texture){
        this.texture = texture;
    }

    setTextureNormal(textureNormal){
        this.textureNormal = textureNormal;
    }

    setLightingParams(ambFactor,difFactor,isLightSource,isSpecular){
        this.ambFactor = ambFactor;
        this.difFactor = difFactor;
        this.lightSource = isLightSource;
        this.specular = isSpecular;
    }

    setupBuffers(posMat, normMat) {

        var buffersTBN = this.surface.getTBNBuffers(normMat);

        this.positionBuffer = this.surface.getPositionBuffer(posMat);
        this.normalBuffer = buffersTBN.normalBuffer;
        this.tangentBuffer = buffersTBN.tangentBuffer;
        this.biNormalBuffer = buffersTBN.biNormalBuffer;

        this.uvBuffer = this.surface.getUVBuffer();

        for(var i=0; i<this.positionBuffer.length; i += 3){
            this.colorBuffer.push(this.color[0]/255);
            this.colorBuffer.push(this.color[1]/255);
            this.colorBuffer.push(this.color[2]/255);
        }
        
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

        let webgl_tangent_buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, webgl_tangent_buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.tangentBuffer), gl.STATIC_DRAW);
        webgl_tangent_buffer.itemSize = 3;
        webgl_tangent_buffer.numItems = this.tangentBuffer.length / 3;

        let webgl_binormal_buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, webgl_binormal_buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.biNormalBuffer), gl.STATIC_DRAW);
        webgl_binormal_buffer.itemSize = 3;
        webgl_binormal_buffer.numItems = this.biNormalBuffer.length / 3;

        let webgl_color_buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, webgl_color_buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.colorBuffer), gl.STATIC_DRAW);
        webgl_color_buffer.itemSize = 3;
        webgl_color_buffer.numItems = this.colorBuffer.length / 3; 

        let webgl_uv_buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, webgl_uv_buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.uvBuffer), gl.STATIC_DRAW);    
        webgl_uv_buffer.itemSize = 2;
        webgl_uv_buffer.numItems = this.uvBuffer.length / 2; 

        let webgl_index_buffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, webgl_index_buffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.indexBuffer), gl.STATIC_DRAW);
        webgl_index_buffer.itemSize = 1;
        webgl_index_buffer.numItems = this.indexBuffer.length;

        return {
            webgl_position_buffer,
            webgl_normal_buffer,
            webgl_tangent_buffer,
            webgl_binormal_buffer,
            webgl_color_buffer,
            webgl_uv_buffer,
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

        vertexTangentAttribute = gl.getAttribLocation(glProgram, "aVertexTangent");
        gl.enableVertexAttribArray(vertexTangentAttribute);
        gl.bindBuffer(gl.ARRAY_BUFFER, triangleBuffers.webgl_tangent_buffer);
        gl.vertexAttribPointer(vertexTangentAttribute, 3, gl.FLOAT, false, 0, 0);

        vertexBiNormalAttribute = gl.getAttribLocation(glProgram, "aVertexBiNormal");
        gl.enableVertexAttribArray(vertexBiNormalAttribute);
        gl.bindBuffer(gl.ARRAY_BUFFER, triangleBuffers.webgl_binormal_buffer);
        gl.vertexAttribPointer(vertexBiNormalAttribute, 3, gl.FLOAT, false, 0, 0);

        vertexColorAttribute = gl.getAttribLocation(glProgram, "aVertexColor");
        gl.enableVertexAttribArray(vertexColorAttribute);
        gl.bindBuffer(gl.ARRAY_BUFFER, triangleBuffers.webgl_color_buffer);
        gl.vertexAttribPointer(vertexColorAttribute, 3, gl.FLOAT, false, 0, 0);

        vertexUVAttribute = gl.getAttribLocation(glProgram, "aVertexUv");
        gl.enableVertexAttribArray(vertexUVAttribute);
        gl.bindBuffer(gl.ARRAY_BUFFER, triangleBuffers.webgl_uv_buffer);
        gl.vertexAttribPointer(vertexUVAttribute, 2, gl.FLOAT, false, 0, 0);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.uniform1i(glProgram.samplerUniform1, 0);

        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, this.textureNormal);
        gl.uniform1i(glProgram.samplerUniform2, 0);

        gl.uniform1f(ambFactor, this.ambFactor);
        gl.uniform1f(difFactor, this.difFactor);

        gl.uniform1f(isLightSource, this.lightSource);
        gl.uniform1f(isSpecular, this.specular);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, triangleBuffers.webgl_index_buffer);

        gl.drawElements(gl.TRIANGLE_STRIP, triangleBuffers.webgl_index_buffer.numItems, gl.UNSIGNED_SHORT, 0);
    }

}

class Terrain extends Object3D{

    constructor(color,children=[]){
        super(color,new RevolutionSurface(new CubicBezier2D(readSVGpath("terreno")), 8, 8, 8), children);
        this.texture = textures.grass;
        this.textureNormal = textures.grassN;
    }

    terrainUVBuffer(scale, offset){

        var terrainUVBuffer = [];

        for(var i = 0; i < this.positionBuffer.length; i += 3){

            terrainUVBuffer.push(this.positionBuffer[i]*scale+offset);
            terrainUVBuffer.push(this.positionBuffer[i+1]*scale+offset);

        }

        return terrainUVBuffer;

    }

    setupBuffers(posMat, normMat) {

        var buffersTBN = this.surface.getTBNBuffers(normMat);

        this.positionBuffer = this.surface.getPositionBuffer(posMat);
        this.normalBuffer = buffersTBN.normalBuffer;
        this.tangentBuffer = buffersTBN.tangentBuffer;
        this.biNormalBuffer = buffersTBN.biNormalBuffer;

        this.uvBuffer = this.terrainUVBuffer(2,0);

        for(var i=0; i<this.positionBuffer.length; i += 3){
            this.colorBuffer.push(this.color[0]/255);
            this.colorBuffer.push(this.color[1]/255);
            this.colorBuffer.push(this.color[2]/255);
        }
        
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

        let webgl_tangent_buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, webgl_tangent_buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.tangentBuffer), gl.STATIC_DRAW);
        webgl_tangent_buffer.itemSize = 3;
        webgl_tangent_buffer.numItems = this.tangentBuffer.length / 3;

        let webgl_binormal_buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, webgl_binormal_buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.biNormalBuffer), gl.STATIC_DRAW);
        webgl_binormal_buffer.itemSize = 3;
        webgl_binormal_buffer.numItems = this.biNormalBuffer.length / 3;

        let webgl_color_buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, webgl_color_buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.colorBuffer), gl.STATIC_DRAW);
        webgl_color_buffer.itemSize = 3;
        webgl_color_buffer.numItems = this.colorBuffer.length / 3; 

        let webgl_uv_buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, webgl_uv_buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.uvBuffer), gl.STATIC_DRAW);    
        webgl_uv_buffer.itemSize = 2;
        webgl_uv_buffer.numItems = this.uvBuffer.length / 2; 

        let webgl_index_buffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, webgl_index_buffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.indexBuffer), gl.STATIC_DRAW);
        webgl_index_buffer.itemSize = 1;
        webgl_index_buffer.numItems = this.indexBuffer.length;

        return {
            webgl_position_buffer,
            webgl_normal_buffer,
            webgl_tangent_buffer,
            webgl_binormal_buffer,
            webgl_color_buffer,
            webgl_uv_buffer,
            webgl_index_buffer
        }

    }

}

class Platform extends Object3D{

    constructor(color,children=[]){
        super(color,new RevolutionSurface(new CubicBezier2D(readSVGpath("plataforma")), 5, 10, 4), children);
        this.texture = textures.grass;
        this.textureNormal = textures.grassN;
    }

    terrainUVBuffer(scale, offset){

        var terrainUVBuffer = [];

        for(var i = 0; i < this.positionBuffer.length; i += 3){

            terrainUVBuffer.push(this.positionBuffer[i]*scale+offset);
            terrainUVBuffer.push(this.positionBuffer[i+1]*scale+offset);

        }

        return terrainUVBuffer;

    }

    setupBuffers(posMat, normMat) {

        var buffersTBN = this.surface.getTBNBuffers(normMat);

        this.positionBuffer = this.surface.getPositionBuffer(posMat);
        this.normalBuffer = buffersTBN.normalBuffer;
        this.tangentBuffer = buffersTBN.tangentBuffer;
        this.biNormalBuffer = buffersTBN.biNormalBuffer;

        this.uvBuffer = this.terrainUVBuffer(2,0);

        for(var i=0; i<this.positionBuffer.length; i += 3){
            this.colorBuffer.push(this.color[0]/255);
            this.colorBuffer.push(this.color[1]/255);
            this.colorBuffer.push(this.color[2]/255);
        }
        
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

        let webgl_tangent_buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, webgl_tangent_buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.tangentBuffer), gl.STATIC_DRAW);
        webgl_tangent_buffer.itemSize = 3;
        webgl_tangent_buffer.numItems = this.tangentBuffer.length / 3;

        let webgl_binormal_buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, webgl_binormal_buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.biNormalBuffer), gl.STATIC_DRAW);
        webgl_binormal_buffer.itemSize = 3;
        webgl_binormal_buffer.numItems = this.biNormalBuffer.length / 3;

        let webgl_color_buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, webgl_color_buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.colorBuffer), gl.STATIC_DRAW);
        webgl_color_buffer.itemSize = 3;
        webgl_color_buffer.numItems = this.colorBuffer.length / 3; 

        let webgl_uv_buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, webgl_uv_buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.uvBuffer), gl.STATIC_DRAW);    
        webgl_uv_buffer.itemSize = 2;
        webgl_uv_buffer.numItems = this.uvBuffer.length / 2; 

        let webgl_index_buffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, webgl_index_buffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.indexBuffer), gl.STATIC_DRAW);
        webgl_index_buffer.itemSize = 1;
        webgl_index_buffer.numItems = this.indexBuffer.length;

        return {
            webgl_position_buffer,
            webgl_normal_buffer,
            webgl_tangent_buffer,
            webgl_binormal_buffer,
            webgl_color_buffer,
            webgl_uv_buffer,
            webgl_index_buffer
        }

    }

}

class Tower extends Object3D{

    constructor(color,height=1,children=[]){
        var path = readSVGpath("torre");
        for(var i=0;i<path.length;i++){
            if(i>16){
                path[i][1] = path[i][1]*height;
            }
        }
        super(color,new RevolutionSurface(new CubicBezier2D(path), 10, 15, 1), children);
        this.texture = textures.brick;
        this.textureNormal = textures.brickN;
    }

}

class TowerC extends Object3D{

    constructor(color,height=1, children=[]){
        var path = readSVGpath("torreC");
        for(var i=0;i<path.length;i++){
            if(i>10){
                path[i][1] = path[i][1]*height;
            }
        }
        super(color,new RevolutionSurface(new CubicBezier2D(path), 10, 15, 1), children);
        this.texture = textures.marble;
        this.textureNormal = textures.marbleN;
    }

}

class Roof extends Object3D{

    constructor(color,children=[]){
        super(color,new RevolutionSurface(new CubicBezier2D(readSVGpath("techoTC")), 5, 10, 2), children);
        this.texture = textures.tiles;
        this.textureNormal = textures.tilesN;
    }

}

class Window extends Object3D{

    constructor(color,height=1,width=1,length=5,scaleFactor=0,rotationFactor=0,children=[]){
        super(color,new SweepSurface(new CubicBezier2D(readSVGpath("ventana")),new CubicBezier2D([[-length/2,0],[-length/4,0],[length/4,0],[length/2,0]]),5,10,scaleFactor,rotationFactor,height,width, 0.4), children);
        this.texture = textures.glass;
        this.textureNormal = textures.glassN;
        this.ambFactor = 0.3;
        this.difFactor = 0.5;
        this.specular = true;
    }
}

class Block extends Object3D{

    constructor(color,height=1,width=1,length=2,scaleFactor=0,rotationFactor=0,children=[]){
        super(color,new SweepSurface(new CubicBezier2D(readSVGpath("cuadrado")),new CubicBezier2D([[-length/2,0],[-length/4,0],[length/4,0],[length/2,0]]),5,10,scaleFactor,rotationFactor,height,width, 0.1), children);
    }
}

class Cylinder extends Object3D{

    constructor(color,height=1,width=1,length=5,scaleFactor=0,rotationFactor=0,children=[]){
        super(color,new SweepSurface(new CubicBezier2D(readSVGpath("circulo")),new CubicBezier2D([[-length/2,0],[-length/4,0],[length/4,0],[length/2,0]]),5,10,scaleFactor,rotationFactor,height,width, 0.4), children);
    }
}

class Wall extends Object3D{

    constructor(color,path,height=1,width=1,scaleFactor=0,rotationFactor=0,short=false,children=[]){

        var shapePath = readSVGpath("muralla");
        for(var i=0;i<shapePath.length;i++){
            if(i<3 || i>22){
                shapePath[i][1] = shapePath[i][1]*height;
            }
        }
        var shapeCurve = new CubicBezier2D(shapePath);
        var sampleRate = 10;
        var textureSteps = 0.1;
        if (short) {
            sampleRate = 5;
            textureSteps = 0.05;

        }
        shapeCurve.setCenter([shapeCurve.getCenter()[0],-shapePath[0][1]]);
        super(color,new SweepSurface(shapeCurve,new CubicBezier2D(path),5,sampleRate,scaleFactor,rotationFactor,1,width,false,textureSteps), children);
        this.texture = textures.brick;
        this.textureNormal = textures.brickN;
    }

}

class Plane extends Object3D{

    scale = 1.5;
    offsetX = 0;
    offsetY = 0;

    constructor(color,children=[]){
        super(color,new Surface(), children);
        this.difFactor = 0.5;
        this.specular = true;
    }

    setOffsets(offsetX,offsetY){
        this.offsetX = offsetX;
        this.offsetY = offsetY;
    }

    planeUVBuffer(){

        var planeUVBuffer = [];

        for(var i = 0; i < this.positionBuffer.length; i += 3){

            planeUVBuffer.push(this.positionBuffer[i]*this.scale+this.offsetX);
            planeUVBuffer.push(this.positionBuffer[i+1]*this.scale+this.offsetY);

        }

        return planeUVBuffer;

    }

    setupBuffers(posMat, normMat) {

        var buffersTBN = this.surface.getTBNBuffers(normMat);

        this.positionBuffer = this.surface.getPositionBuffer(posMat);
        this.normalBuffer = buffersTBN.normalBuffer;
        this.tangentBuffer = buffersTBN.tangentBuffer;
        this.biNormalBuffer = buffersTBN.biNormalBuffer;

        this.uvBuffer = this.planeUVBuffer();

        for(var i=0; i<this.positionBuffer.length; i += 3){
            this.colorBuffer.push(this.color[0]/255);
            this.colorBuffer.push(this.color[1]/255);
            this.colorBuffer.push(this.color[2]/255);
        }
        
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

        let webgl_tangent_buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, webgl_tangent_buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.tangentBuffer), gl.STATIC_DRAW);
        webgl_tangent_buffer.itemSize = 3;
        webgl_tangent_buffer.numItems = this.tangentBuffer.length / 3;

        let webgl_binormal_buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, webgl_binormal_buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.biNormalBuffer), gl.STATIC_DRAW);
        webgl_binormal_buffer.itemSize = 3;
        webgl_binormal_buffer.numItems = this.biNormalBuffer.length / 3;

        let webgl_color_buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, webgl_color_buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.colorBuffer), gl.STATIC_DRAW);
        webgl_color_buffer.itemSize = 3;
        webgl_color_buffer.numItems = this.colorBuffer.length / 3; 

        let webgl_uv_buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, webgl_uv_buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.uvBuffer), gl.STATIC_DRAW);    
        webgl_uv_buffer.itemSize = 2;
        webgl_uv_buffer.numItems = this.uvBuffer.length / 2; 

        let webgl_index_buffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, webgl_index_buffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.indexBuffer), gl.STATIC_DRAW);
        webgl_index_buffer.itemSize = 1;
        webgl_index_buffer.numItems = this.indexBuffer.length;

        return {
            webgl_position_buffer,
            webgl_normal_buffer,
            webgl_tangent_buffer,
            webgl_binormal_buffer,
            webgl_color_buffer,
            webgl_uv_buffer,
            webgl_index_buffer
        }

    }

}

class Sphere extends Object3D{
    constructor(color,children=[]){
        super(color,new SphereSurf(), children);
        this.lightSource = true;
    }
}