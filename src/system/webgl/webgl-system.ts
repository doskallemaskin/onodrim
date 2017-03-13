import { CoreConfig } from '../../core';
import RenderComponent from '../../components/render-component';
import SpriteFrag from '../../shaders/sprite.frag';
import SpriteVert from '../../shaders/sprite.vert';
import SpriteBatch from './sprite-batch';
export const enum ShaderType {
    vert, frag
}
export default class WebGLSystem {
    public static SYSTEM_TYPE:string = 'renderer';
    public static GL:WebGLRenderingContext;
    public static PROGRAM:WebGLProgram;
    public static isWebGLSupported() {
        try{
            const canvas = document.createElement('canvas');
            const webGLRenderingContextExist = !!WebGLRenderingContext;
            const webGLContextExistsInCanvas = !!canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
            return webGLRenderingContextExist && webGLContextExistsInCanvas;
        }
        catch(e) {
            return false;
        }
    }
    public static createShader(shaderSource:string, shaderType:ShaderType, gl:WebGLRenderingContext):WebGLShader|null {
        let shader:WebGLShader|null = null;
        if (shaderType === ShaderType.frag) {
            shader = gl.createShader(gl.FRAGMENT_SHADER);
        }
        else if (shaderType === ShaderType.vert) {
            shader = gl.createShader(gl.VERTEX_SHADER);
        }

        gl.shaderSource(shader, shaderSource);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.error('error while compiling the shader:', gl.getShaderInfoLog(shader));
            return null;
        }
        return shader;
    }

    public gl:WebGL2RenderingContext;
    public canvas:HTMLCanvasElement;
    public width:number;
    public height:number;
    public systemType:string;
    public shaderProgram:WebGLProgram;

    public rectVerticesBuffer:WebGLBuffer;
    public rectVerticeColorBuffer:WebGLBuffer;
    public cubeVertexIndexBuffer:WebGLBuffer;

    public spriteBatch:SpriteBatch;

    protected _renderComponents: RenderComponent[];
    constructor(config:CoreConfig = {}) {
        this.systemType = WebGLSystem.SYSTEM_TYPE;
        this.width = config.width || 800;
        this.height = config.height || 300;
        if (!config.canvas) {
            this.canvas = document.createElement('canvas');
            document.body.appendChild(this.canvas);
        }
        else {
            this.canvas = config.canvas;
        }
        this.initGL();
        this.initShaders();
        this._renderComponents = [];

        this.spriteBatch = new SpriteBatch(this.gl, this.shaderProgram);
        this.spriteBatch.createBuffers();
    }

    public addComponentInstance(component:RenderComponent):void {
        this._renderComponents.push(component);
    }
    public removeComponentInstance(component:RenderComponent):void {
        const index = this._renderComponents.indexOf(component);
        if (index !== -1) {
            this._renderComponents.splice(index, 1);
        }
    }

    public initGL():void {
        const canvas = this.canvas;
        const opts:WebGLContextAttributes = {
            premultipliedAlpha: false,
            alpha: false,
            antialias: false
        };
        const gl =
            this.canvas.getContext('webgl2', opts) ||
            this.canvas.getContext('experimental-webgl2', opts);
        if (!gl) {
            console.error('Web GL Context could not be initialized');
            return;
        }
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
        const gl = this.gl;
        const fragShader = WebGLSystem.createShader(SpriteFrag, ShaderType.frag, gl);
        const vertShader = WebGLSystem.createShader(SpriteVert, ShaderType.vert, gl);
        const program = gl.createProgram();
        if (!program) {
            console.error('program could not be initialized');
            return;
        }
        this.shaderProgram = WebGLSystem.PROGRAM = program;
        gl.attachShader(program, vertShader);
        gl.attachShader(program, fragShader);
        gl.linkProgram(program);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            console.error('Unable to initialize the shader program:' + gl.getProgramInfoLog(program));
        }
        gl.useProgram(program);

        const resolutionLocation = gl.getUniformLocation(this.shaderProgram, 'u_resolution');
        gl.uniform2f(resolutionLocation, this.width, this.height);
    }

    public render(delta:number) {
        const gl = this.gl;
        this.resize();
        gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);

        // clear buffer
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        let resort = false;
        const numComponents = this._renderComponents.length;
        for(let i = 0; i < numComponents; ++i) {
            const renderer = this._renderComponents[i];
            if(renderer.requireDepthSort) {
                resort = true;
                renderer.requireDepthSort = false;
            }
            renderer.render(delta, gl, this.spriteBatch);
        }
        this.spriteBatch.flush();
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

    private resize() {
        const gl = this.gl;
        const ratio = window.devicePixelRatio || 1;
        const canvas = gl.canvas;
        const width = Math.floor(canvas.clientWidth * ratio);
        const height = Math.floor(canvas.clientHeight * ratio);
        if (canvas.width !== width || canvas.height !== height) {
            canvas.width = width;
            canvas.height = height;
            const resolutionLocation = gl.getUniformLocation(this.shaderProgram, 'u_resolution');
            gl.uniform2f(resolutionLocation, width, height);
        }
    }
}
