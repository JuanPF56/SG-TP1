class Surface {

	//Esfera

	getPosition(u,v){

		var x = Math.cos(v*Math.PI-Math.PI/2)*Math.sin(u*(Math.PI*2));
        var y = Math.sin(v*Math.PI-Math.PI/2);
        var z = Math.cos(v*Math.PI-Math.PI/2)*Math.cos(u*(Math.PI*2));
        return vec3.fromValues(x,y,z);

    }

    getNormal(alfa,beta){

        var p=this.getPosition(alfa,beta);
        var v=vec3.create();
        vec3.normalize(v,p);

        var delta=0.05;
        var p1=this.getPosition(alfa,beta);
        var p2=this.getPosition(alfa,beta+delta);
        var p3=this.getPosition(alfa+delta,beta);

        var v1=vec3.fromValues(p2[0]-p1[0],p2[1]-p1[1],p2[2]-p1[2]);
        var v2=vec3.fromValues(p3[0]-p1[0],p3[1]-p1[1],p3[2]-p1[2]);

        vec3.normalize(v1,v1);
        vec3.normalize(v2,v2);
        
        var n=vec3.create();
        vec3.cross(n,v1,v2);
        vec3.scale(n,n,-1);
        
        return n;

    }

}


class Transformable {

    posMatrix;
    normMatrix;
    
    constructor(){
        this.posMatrix = mat4.create();
        this.normMatrix = mat4.create();
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


}

class TransformableWithParent extends Transformable {

    parent;

    constructor(parent){
        super();
        this.parent = parent;
    }

    getPosMatrix(){
        let m = mat4.create();
        mat4.mul(m, this.parent.getPosMatrix(), this.posMatrix);
        return m;
    }

    getNormMatrix(){
        let m = mat4.create();
        mat4.mul(m, this.parent.getNormMatrix(), this.normMatrix);
        return m;
    }

}


class Object3D extends TransformableWithParent {

    surface;

    positionBuffer = [];
    normalBuffer = [];
    indexBuffer = [];

    rows = 50;
    cols = 50;

    constructor(surface, parent){
        super(parent);
        this.surface = surface;
    }

    setupBuffers() {

        for (var i=0; i <= this.rows; i++) {
            for (var j=0; j <= this.cols; j++) {

                var u = j/this.cols;
                var v = i/this.rows;

                var p = this.surface.getPosition(u,v);
                var pos = vec4.fromValues(p[0],p[1],p[2],1.0);
                var m = mat4.create();
                mat4.mul(m, this.parent.getPosMatrix(), this.posMatrix);
                vec4.transformMat4(pos,pos,m);

                this.positionBuffer.push(pos[0]);
                this.positionBuffer.push(pos[1]);
                this.positionBuffer.push(pos[2]);

                var n = this.surface.getNormal(u,v);
                var nrm = vec4.fromValues(n[0],n[1],n[2],1.0);
                m = mat4.create();
                mat4.mul(m, this.parent.getNormMatrix(), this.normMatrix);
                vec4.transformMat4(nrm,nrm,m);

                this.normalBuffer.push(nrm[0]);
                this.normalBuffer.push(nrm[1]);
                this.normalBuffer.push(nrm[2]);

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

    draw() {

        let triangleBuffers = this.setupBuffers();

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