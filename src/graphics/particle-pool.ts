import Particle from './particle';
import Entity from '../entity';
export default class ParticlePool {
	public static pool:{[id:string]:ParticlePool} = {};
	public static createPool<T extends Particle>(particleType:{ new (...args:any[]):T}, count:number) {
		if (this.pool[particleType.name]) {
			return this.pool[particleType.name];
		}
		const pool = new ParticlePool();
		pool._setParticleType(particleType);
		pool._fillPool(count);
		this.pool[particleType.name] = pool;
		return pool;
	}
	protected _particleConstructor:{new (...args:any[]):Particle};
	protected _particles:Particle[];
	constructor() {
		this._particles = new Array<Particle>();
	}

	public requestParticle(entity: Entity):Particle {
		const p = this._particles.shift();
		if (!p) {
			return new this._particleConstructor(entity);
		}
		return p;
	}
	public poolParticle(p:Particle) {
		this._particles.push(p);
	}

	protected _setParticleType<T extends Particle>(particleType:{ new (...args:any[]):T}) {
		this._particleConstructor = particleType;
	}

	protected _fillPool(count:number) {
		for(let i = 0; i < count; ++i) {
			this._particles.push(new this._particleConstructor());
		}
	}
}
