/**
 * Created by guy on 7/27/18.
 */

let assert = require('assert');
let {Container} = require('../index')


describe('Container', function(){

    let container = null;
    class Test{}
    class Dep1{}
    class Dep2{
        constructor(dep1){
            this.dep1 = dep1;
        }
    }

    beforeEach(function(){
        container = new Container();
    });



    describe('get()', function(){
        it('should return an instance of the registered service', function(){
            container.registerClass('test', Test);
            let service = container.get('test');
            assert(service instanceof Test)
        })
    });


    describe('get()', function(){
        it('should return an instance using the factory', function(){
            container.registerFactory('test', function(){
                return new Test();
            });
            let service = container.get('test');
            assert(service instanceof Test)
        })
    });


    describe('get()', function(){
        it('should throw for unregistered services', function(){
            assert.throws(function(){
                container.get('UnregisteredService')
            })
        })
    });


    describe('get()', function(){
        it('should inject factory sub-dependencies', function(){
            function fac(container, dep1, dep2){
                if(!dep1 || !dep2) throw new Error("Dependencies not injected");

                if(!(dep1 instanceof Dep1)) throw new Error("Incorrect dependency injected")
                if(!(dep2 instanceof Dep2)) throw new Error("Incorrect dependency injected")
                return {}
            }
            container.registerClass('dep1', Dep1);
            container.registerClass('dep2', Dep2);
            container.registerFactory('service', fac);
            let service = container.get('service');
        })
    });


    describe('get()', function(){
        it('should inject class sub-dependencies', function(){
            container.registerClass('dep1', Dep1);
            container.registerClass('dep2', Dep2);

            let dep1 = container.get('dep1');
            let dep2 = container.get('dep2');
            assert(dep2.dep1 === dep1)
        })
    });


    describe('get()', function(){
        it('should return the same service object for two calls with the same name for a singleton service', function(){
            container.registerClass('service', Dep1);
            let d1 = container.get('service');
            let d2 = container.get('service');
            assert(d1 === d2)
        })
    });


    describe('get()', function(){
        it('should return different service object for two calls with the same name for a non-singleton service', function(){
            container.registerClass('service', Dep1, {singleton: false});
            let d1 = container.get('service');
            let d2 = container.get('service');
            assert(d1 !== d2)
        })
    });


    describe('get()', function(){
        it('should detect circular dependencies (in auto-injection cases) and throw', function(){
            class Dep1{
                constructor(dep2){}
            }
            class Dep2{
                constructor(dep1){}
            }

            container.registerClass('dep1', Dep1);
            container.registerClass('dep2', Dep2);

            assert.throws(function(){
                container.get('dep1');
            }, Container.CircularDependencyError);
        })
    });
});