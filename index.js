/**
 * Created by guy on 7/27/18.
 */

let {
    getFunctionParamNames,
    getConstructorParamNames,
    stripComments
} = require('./utilities/helpers');



/**
 * This is a simple yet adequately powerful service container used for
 * dependency injection.It supports registering/binding:
 * - classes
 * - function constructors
 * - factory function
 * Auto sub-dependency resolution is supported.
 * Services can be resolved as singletons or
 * new instances each time they are requested.
 *
 *
 * sample #1:
 * class Redis {}
 * let container = new Container();
 * container.registerClass('cache', Redis);
 * //somewhere in your code
 * let redis = container.get('cache')
 *
 *
 *
 * sample #2:
 * class UserRepository {
 *  constructor(store){
 *      this.dataStore = store;
 *  }
 * }
 * class Database {}
 * let container = new Container()
 * container.registerClass('store', Database);
 * container.registerClass('users', UserRepository);
 * let usersRepo = container.get('users'); //store sub-dependency will be injected automatically
 *
 *
 *
 * sample #3:
 * class Time {...}
 * class Logger {...}
 * let config = {key: 'secret'}
 * function loggerFactory(container, time){
 *  return new Logger(time, config.key)
 * }
 * let container = new Container();
 * container.registerFactory('logger', loggerFactory, {singleton: false})
 * container.registerClass('timer', Time)
 * let newLogger = container.get('logger')
 */
class Container {
    

    constructor() {
        this.providers = {}; //contains wrapped classes or factory functions
        this.container = {}; //instances of singleton services
        this.defaultProviderOptions = {
            singleton: true
        };
        this.lockedServices = {}; //used to detect circular-dep
    }


    /**
     * public method, use this to bind a class to a name.
     * service can be either singleton or not one.use the "options" param
     * to specify if the service should be a singleton (defaults to singleton)
     * @param name: name of the service.will be used in the "get" method or
     * auto-injection cases to resolve the service.
     * @param service: a class (function constructors are also accepted here)
     * @param options: custom options to override the default options.check constructor.
     * @returns {*}
     */
    registerClass(name, service, options = {}) {
        return this.addProvider(name, service, "class", options)
    }


    /**
     * public method, use this to bind a factory function to a name.
     * service can be either singleton or not one.use the "options" param
     * to specify if the service should be a singleton (defaults to singleton)
     * @param name: name of the service.will be used in the "get" method or
     * auto-injection cases to resolve the service.
     * @param factory: a function that returns an instance of the service
     * @param options: custom options to override the default options.check constructor.
     * @returns {*}
     */
    registerFactory(name, factory, options = {}) {
        return this.addProvider(name, factory, "factory", options)
    }


    /**
     * private method: wraps the service class/factory in an object (provider) and stores it.
     */
    addProvider(name, service, type, options){
        this.providers[name] = Object.assign({service, type, name}, this.defaultProviderOptions, options);
        return true;
    }


    /**
     * resolve a service taking care of its sub-dependencies as well.
     * @throws Container.CircularDependencyError in case it detects a circular dependency
     * @param name: name of the service that was registered before
     * @returns {*}
     */
    get(name) {
        if (this.container[name]) {
            return this.container[name]
        }

        let provider = this.getProvider(name);
        let subDependenciesArray = this.getSubDependencies(provider);
        let instance = this.instantiate(provider, subDependenciesArray);

        if(provider.singleton) this.container[name] = instance;
        return instance;
    }


    /**
     * private, gets a provider (wrapped services) from the underlying data structure and throws
     * if it's not registered
     * @param name provider name
     * @throws Error
     * @returns {*}
     */
    getProvider(name) {
        let provider = this.providers[name];
        if (!provider) {
            throw new Error("Provider not registered: " + name)
        }
        return provider;
    }


    /**
     * private, gets dependencies of a service
     * @param provider
     * @returns Array of service instances
     */
    getSubDependencies(provider) {

        //mechanism to detect circular dependency
        this.lockProvider(provider.name);

        try {
            let dependenciesNames = this.getSubDependenciesNames(provider);
            var dependencies = dependenciesNames.map(serviceName => {
                return this.get(serviceName)
            });
        }
        catch (e){
            throw e
        }
        finally {
            //mechanism to detect circular dependency
            this.unlockProvider(provider.name)
        }

        return dependencies;
    }


    /**
     * private, used by 'getSubDependencies' method to get a list of dependency names
     * which are extracted from factory function parameters or class constructor or function constructor
     * @param provider
     * @returns Array of service names(strings)
     */
    getSubDependenciesNames(provider){

        let dependenciesNames = [];
        if (provider.type === 'factory') {
            dependenciesNames = getFunctionParamNames(provider.service);
            //first argument to factory functions is the container itself
            if (dependenciesNames.length > 0) dependenciesNames = dependenciesNames.slice(1)
        }
        else if (provider.type === 'class') {
            //check if class constructor is a direct function or es6 class keyword
            let classCode = provider.service.toString();
            //console.log("Code for provider: ", provider, classCode);
            if (classCode.startsWith("class")) {
                dependenciesNames = getConstructorParamNames(provider.service)
            }
            else {
                dependenciesNames = getFunctionParamNames(provider.service)
            }
        }
        return dependenciesNames;
    }


    /**
     * private, used to detect circular dependencies
     */
    lockProvider(name){
        if(this.lockedServices[name] === true){
            throw new this.constructor.CircularDependencyError("service: " + name);
        }
        this.lockedServices[name] = true;
    }

    /**
     * private, used to detect circular dependencies
     */
    unlockProvider(name){
        this.lockedServices[name] = false;
    }


    /**
     * instantiates an instance using by calling a factory function or
     * creating an instance of class and passing the dependencies.
     * @param provider of the service to be created
     * @param subDependenciesArray
     * @returns {*} an instance of the service
     */
    instantiate(provider, subDependenciesArray) {

        //console.log("instantiating provider: ", provider, "with deps: ", subDependenciesArray)
        let instance = null;
        if (provider.type === 'class') {
            instance = new provider.service(...subDependenciesArray)
        }
        else { //factory
            instance = provider.service(this, ...subDependenciesArray)
        }
        return instance;
    }
}


Container.CircularDependencyError = class extends Error{

};


exports.Container = Container;