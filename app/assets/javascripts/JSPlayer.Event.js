(function() {
    "use strict";

    function event() {
        this.nextHandlerID = 1;
        this.handlers = []; 
    }

    function addHandler(handler) {
        var handlerID = this.nextHandlerID;
        this.nextHandlerID += 1;
        this.handlers.push({ method: handler, id: handlerID });
        return handlerID;
    }

    function removeHandler(handlerID) {
        for (var i = 0; i < this.handlers.length; i++) {
            if (this.handlers[i].id == handlerID) {
                this.handlers.removeAt(i);
                break;
            }
        }
    }

    function trigger() {
        for (var i = 0; i < this.handlers.length; i++) {
            this.handlers[i].method.apply(null, arguments);
        }
    }

    event.prototype = {
        addHandler: addHandler,
        removeHandler: removeHandler,
        trigger: trigger
    };

    JSPlayer.event = event;
})();
