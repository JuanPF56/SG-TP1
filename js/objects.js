class Surface {

	//Esfera

	getPosition(u,v){

		var x = Math.cos(v*Math.PI-Math.PI/2)*Math.sin(u*(Math.PI*2));
        var y = Math.sin(v*Math.PI-Math.PI/2);
        var z = Math.cos(v*Math.PI-Math.PI/2)*Math.cos(u*(Math.PI*2));
        return [x,y,z];

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

class Object3D {

  positionBuffer = [];
  normalBuffer = [];
  indexBuffer = [];

  children = [];

  constructor(surface, rows=100, cols=100){

  	for (var i=0; i <= rows; i++) {
        for (var j=0; j <= cols; j++) {

            var u=j/cols;
            var v=i/rows;

            var pos=surface.getPosition(u,v);

            this.positionBuffer.push(pos[0]);
            this.positionBuffer.push(pos[1]);
            this.positionBuffer.push(pos[2]);

            var nrm=surface.getNormal(u,v);

            this.normalBuffer.push(nrm[0]);
            this.normalBuffer.push(nrm[1]);
            this.normalBuffer.push(nrm[2]);

        }
    }

    for (var i=0; i < rows; i++) {

        this.indexBuffer.push(i*(cols+1));
        this.indexBuffer.push((i+1)*(cols+1));

        for (var j=0; j < cols; j++) {
            this.indexBuffer.push(i*(cols+1)+(j+1));
            this.indexBuffer.push((i+1)*(cols+1)+(j+1));
        }

        if(i < rows - 1){
           this.indexBuffer.push((i+1)*(cols+1)+cols);
           this.indexBuffer.push((i+1)*(cols+1));
        }
	
    }

  }

  addChild(child) {

  	this.children.push(child);

  }

  setupBuffers() {

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
