/*global
YAHOO
*/

(function () {

    YAHOO.namespace("com.aviarc.framework.toronto.widget.core.v2_5_0");
    var Toronto = YAHOO.com.aviarc.framework.toronto;

    /**
    * @module toronto.widget
    * @class Image
    */
    Toronto.widget.core.v2_5_0.Image = function () {
        this.onClick = new Toronto.client.Event();

    };

    YAHOO.lang.extend(Toronto.widget.core.v2_5_0.Image, Toronto.framework.DefaultWidgetImpl, {

        startup: function (widgetContext) {
            Toronto.widget.core.v2_5_0.Image.superclass.startup.apply(this, arguments);
            
            if (parseBoolean(this.getAttribute("enabled"))) {
                var container = this.getContainerElement();
                var clickedEvent = widgetContext.createManagedEvent();
                container.onclick = clickedEvent.makeDOMEventFunction({
                        returnValue: false
                    });
                
                clickedEvent.bindHandler(this._click, this);
            }
        },
        
        getContainerElement : function() {
            return this.getNamedElement("img");
        },
        
        _click : function() {
            var action = this.getAttribute('action');
            
            // fire onclick if validation has succeeded
            this.onClick.fireEvent({
                widget: this,
                action: action
            });

            // If there is an action, lets hit it.
            if (!YAHOO.lang.isUndefined(action)) {
                // console.log(this.getWidgetID() + ": performing action '" + action + "'");
                this.getWidgetContext().getSystem().submitScreen({
                    action: action
                });
            }        
        }
    });

})();
