define([], function() {
    /**
     * extend() is a method for extending JavaScript objects
     *
     * See http://oranlooney.com/classes-and-objects-javascript/
     */

    /**
     * A temporary intermediary class.
     */
    function Clone() { }

    function clone(obj) {
        Clone.prototype = obj;
        return new Clone();
    }

    // Pass in the subclass constructor, superclass constructor,
    // and an Object of methods/static properties to
    // add to the subclass.  The function correctly sets up
    // subclass.prototype.
    function extend(subclass, superclass) {

        //Get an object, itself empty, whose prototype is the superclass prototype
        subclass.prototype = clone(superclass.prototype);

        //Make sure the subclass constructor is set to the proper class
        subclass.prototype.constructor = subclass;

    }
    return extend;
});