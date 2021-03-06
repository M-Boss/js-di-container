/**
 * Created by guy on 7/27/18.
 */

let assert = require('assert');
let should = require('chai').should();
let {Container} = require('../index');


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
            service.should.be.an.instanceOf(Test);
        })
    });


    describe('get()', function(){
        it('should return an instance using the factory', function(){
            container.registerFactory('test', function(){
                return new Test();
            });
            let service = container.get('test');
            service.should.be.an.instanceOf(Test)
        })
    });


    describe('get()', function(){
        it('should throw for unregistered services', function(){

            function gettingUnregisteredService(){
                container.get('UnregisteredService')
            }
            gettingUnregisteredService.should.throw();
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

            function gettingService(){
                container.get('service');
            }

            gettingService.should.not.throw();
        })
    });


    describe('get()', function(){
        it('should inject class sub-dependencies', function(){
            container.registerClass('dep1', Dep1);
            container.registerClass('dep2', Dep2);

            let dep1 = container.get('dep1');
            let dep2 = container.get('dep2');

            dep2.dep1.should.equal(dep1);
        })
    });


    describe('get()', function(){
        it('should return the same service object for two calls with the same name for a singleton service', function(){
            container.registerClass('service', Dep1);
            let d1 = container.get('service');
            let d2 = container.get('service');

            d1.should.equal(d2);
        })
    });


    describe('get()', function(){
        it('should return different service object for two calls with the same name for a non-singleton service', function(){
            container.registerClass('service', Dep1, {singleton: false});
            let d1 = container.get('service');
            let d2 = container.get('service');
            d1.should.not.equal(d2);
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

            function gettingDep1(){
                container.get('dep1');
            }
            gettingDep1.should.throw(Container.CircularDependencyError);
        })
    });
});