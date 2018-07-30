# js-di-container
A simple yet adequately powerful dependency injection container to help implement IoC in Javascript.
It supports registering/binding:
- classes
- function constructors
- factory functions

Auto sub-dependency resolution is supported.
Services can be resolved as singletons or new instances each time they are requested.

## Installation
```javascript
npm install --save js-di-container
```


## Examples
Simple service registeration using classes and a factory function:
```javascript
class Redis {
}
let ConfigClass = function(){
  this.field = 'something'
}
function databaseFactory(container){
  class DB{}
  return new DB();
}

let container = new Container();
container.registerClass('cache', Redis);
container.registerClass('cacheNonSingleton', Redis, {singleton: false});
container.registerClass('config', ConfigClass);
container.registerFactory('db', databaseFactory);
//somewhere in your code
let redis = container.get('cache')
```
  
  
  
Automatic sub-dependency resolution from function/constructor parameter names.You can list service dependencies by their names as parameters of class constructor or factory function and they will be resolved automatically for you:
```javascript
class UserRepository {
  constructor(store){ //can have more than one dependency
    this.dataStore = store;
  }
}
class Database {}
let container = new Container()
container.registerClass('store', Database);
container.registerClass('users', UserRepository);
let usersRepo = container.get('users'); //store sub-dependency will be injected automatically
```
  
  
  
Also note that factory functions that are passed to 'registerFactory' method receive the container object as their first argument along with other dependencies listed as parameters to the factory function after the first argument (i.e. container; the name doesn't matter for the first parameter):
```javascript
class Time {}
class Logger {}
let config = {key: 'secret'}

function loggerFactory(container, time){
 return new Logger(time, config.key)
}

let container = new Container();
container.registerClass('timer', Time);
container.registerFactory('logger', loggerFactory, {singleton: false})
let newLogger = container.get('logger') 
 ```


