import RenderComponent from "../../components/render-component";
import SpriteFrag from "../../../shaders/sprite.frag";
import SpriteVert from "../../../shaders/sprite.vert";
import SpriteBatch from "./sprite-batch";
export const enum ShaderType {
    Vert, Frag
}
export interface RenderConfig {
    width?:number;
    height?:number;
}
export default class WebGLSystem {
    public static SYSTEM_TYPE:string = "renderer";
    public static GL:WebGLRenderingContext = null;
    public static PROGRAM:WebGLProgram = null;
    public static isWebGLSupported() {
        try{
            let canvas = document.createElement("canvas");
            let webGLRenderingContextExist = !!WebGLRenderingContext;
            let webGLContextExistsInCanvas = !!canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
            return webGLRenderingContextExist && webGLContextExistsInCanvas;
        }
        catch(e) {
            return false;
        }
    }
    public static createShader(shaderSource:string, shaderType:ShaderType, gl:WebGLRenderingContext):WebGLShader {
        let shader:WebGLShader;
        if (shaderType === ShaderType.Frag) {
            shader = gl.createShader(gl.FRAGMENT_SHADER);
        }
        else if (shaderType === ShaderType.Vert) {
            shader = gl.createShader(gl.VERTEX_SHADER);
        }

        gl.shaderSource(shader, shaderSource);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.error("error while compiling the shader:", gl.getShaderInfoLog(shader));
            return null;
        }
        return shader;
    }

    public gl:WebGLRenderingContext;
    public canvas:HTMLCanvasElement;
    public width:number;
    public height:number;
    public systemType:string;
    public shaderProgram:WebGLProgram;

    public rectVerticesBuffer:WebGLBuffer;
    public rectVerticeColorBuffer:WebGLBuffer;
    public cubeVertexIndexBuffer:WebGLBuffer;

    public spriteBatch:SpriteBatch;

    protected _renderComponents: Array<RenderComponent>;
    constructor(config:RenderConfig = {}) {
        this.systemType = WebGLSystem.SYSTEM_TYPE;
        this.width = config.width || 800;
        this.height = config.height || 300;
        this.initGL();
        this.initShaders();
        this.initDefaultBuffers();
        this._renderComponents = [];
        document.body.appendChild(this.canvas);

        this.spriteBatch = new SpriteBatch();
    }

    public addComponentInstance(component:RenderComponent):void {
        this._renderComponents.push(component);
    }
    public removeComponentInstance(component:RenderComponent):void {
        let index = this._renderComponents.indexOf(component);
        if (index !== -1) {
            this._renderComponents.splice(index, 1);
        }
    }

    public initGL():void {
        let canvas = this.canvas = document.createElement("Canvas") as HTMLCanvasElement;
        let opts:WebGLContextAttributes = {
            premultipliedAlpha: false,
            alpha: false,
            antialias: true
        };
        let gl = this.canvas.getContext("webgl", opts) || this.canvas.getContext("experimental-webgl", opts);
        WebGLSystem.GL = this.gl = gl;
        canvas.width = this.width;
        canvas.height = this.height;
        gl.clearColor(0,0,0,1);
        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LEQUAL);
        gl.enable( gl.BLEND );
        gl.blendEquation( gl.FUNC_ADD );
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        gl.viewport(0, 0, this.width, this.height);
    }

    public initShaders() {
        // kolla upp https://github.com/mdn/webgl-examples/blob/gh-pages/tutorial/sample5/webgl-demo.js
        let gl = this.gl;
        let fragShader = WebGLSystem.createShader(SpriteFrag, ShaderType.Frag, gl);
        let vertShader = WebGLSystem.createShader(SpriteVert, ShaderType.Vert, gl);
        let program = this.shaderProgram = WebGLSystem.PROGRAM = gl.createProgram();
        gl.attachShader(program, vertShader);
        gl.attachShader(program, fragShader);
        gl.linkProgram(program);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            console.error("Unable to initialize the shader program:" + gl.getProgramInfoLog(program));
        }
        gl.useProgram(program);

        let resolutionLocation = gl.getUniformLocation(this.shaderProgram, "u_resolution");
        gl.uniform2f(resolutionLocation, this.width, this.height);
    }

    public initDefaultBuffers() {
        let gl = this.gl;

        SpriteBatch.VERTEX_LOCATION = gl.getAttribLocation(this.shaderProgram, "a_position");
        SpriteBatch.VERTEX_BUFFER = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, SpriteBatch.VERTEX_BUFFER );
        gl.enableVertexAttribArray(SpriteBatch.VERTEX_LOCATION );
        gl.vertexAttribPointer(SpriteBatch.VERTEX_LOCATION , 2, gl.FLOAT, false, 0, 0);
        /*
        const vertices = [
            0, 0,
            1, 0,
            0, 1,
            0, 1,
            1, 0,
            1, 1
        ];
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
        */
        SpriteBatch.TEXCOORD_LOCATION = gl.getAttribLocation(this.shaderProgram, "a_texCoord");
        SpriteBatch.TEXCOORD_BUFFER = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, SpriteBatch.TEXCOORD_BUFFER);
        const texCoords = [
            0.0,  0.0,
            1.0,  0.0,
            0.0,  1.0,
            0.0,  1.0,
            1.0,  0.0,
            1.0,  1.0
        ];
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoords), gl.STATIC_DRAW);
        
        gl.enableVertexAttribArray(SpriteBatch.TEXCOORD_LOCATION);
        gl.vertexAttribPointer(SpriteBatch.TEXCOORD_LOCATION, 2, gl.FLOAT, false, 0, 0);
        
    }

    public setGLRectangle(gl:WebGLRenderingContext, x:number, y:number, width:number, height:number) {
        let x1 = x;
        let x2 = x+width;
        let y1 = y;
        let y2 = y+height;
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
            x1, y1,
            x2, y1,
            x1, y2,
            x1, y2,
            x2, y1,
            x2, y2
        ]), gl.STATIC_DRAW);
    }

    public render(delta:number) {
        let resort = false;
        let gl = this.gl;

        // clear buffer
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        // bind necessary buffers
        gl.bindBuffer(gl.ARRAY_BUFFER, SpriteBatch.VERTEX_BUFFER);
        gl.vertexAttribPointer(SpriteBatch.VERTEX_LOCATION, 2, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, SpriteBatch.TEXCOORD_BUFFER);
        gl.vertexAttribPointer(SpriteBatch.TEXCOORD_LOCATION, 2, gl.FLOAT, false, 0, 0);

        // prepare until batch is full

        for(let i = 0; i < this._renderComponents.length; i++) {
            let renderer = this._renderComponents[i];
            if(renderer /*&& renderer.getEntity().isInWorld()*/) {
                if(renderer.requireDepthSort) {
                    resort = true;
                }
                renderer.render(delta, gl, this.spriteBatch);
            }
        }
        this.spriteBatch.render(gl);
        gl.flush();
        if(resort) {
             this._renderComponents.sort((a, b) => {
                 if(a.depth > b.depth) {
                     return 1;
                 }
                 if(a.depth < b.depth) {
                     return -1;
                 }
                 return 0;
             });
        }
    }
}