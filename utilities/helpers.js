/**
 * Created by guy on 8/4/18.
 */



/**
 * used to extract function parameter names
 * @returns array of strings
 */
exports.getFunctionParamNames  = function(func){
    const ARGUMENT_NAMES = /([^\s,]+)/g;
    let fnStr = stripComments(func.toString());
    let result = fnStr.slice(fnStr.indexOf('(') + 1, fnStr.indexOf(')')).match(ARGUMENT_NAMES);
    if (result === null)
        result = [];
    return result;
};


/**
 * extract constructor parameter names (if one exists) from a class
 * @returns array of strings
 */
exports.getConstructorParamNames = function(cls){
    const ARGUMENT_NAMES = /([^\s,]+)/g;
    let fnStr =  stripComments(cls.toString());
    let constructorIndex = fnStr.search(/constructor[\s]*\(/);
    if(constructorIndex === -1) return [];
    let result = fnStr.slice(fnStr.indexOf('(', constructorIndex) + 1, fnStr.indexOf(')', constructorIndex)).match(ARGUMENT_NAMES);
    if (result === null)
        result = [];
    return result;
};


stripComments = function(string){
    const STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;
    return string.replace(STRIP_COMMENTS, '');
};