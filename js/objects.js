class Transformable {

    posMatrix;
    normMatrix;
    children = [];
    
    constructor(children=[]){
        this.posMatrix = mat4.create();
        this.normMatrix = mat4.create();
        this.children = this.children.concat(children);
    }

    addChildren(children){
         this.children = this.children.concat(children);
    }

    getPosMatrix(){
        return this.posMatrix;
    }

    getNormMatrix(){
        return this.normMatrix;
    }

    translate(deltaX, deltaY, deltaZ){
        mat4.translate(this.posMatrix,this.posMatrix,[deltaX,deltaY,deltaZ]);
    }

    rotateX(angle){
        mat4.rotateX(this.posMatrix,this.posMatrix,angle);
        mat4.rotateX(this.normMatrix,this.normMatrix,angle);
    }

    rotateY(angle){
        mat4.rotateY(this.posMatrix,this.posMatrix,angle);
        mat4.rotateY(this.normMatrix,this.normMatrix,angle);
    }

    rotateZ(angle){
        mat4.rotateZ(this.posMatrix,this.posMatrix,angle);
        mat4.rotateZ(this.normMatrix,this.normMatrix,angle);
    }

    scale(scaleFactor){
        mat4.scale(this.posMatrix,this.posMatrix,[scaleFactor,scaleFactor,scaleFactor]);
        mat4.scale(this.normMatrix,this.normMatrix,[scaleFactor,scaleFactor,scaleFactor]);
    }

    draw(parentPosMat, parentNormMat){

        var posMat = mat4.create();
        mat4.mul(posMat, parentPosMat, this.posMatrix);
        var normMat = mat4.create();
        mat4.mul(normMat, parentNormMat, this.normMatrix);

        this.children.forEach(child => child.draw(posMat,normMat));
        //for (var i = 0; i < this.children.length; i++) {
          //  this.children[i].draw(parentPosMat, parentNormMat);
        //}
    }


}

class Object3D extends Transformable {

    surface;

    positionBuffer = [];
    normalBuffer = [];
    indexBuffer = [];

    rows = 50;
    cols = 50;

    constructor(surface, children=[]){
        super(children);
        this.surface = surface;
    }

    setupBuffers(posMat, normMat) {

        for (var i=0; i <= this.rows; i++) {
            for (var j=0; j <= this.cols; j++) {

                var u = j/this.cols;
                var v = i/this.rows;

                var p = this.surface.getPosition(u,v);
                var pos = vec4.fromValues(p[0],p[1],p[2],1.0);
                vec4.transformMat4(pos,pos,posMat);

                this.positionBuffer.push(pos[0]);
                this.positionBuffer.push(pos[1]);
                this.positionBuffer.push(pos[2]);

                var n = this.surface.getNormal(u,v);
                var nrm = vec4.fromValues(n[0],n[1],n[2],1.0);
                vec4.transformMat4(nrm,nrm,normMat);

                var normalVec = vec3.fromValues(nrm[0],nrm[1],nrm[2]); 
                vec3.normalize(normalVec,normalVec);

                this.normalBuffer.push(normalVec[0]);
                this.normalBuffer.push(normalVec[1]);
                this.normalBuffer.push(normalVec[2]);

            }
        }

        for (var i=0; i < this.rows; i++) {

            this.indexBuffer.push(i*(this.cols+1));
            this.indexBuffer.push((i+1)*(this.cols+1));

            for (var j=0; j < this.cols; j++) {
                this.indexBuffer.push(i*(this.cols+1)+(j+1));
                this.indexBuffer.push((i+1)*(this.cols+1)+(j+1));
            }

            if(i < this.rows - 1){
               this.indexBuffer.push((i+1)*(this.cols+1)+this.cols);
               this.indexBuffer.push((i+1)*(this.cols+1));
            }

        }

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
        mat4.mul(normMat, parentNormMat, this.normMatrix);

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